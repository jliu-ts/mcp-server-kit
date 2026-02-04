/**
 * Perplexity AI Integration
 *
 * @example
 * ```typescript
 * import { PerplexityClient, createPerplexityTools } from '@trendingsociety/integrations/perplexity'
 *
 * const client = new PerplexityClient({ apiKey: process.env.PERPLEXITY_API_KEY })
 * const tools = createPerplexityTools(client)
 *
 * // Search the web
 * const result = await tools.perplexity_search.execute({
 *   query: 'What are the latest AI developments?',
 *   search_recency_filter: 'week',
 * })
 *
 * // Chat with context
 * const chat = await tools.perplexity_chat.execute({
 *   model: 'llama-3.1-sonar-large-128k-online',
 *   messages: [
 *     { role: 'user', content: 'Explain quantum computing' },
 *   ],
 * })
 * ```
 */

export { PerplexityClient, type PerplexityClientConfig } from './client.js'
export { createPerplexityTools, type PerplexityTools } from './tools.js'
export {
  // Schemas
  ChatInputSchema,
  SearchInputSchema,
  ListModelsInputSchema,
  GetUsageInputSchema,
  // Constants
  PERPLEXITY_MODELS,
  // Types
  type PerplexityConfig,
  type PerplexityModel,
  type ChatMessage,
  type ChatCompletionParams,
  type ChatCompletion,
} from './types.js'
