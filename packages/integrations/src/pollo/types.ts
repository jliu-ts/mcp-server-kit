/**
 * Pollo.AI API Types
 *
 * Type definitions for Pollo.AI video generation API.
 * @see https://docs.pollo.ai
 */

import { z } from 'zod'

// ============================================================================
// Zod Schemas
// ============================================================================

export const VideoModelSchema = z.enum([
  'pollo-v2-0',
  'pollo-v1-6',
  'pollo-v1-5',
  'kling-v2-6',
  'kling-v2-5-turbo',
  'veo-3-1',
  'veo-3-1-fast',
])

export const ResolutionSchema = z.enum(['480p', '720p', '1080p'])

export const TaskStatusSchema = z.enum(['waiting', 'processing', 'succeed', 'failed'])

export const GenerationInputSchema = z.object({
  /** Text prompt for video generation */
  prompt: z.string().optional(),
  /** Image URL or base64 for image-to-video */
  image: z.string().optional(),
  /** Random seed for reproducibility */
  seed: z.number().optional(),
  /** Enable audio generation */
  generateAudio: z.boolean().optional(),
  /** Video duration in seconds (1-10) */
  length: z.number().min(1).max(10).optional(),
  /** Output resolution */
  resolution: ResolutionSchema.optional(),
})

export const GenerationResponseSchema = z.object({
  taskId: z.string(),
  status: TaskStatusSchema,
})

export const TaskStatusResponseSchema = z.object({
  taskId: z.string(),
  status: TaskStatusSchema,
  /** Video URL when status is 'succeed' */
  videoUrl: z.string().optional(),
  /** Error message when status is 'failed' */
  error: z.string().optional(),
  /** Progress percentage */
  progress: z.number().optional(),
})

export const CreditBalanceResponseSchema = z.object({
  balance: z.number(),
  currency: z.string().optional(),
})

// ============================================================================
// TypeScript Types
// ============================================================================

export type VideoModel = z.infer<typeof VideoModelSchema>
export type Resolution = z.infer<typeof ResolutionSchema>
export type TaskStatus = z.infer<typeof TaskStatusSchema>
export type GenerationInput = z.infer<typeof GenerationInputSchema>
export type GenerationResponse = z.infer<typeof GenerationResponseSchema>
export type TaskStatusResponse = z.infer<typeof TaskStatusResponseSchema>
export type CreditBalanceResponse = z.infer<typeof CreditBalanceResponseSchema>

// ============================================================================
// Input Types
// ============================================================================

export interface TextToVideoParams {
  /** Text prompt describing the video */
  prompt: string
  /** Video model to use (default: pollo-v2-0) */
  model?: VideoModel
  /** Video duration in seconds (1-10, default: 5) */
  length?: number
  /** Output resolution (default: 720p) */
  resolution?: Resolution
  /** Enable audio generation */
  generateAudio?: boolean
  /** Random seed for reproducibility */
  seed?: number
  /** Webhook URL for completion notification */
  webhookUrl?: string
}

export interface ImageToVideoParams {
  /** Image URL or path */
  image: string
  /** Text prompt to guide the animation */
  prompt?: string
  /** Video model to use (default: pollo-v2-0) */
  model?: VideoModel
  /** Video duration in seconds (1-10, default: 5) */
  length?: number
  /** Output resolution (default: 720p) */
  resolution?: Resolution
  /** Enable audio generation */
  generateAudio?: boolean
  /** Random seed for reproducibility */
  seed?: number
  /** Webhook URL for completion notification */
  webhookUrl?: string
}

export interface GetTaskStatusParams {
  /** Task ID from generation request */
  taskId: string
}

// ============================================================================
// Response Types
// ============================================================================

export interface GenerateVideoResponse {
  taskId: string
  status: TaskStatus
}

export interface VideoStatusResponse {
  taskId: string
  status: TaskStatus
  videoUrl?: string
  error?: string
  progress?: number
}

export interface CreditBalance {
  balance: number
  currency?: string
}
