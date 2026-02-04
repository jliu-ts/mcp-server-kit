/**
 * Tavily API Types
 *
 * Type definitions for Tavily Search API.
 * https://docs.tavily.com
 */

import { z } from 'zod'

// ============================================================================
// Search Parameters
// ============================================================================

export const SearchParamsSchema = z.object({
  /** The search query */
  query: z.string().min(1),
  /** Search depth: basic (faster) or advanced (more comprehensive) */
  search_depth: z.enum(['basic', 'advanced']).optional(),
  /** Include AI-generated answer summary */
  include_answer: z.boolean().optional(),
  /** Include raw HTML content from sources */
  include_raw_content: z.boolean().optional(),
  /** Include images in results */
  include_images: z.boolean().optional(),
  /** Maximum number of results (1-20) */
  max_results: z.number().min(1).max(20).optional(),
  /** Only include results from these domains */
  include_domains: z.array(z.string()).optional(),
  /** Exclude results from these domains */
  exclude_domains: z.array(z.string()).optional(),
})

export type SearchParams = z.input<typeof SearchParamsSchema>

// ============================================================================
// Search Result Types
// ============================================================================

export interface SearchResult {
  /** Title of the result */
  title: string
  /** URL of the source */
  url: string
  /** Snippet/excerpt from the content */
  content: string
  /** Relevance score (0-1) */
  score: number
  /** Raw HTML content (if include_raw_content was true) */
  raw_content?: string
  /** Published date if available */
  published_date?: string
}

export interface SearchImage {
  /** Image URL */
  url: string
  /** Image description/alt text */
  description?: string
}

export interface SearchResponse {
  /** AI-generated answer summary (if include_answer was true) */
  answer?: string
  /** Original search query */
  query: string
  /** How long the search took in seconds */
  response_time: number
  /** List of search results */
  results: SearchResult[]
  /** List of images (if include_images was true) */
  images?: SearchImage[]
  /** Follow-up questions suggested by the AI */
  follow_up_questions?: string[]
}

// ============================================================================
// Extract Parameters (for content extraction)
// ============================================================================

export const ExtractParamsSchema = z.object({
  /** URLs to extract content from */
  urls: z.array(z.string().url()).min(1).max(20),
})

export type ExtractParams = z.infer<typeof ExtractParamsSchema>

export interface ExtractedContent {
  /** Source URL */
  url: string
  /** Extracted raw content */
  raw_content: string
  /** Extraction status */
  status: 'success' | 'failed'
  /** Error message if failed */
  error?: string
}

export interface ExtractResponse {
  /** Results for each URL */
  results: ExtractedContent[]
  /** Total tokens used */
  response_time: number
}

