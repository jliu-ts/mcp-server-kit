/**
 * Webflow AI SDK Tools
 *
 * Tool definitions for Webflow API v2.
 * Covers sites, pages, collections, CMS items, custom code, and assets.
 */

import { tool } from 'ai'
import type { WebflowClient } from './client.js'
import {
  // Sites
  ListSitesInputSchema,
  GetSiteInputSchema,
  PublishSiteInputSchema,
  // Pages
  ListPagesInputSchema,
  GetPageInputSchema,
  GetPageMetadataInputSchema,
  UpdatePageMetadataInputSchema,
  // Collections
  ListCollectionsInputSchema,
  GetCollectionInputSchema,
  // Collection Items
  ListCollectionItemsInputSchema,
  GetCollectionItemInputSchema,
  CreateCollectionItemInputSchema,
  UpdateCollectionItemInputSchema,
  DeleteCollectionItemInputSchema,
  PublishCollectionItemsInputSchema,
  // Assets
  ListAssetsInputSchema,
  GetAssetInputSchema,
  // Custom Code
  GetSiteCustomCodeInputSchema,
  RegisterSiteCustomCodeInputSchema,
  GetPageCustomCodeInputSchema,
  RegisterPageCustomCodeInputSchema,
} from './types.js'

export type WebflowTools = ReturnType<typeof createWebflowTools>

/**
 * Create Webflow tools for AI SDK
 */
export function createWebflowTools(client: WebflowClient) {
  return {
    // ========================================================================
    // Sites
    // ========================================================================

    webflow_list_sites: tool({
      description: 'List all Webflow sites in the workspace. Returns site names, IDs, domains, and last published dates.',
      inputSchema: ListSitesInputSchema,
      execute: async (params) => {
        const result = await client.listSites(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    webflow_get_site: tool({
      description: 'Get details for a specific Webflow site by ID. Returns site configuration, domains, and locales.',
      inputSchema: GetSiteInputSchema,
      execute: async (params) => {
        const result = await client.getSite(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    webflow_publish_site: tool({
      description: 'Publish a Webflow site to its domains. Optionally specify which domains to publish to.',
      inputSchema: PublishSiteInputSchema,
      execute: async (params) => {
        const result = await client.publishSite(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    // ========================================================================
    // Pages
    // ========================================================================

    webflow_list_pages: tool({
      description: 'List all pages for a Webflow site. Returns page titles, slugs, and publication status.',
      inputSchema: ListPagesInputSchema,
      execute: async (params) => {
        const result = await client.listPages(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    webflow_get_page: tool({
      description: 'Get details for a specific page by ID. Returns page title, slug, SEO settings, and metadata.',
      inputSchema: GetPageInputSchema,
      execute: async (params) => {
        const result = await client.getPage(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    webflow_get_page_metadata: tool({
      description: 'Get page metadata including SEO title, description, and Open Graph settings.',
      inputSchema: GetPageMetadataInputSchema,
      execute: async (params) => {
        const result = await client.getPageMetadata(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    webflow_update_page_metadata: tool({
      description: 'Update page metadata including title, slug, SEO settings, and Open Graph properties.',
      inputSchema: UpdatePageMetadataInputSchema,
      execute: async (params) => {
        const result = await client.updatePageMetadata(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    // ========================================================================
    // Collections (CMS)
    // ========================================================================

    webflow_list_collections: tool({
      description: 'List all CMS collections for a Webflow site. Returns collection names, slugs, and field schemas.',
      inputSchema: ListCollectionsInputSchema,
      execute: async (params) => {
        const result = await client.listCollections(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    webflow_get_collection: tool({
      description: 'Get details for a specific CMS collection by ID. Returns field definitions and schema.',
      inputSchema: GetCollectionInputSchema,
      execute: async (params) => {
        const result = await client.getCollection(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    // ========================================================================
    // Collection Items (CMS Content)
    // ========================================================================

    webflow_list_collection_items: tool({
      description: 'List items in a CMS collection. Returns item data, draft/published status, and field values.',
      inputSchema: ListCollectionItemsInputSchema,
      execute: async (params) => {
        const result = await client.listCollectionItems(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    webflow_get_collection_item: tool({
      description: 'Get a specific CMS collection item by ID. Returns all field values and metadata.',
      inputSchema: GetCollectionItemInputSchema,
      execute: async (params) => {
        const result = await client.getCollectionItem(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    webflow_create_collection_item: tool({
      description: 'Create a new item in a CMS collection. Use field slugs from the collection schema as keys.',
      inputSchema: CreateCollectionItemInputSchema,
      execute: async (params) => {
        const result = await client.createCollectionItem(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    webflow_update_collection_item: tool({
      description: 'Update an existing CMS collection item. Only fields provided will be updated.',
      inputSchema: UpdateCollectionItemInputSchema,
      execute: async (params) => {
        const result = await client.updateCollectionItem(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    webflow_delete_collection_item: tool({
      description: 'Delete a CMS collection item by ID. This action cannot be undone.',
      inputSchema: DeleteCollectionItemInputSchema,
      execute: async (params) => {
        const result = await client.deleteCollectionItem(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    webflow_publish_collection_items: tool({
      description: 'Publish CMS collection items to make them live. Can publish up to 100 items at once.',
      inputSchema: PublishCollectionItemsInputSchema,
      execute: async (params) => {
        const result = await client.publishCollectionItems(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    // ========================================================================
    // Assets
    // ========================================================================

    webflow_list_assets: tool({
      description: 'List all assets (images, files) for a Webflow site. Returns URLs, file sizes, and metadata.',
      inputSchema: ListAssetsInputSchema,
      execute: async (params) => {
        const result = await client.listAssets(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    webflow_get_asset: tool({
      description: 'Get details for a specific asset by ID. Returns URL, variants, and file metadata.',
      inputSchema: GetAssetInputSchema,
      execute: async (params) => {
        const result = await client.getAsset(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    // ========================================================================
    // Custom Code
    // ========================================================================

    webflow_get_site_custom_code: tool({
      description: 'Get custom code scripts registered on a Webflow site (header/footer scripts).',
      inputSchema: GetSiteCustomCodeInputSchema,
      execute: async (params) => {
        const result = await client.getSiteCustomCode(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    webflow_register_site_custom_code: tool({
      description: 'Register custom code (script) on a Webflow site. Can add to header or footer.',
      inputSchema: RegisterSiteCustomCodeInputSchema,
      execute: async (params) => {
        const result = await client.registerSiteCustomCode(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    webflow_get_page_custom_code: tool({
      description: 'Get custom code scripts registered on a specific page.',
      inputSchema: GetPageCustomCodeInputSchema,
      execute: async (params) => {
        const result = await client.getPageCustomCode(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    webflow_register_page_custom_code: tool({
      description: 'Register custom code (script) on a specific page. Can add to header or footer.',
      inputSchema: RegisterPageCustomCodeInputSchema,
      execute: async (params) => {
        const result = await client.registerPageCustomCode(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),
  }
}
