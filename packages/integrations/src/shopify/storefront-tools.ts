/**
 * Shopify Storefront API Tools
 *
 * AI SDK 6 native tool definitions for headless commerce operations.
 * Products, collections, cart, checkout - everything for building a storefront.
 *
 * @example
 * import { createStorefrontTools } from '@trendingsociety/integrations/shopify'
 * import { StorefrontClient } from '@trendingsociety/integrations/shopify'
 *
 * const client = new StorefrontClient({
 *   storeDomain: 'mystore.myshopify.com',
 *   storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_TOKEN,
 * })
 * const tools = createStorefrontTools(client)
 */

import { tool } from 'ai'
import { z } from 'zod'
import type { StorefrontClient } from './storefront-client.js'

// ============================================================================
// Input Schemas (Zod) - Prefixed to avoid Admin API conflicts
// ============================================================================

export const StorefrontGetProductsInputSchema = z.object({
  first: z.number().optional().default(20).describe('Number of products to return (max 50)'),
  query: z.string().optional().describe('Search query to filter products (title, vendor, tag, etc.)'),
  sortKey: z
    .enum(['TITLE', 'PRICE', 'BEST_SELLING', 'CREATED', 'UPDATED', 'RELEVANCE'])
    .optional()
    .default('BEST_SELLING')
    .describe('Sort order for products'),
  reverse: z.boolean().optional().default(false).describe('Reverse sort order'),
  after: z.string().optional().describe('Cursor for pagination'),
})

export const StorefrontGetProductInputSchema = z.object({
  handle: z.string().optional().describe('Product handle (URL slug)'),
  id: z.string().optional().describe('Product ID (gid://shopify/Product/...)'),
})

export const StorefrontGetCollectionsInputSchema = z.object({
  first: z.number().optional().default(20).describe('Number of collections to return (max 50)'),
  query: z.string().optional().describe('Search query to filter collections'),
  after: z.string().optional().describe('Cursor for pagination'),
})

export const StorefrontGetCollectionInputSchema = z.object({
  handle: z.string().optional().describe('Collection handle (URL slug)'),
  id: z.string().optional().describe('Collection ID'),
  productsFirst: z.number().optional().default(20).describe('Number of products to include'),
})

export const StorefrontSearchInputSchema = z.object({
  query: z.string().describe('Search query'),
  first: z.number().optional().default(20).describe('Number of results to return'),
  types: z
    .array(z.enum(['PRODUCT', 'COLLECTION', 'PAGE', 'ARTICLE']))
    .optional()
    .default(['PRODUCT'])
    .describe('Types to search'),
})

export const StorefrontPredictiveSearchInputSchema = z.object({
  query: z.string().describe('Search query for autocomplete'),
  limit: z.number().optional().default(10).describe('Number of suggestions to return'),
})

export const StorefrontCreateCartInputSchema = z.object({
  lines: z
    .array(
      z.object({
        merchandiseId: z.string().describe('Product variant ID'),
        quantity: z.number().describe('Quantity to add'),
      })
    )
    .optional()
    .describe('Initial cart items'),
  discountCodes: z.array(z.string()).optional().describe('Discount codes to apply'),
  buyerEmail: z.string().optional().describe('Customer email'),
  note: z.string().optional().describe('Order note'),
})

export const StorefrontGetCartInputSchema = z.object({
  cartId: z.string().describe('Cart ID'),
})

export const StorefrontAddCartLinesInputSchema = z.object({
  cartId: z.string().describe('Cart ID'),
  lines: z
    .array(
      z.object({
        merchandiseId: z.string().describe('Product variant ID'),
        quantity: z.number().describe('Quantity to add'),
      })
    )
    .describe('Items to add to cart'),
})

export const StorefrontUpdateCartLinesInputSchema = z.object({
  cartId: z.string().describe('Cart ID'),
  lines: z
    .array(
      z.object({
        id: z.string().describe('Cart line ID'),
        quantity: z.number().describe('New quantity'),
      })
    )
    .describe('Lines to update'),
})

export const StorefrontRemoveCartLinesInputSchema = z.object({
  cartId: z.string().describe('Cart ID'),
  lineIds: z.array(z.string()).describe('Cart line IDs to remove'),
})

export const StorefrontApplyDiscountInputSchema = z.object({
  cartId: z.string().describe('Cart ID'),
  discountCodes: z.array(z.string()).describe('Discount codes to apply'),
})

export const StorefrontGetRecommendationsInputSchema = z.object({
  productId: z.string().describe('Product ID to get recommendations for'),
})

// ============================================================================
// Tool Factory
// ============================================================================

/**
 * Create AI SDK tools for Shopify Storefront API operations
 *
 * @param client - Initialized StorefrontClient instance
 * @returns Object containing all Storefront tools
 */
export function createStorefrontTools(client: StorefrontClient) {
  return {
    // -------------------------------------------------------------------------
    // Products
    // -------------------------------------------------------------------------

    storefront_get_products: tool({
      description:
        'Get products from the Shopify storefront. Use for listing products on a page, filtering by search query, or getting best sellers.',
      inputSchema: StorefrontGetProductsInputSchema,
      execute: async (params) => {
        const result = await client.getProducts(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    storefront_get_product: tool({
      description:
        'Get a single product by handle (URL slug) or ID. Use for product detail pages. Returns full product info including variants, images, and options.',
      inputSchema: StorefrontGetProductInputSchema,
      execute: async (params) => {
        if (!params.handle && !params.id) {
          throw new Error('Either handle or id is required')
        }
        const result = await client.getProduct(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    storefront_get_recommendations: tool({
      description: 'Get product recommendations based on a product ID. Use for "You may also like" sections.',
      inputSchema: StorefrontGetRecommendationsInputSchema,
      execute: async (params) => {
        const result = await client.getProductRecommendations(params.productId)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Collections
    // -------------------------------------------------------------------------

    storefront_get_collections: tool({
      description: 'Get all collections from the store. Use for navigation menus or collection listing pages.',
      inputSchema: StorefrontGetCollectionsInputSchema,
      execute: async (params) => {
        const result = await client.getCollections(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    storefront_get_collection: tool({
      description:
        'Get a single collection by handle or ID with its products. Use for collection pages like "Summer Sale" or "New Arrivals".',
      inputSchema: StorefrontGetCollectionInputSchema,
      execute: async (params) => {
        if (!params.handle && !params.id) {
          throw new Error('Either handle or id is required')
        }
        const result = await client.getCollection(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Search
    // -------------------------------------------------------------------------

    storefront_search: tool({
      description: 'Search products and collections by query. Use for search results pages.',
      inputSchema: StorefrontSearchInputSchema,
      execute: async (params) => {
        const result = await client.search(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    storefront_predictive_search: tool({
      description: 'Get search suggestions as user types. Use for autocomplete/typeahead search boxes.',
      inputSchema: StorefrontPredictiveSearchInputSchema,
      execute: async (params) => {
        const result = await client.predictiveSearch(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Cart
    // -------------------------------------------------------------------------

    storefront_create_cart: tool({
      description:
        'Create a new shopping cart, optionally with initial items. Returns the cart with checkoutUrl for proceeding to checkout.',
      inputSchema: StorefrontCreateCartInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.createCart({
          lines: params.lines,
          discountCodes: params.discountCodes,
          buyerIdentity: params.buyerEmail ? { email: params.buyerEmail } : undefined,
          note: params.note,
        })
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    storefront_get_cart: tool({
      description: 'Get an existing cart by ID. Use to display cart contents and totals.',
      inputSchema: StorefrontGetCartInputSchema,
      execute: async (params) => {
        const result = await client.getCart(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    storefront_add_to_cart: tool({
      description: 'Add items to an existing cart. Use when user clicks "Add to Cart" button.',
      inputSchema: StorefrontAddCartLinesInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.addCartLines(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    storefront_update_cart: tool({
      description: 'Update quantities of items in the cart. Use when user changes quantity in cart page.',
      inputSchema: StorefrontUpdateCartLinesInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.updateCartLines(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    storefront_remove_from_cart: tool({
      description: 'Remove items from the cart. Use when user clicks "Remove" on a cart item.',
      inputSchema: StorefrontRemoveCartLinesInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.removeCartLines(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    storefront_apply_discount: tool({
      description: 'Apply discount codes to the cart. Use when user enters a promo code.',
      inputSchema: StorefrontApplyDiscountInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.applyDiscountCodes(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Shop Info
    // -------------------------------------------------------------------------

    storefront_get_shop: tool({
      description: 'Get shop information including name, domain, branding, and payment settings.',
      inputSchema: z.object({}),
      execute: async () => {
        const result = await client.getShop()
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type StorefrontTools = ReturnType<typeof createStorefrontTools>
export type StorefrontToolName = keyof StorefrontTools
