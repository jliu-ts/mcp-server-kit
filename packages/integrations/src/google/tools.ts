/**
 * Google Workspace AI SDK Tools
 *
 * AI SDK 6 native tool definitions for Gmail, Calendar, and Drive operations.
 * Single source of truth - used by both MCP server and AI SDK agents.
 *
 * @example
 * import { createGoogleTools } from '@trendingsociety/integrations/google'
 * import { GoogleClient } from '@trendingsociety/integrations/google'
 *
 * const client = new GoogleClient({
 *   clientId: process.env.GOOGLE_CLIENT_ID,
 *   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
 *   refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
 * })
 * const tools = createGoogleTools(client)
 */

import { tool } from "ai";
import { z } from "zod";
import type { GoogleClient } from "./client.js";

// ============================================================================
// Gmail Input Schemas
// ============================================================================

export const ListMessagesInputSchema = z.object({
  maxResults: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum number of messages to return (default: 10)"),
  query: z
    .string()
    .optional()
    .describe(
      'Gmail search query (e.g., "from:user@example.com", "is:unread", "subject:invoice")'
    ),
  labelIds: z
    .array(z.string())
    .optional()
    .describe("Only return messages with these label IDs"),
});

export const GetMessageInputSchema = z.object({
  id: z.string().describe("The message ID to retrieve"),
  format: z
    .enum(["minimal", "full", "raw", "metadata"])
    .optional()
    .default("full")
    .describe("The format to return (default: full)"),
});

export const SendEmailInputSchema = z.object({
  to: z.string().describe("Recipient email address"),
  subject: z.string().describe("Email subject line"),
  body: z.string().describe("Email body (HTML supported)"),
  cc: z.string().optional().describe("CC recipients (comma-separated)"),
  bcc: z.string().optional().describe("BCC recipients (comma-separated)"),
  replyTo: z.string().optional().describe("Reply-to address"),
  threadId: z.string().optional().describe("Thread ID to reply to"),
});

// ============================================================================
// Calendar Input Schemas
// ============================================================================

export const ListEventsInputSchema = z.object({
  calendarId: z
    .string()
    .optional()
    .default("primary")
    .describe("Calendar ID (default: primary)"),
  maxResults: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum events to return (default: 10)"),
  timeMin: z
    .string()
    .optional()
    .describe("Start time filter (ISO 8601 format)"),
  timeMax: z.string().optional().describe("End time filter (ISO 8601 format)"),
  query: z.string().optional().describe("Search query for events"),
  singleEvents: z
    .boolean()
    .optional()
    .default(true)
    .describe("Expand recurring events (default: true)"),
  orderBy: z
    .enum(["startTime", "updated"])
    .optional()
    .default("startTime")
    .describe("Sort order (default: startTime)"),
});

export const CreateEventInputSchema = z.object({
  summary: z.string().describe("Event title"),
  description: z.string().optional().describe("Event description"),
  location: z.string().optional().describe("Event location"),
  startDateTime: z
    .string()
    .describe(
      'Start date/time (ISO 8601 format, e.g., "2025-01-15T10:00:00-08:00")'
    ),
  endDateTime: z.string().describe("End date/time (ISO 8601 format)"),
  startDate: z
    .string()
    .optional()
    .describe("Start date for all-day events (YYYY-MM-DD format)"),
  endDate: z
    .string()
    .optional()
    .describe("End date for all-day events (YYYY-MM-DD format)"),
  timeZone: z
    .string()
    .optional()
    .default("America/Los_Angeles")
    .describe("Time zone (default: America/Los_Angeles)"),
  attendees: z
    .array(z.string())
    .optional()
    .describe("List of attendee email addresses"),
  calendarId: z
    .string()
    .optional()
    .default("primary")
    .describe("Calendar ID (default: primary)"),
  sendUpdates: z
    .enum(["all", "externalOnly", "none"])
    .optional()
    .default("all")
    .describe("Send update notifications (default: all)"),
  createMeet: z
    .boolean()
    .optional()
    .default(false)
    .describe("Create a Google Meet link (default: false)"),
});

export const GetEventInputSchema = z.object({
  eventId: z.string().describe("The event ID to retrieve"),
  calendarId: z
    .string()
    .optional()
    .default("primary")
    .describe("Calendar ID (default: primary)"),
});

export const DeleteEventInputSchema = z.object({
  eventId: z.string().describe("The event ID to delete"),
  calendarId: z
    .string()
    .optional()
    .default("primary")
    .describe("Calendar ID (default: primary)"),
});

export const UpdateEventInputSchema = z.object({
  eventId: z.string().describe("The event ID to update"),
  calendarId: z
    .string()
    .optional()
    .default("primary")
    .describe("Calendar ID (default: primary)"),
  summary: z.string().optional().describe("New title for the event"),
  description: z.string().optional().describe("New description for the event"),
  location: z.string().optional().describe("New location for the event"),
  startDateTime: z
    .string()
    .optional()
    .describe("New start time (ISO 8601 format) for timed events"),
  endDateTime: z
    .string()
    .optional()
    .describe("New end time (ISO 8601 format) for timed events"),
  startDate: z
    .string()
    .optional()
    .describe("New start date (YYYY-MM-DD) for all-day events"),
  endDate: z
    .string()
    .optional()
    .describe("New end date (YYYY-MM-DD) for all-day events"),
  timeZone: z.string().optional().describe("Time zone for the event times"),
});

// ============================================================================
// Drive Input Schemas
// ============================================================================

export const ListFilesInputSchema = z.object({
  maxResults: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum files to return (default: 10)"),
  query: z
    .string()
    .optional()
    .describe(
      "Drive search query (e.g., \"name contains 'report'\", \"mimeType='application/pdf'\")"
    ),
  orderBy: z
    .string()
    .optional()
    .default("modifiedTime desc")
    .describe("Sort order (default: modifiedTime desc)"),
});

export const GetFileInputSchema = z.object({
  fileId: z.string().describe("The file ID to retrieve"),
});

export const SearchFilesInputSchema = z.object({
  query: z.string().describe("Search query for files"),
  maxResults: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum results (default: 10)"),
});

// ============================================================================
// Sheets Input Schemas
// ============================================================================

export const GetSpreadsheetInputSchema = z.object({
  spreadsheetId: z.string().describe("The spreadsheet ID (from the URL)"),
  ranges: z
    .array(z.string())
    .optional()
    .describe('Specific ranges to include (e.g., ["Sheet1!A1:D10"])'),
  includeGridData: z
    .boolean()
    .optional()
    .default(false)
    .describe("Include cell data (default: false)"),
});

export const GetValuesInputSchema = z.object({
  spreadsheetId: z.string().describe("The spreadsheet ID"),
  range: z
    .string()
    .describe(
      'The A1 notation range (e.g., "Sheet1!A1:D10", "Sheet1", "A1:B5")'
    ),
  majorDimension: z
    .enum(["ROWS", "COLUMNS"])
    .optional()
    .default("ROWS")
    .describe("How to interpret the data (default: ROWS)"),
  valueRenderOption: z
    .enum(["FORMATTED_VALUE", "UNFORMATTED_VALUE", "FORMULA"])
    .optional()
    .default("FORMATTED_VALUE")
    .describe("How values should be rendered (default: FORMATTED_VALUE)"),
});

export const UpdateValuesInputSchema = z.object({
  spreadsheetId: z.string().describe("The spreadsheet ID"),
  range: z
    .string()
    .describe('The A1 notation range to update (e.g., "Sheet1!A1:D10")'),
  values: z
    .array(z.array(z.unknown()))
    .describe("2D array of values to write (rows × columns)"),
  valueInputOption: z
    .enum(["RAW", "USER_ENTERED"])
    .optional()
    .default("USER_ENTERED")
    .describe("How input should be interpreted (default: USER_ENTERED)"),
});

export const AppendValuesInputSchema = z.object({
  spreadsheetId: z.string().describe("The spreadsheet ID"),
  range: z
    .string()
    .describe('The table range to append to (e.g., "Sheet1!A:D")'),
  values: z.array(z.array(z.unknown())).describe("2D array of rows to append"),
  valueInputOption: z
    .enum(["RAW", "USER_ENTERED"])
    .optional()
    .default("USER_ENTERED")
    .describe("How input should be interpreted (default: USER_ENTERED)"),
  insertDataOption: z
    .enum(["OVERWRITE", "INSERT_ROWS"])
    .optional()
    .default("INSERT_ROWS")
    .describe("How to insert data (default: INSERT_ROWS)"),
});

export const ClearValuesInputSchema = z.object({
  spreadsheetId: z.string().describe("The spreadsheet ID"),
  range: z
    .string()
    .describe('The A1 notation range to clear (e.g., "Sheet1!A1:D10")'),
});

export const CreateSpreadsheetInputSchema = z.object({
  title: z.string().describe("Title of the new spreadsheet"),
  sheetTitles: z
    .array(z.string())
    .optional()
    .describe('Names of sheets to create (default: one sheet named "Sheet1")'),
});

export const AddSheetInputSchema = z.object({
  spreadsheetId: z.string().describe("The spreadsheet ID"),
  title: z.string().describe("Title of the new sheet"),
  rowCount: z
    .number()
    .optional()
    .default(1000)
    .describe("Number of rows (default: 1000)"),
  columnCount: z
    .number()
    .optional()
    .default(26)
    .describe("Number of columns (default: 26)"),
});

export const DeleteSheetInputSchema = z.object({
  spreadsheetId: z.string().describe("The spreadsheet ID"),
  sheetId: z.number().describe("The sheet ID (numeric, not the title)"),
});

export const CopySheetInputSchema = z.object({
  spreadsheetId: z.string().describe("Source spreadsheet ID"),
  sheetId: z.number().describe("Sheet ID to copy"),
  destinationSpreadsheetId: z.string().describe("Destination spreadsheet ID"),
});

// ============================================================================
// Tasks Input Schemas
// ============================================================================

export const ListTaskListsInputSchema = z.object({
  maxResults: z
    .number()
    .optional()
    .default(20)
    .describe("Maximum task lists to return (default: 20)"),
});

export const GetTaskListInputSchema = z.object({
  taskListId: z.string().describe("The task list ID"),
});

export const CreateTaskListInputSchema = z.object({
  title: z.string().describe("Title of the new task list"),
});

export const UpdateTaskListInputSchema = z.object({
  taskListId: z.string().describe("The task list ID"),
  title: z.string().describe("New title for the task list"),
});

export const DeleteTaskListInputSchema = z.object({
  taskListId: z.string().describe("The task list ID to delete"),
});

export const ListTasksInputSchema = z.object({
  taskListId: z.string().describe("The task list ID"),
  maxResults: z
    .number()
    .optional()
    .default(50)
    .describe("Maximum tasks to return (default: 50)"),
  showCompleted: z
    .boolean()
    .optional()
    .default(true)
    .describe("Include completed tasks (default: true)"),
  showHidden: z
    .boolean()
    .optional()
    .default(false)
    .describe("Include hidden tasks (default: false)"),
  dueMin: z.string().optional().describe("Minimum due date (ISO 8601 format)"),
  dueMax: z.string().optional().describe("Maximum due date (ISO 8601 format)"),
});

export const GetTaskInputSchema = z.object({
  taskListId: z.string().describe("The task list ID"),
  taskId: z.string().describe("The task ID"),
});

export const CreateTaskInputSchema = z.object({
  taskListId: z.string().describe("The task list ID"),
  title: z.string().describe("Task title"),
  notes: z.string().optional().describe("Task notes/description"),
  due: z
    .string()
    .optional()
    .describe('Due date (ISO 8601 format, e.g., "2025-01-15T00:00:00.000Z")'),
  parent: z.string().optional().describe("Parent task ID (for subtasks)"),
});

export const UpdateTaskInputSchema = z.object({
  taskListId: z.string().describe("The task list ID"),
  taskId: z.string().describe("The task ID"),
  title: z.string().optional().describe("New task title"),
  notes: z.string().optional().describe("New task notes"),
  due: z.string().optional().describe("New due date (ISO 8601 format)"),
  status: z
    .enum(["needsAction", "completed"])
    .optional()
    .describe("Task status"),
});

export const DeleteTaskInputSchema = z.object({
  taskListId: z.string().describe("The task list ID"),
  taskId: z.string().describe("The task ID to delete"),
});

export const CompleteTaskInputSchema = z.object({
  taskListId: z.string().describe("The task list ID"),
  taskId: z.string().describe("The task ID to complete"),
});

export const MoveTaskInputSchema = z.object({
  taskListId: z.string().describe("The task list ID"),
  taskId: z.string().describe("The task ID to move"),
  parent: z
    .string()
    .optional()
    .describe("New parent task ID (for making it a subtask)"),
  previous: z.string().optional().describe("Task ID to position after"),
});

// ============================================================================
// Docs Input Schemas
// ============================================================================

export const GetDocumentInputSchema = z.object({
  documentId: z.string().describe("The document ID (from the URL)"),
});

export const CreateDocumentInputSchema = z.object({
  title: z.string().describe("Title of the new document"),
});

export const InsertTextInputSchema = z.object({
  documentId: z.string().describe("The document ID"),
  text: z.string().describe("Text to insert"),
  index: z
    .number()
    .describe("Character index where to insert (1 = beginning of document)"),
});

export const DeleteContentInputSchema = z.object({
  documentId: z.string().describe("The document ID"),
  startIndex: z.number().describe("Start character index"),
  endIndex: z.number().describe("End character index"),
});

export const ReplaceTextInputSchema = z.object({
  documentId: z.string().describe("The document ID"),
  findText: z.string().describe("Text to find"),
  replaceText: z.string().describe("Replacement text"),
  matchCase: z
    .boolean()
    .optional()
    .default(false)
    .describe("Case-sensitive match (default: false)"),
});

export const InsertImageInputSchema = z.object({
  documentId: z.string().describe("The document ID"),
  imageUri: z.string().describe("URL of the image to insert"),
  index: z.number().describe("Character index where to insert"),
  width: z.number().optional().describe("Image width in points"),
  height: z.number().optional().describe("Image height in points"),
});

export const InsertTableInputSchema = z.object({
  documentId: z.string().describe("The document ID"),
  index: z.number().describe("Character index where to insert"),
  rows: z.number().describe("Number of rows"),
  columns: z.number().describe("Number of columns"),
});

export const GetPlainTextInputSchema = z.object({
  documentId: z.string().describe("The document ID"),
});

// ============================================================================
// Slides Input Schemas
// ============================================================================

export const GetPresentationInputSchema = z.object({
  presentationId: z.string().describe("The presentation ID (from the URL)"),
});

export const CreatePresentationInputSchema = z.object({
  title: z.string().describe("Title of the new presentation"),
});

export const CreateSlideInputSchema = z.object({
  presentationId: z.string().describe("The presentation ID"),
  insertionIndex: z
    .number()
    .optional()
    .describe("Position to insert the slide (0-based)"),
  layout: z
    .enum([
      "BLANK",
      "CAPTION_ONLY",
      "TITLE",
      "TITLE_AND_BODY",
      "TITLE_AND_TWO_COLUMNS",
      "TITLE_ONLY",
      "SECTION_HEADER",
      "SECTION_TITLE_AND_DESCRIPTION",
      "ONE_COLUMN_TEXT",
      "MAIN_POINT",
      "BIG_NUMBER",
    ])
    .optional()
    .describe("Slide layout (default: BLANK)"),
});

export const DeleteSlideInputSchema = z.object({
  presentationId: z.string().describe("The presentation ID"),
  slideObjectId: z.string().describe("The object ID of the slide to delete"),
});

export const DuplicateSlideInputSchema = z.object({
  presentationId: z.string().describe("The presentation ID"),
  slideObjectId: z.string().describe("The object ID of the slide to duplicate"),
});

export const InsertSlideTextInputSchema = z.object({
  presentationId: z.string().describe("The presentation ID"),
  shapeObjectId: z
    .string()
    .describe("The object ID of the shape/text box to insert text into"),
  text: z.string().describe("Text to insert"),
  insertionIndex: z
    .number()
    .optional()
    .describe("Character index for insertion (default: end)"),
});

export const ReplaceSlideTextInputSchema = z.object({
  presentationId: z.string().describe("The presentation ID"),
  findText: z.string().describe("Text to find"),
  replaceText: z.string().describe("Replacement text"),
  matchCase: z
    .boolean()
    .optional()
    .default(false)
    .describe("Case-sensitive match (default: false)"),
  slideObjectIds: z
    .array(z.string())
    .optional()
    .describe("Limit to specific slides (by object ID)"),
});

export const InsertSlideImageInputSchema = z.object({
  presentationId: z.string().describe("The presentation ID"),
  slideObjectId: z.string().describe("The object ID of the slide"),
  imageUrl: z.string().describe("URL of the image to insert"),
  width: z
    .number()
    .optional()
    .default(300)
    .describe("Image width in points (default: 300)"),
  height: z
    .number()
    .optional()
    .default(200)
    .describe("Image height in points (default: 200)"),
  translateX: z
    .number()
    .optional()
    .default(100)
    .describe("X position in points (default: 100)"),
  translateY: z
    .number()
    .optional()
    .default(100)
    .describe("Y position in points (default: 100)"),
});

export const GetSlideCountInputSchema = z.object({
  presentationId: z.string().describe("The presentation ID"),
});

// ----------------------------------------------------------------------------
// Google Forms Input Schemas
// ----------------------------------------------------------------------------

export const GetFormInputSchema = z.object({
  formId: z.string().describe("The form ID"),
});

export const CreateFormInputSchema = z.object({
  title: z.string().describe("The title of the form"),
  documentTitle: z
    .string()
    .optional()
    .describe("The title of the form document (defaults to title)"),
});

export const AddFormQuestionInputSchema = z.object({
  formId: z.string().describe("The form ID"),
  title: z.string().describe("The question title/text"),
  questionType: z
    .enum([
      "SHORT_ANSWER",
      "PARAGRAPH",
      "MULTIPLE_CHOICE",
      "CHECKBOX",
      "DROPDOWN",
      "SCALE",
      "DATE",
      "TIME",
    ])
    .describe("The type of question"),
  required: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether the question is required"),
  options: z
    .array(z.string())
    .optional()
    .describe("Answer options (for MULTIPLE_CHOICE, CHECKBOX, DROPDOWN)"),
  scaleMin: z
    .number()
    .optional()
    .default(1)
    .describe("Minimum value for SCALE questions"),
  scaleMax: z
    .number()
    .optional()
    .default(5)
    .describe("Maximum value for SCALE questions"),
  index: z.number().optional().describe("Position in the form (0-indexed)"),
});

export const ListFormResponsesInputSchema = z.object({
  formId: z.string().describe("The form ID"),
  pageSize: z
    .number()
    .optional()
    .default(50)
    .describe("Maximum responses to return (default: 50)"),
  pageToken: z.string().optional().describe("Pagination token for next page"),
  filter: z
    .string()
    .optional()
    .describe('Filter expression (e.g., "timestamp > 2023-01-01T00:00:00Z")'),
});

export const GetFormResponseInputSchema = z.object({
  formId: z.string().describe("The form ID"),
  responseId: z.string().describe("The response ID"),
});

export const CreateFormWatchInputSchema = z.object({
  formId: z.string().describe("The form ID"),
  topicName: z
    .string()
    .describe(
      "Cloud Pub/Sub topic name (format: projects/{project}/topics/{topic})"
    ),
  eventType: z
    .enum(["RESPONSES", "SCHEMA"])
    .default("RESPONSES")
    .describe("Event type to watch for (RESPONSES or SCHEMA changes)"),
});

export const DeleteFormWatchInputSchema = z.object({
  formId: z.string().describe("The form ID"),
  watchId: z.string().describe("The watch ID to delete"),
});

// ----------------------------------------------------------------------------
// Google Meet Input Schemas
// ----------------------------------------------------------------------------

export const CreateMeetSpaceInputSchema = z.object({
  accessType: z
    .enum(["OPEN", "TRUSTED", "RESTRICTED"])
    .optional()
    .describe(
      "Access type: OPEN (anyone), TRUSTED (organization), RESTRICTED (invite only)"
    ),
});

export const GetMeetSpaceInputSchema = z.object({
  spaceName: z
    .string()
    .describe("Space name (format: spaces/{id}) or meeting code"),
});

export const EndActiveConferenceInputSchema = z.object({
  spaceName: z
    .string()
    .describe(
      "Space name (format: spaces/{id}) to end the active conference in"
    ),
});

export const ListConferenceRecordsInputSchema = z.object({
  filter: z
    .string()
    .optional()
    .describe(
      'Filter expression (e.g., space_name="spaces/{id}" to filter by space)'
    ),
  pageSize: z
    .number()
    .optional()
    .default(25)
    .describe("Maximum records to return (default: 25)"),
  pageToken: z.string().optional().describe("Pagination token for next page"),
});

export const GetConferenceRecordInputSchema = z.object({
  conferenceRecordName: z
    .string()
    .describe("Conference record name (format: conferenceRecords/{id})"),
});

export const ListRecordingsInputSchema = z.object({
  conferenceRecordName: z
    .string()
    .describe("Conference record name (format: conferenceRecords/{id})"),
  pageSize: z
    .number()
    .optional()
    .default(25)
    .describe("Maximum recordings to return (default: 25)"),
  pageToken: z.string().optional().describe("Pagination token for next page"),
});

export const ListTranscriptsInputSchema = z.object({
  conferenceRecordName: z
    .string()
    .describe("Conference record name (format: conferenceRecords/{id})"),
  pageSize: z
    .number()
    .optional()
    .default(25)
    .describe("Maximum transcripts to return (default: 25)"),
  pageToken: z.string().optional().describe("Pagination token for next page"),
});

// ============================================================================
// Tool Factory
// ============================================================================

/**
 * Create AI SDK tools for Google Workspace operations
 *
 * @param client - Initialized GoogleClient instance
 * @returns Object containing all Google tools
 */
export function createGoogleTools(client: GoogleClient) {
  return {
    // ========================================================================
    // Gmail Tools
    // ========================================================================

    gmail_list_messages: tool({
      description:
        'List email messages from Gmail. Use query parameter for searching (e.g., "is:unread", "from:user@example.com", "subject:invoice").',
      inputSchema: ListMessagesInputSchema,
      execute: async (params) => {
        const result = await client.gmail.listMessages({
          maxResults: params.maxResults,
          q: params.query,
          labelIds: params.labelIds,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    gmail_get_message: tool({
      description:
        "Get full details of a specific email message by ID. Returns headers, body, and attachments info.",
      inputSchema: GetMessageInputSchema,
      execute: async (params) => {
        const result = await client.gmail.getMessage({
          id: params.id,
          format: params.format,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    gmail_send_email: tool({
      description:
        "Send an email via Gmail. Supports HTML body, CC/BCC, and replying to threads.",
      inputSchema: SendEmailInputSchema,
      execute: async (params) => {
        const result = await client.gmail.sendMessage({
          to: params.to,
          subject: params.subject,
          body: params.body,
          cc: params.cc,
          bcc: params.bcc,
          replyTo: params.replyTo,
          threadId: params.threadId,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return { messageId: result.data.id, threadId: result.data.threadId };
      },
    }),

    gmail_list_labels: tool({
      description: "List all Gmail labels (folders) available in the mailbox.",
      inputSchema: z.object({}),
      execute: async () => {
        const result = await client.gmail.listLabels();
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data.labels;
      },
    }),

    // ========================================================================
    // Calendar Tools
    // ========================================================================

    calendar_list_events: tool({
      description:
        "List upcoming calendar events. Use timeMin/timeMax to filter by date range.",
      inputSchema: ListEventsInputSchema,
      execute: async (params) => {
        const result = await client.calendar.listEvents({
          calendarId: params.calendarId,
          maxResults: params.maxResults,
          timeMin: params.timeMin,
          timeMax: params.timeMax,
          q: params.query,
          singleEvents: params.singleEvents,
          orderBy: params.orderBy,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data.items;
      },
    }),

    calendar_get_event: tool({
      description: "Get full details of a specific calendar event by ID.",
      inputSchema: GetEventInputSchema,
      execute: async (params) => {
        const result = await client.calendar.getEvent(
          params.eventId,
          params.calendarId
        );
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    calendar_create_event: tool({
      description:
        "Create a new calendar event. Supports all-day events, recurring events, attendees, and Google Meet links.",
      inputSchema: CreateEventInputSchema,
      execute: async (params) => {
        // Build start/end based on whether it's all-day or timed
        const start = params.startDate
          ? { date: params.startDate }
          : { dateTime: params.startDateTime, timeZone: params.timeZone };

        const end = params.endDate
          ? { date: params.endDate }
          : { dateTime: params.endDateTime, timeZone: params.timeZone };

        const result = await client.calendar.createEvent({
          calendarId: params.calendarId,
          summary: params.summary,
          description: params.description,
          location: params.location,
          start,
          end,
          attendees: params.attendees?.map((email) => ({ email })),
          sendUpdates: params.sendUpdates,
          conferenceData: params.createMeet
            ? {
                createRequest: {
                  requestId: `meet-${Date.now()}`,
                  conferenceSolutionKey: { type: "hangoutsMeet" },
                },
              }
            : undefined,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return {
          eventId: result.data.id,
          htmlLink: result.data.htmlLink,
          meetLink: result.data.conferenceData?.entryPoints?.find(
            (e) => e.entryPointType === "video"
          )?.uri,
        };
      },
    }),

    calendar_delete_event: tool({
      description: "Delete a calendar event by ID.",
      inputSchema: DeleteEventInputSchema,
      execute: async (params) => {
        const result = await client.calendar.deleteEvent(
          params.eventId,
          params.calendarId
        );
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return { deleted: true, eventId: params.eventId };
      },
    }),

    calendar_update_event: tool({
      description:
        "Update an existing calendar event. Can modify title, description, location, start/end times.",
      inputSchema: UpdateEventInputSchema,
      execute: async (params) => {
        // Build update object with only provided fields
        const updates: Record<string, unknown> = {};

        if (params.summary) updates.summary = params.summary;
        if (params.description) updates.description = params.description;
        if (params.location) updates.location = params.location;

        // Handle start/end times
        if (params.startDateTime) {
          updates.start = {
            dateTime: params.startDateTime,
            timeZone: params.timeZone,
          };
        } else if (params.startDate) {
          updates.start = { date: params.startDate };
        }

        if (params.endDateTime) {
          updates.end = {
            dateTime: params.endDateTime,
            timeZone: params.timeZone,
          };
        } else if (params.endDate) {
          updates.end = { date: params.endDate };
        }

        const result = await client.calendar.updateEvent(
          params.eventId,
          updates,
          params.calendarId
        );
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return {
          eventId: result.data.id,
          htmlLink: result.data.htmlLink,
          summary: result.data.summary,
        };
      },
    }),

    calendar_list_calendars: tool({
      description: "List all calendars the user has access to.",
      inputSchema: z.object({}),
      execute: async () => {
        const result = await client.calendar.listCalendars();
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data.items;
      },
    }),

    // ========================================================================
    // Drive Tools
    // ========================================================================

    drive_list_files: tool({
      description:
        "List files in Google Drive. Use query parameter for searching (e.g., \"name contains 'report'\").",
      inputSchema: ListFilesInputSchema,
      execute: async (params) => {
        const result = await client.drive.listFiles({
          maxResults: params.maxResults,
          q: params.query,
          orderBy: params.orderBy,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data.files;
      },
    }),

    drive_get_file: tool({
      description: "Get metadata for a specific file in Google Drive.",
      inputSchema: GetFileInputSchema,
      execute: async (params) => {
        const result = await client.drive.getFile({ fileId: params.fileId });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    drive_search_files: tool({
      description:
        "Search for files in Google Drive. Supports advanced queries like mimeType, owner, and modification date.",
      inputSchema: SearchFilesInputSchema,
      execute: async (params) => {
        const result = await client.drive.searchFiles(
          params.query,
          params.maxResults
        );
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data.files;
      },
    }),

    // ========================================================================
    // Sheets Tools
    // ========================================================================

    sheets_get_spreadsheet: tool({
      description:
        "Get metadata and optionally sheet data from a Google Spreadsheet. Returns sheet names, properties, and cell data if requested.",
      inputSchema: GetSpreadsheetInputSchema,
      execute: async (params) => {
        const result = await client.sheets.getSpreadsheet({
          spreadsheetId: params.spreadsheetId,
          ranges: params.ranges,
          includeGridData: params.includeGridData,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    sheets_get_values: tool({
      description:
        'Read cell values from a Google Sheets range. Use A1 notation (e.g., "Sheet1!A1:D10", "A1:B5").',
      inputSchema: GetValuesInputSchema,
      execute: async (params) => {
        const result = await client.sheets.getValues({
          spreadsheetId: params.spreadsheetId,
          range: params.range,
          majorDimension: params.majorDimension,
          valueRenderOption: params.valueRenderOption,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    sheets_update_values: tool({
      description:
        "Write values to a Google Sheets range. Values should be a 2D array (rows × columns).",
      inputSchema: UpdateValuesInputSchema,
      execute: async (params) => {
        const result = await client.sheets.updateValues({
          spreadsheetId: params.spreadsheetId,
          range: params.range,
          values: params.values,
          valueInputOption: params.valueInputOption,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return {
          updatedRange: result.data.updatedRange,
          updatedRows: result.data.updatedRows,
          updatedColumns: result.data.updatedColumns,
          updatedCells: result.data.updatedCells,
        };
      },
    }),

    sheets_append_values: tool({
      description:
        "Append rows to the end of a table in Google Sheets. Automatically finds the end of existing data.",
      inputSchema: AppendValuesInputSchema,
      execute: async (params) => {
        const result = await client.sheets.appendValues({
          spreadsheetId: params.spreadsheetId,
          range: params.range,
          values: params.values,
          valueInputOption: params.valueInputOption,
          insertDataOption: params.insertDataOption,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return {
          tableRange: result.data.tableRange,
          updatedRange: result.data.updates.updatedRange,
          updatedRows: result.data.updates.updatedRows,
          updatedCells: result.data.updates.updatedCells,
        };
      },
    }),

    sheets_clear_values: tool({
      description:
        "Clear all values from a Google Sheets range (keeps formatting).",
      inputSchema: ClearValuesInputSchema,
      execute: async (params) => {
        const result = await client.sheets.clearValues({
          spreadsheetId: params.spreadsheetId,
          range: params.range,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return { clearedRange: result.data.clearedRange };
      },
    }),

    sheets_create_spreadsheet: tool({
      description: "Create a new Google Spreadsheet with optional sheet names.",
      inputSchema: CreateSpreadsheetInputSchema,
      execute: async (params) => {
        const sheets = params.sheetTitles?.map((title) => ({
          properties: { title },
        }));
        const result = await client.sheets.createSpreadsheet({
          title: params.title,
          sheets,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return {
          spreadsheetId: result.data.spreadsheetId,
          spreadsheetUrl: result.data.spreadsheetUrl,
          sheets: result.data.sheets?.map((s) => ({
            sheetId: s.properties.sheetId,
            title: s.properties.title,
          })),
        };
      },
    }),

    sheets_add_sheet: tool({
      description: "Add a new sheet (tab) to an existing spreadsheet.",
      inputSchema: AddSheetInputSchema,
      execute: async (params) => {
        const result = await client.sheets.addSheet({
          spreadsheetId: params.spreadsheetId,
          title: params.title,
          rowCount: params.rowCount,
          columnCount: params.columnCount,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        const addedSheet = result.data.replies?.[0] as
          | { addSheet?: { properties: { sheetId: number; title: string } } }
          | undefined;
        return {
          sheetId: addedSheet?.addSheet?.properties.sheetId,
          title: addedSheet?.addSheet?.properties.title,
        };
      },
    }),

    sheets_delete_sheet: tool({
      description:
        "Delete a sheet (tab) from a spreadsheet by its numeric sheet ID.",
      inputSchema: DeleteSheetInputSchema,
      execute: async (params) => {
        const result = await client.sheets.deleteSheet({
          spreadsheetId: params.spreadsheetId,
          sheetId: params.sheetId,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return { deleted: true, sheetId: params.sheetId };
      },
    }),

    sheets_copy_sheet: tool({
      description: "Copy a sheet from one spreadsheet to another.",
      inputSchema: CopySheetInputSchema,
      execute: async (params) => {
        const result = await client.sheets.copySheet({
          spreadsheetId: params.spreadsheetId,
          sheetId: params.sheetId,
          destinationSpreadsheetId: params.destinationSpreadsheetId,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return {
          sheetId: result.data.sheetId,
          title: result.data.title,
        };
      },
    }),

    // ========================================================================
    // Tasks Tools
    // ========================================================================

    tasks_list_task_lists: tool({
      description: "List all Google Tasks lists (task containers).",
      inputSchema: ListTaskListsInputSchema,
      execute: async (params) => {
        const result = await client.tasks.listTaskLists({
          maxResults: params.maxResults,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data.items;
      },
    }),

    tasks_get_task_list: tool({
      description: "Get details of a specific task list.",
      inputSchema: GetTaskListInputSchema,
      execute: async (params) => {
        const result = await client.tasks.getTaskList(params.taskListId);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    tasks_create_task_list: tool({
      description: "Create a new task list.",
      inputSchema: CreateTaskListInputSchema,
      execute: async (params) => {
        const result = await client.tasks.createTaskList({
          title: params.title,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    tasks_update_task_list: tool({
      description: "Update a task list title.",
      inputSchema: UpdateTaskListInputSchema,
      execute: async (params) => {
        const result = await client.tasks.updateTaskList({
          taskListId: params.taskListId,
          title: params.title,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    tasks_delete_task_list: tool({
      description: "Delete a task list and all its tasks.",
      inputSchema: DeleteTaskListInputSchema,
      execute: async (params) => {
        const result = await client.tasks.deleteTaskList(params.taskListId);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return { deleted: true, taskListId: params.taskListId };
      },
    }),

    tasks_list_tasks: tool({
      description:
        "List tasks in a task list. Use filters to show/hide completed tasks.",
      inputSchema: ListTasksInputSchema,
      execute: async (params) => {
        const result = await client.tasks.listTasks({
          taskListId: params.taskListId,
          maxResults: params.maxResults,
          showCompleted: params.showCompleted,
          showHidden: params.showHidden,
          dueMin: params.dueMin,
          dueMax: params.dueMax,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data.items;
      },
    }),

    tasks_get_task: tool({
      description: "Get details of a specific task.",
      inputSchema: GetTaskInputSchema,
      execute: async (params) => {
        const result = await client.tasks.getTask(
          params.taskListId,
          params.taskId
        );
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    tasks_create_task: tool({
      description:
        "Create a new task in a task list. Can be a top-level task or subtask.",
      inputSchema: CreateTaskInputSchema,
      execute: async (params) => {
        const result = await client.tasks.createTask({
          taskListId: params.taskListId,
          title: params.title,
          notes: params.notes,
          due: params.due,
          parent: params.parent,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    tasks_update_task: tool({
      description: "Update a task (title, notes, due date, or status).",
      inputSchema: UpdateTaskInputSchema,
      execute: async (params) => {
        const result = await client.tasks.updateTask({
          taskListId: params.taskListId,
          taskId: params.taskId,
          title: params.title,
          notes: params.notes,
          due: params.due,
          status: params.status,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    tasks_delete_task: tool({
      description: "Delete a task.",
      inputSchema: DeleteTaskInputSchema,
      execute: async (params) => {
        const result = await client.tasks.deleteTask(
          params.taskListId,
          params.taskId
        );
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return { deleted: true, taskId: params.taskId };
      },
    }),

    tasks_complete_task: tool({
      description: "Mark a task as completed.",
      inputSchema: CompleteTaskInputSchema,
      execute: async (params) => {
        const result = await client.tasks.completeTask(
          params.taskListId,
          params.taskId
        );
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return { completed: true, taskId: params.taskId };
      },
    }),

    tasks_move_task: tool({
      description: "Move a task to a different position or make it a subtask.",
      inputSchema: MoveTaskInputSchema,
      execute: async (params) => {
        const result = await client.tasks.moveTask({
          taskListId: params.taskListId,
          taskId: params.taskId,
          parent: params.parent,
          previous: params.previous,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    // ========================================================================
    // Docs Tools
    // ========================================================================

    docs_get_document: tool({
      description:
        "Get a Google Doc by ID. Returns the document structure including title, body content, and formatting.",
      inputSchema: GetDocumentInputSchema,
      execute: async (params) => {
        const result = await client.docs.getDocument({
          documentId: params.documentId,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    docs_create_document: tool({
      description: "Create a new Google Doc with a title.",
      inputSchema: CreateDocumentInputSchema,
      execute: async (params) => {
        const result = await client.docs.createDocument({
          title: params.title,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return {
          documentId: result.data.documentId,
          title: result.data.title,
        };
      },
    }),

    docs_insert_text: tool({
      description:
        "Insert text at a specific position in a Google Doc. Index 1 = start of document.",
      inputSchema: InsertTextInputSchema,
      execute: async (params) => {
        const result = await client.docs.insertText({
          documentId: params.documentId,
          text: params.text,
          index: params.index,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return { success: true, documentId: result.data.documentId };
      },
    }),

    docs_delete_content: tool({
      description: "Delete content in a range from a Google Doc.",
      inputSchema: DeleteContentInputSchema,
      execute: async (params) => {
        const result = await client.docs.deleteContent({
          documentId: params.documentId,
          startIndex: params.startIndex,
          endIndex: params.endIndex,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return { success: true, documentId: result.data.documentId };
      },
    }),

    docs_replace_text: tool({
      description: "Find and replace all occurrences of text in a Google Doc.",
      inputSchema: ReplaceTextInputSchema,
      execute: async (params) => {
        const result = await client.docs.replaceText({
          documentId: params.documentId,
          findText: params.findText,
          replaceText: params.replaceText,
          matchCase: params.matchCase,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        const reply = result.data.replies?.[0];
        return {
          success: true,
          occurrencesChanged: reply?.replaceAllText?.occurrencesChanged ?? 0,
        };
      },
    }),

    docs_insert_image: tool({
      description: "Insert an image from a URL into a Google Doc.",
      inputSchema: InsertImageInputSchema,
      execute: async (params) => {
        const result = await client.docs.insertImage({
          documentId: params.documentId,
          imageUri: params.imageUri,
          index: params.index,
          width: params.width,
          height: params.height,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return { success: true, documentId: result.data.documentId };
      },
    }),

    docs_insert_table: tool({
      description: "Insert a table into a Google Doc.",
      inputSchema: InsertTableInputSchema,
      execute: async (params) => {
        const result = await client.docs.insertTable({
          documentId: params.documentId,
          index: params.index,
          rows: params.rows,
          columns: params.columns,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return { success: true, documentId: result.data.documentId };
      },
    }),

    docs_get_plain_text: tool({
      description:
        "Extract plain text content from a Google Doc (without formatting).",
      inputSchema: GetPlainTextInputSchema,
      execute: async (params) => {
        const result = await client.docs.getPlainText(params.documentId);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return { text: result.data };
      },
    }),

    // ========================================================================
    // Slides Tools
    // ========================================================================

    slides_get_presentation: tool({
      description:
        "Get a Google Slides presentation by ID. Returns slide structure, page elements, and text content.",
      inputSchema: GetPresentationInputSchema,
      execute: async (params) => {
        const result = await client.slides.getPresentation({
          presentationId: params.presentationId,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    slides_create_presentation: tool({
      description: "Create a new Google Slides presentation.",
      inputSchema: CreatePresentationInputSchema,
      execute: async (params) => {
        const result = await client.slides.createPresentation({
          title: params.title,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return {
          presentationId: result.data.presentationId,
          title: result.data.title,
        };
      },
    }),

    slides_create_slide: tool({
      description:
        "Add a new slide to a presentation. Supports various layouts.",
      inputSchema: CreateSlideInputSchema,
      execute: async (params) => {
        const result = await client.slides.createSlide({
          presentationId: params.presentationId,
          insertionIndex: params.insertionIndex,
          layout: params.layout,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        const createReply = result.data.replies?.[0]?.createSlide;
        return {
          success: true,
          slideObjectId: createReply?.objectId,
        };
      },
    }),

    slides_delete_slide: tool({
      description: "Delete a slide from a presentation.",
      inputSchema: DeleteSlideInputSchema,
      execute: async (params) => {
        const result = await client.slides.deleteSlide({
          presentationId: params.presentationId,
          slideObjectId: params.slideObjectId,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return { deleted: true, slideObjectId: params.slideObjectId };
      },
    }),

    slides_duplicate_slide: tool({
      description: "Duplicate an existing slide in a presentation.",
      inputSchema: DuplicateSlideInputSchema,
      execute: async (params) => {
        const result = await client.slides.duplicateSlide({
          presentationId: params.presentationId,
          slideObjectId: params.slideObjectId,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        const duplicateReply = result.data.replies?.[0]?.duplicateObject;
        return {
          success: true,
          newSlideObjectId: duplicateReply?.objectId,
        };
      },
    }),

    slides_insert_text: tool({
      description: "Insert text into a shape or text box on a slide.",
      inputSchema: InsertSlideTextInputSchema,
      execute: async (params) => {
        const result = await client.slides.insertText({
          presentationId: params.presentationId,
          shapeObjectId: params.shapeObjectId,
          text: params.text,
          insertionIndex: params.insertionIndex,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return { success: true, presentationId: result.data.presentationId };
      },
    }),

    slides_replace_text: tool({
      description:
        "Find and replace all occurrences of text in a presentation.",
      inputSchema: ReplaceSlideTextInputSchema,
      execute: async (params) => {
        const result = await client.slides.replaceText({
          presentationId: params.presentationId,
          findText: params.findText,
          replaceText: params.replaceText,
          matchCase: params.matchCase,
          slideObjectIds: params.slideObjectIds,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        const reply = result.data.replies?.[0];
        return {
          success: true,
          occurrencesChanged: reply?.replaceAllText?.occurrencesChanged ?? 0,
        };
      },
    }),

    slides_insert_image: tool({
      description: "Insert an image from a URL onto a slide.",
      inputSchema: InsertSlideImageInputSchema,
      execute: async (params) => {
        const result = await client.slides.insertImage({
          presentationId: params.presentationId,
          slideObjectId: params.slideObjectId,
          imageUrl: params.imageUrl,
          width: params.width,
          height: params.height,
          translateX: params.translateX,
          translateY: params.translateY,
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        const createReply = result.data.replies?.[0]?.createImage;
        return {
          success: true,
          imageObjectId: createReply?.objectId,
        };
      },
    }),

    slides_get_slide_count: tool({
      description: "Get the number of slides in a presentation.",
      inputSchema: GetSlideCountInputSchema,
      execute: async (params) => {
        const result = await client.slides.getSlideCount(params.presentationId);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return { slideCount: result.data };
      },
    }),

    // ========================================================================
    // Google Forms Tools
    // ========================================================================

    forms_get_form: tool({
      description:
        "Get a Google Form by ID. Returns form structure including questions and settings.",
      inputSchema: GetFormInputSchema,
      execute: async (params) => {
        const result = await client.forms.getForm(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    forms_create_form: tool({
      description:
        "Create a new Google Form. Returns the created form with its ID.",
      inputSchema: CreateFormInputSchema,
      execute: async (params) => {
        const result = await client.forms.createForm(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    forms_add_question: tool({
      description:
        "Add a question to a Google Form. Supports various question types: SHORT_ANSWER, PARAGRAPH, MULTIPLE_CHOICE, CHECKBOX, DROPDOWN, SCALE, DATE, TIME.",
      inputSchema: AddFormQuestionInputSchema,
      execute: async (params) => {
        // Build the question item based on type
        const questionItem: Record<string, unknown> = {
          title: params.title,
          questionItem: {
            question: {
              required: params.required,
            },
          },
        };

        const question = (questionItem.questionItem as Record<string, unknown>)
          .question as Record<string, unknown>;

        // Set the appropriate question type
        switch (params.questionType) {
          case "SHORT_ANSWER":
            question.textQuestion = { paragraph: false };
            break;
          case "PARAGRAPH":
            question.textQuestion = { paragraph: true };
            break;
          case "MULTIPLE_CHOICE":
            question.choiceQuestion = {
              type: "RADIO",
              options: (params.options ?? []).map((value) => ({ value })),
            };
            break;
          case "CHECKBOX":
            question.choiceQuestion = {
              type: "CHECKBOX",
              options: (params.options ?? []).map((value) => ({ value })),
            };
            break;
          case "DROPDOWN":
            question.choiceQuestion = {
              type: "DROP_DOWN",
              options: (params.options ?? []).map((value) => ({ value })),
            };
            break;
          case "SCALE":
            question.scaleQuestion = {
              low: params.scaleMin,
              high: params.scaleMax,
            };
            break;
          case "DATE":
            question.dateQuestion = { includeTime: false, includeYear: true };
            break;
          case "TIME":
            question.timeQuestion = { duration: false };
            break;
        }

        const request: Record<string, unknown> = {
          createItem: {
            item: questionItem,
            location: { index: params.index ?? 0 },
          },
        };

        const result = await client.forms.batchUpdate(params.formId, [request]);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    forms_list_responses: tool({
      description:
        "List responses for a Google Form. Supports pagination and filtering by timestamp.",
      inputSchema: ListFormResponsesInputSchema,
      execute: async (params) => {
        const result = await client.forms.listResponses(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    forms_get_response: tool({
      description:
        "Get a single form response by ID. Returns all answers for that submission.",
      inputSchema: GetFormResponseInputSchema,
      execute: async (params) => {
        const result = await client.forms.getResponse(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    forms_create_watch: tool({
      description:
        "Create a watch to receive notifications when new responses are submitted or form schema changes. Requires a Cloud Pub/Sub topic.",
      inputSchema: CreateFormWatchInputSchema,
      execute: async (params) => {
        const result = await client.forms.createWatch(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    forms_delete_watch: tool({
      description: "Delete a watch that was previously created for a form.",
      inputSchema: DeleteFormWatchInputSchema,
      execute: async (params) => {
        const result = await client.forms.deleteWatch(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return { success: true };
      },
    }),

    // ========================================================================
    // Google Meet Tools
    // ========================================================================

    meet_create_space: tool({
      description:
        "Create a new Google Meet space (meeting room). Returns the meeting code and join URL.",
      inputSchema: CreateMeetSpaceInputSchema,
      execute: async (params) => {
        const result = await client.meet.createSpace(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    meet_get_space: tool({
      description:
        "Get details of a Google Meet space by name or meeting code.",
      inputSchema: GetMeetSpaceInputSchema,
      execute: async (params) => {
        const result = await client.meet.getSpace(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    meet_end_active_conference: tool({
      description:
        "End an active conference in a Google Meet space. All participants will be disconnected.",
      inputSchema: EndActiveConferenceInputSchema,
      execute: async (params) => {
        const result = await client.meet.endActiveConference(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return { success: true };
      },
    }),

    meet_list_conference_records: tool({
      description:
        "List past conference records (meeting history). Can filter by space to see meetings for a specific room.",
      inputSchema: ListConferenceRecordsInputSchema,
      execute: async (params) => {
        const result = await client.meet.listConferenceRecords(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    meet_get_conference_record: tool({
      description:
        "Get details of a specific conference record (past meeting).",
      inputSchema: GetConferenceRecordInputSchema,
      execute: async (params) => {
        const result = await client.meet.getConferenceRecord(
          params.conferenceRecordName
        );
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    meet_list_recordings: tool({
      description:
        "List recordings for a conference. Returns links to recording files in Drive.",
      inputSchema: ListRecordingsInputSchema,
      execute: async (params) => {
        const result = await client.meet.listRecordings(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    meet_list_transcripts: tool({
      description:
        "List transcripts for a conference. Returns links to transcript documents.",
      inputSchema: ListTranscriptsInputSchema,
      execute: async (params) => {
        const result = await client.meet.listTranscripts(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),
  };
}

// ============================================================================
// Type Exports
// ============================================================================

export type GoogleTools = ReturnType<typeof createGoogleTools>;
