/**
 * Notion Integration
 *
 * @example
 * ```typescript
 * import { NotionClient, createNotionTools } from '@trendingsociety/integrations/notion'
 *
 * const client = new NotionClient({ token: process.env.NOTION_TOKEN })
 * const tools = createNotionTools(client)
 *
 * // Search for pages
 * const result = await tools.notion_search.execute({ query: 'Brand Brief' })
 *
 * // Get page content as markdown
 * const content = await tools.notion_get_page_content.execute({ pageId: 'abc123' })
 * ```
 */

export { NotionClient, type NotionClientConfig } from "./client.js";
export { createNotionTools, type NotionTools } from "./tools.js";
export {
  AddCommentInputSchema,
  AppendContentInputSchema,
  CreateDatabaseEntryInputSchema,
  CreatePageInputSchema,
  GetDatabaseInputSchema,
  GetPageContentInputSchema,
  GetPageInputSchema,
  ListCommentsInputSchema,
  QueryDatabaseInputSchema,
  // Schemas
  SearchInputSchema,
  UpdateDatabaseEntryInputSchema,
  UpdatePageInputSchema,
  type Block,
  type BlocksResponse,
  type CommentsResponse,
  type DatabaseProperty,
  type DatabaseQueryResponse,
  type NotionComment,
  // Types
  type NotionConfig,
  type NotionDatabase,
  type NotionPage,
  type NotionUser,
  type Parent,
  type PropertyValue,
  type RichText,
  type SearchResponse,
} from "./types.js";
