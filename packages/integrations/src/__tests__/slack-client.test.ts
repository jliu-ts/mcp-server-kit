/**
 * @trendingsociety/integrations - Slack Client Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SlackClient } from '../slack/client.js'

describe('SlackClient', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('constructor', () => {
    it('should require webhookUrl', () => {
      expect(() => new SlackClient({ webhookUrl: '' })).toThrow('webhookUrl')
    })

    it('should accept valid configuration', () => {
      const client = new SlackClient({
        webhookUrl: 'https://hooks.slack.com/test',
        defaultChannel: '#general',
        defaultUsername: 'Bot',
        defaultIconEmoji: ':robot_face:',
      })

      expect(client).toBeDefined()
    })
  })

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'ok',
      })

      const client = new SlackClient({
        webhookUrl: 'https://hooks.slack.com/test',
        fetch: mockFetch,
      })

      const result = await client.sendMessage({ text: 'Hello!' })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.success).toBe(true)
      }
    })

    it('should require text or blocks', async () => {
      const client = new SlackClient({
        webhookUrl: 'https://hooks.slack.com/test',
      })

      const result = await client.sendMessage({})

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_PARAMS')
      }
    })

    it('should send message with blocks', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'ok',
      })

      const client = new SlackClient({
        webhookUrl: 'https://hooks.slack.com/test',
        fetch: mockFetch,
      })

      const result = await client.sendMessage({
        blocks: [
          { type: 'section', text: { type: 'mrkdwn', text: 'Hello' } },
        ],
      })

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('blocks'),
        })
      )
    })

    it('should include default channel when set', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'ok',
      })

      const client = new SlackClient({
        webhookUrl: 'https://hooks.slack.com/test',
        defaultChannel: '#alerts',
        fetch: mockFetch,
      })

      await client.sendMessage({ text: 'Test' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: expect.stringContaining('#alerts'),
        })
      )
    })

    it('should handle webhook errors', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'invalid_token',
      })

      const client = new SlackClient({
        webhookUrl: 'https://hooks.slack.com/test',
        fetch: mockFetch,
      })

      const result = await client.sendMessage({ text: 'Test' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('WEBHOOK_ERROR')
        expect(result.error.status).toBe(403)
      }
    })

    it('should handle unexpected response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'not_ok',
      })

      const client = new SlackClient({
        webhookUrl: 'https://hooks.slack.com/test',
        fetch: mockFetch,
      })

      const result = await client.sendMessage({ text: 'Test' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('UNEXPECTED_RESPONSE')
      }
    })

    it('should handle timeout', async () => {
      const mockFetch = vi.fn().mockImplementation(async () => {
        const error = new Error('Aborted')
        error.name = 'AbortError'
        throw error
      })

      const client = new SlackClient({
        webhookUrl: 'https://hooks.slack.com/test',
        fetch: mockFetch,
        timeout: 100,
      })

      const result = await client.sendMessage({ text: 'Test' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('TIMEOUT')
      }
    })

    it('should handle network errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const client = new SlackClient({
        webhookUrl: 'https://hooks.slack.com/test',
        fetch: mockFetch,
      })

      const result = await client.sendMessage({ text: 'Test' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('NETWORK_ERROR')
      }
    })

    it('should handle non-Error exceptions', async () => {
      const mockFetch = vi.fn().mockRejectedValue('string error')

      const client = new SlackClient({
        webhookUrl: 'https://hooks.slack.com/test',
        fetch: mockFetch,
      })

      const result = await client.sendMessage({ text: 'Test' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR')
      }
    })
  })

  describe('send', () => {
    it('should send simple text message', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'ok',
      })

      const client = new SlackClient({
        webhookUrl: 'https://hooks.slack.com/test',
        fetch: mockFetch,
      })

      const result = await client.send('Hello!')

      expect(result.success).toBe(true)
    })
  })

  describe('sendBlocks', () => {
    it('should send blocks with fallback text', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'ok',
      })

      const client = new SlackClient({
        webhookUrl: 'https://hooks.slack.com/test',
        fetch: mockFetch,
      })

      const result = await client.sendBlocks(
        [{ type: 'section', text: { type: 'mrkdwn', text: 'Hello' } }],
        'Fallback text'
      )

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: expect.stringContaining('Fallback text'),
        })
      )
    })
  })

  describe('sendError', () => {
    it('should send error alert', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'ok',
      })

      const client = new SlackClient({
        webhookUrl: 'https://hooks.slack.com/test',
        fetch: mockFetch,
      })

      const result = await client.sendError('API Error', 'Connection failed')

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: expect.stringContaining('API Error'),
        })
      )
    })

    it('should handle Error objects', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'ok',
      })

      const client = new SlackClient({
        webhookUrl: 'https://hooks.slack.com/test',
        fetch: mockFetch,
      })

      const result = await client.sendError('Exception', new Error('Test error'))

      expect(result.success).toBe(true)
    })

    it('should include context in error alert', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'ok',
      })

      const client = new SlackClient({
        webhookUrl: 'https://hooks.slack.com/test',
        fetch: mockFetch,
      })

      const result = await client.sendError('Error', 'Test', {
        service: 'API',
        endpoint: '/users',
      })

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: expect.stringContaining('service'),
        })
      )
    })
  })

  describe('sendSuccess', () => {
    it('should send success notification', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'ok',
      })

      const client = new SlackClient({
        webhookUrl: 'https://hooks.slack.com/test',
        fetch: mockFetch,
      })

      const result = await client.sendSuccess('Deployment', 'v1.2.3 deployed')

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: expect.stringContaining('Deployment'),
        })
      )
    })

    it('should include context in success notification', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'ok',
      })

      const client = new SlackClient({
        webhookUrl: 'https://hooks.slack.com/test',
        fetch: mockFetch,
      })

      const result = await client.sendSuccess('Deploy', 'Complete', {
        version: 'v1.2.3',
        env: 'production',
      })

      expect(result.success).toBe(true)
    })
  })
})
