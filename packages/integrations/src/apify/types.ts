/**
 * Apify API Types
 * https://docs.apify.com/api/v2
 */

import { z } from "zod";

// ============================================================================
// Actor Run Types
// ============================================================================

export interface ActorRunResponse {
  data: {
    id: string;
    actId: string;
    userId: string;
    startedAt: string;
    finishedAt: string | null;
    status:
      | "READY"
      | "RUNNING"
      | "SUCCEEDED"
      | "FAILED"
      | "ABORTING"
      | "ABORTED"
      | "TIMED-OUT";
    statusMessage: string | null;
    isStatusMessageTerminal: boolean;
    meta: {
      origin: string;
      userAgent: string;
    };
    stats: {
      inputBodyLen: number;
      restartCount: number;
      resurrectCount: number;
      memAvgBytes: number;
      memMaxBytes: number;
      memCurrentBytes: number;
      cpuAvgUsage: number;
      cpuMaxUsage: number;
      cpuCurrentUsage: number;
      netRxBytes: number;
      netTxBytes: number;
      durationMillis: number;
      runTimeSecs: number;
      metamorph: number;
      computeUnits: number;
    };
    options: {
      build: string;
      timeoutSecs: number;
      memoryMbytes: number;
    };
    buildId: string;
    defaultKeyValueStoreId: string;
    defaultDatasetId: string;
    defaultRequestQueueId: string;
    containerUrl: string;
  };
}

export interface DatasetItemsResponse<T = unknown> {
  data: T[];
  total: number;
  offset: number;
  count: number;
  limit: number;
  desc: boolean;
}

// ============================================================================
// Actor Discovery Types
// ============================================================================

export interface ActorSummary {
  id: string;
  name: string;
  username: string;
  title: string;
  description?: string;
  stats?: {
    totalRuns?: number;
    totalUsers?: number;
    lastRunStartedAt?: string;
  };
}

export interface ActorSearchResponse {
  data: ActorSummary[];
  total: number;
  offset: number;
  count: number;
  limit: number;
}

export interface ActorDetailsResponse {
  data: {
    id: string;
    name: string;
    username: string;
    title: string;
    description?: string;
    readme?: string;
    stats?: {
      totalRuns?: number;
      totalUsers?: number;
      lastRunStartedAt?: string;
    };
    version?: {
      versionNumber: string;
      inputSchema?: Record<string, unknown>;
      buildTag?: string;
    };
    pricingInfo?: {
      pricingModel?: string;
      pricePerUnitUsd?: number;
    };
  };
}

// ============================================================================
// Input Schemas (Zod for AI SDK tools)
// ============================================================================

// -- Actor Discovery --
export const SearchActorsInputSchema = z.object({
  query: z.string().describe("Search query for finding actors in Apify Store"),
  limit: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum number of actors to return"),
  category: z
    .string()
    .optional()
    .describe("Filter by category (e.g., 'SCRAPING', 'AUTOMATION')"),
});

export const FetchActorDetailsInputSchema = z.object({
  actorId: z
    .string()
    .describe("Actor ID (e.g., 'apify/instagram-scraper' or 'abc123')"),
});

// -- Actor Execution --
export const RunActorInputSchema = z.object({
  actorId: z
    .string()
    .describe("Apify actor ID (e.g., 'apify/instagram-scraper')"),
  input: z
    .record(z.unknown())
    .optional()
    .describe("Actor-specific input parameters"),
  waitForFinish: z
    .number()
    .optional()
    .default(120)
    .describe("Seconds to wait for completion (0 = don't wait)"),
  memoryMbytes: z.number().optional().describe("Memory allocation in MB"),
  timeoutSecs: z
    .number()
    .optional()
    .describe("Maximum execution time in seconds"),
});

export const GetRunStatusInputSchema = z.object({
  runId: z.string().describe("Actor run ID returned from call_actor"),
});

export const GetActorLogInputSchema = z.object({
  runId: z.string().describe("Actor run ID to get logs for"),
});

// -- Storage --
export const GetDatasetInputSchema = z.object({
  datasetId: z.string().describe("Dataset ID from completed run"),
  limit: z.number().optional().default(100).describe("Maximum items to return"),
  offset: z.number().optional().default(0).describe("Starting offset"),
});

// -- Platform Scrapers --
export const ScrapeInstagramInputSchema = z.object({
  username: z.string().describe("Instagram username to scrape (without @)"),
  resultsLimit: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum posts to fetch"),
  resultsType: z
    .enum(["posts", "reels", "stories"])
    .optional()
    .default("posts")
    .describe("Type of content to scrape"),
});

export const ScrapeTikTokInputSchema = z.object({
  username: z.string().describe("TikTok username to scrape (without @)"),
  resultsPerPage: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum videos to fetch"),
});

export const ScrapeTwitterInputSchema = z.object({
  username: z.string().describe("Twitter/X username to scrape (without @)"),
  maxTweets: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum tweets to fetch"),
});

export const ScrapeYouTubeInputSchema = z.object({
  channelUrl: z.string().describe("YouTube channel URL"),
  maxVideos: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum videos to fetch"),
});

export const ScrapeLinkedInInputSchema = z.object({
  profileUrl: z.string().describe("LinkedIn profile URL"),
  maxPosts: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum posts to fetch"),
});

export const ScrapeThreadsInputSchema = z.object({
  username: z.string().describe("Threads username to scrape (without @)"),
  maxPosts: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum posts to fetch"),
});

// ============================================================================
// Platform Actor IDs
// ============================================================================

export const PLATFORM_ACTORS = {
  instagram: "apify/instagram-scraper",
  tiktok: "clockworks/tiktok-scraper",
  twitter: "apidojo/twitter-scraper-lite",
  youtube: "streamers/youtube-channel-scraper",
  linkedin: "harvestapi/linkedin-profile-posts",
  threads: "igview-owner/threads-scraper-pro",
} as const;

export type SupportedPlatform = keyof typeof PLATFORM_ACTORS;
