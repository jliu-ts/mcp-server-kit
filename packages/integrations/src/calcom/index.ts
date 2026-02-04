/**
 * Cal.com Integration
 *
 * Scheduling and booking management via Cal.com API v2.
 * Provides 18 AI SDK tools for scheduling operations.
 *
 * Features:
 * - Booking management (create, reschedule, cancel)
 * - Event type management (meeting templates)
 * - Schedule/availability management
 * - Available slot discovery
 * - User profile management
 *
 * @example
 * import { CalComClient, createCalComTools } from '@trendingsociety/integrations/calcom'
 *
 * const client = new CalComClient({
 *   apiKey: process.env.CALCOM_API_KEY,
 * })
 *
 * const tools = createCalComTools(client)
 *
 * // Use with AI SDK
 * const response = await generateText({
 *   model: anthropic('claude-sonnet-4-20250514'),
 *   tools,
 *   prompt: 'Get available slots for event type 123 next week',
 * })
 */

// Client
export { CalComClient, type CalComClientConfig } from './client.js'

// Tools
export { createCalComTools, type CalComTools } from './tools.js'

// Input schemas for validation
export {
  // Booking schemas
  ListBookingsInputSchema,
  GetBookingInputSchema,
  CreateBookingInputSchema,
  RescheduleBookingInputSchema,
  CancelBookingInputSchema,
  // Event Type schemas
  ListEventTypesInputSchema,
  GetEventTypeInputSchema,
  CreateEventTypeInputSchema,
  UpdateEventTypeInputSchema,
  DeleteEventTypeInputSchema,
  // Schedule schemas
  GetScheduleInputSchema,
  CreateScheduleInputSchema,
  UpdateScheduleInputSchema,
  DeleteScheduleInputSchema,
  // Slots schemas
  GetSlotsInputSchema,
  // User schemas
  UpdateMeInputSchema,
} from './tools.js'

// Types
export type {
  CalComConfig,
  CalComPagination,
  CalComListResponse,
  CalComSingleResponse,
  // Booking types
  Attendee,
  BookingReference,
  BookingStatus,
  Booking,
  CreateBookingParams,
  RescheduleBookingParams,
  CancelBookingParams,
  ListBookingsParams,
  // Event Type types
  SchedulingType,
  EventTypeLocation,
  EventType,
  CreateEventTypeParams,
  UpdateEventTypeParams,
  ListEventTypesParams,
  // Schedule types
  ScheduleAvailability,
  DateOverride,
  Schedule,
  CreateScheduleParams,
  UpdateScheduleParams,
  // Slots types
  Slot,
  GetSlotsParams,
  SlotsResponse,
  // User types
  User,
  UpdateUserParams,
  // Error types
  CalComError,
} from './types.js'
