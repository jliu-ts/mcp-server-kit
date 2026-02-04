/**
 * Twilio Integration
 *
 * SMS, MMS, and Voice calling via Twilio REST API.
 * Works in Node.js, Edge runtimes, and Cloudflare Workers.
 *
 * @example
 * import { TwilioClient, createTwilioTools } from '@trendingsociety/integrations/twilio'
 *
 * const client = new TwilioClient({
 *   accountSid: process.env.TWILIO_ACCOUNT_SID,
 *   authToken: process.env.TWILIO_AUTH_TOKEN,
 *   defaultFrom: '+15551234567',
 * })
 *
 * // Use client directly
 * await client.sendMessage({ to: '+15559876543', body: 'Hello!' })
 *
 * // Or create AI SDK tools
 * const tools = createTwilioTools(client)
 */

export { TwilioClient, type TwilioClientConfig } from './client.js'
export {
  createTwilioTools,
  type TwilioTools,
  // Input schemas for validation/documentation
  SendSmsInputSchema,
  GetMessageInputSchema,
  ListMessagesInputSchema,
  MakeCallInputSchema,
  GetCallInputSchema,
  ListCallsInputSchema,
  UpdateCallInputSchema,
  ListRecordingsInputSchema,
  GetRecordingInputSchema,
  DeleteRecordingInputSchema,
} from './tools.js'
export type {
  TwilioConfig,
  SendMessageParams,
  Message,
  MessageStatus,
  MessageList,
  ListMessagesParams,
  MakeCallParams,
  Call,
  CallStatus,
  CallStatusEvent,
  CallList,
  ListCallsParams,
  UpdateCallParams,
  Recording,
  RecordingList,
  ListRecordingsParams,
  Account,
} from './types.js'
