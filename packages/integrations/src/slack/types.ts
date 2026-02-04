/**
 * Slack API Types
 *
 * Type definitions for Slack Incoming Webhooks and Web API.
 */

import { z } from 'zod'

// ============================================================================
// Block Kit Types (subset)
// ============================================================================

export const TextObjectSchema = z.object({
  type: z.enum(['plain_text', 'mrkdwn']),
  text: z.string(),
  emoji: z.boolean().optional(),
})

export const SectionBlockSchema = z.object({
  type: z.literal('section'),
  text: TextObjectSchema.optional(),
  fields: z.array(TextObjectSchema).optional(),
  accessory: z.unknown().optional(),
})

export const DividerBlockSchema = z.object({
  type: z.literal('divider'),
})

export const HeaderBlockSchema = z.object({
  type: z.literal('header'),
  text: TextObjectSchema,
})

export const ContextBlockSchema = z.object({
  type: z.literal('context'),
  elements: z.array(TextObjectSchema),
})

export const BlockSchema = z.union([
  SectionBlockSchema,
  DividerBlockSchema,
  HeaderBlockSchema,
  ContextBlockSchema,
])

// ============================================================================
// TypeScript Types
// ============================================================================

export type TextObject = z.infer<typeof TextObjectSchema>
export type SectionBlock = z.infer<typeof SectionBlockSchema>
export type DividerBlock = z.infer<typeof DividerBlockSchema>
export type HeaderBlock = z.infer<typeof HeaderBlockSchema>
export type ContextBlock = z.infer<typeof ContextBlockSchema>
export type Block = z.infer<typeof BlockSchema>

// ============================================================================
// Input Types
// ============================================================================

export interface SendMessageParams {
  /** Message text (required if no blocks) */
  text?: string
  /** Block Kit blocks (rich formatting) */
  blocks?: Block[]
  /** Override channel (if webhook supports it) */
  channel?: string
  /** Bot username override */
  username?: string
  /** Bot icon emoji (e.g., ":robot:") */
  iconEmoji?: string
  /** Bot icon URL */
  iconUrl?: string
  /** Unfurl links (default: false) */
  unfurlLinks?: boolean
  /** Unfurl media (default: false) */
  unfurlMedia?: boolean
}

// ============================================================================
// Response Types
// ============================================================================

export interface SendMessageResponse {
  success: true
  channel: string
}

// ============================================================================
// Block Builders (convenience)
// ============================================================================

export const SlackBlocks = {
  /**
   * Create a section block with text
   */
  section(text: string, markdown = true): SectionBlock {
    return {
      type: 'section',
      text: { type: markdown ? 'mrkdwn' : 'plain_text', text },
    }
  },

  /**
   * Create a section block with fields
   */
  fields(fields: string[], markdown = true): SectionBlock {
    return {
      type: 'section',
      fields: fields.map((text) => ({
        type: markdown ? 'mrkdwn' : 'plain_text',
        text,
      })),
    }
  },

  /**
   * Create a divider block
   */
  divider(): DividerBlock {
    return { type: 'divider' }
  },

  /**
   * Create a header block
   */
  header(text: string): HeaderBlock {
    return {
      type: 'header',
      text: { type: 'plain_text', text, emoji: true },
    }
  },

  /**
   * Create a context block
   */
  context(elements: string[]): ContextBlock {
    return {
      type: 'context',
      elements: elements.map((text) => ({ type: 'mrkdwn', text })),
    }
  },
}
