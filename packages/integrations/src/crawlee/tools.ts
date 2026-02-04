/**
 * Crawlee AI SDK Tools
 *
 * MCP-compatible tools for self-hosted web scraping.
 * Replaces Firecrawl tools after migration.
 *
 * Tool naming follows vendor namespace pattern: "crawler.*"
 */

import { tool } from "ai";
import { z } from "zod";
import type { CrawlerClient } from "./client.js";

// ============================================================================
// Input Schemas
// ============================================================================

export const ScrapeUrlInputSchema = z.object({
  url: z.string().url().describe("URL to scrape"),
  waitFor: z
    .number()
    .optional()
    .describe("Milliseconds to wait after page load for JS rendering"),
  includeHtml: z
    .boolean()
    .optional()
    .default(false)
    .describe("Include raw HTML in response"),
});

export const DiscoverUrlsInputSchema = z.object({
  url: z.string().url().describe("Base URL to discover pages from"),
  limit: z
    .number()
    .optional()
    .default(100)
    .describe("Maximum number of URLs to discover"),
});

export const BatchScrapeInputSchema = z.object({
  urls: z
    .array(z.string().url())
    .min(1)
    .max(10)
    .describe("URLs to scrape (max 10)"),
  waitFor: z
    .number()
    .optional()
    .describe("Milliseconds to wait after page load"),
});

// ============================================================================
// Tool Factory
// ============================================================================

/**
 * Create AI SDK tools for Crawler operations
 */
export function createCrawlerTools(client: CrawlerClient) {
  return {
    /**
     * Scrape a single URL with full content extraction
     * Replaces: firecrawl_scrape
     */
    "crawler.scrape_url": tool({
      description:
        "Scrape a single URL and extract content including title, description, text, metadata, links, and images. Uses browser rendering for JavaScript-heavy pages.",
      inputSchema: ScrapeUrlInputSchema,
      execute: async (params) => {
        const result = await client.scrape({
          url: params.url,
          waitFor: params.waitFor,
          includeHtml: params.includeHtml,
        });

        if (!result.success) {
          throw new Error(result.error.message);
        }

        return {
          success: true,
          url: result.data.url,
          title: result.data.title,
          description: result.data.description,
          content: result.data.content.slice(0, 10000), // Truncate for LLM context
          metadata: result.data.metadata,
          linksCount: result.data.links.length,
          imagesCount: result.data.images.length,
          scrapeTimeMs: result.data.scrapeTimeMs,
        };
      },
    }),

    /**
     * Discover URLs from a website (sitemap or link crawling)
     * Replaces: firecrawl_map
     */
    "crawler.discover_urls": tool({
      description:
        "Discover URLs from a website by checking sitemaps first, then crawling links. Useful for finding pages before scraping.",
      inputSchema: DiscoverUrlsInputSchema,
      execute: async (params) => {
        const result = await client.discover({
          url: params.url,
          limit: params.limit,
        });

        if (!result.success) {
          throw new Error(result.error.message);
        }

        return {
          success: true,
          count: result.data.count,
          urls: result.data.urls,
        };
      },
    }),

    /**
     * Scrape multiple URLs in sequence
     * Replaces: firecrawl_crawl (simplified version)
     */
    "crawler.batch_scrape": tool({
      description:
        "Scrape multiple URLs and return combined results. Use for crawling a set of known pages.",
      inputSchema: BatchScrapeInputSchema,
      execute: async (params) => {
        const results = [];
        const errors = [];

        for (const url of params.urls) {
          const result = await client.scrape({
            url,
            waitFor: params.waitFor,
          });

          if (result.success) {
            results.push({
              url: result.data.url,
              title: result.data.title,
              description: result.data.description,
              content: result.data.content.slice(0, 3000), // Smaller for batch
            });
          } else {
            errors.push({
              url,
              error: result.error.message,
            });
          }
        }

        return {
          success: true,
          totalRequested: params.urls.length,
          successCount: results.length,
          errorCount: errors.length,
          results,
          errors,
        };
      },
    }),
  };
}

// ============================================================================
// Type Exports
// ============================================================================

export type CrawlerTools = ReturnType<typeof createCrawlerTools>;
