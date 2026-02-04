/**
 * Supabase AI SDK Tools
 *
 * AI SDK 6 native tool definitions for Supabase database operations.
 * Single source of truth - used by both MCP server and AI SDK agents.
 *
 * @example
 * import { createSupabaseTools } from '@trendingsociety/integrations/supabase'
 * import { SupabaseClient } from '@trendingsociety/integrations/supabase'
 *
 * const client = new SupabaseClient({
 *   url: process.env.SUPABASE_URL,
 *   serviceKey: process.env.SUPABASE_SERVICE_KEY,
 * })
 * const tools = createSupabaseTools(client)
 */

import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from './client.js'

// ============================================================================
// Input Schemas (Zod)
// ============================================================================

export const ListTablesInputSchema = z.object({
  schema: z
    .string()
    .optional()
    .default('public')
    .describe('Database schema to list tables from (default: public)'),
})

export const GetSchemaInputSchema = z.object({
  table: z.string().describe('Table name to get schema for'),
  schema: z
    .string()
    .optional()
    .default('public')
    .describe('Database schema (default: public)'),
})

export const QueryInputSchema = z.object({
  query: z.string().describe('SELECT query to execute (read-only, no INSERT/UPDATE/DELETE)'),
  limit: z
    .number()
    .optional()
    .default(100)
    .describe('Maximum rows to return (default: 100)'),
})

// ============================================================================
// Tool Factory
// ============================================================================

/**
 * Create AI SDK tools for Supabase database operations
 *
 * @param client - Initialized SupabaseClient instance
 * @returns Object containing all Supabase tools
 */
export function createSupabaseTools(client: SupabaseClient) {
  return {
    supabase_list_tables: tool({
      description:
        'List all tables in a database schema. Returns table names, types, and schemas.',
      inputSchema: ListTablesInputSchema,
      execute: async (params) => {
        const result = await client.listTables(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    supabase_get_schema: tool({
      description:
        'Get the schema/columns for a specific table. Returns column names, data types, nullability, and defaults.',
      inputSchema: GetSchemaInputSchema,
      execute: async (params) => {
        const result = await client.getSchema(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    supabase_query: tool({
      description:
        'Execute a read-only SQL query (SELECT only). Returns query results with row count. Use this to explore data, run reports, or answer questions about the database.',
      inputSchema: QueryInputSchema,
      execute: async (params) => {
        const result = await client.query(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type SupabaseTools = ReturnType<typeof createSupabaseTools>
