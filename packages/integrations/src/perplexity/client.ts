/**
 * Perplexity API Client
 * https://docs.perplexity.ai/reference
 */

import { type Result, ok, fail, type ClientConfig } from '../types.js'
import type {
  ChatCompletionParams,
  ChatCompletion,
} from './types.js'
import { PERPLEXITY_MODELS } from './types.js'

export interface PerplexityClientConfig extends ClientConfig {
  apiKey: string
  baseUrl?: string
}

export class PerplexityClient {
  private apiKey: string
  private baseUrl: string
  private timeout: number
  private fetchFn: typeof fetch

  constructor(config: PerplexityClientConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? 'https://api.perplexity.ai'
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
          'PERPLEXITY_API_ERROR',
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
  // Chat Completions
  // ============================================================================

  async chat(params: ChatCompletionParams): Promise<Result<ChatCompletion>> {
    return this.request<ChatCompletion>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  // ============================================================================
  // Convenience Methods
  // ============================================================================

  async search(
    query: string,
    options?: {
      model?: (typeof PERPLEXITY_MODELS)[number]
      search_recency_filter?: 'month' | 'week' | 'day' | 'hour'
      search_domain_filter?: string[]
    }
  ): Promise<Result<ChatCompletion>> {
    return this.chat({
      model: options?.model ?? 'llama-3.1-sonar-small-128k-online',
      messages: [{ role: 'user', content: query }],
      search_recency_filter: options?.search_recency_filter,
      search_domain_filter: options?.search_domain_filter,
    })
  }

  // ============================================================================
  // Models (static list, no API endpoint)
  // ============================================================================

  listModels(): Array<{
    id: string
    name: string
    context_length: number
    online: boolean
  }> {
    return [
      {
        id: 'llama-3.1-sonar-small-128k-online',
        name: 'Sonar Small Online',
        context_length: 128000,
        online: true,
      },
      {
        id: 'llama-3.1-sonar-large-128k-online',
        name: 'Sonar Large Online',
        context_length: 128000,
        online: true,
      },
      {
        id: 'llama-3.1-sonar-huge-128k-online',
        name: 'Sonar Huge Online',
        context_length: 128000,
        online: true,
      },
      {
        id: 'llama-3.1-sonar-small-128k-chat',
        name: 'Sonar Small Chat',
        context_length: 128000,
        online: false,
      },
      {
        id: 'llama-3.1-sonar-large-128k-chat',
        name: 'Sonar Large Chat',
        context_length: 128000,
        online: false,
      },
    ]
  }
}
