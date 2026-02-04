/**
 * Viator Partner API Integration
 *
 * Progressive feature support based on API access level:
 * - Basic: Product search, destinations, categories, affiliate links
 * - Full: + Availability, reviews, pricing details
 * - Full + Booking: + Native booking, cancellation
 *
 * @example
 * ```typescript
 * import { ViatorClient } from '@trendingsociety/integrations/viator'
 *
 * const client = new ViatorClient({
 *   apiKey: process.env.VIATOR_API_KEY!,
 *   affiliateId: process.env.VIATOR_AFFILIATE_ID,
 *   environment: 'production',
 * })
 *
 * // Search for tours in Paris
 * const result = await client.searchProducts({
 *   destId: 'Paris',
 *   count: 20,
 * })
 *
 * if (result.success) {
 *   const products = result.data.products
 *   // Generate affiliate URLs
 *   products.forEach(p => {
 *     const url = client.generateAffiliateUrl(p.productCode, {
 *       campaign: 'homepage',
 *     })
 *   })
 * }
 * ```
 */

// Client
export { ViatorClient, type ViatorClientConfig } from './client.js'

// Types - Common
export type { Money, Image, Location } from './types.js'

// Types - Destinations & Categories
export type { Destination, DestinationsResponse, Category, Tag, TagsResponse } from './types.js'

// Types - Products
export type { ProductSummary, ProductDetail, ProductSearchRequest, ProductSearchResponse } from './types.js'

// Types - Availability (Phase 2)
export type { AvailabilityRequest, AvailabilitySchedule, AvailabilityResponse } from './types.js'

// Types - Reviews (Phase 2)
export type { Review, ReviewsResponse } from './types.js'

// Types - Booking (Phase 3)
export type {
  Traveler,
  BookingHoldRequest,
  BookingHoldResponse,
  BookingConfirmRequest,
  BookingResponse,
  CancellationRequest,
  CancellationResponse,
} from './types.js'

// Types - Affiliate Tracking
export type { AffiliateTrackingParams } from './types.js'

// Environment config
export { ViatorEnvironment, type ViatorEnvironmentType } from './types.js'

// Zod schemas for runtime validation
export {
  MoneySchema,
  ImageSchema,
  LocationSchema,
  DestinationSchema,
  DestinationsResponseSchema,
  CategorySchema,
  TagSchema,
  TagsResponseSchema,
  ProductSummarySchema,
  ProductDetailSchema,
  ProductSearchRequestSchema,
  ProductSearchResponseSchema,
  AvailabilityRequestSchema,
  AvailabilityScheduleSchema,
  AvailabilityResponseSchema,
  ReviewSchema,
  ReviewsResponseSchema,
  TravelerSchema,
  BookingHoldRequestSchema,
  BookingHoldResponseSchema,
  BookingConfirmRequestSchema,
  BookingResponseSchema,
  CancellationRequestSchema,
  CancellationResponseSchema,
} from './types.js'
