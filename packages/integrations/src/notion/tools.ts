/**
 * Notion AI SDK Tools
 * MCP-compatible tools for Notion operations
 */

import { tool } from "ai";
import { NotionClient } from "./client.js";
import {
  AddCommentInputSchema,
  AppendContentInputSchema,
  CreateDatabaseEntryInputSchema,
  CreatePageInputSchema,
  GetDatabaseInputSchema,
  GetPageContentInputSchema,
  GetPageInputSchema,
  ListCommentsInputSchema,
  QueryDatabaseInputSchema,
  SearchInputSchema,
  UpdateDatabaseEntryInputSchema,
  UpdatePageInputSchema,
} from "./types.js";

export function createNotionTools(client: NotionClient) {
  return {
    // ========================================================================
    // Search
    // ========================================================================
    notion_search: tool({
      description:
        "Search Notion pages and databases by query text. Returns matching pages/databases with their IDs and titles.",
      inputSchema: SearchInputSchema,
      execute: async (params) => {
        const result = await client.search({
          query: params.query,
          filter: params.filter
            ? { property: "object", value: params.filter }
            : undefined,
          pageSize: params.pageSize,
          startCursor: params.startCursor,
        });
        if (!result.success) throw new Error(result.error.message);

        return {
          count: result.data.results.length,
          hasMore: result.data.has_more,
          nextCursor: result.data.next_cursor,
          results: result.data.results.map((item) => ({
            id: item.id,
            type: item.object,
            title: getTitle(item),
            url: "url" in item ? item.url : undefined,
            lastEdited:
              "last_edited_time" in item ? item.last_edited_time : undefined,
          })),
        };
      },
    }),

    // ========================================================================
    // Pages
    // ========================================================================
    notion_get_page: tool({
      description:
        "Get a Notion page by ID. Returns page properties, metadata, and URL.",
      inputSchema: GetPageInputSchema,
      execute: async (params) => {
        const result = await client.getPage(params.pageId);
        if (!result.success) throw new Error(result.error.message);

        return {
          id: result.data.id,
          url: result.data.url,
          title: getPageTitle(result.data),
          createdTime: result.data.created_time,
          lastEditedTime: result.data.last_edited_time,
          archived: result.data.archived,
          icon: result.data.icon,
          properties: simplifyProperties(result.data.properties),
        };
      },
    }),

    notion_get_page_content: tool({
      description:
        "Get the content of a Notion page as markdown. Fetches all blocks and converts to readable text.",
      inputSchema: GetPageContentInputSchema,
      execute: async (params) => {
        const blocks: unknown[] = [];
        let cursor: string | undefined;

        // Fetch all blocks with pagination
        for (let depth = 0; depth < params.maxDepth; depth++) {
          const result = await client.getPageContent(params.pageId, cursor);
          if (!result.success) throw new Error(result.error.message);

          blocks.push(...result.data.results);

          if (!result.data.has_more) break;
          cursor = result.data.next_cursor ?? undefined;
        }

        const markdown = client.blocksToMarkdown(
          blocks as Parameters<typeof client.blocksToMarkdown>[0]
        );

        return {
          pageId: params.pageId,
          blockCount: blocks.length,
          markdown,
        };
      },
    }),

    notion_create_page: tool({
      description:
        "Create a new Notion page under a parent page or in a database. Supports markdown content.",
      inputSchema: CreatePageInputSchema,
      execute: async (params) => {
        const children = params.content
          ? client.markdownToBlocks(params.content)
          : undefined;

        const result = await client.createPage({
          parentId: params.parentId,
          parentType: params.parentType,
          title: params.title,
          properties: params.properties,
          children,
          icon: params.icon,
        });
        if (!result.success) throw new Error(result.error.message);

        return {
          id: result.data.id,
          url: result.data.url,
          title: getPageTitle(result.data),
        };
      },
    }),

    notion_update_page: tool({
      description:
        "Update a Notion page properties. Can update title, icon, and custom properties.",
      inputSchema: UpdatePageInputSchema,
      execute: async (params) => {
        const result = await client.updatePage(params.pageId, {
          properties: params.properties,
          archived: params.archived,
          icon: params.icon,
        });
        if (!result.success) throw new Error(result.error.message);

        return {
          id: result.data.id,
          url: result.data.url,
          title: getPageTitle(result.data),
          archived: result.data.archived,
        };
      },
    }),

    notion_append_content: tool({
      description:
        "Append content to a Notion page. Content is provided as markdown and converted to blocks.",
      inputSchema: AppendContentInputSchema,
      execute: async (params) => {
        const children = client.markdownToBlocks(params.content);

        const result = await client.appendBlocks(params.pageId, children);
        if (!result.success) throw new Error(result.error.message);

        return {
          pageId: params.pageId,
          blocksAdded: result.data.results.length,
        };
      },
    }),

    // ========================================================================
    // Databases
    // ========================================================================
    notion_get_database: tool({
      description:
        "Get a Notion database schema. Returns database title and property definitions.",
      inputSchema: GetDatabaseInputSchema,
      execute: async (params) => {
        const result = await client.getDatabase(params.databaseId);
        if (!result.success) throw new Error(result.error.message);

        return {
          id: result.data.id,
          title: result.data.title.map((t) => t.plain_text).join(""),
          url: result.data.url,
          archived: result.data.archived,
          properties: Object.entries(result.data.properties).map(
            ([name, prop]) => ({
              name,
              id: prop.id,
              type: prop.type,
            })
          ),
        };
      },
    }),

    notion_query_database: tool({
      description:
        "Query a Notion database with filters and sorting. Returns matching entries with properties.",
      inputSchema: QueryDatabaseInputSchema,
      execute: async (params) => {
        const result = await client.queryDatabase({
          databaseId: params.databaseId,
          filter: params.filter,
          sorts: params.sorts,
          pageSize: params.pageSize,
          startCursor: params.startCursor,
        });
        if (!result.success) throw new Error(result.error.message);

        return {
          count: result.data.results.length,
          hasMore: result.data.has_more,
          nextCursor: result.data.next_cursor,
          entries: result.data.results.map((page) => ({
            id: page.id,
            url: page.url,
            title: getPageTitle(page),
            createdTime: page.created_time,
            lastEditedTime: page.last_edited_time,
            properties: simplifyProperties(page.properties),
          })),
        };
      },
    }),

    notion_create_database_entry: tool({
      description:
        "Create a new entry (row) in a Notion database. Properties must match the database schema.",
      inputSchema: CreateDatabaseEntryInputSchema,
      execute: async (params) => {
        const children = params.content
          ? client.markdownToBlocks(params.content)
          : undefined;

        const result = await client.createDatabaseEntry({
          databaseId: params.databaseId,
          properties: params.properties,
          children,
          icon: params.icon,
        });
        if (!result.success) throw new Error(result.error.message);

        return {
          id: result.data.id,
          url: result.data.url,
          title: getPageTitle(result.data),
        };
      },
    }),

    notion_update_database_entry: tool({
      description:
        "Update an existing database entry. Can update any property values or archive the entry.",
      inputSchema: UpdateDatabaseEntryInputSchema,
      execute: async (params) => {
        const result = await client.updateDatabaseEntry(params.pageId, {
          properties: params.properties,
          archived: params.archived,
        });
        if (!result.success) throw new Error(result.error.message);

        return {
          id: result.data.id,
          url: result.data.url,
          title: getPageTitle(result.data),
          archived: result.data.archived,
        };
      },
    }),

    // ========================================================================
    // Comments
    // ========================================================================
    notion_list_comments: tool({
      description: "List comments on a Notion page or block.",
      inputSchema: ListCommentsInputSchema,
      execute: async (params) => {
        const result = await client.listComments(
          params.pageId,
          params.startCursor
        );
        if (!result.success) throw new Error(result.error.message);

        return {
          count: result.data.results.length,
          hasMore: result.data.has_more,
          nextCursor: result.data.next_cursor,
          comments: result.data.results.map((comment) => ({
            id: comment.id,
            createdTime: comment.created_time,
            author: comment.created_by.name,
            text: comment.rich_text.map((t) => t.plain_text).join(""),
          })),
        };
      },
    }),

    notion_add_comment: tool({
      description: "Add a comment to a Notion page.",
      inputSchema: AddCommentInputSchema,
      execute: async (params) => {
        const result = await client.addComment(params.pageId, params.content);
        if (!result.success) throw new Error(result.error.message);

        return {
          id: result.data.id,
          createdTime: result.data.created_time,
          text: result.data.rich_text.map((t) => t.plain_text).join(""),
        };
      },
    }),
  };
}

export type NotionTools = ReturnType<typeof createNotionTools>;

// ============================================================================
// Helper Functions
// ============================================================================

function getTitle(item: {
  object: string;
  properties?: Record<string, unknown>;
  title?: Array<{ plain_text: string }>;
}): string {
  // For databases
  if ("title" in item && Array.isArray(item.title)) {
    return item.title.map((t) => t.plain_text).join("");
  }
  // For pages
  if (item.properties) {
    return getPageTitle(item as Parameters<typeof getPageTitle>[0]);
  }
  return "Untitled";
}

function getPageTitle(page: { properties: Record<string, unknown> }): string {
  // Find the title property
  for (const [, value] of Object.entries(page.properties)) {
    const prop = value as {
      type?: string;
      title?: Array<{ plain_text: string }>;
    };
    if (prop.type === "title" && Array.isArray(prop.title)) {
      return prop.title.map((t) => t.plain_text).join("");
    }
  }
  return "Untitled";
}

function simplifyProperties(
  properties: Record<string, unknown>
): Record<string, unknown> {
  const simplified: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(properties)) {
    const prop = value as { type: string; [key: string]: unknown };
    const type = prop.type;

    switch (type) {
      case "title":
      case "rich_text":
        simplified[name] = (prop[type] as Array<{ plain_text: string }>)
          ?.map((t) => t.plain_text)
          .join("");
        break;
      case "number":
        simplified[name] = prop.number;
        break;
      case "select":
        simplified[name] =
          (prop.select as { name: string } | null)?.name ?? null;
        break;
      case "multi_select":
        simplified[name] = (prop.multi_select as Array<{ name: string }>)?.map(
          (s) => s.name
        );
        break;
      case "date":
        simplified[name] = prop.date;
        break;
      case "checkbox":
        simplified[name] = prop.checkbox;
        break;
      case "url":
        simplified[name] = prop.url;
        break;
      case "email":
        simplified[name] = prop.email;
        break;
      case "phone_number":
        simplified[name] = prop.phone_number;
        break;
      case "status":
        simplified[name] =
          (prop.status as { name: string } | null)?.name ?? null;
        break;
      case "people":
        simplified[name] = (prop.people as Array<{ name?: string }>)?.map(
          (p) => p.name
        );
        break;
      case "relation":
        simplified[name] = (prop.relation as Array<{ id: string }>)?.map(
          (r) => r.id
        );
        break;
      default:
        simplified[name] = prop[type];
    }
  }

  return simplified;
}
