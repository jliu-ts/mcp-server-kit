/**
 * Slack AI SDK Tools
 *
 * AI SDK 6 native tool definitions for Slack operations.
 * Single source of truth - used by both MCP server and AI SDK agents.
 *
 * @example
 * import { createSlackTools } from '@trendingsociety/integrations/slack'
 * import { SlackClient } from '@trendingsociety/integrations/slack'
 *
 * const client = new SlackClient({
 *   webhookUrl: process.env.SLACK_WEBHOOK_URL,
 * })
 * const tools = createSlackTools(client)
 */

import { tool } from 'ai'
import { z } from 'zod'
import type { SlackClient } from './client.js'

// ============================================================================
// Input Schemas (Zod)
// ============================================================================

export const SendMessageInputSchema = z.object({
  message: z.string().describe('Message text to send'),
  channel: z.string().optional().describe('Override default channel (if webhook supports it)'),
  username: z.string().optional().describe('Override bot username'),
  icon_emoji: z.string().optional().describe('Bot icon emoji (e.g., ":robot:")'),
})

// ============================================================================
// Tool Factory
// ============================================================================

/**
 * Create AI SDK tools for Slack operations
 *
 * @param client - Initialized SlackClient instance
 * @returns Object containing all Slack tools
 */
export function createSlackTools(client: SlackClient) {
  return {
    slack_send_message: tool({
      description:
        'Send a message to a Slack channel via webhook. Use this to notify teams, send alerts, or share updates.',
      inputSchema: SendMessageInputSchema,
      execute: async (params) => {
        const result = await client.sendMessage({
          text: params.message,
          channel: params.channel,
          username: params.username,
          iconEmoji: params.icon_emoji,
        })
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

export type SlackTools = ReturnType<typeof createSlackTools>
