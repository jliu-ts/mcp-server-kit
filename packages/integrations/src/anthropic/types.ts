/**
 * Anthropic Claude API Types
 * https://docs.anthropic.com/en/api
 */

import { z } from 'zod'

// ============================================================================
// Configuration
// ============================================================================

export interface AnthropicConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
}

// ============================================================================
// Messages
// ============================================================================

export interface ContentBlock {
  type: 'text' | 'image' | 'tool_use' | 'tool_result'
  text?: string
  source?: {
    type: 'base64'
    media_type: string
    data: string
  }
  id?: string
  name?: string
  input?: Record<string, unknown>
  tool_use_id?: string
  content?: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
}

export interface CreateMessageParams {
  model: string
  max_tokens: number
  messages: Message[]
  system?: string
  temperature?: number
  top_p?: number
  top_k?: number
  stop_sequences?: string[]
  stream?: boolean
  metadata?: {
    user_id?: string
  }
}

export interface MessageResponse {
  id: string
  type: 'message'
  role: 'assistant'
  content: ContentBlock[]
  model: string
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | null
  stop_sequence: string | null
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

// ============================================================================
// Token Counting
// ============================================================================

export interface CountTokensParams {
  model: string
  messages: Message[]
  system?: string
}

export interface TokenCountResponse {
  input_tokens: number
}

// ============================================================================
// Models
// ============================================================================

export interface Model {
  id: string
  display_name: string
  created_at: string
  type: 'model'
}

export interface ModelsResponse {
  data: Model[]
  has_more: boolean
  first_id: string | null
  last_id: string | null
}

// ============================================================================
// Message Batches
// ============================================================================

export interface BatchRequest {
  custom_id: string
  params: CreateMessageParams
}

export interface CreateBatchParams {
  requests: BatchRequest[]
}

export interface BatchResponse {
  id: string
  type: 'message_batch'
  processing_status: 'in_progress' | 'canceling' | 'ended'
  request_counts: {
    processing: number
    succeeded: number
    errored: number
    canceled: number
    expired: number
  }
  ended_at: string | null
  created_at: string
  expires_at: string
  cancel_initiated_at: string | null
  results_url: string | null
}

export interface BatchListResponse {
  data: BatchResponse[]
  has_more: boolean
  first_id: string | null
  last_id: string | null
}

// ============================================================================
// Zod Schemas for Tool Inputs
// ============================================================================

export const CreateMessageInputSchema = z.object({
  model: z.string().default('claude-sonnet-4-20250514').describe('Model ID (e.g., claude-sonnet-4-20250514, claude-3-5-haiku-20241022)'),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']).describe('Message role'),
    content: z.string().describe('Message content'),
  })).describe('Array of messages in the conversation'),
  system: z.string().optional().describe('System prompt to guide Claude'),
  max_tokens: z.number().default(1024).describe('Maximum tokens to generate'),
  temperature: z.number().min(0).max(1).optional().describe('Sampling temperature (0-1)'),
})

export const CountTokensInputSchema = z.object({
  model: z.string().default('claude-sonnet-4-20250514').describe('Model ID'),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']).describe('Message role'),
    content: z.string().describe('Message content'),
  })).describe('Messages to count tokens for'),
  system: z.string().optional().describe('System prompt'),
})

export const ListModelsInputSchema = z.object({
  limit: z.number().max(100).default(20).describe('Number of models to return'),
})

export const CreateBatchInputSchema = z.object({
  requests: z.array(z.object({
    custom_id: z.string().describe('Unique ID for tracking this request'),
    model: z.string().describe('Model ID'),
    messages: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })),
    max_tokens: z.number().default(1024),
    system: z.string().optional(),
  })).describe('Array of message requests to batch'),
})

export const GetBatchInputSchema = z.object({
  batch_id: z.string().describe('Batch ID to retrieve'),
})

export const ListBatchesInputSchema = z.object({
  limit: z.number().max(100).default(20).describe('Number of batches to return'),
})

export const CancelBatchInputSchema = z.object({
  batch_id: z.string().describe('Batch ID to cancel'),
})
