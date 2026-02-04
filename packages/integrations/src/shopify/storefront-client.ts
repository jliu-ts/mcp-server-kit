/**
 * Shopify Storefront API Client
 *
 * Runtime-agnostic client for Shopify's GraphQL Storefront API.
 * Used for headless commerce: products, collections, cart, checkout.
 *
 * @example
 * import { StorefrontClient } from '@trendingsociety/integrations/shopify'
 *
 * const storefront = new StorefrontClient({
 *   storeDomain: 'mystore.myshopify.com',
 *   storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_TOKEN,
 * })
 *
 * const products = await storefront.getProducts({ first: 10 })
 * const cart = await storefront.createCart({ lines: [...] })
 */

import { API } from '../config/constants'
import { graphqlRequest, ok, type Result, type ClientConfig } from '../types.js'
import type {
  StorefrontProduct,
  StorefrontCollection,
  StorefrontCart,
  StorefrontShop,
  StorefrontGetProductsParams,
  StorefrontGetProductsResponse,
  StorefrontGetProductParams,
  StorefrontGetProductResponse,
  StorefrontGetCollectionsParams,
  StorefrontGetCollectionsResponse,
  StorefrontGetCollectionParams,
  StorefrontGetCollectionResponse,
  StorefrontSearchParams,
  StorefrontSearchResponse,
  StorefrontPredictiveSearchParams,
  StorefrontPredictiveSearchResponse,
  StorefrontCreateCartParams,
  StorefrontCreateCartResponse,
  StorefrontAddCartLinesParams,
  StorefrontAddCartLinesResponse,
  StorefrontUpdateCartLinesParams,
  StorefrontUpdateCartLinesResponse,
  StorefrontRemoveCartLinesParams,
  StorefrontRemoveCartLinesResponse,
  StorefrontGetCartParams,
  StorefrontGetCartResponse,
  StorefrontApplyDiscountParams,
  StorefrontApplyDiscountResponse,
  StorefrontGetShopResponse,
  StorefrontGetRecommendationsResponse,
} from './storefront-types.js'

// ============================================================================
// Configuration
// ============================================================================

const API_VERSION = '2024-01'

export interface StorefrontClientConfig extends ClientConfig {
  /** Store domain (e.g., mystore.myshopify.com) */
  storeDomain: string
  /** Storefront API access token (public) */
  storefrontAccessToken: string
  /** API version (default: 2024-01) */
  apiVersion?: string
}

// ============================================================================
// GraphQL Fragments
// ============================================================================

const MONEY_FRAGMENT = `
  fragment MoneyFragment on MoneyV2 {
    amount
    currencyCode
  }
`

const IMAGE_FRAGMENT = `
  fragment ImageFragment on Image {
    url
    altText
    width
    height
  }
`

const PRODUCT_VARIANT_FRAGMENT = `
  fragment ProductVariantFragment on ProductVariant {
    id
    title
    availableForSale
    price { ...MoneyFragment }
    compareAtPrice { ...MoneyFragment }
    sku
    selectedOptions { name value }
    image { ...ImageFragment }
  }
`

const PRODUCT_FRAGMENT = `
  fragment ProductFragment on Product {
    id
    title
    handle
    description
    descriptionHtml
    availableForSale
    priceRange {
      minVariantPrice { ...MoneyFragment }
      maxVariantPrice { ...MoneyFragment }
    }
    compareAtPriceRange {
      minVariantPrice { ...MoneyFragment }
      maxVariantPrice { ...MoneyFragment }
    }
    featuredImage { ...ImageFragment }
    images(first: 10) { nodes { ...ImageFragment } }
    options { id name values }
    variants(first: 50) { nodes { ...ProductVariantFragment } }
    tags
    vendor
    productType
    createdAt
    updatedAt
  }
`

const CART_LINE_FRAGMENT = `
  fragment CartLineFragment on CartLine {
    id
    quantity
    merchandise {
      ... on ProductVariant {
        id
        title
        product { id title handle featuredImage { ...ImageFragment } }
        price { ...MoneyFragment }
        selectedOptions { name value }
        image { ...ImageFragment }
      }
    }
    cost {
      totalAmount { ...MoneyFragment }
      amountPerQuantity { ...MoneyFragment }
    }
  }
`

const CART_FRAGMENT = `
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    lines(first: 100) { nodes { ...CartLineFragment } }
    cost {
      totalAmount { ...MoneyFragment }
      subtotalAmount { ...MoneyFragment }
      totalTaxAmount { ...MoneyFragment }
      totalDutyAmount { ...MoneyFragment }
    }
    buyerIdentity {
      email
      phone
      customer { id }
    }
    discountCodes { code applicable }
    attributes { key value }
  }
`

// Product-related fragments (no cart)
const PRODUCT_FRAGMENTS = `
  ${MONEY_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${PRODUCT_VARIANT_FRAGMENT}
  ${PRODUCT_FRAGMENT}
`

// Cart-related fragments (includes product for line items)
const CART_FRAGMENTS = `
  ${MONEY_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${CART_LINE_FRAGMENT}
  ${CART_FRAGMENT}
`

// ============================================================================
// Client Implementation
// ============================================================================

export class StorefrontClient {
  private storeDomain: string
  private storefrontAccessToken: string
  private apiVersion: string
  private timeout: number
  private fetchFn: typeof fetch
  private debug: boolean

  constructor(config: StorefrontClientConfig) {
    if (!config.storeDomain) {
      throw new Error('StorefrontClient requires storeDomain')
    }
    if (!config.storefrontAccessToken) {
      throw new Error('StorefrontClient requires storefrontAccessToken')
    }

    this.storeDomain = config.storeDomain.replace(/^https?:\/\//, '')
    this.storefrontAccessToken = config.storefrontAccessToken
    this.apiVersion = config.apiVersion ?? API_VERSION
    this.timeout = config.timeout ?? API.defaultTimeout
    this.fetchFn = config.fetch ?? fetch
    this.debug = config.debug ?? false
  }

  private get apiUrl(): string {
    return `https://${this.storeDomain}/api/${this.apiVersion}/graphql.json`
  }

  // --------------------------------------------------------------------------
  // Products
  // --------------------------------------------------------------------------

  async getProducts(params: StorefrontGetProductsParams = {}): Promise<Result<StorefrontGetProductsResponse>> {
    const first = Math.min(params.first ?? 20, 50)
    const sortKey = params.sortKey ?? 'BEST_SELLING'
    const reverse = params.reverse ?? false

    let queryArg = ''
    if (params.query) {
      queryArg = `, query: "${params.query}"`
    }
    let afterArg = ''
    if (params.after) {
      afterArg = `, after: "${params.after}"`
    }

    const query = `
      ${PRODUCT_FRAGMENTS}
      query GetProducts($first: Int!, $sortKey: ProductSortKeys!, $reverse: Boolean!) {
        products(first: $first, sortKey: $sortKey, reverse: $reverse${queryArg}${afterArg}) {
          nodes { ...ProductFragment }
          pageInfo { hasNextPage endCursor }
        }
      }
    `

    const result = await this.query<{
      products: {
        nodes: StorefrontProduct[]
        pageInfo: { hasNextPage: boolean; endCursor?: string }
      }
    }>(query, { first, sortKey, reverse })

    if (!result.success) return result

    return ok({
      products: this.transformProducts(result.data.products.nodes),
      pageInfo: result.data.products.pageInfo,
    })
  }

  async getProduct(params: StorefrontGetProductParams): Promise<Result<StorefrontGetProductResponse>> {
    if (!params.handle && !params.id) {
      return { success: false, error: { code: 'INVALID_PARAMS', message: 'Either handle or id is required' } }
    }

    let query: string
    let variables: Record<string, unknown>

    if (params.handle) {
      query = `
        ${PRODUCT_FRAGMENTS}
        query GetProductByHandle($handle: String!) {
          product(handle: $handle) { ...ProductFragment }
        }
      `
      variables = { handle: params.handle }
    } else {
      query = `
        ${PRODUCT_FRAGMENTS}
        query GetProductById($id: ID!) {
          product(id: $id) { ...ProductFragment }
        }
      `
      variables = { id: params.id }
    }

    const result = await this.query<{ product: StorefrontProduct | null }>(query, variables)

    if (!result.success) return result
    if (!result.data.product) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } }
    }

    return ok({ product: this.transformProduct(result.data.product) })
  }

  async getProductRecommendations(productId: string): Promise<Result<StorefrontGetRecommendationsResponse>> {
    const query = `
      ${PRODUCT_FRAGMENTS}
      query GetRecommendations($productId: ID!) {
        productRecommendations(productId: $productId) { ...ProductFragment }
      }
    `

    const result = await this.query<{ productRecommendations: StorefrontProduct[] | null }>(query, { productId })

    if (!result.success) return result

    return ok({ products: this.transformProducts(result.data.productRecommendations ?? []) })
  }

  // --------------------------------------------------------------------------
  // Collections
  // --------------------------------------------------------------------------

  async getCollections(params: StorefrontGetCollectionsParams = {}): Promise<Result<StorefrontGetCollectionsResponse>> {
    const first = Math.min(params.first ?? 20, 50)

    let queryArg = ''
    if (params.query) {
      queryArg = `, query: "${params.query}"`
    }
    let afterArg = ''
    if (params.after) {
      afterArg = `, after: "${params.after}"`
    }

    const query = `
      ${IMAGE_FRAGMENT}
      query GetCollections($first: Int!) {
        collections(first: $first${queryArg}${afterArg}) {
          nodes {
            id
            title
            handle
            description
            descriptionHtml
            image { ...ImageFragment }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    `

    const result = await this.query<{
      collections: {
        nodes: StorefrontCollection[]
        pageInfo: { hasNextPage: boolean; endCursor?: string }
      }
    }>(query, { first })

    if (!result.success) return result

    return ok({
      collections: result.data.collections.nodes,
      pageInfo: result.data.collections.pageInfo,
    })
  }

  async getCollection(params: StorefrontGetCollectionParams): Promise<Result<StorefrontGetCollectionResponse>> {
    if (!params.handle && !params.id) {
      return { success: false, error: { code: 'INVALID_PARAMS', message: 'Either handle or id is required' } }
    }

    const productsFirst = params.productsFirst ?? 20

    let query: string
    let variables: Record<string, unknown>

    if (params.handle) {
      query = `
        ${PRODUCT_FRAGMENTS}
        query GetCollectionByHandle($handle: String!, $productsFirst: Int!) {
          collection(handle: $handle) {
            id
            title
            handle
            description
            descriptionHtml
            image { ...ImageFragment }
            products(first: $productsFirst) {
              nodes { ...ProductFragment }
            }
          }
        }
      `
      variables = { handle: params.handle, productsFirst }
    } else {
      query = `
        ${PRODUCT_FRAGMENTS}
        query GetCollectionById($id: ID!, $productsFirst: Int!) {
          collection(id: $id) {
            id
            title
            handle
            description
            descriptionHtml
            image { ...ImageFragment }
            products(first: $productsFirst) {
              nodes { ...ProductFragment }
            }
          }
        }
      `
      variables = { id: params.id, productsFirst }
    }

    const result = await this.query<{
      collection: (StorefrontCollection & { products: { nodes: StorefrontProduct[] } }) | null
    }>(query, variables)

    if (!result.success) return result
    if (!result.data.collection) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Collection not found' } }
    }

    const collection = {
      ...result.data.collection,
      products: this.transformProducts(result.data.collection.products.nodes),
    }

    return ok({ collection })
  }

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  async search(params: StorefrontSearchParams): Promise<Result<StorefrontSearchResponse>> {
    const first = Math.min(params.first ?? 20, 50)
    const types = params.types ?? ['PRODUCT']

    const query = `
      ${PRODUCT_FRAGMENTS}
      query Search($query: String!, $first: Int!, $types: [SearchType!]) {
        search(query: $query, first: $first, types: $types) {
          nodes {
            ... on Product { ...ProductFragment }
            ... on Collection {
              id
              title
              handle
              description
              descriptionHtml
              image { ...ImageFragment }
            }
          }
          totalCount
        }
      }
    `

    const result = await this.query<{
      search: {
        nodes: Array<StorefrontProduct | StorefrontCollection>
        totalCount: number
      }
    }>(query, { query: params.query, first, types })

    if (!result.success) return result

    const products: StorefrontProduct[] = []
    const collections: StorefrontCollection[] = []

    for (const node of result.data.search.nodes) {
      if ('variants' in node) {
        products.push(this.transformProduct(node))
      } else if ('products' in node || !('variants' in node)) {
        collections.push(node as StorefrontCollection)
      }
    }

    return ok({
      results: {
        products,
        collections,
        totalProductCount: result.data.search.totalCount,
      },
    })
  }

  async predictiveSearch(params: StorefrontPredictiveSearchParams): Promise<Result<StorefrontPredictiveSearchResponse>> {
    const limit = Math.min(params.limit ?? 10, 20)
    const types = params.types ?? ['PRODUCT', 'COLLECTION', 'QUERY']

    const query = `
      ${MONEY_FRAGMENT}
      ${IMAGE_FRAGMENT}
      query PredictiveSearch($query: String!, $limit: Int!, $types: [PredictiveSearchType!]) {
        predictiveSearch(query: $query, limit: $limit, types: $types) {
          products {
            id
            title
            handle
            featuredImage { ...ImageFragment }
            priceRange {
              minVariantPrice { ...MoneyFragment }
              maxVariantPrice { ...MoneyFragment }
            }
          }
          collections {
            id
            title
            handle
          }
          queries {
            text
            styledText
          }
        }
      }
    `

    const result = await this.query<{
      predictiveSearch: {
        products: Array<{
          id: string
          title: string
          handle: string
          featuredImage?: { url: string; altText?: string }
          priceRange: { minVariantPrice: { amount: string; currencyCode: string }; maxVariantPrice: { amount: string; currencyCode: string } }
        }>
        collections: Array<{ id: string; title: string; handle: string }>
        queries: Array<{ text: string; styledText: string }>
      }
    }>(query, { query: params.query, limit, types })

    if (!result.success) return result

    return ok({
      results: {
        products: result.data.predictiveSearch.products,
        collections: result.data.predictiveSearch.collections,
        queries: result.data.predictiveSearch.queries,
      },
    })
  }

  // --------------------------------------------------------------------------
  // Cart
  // --------------------------------------------------------------------------

  async createCart(params: StorefrontCreateCartParams = {}): Promise<Result<StorefrontCreateCartResponse>> {
    const mutation = `
      ${CART_FRAGMENTS}
      mutation CreateCart($input: CartInput!) {
        cartCreate(input: $input) {
          cart { ...CartFragment }
          userErrors { field message }
        }
      }
    `

    const input: Record<string, unknown> = {}
    if (params.lines?.length) {
      input.lines = params.lines
    }
    if (params.buyerIdentity) {
      input.buyerIdentity = params.buyerIdentity
    }
    if (params.discountCodes?.length) {
      input.discountCodes = params.discountCodes
    }
    if (params.attributes?.length) {
      input.attributes = params.attributes
    }
    if (params.note) {
      input.note = params.note
    }

    const result = await this.query<{
      cartCreate: {
        cart: StorefrontCart | null
        userErrors: Array<{ field: string[]; message: string }>
      }
    }>(mutation, { input })

    if (!result.success) return result

    if (result.data.cartCreate.userErrors.length > 0) {
      return {
        success: false,
        error: { code: 'CART_ERROR', message: result.data.cartCreate.userErrors[0]?.message ?? 'Cart creation failed' },
      }
    }

    if (!result.data.cartCreate.cart) {
      return { success: false, error: { code: 'CART_ERROR', message: 'Cart not created' } }
    }

    return ok({ cart: this.transformCart(result.data.cartCreate.cart) })
  }

  async getCart(params: StorefrontGetCartParams): Promise<Result<StorefrontGetCartResponse>> {
    const query = `
      ${CART_FRAGMENTS}
      query GetCart($cartId: ID!) {
        cart(id: $cartId) { ...CartFragment }
      }
    `

    const result = await this.query<{ cart: StorefrontCart | null }>(query, { cartId: params.cartId })

    if (!result.success) return result
    if (!result.data.cart) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Cart not found' } }
    }

    return ok({ cart: this.transformCart(result.data.cart) })
  }

  async addCartLines(params: StorefrontAddCartLinesParams): Promise<Result<StorefrontAddCartLinesResponse>> {
    const mutation = `
      ${CART_FRAGMENTS}
      mutation AddCartLines($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { ...CartFragment }
          userErrors { field message }
        }
      }
    `

    const result = await this.query<{
      cartLinesAdd: {
        cart: StorefrontCart | null
        userErrors: Array<{ field: string[]; message: string }>
      }
    }>(mutation, { cartId: params.cartId, lines: params.lines })

    if (!result.success) return result

    if (result.data.cartLinesAdd.userErrors.length > 0) {
      return {
        success: false,
        error: { code: 'CART_ERROR', message: result.data.cartLinesAdd.userErrors[0]?.message ?? 'Failed to add lines' },
      }
    }

    if (!result.data.cartLinesAdd.cart) {
      return { success: false, error: { code: 'CART_ERROR', message: 'Cart not returned' } }
    }

    return ok({ cart: this.transformCart(result.data.cartLinesAdd.cart) })
  }

  async updateCartLines(params: StorefrontUpdateCartLinesParams): Promise<Result<StorefrontUpdateCartLinesResponse>> {
    const mutation = `
      ${CART_FRAGMENTS}
      mutation UpdateCartLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart { ...CartFragment }
          userErrors { field message }
        }
      }
    `

    const result = await this.query<{
      cartLinesUpdate: {
        cart: StorefrontCart | null
        userErrors: Array<{ field: string[]; message: string }>
      }
    }>(mutation, { cartId: params.cartId, lines: params.lines })

    if (!result.success) return result

    if (result.data.cartLinesUpdate.userErrors.length > 0) {
      return {
        success: false,
        error: { code: 'CART_ERROR', message: result.data.cartLinesUpdate.userErrors[0]?.message ?? 'Failed to update lines' },
      }
    }

    if (!result.data.cartLinesUpdate.cart) {
      return { success: false, error: { code: 'CART_ERROR', message: 'Cart not returned' } }
    }

    return ok({ cart: this.transformCart(result.data.cartLinesUpdate.cart) })
  }

  async removeCartLines(params: StorefrontRemoveCartLinesParams): Promise<Result<StorefrontRemoveCartLinesResponse>> {
    const mutation = `
      ${CART_FRAGMENTS}
      mutation RemoveCartLines($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ...CartFragment }
          userErrors { field message }
        }
      }
    `

    const result = await this.query<{
      cartLinesRemove: {
        cart: StorefrontCart | null
        userErrors: Array<{ field: string[]; message: string }>
      }
    }>(mutation, { cartId: params.cartId, lineIds: params.lineIds })

    if (!result.success) return result

    if (result.data.cartLinesRemove.userErrors.length > 0) {
      return {
        success: false,
        error: { code: 'CART_ERROR', message: result.data.cartLinesRemove.userErrors[0]?.message ?? 'Failed to remove lines' },
      }
    }

    if (!result.data.cartLinesRemove.cart) {
      return { success: false, error: { code: 'CART_ERROR', message: 'Cart not returned' } }
    }

    return ok({ cart: this.transformCart(result.data.cartLinesRemove.cart) })
  }

  async applyDiscountCodes(params: StorefrontApplyDiscountParams): Promise<Result<StorefrontApplyDiscountResponse>> {
    const mutation = `
      ${CART_FRAGMENTS}
      mutation ApplyDiscountCodes($cartId: ID!, $discountCodes: [String!]!) {
        cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
          cart { ...CartFragment }
          userErrors { field message }
        }
      }
    `

    const result = await this.query<{
      cartDiscountCodesUpdate: {
        cart: StorefrontCart | null
        userErrors: Array<{ field: string[]; message: string }>
      }
    }>(mutation, { cartId: params.cartId, discountCodes: params.discountCodes })

    if (!result.success) return result

    if (result.data.cartDiscountCodesUpdate.userErrors.length > 0) {
      return {
        success: false,
        error: { code: 'CART_ERROR', message: result.data.cartDiscountCodesUpdate.userErrors[0]?.message ?? 'Failed to apply discount' },
      }
    }

    if (!result.data.cartDiscountCodesUpdate.cart) {
      return { success: false, error: { code: 'CART_ERROR', message: 'Cart not returned' } }
    }

    return ok({ cart: this.transformCart(result.data.cartDiscountCodesUpdate.cart) })
  }

  // --------------------------------------------------------------------------
  // Shop Info
  // --------------------------------------------------------------------------

  async getShop(): Promise<Result<StorefrontGetShopResponse>> {
    // Note: brand.logo is MediaImage, not Image - cannot use ImageFragment
    const query = `
      query GetShop {
        shop {
          id
          name
          description
          primaryDomain { url host }
          brand {
            logo {
              image {
                url
                altText
                width
                height
              }
            }
            colors {
              primary { background foreground }
              secondary { background foreground }
            }
          }
          paymentSettings {
            currencyCode
            acceptedCardBrands
            enabledPresentmentCurrencies
          }
        }
      }
    `

    const result = await this.query<{ shop: StorefrontShop }>(query)

    if (!result.success) return result

    return ok({ shop: result.data.shop })
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private transformProducts(products: StorefrontProduct[]): StorefrontProduct[] {
    return products.map((p) => this.transformProduct(p))
  }

  private transformProduct(product: StorefrontProduct): StorefrontProduct {
    return {
      ...product,
      images: (product.images as unknown as { nodes?: StorefrontProduct['images'] })?.nodes ?? product.images ?? [],
      variants: (product.variants as unknown as { nodes?: StorefrontProduct['variants'] })?.nodes ?? product.variants ?? [],
    }
  }

  private transformCart(cart: StorefrontCart): StorefrontCart {
    return {
      ...cart,
      lines: (cart.lines as unknown as { nodes?: StorefrontCart['lines'] })?.nodes ?? cart.lines ?? [],
    }
  }

  private async query<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<Result<T>> {
    if (this.debug) {
      console.log('[StorefrontClient] Query:', query.trim().substring(0, 100))
      console.log('[StorefrontClient] Variables:', variables)
    }

    return graphqlRequest<T>(
      this.apiUrl,
      query,
      variables,
      {
        'X-Shopify-Storefront-Access-Token': this.storefrontAccessToken,
        'Content-Type': 'application/json',
      },
      this.fetchFn,
      this.timeout
    )
  }
}
