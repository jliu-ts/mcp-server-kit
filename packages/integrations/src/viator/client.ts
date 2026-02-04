/**
 * Viator Partner API Client
 *
 * Progressive feature support based on API access level:
 * - Basic: Product search, destinations, categories, affiliate links
 * - Full: + Availability, reviews, pricing details
 * - Full + Booking: + Native booking, cancellation
 *
 * @see https://docs.viator.com/partner-api/
 */

import { API } from "../config/constants";
import { type ClientConfig, type Result, fail, ok } from "../types.js";
import {
  type AffiliateTrackingParams,
  type AvailabilityRequest,
  type AvailabilityResponse,
  AvailabilityResponseSchema,
  type BookingConfirmRequest,
  type BookingHoldRequest,
  type BookingHoldResponse,
  BookingHoldResponseSchema,
  type BookingResponse,
  BookingResponseSchema,
  type CancellationResponse,
  CancellationResponseSchema,
  type Destination,
  DestinationsResponseSchema,
  type ProductDetail,
  ProductDetailSchema,
  type ProductSearchRequest,
  type ProductSearchResponse,
  ProductSearchResponseSchema,
  type ProductSummary,
  type ReviewsResponse,
  ReviewsResponseSchema,
  type Tag,
  TagsResponseSchema,
  ViatorEnvironment,
  type ViatorEnvironmentType,
} from "./types.js";

// ============================================================================
// Configuration
// ============================================================================

export interface ViatorClientConfig extends ClientConfig {
  /** Viator Partner API key */
  apiKey: string;
  /** Affiliate/partner ID for tracking */
  affiliateId?: string;
  /** API environment */
  environment?: ViatorEnvironmentType;
  /** Accept-Language header (default: en-US) */
  locale?: string;
}

// ============================================================================
// Client Implementation
// ============================================================================

export class ViatorClient {
  private readonly apiKey: string;
  private readonly affiliateId?: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly fetchFn: typeof fetch;
  private readonly debug: boolean;
  private readonly locale: string;

  constructor(config: ViatorClientConfig) {
    this.apiKey = config.apiKey;
    this.affiliateId = config.affiliateId;
    this.baseUrl = ViatorEnvironment[config.environment ?? "production"];
    this.timeout = config.timeout ?? API.defaultTimeout;
    this.fetchFn = config.fetch ?? fetch;
    this.debug = config.debug ?? false;
    this.locale = config.locale ?? "en-US";
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  private log(message: string, data?: unknown): void {
    if (this.debug) {
      console.log(`[ViatorClient] ${message}`, data ?? "");
    }
  }

  private async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body?: unknown
  ): Promise<Result<T>> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    this.log(`${method} ${path}`, body);

    try {
      const response = await this.fetchFn(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json;version=2.0",
          "Accept-Language": this.locale,
          "exp-api-key": this.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        this.log(`Error ${response.status}`, errorText);

        // Parse Viator error format if possible
        try {
          const errorJson = JSON.parse(errorText);
          return fail(
            errorJson.code ?? "API_ERROR",
            errorJson.message ?? `Viator API returned ${response.status}`,
            response.status,
            errorJson
          );
        } catch {
          return fail(
            "HTTP_ERROR",
            `Viator API returned ${response.status}: ${errorText}`,
            response.status
          );
        }
      }

      const data = await response.json();
      this.log(`Response`, data);
      return ok(data as T);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return fail("TIMEOUT", `Request timed out after ${this.timeout}ms`);
        }
        return fail("NETWORK_ERROR", error.message);
      }

      return fail("UNKNOWN_ERROR", String(error));
    }
  }

  // ==========================================================================
  // Phase 1: Basic Access - Destinations & Categories
  // ==========================================================================

  /**
   * Get all available destinations (cities, regions, countries)
   */
  async getDestinations(): Promise<Result<Destination[]>> {
    const result = await this.request<unknown>(
      "GET",
      "/v1/taxonomy/destinations"
    );

    if (!result.success) return result;

    const parsed = DestinationsResponseSchema.safeParse(result.data);
    if (!parsed.success) {
      return fail(
        "PARSE_ERROR",
        "Failed to parse destinations response",
        undefined,
        parsed.error
      );
    }

    return ok(parsed.data.destinations);
  }

  /**
   * Get destination by reference ID
   */
  async getDestination(
    destinationRef: string
  ): Promise<Result<Destination | undefined>> {
    const result = await this.getDestinations();
    if (!result.success) return result;

    const destination = result.data.find((d) => d.ref === destinationRef);
    return ok(destination);
  }

  /**
   * Get all product tags/categories
   */
  async getTags(): Promise<Result<Tag[]>> {
    const result = await this.request<unknown>("GET", "/v1/taxonomy/tags");

    if (!result.success) return result;

    const parsed = TagsResponseSchema.safeParse(result.data);
    if (!parsed.success) {
      return fail(
        "PARSE_ERROR",
        "Failed to parse tags response",
        undefined,
        parsed.error
      );
    }

    return ok(parsed.data.tags);
  }

  // ==========================================================================
  // Phase 1: Basic Access - Product Search
  // ==========================================================================

  /**
   * Search for products/tours
   */
  async searchProducts(
    params: ProductSearchRequest = {}
  ): Promise<Result<ProductSearchResponse>> {
    const body = {
      filtering: {
        destination: params.destId,
        startDate: params.startDate,
        endDate: params.endDate,
        tags: params.tagIds,
        flags: params.flags,
        lowestPrice: undefined,
        highestPrice: undefined,
      },
      sorting: params.sortOrder ? { sort: params.sortOrder } : undefined,
      pagination: {
        start: params.start ?? 0,
        count: params.count ?? 20,
      },
      currency: params.currency ?? "USD",
      searchTerm: params.searchTerm,
    };

    // Remove undefined values
    const cleanBody = JSON.parse(JSON.stringify(body));

    const result = await this.request<unknown>(
      "POST",
      "/products/search",
      cleanBody
    );

    if (!result.success) return result;

    const parsed = ProductSearchResponseSchema.safeParse(result.data);
    if (!parsed.success) {
      return fail(
        "PARSE_ERROR",
        "Failed to parse search response",
        undefined,
        parsed.error
      );
    }

    return ok(parsed.data);
  }

  /**
   * Get a single product by code
   */
  async getProduct(productCode: string): Promise<Result<ProductDetail>> {
    const result = await this.request<unknown>(
      "GET",
      `/products/${productCode}`
    );

    if (!result.success) return result;

    const parsed = ProductDetailSchema.safeParse(result.data);
    if (!parsed.success) {
      return fail(
        "PARSE_ERROR",
        "Failed to parse product response",
        undefined,
        parsed.error
      );
    }

    return ok(parsed.data);
  }

  /**
   * Get multiple products by code
   */
  async getProducts(productCodes: string[]): Promise<Result<ProductSummary[]>> {
    const body = { productCodes };
    const result = await this.request<{ products: unknown[] }>(
      "POST",
      "/products/bulk",
      body
    );

    if (!result.success) return result;

    const products: ProductSummary[] = [];
    for (const p of result.data.products) {
      const parsed = ProductDetailSchema.safeParse(p);
      if (parsed.success) {
        products.push(parsed.data);
      }
    }

    return ok(products);
  }

  // ==========================================================================
  // Phase 1: Affiliate URL Generation
  // ==========================================================================

  /**
   * Generate affiliate tracking URL for a product
   *
   * @param productCode - Viator product code
   * @param tracking - Optional tracking parameters
   * @returns Affiliate URL that redirects to Viator
   */
  generateAffiliateUrl(
    productCode: string,
    tracking?: AffiliateTrackingParams
  ): string {
    const baseUrl = "https://www.viator.com/tours";

    // Build tracking params
    const params = new URLSearchParams();

    if (this.affiliateId) {
      params.set("pid", this.affiliateId);
    }

    if (tracking?.campaign) {
      params.set("mcid", tracking.campaign);
    }

    if (tracking?.medium) {
      params.set("medium", tracking.medium);
    }

    if (tracking?.content) {
      params.set("content", tracking.content);
    }

    if (tracking?.customRef) {
      params.set("ref", tracking.customRef);
    }

    const queryString = params.toString();
    return `${baseUrl}/${productCode}${queryString ? `?${queryString}` : ""}`;
  }

  /**
   * Generate affiliate URL from a full Viator URL
   */
  generateAffiliateUrlFromUrl(
    viatorUrl: string,
    tracking?: AffiliateTrackingParams
  ): string {
    const url = new URL(viatorUrl);

    if (this.affiliateId) {
      url.searchParams.set("pid", this.affiliateId);
    }

    if (tracking?.campaign) {
      url.searchParams.set("mcid", tracking.campaign);
    }

    if (tracking?.medium) {
      url.searchParams.set("medium", tracking.medium);
    }

    if (tracking?.content) {
      url.searchParams.set("content", tracking.content);
    }

    if (tracking?.customRef) {
      url.searchParams.set("ref", tracking.customRef);
    }

    return url.toString();
  }

  // ==========================================================================
  // Phase 2: Full Access - Availability
  // ==========================================================================

  /**
   * Get availability for a product
   * Requires Full API access
   */
  async getAvailability(
    params: AvailabilityRequest
  ): Promise<Result<AvailabilityResponse>> {
    const body = {
      productCode: params.productCode,
      startDate: params.startDate,
      endDate: params.endDate,
      currency: params.currency ?? "USD",
    };

    const result = await this.request<unknown>(
      "POST",
      "/availability/check",
      body
    );

    if (!result.success) return result;

    const parsed = AvailabilityResponseSchema.safeParse(result.data);
    if (!parsed.success) {
      return fail(
        "PARSE_ERROR",
        "Failed to parse availability response",
        undefined,
        parsed.error
      );
    }

    return ok(parsed.data);
  }

  // ==========================================================================
  // Phase 2: Full Access - Reviews
  // ==========================================================================

  /**
   * Get reviews for a product
   * Requires Full API access
   */
  async getReviews(
    productCode: string,
    options: {
      count?: number;
      start?: number;
      sortOrder?: "NEWEST" | "HIGHEST_RATED" | "LOWEST_RATED";
    } = {}
  ): Promise<Result<ReviewsResponse>> {
    const body = {
      productCode,
      pagination: {
        start: options.start ?? 0,
        count: options.count ?? 10,
      },
      sortOrder: options.sortOrder ?? "NEWEST",
    };

    const result = await this.request<unknown>("POST", "/reviews", body);

    if (!result.success) return result;

    const parsed = ReviewsResponseSchema.safeParse(result.data);
    if (!parsed.success) {
      return fail(
        "PARSE_ERROR",
        "Failed to parse reviews response",
        undefined,
        parsed.error
      );
    }

    return ok(parsed.data);
  }

  // ==========================================================================
  // Phase 3: Full + Booking Access - Booking
  // ==========================================================================

  /**
   * Create a booking hold (temporary reservation)
   * Requires Full + Booking API access
   */
  async createBookingHold(
    params: BookingHoldRequest
  ): Promise<Result<BookingHoldResponse>> {
    const body = {
      productCode: params.productCode,
      travelDate: params.travelDate,
      startTime: params.startTime,
      paxMix: params.travelers.map((t) => ({
        ageBand: t.ageBand,
        numberOfTravelers: 1,
      })),
      currency: params.currency ?? "USD",
      languageGuide: params.languageGuide,
    };

    const result = await this.request<unknown>("POST", "/bookings/hold", body);

    if (!result.success) return result;

    const parsed = BookingHoldResponseSchema.safeParse(result.data);
    if (!parsed.success) {
      return fail(
        "PARSE_ERROR",
        "Failed to parse booking hold response",
        undefined,
        parsed.error
      );
    }

    return ok(parsed.data);
  }

  /**
   * Confirm a booking hold
   * Requires Full + Booking API access
   */
  async confirmBooking(
    params: BookingConfirmRequest
  ): Promise<Result<BookingResponse>> {
    const body = {
      holdId: params.holdId,
      bookerInfo: {
        email: params.leadTraveler.email,
        phone: params.leadTraveler.phone,
        firstName: params.leadTraveler.firstName,
        lastName: params.leadTraveler.lastName,
      },
      partnerBookingRef: params.partnerBookingRef,
    };

    const result = await this.request<unknown>(
      "POST",
      "/bookings/confirm",
      body
    );

    if (!result.success) return result;

    const parsed = BookingResponseSchema.safeParse(result.data);
    if (!parsed.success) {
      return fail(
        "PARSE_ERROR",
        "Failed to parse booking response",
        undefined,
        parsed.error
      );
    }

    return ok(parsed.data);
  }

  /**
   * Get booking status
   * Requires Full + Booking API access
   */
  async getBooking(bookingRef: string): Promise<Result<BookingResponse>> {
    const result = await this.request<unknown>(
      "GET",
      `/bookings/${bookingRef}`
    );

    if (!result.success) return result;

    const parsed = BookingResponseSchema.safeParse(result.data);
    if (!parsed.success) {
      return fail(
        "PARSE_ERROR",
        "Failed to parse booking response",
        undefined,
        parsed.error
      );
    }

    return ok(parsed.data);
  }

  /**
   * Cancel a booking
   * Requires Full + Booking API access
   */
  async cancelBooking(
    bookingRef: string,
    reason?: string
  ): Promise<Result<CancellationResponse>> {
    const body = {
      bookingRef,
      reason,
    };

    const result = await this.request<unknown>(
      "POST",
      "/bookings/cancel",
      body
    );

    if (!result.success) return result;

    const parsed = CancellationResponseSchema.safeParse(result.data);
    if (!parsed.success) {
      return fail(
        "PARSE_ERROR",
        "Failed to parse cancellation response",
        undefined,
        parsed.error
      );
    }

    return ok(parsed.data);
  }
}
