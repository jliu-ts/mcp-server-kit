/**
 * Perplexity AI SDK Tools
 * MCP-compatible tools for Perplexity AI search and chat
 */

import { tool } from 'ai'
import { PerplexityClient } from './client.js'
import {
  ChatInputSchema,
  SearchInputSchema,
  ListModelsInputSchema,
  GetUsageInputSchema,
} from './types.js'

export function createPerplexityTools(client: PerplexityClient) {
  return {
    // ========================================================================
    // Chat
    // ========================================================================
    perplexity_chat: tool({
      description:
        'Chat with Perplexity AI. Online models include real-time web search in responses.',
      inputSchema: ChatInputSchema,
      execute: async (params) => {
        const result = await client.chat({
          model: params.model,
          messages: params.messages,
          max_tokens: params.max_tokens,
          temperature: params.temperature,
          return_related_questions: params.return_related_questions,
        })
        if (!result.success) throw new Error(result.error.message)

        const response = result.data
        return {
          id: response.id,
          model: response.model,
          content: response.choices[0]?.message.content ?? '',
          citations: response.citations,
          related_questions: response.related_questions,
          usage: response.usage,
        }
      },
    }),

    // ========================================================================
    // Search
    // ========================================================================
    perplexity_search: tool({
      description:
        'Search the web using Perplexity AI. Returns AI-synthesized answer with citations.',
      inputSchema: SearchInputSchema,
      execute: async (params) => {
        const result = await client.search(params.query, {
          model: params.model,
          search_recency_filter: params.search_recency_filter,
          search_domain_filter: params.search_domain_filter,
        })
        if (!result.success) throw new Error(result.error.message)

        const response = result.data
        return {
          query: params.query,
          answer: response.choices[0]?.message.content ?? '',
          citations: response.citations ?? [],
          model: response.model,
          related_questions: response.related_questions,
        }
      },
    }),

    // ========================================================================
    // Models
    // ========================================================================
    perplexity_list_models: tool({
      description: 'List available Perplexity AI models.',
      inputSchema: ListModelsInputSchema,
      execute: async () => {
        const models = client.listModels()
        return {
          count: models.length,
          models: models.map((m) => ({
            id: m.id,
            name: m.name,
            context_length: m.context_length,
            has_online_search: m.online,
          })),
        }
      },
    }),

    // ========================================================================
    // Usage (placeholder - API may add this later)
    // ========================================================================
    perplexity_get_usage: tool({
      description: 'Get API usage statistics (placeholder - check Perplexity dashboard).',
      inputSchema: GetUsageInputSchema,
      execute: async () => {
        return {
          message:
            'Usage statistics are available in the Perplexity dashboard at https://www.perplexity.ai/settings/api',
          note: 'API endpoint for usage stats is not currently available',
        }
      },
    }),
  }
}

export type PerplexityTools = ReturnType<typeof createPerplexityTools>
