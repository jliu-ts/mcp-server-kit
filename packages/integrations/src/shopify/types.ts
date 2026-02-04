/**
 * Shopify Admin API Types
 *
 * Type definitions for Shopify GraphQL Admin API responses.
 */

import { z } from 'zod'

// ============================================================================
// Zod Schemas
// ============================================================================

export const MoneySchema = z.object({
  amount: z.string(),
  currencyCode: z.string(),
})

export const PriceRangeSchema = z.object({
  minVariantPrice: MoneySchema,
  maxVariantPrice: MoneySchema,
})

export const ImageSchema = z.object({
  url: z.string(),
  altText: z.string().optional(),
})

export const ProductVariantSchema = z.object({
  id: z.string(),
  title: z.string(),
  sku: z.string().optional(),
  price: z.string(),
  inventoryQuantity: z.number().optional(),
})

export const ShopifyProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  handle: z.string(),
  status: z.string(),
  vendor: z.string().optional(),
  productType: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  totalInventory: z.number().optional(),
  priceRangeV2: PriceRangeSchema.optional(),
  featuredImage: ImageSchema.optional(),
  variants: z.array(ProductVariantSchema).optional(),
})

export const AddressSchema = z.object({
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
})

export const CustomerSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export const LineItemSchema = z.object({
  title: z.string(),
  quantity: z.number(),
  originalUnitPriceSet: z.object({
    shopMoney: MoneySchema,
  }).optional(),
})

export const ShopifyOrderSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  createdAt: z.string(),
  displayFinancialStatus: z.string().optional(),
  displayFulfillmentStatus: z.string().optional(),
  totalPriceSet: z.object({ shopMoney: MoneySchema }).optional(),
  subtotalPriceSet: z.object({ shopMoney: MoneySchema }).optional(),
  totalShippingPriceSet: z.object({ shopMoney: MoneySchema }).optional(),
  totalTaxSet: z.object({ shopMoney: MoneySchema }).optional(),
  lineItems: z.array(LineItemSchema).optional(),
  shippingAddress: AddressSchema.optional(),
  customer: CustomerSchema.optional(),
})

export const ShopifyCustomerSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  numberOfOrders: z.string().optional(),
  amountSpent: MoneySchema.optional(),
  defaultAddress: AddressSchema.optional(),
  tags: z.array(z.string()).optional(),
  state: z.string().optional(),
})

// ============================================================================
// TypeScript Types
// ============================================================================

export type Money = z.infer<typeof MoneySchema>
export type ShopifyProduct = z.infer<typeof ShopifyProductSchema>
export type ShopifyOrder = z.infer<typeof ShopifyOrderSchema>
export type ShopifyCustomer = z.infer<typeof ShopifyCustomerSchema>
export type ProductVariant = z.infer<typeof ProductVariantSchema>

// ============================================================================
// Input Types
// ============================================================================

export interface GetProductsParams {
  /** Max products to return (default: 10, max: 50) */
  limit?: number
  /** Search query */
  query?: string
  /** Filter by status (ACTIVE, ARCHIVED, DRAFT) */
  status?: 'ACTIVE' | 'ARCHIVED' | 'DRAFT'
}

export interface GetOrdersParams {
  /** Max orders to return (default: 10, max: 50) */
  limit?: number
  /** Filter by financial status (paid, pending, refunded, etc.) */
  status?: string
}

export interface GetCustomersParams {
  /** Max customers to return (default: 10, max: 50) */
  limit?: number
  /** Search query (email, name) */
  query?: string
}

// ============================================================================
// Response Types
// ============================================================================

export interface GetProductsResponse {
  count: number
  products: ShopifyProduct[]
  hasMore: boolean
}

export interface GetOrdersResponse {
  count: number
  orders: ShopifyOrder[]
  hasMore: boolean
}

export interface GetCustomersResponse {
  count: number
  customers: ShopifyCustomer[]
  hasMore: boolean
}

// ============================================================================
// Shop Types
// ============================================================================

export const ShopSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  domain: z.string().optional(),
  primaryDomain: z.object({
    url: z.string(),
    host: z.string(),
  }).optional(),
  currencyCode: z.string(),
  timezoneAbbreviation: z.string().optional(),
  ianaTimezone: z.string().optional(),
  plan: z.object({
    displayName: z.string(),
    partnerDevelopment: z.boolean(),
    shopifyPlus: z.boolean(),
  }).optional(),
  billingAddress: z.object({
    city: z.string().optional(),
    province: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
})

export type ShopifyShop = z.infer<typeof ShopSchema>

export interface GetShopResponse {
  shop: ShopifyShop
}

// ============================================================================
// Dashboard KPI Types
// ============================================================================

export interface DashboardKPIs {
  /** Current period metrics */
  revenue: number
  orders: number
  averageOrderValue: number
  /** Comparison to previous period */
  revenueChange: number
  ordersChange: number
  aovChange: number
  /** Additional metrics */
  currencyCode: string
  period: 'today' | '7d' | '30d' | '90d'
}

export interface GetDashboardKPIsParams {
  /** Time period for KPIs (default: 7d) */
  period?: 'today' | '7d' | '30d' | '90d'
}

export interface GetDashboardKPIsResponse {
  kpis: DashboardKPIs
}

// ============================================================================
// Revenue Trend Types
// ============================================================================

export interface RevenueTrendDataPoint {
  date: string
  revenue: number
  orders: number
}

export interface GetRevenueTrendParams {
  /** Number of days to include (default: 30) */
  days?: number
}

export interface GetRevenueTrendResponse {
  trend: RevenueTrendDataPoint[]
  currencyCode: string
}

// ============================================================================
// Low Stock Alert Types
// ============================================================================

export interface LowStockProduct {
  id: string
  title: string
  handle: string
  totalInventory: number
  variantId: string
  variantTitle: string
  sku: string | null
  inventoryQuantity: number
  featuredImage: { url: string; altText?: string } | null
}

export interface GetLowStockAlertsParams {
  /** Threshold below which to alert (default: 10) */
  threshold?: number
  /** Max alerts to return (default: 20) */
  limit?: number
}

export interface GetLowStockAlertsResponse {
  alerts: LowStockProduct[]
  count: number
}

// ============================================================================
// Action Queue Types
// ============================================================================

export type ActionType = 
  | 'unfulfilled_order'
  | 'payment_pending'
  | 'abandoned_checkout'
  | 'low_stock'
  | 'refund_pending'

export interface ActionQueueItem {
  type: ActionType
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  createdAt: string
  metadata: Record<string, unknown>
}

export interface GetActionQueueParams {
  /** Max items to return (default: 20) */
  limit?: number
}

export interface GetActionQueueResponse {
  actions: ActionQueueItem[]
  count: number
}

// ============================================================================
// Top Products Types
// ============================================================================

export interface TopProduct {
  id: string
  title: string
  handle: string
  totalSales: number
  totalRevenue: number
  featuredImage: { url: string; altText?: string } | null
}

export interface GetTopProductsParams {
  /** Time period (default: 30d) */
  period?: '7d' | '30d' | '90d'
  /** Max products to return (default: 10) */
  limit?: number
}

export interface GetTopProductsResponse {
  products: TopProduct[]
  currencyCode: string
}

// ============================================================================
// Single Item Params
// ============================================================================

export interface GetProductParams {
  /** Product ID (gid format or numeric) */
  id: string
}

export interface GetProductResponse {
  product: ShopifyProduct
}

export interface GetOrderParams {
  /** Order ID (gid format or numeric) */
  id: string
}

export interface GetOrderResponse {
  order: ShopifyOrder
}

// ============================================================================
// Collection Types
// ============================================================================

export const CollectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  handle: z.string(),
  description: z.string().optional(),
  productsCount: z.number().optional(),
  image: ImageSchema.optional(),
  sortOrder: z.string().optional(),
})

export type ShopifyCollection = z.infer<typeof CollectionSchema>

export interface GetCollectionsParams {
  limit?: number
  query?: string
}

export interface GetCollectionsResponse {
  collections: ShopifyCollection[]
  count: number
  hasMore: boolean
}

// ============================================================================
// Inventory Types
// ============================================================================

export interface InventoryLevel {
  id: string
  locationId: string
  locationName: string
  available: number
  incoming: number
  reserved: number
}

export interface ProductInventory {
  productId: string
  productTitle: string
  variantId: string
  variantTitle: string
  sku: string | null
  levels: InventoryLevel[]
  totalAvailable: number
}

export interface GetInventoryLevelsParams {
  /** Product ID to get inventory for */
  productId?: string
  /** Location ID to filter by */
  locationId?: string
  /** Max items (default: 50) */
  limit?: number
}

export interface GetInventoryLevelsResponse {
  inventory: ProductInventory[]
  count: number
}

export interface AdjustInventoryParams {
  /** Inventory item ID */
  inventoryItemId: string
  /** Location ID */
  locationId: string
  /** Amount to adjust (positive or negative) */
  delta: number
  /** Reason for adjustment */
  reason?: string
}

export interface AdjustInventoryResponse {
  success: boolean
  newAvailable: number
}

// ============================================================================
// Location Types
// ============================================================================

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: AddressSchema.optional(),
  isActive: z.boolean(),
  fulfillsOnlineOrders: z.boolean().optional(),
})

export type ShopifyLocation = z.infer<typeof LocationSchema>

export interface GetLocationsResponse {
  locations: ShopifyLocation[]
  count: number
}

// ============================================================================
// Fulfillment Types
// ============================================================================

export interface FulfillOrderParams {
  /** Order ID */
  orderId: string
  /** Tracking number (optional) */
  trackingNumber?: string
  /** Tracking URL (optional) */
  trackingUrl?: string
  /** Tracking company (optional) */
  trackingCompany?: string
  /** Notify customer (default: true) */
  notifyCustomer?: boolean
}

export interface FulfillOrderResponse {
  success: boolean
  fulfillmentId: string
}

// ============================================================================
// Product Mutation Types
// ============================================================================

export interface UpdateProductParams {
  /** Product ID */
  id: string
  /** New title */
  title?: string
  /** New description (HTML) */
  descriptionHtml?: string
  /** Product status */
  status?: 'ACTIVE' | 'ARCHIVED' | 'DRAFT'
  /** Vendor name */
  vendor?: string
  /** Product type */
  productType?: string
  /** Tags */
  tags?: string[]
}

export interface UpdateProductResponse {
  success: boolean
  product: ShopifyProduct
}

export interface CreateProductParams {
  /** Product title (required) */
  title: string
  /** Description (HTML) */
  descriptionHtml?: string
  /** Vendor name */
  vendor?: string
  /** Product type */
  productType?: string
  /** Initial status (default: DRAFT) */
  status?: 'ACTIVE' | 'ARCHIVED' | 'DRAFT'
  /** Tags */
  tags?: string[]
}

export interface CreateProductResponse {
  success: boolean
  product: ShopifyProduct
}

// ============================================================================
// Discount Types
// ============================================================================

export const DiscountCodeSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string().optional(),
  status: z.string(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  usageLimit: z.number().optional(),
  asyncUsageCount: z.number().optional(),
})

export type ShopifyDiscountCode = z.infer<typeof DiscountCodeSchema>

export interface GetDiscountCodesParams {
  limit?: number
  query?: string
}

export interface GetDiscountCodesResponse {
  discounts: ShopifyDiscountCode[]
  count: number
  hasMore: boolean
}
