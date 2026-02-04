// @ts-nocheck
/**
 * Zapier NLA (Natural Language Actions) API Client
 * https://nla.zapier.com/docs
 */

import { type Result, ok, fail, type ClientConfig } from '../types.js'
import type {
  Action,
  ActionsResponse,
  ExecuteActionParams,
  ExecuteActionResponse,
  ExecutionLogEntry,
} from './types.js'

export interface ZapierClientConfig extends ClientConfig {
  apiKey: string
  baseUrl?: string
}

export class ZapierClient {
  private apiKey: string
  private baseUrl: string
  private timeout: number
  private fetchFn: typeof fetch

  constructor(config: ZapierClientConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? 'https://nla.zapier.com/api/v1'
    this.timeout = config.timeout ?? 60000
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
        'x-api-key': this.apiKey,
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
          'ZAPIER_API_ERROR',
          error.error || error.message || `HTTP ${response.status}`,
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
  // Actions (NLA)
  // ============================================================================

  async listActions(): Promise<Result<ActionsResponse>> {
    return this.request<ActionsResponse>('/exposed/')
  }

  async getAction(actionId: string): Promise<Result<Action>> {
    return this.request<Action>(`/exposed/${actionId}/`)
  }

  async executeAction(params: ExecuteActionParams): Promise<Result<ExecuteActionResponse>> {
    return this.request<ExecuteActionResponse>(`/exposed/${params.actionId}/execute/`, {
      method: 'POST',
      body: JSON.stringify({
        instructions: params.instructions,
        ...(params.params && Object.keys(params.params).length > 0
          ? params.params
          : {}),
        preview_only: params.preview_only ?? false,
      }),
    })
  }

  // ============================================================================
  // Execution Log
  // ============================================================================

  async getExecutionLog(executionId: string): Promise<Result<ExecutionLogEntry>> {
    return this.request<ExecutionLogEntry>(`/execution-log/${executionId}/`)
  }
}
