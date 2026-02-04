/**
 * Shopify Integration
 *
 * @example Admin API
 * import { ShopifyClient } from '@trendingsociety/integrations/shopify'
 *
 * const shopify = new ShopifyClient({
 *   storeDomain: 'mystore.myshopify.com',
 *   accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
 * })
 *
 * const { data } = await shopify.getProducts({ limit: 10 })
 *
 * @example Storefront API
 * import { StorefrontClient } from '@trendingsociety/integrations/shopify'
 *
 * const storefront = new StorefrontClient({
 *   storeDomain: 'mystore.myshopify.com',
 *   storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_TOKEN,
 * })
 *
 * const { data } = await storefront.getProducts({ first: 20 })
 */

// Admin API (Store management, orders, inventory)
export { ShopifyClient, type ShopifyClientConfig } from './client.js'
export * from './types.js'
export * from './tools.js'

// Storefront API (Headless commerce, cart, checkout)
export { StorefrontClient, type StorefrontClientConfig } from './storefront-client.js'
export * from './storefront-types.js'
export * from './storefront-tools.js'
