/**
 * Supabase Types
 *
 * Type definitions for Supabase database operations.
 */

// ============================================================================
// Table Information
// ============================================================================

export interface TableInfo {
  table_name: string
  table_schema: string
  table_type: string
}

export interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  ordinal_position: number
}

// ============================================================================
// Query Results
// ============================================================================

export interface ListTablesResponse {
  schema: string
  tables: TableInfo[]
}

export interface GetSchemaResponse {
  schema: string
  table: string
  columns: ColumnInfo[]
}

export interface QueryResponse {
  query: string
  rowCount: number
  results: Record<string, unknown>[]
}

// ============================================================================
// Input Parameters
// ============================================================================

export interface ListTablesParams {
  schema?: string
}

export interface GetSchemaParams {
  table: string
  schema?: string
}

export interface QueryParams {
  query: string
  limit?: number
}
