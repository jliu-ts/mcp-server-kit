/**
 * Hugging Face API Client
 * https://huggingface.co/docs/api-inference
 */

import { type Result, ok, fail, type ClientConfig } from '../types.js'
import type {
  Model,
  ModelSearchParams,
  InferenceParams,
  TextGenerationParams,
  TextGenerationResponse,
  SummarizationParams,
  SummarizationResponse,
  TranslationParams,
  TranslationResponse,
  ImageClassificationResponse,
  ObjectDetectionResponse,
} from './types.js'

export interface HuggingFaceClientConfig extends ClientConfig {
  apiKey: string
  baseUrl?: string
}

export class HuggingFaceClient {
  private apiKey: string
  private baseUrl: string
  private inferenceUrl: string
  private timeout: number
  private fetchFn: typeof fetch

  constructor(config: HuggingFaceClientConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? 'https://huggingface.co/api'
    this.inferenceUrl = 'https://api-inference.huggingface.co/models'
    this.timeout = config.timeout ?? 120000 // Longer timeout for inference
    this.fetchFn = config.fetch ?? fetch.bind(globalThis)
  }

  private async request<T>(
    url: string,
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

      const response = await this.fetchFn(url, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        return fail(
          'HUGGINGFACE_API_ERROR',
          error.error || `HTTP ${response.status}`,
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
  // Models
  // ============================================================================

  async listModels(params?: ModelSearchParams): Promise<Result<Model[]>> {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.author) searchParams.set('author', params.author)
    if (params?.filter) searchParams.set('filter', params.filter)
    if (params?.sort) searchParams.set('sort', params.sort)
    if (params?.direction) searchParams.set('direction', params.direction)
    if (params?.limit) searchParams.set('limit', String(params.limit))

    const query = searchParams.toString()
    return this.request<Model[]>(`${this.baseUrl}/models${query ? `?${query}` : ''}`)
  }

  async getModel(modelId: string): Promise<Result<Model>> {
    return this.request<Model>(`${this.baseUrl}/models/${modelId}`)
  }

  // ============================================================================
  // Inference
  // ============================================================================

  async inference<T>(params: InferenceParams): Promise<Result<T>> {
    return this.request<T>(`${this.inferenceUrl}/${params.model}`, {
      method: 'POST',
      body: JSON.stringify({
        inputs: params.inputs,
        parameters: params.parameters,
        options: params.options,
      }),
    })
  }

  async textGeneration(
    params: TextGenerationParams
  ): Promise<Result<TextGenerationResponse[]>> {
    return this.inference<TextGenerationResponse[]>({
      model: params.model,
      inputs: params.inputs,
      parameters: params.parameters,
      options: { wait_for_model: true },
    })
  }

  async summarization(
    params: SummarizationParams
  ): Promise<Result<SummarizationResponse[]>> {
    return this.inference<SummarizationResponse[]>({
      model: params.model,
      inputs: params.inputs,
      parameters: params.parameters,
      options: { wait_for_model: true },
    })
  }

  async translation(
    params: TranslationParams
  ): Promise<Result<TranslationResponse[]>> {
    return this.inference<TranslationResponse[]>({
      model: params.model,
      inputs: params.inputs,
      options: { wait_for_model: true },
    })
  }

  async imageClassification(
    model: string,
    imageUrl: string
  ): Promise<Result<ImageClassificationResponse[]>> {
    return this.inference<ImageClassificationResponse[]>({
      model,
      inputs: imageUrl,
      options: { wait_for_model: true },
    })
  }

  async objectDetection(
    model: string,
    imageUrl: string
  ): Promise<Result<ObjectDetectionResponse[]>> {
    return this.inference<ObjectDetectionResponse[]>({
      model,
      inputs: imageUrl,
      options: { wait_for_model: true },
    })
  }
}
