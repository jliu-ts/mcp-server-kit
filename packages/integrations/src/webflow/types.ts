/**
 * Webflow API Types
 *
 * Types for Webflow API v2.
 * Covers sites, pages, collections, CMS items, custom code, and assets.
 */

import { z } from 'zod'

// ============================================================================
// Core Types
// ============================================================================

/**
 * Site in Webflow
 */
export interface WebflowSite {
  id: string
  workspaceId: string
  createdOn: string
  displayName: string
  shortName: string
  previewUrl?: string
  timeZone: string
  lastPublished?: string
  lastUpdated: string
  customDomains?: CustomDomain[]
  defaultDomain: string
  locales?: SiteLocale[]
}

export interface CustomDomain {
  id: string
  url: string
  lastPublished?: string
}

export interface SiteLocale {
  id: string
  cmsLocaleId: string
  enabled: boolean
  displayName: string
  redirect: boolean
  subdirectory: string
  tag: string
}

/**
 * Page in Webflow
 */
export interface WebflowPage {
  id: string
  siteId: string
  title: string
  slug: string
  parentId?: string
  collectionId?: string
  createdOn: string
  lastUpdated: string
  archived: boolean
  draft: boolean
  canBranch: boolean
  seo?: PageSeo
  openGraph?: PageOpenGraph
  localeId?: string
  publishedPath?: string
}

export interface PageSeo {
  title?: string
  description?: string
}

export interface PageOpenGraph {
  title?: string
  titleCopied?: boolean
  description?: string
  descriptionCopied?: boolean
}

/**
 * Collection (CMS) in Webflow
 */
export interface WebflowCollection {
  id: string
  displayName: string
  singularName: string
  slug: string
  createdOn: string
  lastUpdated: string
  fields: CollectionField[]
}

export interface CollectionField {
  id: string
  isEditable: boolean
  isRequired: boolean
  type: CollectionFieldType
  slug: string
  displayName: string
  helpText?: string
  validations?: Record<string, unknown>
}

export type CollectionFieldType =
  | 'Bool'
  | 'Color'
  | 'Date'
  | 'ExtFileRef'
  | 'Set'
  | 'ImageRef'
  | 'ItemRef'
  | 'ItemRefSet'
  | 'Link'
  | 'Number'
  | 'Option'
  | 'PlainText'
  | 'RichText'
  | 'Video'
  | 'User'

/**
 * Collection Item (CMS item)
 */
export interface WebflowCollectionItem {
  id: string
  cmsLocaleId?: string
  lastPublished?: string
  lastUpdated: string
  createdOn: string
  isArchived: boolean
  isDraft: boolean
  fieldData: Record<string, unknown>
}

/**
 * Asset in Webflow
 */
export interface WebflowAsset {
  id: string
  contentType: string
  size: number
  siteId: string
  hostedUrl: string
  originalFileName: string
  displayName: string
  lastUpdated: string
  createdOn: string
  variants?: AssetVariant[]
}

export interface AssetVariant {
  hostedUrl: string
  originalFileName: string
  displayName: string
  format: string
  width?: number
  height?: number
  quality?: number
  error?: string
}

/**
 * Custom Code
 */
export interface WebflowCustomCode {
  siteId?: string
  pageId?: string
  createdOn: string
  lastUpdated: string
  hostedLocation?: string
  scripts?: CustomCodeScript[]
}

export interface CustomCodeScript {
  id: string
  location: 'header' | 'footer'
  version: string
  attributes?: Record<string, string>
  type?: 'inline' | 'hosted'
  hostedLocation?: string
  inlineCode?: string
  integrityHash?: string
  canCopy: boolean
  displayName: string
}

// ============================================================================
// Pagination
// ============================================================================

export interface PaginationInfo {
  limit: number
  offset: number
  total: number
}

// ============================================================================
// Sites API
// ============================================================================

export interface ListSitesParams {
  limit?: number
  offset?: number
}

export const ListSitesInputSchema = z.object({
  limit: z.number().min(1).max(100).optional().describe('Maximum sites to return (1-100)'),
  offset: z.number().min(0).optional().describe('Offset for pagination'),
})

export interface ListSitesResponse {
  sites: WebflowSite[]
  pagination: PaginationInfo
}

export interface GetSiteParams {
  siteId: string
}

export const GetSiteInputSchema = z.object({
  siteId: z.string().describe('The site ID'),
})

export type GetSiteResponse = WebflowSite

export interface PublishSiteParams {
  siteId: string
  publishToWebflowSubdomain?: boolean
  customDomains?: string[]
}

export const PublishSiteInputSchema = z.object({
  siteId: z.string().describe('The site ID to publish'),
  publishToWebflowSubdomain: z.boolean().optional().describe('Publish to Webflow subdomain'),
  customDomains: z.array(z.string()).optional().describe('Custom domains to publish to'),
})

export interface PublishSiteResponse {
  publishedOn: string
  customDomains?: string[]
}

// ============================================================================
// Pages API
// ============================================================================

export interface ListPagesParams {
  siteId: string
  limit?: number
  offset?: number
  localeId?: string
}

export const ListPagesInputSchema = z.object({
  siteId: z.string().describe('The site ID'),
  limit: z.number().min(1).max(100).optional().describe('Maximum pages to return (1-100)'),
  offset: z.number().min(0).optional().describe('Offset for pagination'),
  localeId: z.string().optional().describe('Filter by locale ID'),
})

export interface ListPagesResponse {
  pages: WebflowPage[]
  pagination: PaginationInfo
}

export interface GetPageParams {
  pageId: string
  localeId?: string
}

export const GetPageInputSchema = z.object({
  pageId: z.string().describe('The page ID'),
  localeId: z.string().optional().describe('Locale ID for localized content'),
})

export type GetPageResponse = WebflowPage

export interface GetPageMetadataParams {
  pageId: string
  localeId?: string
}

export const GetPageMetadataInputSchema = z.object({
  pageId: z.string().describe('The page ID'),
  localeId: z.string().optional().describe('Locale ID for localized content'),
})

export interface PageMetadata {
  id: string
  siteId: string
  title: string
  slug: string
  seo?: PageSeo
  openGraph?: PageOpenGraph
}

export type GetPageMetadataResponse = PageMetadata

export interface UpdatePageMetadataParams {
  pageId: string
  localeId?: string
  title?: string
  slug?: string
  seo?: PageSeo
  openGraph?: PageOpenGraph
}

export const UpdatePageMetadataInputSchema = z.object({
  pageId: z.string().describe('The page ID'),
  localeId: z.string().optional().describe('Locale ID'),
  title: z.string().optional().describe('New page title'),
  slug: z.string().optional().describe('New page slug'),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }).optional().describe('SEO settings'),
  openGraph: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }).optional().describe('Open Graph settings'),
})

export type UpdatePageMetadataResponse = WebflowPage

// ============================================================================
// Collections API
// ============================================================================

export interface ListCollectionsParams {
  siteId: string
}

export const ListCollectionsInputSchema = z.object({
  siteId: z.string().describe('The site ID'),
})

export interface ListCollectionsResponse {
  collections: WebflowCollection[]
}

export interface GetCollectionParams {
  collectionId: string
}

export const GetCollectionInputSchema = z.object({
  collectionId: z.string().describe('The collection ID'),
})

export type GetCollectionResponse = WebflowCollection

// ============================================================================
// Collection Items API
// ============================================================================

export interface ListCollectionItemsParams {
  collectionId: string
  limit?: number
  offset?: number
  cmsLocaleId?: string
}

export const ListCollectionItemsInputSchema = z.object({
  collectionId: z.string().describe('The collection ID'),
  limit: z.number().min(1).max(100).optional().describe('Maximum items to return (1-100)'),
  offset: z.number().min(0).optional().describe('Offset for pagination'),
  cmsLocaleId: z.string().optional().describe('CMS locale ID'),
})

export interface ListCollectionItemsResponse {
  items: WebflowCollectionItem[]
  pagination: PaginationInfo
}

export interface GetCollectionItemParams {
  collectionId: string
  itemId: string
  cmsLocaleId?: string
}

export const GetCollectionItemInputSchema = z.object({
  collectionId: z.string().describe('The collection ID'),
  itemId: z.string().describe('The item ID'),
  cmsLocaleId: z.string().optional().describe('CMS locale ID'),
})

export type GetCollectionItemResponse = WebflowCollectionItem

export interface CreateCollectionItemParams {
  collectionId: string
  isArchived?: boolean
  isDraft?: boolean
  fieldData: Record<string, unknown>
  cmsLocaleId?: string
}

export const CreateCollectionItemInputSchema = z.object({
  collectionId: z.string().describe('The collection ID'),
  isArchived: z.boolean().optional().describe('Whether the item is archived'),
  isDraft: z.boolean().optional().describe('Whether the item is a draft'),
  fieldData: z.record(z.unknown()).describe('Field data for the item (use collection field slugs as keys)'),
  cmsLocaleId: z.string().optional().describe('CMS locale ID'),
})

export type CreateCollectionItemResponse = WebflowCollectionItem

export interface UpdateCollectionItemParams {
  collectionId: string
  itemId: string
  isArchived?: boolean
  isDraft?: boolean
  fieldData?: Record<string, unknown>
  cmsLocaleId?: string
}

export const UpdateCollectionItemInputSchema = z.object({
  collectionId: z.string().describe('The collection ID'),
  itemId: z.string().describe('The item ID'),
  isArchived: z.boolean().optional().describe('Whether the item is archived'),
  isDraft: z.boolean().optional().describe('Whether the item is a draft'),
  fieldData: z.record(z.unknown()).optional().describe('Field data to update'),
  cmsLocaleId: z.string().optional().describe('CMS locale ID'),
})

export type UpdateCollectionItemResponse = WebflowCollectionItem

export interface DeleteCollectionItemParams {
  collectionId: string
  itemId: string
  cmsLocaleId?: string
}

export const DeleteCollectionItemInputSchema = z.object({
  collectionId: z.string().describe('The collection ID'),
  itemId: z.string().describe('The item ID'),
  cmsLocaleId: z.string().optional().describe('CMS locale ID'),
})

export interface DeleteCollectionItemResponse {
  deleted: boolean
}

export interface PublishCollectionItemsParams {
  collectionId: string
  itemIds: string[]
}

export const PublishCollectionItemsInputSchema = z.object({
  collectionId: z.string().describe('The collection ID'),
  itemIds: z.array(z.string()).min(1).max(100).describe('Item IDs to publish (max 100)'),
})

export interface PublishCollectionItemsResponse {
  publishedItemIds: string[]
  errors?: Array<{ itemId: string; error: string }>
}

// ============================================================================
// Assets API
// ============================================================================

export interface ListAssetsParams {
  siteId: string
  limit?: number
  offset?: number
}

export const ListAssetsInputSchema = z.object({
  siteId: z.string().describe('The site ID'),
  limit: z.number().min(1).max(100).optional().describe('Maximum assets to return (1-100)'),
  offset: z.number().min(0).optional().describe('Offset for pagination'),
})

export interface ListAssetsResponse {
  assets: WebflowAsset[]
  pagination: PaginationInfo
}

export interface GetAssetParams {
  assetId: string
}

export const GetAssetInputSchema = z.object({
  assetId: z.string().describe('The asset ID'),
})

export type GetAssetResponse = WebflowAsset

// ============================================================================
// Custom Code API
// ============================================================================

export interface GetSiteCustomCodeParams {
  siteId: string
}

export const GetSiteCustomCodeInputSchema = z.object({
  siteId: z.string().describe('The site ID'),
})

export type GetSiteCustomCodeResponse = WebflowCustomCode

export interface RegisterSiteCustomCodeParams {
  siteId: string
  hostedLocation?: string
  inlineCode?: string
  location: 'header' | 'footer'
  version: string
  displayName: string
}

export const RegisterSiteCustomCodeInputSchema = z.object({
  siteId: z.string().describe('The site ID'),
  hostedLocation: z.string().optional().describe('URL of hosted script'),
  inlineCode: z.string().optional().describe('Inline script code'),
  location: z.enum(['header', 'footer']).describe('Where to inject the code'),
  version: z.string().describe('Version string for the script'),
  displayName: z.string().describe('Display name for the script'),
})

export type RegisterSiteCustomCodeResponse = CustomCodeScript

export interface GetPageCustomCodeParams {
  pageId: string
}

export const GetPageCustomCodeInputSchema = z.object({
  pageId: z.string().describe('The page ID'),
})

export type GetPageCustomCodeResponse = WebflowCustomCode

export interface RegisterPageCustomCodeParams {
  pageId: string
  hostedLocation?: string
  inlineCode?: string
  location: 'header' | 'footer'
  version: string
  displayName: string
}

export const RegisterPageCustomCodeInputSchema = z.object({
  pageId: z.string().describe('The page ID'),
  hostedLocation: z.string().optional().describe('URL of hosted script'),
  inlineCode: z.string().optional().describe('Inline script code'),
  location: z.enum(['header', 'footer']).describe('Where to inject the code'),
  version: z.string().describe('Version string for the script'),
  displayName: z.string().describe('Display name for the script'),
})

export type RegisterPageCustomCodeResponse = CustomCodeScript
