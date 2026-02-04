/**
 * Webflow Client
 *
 * Runtime-agnostic HTTP client for Webflow API v2.
 * Uses bearer token authentication.
 */

import { ok, fail, type Result } from '../types.js'
import type {
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

export interface WebflowClientConfig {
  /** Webflow API access token */
  accessToken: string
  /** Base URL override (for testing) */
  baseUrl?: string
}

const DEFAULT_BASE_URL = 'https://api.webflow.com/v2'

export class WebflowClient {
  private accessToken: string
  private baseUrl: string

  constructor(config: WebflowClientConfig) {
    this.accessToken = config.accessToken
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL
  }

  // ==========================================================================
  // HTTP Request Helper
  // ==========================================================================

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: Record<string, unknown>,
    queryParams?: Record<string, string | number | undefined>
  ): Promise<Result<T>> {
    try {
      // Build URL with query params
      let url = `${this.baseUrl}${endpoint}`
      if (queryParams) {
        const params = new URLSearchParams()
        for (const [key, value] of Object.entries(queryParams)) {
          if (value !== undefined) {
            params.append(key, String(value))
          }
        }
        const queryString = params.toString()
        if (queryString) {
          url += `?${queryString}`
        }
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/json',
      }

      if (body && method !== 'GET') {
        headers['Content-Type'] = 'application/json'
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      // Handle no content responses
      if (response.status === 204) {
        return ok({ deleted: true } as T)
      }

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.message || data.msg || `HTTP ${response.status}`
        return fail(
          data.code || 'WEBFLOW_ERROR',
          errorMessage,
          response.status,
          data
        )
      }

      return ok(data as T)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return fail('NETWORK_ERROR', message, 500)
    }
  }

  // ==========================================================================
  // Sites API
  // ==========================================================================

  /**
   * List all sites in the workspace
   */
  async listSites(params: ListSitesParams = {}): Promise<Result<ListSitesResponse>> {
    return this.request<ListSitesResponse>('/sites', 'GET', undefined, {
      limit: params.limit,
      offset: params.offset,
    })
  }

  /**
   * Get a specific site by ID
   */
  async getSite(params: GetSiteParams): Promise<Result<GetSiteResponse>> {
    return this.request<GetSiteResponse>(`/sites/${params.siteId}`)
  }

  /**
   * Publish a site to its domains
   */
  async publishSite(params: PublishSiteParams): Promise<Result<PublishSiteResponse>> {
    const { siteId, ...body } = params
    return this.request<PublishSiteResponse>(
      `/sites/${siteId}/publish`,
      'POST',
      body as unknown as Record<string, unknown>
    )
  }

  // ==========================================================================
  // Pages API
  // ==========================================================================

  /**
   * List all pages for a site
   */
  async listPages(params: ListPagesParams): Promise<Result<ListPagesResponse>> {
    const { siteId, ...queryParams } = params
    return this.request<ListPagesResponse>(`/sites/${siteId}/pages`, 'GET', undefined, queryParams)
  }

  /**
   * Get a specific page by ID
   */
  async getPage(params: GetPageParams): Promise<Result<GetPageResponse>> {
    return this.request<GetPageResponse>(`/pages/${params.pageId}`, 'GET', undefined, {
      localeId: params.localeId,
    })
  }

  /**
   * Get page metadata (SEO, OpenGraph)
   */
  async getPageMetadata(params: GetPageMetadataParams): Promise<Result<GetPageMetadataResponse>> {
    return this.request<GetPageMetadataResponse>(
      `/pages/${params.pageId}/dom`,
      'GET',
      undefined,
      { localeId: params.localeId }
    )
  }

  /**
   * Update page metadata
   */
  async updatePageMetadata(params: UpdatePageMetadataParams): Promise<Result<UpdatePageMetadataResponse>> {
    const { pageId, localeId, ...body } = params
    return this.request<UpdatePageMetadataResponse>(
      `/pages/${pageId}`,
      'PATCH',
      body as Record<string, unknown>,
      { localeId }
    )
  }

  // ==========================================================================
  // Collections API
  // ==========================================================================

  /**
   * List all collections for a site
   */
  async listCollections(params: ListCollectionsParams): Promise<Result<ListCollectionsResponse>> {
    return this.request<ListCollectionsResponse>(`/sites/${params.siteId}/collections`)
  }

  /**
   * Get a specific collection by ID
   */
  async getCollection(params: GetCollectionParams): Promise<Result<GetCollectionResponse>> {
    return this.request<GetCollectionResponse>(`/collections/${params.collectionId}`)
  }

  // ==========================================================================
  // Collection Items API
  // ==========================================================================

  /**
   * List items in a collection
   */
  async listCollectionItems(params: ListCollectionItemsParams): Promise<Result<ListCollectionItemsResponse>> {
    const { collectionId, ...queryParams } = params
    return this.request<ListCollectionItemsResponse>(
      `/collections/${collectionId}/items`,
      'GET',
      undefined,
      queryParams
    )
  }

  /**
   * Get a specific collection item
   */
  async getCollectionItem(params: GetCollectionItemParams): Promise<Result<GetCollectionItemResponse>> {
    return this.request<GetCollectionItemResponse>(
      `/collections/${params.collectionId}/items/${params.itemId}`,
      'GET',
      undefined,
      { cmsLocaleId: params.cmsLocaleId }
    )
  }

  /**
   * Create a new collection item
   */
  async createCollectionItem(params: CreateCollectionItemParams): Promise<Result<CreateCollectionItemResponse>> {
    const { collectionId, cmsLocaleId, ...body } = params
    return this.request<CreateCollectionItemResponse>(
      `/collections/${collectionId}/items`,
      'POST',
      body as Record<string, unknown>,
      { cmsLocaleId }
    )
  }

  /**
   * Update a collection item
   */
  async updateCollectionItem(params: UpdateCollectionItemParams): Promise<Result<UpdateCollectionItemResponse>> {
    const { collectionId, itemId, cmsLocaleId, ...body } = params
    return this.request<UpdateCollectionItemResponse>(
      `/collections/${collectionId}/items/${itemId}`,
      'PATCH',
      body as Record<string, unknown>,
      { cmsLocaleId }
    )
  }

  /**
   * Delete a collection item
   */
  async deleteCollectionItem(params: DeleteCollectionItemParams): Promise<Result<DeleteCollectionItemResponse>> {
    return this.request<DeleteCollectionItemResponse>(
      `/collections/${params.collectionId}/items/${params.itemId}`,
      'DELETE',
      undefined,
      { cmsLocaleId: params.cmsLocaleId }
    )
  }

  /**
   * Publish collection items (make live)
   */
  async publishCollectionItems(params: PublishCollectionItemsParams): Promise<Result<PublishCollectionItemsResponse>> {
    const { collectionId, itemIds } = params
    return this.request<PublishCollectionItemsResponse>(
      `/collections/${collectionId}/items/publish`,
      'POST',
      { itemIds }
    )
  }

  // ==========================================================================
  // Assets API
  // ==========================================================================

  /**
   * List all assets for a site
   */
  async listAssets(params: ListAssetsParams): Promise<Result<ListAssetsResponse>> {
    const { siteId, ...queryParams } = params
    return this.request<ListAssetsResponse>(`/sites/${siteId}/assets`, 'GET', undefined, queryParams)
  }

  /**
   * Get a specific asset by ID
   */
  async getAsset(params: GetAssetParams): Promise<Result<GetAssetResponse>> {
    return this.request<GetAssetResponse>(`/assets/${params.assetId}`)
  }

  // ==========================================================================
  // Custom Code API
  // ==========================================================================

  /**
   * Get custom code for a site
   */
  async getSiteCustomCode(params: GetSiteCustomCodeParams): Promise<Result<GetSiteCustomCodeResponse>> {
    return this.request<GetSiteCustomCodeResponse>(`/sites/${params.siteId}/custom_code`)
  }

  /**
   * Register custom code for a site
   */
  async registerSiteCustomCode(params: RegisterSiteCustomCodeParams): Promise<Result<RegisterSiteCustomCodeResponse>> {
    const { siteId, ...body } = params
    return this.request<RegisterSiteCustomCodeResponse>(
      `/sites/${siteId}/custom_code`,
      'POST',
      body as Record<string, unknown>
    )
  }

  /**
   * Get custom code for a page
   */
  async getPageCustomCode(params: GetPageCustomCodeParams): Promise<Result<GetPageCustomCodeResponse>> {
    return this.request<GetPageCustomCodeResponse>(`/pages/${params.pageId}/custom_code`)
  }

  /**
   * Register custom code for a page
   */
  async registerPageCustomCode(params: RegisterPageCustomCodeParams): Promise<Result<RegisterPageCustomCodeResponse>> {
    const { pageId, ...body } = params
    return this.request<RegisterPageCustomCodeResponse>(
      `/pages/${pageId}/custom_code`,
      'POST',
      body as Record<string, unknown>
    )
  }
}
