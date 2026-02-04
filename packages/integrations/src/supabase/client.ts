/**
 * Supabase Client
 *
 * Runtime-agnostic client for Supabase database operations.
 * Works in Node.js, Edge runtimes, and Cloudflare Workers.
 *
 * Uses custom RPC functions for database introspection:
 * - get_tables: List tables in a schema
 * - get_table_schema: Get columns for a table
 * - execute_sql: Execute read-only SQL queries
 *
 * @example
 * import { SupabaseClient } from '@trendingsociety/integrations/supabase'
 *
 * const supabase = new SupabaseClient({
 *   url: process.env.SUPABASE_URL,
 *   serviceKey: process.env.SUPABASE_SERVICE_KEY,
 * })
 *
 * // List tables
 * const tables = await supabase.listTables({ schema: 'public' })
 *
 * // Get schema for a table
 * const schema = await supabase.getSchema({ table: 'users' })
 *
 * // Execute a query
 * const result = await supabase.query({ query: 'SELECT * FROM users LIMIT 10' })
 */

import { API } from '../config/constants'
import { ok, fail, type Result, type ClientConfig } from '../types.js'
import type {
  ListTablesParams,
  ListTablesResponse,
  GetSchemaParams,
  GetSchemaResponse,
  QueryParams,
  QueryResponse,
} from './types.js'

// ============================================================================
// Configuration
// ============================================================================

export interface SupabaseClientConfig extends ClientConfig {
  /** Supabase project URL */
  url: string
  /** Service role key (has full access) */
  serviceKey: string
}

// ============================================================================
// Client Implementation
// ============================================================================

export class SupabaseClient {
  private url: string
  private serviceKey: string
  private timeout: number
  private fetchFn: typeof fetch
  private debug: boolean

  constructor(config: SupabaseClientConfig) {
    if (!config.url) {
      throw new Error('SupabaseClient requires url')
    }
    if (!config.serviceKey) {
      throw new Error('SupabaseClient requires serviceKey')
    }

    this.url = config.url
    this.serviceKey = config.serviceKey
    this.timeout = config.timeout ?? API.defaultTimeout
    // Bind fetch to globalThis to avoid "Illegal invocation" in Cloudflare Workers
    this.fetchFn = config.fetch ?? fetch.bind(globalThis)
    this.debug = config.debug ?? false
  }

  // --------------------------------------------------------------------------
  // List Tables
  // --------------------------------------------------------------------------

  /**
   * List all tables in a database schema
   */
  async listTables(params: ListTablesParams = {}): Promise<Result<ListTablesResponse>> {
    const schema = params.schema || 'public'

    if (this.debug) {
      console.log('[SupabaseClient] Listing tables in schema:', schema)
    }

    const result = await this.rpc<unknown[]>('get_tables', { target_schema: schema })

    if (!result.success) {
      return result as Result<ListTablesResponse>
    }

    return ok({
      schema,
      tables: result.data as ListTablesResponse['tables'],
    })
  }

  // --------------------------------------------------------------------------
  // Get Schema
  // --------------------------------------------------------------------------

  /**
   * Get schema/columns for a specific table
   */
  async getSchema(params: GetSchemaParams): Promise<Result<GetSchemaResponse>> {
    if (!params.table) {
      return fail('INVALID_PARAMS', 'Table name is required')
    }

    const schema = params.schema || 'public'

    if (this.debug) {
      console.log('[SupabaseClient] Getting schema for:', `${schema}.${params.table}`)
    }

    const result = await this.rpc<unknown[]>('get_table_schema', {
      target_schema: schema,
      target_table: params.table,
    })

    if (!result.success) {
      return result as Result<GetSchemaResponse>
    }

    return ok({
      schema,
      table: params.table,
      columns: result.data as GetSchemaResponse['columns'],
    })
  }

  // --------------------------------------------------------------------------
  // Query
  // --------------------------------------------------------------------------

  /**
   * Execute a read-only SQL query
   */
  async query(params: QueryParams): Promise<Result<QueryResponse>> {
    if (!params.query) {
      return fail('INVALID_PARAMS', 'Query is required')
    }

    // Validate query is read-only
    const normalizedQuery = params.query.trim().toUpperCase()
    if (!normalizedQuery.startsWith('SELECT')) {
      return fail('NOT_SELECT', 'Only SELECT queries are allowed for safety')
    }

    // Check for dangerous keywords
    const dangerousKeywords = [
      'DROP',
      'DELETE',
      'TRUNCATE',
      'UPDATE',
      'INSERT',
      'ALTER',
      'CREATE',
      'GRANT',
    ]
    for (const keyword of dangerousKeywords) {
      if (normalizedQuery.includes(keyword)) {
        return fail('DANGEROUS_KEYWORD', `Query contains forbidden keyword: ${keyword}`)
      }
    }

    const limit = params.limit || 100

    if (this.debug) {
      console.log('[SupabaseClient] Executing query:', params.query)
    }

    const result = await this.rpc<Record<string, unknown>[]>('execute_sql', {
      query_text: params.query,
      row_limit: limit,
    })

    if (!result.success) {
      return result as Result<QueryResponse>
    }

    return ok({
      query: params.query,
      rowCount: Array.isArray(result.data) ? result.data.length : 0,
      results: result.data,
    })
  }

  // --------------------------------------------------------------------------
  // Internal RPC Handler
  // --------------------------------------------------------------------------

  private async rpc<T>(functionName: string, params: Record<string, unknown>): Promise<Result<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await this.fetchFn(`${this.url}/rest/v1/rpc/${functionName}`, {
        method: 'POST',
        headers: {
          apikey: this.serviceKey,
          Authorization: `Bearer ${this.serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()

        // Try to parse error JSON
        try {
          const errorJson = JSON.parse(errorText)
          return fail(
            errorJson.code || 'RPC_ERROR',
            errorJson.message || `RPC ${functionName} failed (${response.status})`,
            response.status
          )
        } catch {
          return fail(
            'RPC_ERROR',
            `RPC ${functionName} failed (${response.status}): ${errorText}`,
            response.status
          )
        }
      }

      const data = (await response.json()) as T

      if (this.debug) {
        console.log('[SupabaseClient] RPC response:', JSON.stringify(data, null, 2))
      }

      return ok(data)
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return fail('TIMEOUT', `Request timed out after ${this.timeout}ms`)
        }
        return fail('NETWORK_ERROR', error.message)
      }

      return fail('UNKNOWN_ERROR', String(error))
    }
  }
}
