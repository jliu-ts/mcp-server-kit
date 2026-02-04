/**
 * Notion API Client
 * https://developers.notion.com
 */

import { fail, ok, type ClientConfig, type Result } from "../types.js";
import type {
  Block,
  BlocksResponse,
  CommentsResponse,
  DatabaseQueryResponse,
  NotionComment,
  NotionDatabase,
  NotionPage,
  RichText,
  SearchResponse,
} from "./types.js";

export interface NotionClientConfig extends ClientConfig {
  token: string;
  baseUrl?: string;
}

export class NotionClient {
  private token: string;
  private baseUrl: string;
  private timeout: number;
  private fetchFn: typeof fetch;
  private notionVersion = "2022-06-28";

  constructor(config: NotionClientConfig) {
    this.token = config.token;
    this.baseUrl = config.baseUrl ?? "https://api.notion.com/v1";
    this.timeout = config.timeout ?? 30000;
    this.fetchFn = config.fetch ?? fetch.bind(globalThis);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Result<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        "Notion-Version": this.notionVersion,
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
          "NOTION_API_ERROR",
          error.message || `HTTP ${response.status}`,
          response.status
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
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  // ============================================================================
  // Search
  // ============================================================================

  async search(params: {
    query?: string;
    filter?: { property: "object"; value: "page" | "database" };
    pageSize?: number;
    startCursor?: string;
  }): Promise<Result<SearchResponse>> {
    return this.request<SearchResponse>("/search", {
      method: "POST",
      body: JSON.stringify({
        query: params.query,
        filter: params.filter,
        page_size: params.pageSize ?? 10,
        start_cursor: params.startCursor,
      }),
    });
  }

  // ============================================================================
  // Pages
  // ============================================================================

  async getPage(pageId: string): Promise<Result<NotionPage>> {
    const normalizedId = this.normalizeId(pageId);
    return this.request<NotionPage>(`/pages/${normalizedId}`);
  }

  async getPageContent(
    pageId: string,
    startCursor?: string
  ): Promise<Result<BlocksResponse>> {
    const normalizedId = this.normalizeId(pageId);
    const params = startCursor ? `?start_cursor=${startCursor}` : "";
    return this.request<BlocksResponse>(
      `/blocks/${normalizedId}/children${params}`
    );
  }

  async createPage(params: {
    parentId: string;
    parentType: "page" | "database";
    title: string;
    properties?: Record<string, unknown>;
    children?: unknown[];
    icon?: string;
  }): Promise<Result<NotionPage>> {
    const parent =
      params.parentType === "database"
        ? { database_id: this.normalizeId(params.parentId) }
        : { page_id: this.normalizeId(params.parentId) };

    const properties =
      params.parentType === "database"
        ? {
            ...(params.properties ?? {}),
            // Ensure title is set for database pages
            title: params.properties?.title ?? [
              { type: "text", text: { content: params.title } },
            ],
          }
        : { title: [{ type: "text", text: { content: params.title } }] };

    const body: Record<string, unknown> = {
      parent,
      properties,
    };

    if (params.children) {
      body.children = params.children;
    }

    if (params.icon) {
      body.icon = { type: "emoji", emoji: params.icon };
    }

    return this.request<NotionPage>("/pages", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async updatePage(
    pageId: string,
    params: {
      properties?: Record<string, unknown>;
      archived?: boolean;
      icon?: string;
    }
  ): Promise<Result<NotionPage>> {
    const normalizedId = this.normalizeId(pageId);
    const body: Record<string, unknown> = {};

    if (params.properties) body.properties = params.properties;
    if (params.archived !== undefined) body.archived = params.archived;
    if (params.icon) body.icon = { type: "emoji", emoji: params.icon };

    return this.request<NotionPage>(`/pages/${normalizedId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  // ============================================================================
  // Blocks
  // ============================================================================

  async appendBlocks(
    blockId: string,
    children: unknown[]
  ): Promise<Result<BlocksResponse>> {
    const normalizedId = this.normalizeId(blockId);
    return this.request<BlocksResponse>(`/blocks/${normalizedId}/children`, {
      method: "PATCH",
      body: JSON.stringify({ children }),
    });
  }

  async getBlock(blockId: string): Promise<Result<Block>> {
    return this.request<Block>(`/blocks/${this.normalizeId(blockId)}`);
  }

  // ============================================================================
  // Databases
  // ============================================================================

  async getDatabase(databaseId: string): Promise<Result<NotionDatabase>> {
    const normalizedId = this.normalizeId(databaseId);
    return this.request<NotionDatabase>(`/databases/${normalizedId}`);
  }

  async queryDatabase(params: {
    databaseId: string;
    filter?: Record<string, unknown>;
    sorts?: Array<{
      property?: string;
      timestamp?: "created_time" | "last_edited_time";
      direction: "ascending" | "descending";
    }>;
    pageSize?: number;
    startCursor?: string;
  }): Promise<Result<DatabaseQueryResponse>> {
    const normalizedId = this.normalizeId(params.databaseId);
    return this.request<DatabaseQueryResponse>(
      `/databases/${normalizedId}/query`,
      {
        method: "POST",
        body: JSON.stringify({
          filter: params.filter,
          sorts: params.sorts,
          page_size: params.pageSize ?? 10,
          start_cursor: params.startCursor,
        }),
      }
    );
  }

  async createDatabaseEntry(params: {
    databaseId: string;
    properties: Record<string, unknown>;
    children?: unknown[];
    icon?: string;
  }): Promise<Result<NotionPage>> {
    return this.createPage({
      parentId: params.databaseId,
      parentType: "database",
      title: "", // Will be overridden by properties
      properties: params.properties,
      children: params.children,
      icon: params.icon,
    });
  }

  async updateDatabaseEntry(
    pageId: string,
    params: {
      properties: Record<string, unknown>;
      archived?: boolean;
    }
  ): Promise<Result<NotionPage>> {
    return this.updatePage(pageId, params);
  }

  // ============================================================================
  // Comments
  // ============================================================================

  async listComments(
    pageId: string,
    startCursor?: string
  ): Promise<Result<CommentsResponse>> {
    const normalizedId = this.normalizeId(pageId);
    const params = new URLSearchParams({ block_id: normalizedId });
    if (startCursor) params.set("start_cursor", startCursor);
    return this.request<CommentsResponse>(`/comments?${params.toString()}`);
  }

  async addComment(
    pageId: string,
    content: string
  ): Promise<Result<NotionComment>> {
    const normalizedId = this.normalizeId(pageId);
    return this.request<NotionComment>("/comments", {
      method: "POST",
      body: JSON.stringify({
        parent: { page_id: normalizedId },
        rich_text: [{ type: "text", text: { content } }],
      }),
    });
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Normalize page/database ID by removing dashes and URL parts
   */
  private normalizeId(id: string): string {
    // Handle full URLs
    if (id.includes("notion.so")) {
      const match = id.match(/([a-f0-9]{32})/i);
      if (match?.[1]) return match[1];
    }
    // Remove dashes from UUID format
    return id.replace(/-/g, "");
  }

  /**
   * Convert blocks to markdown for easier consumption
   */
  blocksToMarkdown(blocks: Block[]): string {
    return blocks
      .map((block) => this.blockToMarkdown(block))
      .filter(Boolean)
      .join("\n\n");
  }

  private blockToMarkdown(block: Block): string {
    const type = block.type;
    const content = block[type] as Record<string, unknown> | undefined;

    if (!content) return "";

    const richText = content.rich_text as RichText[] | undefined;
    const text = richText?.map((t) => t.plain_text).join("") ?? "";

    switch (type) {
      case "paragraph":
        return text;
      case "heading_1":
        return `# ${text}`;
      case "heading_2":
        return `## ${text}`;
      case "heading_3":
        return `### ${text}`;
      case "bulleted_list_item":
        return `- ${text}`;
      case "numbered_list_item":
        return `1. ${text}`;
      case "to_do":
        const checked = (content.checked as boolean) ? "x" : " ";
        return `- [${checked}] ${text}`;
      case "toggle":
        return `<details><summary>${text}</summary></details>`;
      case "code":
        const language = (content.language as string) ?? "";
        return `\`\`\`${language}\n${text}\n\`\`\``;
      case "quote":
        return `> ${text}`;
      case "callout":
        const icon = (content.icon as { emoji?: string })?.emoji ?? "💡";
        return `> ${icon} ${text}`;
      case "divider":
        return "---";
      case "image":
        const imageUrl =
          (content.external as { url?: string })?.url ??
          (content.file as { url?: string })?.url ??
          "";
        return `![image](${imageUrl})`;
      default:
        return text;
    }
  }

  /**
   * Convert markdown to Notion blocks
   */
  markdownToBlocks(markdown: string): unknown[] {
    const lines = markdown.split("\n");
    const blocks: unknown[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      if (line.startsWith("# ")) {
        blocks.push({
          type: "heading_1",
          heading_1: {
            rich_text: [{ type: "text", text: { content: line.slice(2) } }],
          },
        });
      } else if (line.startsWith("## ")) {
        blocks.push({
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: line.slice(3) } }],
          },
        });
      } else if (line.startsWith("### ")) {
        blocks.push({
          type: "heading_3",
          heading_3: {
            rich_text: [{ type: "text", text: { content: line.slice(4) } }],
          },
        });
      } else if (line.startsWith("- ")) {
        blocks.push({
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ type: "text", text: { content: line.slice(2) } }],
          },
        });
      } else if (/^\d+\.\s/.test(line)) {
        blocks.push({
          type: "numbered_list_item",
          numbered_list_item: {
            rich_text: [
              { type: "text", text: { content: line.replace(/^\d+\.\s/, "") } },
            ],
          },
        });
      } else if (line.startsWith("> ")) {
        blocks.push({
          type: "quote",
          quote: {
            rich_text: [{ type: "text", text: { content: line.slice(2) } }],
          },
        });
      } else if (line === "---") {
        blocks.push({ type: "divider", divider: {} });
      } else {
        blocks.push({
          type: "paragraph",
          paragraph: { rich_text: [{ type: "text", text: { content: line } }] },
        });
      }
    }

    return blocks;
  }
}
