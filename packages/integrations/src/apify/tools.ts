/**
 * Apify AI SDK Tools
 * MCP-compatible tools for social media scraping
 */

import { tool } from "ai";
import { ApifyClient } from "./client.js";
import {
  GetDatasetInputSchema,
  GetRunStatusInputSchema,
  PLATFORM_ACTORS,
  RunActorInputSchema,
  ScrapeInstagramInputSchema,
  ScrapeLinkedInInputSchema,
  ScrapeThreadsInputSchema,
  ScrapeTikTokInputSchema,
  ScrapeTwitterInputSchema,
  ScrapeYouTubeInputSchema,
} from "./types.js";

export function createApifyTools(client: ApifyClient) {
  return {
    // ========================================================================
    // Generic Actor Execution
    // ========================================================================
    apify_run_actor: tool({
      description:
        "Run any Apify actor with custom input. Returns run ID and status. Use for actors not covered by platform-specific tools.",
      inputSchema: RunActorInputSchema,
      execute: async (params) => {
        const result = await client.runActor(params.actorId, params.input, {
          waitForFinish: params.waitForFinish,
          memoryMbytes: params.memoryMbytes,
          timeoutSecs: params.timeoutSecs,
        });
        if (!result.success) throw new Error(result.error.message);

        return {
          success: true,
          runId: result.data.data.id,
          status: result.data.data.status,
          datasetId: result.data.data.defaultDatasetId,
          message:
            result.data.data.status === "SUCCEEDED"
              ? "Actor completed. Use apify_get_dataset to fetch results."
              : "Actor is running. Use apify_get_run_status to check progress.",
        };
      },
    }),

    apify_get_run_status: tool({
      description: "Get the current status of an actor run.",
      inputSchema: GetRunStatusInputSchema,
      execute: async (params) => {
        const result = await client.getRunStatus(params.runId);
        if (!result.success) throw new Error(result.error.message);

        return {
          success: true,
          runId: result.data.data.id,
          status: result.data.data.status,
          datasetId: result.data.data.defaultDatasetId,
          stats: {
            durationSecs: Math.round(
              result.data.data.stats.durationMillis / 1000,
            ),
            computeUnits: result.data.data.stats.computeUnits,
          },
        };
      },
    }),

    apify_get_dataset: tool({
      description: "Fetch results from a completed actor run's dataset.",
      inputSchema: GetDatasetInputSchema,
      execute: async (params) => {
        const result = await client.getDataset(params.datasetId, {
          limit: params.limit,
          offset: params.offset,
        });
        if (!result.success) throw new Error(result.error.message);

        return {
          success: true,
          count: result.data.count,
          total: result.data.total,
          items: result.data.data,
        };
      },
    }),

    // ========================================================================
    // Platform-Specific Scrapers
    // ========================================================================
    apify_scrape_instagram: tool({
      description:
        "Scrape Instagram posts from a public profile. Returns posts with captions, likes, comments, and media URLs.",
      inputSchema: ScrapeInstagramInputSchema,
      execute: async (params) => {
        const result = await client.runActorAndGetResults<
          Record<string, unknown>
        >(
          PLATFORM_ACTORS.instagram,
          {
            usernames: [params.username],
            resultsLimit: params.resultsLimit,
            resultsType: params.resultsType,
          },
          { waitForFinish: 120, resultsLimit: params.resultsLimit },
        );
        if (!result.success) throw new Error(result.error.message);

        return {
          success: true,
          platform: "instagram",
          username: params.username,
          postCount: result.data.items.length,
          posts: result.data.items.map((item) => ({
            id: item.id,
            url: item.url,
            caption: item.caption,
            type: item.type,
            likes: item.likesCount,
            comments: item.commentsCount,
            timestamp: item.timestamp,
            displayUrl: item.displayUrl,
          })),
        };
      },
    }),

    apify_scrape_tiktok: tool({
      description:
        "Scrape TikTok videos from a public profile. Returns videos with descriptions, views, likes, and shares.",
      inputSchema: ScrapeTikTokInputSchema,
      execute: async (params) => {
        const result = await client.runActorAndGetResults<
          Record<string, unknown>
        >(
          PLATFORM_ACTORS.tiktok,
          {
            profiles: [params.username],
            resultsPerPage: params.resultsPerPage,
          },
          { waitForFinish: 120, resultsLimit: params.resultsPerPage },
        );
        if (!result.success) throw new Error(result.error.message);

        return {
          success: true,
          platform: "tiktok",
          username: params.username,
          videoCount: result.data.items.length,
          videos: result.data.items.map((item) => ({
            id: item.id,
            url: item.webVideoUrl,
            text: item.text,
            likes: item.diggCount,
            views: item.playCount,
            shares: item.shareCount,
            comments: item.commentCount,
            createTime: item.createTimeISO,
          })),
        };
      },
    }),

    apify_scrape_twitter: tool({
      description:
        "Scrape tweets from a public Twitter/X profile. Returns tweets with text, likes, retweets, and replies.",
      inputSchema: ScrapeTwitterInputSchema,
      execute: async (params) => {
        const result = await client.runActorAndGetResults<
          Record<string, unknown>
        >(
          PLATFORM_ACTORS.twitter,
          {
            twitterHandles: [params.username],
            maxTweets: params.maxTweets,
          },
          { waitForFinish: 120, resultsLimit: params.maxTweets },
        );
        if (!result.success) throw new Error(result.error.message);

        return {
          success: true,
          platform: "twitter",
          username: params.username,
          tweetCount: result.data.items.length,
          tweets: result.data.items.map((item) => ({
            id: item.id,
            url: item.url,
            text: item.text,
            likes: item.likeCount,
            retweets: item.retweetCount,
            replies: item.replyCount,
            createdAt: item.createdAt,
          })),
        };
      },
    }),

    apify_scrape_youtube: tool({
      description:
        "Scrape videos from a YouTube channel. Returns videos with titles, views, likes, and descriptions.",
      inputSchema: ScrapeYouTubeInputSchema,
      execute: async (params) => {
        const result = await client.runActorAndGetResults<
          Record<string, unknown>
        >(
          PLATFORM_ACTORS.youtube,
          {
            channelUrls: [params.channelUrl],
            maxResults: params.maxVideos,
          },
          { waitForFinish: 120, resultsLimit: params.maxVideos },
        );
        if (!result.success) throw new Error(result.error.message);

        return {
          success: true,
          platform: "youtube",
          channelUrl: params.channelUrl,
          videoCount: result.data.items.length,
          videos: result.data.items.map((item) => ({
            id: item.id,
            url: item.url,
            title: item.title,
            views: item.viewCount,
            likes: item.likeCount,
            comments: item.commentCount,
            uploadDate: item.uploadDate,
            duration: item.duration,
          })),
        };
      },
    }),

    apify_scrape_linkedin: tool({
      description:
        "Scrape posts from a LinkedIn profile. Returns posts with content, likes, comments, and shares.",
      inputSchema: ScrapeLinkedInInputSchema,
      execute: async (params) => {
        const result = await client.runActorAndGetResults<
          Record<string, unknown>
        >(
          PLATFORM_ACTORS.linkedin,
          {
            profileUrls: [params.profileUrl.replace(/\/$/, "")],
            maxPosts: params.maxPosts,
          },
          { waitForFinish: 120, resultsLimit: params.maxPosts },
        );
        if (!result.success) throw new Error(result.error.message);

        return {
          success: true,
          platform: "linkedin",
          profileUrl: params.profileUrl,
          postCount: result.data.items.length,
          posts: result.data.items.map((item) => {
            const engagement = item.engagement as
              | Record<string, number>
              | undefined;
            return {
              id: item.id,
              url: item.linkedinUrl,
              content: item.content,
              likes: engagement?.likes,
              comments: engagement?.comments,
              shares: engagement?.shares,
              postedAt: (item.postedAt as Record<string, unknown>)?.date,
            };
          }),
        };
      },
    }),

    apify_scrape_threads: tool({
      description:
        "Scrape posts from a Threads profile. Returns posts with text, likes, and comments.",
      inputSchema: ScrapeThreadsInputSchema,
      execute: async (params) => {
        const result = await client.runActorAndGetResults<
          Record<string, unknown>
        >(
          PLATFORM_ACTORS.threads,
          {
            username: params.username,
            maxPosts: params.maxPosts,
          },
          { waitForFinish: 120, resultsLimit: params.maxPosts },
        );
        if (!result.success) throw new Error(result.error.message);

        return {
          success: true,
          platform: "threads",
          username: params.username,
          postCount: result.data.items.length,
          posts: result.data.items.map((item) => ({
            id: item.thread_id,
            text: item.caption_text,
            likes: item.like_count,
            comments: item.comment_count,
            timestamp: item.taken_at,
          })),
        };
      },
    }),
  };
}

export type ApifyTools = ReturnType<typeof createApifyTools>;
