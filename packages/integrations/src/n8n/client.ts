/**
 * N8N API Client
 * https://docs.n8n.io/api/
 */

import { type Result, ok, fail, type ClientConfig } from '../types.js'
import type {
  Workflow,
  WorkflowsResponse,
  Execution,
  ExecutionsResponse,
  CredentialType,
} from './types.js'

export interface N8NClientConfig extends ClientConfig {
  apiKey: string
  baseUrl: string
}

export class N8NClient {
  private apiKey: string
  private baseUrl: string
  private timeout: number
  private fetchFn: typeof fetch

  constructor(config: N8NClientConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl.replace(/\/$/, '') // Remove trailing slash
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
        'X-N8N-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      }

      const response = await this.fetchFn(`${this.baseUrl}/api/v1${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        return fail(
          'N8N_API_ERROR',
          error.message || `HTTP ${response.status}`,
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
  // Workflows
  // ============================================================================

  async listWorkflows(params?: {
    active?: boolean
    tags?: string[]
    limit?: number
    cursor?: string
  }): Promise<Result<WorkflowsResponse>> {
    const searchParams = new URLSearchParams()
    if (params?.active !== undefined) {
      searchParams.set('active', String(params.active))
    }
    if (params?.tags?.length) {
      searchParams.set('tags', params.tags.join(','))
    }
    if (params?.limit) {
      searchParams.set('limit', String(params.limit))
    }
    if (params?.cursor) {
      searchParams.set('cursor', params.cursor)
    }

    const query = searchParams.toString()
    return this.request<WorkflowsResponse>(`/workflows${query ? `?${query}` : ''}`)
  }

  async getWorkflow(workflowId: string): Promise<Result<Workflow>> {
    return this.request<Workflow>(`/workflows/${workflowId}`)
  }

  async executeWorkflow(
    workflowId: string,
    data?: Record<string, unknown>
  ): Promise<Result<{ executionId: string }>> {
    return this.request<{ executionId: string }>(`/workflows/${workflowId}/run`, {
      method: 'POST',
      body: JSON.stringify(data ? { data } : {}),
    })
  }

  async activateWorkflow(workflowId: string): Promise<Result<Workflow>> {
    return this.request<Workflow>(`/workflows/${workflowId}/activate`, {
      method: 'POST',
    })
  }

  async deactivateWorkflow(workflowId: string): Promise<Result<Workflow>> {
    return this.request<Workflow>(`/workflows/${workflowId}/deactivate`, {
      method: 'POST',
    })
  }

  // ============================================================================
  // Executions
  // ============================================================================

  async listExecutions(params?: {
    workflowId?: string
    status?: string
    limit?: number
    cursor?: string
  }): Promise<Result<ExecutionsResponse>> {
    const searchParams = new URLSearchParams()
    if (params?.workflowId) {
      searchParams.set('workflowId', params.workflowId)
    }
    if (params?.status) {
      searchParams.set('status', params.status)
    }
    if (params?.limit) {
      searchParams.set('limit', String(params.limit))
    }
    if (params?.cursor) {
      searchParams.set('cursor', params.cursor)
    }

    const query = searchParams.toString()
    return this.request<ExecutionsResponse>(`/executions${query ? `?${query}` : ''}`)
  }

  async getExecution(
    executionId: string,
    includeData = false
  ): Promise<Result<Execution>> {
    const query = includeData ? '?includeData=true' : ''
    return this.request<Execution>(`/executions/${executionId}${query}`)
  }

  // ============================================================================
  // Credentials
  // ============================================================================

  async listCredentialTypes(): Promise<Result<CredentialType[]>> {
    return this.request<CredentialType[]>('/credential-types')
  }
}
