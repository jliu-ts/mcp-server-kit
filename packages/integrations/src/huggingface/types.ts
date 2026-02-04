/**
 * Hugging Face API Types
 * https://huggingface.co/docs/api-inference
 */

import { z } from 'zod'

// ============================================================================
// Configuration
// ============================================================================

export interface HuggingFaceConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
}

// ============================================================================
// Models
// ============================================================================

export interface Model {
  id: string
  modelId: string
  author: string
  sha: string
  lastModified: string
  private: boolean
  disabled: boolean
  gated: boolean | 'auto' | 'manual'
  pipeline_tag?: string
  tags: string[]
  downloads: number
  likes: number
  library_name?: string
}

export interface ModelSearchParams {
  search?: string
  author?: string
  filter?: string
  sort?: 'downloads' | 'likes' | 'lastModified'
  direction?: 'asc' | 'desc'
  limit?: number
}

// ============================================================================
// Inference
// ============================================================================

export interface InferenceParams {
  model: string
  inputs: unknown
  parameters?: Record<string, unknown>
  options?: {
    use_cache?: boolean
    wait_for_model?: boolean
  }
}

export interface TextGenerationParams {
  model: string
  inputs: string
  parameters?: {
    max_new_tokens?: number
    temperature?: number
    top_p?: number
    top_k?: number
    repetition_penalty?: number
    do_sample?: boolean
    return_full_text?: boolean
  }
}

export interface TextGenerationResponse {
  generated_text: string
}

export interface SummarizationParams {
  model: string
  inputs: string
  parameters?: {
    max_length?: number
    min_length?: number
    do_sample?: boolean
  }
}

export interface SummarizationResponse {
  summary_text: string
}

export interface TranslationParams {
  model: string
  inputs: string
}

export interface TranslationResponse {
  translation_text: string
}

export interface ImageClassificationParams {
  model: string
  inputs: string // base64 image or URL
}

export interface ImageClassificationResponse {
  label: string
  score: number
}

export interface ObjectDetectionParams {
  model: string
  inputs: string // base64 image or URL
}

export interface ObjectDetectionResponse {
  label: string
  score: number
  box: {
    xmin: number
    ymin: number
    xmax: number
    ymax: number
  }
}

// ============================================================================
// Zod Schemas for Tool Inputs
// ============================================================================

export const InferenceInputSchema = z.object({
  model: z.string().describe('Hugging Face model ID (e.g., gpt2, facebook/bart-large-cnn)'),
  inputs: z.unknown().describe('Input data for the model'),
  parameters: z.record(z.unknown()).optional().describe('Model-specific parameters'),
  wait_for_model: z
    .boolean()
    .default(true)
    .describe('Wait for model to load if not ready'),
})

export const ListModelsInputSchema = z.object({
  search: z.string().optional().describe('Search query'),
  author: z.string().optional().describe('Filter by author/organization'),
  filter: z.string().optional().describe('Filter by pipeline tag (e.g., text-generation)'),
  sort: z
    .enum(['downloads', 'likes', 'lastModified'])
    .default('downloads')
    .describe('Sort by'),
  limit: z.number().max(100).default(20).describe('Maximum results'),
})

export const GetModelInputSchema = z.object({
  modelId: z.string().describe('Model ID (e.g., meta-llama/Llama-2-7b)'),
})

export const TextGenerationInputSchema = z.object({
  model: z
    .string()
    .default('gpt2')
    .describe('Model ID for text generation'),
  inputs: z.string().describe('Input text prompt'),
  max_new_tokens: z.number().max(2048).default(100).describe('Maximum tokens to generate'),
  temperature: z.number().min(0).max(2).default(0.7).describe('Sampling temperature'),
  top_p: z.number().min(0).max(1).optional().describe('Nucleus sampling'),
  do_sample: z.boolean().default(true).describe('Use sampling vs greedy decoding'),
})

export const ImageClassificationInputSchema = z.object({
  model: z
    .string()
    .default('google/vit-base-patch16-224')
    .describe('Model ID for image classification'),
  image_url: z.string().url().describe('URL of image to classify'),
})

export const ObjectDetectionInputSchema = z.object({
  model: z
    .string()
    .default('facebook/detr-resnet-50')
    .describe('Model ID for object detection'),
  image_url: z.string().url().describe('URL of image to analyze'),
})

export const SummarizationInputSchema = z.object({
  model: z
    .string()
    .default('facebook/bart-large-cnn')
    .describe('Model ID for summarization'),
  text: z.string().describe('Text to summarize'),
  max_length: z.number().max(1024).default(150).describe('Maximum summary length'),
  min_length: z.number().default(30).describe('Minimum summary length'),
})

export const TranslationInputSchema = z.object({
  model: z.string().describe('Translation model (e.g., Helsinki-NLP/opus-mt-en-fr)'),
  text: z.string().describe('Text to translate'),
})
