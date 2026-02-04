/**
 * OpenAI API Client
 * https://platform.openai.com/docs/api-reference
 */

import { type Result, ok, fail, type ClientConfig } from '../types.js'
import type {
  ChatCompletionParams,
  ChatCompletion,
  EmbeddingParams,
  EmbeddingResponse,
  ModelsResponse,
  ImageGenerateParams,
  ImageEditParams,
  ImageResponse,
  SpeechParams,
  TranscriptionParams,
  TranscriptionResponse,
  ModerationParams,
  ModerationResponse,
  FilesResponse,
  FileObject,
  UploadFileParams,
  FineTuneParams,
  FineTuneJob,
  FineTuneJobsResponse,
} from './types.js'

export interface OpenAIClientConfig extends ClientConfig {
  apiKey: string
  organization?: string
  baseUrl?: string
}

export class OpenAIClient {
  private apiKey: string
  private organization?: string
  private baseUrl: string
  private timeout: number
  private fetchFn: typeof fetch

  constructor(config: OpenAIClientConfig) {
    this.apiKey = config.apiKey
    this.organization = config.organization
    this.baseUrl = config.baseUrl ?? 'https://api.openai.com/v1'
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
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(this.organization && { 'OpenAI-Organization': this.organization }),
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
          'OPENAI_API_ERROR',
          error.error?.message || `HTTP ${response.status}`,
          response.status
        )
      }

      // Handle binary responses (audio)
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('audio/')) {
        const buffer = await response.arrayBuffer()
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
        return ok({ audio: base64, format: contentType.split('/')[1] } as T)
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

  async createChatCompletion(
    params: ChatCompletionParams
  ): Promise<Result<ChatCompletion>> {
    return this.request<ChatCompletion>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  // ============================================================================
  // Embeddings
  // ============================================================================

  async createEmbedding(params: EmbeddingParams): Promise<Result<EmbeddingResponse>> {
    return this.request<EmbeddingResponse>('/embeddings', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  // ============================================================================
  // Models
  // ============================================================================

  async listModels(): Promise<Result<ModelsResponse>> {
    return this.request<ModelsResponse>('/models')
  }

  // ============================================================================
  // Images
  // ============================================================================

  async createImage(params: ImageGenerateParams): Promise<Result<ImageResponse>> {
    return this.request<ImageResponse>('/images/generations', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async editImage(params: ImageEditParams): Promise<Result<ImageResponse>> {
    // Note: Image edit requires multipart form data in production
    // This is a simplified version using JSON
    return this.request<ImageResponse>('/images/edits', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  // ============================================================================
  // Audio
  // ============================================================================

  async createSpeech(
    params: SpeechParams
  ): Promise<Result<{ audio: string; format: string }>> {
    return this.request<{ audio: string; format: string }>('/audio/speech', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async createTranscription(
    params: TranscriptionParams
  ): Promise<Result<TranscriptionResponse>> {
    // Note: Transcription requires multipart form data in production
    return this.request<TranscriptionResponse>('/audio/transcriptions', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  // ============================================================================
  // Moderation
  // ============================================================================

  async createModeration(
    params: ModerationParams
  ): Promise<Result<ModerationResponse>> {
    return this.request<ModerationResponse>('/moderations', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  // ============================================================================
  // Files
  // ============================================================================

  async listFiles(purpose?: string): Promise<Result<FilesResponse>> {
    const query = purpose ? `?purpose=${purpose}` : ''
    return this.request<FilesResponse>(`/files${query}`)
  }

  async uploadFile(params: UploadFileParams): Promise<Result<FileObject>> {
    // Note: File upload requires multipart form data in production
    return this.request<FileObject>('/files', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  // ============================================================================
  // Fine-tuning
  // ============================================================================

  async createFineTune(params: FineTuneParams): Promise<Result<FineTuneJob>> {
    return this.request<FineTuneJob>('/fine_tuning/jobs', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async listFineTunes(limit = 20): Promise<Result<FineTuneJobsResponse>> {
    return this.request<FineTuneJobsResponse>(`/fine_tuning/jobs?limit=${limit}`)
  }
}
