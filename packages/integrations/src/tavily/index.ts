/**
 * Tavily Integration
 *
 * @example
 * import { TavilyClient, createTavilyTools } from '@trendingsociety/integrations/tavily'
 *
 * const tavily = new TavilyClient({
 *   apiKey: process.env.TAVILY_API_KEY,
 * })
 *
 * // Quick search
 * const result = await tavily.quickSearch('AI trends 2025')
 *
 * // Deep research
 * const result = await tavily.research('React performance optimization')
 *
 * // Or use AI SDK tools
 * const tools = createTavilyTools(tavily)
 */

export { TavilyClient, type TavilyClientConfig } from './client.js'
export * from './types.js'
export {
  createTavilyTools,
  SearchInputSchema,
  ExtractInputSchema,
  QuickSearchInputSchema,
  ResearchInputSchema,
  type TavilyTools,
} from './tools.js'

