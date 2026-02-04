/**
 * Tavily AI SDK Tools
 *
 * AI SDK 6 native tool definitions for Tavily AI-powered search.
 * Single source of truth - used by both MCP server and AI SDK agents.
 *
 * @example
 * import { createTavilyTools } from '@trendingsociety/integrations/tavily'
 * import { TavilyClient } from '@trendingsociety/integrations/tavily'
 *
 * const client = new TavilyClient({
 *   apiKey: process.env.TAVILY_API_KEY,
 * })
 * const tools = createTavilyTools(client)
 */

import { tool } from 'ai'
import { z } from 'zod'
import type { TavilyClient } from './client.js'

// ============================================================================
// Input Schemas (Zod)
// ============================================================================

export const SearchInputSchema = z.object({
  query: z.string().describe('Search query string'),
  search_depth: z
    .enum(['basic', 'advanced'])
    .optional()
    .default('basic')
    .describe('Search depth: basic (fast) or advanced (comprehensive)'),
  include_answer: z
    .boolean()
    .optional()
    .default(true)
    .describe('Include AI-generated answer in results'),
  include_raw_content: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include raw HTML content from pages'),
  include_images: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include relevant images in results'),
  max_results: z
    .number()
    .optional()
    .default(5)
    .describe('Maximum number of results to return (1-20)'),
  include_domains: z
    .array(z.string())
    .optional()
    .describe('Only include results from these domains'),
  exclude_domains: z
    .array(z.string())
    .optional()
    .describe('Exclude results from these domains'),
})

export const ExtractInputSchema = z.object({
  urls: z.array(z.string().url()).describe('URLs to extract content from'),
})

export const QuickSearchInputSchema = z.object({
  query: z.string().describe('Search query string'),
})

export const ResearchInputSchema = z.object({
  query: z.string().describe('Research topic or question'),
  max_results: z
    .number()
    .optional()
    .default(10)
    .describe('Maximum number of results (default: 10)'),
})

// ============================================================================
// Tool Factory
// ============================================================================

/**
 * Create AI SDK tools for Tavily search operations
 *
 * @param client - Initialized TavilyClient instance
 * @returns Object containing all Tavily tools
 */
export function createTavilyTools(client: TavilyClient) {
  return {
    tavily_search: tool({
      description:
        'Search the web using Tavily AI-optimized search. Returns structured results with optional AI-generated answer. Best for finding current information, news, or specific topics.',
      inputSchema: SearchInputSchema,
      execute: async (params) => {
        const result = await client.search(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    tavily_extract: tool({
      description:
        'Extract content from specific URLs. Useful for getting full article text, documentation, or page content from known sources.',
      inputSchema: ExtractInputSchema,
      execute: async (params) => {
        const result = await client.extract(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    tavily_quick_search: tool({
      description:
        'Quick web search with default settings. Optimized for speed with basic search depth and 5 results.',
      inputSchema: QuickSearchInputSchema,
      execute: async (params) => {
        const result = await client.quickSearch(params.query)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    tavily_research: tool({
      description:
        'Deep research search with comprehensive results. Takes longer but returns more thorough results with raw content. Use for in-depth analysis or complex topics.',
      inputSchema: ResearchInputSchema,
      execute: async (params) => {
        const result = await client.research(params.query, params.max_results)
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

export type TavilyTools = ReturnType<typeof createTavilyTools>
