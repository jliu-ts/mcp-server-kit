/**
 * Crawlee/Crawler Worker Client
 *
 * Client for interacting with the self-hosted Crawler Worker on Cloudflare.
 * Replaces Firecrawl for all non-search scraping operations.
 */

import type { Result } from "../types.js";

// ============================================================================
// Types
// ============================================================================

export interface CrawlerConfig {
  baseUrl: string;
  apiKey: string;
}

export interface ScrapeParams {
  url: string;
  waitFor?: number;
  extractSelectors?: Record<string, string>;
  includeHtml?: boolean;
  includeScreenshot?: boolean;
}

export interface ScrapeResult {
  success: boolean;
  url: string;
  title: string;
  description: string;
  content: string;
  markdown?: string;
  html?: string;
  screenshot?: string;
  metadata: {
    author?: string;
    publishedDate?: string;
    modifiedDate?: string;
    ogImage?: string;
    canonicalUrl?: string;
    language?: string;
  };
  links: string[];
  images: string[];
  scrapeTimeMs: number;
}

export interface DiscoverParams {
  url: string;
  limit?: number;
}

export interface DiscoverResult {
  success: boolean;
  urls: string[];
  count: number;
}

// ============================================================================
// Client
// ============================================================================

export class CrawlerClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: CrawlerConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<Result<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Request failed" }));
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message:
              (error as { error?: string }).error || `HTTP ${response.status}`,
          },
        };
      }

      const data = (await response.json()) as T;
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Network error",
        },
      };
    }
  }

  /**
   * Scrape a single URL
   */
  async scrape(params: ScrapeParams): Promise<Result<ScrapeResult>> {
    return this.request<ScrapeResult>("/scrape", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Discover URLs from a site (sitemap or link crawling)
   */
  async discover(params: DiscoverParams): Promise<Result<DiscoverResult>> {
    return this.request<DiscoverResult>("/discover", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Health check
   */
  async health(): Promise<Result<{ status: string; service: string }>> {
    return this.request("/health", { method: "GET" });
  }
}
