/**
 * Viator API Types and Zod Schemas
 *
 * Based on Viator Partner API v2
 * https://docs.viator.com/partner-api/
 */

import { z } from "zod";

// ============================================================================
// API Configuration
// ============================================================================

export const ViatorEnvironment = {
  sandbox: "https://api.sandbox.viator.com/partner",
  production: "https://api.viator.com/partner",
} as const;

export type ViatorEnvironmentType = keyof typeof ViatorEnvironment;

// ============================================================================
// Common Schemas
// ============================================================================

export const MoneySchema = z.object({
  amount: z.number(),
  currency: z.string().default("USD"),
});

export type Money = z.infer<typeof MoneySchema>;

export const ImageSchema = z.object({
  imageSource: z.string(),
  caption: z.string().optional(),
  isCover: z.boolean().optional(),
  variants: z
    .array(
      z.object({
        url: z.string(),
        width: z.number(),
        height: z.number(),
      })
    )
    .optional(),
});

export type Image = z.infer<typeof ImageSchema>;

export const LocationSchema = z.object({
  ref: z.string().optional(),
  name: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type Location = z.infer<typeof LocationSchema>;

// ============================================================================
// Destination Schemas
// ============================================================================

export const DestinationSchema = z.object({
  ref: z.string(),
  name: z.string().optional(), // Made optional - not always present in product API response
  type: z.string().optional(),
  parentRef: z.string().optional(),
  timeZone: z.string().optional(),
  defaultCurrencyCode: z.string().optional(),
  lookupId: z.string().optional(),
  destinationUrlName: z.string().optional(),
});

export type Destination = z.infer<typeof DestinationSchema>;

export const DestinationsResponseSchema = z.object({
  destinations: z.array(DestinationSchema),
});

export type DestinationsResponse = z.infer<typeof DestinationsResponseSchema>;

// ============================================================================
// Category Schemas
// ============================================================================

export const CategorySchema = z.object({
  id: z.number(),
  groupName: z.string(),
  name: z.string(),
  level: z.number().optional(),
});

export type Category = z.infer<typeof CategorySchema>;

export const TagSchema = z.object({
  tagId: z.number(),
  parentTagIds: z.array(z.number()).optional(),
  allNamesByLocale: z.record(z.string()).optional(),
});

export type Tag = z.infer<typeof TagSchema>;

export const TagsResponseSchema = z.object({
  tags: z.array(TagSchema),
});

export type TagsResponse = z.infer<typeof TagsResponseSchema>;

// ============================================================================
// Product Schemas
// ============================================================================

export const ProductSummarySchema = z
  .object({
    productCode: z.string(),
    title: z.string(),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    duration: z
      .object({
        fixedDurationInMinutes: z.number().optional(),
        variableDurationFromMinutes: z.number().optional(),
        variableDurationToMinutes: z.number().optional(),
      })
      .optional(),
    pricing: z
      .object({
        summary: z
          .object({
            fromPrice: z.number(),
            fromPriceBeforeDiscount: z.number().optional(),
          })
          .optional(),
        currency: z.string().optional(),
      })
      .optional(),
    // Sandbox API uses 'rating', Production API uses 'reviews'
    rating: z
      .object({
        averageRating: z.number().optional(),
        reviewCount: z.number().optional(),
      })
      .optional(),
    reviews: z
      .object({
        combinedAverageRating: z.number().optional(),
        totalReviews: z.number().optional(),
      })
      .optional(),
    images: z.array(ImageSchema).optional(),
    flags: z.array(z.string()).optional(),
    primaryDestinationId: z.string().optional(),
    primaryDestinationName: z.string().optional(),
    /** Legacy field name - use webURL instead */
    productUrl: z.string().optional(),
    /** Affiliate link URL with tracking params - returned by Viator API */
    webURL: z.string().optional(),
    bookingConfirmationSettings: z
      .object({
        confirmationType: z.string().optional(),
      })
      .optional(),
  })
  .passthrough(); // Allow additional fields from API (like 'reviews' in production)

export type ProductSummary = z.infer<typeof ProductSummarySchema>;

export const ProductDetailSchema = ProductSummarySchema.extend({
  overview: z.string().optional(),
  whatToExpect: z.string().optional(),
  whatsIncluded: z.array(z.string()).optional(),
  whatsExcluded: z.array(z.string()).optional(),
  // additionalInfo can be strings or objects with description field
  additionalInfo: z
    .array(
      z.union([z.string(), z.object({ description: z.string() }).passthrough()])
    )
    .optional(),
  cancellationPolicy: z
    .object({
      type: z.string().optional(),
      description: z.string().optional(),
      cancelIfBadWeather: z.boolean().optional(),
      cancelIfInsufficientTravelers: z.boolean().optional(),
    })
    .optional(),
  startingLocation: LocationSchema.optional(),
  endingLocation: LocationSchema.optional(),
  itinerary: z
    .object({
      itineraryType: z.string().optional(),
      skipTheLine: z.boolean().optional(),
      privateTour: z.boolean().optional(),
      maxTravelersInSharedTour: z.number().optional(),
      duration: z
        .object({
          fixedDurationInMinutes: z.number().optional(),
        })
        .optional(),
      itineraryItems: z
        .array(
          z.object({
            pointOfInterestLocation: LocationSchema.optional(),
            duration: z
              .object({
                fixedDurationInMinutes: z.number().optional(),
              })
              .optional(),
            passByWithoutStopping: z.boolean().optional(),
            admissionIncluded: z.string().optional(),
            description: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  languageGuides: z
    .array(
      z.object({
        language: z.string(),
        type: z.string().optional(),
      })
    )
    .optional(),
  tags: z.array(z.number()).optional(),
  destinations: z.array(DestinationSchema).optional(),
});

export type ProductDetail = z.infer<typeof ProductDetailSchema>;

// ============================================================================
// Search Schemas
// ============================================================================

export const ProductSearchRequestSchema = z.object({
  destId: z.string().optional(),
  startDate: z.string().optional(), // YYYY-MM-DD
  endDate: z.string().optional(), // YYYY-MM-DD
  tagIds: z.array(z.number()).optional(),
  flags: z.array(z.string()).optional(),
  sortOrder: z
    .enum(["TOP_SELLERS", "REVIEW_AVG_RATING", "PRICE_FROM", "PRICE_TO"])
    .optional(),
  currency: z.string().optional(),
  count: z.number().min(1).max(100).optional(),
  start: z.number().optional(),
  searchTerm: z.string().optional(),
});

export type ProductSearchRequest = z.infer<typeof ProductSearchRequestSchema>;

export const ProductSearchResponseSchema = z.object({
  products: z.array(ProductSummarySchema),
  totalCount: z.number(),
  facets: z
    .object({
      tagIdFacets: z
        .array(
          z.object({
            tagId: z.number(),
            count: z.number(),
          })
        )
        .optional(),
    })
    .optional(),
});

export type ProductSearchResponse = z.infer<typeof ProductSearchResponseSchema>;

// ============================================================================
// Availability Schemas (Phase 2 - Full Access)
// ============================================================================

export const AvailabilityRequestSchema = z.object({
  productCode: z.string(),
  startDate: z.string(), // YYYY-MM-DD
  endDate: z.string(), // YYYY-MM-DD
  currency: z.string().optional(),
});

export type AvailabilityRequest = z.infer<typeof AvailabilityRequestSchema>;

export const AvailabilityScheduleSchema = z.object({
  date: z.string(),
  available: z.boolean(),
  startTimes: z.array(z.string()).optional(),
  pricing: z
    .array(
      z.object({
        ageBand: z.string(),
        price: MoneySchema,
      })
    )
    .optional(),
});

export type AvailabilitySchedule = z.infer<typeof AvailabilityScheduleSchema>;

export const AvailabilityResponseSchema = z.object({
  productCode: z.string(),
  bookableItems: z.array(AvailabilityScheduleSchema),
});

export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>;

// ============================================================================
// Review Schemas (Phase 2 - Full Access)
// ============================================================================

export const ReviewSchema = z.object({
  reviewReference: z.string().optional(),
  productCode: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  text: z.string().optional(),
  publishedDate: z.string().optional(),
  travelerType: z.string().optional(),
  ownerResponse: z.string().optional(),
  userName: z.string().optional(),
  travelDate: z.string().optional(),
});

export type Review = z.infer<typeof ReviewSchema>;

export const ReviewsResponseSchema = z.object({
  reviews: z.array(ReviewSchema),
  totalReviews: z.number(),
  averageRating: z.number().optional(),
});

export type ReviewsResponse = z.infer<typeof ReviewsResponseSchema>;

// ============================================================================
// Booking Schemas (Phase 3 - Full + Booking Access)
// ============================================================================

export const TravelerSchema = z.object({
  ageBand: z.string(), // 'ADULT', 'CHILD', 'INFANT', 'SENIOR', 'YOUTH'
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string().optional(), // YYYY-MM-DD
});

export type Traveler = z.infer<typeof TravelerSchema>;

export const BookingHoldRequestSchema = z.object({
  productCode: z.string(),
  travelDate: z.string(), // YYYY-MM-DD
  startTime: z.string().optional(), // HH:mm
  travelers: z.array(TravelerSchema),
  currency: z.string().optional(),
  languageGuide: z.string().optional(),
});

export type BookingHoldRequest = z.infer<typeof BookingHoldRequestSchema>;

export const BookingHoldResponseSchema = z.object({
  holdId: z.string(),
  holdExpirationTime: z.string(),
  totalPrice: MoneySchema,
  itemPrice: MoneySchema.optional(),
});

export type BookingHoldResponse = z.infer<typeof BookingHoldResponseSchema>;

export const BookingConfirmRequestSchema = z.object({
  holdId: z.string(),
  leadTraveler: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
    firstName: z.string(),
    lastName: z.string(),
  }),
  paymentToken: z.string().optional(), // If handling payment
  partnerBookingRef: z.string().optional(),
});

export type BookingConfirmRequest = z.infer<typeof BookingConfirmRequestSchema>;

export const BookingResponseSchema = z.object({
  bookingRef: z.string(),
  viatorBookingRef: z.string().optional(),
  status: z.enum(["CONFIRMED", "PENDING", "REJECTED", "CANCELLED"]),
  voucherUrl: z.string().optional(),
  voucherInfo: z.string().optional(),
  totalPrice: MoneySchema,
});

export type BookingResponse = z.infer<typeof BookingResponseSchema>;

export const CancellationRequestSchema = z.object({
  bookingRef: z.string(),
  reason: z.string().optional(),
});

export type CancellationRequest = z.infer<typeof CancellationRequestSchema>;

export const CancellationResponseSchema = z.object({
  bookingRef: z.string(),
  status: z.string(),
  refundAmount: MoneySchema.optional(),
});

export type CancellationResponse = z.infer<typeof CancellationResponseSchema>;

// ============================================================================
// Affiliate Tracking
// ============================================================================

export interface AffiliateTrackingParams {
  /** Campaign identifier */
  campaign?: string;
  /** Medium (e.g., 'web', 'email') */
  medium?: string;
  /** Content identifier for A/B testing */
  content?: string;
  /** Custom tracking ID */
  customRef?: string;
}
