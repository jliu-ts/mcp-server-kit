/**
 * Airtable API Types
 * https://airtable.com/developers/web/api
 */

import { z } from 'zod'

// ============================================================================
// Configuration
// ============================================================================

export interface AirtableConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
}

// ============================================================================
// Bases
// ============================================================================

export interface Base {
  id: string
  name: string
  permissionLevel: 'none' | 'read' | 'comment' | 'edit' | 'create'
}

export interface BasesResponse {
  bases: Base[]
  offset?: string
}

export interface BaseSchema {
  tables: Table[]
}

export interface Table {
  id: string
  name: string
  primaryFieldId: string
  fields: Field[]
  views: View[]
}

export interface Field {
  id: string
  name: string
  type: string
  description?: string
  options?: globalThis.Record<string, unknown>
}

export interface View {
  id: string
  name: string
  type: string
}

// ============================================================================
// Records
// ============================================================================

export interface AirtableRecord {
  id: string
  createdTime: string
  fields: RecordFields
}

export type RecordFields = globalThis.Record<string, unknown>

export interface RecordsResponse {
  records: AirtableRecord[]
  offset?: string
}

export interface ListRecordsParams {
  baseId: string
  tableId: string
  fields?: string[]
  filterByFormula?: string
  maxRecords?: number
  pageSize?: number
  sort?: Array<{ field: string; direction?: 'asc' | 'desc' }>
  view?: string
  offset?: string
}

export interface CreateRecordParams {
  baseId: string
  tableId: string
  fields: RecordFields
  typecast?: boolean
}

export interface CreateRecordsParams {
  baseId: string
  tableId: string
  records: Array<{ fields: RecordFields }>
  typecast?: boolean
}

export interface UpdateRecordParams {
  baseId: string
  tableId: string
  recordId: string
  fields: RecordFields
  typecast?: boolean
}

export interface UpdateRecordsParams {
  baseId: string
  tableId: string
  records: Array<{ id: string; fields: RecordFields }>
  typecast?: boolean
}

export interface DeleteRecordParams {
  baseId: string
  tableId: string
  recordId: string
}

export interface DeleteRecordsParams {
  baseId: string
  tableId: string
  recordIds: string[]
}

// ============================================================================
// Comments
// ============================================================================

export interface Comment {
  id: string
  author: {
    id: string
    email: string
    name: string
  }
  text: string
  createdTime: string
  mentioned?: globalThis.Record<string, unknown>
}

export interface CommentsResponse {
  comments: Comment[]
  offset?: string
}

// ============================================================================
// Zod Schemas for Tool Inputs
// ============================================================================

export const ListBasesInputSchema = z.object({
  offset: z.string().optional().describe('Pagination offset'),
})

export const GetBaseSchemaInputSchema = z.object({
  baseId: z.string().describe('Airtable base ID (starts with app)'),
})

export const ListRecordsInputSchema = z.object({
  baseId: z.string().describe('Airtable base ID'),
  tableId: z.string().describe('Table name or ID'),
  fields: z.array(z.string()).optional().describe('Fields to return'),
  filterByFormula: z.string().optional().describe('Airtable formula to filter records'),
  maxRecords: z.number().max(100).default(100).describe('Maximum records to return'),
  view: z.string().optional().describe('View name or ID to filter by'),
})

export const GetRecordInputSchema = z.object({
  baseId: z.string().describe('Airtable base ID'),
  tableId: z.string().describe('Table name or ID'),
  recordId: z.string().describe('Record ID (starts with rec)'),
})

export const CreateRecordInputSchema = z.object({
  baseId: z.string().describe('Airtable base ID'),
  tableId: z.string().describe('Table name or ID'),
  fields: z.record(z.unknown()).describe('Field values as key-value pairs'),
  typecast: z.boolean().default(false).describe('Auto-convert values to match field type'),
})

export const UpdateRecordInputSchema = z.object({
  baseId: z.string().describe('Airtable base ID'),
  tableId: z.string().describe('Table name or ID'),
  recordId: z.string().describe('Record ID to update'),
  fields: z.record(z.unknown()).describe('Field values to update'),
  typecast: z.boolean().default(false).describe('Auto-convert values'),
})

export const DeleteRecordInputSchema = z.object({
  baseId: z.string().describe('Airtable base ID'),
  tableId: z.string().describe('Table name or ID'),
  recordId: z.string().describe('Record ID to delete'),
})

export const CreateRecordsInputSchema = z.object({
  baseId: z.string().describe('Airtable base ID'),
  tableId: z.string().describe('Table name or ID'),
  records: z
    .array(z.object({ fields: z.record(z.unknown()) }))
    .max(10)
    .describe('Array of records (max 10)'),
  typecast: z.boolean().default(false).describe('Auto-convert values'),
})

export const UpdateRecordsInputSchema = z.object({
  baseId: z.string().describe('Airtable base ID'),
  tableId: z.string().describe('Table name or ID'),
  records: z
    .array(z.object({ id: z.string(), fields: z.record(z.unknown()) }))
    .max(10)
    .describe('Array of records with IDs (max 10)'),
  typecast: z.boolean().default(false).describe('Auto-convert values'),
})

export const ListCommentsInputSchema = z.object({
  baseId: z.string().describe('Airtable base ID'),
  tableId: z.string().describe('Table name or ID'),
  recordId: z.string().describe('Record ID'),
})
