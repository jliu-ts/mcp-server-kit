/**
 * Cal.com AI SDK Tools
 *
 * AI SDK 6 native tool definitions for Cal.com Scheduling operations.
 * Single source of truth - used by both MCP server and AI SDK agents.
 *
 * @example
 * import { createCalComTools } from '@trendingsociety/integrations/calcom'
 * import { CalComClient } from '@trendingsociety/integrations/calcom'
 *
 * const client = new CalComClient({
 *   apiKey: process.env.CALCOM_API_KEY,
 * })
 * const tools = createCalComTools(client)
 */

import { tool } from 'ai'
import { z } from 'zod'
import type { CalComClient } from './client.js'

// ============================================================================
// Input Schemas (Zod)
// ============================================================================

// Booking Schemas
const AttendeeSchema = z.object({
  email: z.string().email().describe('Attendee email address'),
  name: z.string().describe('Attendee name'),
  timeZone: z.string().optional().describe('Attendee time zone'),
  locale: z.string().optional().describe('Attendee locale'),
})

export const ListBookingsInputSchema = z.object({
  status: z
    .enum(['ACCEPTED', 'PENDING', 'CANCELLED', 'REJECTED', 'AWAITING_HOST'])
    .optional()
    .describe('Filter by booking status'),
  afterStart: z.string().optional().describe('Filter bookings after this date (ISO 8601)'),
  beforeEnd: z.string().optional().describe('Filter bookings before this date (ISO 8601)'),
  attendeeEmail: z.string().email().optional().describe('Filter by attendee email'),
  eventTypeId: z.number().optional().describe('Filter by event type ID'),
  sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort order'),
  page: z.number().optional().describe('Page number'),
  limit: z.number().optional().describe('Results per page'),
})

export const GetBookingInputSchema = z.object({
  uid: z.string().describe('The booking UID to retrieve'),
})

export const CreateBookingInputSchema = z.object({
  eventTypeId: z.number().describe('Event type ID'),
  start: z.string().describe('Start time (ISO 8601)'),
  attendees: z.array(AttendeeSchema).describe('Attendee information'),
  metadata: z.record(z.unknown()).optional().describe('Booking metadata'),
  timeZone: z.string().optional().describe('Time zone for the booking'),
  language: z.string().optional().describe('Language/locale'),
  location: z.string().optional().describe('Location override'),
  responses: z.record(z.unknown()).optional().describe('Responses to booking questions'),
  guests: z.array(z.string().email()).optional().describe('Guest emails'),
})

export const RescheduleBookingInputSchema = z.object({
  uid: z.string().describe('The booking UID to reschedule'),
  start: z.string().describe('New start time (ISO 8601)'),
  rescheduleReason: z.string().optional().describe('Reason for rescheduling'),
})

export const CancelBookingInputSchema = z.object({
  uid: z.string().describe('The booking UID to cancel'),
  cancellationReason: z.string().optional().describe('Reason for cancellation'),
  allRemainingBookings: z.boolean().optional().describe('Cancel all remaining bookings in series'),
})

// Event Type Schemas
const EventTypeLocationSchema = z.object({
  type: z.string().describe('Location type'),
  address: z.string().optional().describe('Physical address'),
  link: z.string().optional().describe('Video conference link'),
  hostPhoneNumber: z.string().optional().describe('Host phone number'),
  displayLocationPublicly: z.boolean().optional().describe('Show location publicly'),
})

export const ListEventTypesInputSchema = z.object({
  teamId: z.number().optional().describe('Filter by team ID'),
  includeHidden: z.boolean().optional().describe('Include hidden event types'),
  page: z.number().optional().describe('Page number'),
  limit: z.number().optional().describe('Results per page'),
})

export const GetEventTypeInputSchema = z.object({
  id: z.number().describe('The event type ID'),
})

export const CreateEventTypeInputSchema = z.object({
  title: z.string().describe('Event title'),
  slug: z.string().describe('URL slug'),
  length: z.number().describe('Duration in minutes'),
  description: z.string().optional().describe('Event description'),
  hidden: z.boolean().optional().describe('Whether the event is hidden'),
  locations: z.array(EventTypeLocationSchema).optional().describe('Event locations'),
  requiresConfirmation: z.boolean().optional().describe('Requires host confirmation'),
  disableGuests: z.boolean().optional().describe('Disable guest invites'),
  minimumBookingNotice: z.number().optional().describe('Minimum notice in minutes'),
  beforeEventBuffer: z.number().optional().describe('Buffer before event in minutes'),
  afterEventBuffer: z.number().optional().describe('Buffer after event in minutes'),
  slotInterval: z.number().optional().describe('Slot interval in minutes'),
  scheduleId: z.number().optional().describe('Schedule ID to use'),
  price: z.number().optional().describe('Price in cents'),
  currency: z.string().optional().describe('Currency code'),
})

export const UpdateEventTypeInputSchema = z.object({
  id: z.number().describe('The event type ID to update'),
  title: z.string().optional().describe('New event title'),
  slug: z.string().optional().describe('New URL slug'),
  length: z.number().optional().describe('New duration in minutes'),
  description: z.string().optional().describe('New description'),
  hidden: z.boolean().optional().describe('Whether the event is hidden'),
  locations: z.array(EventTypeLocationSchema).optional().describe('New locations'),
  requiresConfirmation: z.boolean().optional().describe('Requires host confirmation'),
  disableGuests: z.boolean().optional().describe('Disable guest invites'),
  minimumBookingNotice: z.number().optional().describe('Minimum notice in minutes'),
  beforeEventBuffer: z.number().optional().describe('Buffer before event in minutes'),
  afterEventBuffer: z.number().optional().describe('Buffer after event in minutes'),
  slotInterval: z.number().optional().describe('Slot interval in minutes'),
})

export const DeleteEventTypeInputSchema = z.object({
  id: z.number().describe('The event type ID to delete'),
})

// Schedule Schemas
const ScheduleAvailabilitySchema = z.object({
  days: z.array(z.number().min(0).max(6)).describe('Days of week (0=Sunday, 6=Saturday)'),
  startTime: z.string().describe('Start time (HH:MM)'),
  endTime: z.string().describe('End time (HH:MM)'),
})

const DateOverrideSchema = z.object({
  date: z.string().describe('Date (YYYY-MM-DD)'),
  startTime: z.string().describe('Start time (HH:MM)'),
  endTime: z.string().describe('End time (HH:MM)'),
})

export const GetScheduleInputSchema = z.object({
  id: z.number().describe('The schedule ID'),
})

export const CreateScheduleInputSchema = z.object({
  name: z.string().describe('Schedule name'),
  timeZone: z.string().describe('Time zone'),
  availability: z.array(ScheduleAvailabilitySchema).optional().describe('Availability rules'),
  isDefault: z.boolean().optional().describe('Set as default schedule'),
})

export const UpdateScheduleInputSchema = z.object({
  id: z.number().describe('The schedule ID to update'),
  name: z.string().optional().describe('New schedule name'),
  timeZone: z.string().optional().describe('New time zone'),
  availability: z.array(ScheduleAvailabilitySchema).optional().describe('New availability rules'),
  isDefault: z.boolean().optional().describe('Set as default schedule'),
  dateOverrides: z.array(DateOverrideSchema).optional().describe('Date-specific overrides'),
})

export const DeleteScheduleInputSchema = z.object({
  id: z.number().describe('The schedule ID to delete'),
})

// Slots Schemas
export const GetSlotsInputSchema = z.object({
  eventTypeId: z.number().describe('Event type ID'),
  startTime: z.string().describe('Start date (ISO 8601)'),
  endTime: z.string().describe('End date (ISO 8601)'),
  timeZone: z.string().optional().describe('Time zone'),
  usernameList: z.array(z.string()).optional().describe('User IDs for team event types'),
})

// User Schemas
export const UpdateMeInputSchema = z.object({
  name: z.string().optional().describe('Display name'),
  username: z.string().optional().describe('Username/handle'),
  bio: z.string().optional().describe('Bio/description'),
  avatar: z.string().optional().describe('Avatar URL'),
  timeZone: z.string().optional().describe('Time zone'),
  weekStart: z.string().optional().describe('Week start day'),
  locale: z.string().optional().describe('Locale'),
  timeFormat: z.number().optional().describe('Time format (12 or 24)'),
  brandColor: z.string().optional().describe('Brand color'),
  darkBrandColor: z.string().optional().describe('Dark mode brand color'),
  theme: z.string().optional().describe('Theme'),
  hideBranding: z.boolean().optional().describe('Hide Cal.com branding'),
  defaultScheduleId: z.number().optional().describe('Default schedule ID'),
})

// ============================================================================
// Tool Factory
// ============================================================================

/**
 * Create AI SDK tools for Cal.com Scheduling operations
 *
 * @param client - Initialized CalComClient instance
 * @returns Object containing all Cal.com tools (17 tools)
 */
export function createCalComTools(client: CalComClient) {
  return {
    // -------------------------------------------------------------------------
    // Booking Tools
    // -------------------------------------------------------------------------

    calcom_list_bookings: tool({
      description:
        'List bookings with optional filters for status, date range, attendee, or event type.',
      inputSchema: ListBookingsInputSchema,
      execute: async (params) => {
        const result = await client.listBookings(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    calcom_get_booking: tool({
      description: 'Get details of a specific booking by its UID.',
      inputSchema: GetBookingInputSchema,
      execute: async (params) => {
        const result = await client.getBooking(params.uid)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    calcom_create_booking: tool({
      description: 'Create a new booking for an event type with attendee information.',
      inputSchema: CreateBookingInputSchema,
      execute: async (params) => {
        const result = await client.createBooking(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          uid: result.data.uid,
          id: result.data.id,
          title: result.data.title,
          startTime: result.data.startTime,
          endTime: result.data.endTime,
          status: result.data.status,
        }
      },
    }),

    calcom_reschedule_booking: tool({
      description: 'Reschedule an existing booking to a new time.',
      inputSchema: RescheduleBookingInputSchema,
      execute: async (params) => {
        const result = await client.rescheduleBooking(params.uid, {
          start: params.start,
          rescheduleReason: params.rescheduleReason,
        })
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          uid: result.data.uid,
          startTime: result.data.startTime,
          endTime: result.data.endTime,
          status: result.data.status,
        }
      },
    }),

    calcom_cancel_booking: tool({
      description: 'Cancel a booking with optional reason.',
      inputSchema: CancelBookingInputSchema,
      execute: async (params) => {
        const result = await client.cancelBooking(params.uid, {
          cancellationReason: params.cancellationReason,
          allRemainingBookings: params.allRemainingBookings,
        })
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return { canceled: true, uid: params.uid }
      },
    }),

    // -------------------------------------------------------------------------
    // Event Type Tools
    // -------------------------------------------------------------------------

    calcom_list_event_types: tool({
      description: 'List event types (meeting templates) with optional filters.',
      inputSchema: ListEventTypesInputSchema,
      execute: async (params) => {
        const result = await client.listEventTypes(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    calcom_get_event_type: tool({
      description: 'Get details of a specific event type by ID.',
      inputSchema: GetEventTypeInputSchema,
      execute: async (params) => {
        const result = await client.getEventType(params.id)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    calcom_create_event_type: tool({
      description: 'Create a new event type (meeting template) with settings.',
      inputSchema: CreateEventTypeInputSchema,
      execute: async (params) => {
        const result = await client.createEventType(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          id: result.data.id,
          title: result.data.title,
          slug: result.data.slug,
          length: result.data.length,
        }
      },
    }),

    calcom_update_event_type: tool({
      description: 'Update an existing event type.',
      inputSchema: UpdateEventTypeInputSchema,
      execute: async (params) => {
        const result = await client.updateEventType(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    calcom_delete_event_type: tool({
      description: 'Delete an event type.',
      inputSchema: DeleteEventTypeInputSchema,
      execute: async (params) => {
        const result = await client.deleteEventType(params.id)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return { deleted: true, id: params.id }
      },
    }),

    // -------------------------------------------------------------------------
    // Schedule Tools
    // -------------------------------------------------------------------------

    calcom_list_schedules: tool({
      description: 'List all schedules (availability configurations).',
      inputSchema: z.object({}),
      execute: async () => {
        const result = await client.listSchedules()
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    calcom_get_schedule: tool({
      description: 'Get details of a specific schedule by ID.',
      inputSchema: GetScheduleInputSchema,
      execute: async (params) => {
        const result = await client.getSchedule(params.id)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    calcom_create_schedule: tool({
      description: 'Create a new schedule with availability rules.',
      inputSchema: CreateScheduleInputSchema,
      execute: async (params) => {
        const result = await client.createSchedule(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          id: result.data.id,
          name: result.data.name,
          timeZone: result.data.timeZone,
          isDefault: result.data.isDefault,
        }
      },
    }),

    calcom_update_schedule: tool({
      description: 'Update a schedule including availability rules and date overrides.',
      inputSchema: UpdateScheduleInputSchema,
      execute: async (params) => {
        const result = await client.updateSchedule(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    calcom_delete_schedule: tool({
      description: 'Delete a schedule.',
      inputSchema: DeleteScheduleInputSchema,
      execute: async (params) => {
        const result = await client.deleteSchedule(params.id)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return { deleted: true, id: params.id }
      },
    }),

    // -------------------------------------------------------------------------
    // Slots Tools
    // -------------------------------------------------------------------------

    calcom_get_slots: tool({
      description:
        'Get available time slots for an event type within a date range. Use this to check availability before creating a booking.',
      inputSchema: GetSlotsInputSchema,
      execute: async (params) => {
        const result = await client.getSlots(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // User/Me Tools
    // -------------------------------------------------------------------------

    calcom_get_me: tool({
      description: 'Get the current authenticated user profile.',
      inputSchema: z.object({}),
      execute: async () => {
        const result = await client.getMe()
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    calcom_update_me: tool({
      description: 'Update the current user profile settings.',
      inputSchema: UpdateMeInputSchema,
      execute: async (params) => {
        const result = await client.updateMe(params)
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

export type CalComTools = ReturnType<typeof createCalComTools>
