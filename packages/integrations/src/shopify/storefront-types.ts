/**
 * Shopify Storefront API Types
 *
 * Types for headless commerce operations: products, collections, cart, checkout.
 * Used by StorefrontClient and storefront tools.
 */

// ============================================================================
// Money & Pricing
// ============================================================================

export interface StorefrontMoney {
  amount: string
  currencyCode: string
}

export interface StorefrontPriceRange {
  minVariantPrice: StorefrontMoney
  maxVariantPrice: StorefrontMoney
}

// ============================================================================
// Images
// ============================================================================

export interface StorefrontImage {
  url: string
  altText?: string
  width?: number
  height?: number
}

// ============================================================================
// Products
// ============================================================================

export interface StorefrontProductVariant {
  id: string
  title: string
  availableForSale: boolean
  price: StorefrontMoney
  compareAtPrice?: StorefrontMoney
  sku?: string
  selectedOptions: Array<{
    name: string
    value: string
  }>
  image?: StorefrontImage
}

export interface StorefrontProduct {
  id: string
  title: string
  handle: string
  description: string
  descriptionHtml: string
  availableForSale: boolean
  priceRange: StorefrontPriceRange
  compareAtPriceRange?: StorefrontPriceRange
  featuredImage?: StorefrontImage
  images: StorefrontImage[]
  options: Array<{
    id: string
    name: string
    values: string[]
  }>
  variants: StorefrontProductVariant[]
  tags: string[]
  vendor: string
  productType: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Collections
// ============================================================================

export interface StorefrontCollection {
  id: string
  title: string
  handle: string
  description: string
  descriptionHtml: string
  image?: StorefrontImage
  products: StorefrontProduct[]
  productsCount?: number
}

// ============================================================================
// Cart
// ============================================================================

export interface StorefrontCartLine {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    product: {
      id: string
      title: string
      handle: string
      featuredImage?: StorefrontImage
    }
    price: StorefrontMoney
    selectedOptions: Array<{
      name: string
      value: string
    }>
    image?: StorefrontImage
  }
  cost: {
    totalAmount: StorefrontMoney
    amountPerQuantity: StorefrontMoney
  }
}

export interface StorefrontCart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  lines: StorefrontCartLine[]
  cost: {
    totalAmount: StorefrontMoney
    subtotalAmount: StorefrontMoney
    totalTaxAmount?: StorefrontMoney
    totalDutyAmount?: StorefrontMoney
  }
  buyerIdentity?: {
    email?: string
    phone?: string
    customer?: {
      id: string
    }
  }
  discountCodes: Array<{
    code: string
    applicable: boolean
  }>
  attributes: Array<{
    key: string
    value: string
  }>
}

// ============================================================================
// Search & Recommendations
// ============================================================================

export interface StorefrontSearchResult {
  products: StorefrontProduct[]
  collections: StorefrontCollection[]
  totalProductCount: number
}

export interface StorefrontPredictiveSearchResult {
  products: Array<{
    id: string
    title: string
    handle: string
    featuredImage?: StorefrontImage
    priceRange: StorefrontPriceRange
  }>
  collections: Array<{
    id: string
    title: string
    handle: string
  }>
  queries: Array<{
    text: string
    styledText: string
  }>
}

// ============================================================================
// Shop Info
// ============================================================================

export interface StorefrontShop {
  id: string
  name: string
  description?: string
  primaryDomain: {
    url: string
    host: string
  }
  brand?: {
    logo?: StorefrontImage
    colors: {
      primary?: Array<{ background: string; foreground: string }>
      secondary?: Array<{ background: string; foreground: string }>
    }
  }
  paymentSettings: {
    currencyCode: string
    acceptedCardBrands: string[]
    enabledPresentmentCurrencies: string[]
  }
}

// ============================================================================
// Input Types (prefixed to avoid Admin API conflicts)
// ============================================================================

export interface StorefrontGetProductsParams {
  first?: number
  after?: string
  query?: string
  sortKey?: 'TITLE' | 'PRICE' | 'BEST_SELLING' | 'CREATED' | 'UPDATED' | 'RELEVANCE'
  reverse?: boolean
}

export interface StorefrontGetProductParams {
  handle?: string
  id?: string
}

export interface StorefrontGetCollectionsParams {
  first?: number
  after?: string
  query?: string
}

export interface StorefrontGetCollectionParams {
  handle?: string
  id?: string
  productsFirst?: number
}

export interface StorefrontSearchParams {
  query: string
  first?: number
  types?: Array<'PRODUCT' | 'COLLECTION' | 'PAGE' | 'ARTICLE'>
  productFilters?: Array<{
    productType?: string
    vendor?: string
    tag?: string
    available?: boolean
    price?: { min?: number; max?: number }
  }>
}

export interface StorefrontPredictiveSearchParams {
  query: string
  limit?: number
  types?: Array<'PRODUCT' | 'COLLECTION' | 'PAGE' | 'ARTICLE' | 'QUERY'>
}

export interface StorefrontCreateCartParams {
  lines?: Array<{
    merchandiseId: string
    quantity: number
    attributes?: Array<{ key: string; value: string }>
  }>
  buyerIdentity?: {
    email?: string
    phone?: string
    countryCode?: string
  }
  discountCodes?: string[]
  attributes?: Array<{ key: string; value: string }>
  note?: string
}

export interface StorefrontAddCartLinesParams {
  cartId: string
  lines: Array<{
    merchandiseId: string
    quantity: number
    attributes?: Array<{ key: string; value: string }>
  }>
}

export interface StorefrontUpdateCartLinesParams {
  cartId: string
  lines: Array<{
    id: string
    quantity: number
    attributes?: Array<{ key: string; value: string }>
  }>
}

export interface StorefrontRemoveCartLinesParams {
  cartId: string
  lineIds: string[]
}

export interface StorefrontGetCartParams {
  cartId: string
}

export interface StorefrontApplyDiscountParams {
  cartId: string
  discountCodes: string[]
}

export interface StorefrontUpdateBuyerIdentityParams {
  cartId: string
  buyerIdentity: {
    email?: string
    phone?: string
    countryCode?: string
  }
}

// ============================================================================
// Response Types (prefixed to avoid Admin API conflicts)
// ============================================================================

export interface StorefrontGetProductsResponse {
  products: StorefrontProduct[]
  pageInfo: {
    hasNextPage: boolean
    endCursor?: string
  }
}

export interface StorefrontGetProductResponse {
  product: StorefrontProduct
}

export interface StorefrontGetCollectionsResponse {
  collections: StorefrontCollection[]
  pageInfo: {
    hasNextPage: boolean
    endCursor?: string
  }
}

export interface StorefrontGetCollectionResponse {
  collection: StorefrontCollection
}

export interface StorefrontSearchResponse {
  results: StorefrontSearchResult
}

export interface StorefrontPredictiveSearchResponse {
  results: StorefrontPredictiveSearchResult
}

export interface StorefrontCreateCartResponse {
  cart: StorefrontCart
}

export interface StorefrontAddCartLinesResponse {
  cart: StorefrontCart
}

export interface StorefrontUpdateCartLinesResponse {
  cart: StorefrontCart
}

export interface StorefrontRemoveCartLinesResponse {
  cart: StorefrontCart
}

export interface StorefrontGetCartResponse {
  cart: StorefrontCart
}

export interface StorefrontApplyDiscountResponse {
  cart: StorefrontCart
}

export interface StorefrontGetShopResponse {
  shop: StorefrontShop
}

export interface StorefrontGetRecommendationsResponse {
  products: StorefrontProduct[]
}
