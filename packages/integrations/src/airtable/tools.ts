/**
 * Airtable AI SDK Tools
 * MCP-compatible tools for Airtable database operations
 */

import { tool } from 'ai'
import { AirtableClient } from './client.js'
import {
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
} from './types.js'

export function createAirtableTools(client: AirtableClient) {
  return {
    // ========================================================================
    // Bases
    // ========================================================================
    airtable_list_bases: tool({
      description: 'List all Airtable bases accessible with the current API key.',
      inputSchema: ListBasesInputSchema,
      execute: async (params) => {
        const result = await client.listBases(params.offset)
        if (!result.success) throw new Error(result.error.message)

        return {
          count: result.data.bases.length,
          bases: result.data.bases.map((b) => ({
            id: b.id,
            name: b.name,
            permission: b.permissionLevel,
          })),
          hasMore: !!result.data.offset,
          offset: result.data.offset,
        }
      },
    }),

    airtable_get_base: tool({
      description: 'Get the schema (tables and fields) of an Airtable base.',
      inputSchema: GetBaseSchemaInputSchema,
      execute: async (params) => {
        const result = await client.getBaseSchema(params.baseId)
        if (!result.success) throw new Error(result.error.message)

        return {
          tables: result.data.tables.map((t) => ({
            id: t.id,
            name: t.name,
            fields: t.fields.map((f) => ({
              id: f.id,
              name: f.name,
              type: f.type,
              description: f.description,
            })),
            views: t.views.map((v) => ({
              id: v.id,
              name: v.name,
              type: v.type,
            })),
          })),
        }
      },
    }),

    // ========================================================================
    // Records
    // ========================================================================
    airtable_list_records: tool({
      description:
        'List records from an Airtable table. Supports filtering, sorting, and field selection.',
      inputSchema: ListRecordsInputSchema,
      execute: async (params) => {
        const result = await client.listRecords({
          baseId: params.baseId,
          tableId: params.tableId,
          fields: params.fields,
          filterByFormula: params.filterByFormula,
          maxRecords: params.maxRecords,
          view: params.view,
        })
        if (!result.success) throw new Error(result.error.message)

        return {
          count: result.data.records.length,
          records: result.data.records.map((r) => ({
            id: r.id,
            createdTime: r.createdTime,
            fields: r.fields,
          })),
          hasMore: !!result.data.offset,
          offset: result.data.offset,
        }
      },
    }),

    airtable_get_record: tool({
      description: 'Get a single record by ID from an Airtable table.',
      inputSchema: GetRecordInputSchema,
      execute: async (params) => {
        const result = await client.getRecord(params.baseId, params.tableId, params.recordId)
        if (!result.success) throw new Error(result.error.message)

        return {
          id: result.data.id,
          createdTime: result.data.createdTime,
          fields: result.data.fields,
        }
      },
    }),

    airtable_create_record: tool({
      description: 'Create a new record in an Airtable table.',
      inputSchema: CreateRecordInputSchema,
      execute: async (params) => {
        const result = await client.createRecord({
          baseId: params.baseId,
          tableId: params.tableId,
          fields: params.fields,
          typecast: params.typecast,
        })
        if (!result.success) throw new Error(result.error.message)

        return {
          id: result.data.id,
          createdTime: result.data.createdTime,
          fields: result.data.fields,
        }
      },
    }),

    airtable_update_record: tool({
      description: 'Update an existing record in an Airtable table.',
      inputSchema: UpdateRecordInputSchema,
      execute: async (params) => {
        const result = await client.updateRecord({
          baseId: params.baseId,
          tableId: params.tableId,
          recordId: params.recordId,
          fields: params.fields,
          typecast: params.typecast,
        })
        if (!result.success) throw new Error(result.error.message)

        return {
          id: result.data.id,
          fields: result.data.fields,
        }
      },
    }),

    airtable_delete_record: tool({
      description: 'Delete a record from an Airtable table.',
      inputSchema: DeleteRecordInputSchema,
      execute: async (params) => {
        const result = await client.deleteRecord(params.baseId, params.tableId, params.recordId)
        if (!result.success) throw new Error(result.error.message)

        return {
          id: result.data.id,
          deleted: result.data.deleted,
        }
      },
    }),

    // ========================================================================
    // Batch Operations
    // ========================================================================
    airtable_create_records: tool({
      description: 'Create multiple records in an Airtable table (max 10 per request).',
      inputSchema: CreateRecordsInputSchema,
      execute: async (params) => {
        const result = await client.createRecords({
          baseId: params.baseId,
          tableId: params.tableId,
          records: params.records,
          typecast: params.typecast,
        })
        if (!result.success) throw new Error(result.error.message)

        return {
          created: result.data.records.length,
          records: result.data.records.map((r) => ({
            id: r.id,
            fields: r.fields,
          })),
        }
      },
    }),

    airtable_update_records: tool({
      description: 'Update multiple records in an Airtable table (max 10 per request).',
      inputSchema: UpdateRecordsInputSchema,
      execute: async (params) => {
        const result = await client.updateRecords({
          baseId: params.baseId,
          tableId: params.tableId,
          records: params.records,
          typecast: params.typecast,
        })
        if (!result.success) throw new Error(result.error.message)

        return {
          updated: result.data.records.length,
          records: result.data.records.map((r) => ({
            id: r.id,
            fields: r.fields,
          })),
        }
      },
    }),

    // ========================================================================
    // Comments
    // ========================================================================
    airtable_list_comments: tool({
      description: 'List comments on an Airtable record.',
      inputSchema: ListCommentsInputSchema,
      execute: async (params) => {
        const result = await client.listComments(params.baseId, params.tableId, params.recordId)
        if (!result.success) throw new Error(result.error.message)

        return {
          count: result.data.comments.length,
          comments: result.data.comments.map((c) => ({
            id: c.id,
            author: c.author.name,
            text: c.text,
            createdTime: c.createdTime,
          })),
        }
      },
    }),
  }
}

export type AirtableTools = ReturnType<typeof createAirtableTools>
