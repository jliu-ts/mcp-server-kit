/**
 * Webflow Integration
 *
 * Runtime-agnostic client for Webflow API v2.
 * Supports sites, pages, collections, CMS items, custom code, and assets.
 *
 * @example
 * import { WebflowClient, createWebflowTools } from '@trendingsociety/integrations/webflow'
 *
 * const client = new WebflowClient({
 *   accessToken: process.env.WEBFLOW_ACCESS_TOKEN,
 * })
 *
 * // Direct client usage
 * const sites = await client.listSites()
 *
 * // AI SDK tools usage
 * const tools = createWebflowTools(client)
 */

export { WebflowClient, type WebflowClientConfig } from './client.js'
export { createWebflowTools, type WebflowTools } from './tools.js'
export type {
  // Core types
  WebflowSite,
  CustomDomain,
  SiteLocale,
  WebflowPage,
  PageSeo,
  PageOpenGraph,
  WebflowCollection,
  CollectionField,
  CollectionFieldType,
  WebflowCollectionItem,
  WebflowAsset,
  AssetVariant,
  WebflowCustomCode,
  CustomCodeScript,
  PaginationInfo,
  // Sites
  ListSitesParams,
  ListSitesResponse,
  GetSiteParams,
  GetSiteResponse,
  PublishSiteParams,
  PublishSiteResponse,
  // Pages
  ListPagesParams,
  ListPagesResponse,
  GetPageParams,
  GetPageResponse,
  GetPageMetadataParams,
  GetPageMetadataResponse,
  UpdatePageMetadataParams,
  UpdatePageMetadataResponse,
  PageMetadata,
  // Collections
  ListCollectionsParams,
  ListCollectionsResponse,
  GetCollectionParams,
  GetCollectionResponse,
  // Collection Items
  ListCollectionItemsParams,
  ListCollectionItemsResponse,
  GetCollectionItemParams,
  GetCollectionItemResponse,
  CreateCollectionItemParams,
  CreateCollectionItemResponse,
  UpdateCollectionItemParams,
  UpdateCollectionItemResponse,
  DeleteCollectionItemParams,
  DeleteCollectionItemResponse,
  PublishCollectionItemsParams,
  PublishCollectionItemsResponse,
  // Assets
  ListAssetsParams,
  ListAssetsResponse,
  GetAssetParams,
  GetAssetResponse,
  // Custom Code
  GetSiteCustomCodeParams,
  GetSiteCustomCodeResponse,
  RegisterSiteCustomCodeParams,
  RegisterSiteCustomCodeResponse,
  GetPageCustomCodeParams,
  GetPageCustomCodeResponse,
  RegisterPageCustomCodeParams,
  RegisterPageCustomCodeResponse,
} from './types.js'
