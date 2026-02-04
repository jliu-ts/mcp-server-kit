/**
 * Tavily Search Client
 *
 * Runtime-agnostic client for Tavily's AI-powered search API.
 * Works in Node.js, Edge runtimes, and Cloudflare Workers.
 *
 * @example
 * import { TavilyClient } from '@trendingsociety/integrations/tavily'
 *
 * const tavily = new TavilyClient({
 *   apiKey: process.env.TAVILY_API_KEY,
 * })
 *
 * // Basic search
 * const result = await tavily.search({ query: 'AI trends 2025' })
 *
 * // Advanced search with answer
 * const result = await tavily.search({
 *   query: 'best practices for React performance',
 *   search_depth: 'advanced',
 *   include_answer: true,
 *   max_results: 10,
 * })
 */

import { API } from '../config/constants'
import { ok, fail, type Result, type ClientConfig } from '../types.js'
import type {
  SearchParams,
  SearchResponse,
  ExtractParams,
  ExtractResponse,
} from './types.js'

// ============================================================================
// Configuration
// ============================================================================

const TAVILY_API_URL = 'https://api.tavily.com'

export interface TavilyClientConfig extends ClientConfig {
  /** Tavily API Key */
  apiKey: string
}

// ============================================================================
// Client Implementation
// ============================================================================

export class TavilyClient {
  private apiKey: string
  private timeout: number
  private fetchFn: typeof fetch
  private debug: boolean

  constructor(config: TavilyClientConfig) {
    if (!config.apiKey) {
      throw new Error('TavilyClient requires apiKey')
    }

    this.apiKey = config.apiKey
    this.timeout = config.timeout ?? API.defaultTimeout
    // Bind fetch to globalThis to avoid "Illegal invocation" in Cloudflare Workers
    this.fetchFn = config.fetch ?? fetch.bind(globalThis)
    this.debug = config.debug ?? false
  }

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  /**
   * Search the web using Tavily's AI-optimized search.
   * Returns structured results optimized for LLM consumption.
   */
  async search(params: SearchParams): Promise<Result<SearchResponse>> {
    if (!params.query || params.query.trim().length === 0) {
      return fail('INVALID_PARAMS', 'Search query is required')
    }

    const payload = {
      api_key: this.apiKey,
      query: params.query,
      search_depth: params.search_depth ?? 'basic',
      include_answer: params.include_answer ?? true,
      include_raw_content: params.include_raw_content ?? false,
      include_images: params.include_images ?? false,
      max_results: params.max_results ?? 5,
      include_domains: params.include_domains,
      exclude_domains: params.exclude_domains,
    }

    if (this.debug) {
      console.log('[TavilyClient] Search request:', JSON.stringify({ ...payload, api_key: '***' }, null, 2))
    }

    return this.request<SearchResponse>('/search', payload)
  }

  /**
   * Quick search with just a query string.
   * Uses default settings optimized for speed.
   */
  async quickSearch(query: string): Promise<Result<SearchResponse>> {
    return this.search({
      query,
      search_depth: 'basic',
      include_answer: true,
      max_results: 5,
    })
  }

  /**
   * Deep research search with comprehensive results.
   * Takes longer but returns more thorough results.
   */
  async research(query: string, maxResults = 10): Promise<Result<SearchResponse>> {
    return this.search({
      query,
      search_depth: 'advanced',
      include_answer: true,
      include_raw_content: true,
      max_results: maxResults,
    })
  }

  // --------------------------------------------------------------------------
  // Extract (Content Extraction)
  // --------------------------------------------------------------------------

  /**
   * Extract content from specific URLs.
   * Useful for getting full article text from known sources.
   */
  async extract(params: ExtractParams): Promise<Result<ExtractResponse>> {
    if (!params.urls || params.urls.length === 0) {
      return fail('INVALID_PARAMS', 'At least one URL is required')
    }

    const payload = {
      api_key: this.apiKey,
      urls: params.urls,
    }

    if (this.debug) {
      console.log('[TavilyClient] Extract request:', JSON.stringify({ ...payload, api_key: '***' }, null, 2))
    }

    return this.request<ExtractResponse>('/extract', payload)
  }

  /**
   * Extract content from a single URL.
   */
  async extractUrl(url: string): Promise<Result<ExtractResponse>> {
    return this.extract({ urls: [url] })
  }

  // --------------------------------------------------------------------------
  // Internal Request Handler
  // --------------------------------------------------------------------------

  private async request<T>(endpoint: string, payload: Record<string, unknown>): Promise<Result<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await this.fetchFn(`${TAVILY_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        
        // Parse Tavily error response
        try {
          const errorJson = JSON.parse(errorText)
          return fail(
            errorJson.code || 'API_ERROR',
            errorJson.message || `Tavily API error (${response.status})`,
            response.status
          )
        } catch {
          return fail(
            'API_ERROR',
            `Tavily API error (${response.status}): ${errorText}`,
            response.status
          )
        }
      }

      const data = await response.json() as T

      if (this.debug) {
        console.log('[TavilyClient] Response:', JSON.stringify(data, null, 2))
      }

      return ok(data)
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return fail('TIMEOUT', `Request timed out after ${this.timeout}ms`)
        }
        return fail('NETWORK_ERROR', error.message)
      }

      return fail('UNKNOWN_ERROR', String(error))
    }
  }
}

