/**
 * Notion API Types
 * https://developers.notion.com
 */

import { z } from "zod";

// ============================================================================
// Configuration
// ============================================================================

export interface NotionConfig {
  token: string;
  baseUrl?: string;
  timeout?: number;
}

// ============================================================================
// Common Types
// ============================================================================

export interface NotionUser {
  id: string;
  type: "person" | "bot";
  name?: string;
  avatar_url?: string;
}

export interface RichText {
  type: "text" | "mention" | "equation";
  text?: { content: string; link?: { url: string } | null };
  plain_text: string;
  annotations?: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
}

export interface Parent {
  type: "database_id" | "page_id" | "workspace" | "block_id";
  database_id?: string;
  page_id?: string;
  block_id?: string;
}

// ============================================================================
// Pages
// ============================================================================

export interface NotionPage {
  id: string;
  object: "page";
  created_time: string;
  last_edited_time: string;
  created_by: NotionUser;
  last_edited_by: NotionUser;
  archived: boolean;
  parent: Parent;
  properties: Record<string, PropertyValue>;
  url: string;
  icon?:
    | { type: "emoji"; emoji: string }
    | { type: "external"; external: { url: string } }
    | null;
  cover?: { type: "external"; external: { url: string } } | null;
}

export type PropertyValue =
  | { type: "title"; title: RichText[]; id: string }
  | { type: "rich_text"; rich_text: RichText[]; id: string }
  | { type: "number"; number: number | null; id: string }
  | {
      type: "select";
      select: { id: string; name: string; color: string } | null;
      id: string;
    }
  | {
      type: "multi_select";
      multi_select: Array<{ id: string; name: string; color: string }>;
      id: string;
    }
  | {
      type: "date";
      date: { start: string; end?: string; time_zone?: string } | null;
      id: string;
    }
  | { type: "checkbox"; checkbox: boolean; id: string }
  | { type: "url"; url: string | null; id: string }
  | { type: "email"; email: string | null; id: string }
  | { type: "phone_number"; phone_number: string | null; id: string }
  | {
      type: "status";
      status: { id: string; name: string; color: string } | null;
      id: string;
    }
  | { type: "relation"; relation: Array<{ id: string }>; id: string }
  | { type: "people"; people: NotionUser[]; id: string }
  | {
      type: "files";
      files: Array<{ name: string; type: string; external?: { url: string } }>;
      id: string;
    }
  | { type: "created_time"; created_time: string; id: string }
  | { type: "last_edited_time"; last_edited_time: string; id: string }
  | {
      type: "rollup";
      rollup: { type: string; number?: number; array?: unknown[] };
      id: string;
    }
  | {
      type: "formula";
      formula: {
        type: string;
        string?: string;
        number?: number;
        boolean?: boolean;
      };
      id: string;
    };

// ============================================================================
// Blocks
// ============================================================================

export interface Block {
  id: string;
  object: "block";
  parent: Parent;
  type: string;
  created_time: string;
  last_edited_time: string;
  has_children: boolean;
  archived: boolean;
  [key: string]: unknown;
}

export interface BlocksResponse {
  object: "list";
  results: Block[];
  next_cursor: string | null;
  has_more: boolean;
}

// ============================================================================
// Databases
// ============================================================================

export interface NotionDatabase {
  id: string;
  object: "database";
  created_time: string;
  last_edited_time: string;
  title: RichText[];
  description: RichText[];
  properties: Record<string, DatabaseProperty>;
  parent: Parent;
  url: string;
  archived: boolean;
}

export interface DatabaseProperty {
  id: string;
  name: string;
  type: string;
  [key: string]: unknown;
}

export interface DatabaseQueryResponse {
  object: "list";
  results: NotionPage[];
  next_cursor: string | null;
  has_more: boolean;
}

// ============================================================================
// Search
// ============================================================================

export interface SearchResponse {
  object: "list";
  results: Array<NotionPage | NotionDatabase>;
  next_cursor: string | null;
  has_more: boolean;
}

// ============================================================================
// Comments
// ============================================================================

export interface NotionComment {
  id: string;
  object: "comment";
  parent: { type: "page_id" | "block_id"; page_id?: string; block_id?: string };
  discussion_id: string;
  created_time: string;
  last_edited_time: string;
  created_by: NotionUser;
  rich_text: RichText[];
}

export interface CommentsResponse {
  object: "list";
  results: NotionComment[];
  next_cursor: string | null;
  has_more: boolean;
}

// ============================================================================
// Zod Schemas for Tool Inputs
// ============================================================================

export const SearchInputSchema = z.object({
  query: z.string().optional().describe("Search query text"),
  filter: z
    .enum(["page", "database"])
    .optional()
    .describe("Filter results by type"),
  pageSize: z
    .number()
    .max(100)
    .default(10)
    .describe("Number of results (max 100)"),
  startCursor: z.string().optional().describe("Pagination cursor"),
});

export const GetPageInputSchema = z.object({
  pageId: z.string().describe("Notion page ID or URL"),
});

export const GetPageContentInputSchema = z.object({
  pageId: z.string().describe("Notion page ID"),
  maxDepth: z
    .number()
    .max(3)
    .default(2)
    .describe("Max depth for nested blocks"),
});

export const CreatePageInputSchema = z.object({
  parentId: z.string().describe("Parent page or database ID"),
  parentType: z
    .enum(["page", "database"])
    .default("page")
    .describe("Parent type"),
  title: z.string().describe("Page title"),
  content: z.string().optional().describe("Page content as markdown"),
  properties: z
    .record(z.unknown())
    .optional()
    .describe("Additional properties for database pages"),
  icon: z.string().optional().describe("Emoji icon for the page"),
});

export const UpdatePageInputSchema = z.object({
  pageId: z.string().describe("Page ID to update"),
  properties: z.record(z.unknown()).describe("Properties to update"),
  archived: z.boolean().optional().describe("Set to true to archive the page"),
  icon: z.string().optional().describe("New emoji icon"),
});

export const AppendContentInputSchema = z.object({
  pageId: z.string().describe("Page or block ID to append to"),
  content: z.string().describe("Content to append as markdown"),
});

export const GetDatabaseInputSchema = z.object({
  databaseId: z.string().describe("Notion database ID"),
});

export const QueryDatabaseInputSchema = z.object({
  databaseId: z.string().describe("Notion database ID"),
  filter: z.record(z.unknown()).optional().describe("Notion filter object"),
  sorts: z
    .array(
      z.object({
        property: z.string().optional(),
        timestamp: z.enum(["created_time", "last_edited_time"]).optional(),
        direction: z.enum(["ascending", "descending"]),
      })
    )
    .optional()
    .describe("Sort configuration"),
  pageSize: z.number().max(100).default(10).describe("Results per page"),
  startCursor: z.string().optional().describe("Pagination cursor"),
});

export const CreateDatabaseEntryInputSchema = z.object({
  databaseId: z.string().describe("Database ID to add entry to"),
  properties: z
    .record(z.unknown())
    .describe("Property values for the new entry"),
  content: z.string().optional().describe("Page content as markdown"),
  icon: z.string().optional().describe("Emoji icon"),
});

export const UpdateDatabaseEntryInputSchema = z.object({
  pageId: z.string().describe("Database entry (page) ID to update"),
  properties: z.record(z.unknown()).describe("Properties to update"),
  archived: z.boolean().optional().describe("Archive the entry"),
});

export const ListCommentsInputSchema = z.object({
  pageId: z.string().describe("Page or block ID"),
  startCursor: z.string().optional().describe("Pagination cursor"),
});

export const AddCommentInputSchema = z.object({
  pageId: z.string().describe("Page ID to comment on"),
  content: z.string().describe("Comment text"),
});
