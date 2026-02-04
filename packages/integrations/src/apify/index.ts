/**
 * Apify Integration
 *
 * @example
 * import { ApifyClient, createApifyTools } from '@trendingsociety/integrations/apify'
 *
 * const apify = new ApifyClient({ apiKey: process.env.APIFY_TOKEN })
 *
 * // Run a scrape
 * const result = await apify.runActorAndGetResults('apify/instagram-scraper', {
 *   usernames: ['nike'],
 *   resultsLimit: 10,
 * })
 *
 * // Or use MCP tools (for LLM agents)
 * const tools = createApifyTools(apify)
 * await tools.apify_scrape_instagram.execute({ username: 'nike', resultsLimit: 10 })
 */

// Core client
export { ApifyClient, type ApifyClientConfig } from "./client.js";

// AI SDK Tools (Single source of truth for MCP + Agents)
export { createApifyTools, type ApifyTools } from "./tools.js";

// Types
export * from "./types.js";
