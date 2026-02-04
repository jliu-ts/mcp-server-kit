/**
 * Apify API Client
 * https://docs.apify.com/api/v2
 */

import { fail, ok, type ClientConfig, type Result } from "../types.js";
import type { ActorRunResponse, DatasetItemsResponse } from "./types.js";

export interface ApifyClientConfig extends ClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export class ApifyClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private fetchFn: typeof fetch;

  constructor(config: ApifyClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://api.apify.com/v2";
    this.timeout = config.timeout ?? 120000; // 2 minutes default
    this.fetchFn = config.fetch ?? fetch.bind(globalThis);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<Result<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

      const response = await this.fetchFn(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return fail(
          "APIFY_API_ERROR",
          error.error?.message || `HTTP ${response.status}`,
          response.status,
        );
      }

      const data = await response.json();
      return ok(data as T);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        return fail("TIMEOUT", "Request timed out", 408);
      }
      return fail(
        "NETWORK_ERROR",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  // ============================================================================
  // Actor Runs
  // ============================================================================

  /**
   * Start an actor run
   */
  async runActor(
    actorId: string,
    input?: Record<string, unknown>,
    options?: {
      waitForFinish?: number;
      memoryMbytes?: number;
      timeoutSecs?: number;
    },
  ): Promise<Result<ActorRunResponse>> {
    const queryParams = new URLSearchParams();
    if (options?.waitForFinish !== undefined) {
      queryParams.set("waitForFinish", options.waitForFinish.toString());
    }
    if (options?.memoryMbytes !== undefined) {
      queryParams.set("memory", options.memoryMbytes.toString());
    }
    if (options?.timeoutSecs !== undefined) {
      queryParams.set("timeout", options.timeoutSecs.toString());
    }

    const query = queryParams.toString();
    const endpoint = `/acts/${actorId}/runs${query ? `?${query}` : ""}`;

    return this.request<ActorRunResponse>(endpoint, {
      method: "POST",
      body: input ? JSON.stringify(input) : undefined,
    });
  }

  /**
   * Get run status
   */
  async getRunStatus(runId: string): Promise<Result<ActorRunResponse>> {
    return this.request<ActorRunResponse>(`/actor-runs/${runId}`);
  }

  /**
   * Wait for run to complete (polls status)
   */
  async waitForRun(
    runId: string,
    maxWaitSecs: number = 300,
    pollIntervalMs: number = 2000,
  ): Promise<Result<ActorRunResponse>> {
    const startTime = Date.now();
    const maxWaitMs = maxWaitSecs * 1000;

    while (Date.now() - startTime < maxWaitMs) {
      const result = await this.getRunStatus(runId);
      if (!result.success) return result;

      const status = result.data.data.status;
      if (
        status === "SUCCEEDED" ||
        status === "FAILED" ||
        status === "ABORTED" ||
        status === "TIMED-OUT"
      ) {
        return result;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    return fail(
      "TIMEOUT",
      `Run did not complete within ${maxWaitSecs} seconds`,
    );
  }

  // ============================================================================
  // Datasets
  // ============================================================================

  /**
   * Get dataset items
   */
  async getDataset<T = unknown>(
    datasetId: string,
    options?: {
      limit?: number;
      offset?: number;
      format?: "json" | "csv" | "xlsx";
    },
  ): Promise<Result<DatasetItemsResponse<T>>> {
    const queryParams = new URLSearchParams();
    if (options?.limit !== undefined) {
      queryParams.set("limit", options.limit.toString());
    }
    if (options?.offset !== undefined) {
      queryParams.set("offset", options.offset.toString());
    }
    queryParams.set("format", options?.format ?? "json");

    const query = queryParams.toString();
    const endpoint = `/datasets/${datasetId}/items${query ? `?${query}` : ""}`;

    // For JSON format, we need to handle the response differently
    // The API returns items directly as an array, not wrapped
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetchFn(`${this.baseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return fail(
          "APIFY_API_ERROR",
          error.error?.message || `HTTP ${response.status}`,
          response.status,
        );
      }

      const items = (await response.json()) as T[];
      return ok({
        data: items,
        total: items.length,
        offset: options?.offset ?? 0,
        count: items.length,
        limit: options?.limit ?? 1000,
        desc: false,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        return fail("TIMEOUT", "Request timed out", 408);
      }
      return fail(
        "NETWORK_ERROR",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  // ============================================================================
  // Convenience: Run actor and get results
  // ============================================================================

  /**
   * Run an actor and wait for results
   */
  async runActorAndGetResults<T = unknown>(
    actorId: string,
    input?: Record<string, unknown>,
    options?: {
      waitForFinish?: number;
      memoryMbytes?: number;
      timeoutSecs?: number;
      resultsLimit?: number;
    },
  ): Promise<Result<{ run: ActorRunResponse; items: T[] }>> {
    // Start the run with waitForFinish
    const runResult = await this.runActor(actorId, input, {
      waitForFinish: options?.waitForFinish ?? 120,
      memoryMbytes: options?.memoryMbytes,
      timeoutSecs: options?.timeoutSecs,
    });

    if (!runResult.success) return runResult;

    const run = runResult.data;
    const status = run.data.status;

    // If still running, wait for it
    if (status === "RUNNING" || status === "READY") {
      const waitResult = await this.waitForRun(run.data.id, 300);
      if (!waitResult.success) return waitResult;

      if (waitResult.data.data.status !== "SUCCEEDED") {
        return fail(
          "RUN_FAILED",
          `Actor run failed with status: ${waitResult.data.data.status}`,
        );
      }
    } else if (status !== "SUCCEEDED") {
      return fail("RUN_FAILED", `Actor run failed with status: ${status}`);
    }

    // Get results from dataset
    const datasetResult = await this.getDataset<T>(run.data.defaultDatasetId, {
      limit: options?.resultsLimit ?? 100,
    });

    if (!datasetResult.success) return datasetResult;

    return ok({
      run,
      items: datasetResult.data.data,
    });
  }
}
