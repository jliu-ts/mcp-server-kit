/**
 * Pollo.AI Video Generation Client
 *
 * Runtime-agnostic client for Pollo.AI's video generation API.
 * Supports text-to-video, image-to-video, and multiple AI models.
 *
 * @see https://docs.pollo.ai
 *
 * @example
 * import { PolloClient } from '@trendingsociety/integrations/pollo'
 *
 * const pollo = new PolloClient({ apiKey: process.env.POLLO_AI_API_KEY })
 *
 * // Generate video from text
 * const task = await pollo.textToVideo({
 *   prompt: 'A cat playing piano in a jazz club',
 *   length: 5,
 *   resolution: '720p'
 * })
 *
 * // Poll for completion
 * const result = await pollo.waitForCompletion(task.data.taskId)
 * console.log('Video URL:', result.data.videoUrl)
 */

import { API } from '../config/constants'
import { ok, fail, type Result, type ClientConfig } from '../types.js'
import type {
  VideoModel,
  TextToVideoParams,
  ImageToVideoParams,
  GetTaskStatusParams,
  GenerateVideoResponse,
  VideoStatusResponse,
  CreditBalance,
} from './types.js'

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = 'https://pollo.ai/api/platform'
const DEFAULT_MODEL: VideoModel = 'pollo-v2-0'

export interface PolloClientConfig extends ClientConfig {
  /** Pollo.AI API key */
  apiKey: string
  /** Base URL override (default: https://pollo.ai/api/platform) */
  baseUrl?: string
  /** Default model to use */
  defaultModel?: VideoModel
}

// ============================================================================
// Client Implementation
// ============================================================================

export class PolloClient {
  private apiKey: string
  private baseUrl: string
  private defaultModel: VideoModel
  private timeout: number
  private fetchFn: typeof fetch
  private debug: boolean

  constructor(config: PolloClientConfig) {
    if (!config.apiKey) {
      throw new Error('PolloClient requires apiKey')
    }

    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? BASE_URL
    this.defaultModel = config.defaultModel ?? DEFAULT_MODEL
    this.timeout = config.timeout ?? API.defaultTimeout
    this.fetchFn = config.fetch ?? fetch
    this.debug = config.debug ?? false
  }

  // --------------------------------------------------------------------------
  // Text to Video
  // --------------------------------------------------------------------------

  async textToVideo(params: TextToVideoParams): Promise<Result<GenerateVideoResponse>> {
    if (!params.prompt) {
      return fail('INVALID_PARAMS', 'Missing required parameter: prompt')
    }

    const model = params.model ?? this.defaultModel
    const endpoint = `/generation/pollo/${model}`

    const body: Record<string, unknown> = {
      input: {
        prompt: params.prompt,
        length: params.length ?? 5,
        resolution: params.resolution ?? '720p',
        generateAudio: params.generateAudio ?? false,
        ...(params.seed !== undefined && { seed: params.seed }),
      },
      ...(params.webhookUrl && { webhookUrl: params.webhookUrl }),
    }

    return this.post<GenerateVideoResponse>(endpoint, body)
  }

  // --------------------------------------------------------------------------
  // Image to Video
  // --------------------------------------------------------------------------

  async imageToVideo(params: ImageToVideoParams): Promise<Result<GenerateVideoResponse>> {
    if (!params.image) {
      return fail('INVALID_PARAMS', 'Missing required parameter: image')
    }

    const model = params.model ?? this.defaultModel
    const endpoint = `/generation/pollo/${model}`

    const body: Record<string, unknown> = {
      input: {
        image: params.image,
        prompt: params.prompt,
        length: params.length ?? 5,
        resolution: params.resolution ?? '720p',
        generateAudio: params.generateAudio ?? false,
        ...(params.seed !== undefined && { seed: params.seed }),
      },
      ...(params.webhookUrl && { webhookUrl: params.webhookUrl }),
    }

    return this.post<GenerateVideoResponse>(endpoint, body)
  }

  // --------------------------------------------------------------------------
  // Get Task Status
  // --------------------------------------------------------------------------

  async getTaskStatus(params: GetTaskStatusParams): Promise<Result<VideoStatusResponse>> {
    if (!params.taskId) {
      return fail('INVALID_PARAMS', 'Missing required parameter: taskId')
    }

    return this.get<VideoStatusResponse>(`/generation/${params.taskId}/status`)
  }

  // --------------------------------------------------------------------------
  // Wait for Completion (Polling)
  // --------------------------------------------------------------------------

  async waitForCompletion(
    taskId: string,
    options: { pollInterval?: number; maxWait?: number } = {}
  ): Promise<Result<VideoStatusResponse>> {
    const pollInterval = options.pollInterval ?? 2000 // 2 seconds
    const maxWait = options.maxWait ?? 300000 // 5 minutes
    const startTime = Date.now()

    while (Date.now() - startTime < maxWait) {
      const result = await this.getTaskStatus({ taskId })

      if (!result.success) {
        return result
      }

      if (result.data.status === 'succeed') {
        return result
      }

      if (result.data.status === 'failed') {
        return fail('GENERATION_FAILED', result.data.error ?? 'Video generation failed')
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
    }

    return fail('TIMEOUT', `Video generation timed out after ${maxWait / 1000}s`)
  }

  // --------------------------------------------------------------------------
  // Check Credit Balance
  // --------------------------------------------------------------------------

  async getCreditBalance(): Promise<Result<CreditBalance>> {
    return this.get<CreditBalance>('/credit/balance')
  }

  // --------------------------------------------------------------------------
  // HTTP Helpers
  // --------------------------------------------------------------------------

  private async get<T>(endpoint: string): Promise<Result<T>> {
    return this.request<T>('GET', endpoint)
  }

  private async post<T>(endpoint: string, body: Record<string, unknown>): Promise<Result<T>> {
    return this.request<T>('POST', endpoint, body)
  }

  private async request<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<Result<T>> {
    const url = `${this.baseUrl}${endpoint}`

    if (this.debug) {
      console.log(`[PolloClient] ${method} ${endpoint}`)
      if (body) console.log('[PolloClient] Body:', JSON.stringify(body, null, 2))
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await this.fetchFn(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        return fail('HTTP_ERROR', `API returned ${response.status}: ${errorText}`, response.status)
      }

      const data = (await response.json()) as T
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
