/**
 * Airtable Integration
 *
 * @example
 * ```typescript
 * import { AirtableClient, createAirtableTools } from '@trendingsociety/integrations/airtable'
 *
 * const client = new AirtableClient({ apiKey: process.env.AIRTABLE_API_KEY })
 * const tools = createAirtableTools(client)
 *
 * // List records from a table
 * const result = await tools.airtable_list_records.execute({
 *   baseId: 'appXXXXXXXXXXXXXX',
 *   tableId: 'Tasks',
 *   maxRecords: 10,
 * })
 * ```
 */

export { AirtableClient, type AirtableClientConfig } from './client.js'
export { createAirtableTools, type AirtableTools } from './tools.js'
export {
  // Schemas
  ListBasesInputSchema,
  GetBaseSchemaInputSchema,
  ListRecordsInputSchema,
  GetRecordInputSchema,
  CreateRecordInputSchema,
  UpdateRecordInputSchema,
  DeleteRecordInputSchema,
  CreateRecordsInputSchema,
  UpdateRecordsInputSchema,
  ListCommentsInputSchema,
  // Types
  type AirtableConfig,
  type Base,
  type BasesResponse,
  type BaseSchema,
  type Table,
  type Field,
  type View,
  type AirtableRecord,
  type RecordFields,
  type RecordsResponse,
  type ListRecordsParams,
  type CreateRecordParams,
  type UpdateRecordParams,
  type Comment,
  type CommentsResponse,
} from './types.js'
