/**
 * Twilio AI SDK Tools
 *
 * AI SDK 6 native tool definitions for Twilio SMS and Voice operations.
 * Single source of truth - used by both MCP server and AI SDK agents.
 *
 * @example
 * import { createTwilioTools } from '@trendingsociety/integrations/twilio'
 * import { TwilioClient } from '@trendingsociety/integrations/twilio'
 *
 * const client = new TwilioClient({
 *   accountSid: process.env.TWILIO_ACCOUNT_SID,
 *   authToken: process.env.TWILIO_AUTH_TOKEN,
 *   defaultFrom: '+15551234567',
 * })
 * const tools = createTwilioTools(client)
 */

import { tool } from 'ai'
import { z } from 'zod'
import type { TwilioClient } from './client.js'

// ============================================================================
// Input Schemas (Zod)
// ============================================================================

// SMS/MMS Schemas
export const SendSmsInputSchema = z.object({
  to: z.string().describe('Recipient phone number in E.164 format (e.g., "+15559876543")'),
  body: z.string().describe('Message body text (max 1600 characters for SMS)'),
  from: z.string().optional().describe('Sender phone number (uses default if not provided)'),
  mediaUrl: z
    .array(z.string().url())
    .optional()
    .describe('Media URLs for MMS (up to 10 images/videos)'),
  statusCallback: z.string().url().optional().describe('Webhook URL for delivery status updates'),
})

export const GetMessageInputSchema = z.object({
  messageSid: z.string().describe('Message SID (e.g., "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")'),
})

export const ListMessagesInputSchema = z.object({
  to: z.string().optional().describe('Filter by recipient phone number'),
  from: z.string().optional().describe('Filter by sender phone number'),
  dateSentAfter: z
    .string()
    .optional()
    .describe('Filter messages sent on or after this date (ISO 8601)'),
  dateSentBefore: z
    .string()
    .optional()
    .describe('Filter messages sent on or before this date (ISO 8601)'),
  pageSize: z.number().min(1).max(1000).optional().describe('Number of messages to return (max 1000)'),
})

// Voice Call Schemas
export const MakeCallInputSchema = z.object({
  to: z.string().describe('Recipient phone number in E.164 format'),
  from: z.string().describe('Caller ID phone number in E.164 format'),
  twiml: z
    .string()
    .optional()
    .describe('TwiML instructions for call handling (e.g., "<Response><Say>Hello!</Say></Response>")'),
  url: z.string().url().optional().describe('URL returning TwiML instructions (alternative to twiml)'),
  statusCallback: z.string().url().optional().describe('Webhook URL for call status updates'),
  record: z.boolean().optional().describe('Whether to record the call'),
  timeout: z.number().min(5).max(600).optional().describe('Seconds to wait for answer (5-600)'),
  machineDetection: z
    .enum(['Enable', 'DetectMessageEnd'])
    .optional()
    .describe('Answering machine detection mode'),
})

export const GetCallInputSchema = z.object({
  callSid: z.string().describe('Call SID (e.g., "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")'),
})

export const ListCallsInputSchema = z.object({
  to: z.string().optional().describe('Filter by recipient phone number'),
  from: z.string().optional().describe('Filter by caller phone number'),
  status: z
    .enum(['queued', 'ringing', 'in-progress', 'completed', 'busy', 'failed', 'no-answer', 'canceled'])
    .optional()
    .describe('Filter by call status'),
  startTimeAfter: z
    .string()
    .optional()
    .describe('Filter calls started on or after this date (ISO 8601)'),
  startTimeBefore: z
    .string()
    .optional()
    .describe('Filter calls started on or before this date (ISO 8601)'),
  pageSize: z.number().min(1).max(1000).optional().describe('Number of calls to return (max 1000)'),
})

export const UpdateCallInputSchema = z.object({
  callSid: z.string().describe('Call SID to update'),
  status: z
    .enum(['completed', 'canceled'])
    .optional()
    .describe('Set to "completed" to hang up or "canceled" to cancel'),
  twiml: z.string().optional().describe('New TwiML instructions to execute'),
  url: z.string().url().optional().describe('New URL returning TwiML instructions'),
})

// Recording Schemas
export const ListRecordingsInputSchema = z.object({
  callSid: z.string().optional().describe('Filter by call SID'),
  dateCreatedAfter: z
    .string()
    .optional()
    .describe('Filter recordings created on or after this date (ISO 8601)'),
  dateCreatedBefore: z
    .string()
    .optional()
    .describe('Filter recordings created on or before this date (ISO 8601)'),
  pageSize: z.number().min(1).max(1000).optional().describe('Number of recordings to return (max 1000)'),
})

export const GetRecordingInputSchema = z.object({
  recordingSid: z.string().describe('Recording SID (e.g., "RExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")'),
})

export const DeleteRecordingInputSchema = z.object({
  recordingSid: z.string().describe('Recording SID to delete'),
})

// ============================================================================
// Tool Factory
// ============================================================================

/**
 * Create AI SDK tools for Twilio SMS and Voice operations
 *
 * @param client - Initialized TwilioClient instance
 * @returns Object containing all Twilio tools
 */
export function createTwilioTools(client: TwilioClient) {
  return {
    // -------------------------------------------------------------------------
    // SMS/MMS Tools
    // -------------------------------------------------------------------------

    twilio_send_sms: tool({
      description:
        'Send an SMS or MMS message via Twilio. Supports text messages and media attachments (images, videos).',
      inputSchema: SendSmsInputSchema,
      execute: async (params) => {
        const result = await client.sendMessage({
          to: params.to,
          body: params.body,
          from: params.from,
          mediaUrl: params.mediaUrl,
          statusCallback: params.statusCallback,
        })
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          sid: result.data.sid,
          status: result.data.status,
          to: result.data.to,
          from: result.data.from,
          body: result.data.body,
          dateCreated: result.data.dateCreated,
        }
      },
    }),

    twilio_get_message: tool({
      description: 'Get details of a specific SMS/MMS message by its SID.',
      inputSchema: GetMessageInputSchema,
      execute: async (params) => {
        const result = await client.getMessage(params.messageSid)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    twilio_list_messages: tool({
      description:
        'List SMS/MMS messages with optional filters. Returns message history for the account.',
      inputSchema: ListMessagesInputSchema,
      execute: async (params) => {
        const result = await client.listMessages(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          messages: result.data.messages.map((m) => ({
            sid: m.sid,
            status: m.status,
            to: m.to,
            from: m.from,
            body: m.body,
            direction: m.direction,
            dateSent: m.dateSent,
          })),
          page: result.data.page,
          pageSize: result.data.pageSize,
        }
      },
    }),

    // -------------------------------------------------------------------------
    // Voice Call Tools
    // -------------------------------------------------------------------------

    twilio_make_call: tool({
      description:
        'Initiate an outbound phone call via Twilio. Provide TwiML instructions or a URL that returns TwiML to control call flow.',
      inputSchema: MakeCallInputSchema,
      execute: async (params) => {
        const result = await client.makeCall({
          to: params.to,
          from: params.from,
          twiml: params.twiml,
          url: params.url,
          statusCallback: params.statusCallback,
          record: params.record,
          timeout: params.timeout,
          machineDetection: params.machineDetection,
        })
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          sid: result.data.sid,
          status: result.data.status,
          to: result.data.to,
          from: result.data.from,
          direction: result.data.direction,
          dateCreated: result.data.dateCreated,
        }
      },
    }),

    twilio_get_call: tool({
      description: 'Get details of a specific call by its SID.',
      inputSchema: GetCallInputSchema,
      execute: async (params) => {
        const result = await client.getCall(params.callSid)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    twilio_list_calls: tool({
      description: 'List calls with optional filters. Returns call history for the account.',
      inputSchema: ListCallsInputSchema,
      execute: async (params) => {
        const result = await client.listCalls(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          calls: result.data.calls.map((c) => ({
            sid: c.sid,
            status: c.status,
            to: c.to,
            from: c.from,
            direction: c.direction,
            duration: c.duration,
            dateCreated: c.dateCreated,
          })),
          page: result.data.page,
          pageSize: result.data.pageSize,
        }
      },
    }),

    twilio_update_call: tool({
      description:
        'Update a call in progress. Can hang up, cancel, or redirect the call with new TwiML instructions.',
      inputSchema: UpdateCallInputSchema,
      execute: async (params) => {
        const result = await client.updateCall(params.callSid, {
          status: params.status,
          twiml: params.twiml,
          url: params.url,
        })
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          sid: result.data.sid,
          status: result.data.status,
          dateUpdated: result.data.dateUpdated,
        }
      },
    }),

    // -------------------------------------------------------------------------
    // Recording Tools
    // -------------------------------------------------------------------------

    twilio_list_recordings: tool({
      description: 'List call recordings with optional filters.',
      inputSchema: ListRecordingsInputSchema,
      execute: async (params) => {
        const result = await client.listRecordings(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          recordings: result.data.recordings.map((r) => ({
            sid: r.sid,
            callSid: r.callSid,
            duration: r.duration,
            status: r.status,
            dateCreated: r.dateCreated,
          })),
          page: result.data.page,
          pageSize: result.data.pageSize,
        }
      },
    }),

    twilio_get_recording: tool({
      description: 'Get details of a specific recording by its SID.',
      inputSchema: GetRecordingInputSchema,
      execute: async (params) => {
        const result = await client.getRecording(params.recordingSid)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    twilio_delete_recording: tool({
      description: 'Delete a recording by its SID. This action is permanent.',
      inputSchema: DeleteRecordingInputSchema,
      execute: async (params) => {
        const result = await client.deleteRecording(params.recordingSid)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return { deleted: true, recordingSid: params.recordingSid }
      },
    }),

    // -------------------------------------------------------------------------
    // Account Tools
    // -------------------------------------------------------------------------

    twilio_get_account: tool({
      description: 'Get Twilio account details including status and type.',
      inputSchema: z.object({}),
      execute: async () => {
        const result = await client.getAccount()
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          sid: result.data.sid,
          friendlyName: result.data.friendlyName,
          status: result.data.status,
          type: result.data.type,
        }
      },
    }),
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type TwilioTools = ReturnType<typeof createTwilioTools>
