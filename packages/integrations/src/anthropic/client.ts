/**
 * Anthropic Claude API Client
 * https://docs.anthropic.com/en/api
 */

import { type Result, ok, fail, type ClientConfig } from '../types.js'
import type {
  CreateMessageParams,
  MessageResponse,
  CountTokensParams,
  TokenCountResponse,
  ModelsResponse,
  CreateBatchParams,
  BatchResponse,
  BatchListResponse,
} from './types.js'

export interface AnthropicClientConfig extends ClientConfig {
  apiKey: string
  baseUrl?: string
}

export class AnthropicClient {
  private apiKey: string
  private baseUrl: string
  private timeout: number
  private fetchFn: typeof fetch

  constructor(config: AnthropicClientConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? 'https://api.anthropic.com/v1'
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
        'anthropic-version': '2023-06-01',
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
          'ANTHROPIC_API_ERROR',
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
  // Messages
  // ============================================================================

  async createMessage(params: CreateMessageParams): Promise<Result<MessageResponse>> {
    return this.request<MessageResponse>('/messages', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  // ============================================================================
  // Token Counting
  // ============================================================================

  async countTokens(params: CountTokensParams): Promise<Result<TokenCountResponse>> {
    return this.request<TokenCountResponse>('/messages/count_tokens', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  // ============================================================================
  // Models
  // ============================================================================

  async listModels(limit = 20): Promise<Result<ModelsResponse>> {
    return this.request<ModelsResponse>(`/models?limit=${limit}`)
  }

  // ============================================================================
  // Message Batches
  // ============================================================================

  async createBatch(params: CreateBatchParams): Promise<Result<BatchResponse>> {
    return this.request<BatchResponse>('/messages/batches', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async getBatch(batchId: string): Promise<Result<BatchResponse>> {
    return this.request<BatchResponse>(`/messages/batches/${batchId}`)
  }

  async listBatches(limit = 20): Promise<Result<BatchListResponse>> {
    return this.request<BatchListResponse>(`/messages/batches?limit=${limit}`)
  }

  async cancelBatch(batchId: string): Promise<Result<BatchResponse>> {
    return this.request<BatchResponse>(`/messages/batches/${batchId}/cancel`, {
      method: 'POST',
    })
  }
}
