/**
 * @trendingsociety/integrations - Types Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ok, fail, graphqlRequest, type Result } from '../types.js'

describe('Result Helpers', () => {
  describe('ok', () => {
    it('should create success result with data', () => {
      const result = ok({ name: 'Test' })

      expect(result.success).toBe(true)
      expect(result).toEqual({ success: true, data: { name: 'Test' } })
    })

    it('should work with primitive types', () => {
      expect(ok('test')).toEqual({ success: true, data: 'test' })
      expect(ok(123)).toEqual({ success: true, data: 123 })
      expect(ok(true)).toEqual({ success: true, data: true })
    })

    it('should work with arrays', () => {
      const result = ok([1, 2, 3])

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual([1, 2, 3])
      }
    })
  })

  describe('fail', () => {
    it('should create failure result with error', () => {
      const result = fail('TEST_ERROR', 'Something went wrong')

      expect(result.success).toBe(false)
      expect(result).toEqual({
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'Something went wrong',
          status: undefined,
          details: undefined,
        },
      })
    })

    it('should include status code', () => {
      const result = fail('NOT_FOUND', 'Resource not found', 404)

      if (!result.success) {
        expect(result.error.status).toBe(404)
      }
    })

    it('should include details', () => {
      const result = fail('VALIDATION', 'Invalid input', 400, { field: 'name' })

      if (!result.success) {
        expect(result.error.details).toEqual({ field: 'name' })
      }
    })
  })
})

describe('graphqlRequest', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('should make successful GraphQL request', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { users: [{ id: '1' }] } }),
    })

    const result = await graphqlRequest<{ users: { id: string }[] }>(
      'https://api.example.com/graphql',
      'query { users { id } }',
      undefined,
      { Authorization: 'Bearer token' },
      mockFetch
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.users).toEqual([{ id: '1' }])
    }

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token',
        },
      })
    )
  })

  it('should include variables in request', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { user: { id: '1' } } }),
    })

    await graphqlRequest(
      'https://api.example.com/graphql',
      'query GetUser($id: ID!) { user(id: $id) { id } }',
      { id: '123' },
      {},
      mockFetch
    )

    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: JSON.stringify({
          query: 'query GetUser($id: ID!) { user(id: $id) { id } }',
          variables: { id: '123' },
        }),
      })
    )
  })

  it('should handle HTTP error responses', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    })

    const result = await graphqlRequest(
      'https://api.example.com/graphql',
      'query { users { id } }',
      undefined,
      {},
      mockFetch
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('HTTP_ERROR')
      expect(result.error.status).toBe(500)
    }
  })

  it('should handle GraphQL errors', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: null,
        errors: [
          { message: 'Field not found', path: ['user', 'email'] },
          { message: 'Unauthorized' },
        ],
      }),
    })

    const result = await graphqlRequest(
      'https://api.example.com/graphql',
      'query { user { email } }',
      undefined,
      {},
      mockFetch
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('GRAPHQL_ERROR')
      expect(result.error.message).toContain('Field not found')
      expect(result.error.message).toContain('Unauthorized')
    }
  })

  it('should handle missing data in response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    const result = await graphqlRequest(
      'https://api.example.com/graphql',
      'query { users { id } }',
      undefined,
      {},
      mockFetch
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('NO_DATA')
    }
  })

  it('should handle timeout', async () => {
    const mockFetch = vi.fn().mockImplementation(async () => {
      const error = new Error('Aborted')
      error.name = 'AbortError'
      throw error
    })

    const result = await graphqlRequest(
      'https://api.example.com/graphql',
      'query { users { id } }',
      undefined,
      {},
      mockFetch,
      100
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('TIMEOUT')
    }
  })

  it('should handle network errors', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network failure'))

    const result = await graphqlRequest(
      'https://api.example.com/graphql',
      'query { users { id } }',
      undefined,
      {},
      mockFetch
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('NETWORK_ERROR')
      expect(result.error.message).toBe('Network failure')
    }
  })

  it('should handle non-Error exceptions', async () => {
    const mockFetch = vi.fn().mockRejectedValue('string error')

    const result = await graphqlRequest(
      'https://api.example.com/graphql',
      'query { users { id } }',
      undefined,
      {},
      mockFetch
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('UNKNOWN_ERROR')
    }
  })
})
