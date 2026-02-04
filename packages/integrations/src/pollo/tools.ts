/**
 * Pollo.AI SDK Tools
 *
 * AI SDK 6 native tool definitions for Pollo.AI video generation.
 * Single source of truth - used by both MCP server and AI SDK agents.
 *
 * @example
 * import { createPolloTools } from '@trendingsociety/integrations/pollo'
 * import { PolloClient } from '@trendingsociety/integrations/pollo'
 *
 * const client = new PolloClient({
 *   apiKey: process.env.POLLO_AI_API_KEY,
 * })
 * const tools = createPolloTools(client)
 */

import { tool } from 'ai'
import { z } from 'zod'
import type { PolloClient } from './client.js'
import { VideoModelSchema, ResolutionSchema } from './types.js'

// ============================================================================
// Input Schemas (Zod)
// ============================================================================

export const TextToVideoInputSchema = z.object({
  prompt: z.string().describe('Text prompt describing the video to generate'),
  model: VideoModelSchema.optional().describe('Video model to use (default: pollo-v2-0)'),
  length: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .default(5)
    .describe('Video duration in seconds (1-10, default: 5)'),
  resolution: ResolutionSchema.optional()
    .default('720p')
    .describe('Output resolution: 480p, 720p, or 1080p (default: 720p)'),
  generateAudio: z
    .boolean()
    .optional()
    .default(false)
    .describe('Enable audio generation'),
  seed: z.number().optional().describe('Random seed for reproducibility'),
  webhookUrl: z.string().url().optional().describe('Webhook URL for completion notification'),
})

export const ImageToVideoInputSchema = z.object({
  image: z.string().describe('Image URL or base64 data to animate'),
  prompt: z.string().optional().describe('Text prompt to guide the animation'),
  model: VideoModelSchema.optional().describe('Video model to use (default: pollo-v2-0)'),
  length: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .default(5)
    .describe('Video duration in seconds (1-10, default: 5)'),
  resolution: ResolutionSchema.optional()
    .default('720p')
    .describe('Output resolution: 480p, 720p, or 1080p (default: 720p)'),
  generateAudio: z
    .boolean()
    .optional()
    .default(false)
    .describe('Enable audio generation'),
  seed: z.number().optional().describe('Random seed for reproducibility'),
  webhookUrl: z.string().url().optional().describe('Webhook URL for completion notification'),
})

export const GetTaskStatusInputSchema = z.object({
  taskId: z.string().describe('Task ID from a previous generation request'),
})

// ============================================================================
// Tool Factory
// ============================================================================

/**
 * Create AI SDK tools for Pollo.AI video generation
 *
 * @param client - Initialized PolloClient instance
 * @returns Object containing all Pollo tools
 */
export function createPolloTools(client: PolloClient) {
  return {
    pollo_text_to_video: tool({
      description:
        'Generate a video from a text prompt using Pollo.AI. Returns a task ID that can be used to check generation status. Supports multiple models including Pollo, Kling, and Veo.',
      inputSchema: TextToVideoInputSchema,
      execute: async (params) => {
        const result = await client.textToVideo(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    pollo_image_to_video: tool({
      description:
        'Animate an image into a video using Pollo.AI. Provide an image URL or base64 data, optionally with a text prompt to guide the animation. Returns a task ID for status checking.',
      inputSchema: ImageToVideoInputSchema,
      execute: async (params) => {
        const result = await client.imageToVideo(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    pollo_get_task_status: tool({
      description:
        'Check the status of a video generation task. Returns status (waiting, processing, succeed, failed), progress percentage, and video URL when complete.',
      inputSchema: GetTaskStatusInputSchema,
      execute: async (params) => {
        const result = await client.getTaskStatus(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    pollo_get_credits: tool({
      description: 'Check the current credit balance for the Pollo.AI account.',
      inputSchema: z.object({}),
      execute: async () => {
        const result = await client.getCreditBalance()
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type PolloTools = ReturnType<typeof createPolloTools>
