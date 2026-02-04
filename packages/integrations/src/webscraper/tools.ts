// @ts-nocheck
/**
 * WebScraper AI SDK Tools
 *
 * Tools for web scraping and content extraction.
 */

import { tool } from 'ai'
import { z } from 'zod'
import type { WebScraperClient } from './client.js'

// ============================================================================
// Input Schemas
// ============================================================================

export const FetchPageInputSchema = z.object({
  url: z.string().url().describe('URL to fetch and parse'),
  includeHtml: z.boolean().optional().default(false).describe('Include raw HTML in response'),
})

export const ExtractTextInputSchema = z.object({
  url: z.string().url().describe('URL to extract text from'),
  includeLinks: z.boolean().optional().default(false).describe('Include links in the response'),
  maxLength: z.number().optional().describe('Maximum characters to return'),
})

export const ExtractLinksInputSchema = z.object({
  url: z.string().url().describe('URL to extract links from'),
  externalOnly: z.boolean().optional().default(false).describe('Only return external links'),
  pattern: z.string().optional().describe('Regex pattern to filter links'),
})

export const ExtractMetadataInputSchema = z.object({
  url: z.string().url().describe('URL to extract metadata from'),
})

export const BatchFetchInputSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(20).describe('URLs to fetch (max 20)'),
  concurrency: z.number().optional().default(5).describe('Number of concurrent requests'),
})

// ============================================================================
// Tool Factory
// ============================================================================

/**
 * Create AI SDK tools for web scraping operations
 */
export function createWebScraperTools(client: WebScraperClient) {
  return {
    web_fetch_page: tool({
      description:
        'Fetch a web page and extract structured content including title, description, text, links, and images.',
      inputSchema: FetchPageInputSchema,
      execute: async (params) => {
        const result = await client.fetchPage({ url: params.url })
        if (!result.success) {
          throw new Error(result.error.message)
        }
        // Remove raw HTML unless requested
        if (!params.includeHtml) {
          delete result.data.html
        }
        return result.data
      },
    }),

    web_extract_text: tool({
      description:
        'Extract just the main text content from a web page. Useful for reading articles or documentation.',
      inputSchema: ExtractTextInputSchema,
      execute: async (params) => {
        const result = await client.extractText(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    web_extract_links: tool({
      description:
        'Extract all links from a web page. Can filter by external-only or regex pattern.',
      inputSchema: ExtractLinksInputSchema,
      execute: async (params) => {
        const result = await client.extractLinks(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return { links: result.data, count: result.data.length }
      },
    }),

    web_extract_metadata: tool({
      description:
        'Extract metadata from a web page including Open Graph, Twitter cards, canonical URL, author, and dates.',
      inputSchema: ExtractMetadataInputSchema,
      execute: async (params) => {
        const result = await client.extractMetadata(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    web_batch_fetch: tool({
      description:
        'Fetch multiple web pages in parallel. Returns successful fetches and any failures.',
      inputSchema: BatchFetchInputSchema,
      execute: async (params) => {
        const result = await client.batchFetch(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        // Remove HTML from batch results
        result.data.successful.forEach((page) => {
          delete page.html
        })
        return {
          ...result.data,
          successCount: result.data.successful.length,
          failCount: result.data.failed.length,
        }
      },
    }),
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type WebScraperTools = ReturnType<typeof createWebScraperTools>
