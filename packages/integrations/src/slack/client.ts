/**
 * Slack Webhook Client
 *
 * Runtime-agnostic client for Slack Incoming Webhooks.
 * Works in Node.js, Edge runtimes, and Cloudflare Workers.
 *
 * @example
 * import { SlackClient, SlackBlocks } from '@trendingsociety/integrations/slack'
 *
 * const slack = new SlackClient({
 *   webhookUrl: process.env.SLACK_WEBHOOK_URL,
 * })
 *
 * // Simple message
 * await slack.sendMessage({ text: 'Hello from Jarvis!' })
 *
 * // Rich message with blocks
 * await slack.sendMessage({
 *   text: 'New order received',
 *   blocks: [
 *     SlackBlocks.header('New Order #1234'),
 *     SlackBlocks.section('*Customer:* John Doe'),
 *     SlackBlocks.fields(['*Total:* $99.00', '*Items:* 3']),
 *     SlackBlocks.divider(),
 *     SlackBlocks.context(['Processed by Jarvis']),
 *   ],
 * })
 */

import { ok, fail, type Result, type ClientConfig } from '../types.js'
import type { SendMessageParams, SendMessageResponse, Block } from './types.js'

// ============================================================================
// Configuration
// ============================================================================

export interface SlackClientConfig extends ClientConfig {
  /** Slack Incoming Webhook URL */
  webhookUrl: string
  /** Default channel (if webhook supports override) */
  defaultChannel?: string
  /** Default username */
  defaultUsername?: string
  /** Default icon emoji */
  defaultIconEmoji?: string
}

// ============================================================================
// Client Implementation
// ============================================================================

export class SlackClient {
  private webhookUrl: string
  private defaultChannel?: string
  private defaultUsername?: string
  private defaultIconEmoji?: string
  private timeout: number
  private fetchFn: typeof fetch
  private debug: boolean

  constructor(config: SlackClientConfig) {
    if (!config.webhookUrl) {
      throw new Error('SlackClient requires webhookUrl')
    }

    this.webhookUrl = config.webhookUrl
    this.defaultChannel = config.defaultChannel
    this.defaultUsername = config.defaultUsername
    this.defaultIconEmoji = config.defaultIconEmoji
    this.timeout = config.timeout ?? 10000
    // Bind fetch to globalThis to avoid "Illegal invocation" in Cloudflare Workers
    this.fetchFn = config.fetch ?? fetch.bind(globalThis)
    this.debug = config.debug ?? false
  }

  // --------------------------------------------------------------------------
  // Send Message
  // --------------------------------------------------------------------------

  async sendMessage(params: SendMessageParams): Promise<Result<SendMessageResponse>> {
    if (!params.text && (!params.blocks || params.blocks.length === 0)) {
      return fail('INVALID_PARAMS', 'Message requires either text or blocks')
    }

    // Build payload
    const payload: Record<string, unknown> = {
      unfurl_links: params.unfurlLinks ?? false,
      unfurl_media: params.unfurlMedia ?? false,
    }

    if (params.text) payload.text = params.text
    if (params.blocks) payload.blocks = params.blocks
    if (params.channel ?? this.defaultChannel) {
      payload.channel = params.channel ?? this.defaultChannel
    }
    if (params.username ?? this.defaultUsername) {
      payload.username = params.username ?? this.defaultUsername
    }
    if (params.iconEmoji ?? this.defaultIconEmoji) {
      payload.icon_emoji = params.iconEmoji ?? this.defaultIconEmoji
    }
    if (params.iconUrl) payload.icon_url = params.iconUrl

    if (this.debug) {
      console.log('[SlackClient] Sending message:', JSON.stringify(payload, null, 2))
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await this.fetchFn(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseText = await response.text()

      if (!response.ok) {
        return fail(
          'WEBHOOK_ERROR',
          `Slack webhook failed (${response.status}): ${responseText}`,
          response.status
        )
      }

      // Slack webhooks return "ok" on success
      if (responseText !== 'ok') {
        return fail('UNEXPECTED_RESPONSE', `Unexpected response: ${responseText}`)
      }

      return ok({
        success: true,
        channel: (params.channel ?? this.defaultChannel) || 'default webhook channel',
      })
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return fail('TIMEOUT', `Request timed out after ${this.timeout}ms`)
        }
        return fail('NETWORK_ERROR', error.message)
      }

      return fail('UNKNOWN_ERROR', String(error))
    }
  }

  // --------------------------------------------------------------------------
  // Convenience Methods
  // --------------------------------------------------------------------------

  /**
   * Send a simple text message
   */
  async send(text: string): Promise<Result<SendMessageResponse>> {
    return this.sendMessage({ text })
  }

  /**
   * Send a message with Block Kit blocks
   */
  async sendBlocks(blocks: Block[], fallbackText?: string): Promise<Result<SendMessageResponse>> {
    return this.sendMessage({
      text: fallbackText ?? 'Message from Jarvis',
      blocks,
    })
  }

  /**
   * Send an error alert
   */
  async sendError(
    title: string,
    error: string | Error,
    context?: Record<string, string>
  ): Promise<Result<SendMessageResponse>> {
    const errorMessage = error instanceof Error ? error.message : error
    const blocks: Block[] = [
      { type: 'header', text: { type: 'plain_text', text: `🚨 ${title}`, emoji: true } },
      { type: 'section', text: { type: 'mrkdwn', text: `\`\`\`${errorMessage}\`\`\`` } },
    ]

    if (context && Object.keys(context).length > 0) {
      const fields = Object.entries(context).map(([key, value]) => `*${key}:* ${value}`)
      blocks.push({
        type: 'section',
        fields: fields.map((text) => ({ type: 'mrkdwn', text })),
      })
    }

    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `_${new Date().toISOString()}_` }],
    })

    return this.sendMessage({
      text: `🚨 ${title}: ${errorMessage}`,
      blocks,
    })
  }

  /**
   * Send a success notification
   */
  async sendSuccess(
    title: string,
    message: string,
    context?: Record<string, string>
  ): Promise<Result<SendMessageResponse>> {
    const blocks: Block[] = [
      { type: 'header', text: { type: 'plain_text', text: `✅ ${title}`, emoji: true } },
      { type: 'section', text: { type: 'mrkdwn', text: message } },
    ]

    if (context && Object.keys(context).length > 0) {
      const fields = Object.entries(context).map(([key, value]) => `*${key}:* ${value}`)
      blocks.push({
        type: 'section',
        fields: fields.map((text) => ({ type: 'mrkdwn', text })),
      })
    }

    return this.sendMessage({
      text: `✅ ${title}: ${message}`,
      blocks,
    })
  }
}
