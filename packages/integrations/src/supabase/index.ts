/**
 * Supabase Integration
 *
 * Exports client, tools, and types for Supabase database operations.
 */

export { SupabaseClient, type SupabaseClientConfig } from './client.js'
export { createSupabaseTools, type SupabaseTools } from './tools.js'
export {
  ListTablesInputSchema,
  GetSchemaInputSchema,
  QueryInputSchema,
} from './tools.js'
export type {
  TableInfo,
  ColumnInfo,
  ListTablesResponse,
  GetSchemaResponse,
  QueryResponse,
  ListTablesParams,
  GetSchemaParams,
  QueryParams,
} from './types.js'
