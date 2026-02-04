/**
 * Google Workspace Integration
 *
 * Provides typed clients and AI SDK tools for Gmail, Calendar, and Drive.
 *
 * @example
 * import { GoogleClient, createGoogleTools } from '@trendingsociety/integrations/google'
 *
 * const client = new GoogleClient({
 *   clientId: process.env.GOOGLE_CLIENT_ID,
 *   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
 *   refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
 * })
 *
 * // Direct API access
 * const messages = await client.gmail.listMessages({ maxResults: 10 })
 * const events = await client.calendar.listEvents({ timeMin: new Date().toISOString() })
 *
 * // AI SDK tools (for MCP server)
 * const tools = createGoogleTools(client)
 */

export { GoogleClient, type GoogleClientConfig } from './client.js'
export { createGoogleTools, type GoogleTools } from './tools.js'

// Input schemas (for MCP registry)
export {
  ListMessagesInputSchema,
  GetMessageInputSchema,
  SendEmailInputSchema,
  ListEventsInputSchema,
  CreateEventInputSchema,
  GetEventInputSchema,
  DeleteEventInputSchema,
  ListFilesInputSchema,
  GetFileInputSchema,
  SearchFilesInputSchema,
} from './tools.js'

// Types
export type {
  // Gmail
  GmailMessage,
  GmailMessagePart,
  GmailThread,
  GmailLabel,
  // Calendar
  CalendarEvent,
  CalendarList,
  // Drive
  DriveFile,
  DriveFileList,
  // Params
  ListMessagesParams,
  GetMessageParams,
  SendMessageParams,
  ListEventsParams,
  CreateEventParams,
  ListFilesParams,
  GetFileParams,
  // Responses
  ListMessagesResponse,
  ListEventsResponse,
  ListCalendarsResponse,
} from './types.js'
