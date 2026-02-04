/**
 * Anthropic Claude AI SDK Tools
 * MCP-compatible tools for Anthropic API operations
 */

import { tool } from 'ai'
import { AnthropicClient } from './client.js'
import {
  CreateMessageInputSchema,
  CountTokensInputSchema,
  ListModelsInputSchema,
  CreateBatchInputSchema,
  GetBatchInputSchema,
  ListBatchesInputSchema,
  CancelBatchInputSchema,
} from './types.js'

export function createAnthropicTools(client: AnthropicClient) {
  return {
    // ========================================================================
    // Messages
    // ========================================================================
    anthropic_create_message: tool({
      description:
        'Create a message using Claude. Supports Claude 3.5 Sonnet, Claude 3.5 Haiku, and other models.',
      inputSchema: CreateMessageInputSchema,
      execute: async (params) => {
        const result = await client.createMessage({
          model: params.model,
          messages: params.messages,
          system: params.system,
          max_tokens: params.max_tokens,
          temperature: params.temperature,
        })
        if (!result.success) throw new Error(result.error.message)

        // Extract text content
        const textContent = result.data.content
          .filter((c) => c.type === 'text')
          .map((c) => c.text)
          .join('')

        return {
          id: result.data.id,
          model: result.data.model,
          content: textContent,
          stop_reason: result.data.stop_reason,
          usage: result.data.usage,
        }
      },
    }),

    // ========================================================================
    // Token Counting
    // ========================================================================
    anthropic_count_tokens: tool({
      description:
        'Count the number of tokens in a message before sending. Useful for estimating costs and managing context.',
      inputSchema: CountTokensInputSchema,
      execute: async (params) => {
        const result = await client.countTokens({
          model: params.model,
          messages: params.messages,
          system: params.system,
        })
        if (!result.success) throw new Error(result.error.message)
        return {
          input_tokens: result.data.input_tokens,
        }
      },
    }),

    // ========================================================================
    // Models
    // ========================================================================
    anthropic_list_models: tool({
      description: 'List available Claude models including Claude 3.5 Sonnet, Haiku, and Opus.',
      inputSchema: ListModelsInputSchema,
      execute: async (params) => {
        const result = await client.listModels(params.limit)
        if (!result.success) throw new Error(result.error.message)
        return {
          count: result.data.data.length,
          has_more: result.data.has_more,
          models: result.data.data.map((m) => ({
            id: m.id,
            display_name: m.display_name,
            created_at: m.created_at,
          })),
        }
      },
    }),

    // ========================================================================
    // Message Batches
    // ========================================================================
    anthropic_create_batch: tool({
      description:
        'Create a batch of messages to process asynchronously. Up to 50% cheaper than individual messages.',
      inputSchema: CreateBatchInputSchema,
      execute: async (params) => {
        const requests = params.requests.map((r) => ({
          custom_id: r.custom_id,
          params: {
            model: r.model,
            messages: r.messages,
            max_tokens: r.max_tokens,
            system: r.system,
          },
        }))
        const result = await client.createBatch({ requests })
        if (!result.success) throw new Error(result.error.message)
        return {
          id: result.data.id,
          status: result.data.processing_status,
          request_counts: result.data.request_counts,
          created_at: result.data.created_at,
          expires_at: result.data.expires_at,
        }
      },
    }),

    anthropic_get_batch: tool({
      description: 'Get the status and results of a message batch.',
      inputSchema: GetBatchInputSchema,
      execute: async (params) => {
        const result = await client.getBatch(params.batch_id)
        if (!result.success) throw new Error(result.error.message)
        return {
          id: result.data.id,
          status: result.data.processing_status,
          request_counts: result.data.request_counts,
          created_at: result.data.created_at,
          ended_at: result.data.ended_at,
          results_url: result.data.results_url,
        }
      },
    }),

    anthropic_list_batches: tool({
      description: 'List all message batches and their status.',
      inputSchema: ListBatchesInputSchema,
      execute: async (params) => {
        const result = await client.listBatches(params.limit)
        if (!result.success) throw new Error(result.error.message)
        return {
          count: result.data.data.length,
          has_more: result.data.has_more,
          batches: result.data.data.map((b) => ({
            id: b.id,
            status: b.processing_status,
            request_counts: b.request_counts,
            created_at: b.created_at,
            ended_at: b.ended_at,
          })),
        }
      },
    }),

    anthropic_cancel_batch: tool({
      description: 'Cancel a message batch that is still processing.',
      inputSchema: CancelBatchInputSchema,
      execute: async (params) => {
        const result = await client.cancelBatch(params.batch_id)
        if (!result.success) throw new Error(result.error.message)
        return {
          id: result.data.id,
          status: result.data.processing_status,
          cancel_initiated_at: result.data.cancel_initiated_at,
        }
      },
    }),
  }
}

export type AnthropicTools = ReturnType<typeof createAnthropicTools>
