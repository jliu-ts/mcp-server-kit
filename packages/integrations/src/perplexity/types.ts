/**
 * Perplexity API Types
 * https://docs.perplexity.ai/reference
 */

import { z } from 'zod'

// ============================================================================
// Configuration
// ============================================================================

export interface PerplexityConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
}

// ============================================================================
// Chat Completions
// ============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionParams {
  model: string
  messages: ChatMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  top_k?: number
  stream?: boolean
  presence_penalty?: number
  frequency_penalty?: number
  search_domain_filter?: string[]
  return_images?: boolean
  return_related_questions?: boolean
  search_recency_filter?: 'month' | 'week' | 'day' | 'hour'
}

export interface ChatCompletion {
  id: string
  model: string
  object: 'chat.completion'
  created: number
  choices: Array<{
    index: number
    finish_reason: 'stop' | 'length' | 'content_filter'
    message: {
      role: 'assistant'
      content: string
    }
    delta?: {
      role?: string
      content?: string
    }
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  citations?: string[]
  images?: Array<{
    url: string
    origin_url: string
  }>
  related_questions?: string[]
}

// ============================================================================
// Models
// ============================================================================

export const PERPLEXITY_MODELS = [
  'llama-3.1-sonar-small-128k-online', // 8B params, online search
  'llama-3.1-sonar-large-128k-online', // 70B params, online search
  'llama-3.1-sonar-huge-128k-online', // 405B params, online search
  'llama-3.1-sonar-small-128k-chat', // 8B params, no search
  'llama-3.1-sonar-large-128k-chat', // 70B params, no search
] as const

export type PerplexityModel = (typeof PERPLEXITY_MODELS)[number]

// ============================================================================
// Zod Schemas for Tool Inputs
// ============================================================================

export const ChatInputSchema = z.object({
  model: z
    .enum([
      'llama-3.1-sonar-small-128k-online',
      'llama-3.1-sonar-large-128k-online',
      'llama-3.1-sonar-huge-128k-online',
      'llama-3.1-sonar-small-128k-chat',
      'llama-3.1-sonar-large-128k-chat',
    ])
    .default('llama-3.1-sonar-small-128k-online')
    .describe('Perplexity model to use'),
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']).describe('Message role'),
        content: z.string().describe('Message content'),
      })
    )
    .describe('Conversation messages'),
  max_tokens: z.number().optional().describe('Maximum tokens to generate'),
  temperature: z.number().min(0).max(2).optional().describe('Sampling temperature'),
  return_citations: z
    .boolean()
    .default(true)
    .describe('Return source citations for online models'),
  return_related_questions: z
    .boolean()
    .default(false)
    .describe('Return related follow-up questions'),
})

export const SearchInputSchema = z.object({
  query: z.string().describe('Search query'),
  model: z
    .enum([
      'llama-3.1-sonar-small-128k-online',
      'llama-3.1-sonar-large-128k-online',
      'llama-3.1-sonar-huge-128k-online',
    ])
    .default('llama-3.1-sonar-small-128k-online')
    .describe('Online model for search'),
  search_recency_filter: z
    .enum(['month', 'week', 'day', 'hour'])
    .optional()
    .describe('Filter results by recency'),
  search_domain_filter: z
    .array(z.string())
    .optional()
    .describe('Limit search to specific domains'),
})

export const ListModelsInputSchema = z.object({})

export const GetUsageInputSchema = z.object({})
