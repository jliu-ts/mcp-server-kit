/**
 * Cal.com API Types
 *
 * Type definitions for Cal.com scheduling platform API v2.
 * Covers bookings, event types, schedules, slots, and user management.
 */

// ============================================================================
// Configuration
// ============================================================================

export interface CalComConfig {
  /** Cal.com API key */
  apiKey: string
  /** API base URL (default: https://api.cal.com/v2) */
  baseUrl?: string
}

// ============================================================================
// Common Types
// ============================================================================

export interface CalComPagination {
  page?: number
  limit?: number
}

export interface CalComListResponse<T> {
  status: 'success' | 'error'
  data: T[]
}

export interface CalComSingleResponse<T> {
  status: 'success' | 'error'
  data: T
}

// ============================================================================
// Bookings
// ============================================================================

export interface Attendee {
  id?: number
  email: string
  name: string
  timeZone?: string
  locale?: string
}

export interface BookingReference {
  id: number
  type: string
  uid: string
  meetingId?: string
  meetingPassword?: string
  meetingUrl?: string
}

export type BookingStatus =
  | 'ACCEPTED'
  | 'PENDING'
  | 'CANCELLED'
  | 'REJECTED'
  | 'AWAITING_HOST'

export interface Booking {
  id: number
  uid: string
  title: string
  description?: string
  startTime: string
  endTime: string
  timeZone: string
  status: BookingStatus
  eventTypeId: number
  userId: number
  attendees: Attendee[]
  references?: BookingReference[]
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  location?: string
  cancellationReason?: string
  rejectionReason?: string
}

export interface CreateBookingParams {
  /** Event type ID or slug */
  eventTypeId: number
  /** Start time in ISO 8601 format */
  start: string
  /** Attendee information */
  attendees: Attendee[]
  /** Booking metadata */
  metadata?: Record<string, unknown>
  /** Time zone for the booking */
  timeZone?: string
  /** Language/locale */
  language?: string
  /** Location override */
  location?: string
  /** Responses to booking questions */
  responses?: Record<string, unknown>
  /** Guest emails */
  guests?: string[]
}

export interface RescheduleBookingParams {
  /** New start time in ISO 8601 format */
  start: string
  /** Reason for rescheduling */
  rescheduleReason?: string
}

export interface CancelBookingParams {
  /** Reason for cancellation */
  cancellationReason?: string
  /** Whether to notify attendees */
  allRemainingBookings?: boolean
}

export interface ListBookingsParams extends CalComPagination {
  /** Filter by status */
  status?: BookingStatus
  /** Filter bookings after this date */
  afterStart?: string
  /** Filter bookings before this date */
  beforeEnd?: string
  /** Filter by attendee email */
  attendeeEmail?: string
  /** Filter by event type ID */
  eventTypeId?: number
  /** Sort order */
  sortOrder?: 'asc' | 'desc'
}

// ============================================================================
// Event Types
// ============================================================================

export type SchedulingType = 'ROUND_ROBIN' | 'COLLECTIVE' | 'MANAGED'

export interface EventTypeLocation {
  type: string
  address?: string
  link?: string
  hostPhoneNumber?: string
  displayLocationPublicly?: boolean
}

export interface EventType {
  id: number
  title: string
  slug: string
  description?: string
  length: number
  hidden: boolean
  userId: number
  teamId?: number
  schedulingType?: SchedulingType
  locations?: EventTypeLocation[]
  metadata?: Record<string, unknown>
  requiresConfirmation: boolean
  disableGuests: boolean
  hideCalendarNotes: boolean
  minimumBookingNotice: number
  beforeEventBuffer: number
  afterEventBuffer: number
  slotInterval?: number
  successRedirectUrl?: string
  seatsPerTimeSlot?: number
  seatsShowAttendees?: boolean
  seatsShowAvailabilityCount?: boolean
  scheduleId?: number
  price: number
  currency: string
  periodType: 'UNLIMITED' | 'ROLLING' | 'RANGE'
  periodStartDate?: string
  periodEndDate?: string
  periodDays?: number
  periodCountCalendarDays?: boolean
}

export interface CreateEventTypeParams {
  /** Event title */
  title: string
  /** URL slug */
  slug: string
  /** Duration in minutes */
  length: number
  /** Description */
  description?: string
  /** Whether the event is hidden */
  hidden?: boolean
  /** Locations for the event */
  locations?: EventTypeLocation[]
  /** Requires host confirmation */
  requiresConfirmation?: boolean
  /** Disable guest invites */
  disableGuests?: boolean
  /** Minimum notice in minutes */
  minimumBookingNotice?: number
  /** Buffer before event in minutes */
  beforeEventBuffer?: number
  /** Buffer after event in minutes */
  afterEventBuffer?: number
  /** Slot interval in minutes */
  slotInterval?: number
  /** Schedule ID to use */
  scheduleId?: number
  /** Price in cents */
  price?: number
  /** Currency code */
  currency?: string
  /** Metadata */
  metadata?: Record<string, unknown>
}

export interface UpdateEventTypeParams extends Partial<CreateEventTypeParams> {
  id: number
}

export interface ListEventTypesParams extends CalComPagination {
  /** Filter by team ID */
  teamId?: number
  /** Include hidden event types */
  includeHidden?: boolean
}

// ============================================================================
// Schedules
// ============================================================================

export interface ScheduleAvailability {
  days: number[]
  startTime: string
  endTime: string
}

export interface DateOverride {
  date: string
  startTime: string
  endTime: string
}

export interface Schedule {
  id: number
  userId: number
  name: string
  timeZone: string
  availability: ScheduleAvailability[]
  dateOverrides?: DateOverride[]
  isDefault: boolean
}

export interface CreateScheduleParams {
  /** Schedule name */
  name: string
  /** Time zone */
  timeZone: string
  /** Availability rules */
  availability?: ScheduleAvailability[]
  /** Set as default schedule */
  isDefault?: boolean
}

export interface UpdateScheduleParams extends Partial<CreateScheduleParams> {
  id: number
  /** Date overrides */
  dateOverrides?: DateOverride[]
}

// ============================================================================
// Slots
// ============================================================================

export interface Slot {
  time: string
}

export interface GetSlotsParams {
  /** Event type ID */
  eventTypeId: number
  /** Start date in ISO 8601 format */
  startTime: string
  /** End date in ISO 8601 format */
  endTime: string
  /** Time zone */
  timeZone?: string
  /** User ID (for team event types) */
  usernameList?: string[]
}

export interface SlotsResponse {
  slots: Record<string, Slot[]>
}

// ============================================================================
// User / Me
// ============================================================================

export interface User {
  id: number
  username: string
  name: string
  email: string
  emailVerified?: string
  bio?: string
  avatar?: string
  timeZone: string
  weekStart: string
  hideBranding: boolean
  theme?: string
  defaultScheduleId?: number
  locale?: string
  timeFormat?: number
  brandColor?: string
  darkBrandColor?: string
  allowDynamicBooking?: boolean
  createdDate: string
  verified: boolean
  invitedTo?: number
}

export interface UpdateUserParams {
  /** Display name */
  name?: string
  /** Username/handle */
  username?: string
  /** Bio/description */
  bio?: string
  /** Avatar URL */
  avatar?: string
  /** Time zone */
  timeZone?: string
  /** Week start day (Sunday = 0) */
  weekStart?: string
  /** Locale */
  locale?: string
  /** Time format (12 or 24) */
  timeFormat?: number
  /** Brand color */
  brandColor?: string
  /** Dark mode brand color */
  darkBrandColor?: string
  /** Theme */
  theme?: string
  /** Hide Cal.com branding */
  hideBranding?: boolean
  /** Default schedule ID */
  defaultScheduleId?: number
}

// ============================================================================
// Errors
// ============================================================================

export interface CalComError {
  code: string
  message: string
  statusCode?: number
  details?: unknown
}
