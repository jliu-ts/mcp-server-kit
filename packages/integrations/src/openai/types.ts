/**
 * OpenAI API Types
 * https://platform.openai.com/docs/api-reference
 */

import { z } from 'zod'

// ============================================================================
// Configuration
// ============================================================================

export interface OpenAIConfig {
  apiKey: string
  organization?: string
  baseUrl?: string
  timeout?: number
}

// ============================================================================
// Chat Completions
// ============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool'
  content: string | null
  name?: string
  function_call?: {
    name: string
    arguments: string
  }
  tool_calls?: ToolCall[]
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface ChatCompletionParams {
  model: string
  messages: ChatMessage[]
  temperature?: number
  top_p?: number
  n?: number
  stream?: boolean
  stop?: string | string[]
  max_tokens?: number
  presence_penalty?: number
  frequency_penalty?: number
  user?: string
  response_format?: { type: 'text' | 'json_object' }
}

export interface ChatCompletion {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: {
    index: number
    message: ChatMessage
    finish_reason: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter'
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// ============================================================================
// Embeddings
// ============================================================================

export interface EmbeddingParams {
  model: string
  input: string | string[]
  encoding_format?: 'float' | 'base64'
  dimensions?: number
  user?: string
}

export interface EmbeddingResponse {
  object: 'list'
  data: {
    object: 'embedding'
    embedding: number[]
    index: number
  }[]
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

// ============================================================================
// Models
// ============================================================================

export interface Model {
  id: string
  object: 'model'
  created: number
  owned_by: string
}

export interface ModelsResponse {
  object: 'list'
  data: Model[]
}

// ============================================================================
// Images
// ============================================================================

export interface ImageGenerateParams {
  prompt: string
  model?: 'dall-e-2' | 'dall-e-3'
  n?: number
  quality?: 'standard' | 'hd'
  response_format?: 'url' | 'b64_json'
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'
  style?: 'vivid' | 'natural'
  user?: string
}

export interface ImageEditParams {
  image: string // base64 or URL
  prompt: string
  mask?: string
  model?: 'dall-e-2'
  n?: number
  size?: '256x256' | '512x512' | '1024x1024'
  response_format?: 'url' | 'b64_json'
  user?: string
}

export interface ImageResponse {
  created: number
  data: {
    url?: string
    b64_json?: string
    revised_prompt?: string
  }[]
}

// ============================================================================
// Audio
// ============================================================================

export interface SpeechParams {
  model: 'tts-1' | 'tts-1-hd'
  input: string
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm'
  speed?: number
}

export interface TranscriptionParams {
  file: string // base64 audio
  model: 'whisper-1'
  language?: string
  prompt?: string
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt'
  temperature?: number
}

export interface TranscriptionResponse {
  text: string
  task?: string
  language?: string
  duration?: number
  segments?: {
    id: number
    seek: number
    start: number
    end: number
    text: string
    tokens: number[]
    temperature: number
    avg_logprob: number
    compression_ratio: number
    no_speech_prob: number
  }[]
}

// ============================================================================
// Moderation
// ============================================================================

export interface ModerationParams {
  input: string | string[]
  model?: 'text-moderation-latest' | 'text-moderation-stable'
}

export interface ModerationResponse {
  id: string
  model: string
  results: {
    flagged: boolean
    categories: Record<string, boolean>
    category_scores: Record<string, number>
  }[]
}

// ============================================================================
// Files
// ============================================================================

export interface FileObject {
  id: string
  object: 'file'
  bytes: number
  created_at: number
  filename: string
  purpose: 'fine-tune' | 'fine-tune-results' | 'assistants' | 'assistants_output'
  status?: 'uploaded' | 'processed' | 'error'
  status_details?: string
}

export interface FilesResponse {
  object: 'list'
  data: FileObject[]
}

export interface UploadFileParams {
  file: string // base64 content
  filename: string
  purpose: 'fine-tune' | 'assistants'
}

// ============================================================================
// Fine-tuning
// ============================================================================

export interface FineTuneParams {
  training_file: string
  model: string
  validation_file?: string
  hyperparameters?: {
    n_epochs?: number | 'auto'
    batch_size?: number | 'auto'
    learning_rate_multiplier?: number | 'auto'
  }
  suffix?: string
}

export interface FineTuneJob {
  id: string
  object: 'fine_tuning.job'
  created_at: number
  finished_at: number | null
  model: string
  fine_tuned_model: string | null
  organization_id: string
  status: 'validating_files' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'
  hyperparameters: {
    n_epochs: number
    batch_size: number
    learning_rate_multiplier: number
  }
  trained_tokens: number | null
  error?: {
    code: string
    message: string
    param?: string
  }
}

export interface FineTuneJobsResponse {
  object: 'list'
  data: FineTuneJob[]
  has_more: boolean
}

// ============================================================================
// Zod Schemas for Tool Inputs
// ============================================================================

export const ChatCompletionInputSchema = z.object({
  model: z.string().default('gpt-4o').describe('Model ID (e.g., gpt-4o, gpt-4o-mini, gpt-3.5-turbo)'),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']).describe('Message role'),
    content: z.string().describe('Message content'),
  })).describe('Array of messages in the conversation'),
  temperature: z.number().min(0).max(2).optional().describe('Sampling temperature (0-2)'),
  max_tokens: z.number().optional().describe('Maximum tokens to generate'),
})

export const EmbeddingInputSchema = z.object({
  model: z.string().default('text-embedding-3-small').describe('Embedding model ID'),
  input: z.union([z.string(), z.array(z.string())]).describe('Text to embed'),
  dimensions: z.number().optional().describe('Output dimensions (for ada-3 models)'),
})

export const ImageGenerateInputSchema = z.object({
  prompt: z.string().describe('Image description'),
  model: z.enum(['dall-e-2', 'dall-e-3']).default('dall-e-3').describe('Model to use'),
  size: z.enum(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792']).default('1024x1024').describe('Image size'),
  quality: z.enum(['standard', 'hd']).default('standard').describe('Image quality'),
  n: z.number().min(1).max(10).default(1).describe('Number of images'),
})

export const ImageEditInputSchema = z.object({
  image: z.string().describe('Base64 encoded image to edit'),
  prompt: z.string().describe('Description of the edit'),
  mask: z.string().optional().describe('Base64 encoded mask image'),
  size: z.enum(['256x256', '512x512', '1024x1024']).default('1024x1024').describe('Output size'),
})

export const SpeechInputSchema = z.object({
  input: z.string().describe('Text to convert to speech'),
  model: z.enum(['tts-1', 'tts-1-hd']).default('tts-1').describe('TTS model'),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).default('alloy').describe('Voice to use'),
  speed: z.number().min(0.25).max(4).default(1).describe('Speech speed'),
  response_format: z.enum(['mp3', 'opus', 'aac', 'flac', 'wav']).default('mp3').describe('Audio format'),
})

export const TranscriptionInputSchema = z.object({
  file: z.string().describe('Base64 encoded audio file'),
  model: z.literal('whisper-1').default('whisper-1').describe('Whisper model'),
  language: z.string().optional().describe('Language code (e.g., en, es, fr)'),
  prompt: z.string().optional().describe('Optional prompt to guide transcription'),
})

export const ModerationInputSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]).describe('Text to moderate'),
})

export const UploadFileInputSchema = z.object({
  file: z.string().describe('Base64 encoded file content'),
  filename: z.string().describe('Name of the file'),
  purpose: z.enum(['fine-tune', 'assistants']).describe('Purpose of the file'),
})

export const FineTuneInputSchema = z.object({
  training_file: z.string().describe('File ID of training data'),
  model: z.string().default('gpt-3.5-turbo').describe('Base model to fine-tune'),
  validation_file: z.string().optional().describe('File ID of validation data'),
  suffix: z.string().optional().describe('Suffix for the fine-tuned model name'),
})

export const ListModelsInputSchema = z.object({})

export const ListFilesInputSchema = z.object({
  purpose: z.enum(['fine-tune', 'assistants']).optional().describe('Filter by purpose'),
})

export const ListFineTunesInputSchema = z.object({
  limit: z.number().max(100).default(20).describe('Number of jobs to return'),
})
