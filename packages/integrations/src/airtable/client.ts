/**
 * Airtable API Client
 * https://airtable.com/developers/web/api
 */

import { type Result, ok, fail, type ClientConfig } from '../types.js'
import type {
  BasesResponse,
  BaseSchema,
  AirtableRecord,
  RecordsResponse,
  ListRecordsParams,
  CreateRecordParams,
  CreateRecordsParams,
  UpdateRecordParams,
  UpdateRecordsParams,
  CommentsResponse,
} from './types.js'

export interface AirtableClientConfig extends ClientConfig {
  apiKey: string
  baseUrl?: string
}

export class AirtableClient {
  private apiKey: string
  private baseUrl: string
  private timeout: number
  private fetchFn: typeof fetch

  constructor(config: AirtableClientConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? 'https://api.airtable.com/v0'
    this.timeout = config.timeout ?? 30000
    this.fetchFn = config.fetch ?? fetch.bind(globalThis)
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Result<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      }

      const response = await this.fetchFn(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        return fail(
          'AIRTABLE_API_ERROR',
          error.error?.message || `HTTP ${response.status}`,
          response.status
        )
      }

      const data = await response.json()
      return ok(data as T)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        return fail('TIMEOUT', 'Request timed out', 408)
      }
      return fail(
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  // ============================================================================
  // Bases
  // ============================================================================

  async listBases(offset?: string): Promise<Result<BasesResponse>> {
    const params = offset ? `?offset=${offset}` : ''
    return this.request<BasesResponse>(`/meta/bases${params}`)
  }

  async getBaseSchema(baseId: string): Promise<Result<BaseSchema>> {
    return this.request<BaseSchema>(`/meta/bases/${baseId}/tables`)
  }

  // ============================================================================
  // Records
  // ============================================================================

  async listRecords(params: ListRecordsParams): Promise<Result<RecordsResponse>> {
    const { baseId, tableId, ...query } = params
    const searchParams = new URLSearchParams()

    if (query.fields) {
      query.fields.forEach((f) => searchParams.append('fields[]', f))
    }
    if (query.filterByFormula) {
      searchParams.set('filterByFormula', query.filterByFormula)
    }
    if (query.maxRecords) {
      searchParams.set('maxRecords', String(query.maxRecords))
    }
    if (query.pageSize) {
      searchParams.set('pageSize', String(query.pageSize))
    }
    if (query.view) {
      searchParams.set('view', query.view)
    }
    if (query.offset) {
      searchParams.set('offset', query.offset)
    }
    if (query.sort) {
      query.sort.forEach((s, i) => {
        searchParams.set(`sort[${i}][field]`, s.field)
        if (s.direction) {
          searchParams.set(`sort[${i}][direction]`, s.direction)
        }
      })
    }

    const queryString = searchParams.toString()
    const endpoint = `/${baseId}/${encodeURIComponent(tableId)}${queryString ? `?${queryString}` : ''}`
    return this.request<RecordsResponse>(endpoint)
  }

  async getRecord(baseId: string, tableId: string, recordId: string): Promise<Result<AirtableRecord>> {
    return this.request<AirtableRecord>(`/${baseId}/${encodeURIComponent(tableId)}/${recordId}`)
  }

  async createRecord(params: CreateRecordParams): Promise<Result<AirtableRecord>> {
    const { baseId, tableId, fields, typecast } = params
    return this.request<AirtableRecord>(`/${baseId}/${encodeURIComponent(tableId)}`, {
      method: 'POST',
      body: JSON.stringify({ fields, typecast }),
    })
  }

  async createRecords(params: CreateRecordsParams): Promise<Result<RecordsResponse>> {
    const { baseId, tableId, records, typecast } = params
    return this.request<RecordsResponse>(`/${baseId}/${encodeURIComponent(tableId)}`, {
      method: 'POST',
      body: JSON.stringify({ records, typecast }),
    })
  }

  async updateRecord(params: UpdateRecordParams): Promise<Result<AirtableRecord>> {
    const { baseId, tableId, recordId, fields, typecast } = params
    return this.request<AirtableRecord>(`/${baseId}/${encodeURIComponent(tableId)}/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields, typecast }),
    })
  }

  async updateRecords(params: UpdateRecordsParams): Promise<Result<RecordsResponse>> {
    const { baseId, tableId, records, typecast } = params
    return this.request<RecordsResponse>(`/${baseId}/${encodeURIComponent(tableId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ records, typecast }),
    })
  }

  async deleteRecord(
    baseId: string,
    tableId: string,
    recordId: string
  ): Promise<Result<{ id: string; deleted: boolean }>> {
    return this.request<{ id: string; deleted: boolean }>(
      `/${baseId}/${encodeURIComponent(tableId)}/${recordId}`,
      { method: 'DELETE' }
    )
  }

  async deleteRecords(
    baseId: string,
    tableId: string,
    recordIds: string[]
  ): Promise<Result<{ records: Array<{ id: string; deleted: boolean }> }>> {
    const params = recordIds.map((id) => `records[]=${id}`).join('&')
    return this.request<{ records: Array<{ id: string; deleted: boolean }> }>(
      `/${baseId}/${encodeURIComponent(tableId)}?${params}`,
      { method: 'DELETE' }
    )
  }

  // ============================================================================
  // Comments
  // ============================================================================

  async listComments(
    baseId: string,
    tableId: string,
    recordId: string
  ): Promise<Result<CommentsResponse>> {
    return this.request<CommentsResponse>(
      `/${baseId}/${encodeURIComponent(tableId)}/${recordId}/comments`
    )
  }
}
