/**
 * Cal.com API Client
 *
 * Runtime-agnostic client for Cal.com Scheduling API v2.
 * Works in Node.js, Edge runtimes, and Cloudflare Workers.
 *
 * @example
 * import { CalComClient } from '@trendingsociety/integrations/calcom'
 *
 * const calcom = new CalComClient({
 *   apiKey: process.env.CALCOM_API_KEY,
 * })
 *
 * // Get available slots
 * const slots = await calcom.getSlots({
 *   eventTypeId: 123,
 *   startTime: '2025-01-15T00:00:00Z',
 *   endTime: '2025-01-22T00:00:00Z',
 * })
 *
 * // Create a booking
 * await calcom.createBooking({
 *   eventTypeId: 123,
 *   start: '2025-01-15T10:00:00Z',
 *   attendees: [{ email: 'user@example.com', name: 'John Doe' }],
 * })
 */

import { ok, fail, type Result, type ClientConfig } from '../types.js'
import type {
  CalComConfig,
  Booking,
  CreateBookingParams,
  RescheduleBookingParams,
  CancelBookingParams,
  ListBookingsParams,
  EventType,
  CreateEventTypeParams,
  UpdateEventTypeParams,
  ListEventTypesParams,
  Schedule,
  CreateScheduleParams,
  UpdateScheduleParams,
  GetSlotsParams,
  SlotsResponse,
  User,
  UpdateUserParams,
  CalComListResponse,
  CalComSingleResponse,
} from './types.js'

// ============================================================================
// Configuration
// ============================================================================

const CALCOM_API_BASE = 'https://api.cal.com/v2'

export interface CalComClientConfig extends ClientConfig, CalComConfig {}

// ============================================================================
// Client Implementation
// ============================================================================

export class CalComClient {
  private apiKey: string
  private baseUrl: string
  private timeout: number
  private fetchFn: typeof fetch
  private debug: boolean

  constructor(config: CalComClientConfig) {
    if (!config.apiKey) {
      throw new Error('CalComClient requires apiKey')
    }

    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? CALCOM_API_BASE
    this.timeout = config.timeout ?? 30000
    this.fetchFn = config.fetch ?? fetch.bind(globalThis)
    this.debug = config.debug ?? false
  }

  // --------------------------------------------------------------------------
  // HTTP Helpers
  // --------------------------------------------------------------------------

  private getAuthHeader(): string {
    return `Bearer ${this.apiKey}`
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: Record<string, unknown>,
    queryParams?: Record<string, string | number | boolean | undefined>
  ): Promise<Result<T>> {
    let url = `${this.baseUrl}${path}`

    // Add query parameters
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

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const headers: Record<string, string> = {
        Authorization: this.getAuthHeader(),
        'cal-api-version': '2024-08-13',
      }

      let requestBody: string | undefined
      if (body && (method === 'POST' || method === 'PATCH')) {
        headers['Content-Type'] = 'application/json'
        requestBody = JSON.stringify(body)
      }

      if (this.debug) {
        console.log(`[CalComClient] ${method} ${url}`)
        if (requestBody) {
          console.log(`[CalComClient] Body: ${requestBody}`)
        }
      }

      const response = await this.fetchFn(url, {
        method,
        headers,
        body: requestBody,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle 204 No Content
      if (response.status === 204) {
        return ok({} as T)
      }

      const json = (await response.json()) as T & {
        status?: string
        error?: {
          code?: string
          message?: string
        }
      }

      if (!response.ok) {
        return fail(
          json.error?.code ?? 'API_ERROR',
          json.error?.message ?? `Cal.com API error (${response.status})`,
          response.status,
          json
        )
      }

      return ok(json)
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return fail('TIMEOUT', `Request timed out after ${this.timeout}ms`)
        }
        return fail('NETWORK_ERROR', error.message)
      }

      return fail('UNKNOWN_ERROR', String(error))
    }
  }

  // --------------------------------------------------------------------------
  // Bookings
  // --------------------------------------------------------------------------

  /**
   * List bookings
   */
  async listBookings(params?: ListBookingsParams): Promise<Result<Booking[]>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {}

    if (params?.status) queryParams.status = params.status
    if (params?.afterStart) queryParams.afterStart = params.afterStart
    if (params?.beforeEnd) queryParams.beforeEnd = params.beforeEnd
    if (params?.attendeeEmail) queryParams.attendeeEmail = params.attendeeEmail
    if (params?.eventTypeId) queryParams.eventTypeId = params.eventTypeId
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder
    if (params?.page) queryParams.page = params.page
    if (params?.limit) queryParams.limit = params.limit

    const result = await this.request<CalComListResponse<Booking>>(
      'GET',
      '/bookings',
      undefined,
      queryParams
    )

    if (!result.success) return result as Result<never>
    return ok(result.data.data)
  }

  /**
   * Get a booking by UID
   */
  async getBooking(bookingUid: string): Promise<Result<Booking>> {
    const result = await this.request<CalComSingleResponse<Booking>>(
      'GET',
      `/bookings/${bookingUid}`
    )

    if (!result.success) return result as Result<never>
    return ok(result.data.data)
  }

  /**
   * Create a booking
   */
  async createBooking(params: CreateBookingParams): Promise<Result<Booking>> {
    const body: Record<string, unknown> = {
      eventTypeId: params.eventTypeId,
      start: params.start,
      attendees: params.attendees,
    }

    if (params.metadata) body.metadata = params.metadata
    if (params.timeZone) body.timeZone = params.timeZone
    if (params.language) body.language = params.language
    if (params.location) body.location = params.location
    if (params.responses) body.responses = params.responses
    if (params.guests) body.guests = params.guests

    const result = await this.request<CalComSingleResponse<Booking>>(
      'POST',
      '/bookings',
      body
    )

    if (!result.success) return result as Result<never>
    return ok(result.data.data)
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(
    bookingUid: string,
    params: RescheduleBookingParams
  ): Promise<Result<Booking>> {
    const body: Record<string, unknown> = {
      start: params.start,
    }

    if (params.rescheduleReason) body.rescheduleReason = params.rescheduleReason

    const result = await this.request<CalComSingleResponse<Booking>>(
      'PATCH',
      `/bookings/${bookingUid}/reschedule`,
      body
    )

    if (!result.success) return result as Result<never>
    return ok(result.data.data)
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(
    bookingUid: string,
    params?: CancelBookingParams
  ): Promise<Result<{ canceled: boolean }>> {
    const body: Record<string, unknown> = {}

    if (params?.cancellationReason) body.cancellationReason = params.cancellationReason
    if (params?.allRemainingBookings) body.allRemainingBookings = params.allRemainingBookings

    const result = await this.request<CalComSingleResponse<Booking>>(
      'DELETE',
      `/bookings/${bookingUid}/cancel`,
      body
    )

    if (!result.success) return result as Result<never>
    return ok({ canceled: true })
  }

  // --------------------------------------------------------------------------
  // Event Types
  // --------------------------------------------------------------------------

  /**
   * List event types
   */
  async listEventTypes(params?: ListEventTypesParams): Promise<Result<EventType[]>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {}

    if (params?.teamId) queryParams.teamId = params.teamId
    if (params?.includeHidden) queryParams.includeHidden = params.includeHidden
    if (params?.page) queryParams.page = params.page
    if (params?.limit) queryParams.limit = params.limit

    const result = await this.request<CalComListResponse<EventType>>(
      'GET',
      '/event-types',
      undefined,
      queryParams
    )

    if (!result.success) return result as Result<never>
    return ok(result.data.data)
  }

  /**
   * Get an event type by ID
   */
  async getEventType(eventTypeId: number): Promise<Result<EventType>> {
    const result = await this.request<CalComSingleResponse<EventType>>(
      'GET',
      `/event-types/${eventTypeId}`
    )

    if (!result.success) return result as Result<never>
    return ok(result.data.data)
  }

  /**
   * Create an event type
   */
  async createEventType(params: CreateEventTypeParams): Promise<Result<EventType>> {
    const result = await this.request<CalComSingleResponse<EventType>>(
      'POST',
      '/event-types',
      params as unknown as Record<string, unknown>
    )

    if (!result.success) return result as Result<never>
    return ok(result.data.data)
  }

  /**
   * Update an event type
   */
  async updateEventType(params: UpdateEventTypeParams): Promise<Result<EventType>> {
    const { id, ...body } = params

    const result = await this.request<CalComSingleResponse<EventType>>(
      'PATCH',
      `/event-types/${id}`,
      body as Record<string, unknown>
    )

    if (!result.success) return result as Result<never>
    return ok(result.data.data)
  }

  /**
   * Delete an event type
   */
  async deleteEventType(eventTypeId: number): Promise<Result<{ deleted: boolean }>> {
    const result = await this.request<void>('DELETE', `/event-types/${eventTypeId}`)

    if (!result.success) return result as Result<never>
    return ok({ deleted: true })
  }

  // --------------------------------------------------------------------------
  // Schedules
  // --------------------------------------------------------------------------

  /**
   * List schedules
   */
  async listSchedules(): Promise<Result<Schedule[]>> {
    const result = await this.request<CalComListResponse<Schedule>>('GET', '/schedules')

    if (!result.success) return result as Result<never>
    return ok(result.data.data)
  }

  /**
   * Get a schedule by ID
   */
  async getSchedule(scheduleId: number): Promise<Result<Schedule>> {
    const result = await this.request<CalComSingleResponse<Schedule>>(
      'GET',
      `/schedules/${scheduleId}`
    )

    if (!result.success) return result as Result<never>
    return ok(result.data.data)
  }

  /**
   * Create a schedule
   */
  async createSchedule(params: CreateScheduleParams): Promise<Result<Schedule>> {
    const result = await this.request<CalComSingleResponse<Schedule>>(
      'POST',
      '/schedules',
      params as unknown as Record<string, unknown>
    )

    if (!result.success) return result as Result<never>
    return ok(result.data.data)
  }

  /**
   * Update a schedule
   */
  async updateSchedule(params: UpdateScheduleParams): Promise<Result<Schedule>> {
    const { id, ...body } = params

    const result = await this.request<CalComSingleResponse<Schedule>>(
      'PATCH',
      `/schedules/${id}`,
      body as Record<string, unknown>
    )

    if (!result.success) return result as Result<never>
    return ok(result.data.data)
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: number): Promise<Result<{ deleted: boolean }>> {
    const result = await this.request<void>('DELETE', `/schedules/${scheduleId}`)

    if (!result.success) return result as Result<never>
    return ok({ deleted: true })
  }

  // --------------------------------------------------------------------------
  // Slots
  // --------------------------------------------------------------------------

  /**
   * Get available slots for an event type
   */
  async getSlots(params: GetSlotsParams): Promise<Result<SlotsResponse>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      eventTypeId: params.eventTypeId,
      startTime: params.startTime,
      endTime: params.endTime,
    }

    if (params.timeZone) queryParams.timeZone = params.timeZone
    if (params.usernameList) queryParams.usernameList = params.usernameList.join(',')

    const result = await this.request<CalComSingleResponse<SlotsResponse>>(
      'GET',
      '/slots/available',
      undefined,
      queryParams
    )

    if (!result.success) return result as Result<never>
    return ok(result.data.data)
  }

  // --------------------------------------------------------------------------
  // User / Me
  // --------------------------------------------------------------------------

  /**
   * Get current user profile
   */
  async getMe(): Promise<Result<User>> {
    const result = await this.request<CalComSingleResponse<User>>('GET', '/me')

    if (!result.success) return result as Result<never>
    return ok(result.data.data)
  }

  /**
   * Update current user profile
   */
  async updateMe(params: UpdateUserParams): Promise<Result<User>> {
    const result = await this.request<CalComSingleResponse<User>>(
      'PATCH',
      '/me',
      params as unknown as Record<string, unknown>
    )

    if (!result.success) return result as Result<never>
    return ok(result.data.data)
  }
}
