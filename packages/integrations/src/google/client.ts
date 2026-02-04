/**
 * Google Workspace Client
 *
 * Runtime-agnostic client for Gmail, Calendar, and Drive APIs.
 * Works in Node.js, Edge runtimes, and Cloudflare Workers.
 *
 * Uses OAuth 2.0 refresh tokens for authentication.
 *
 * @example
 * import { GoogleClient } from '@trendingsociety/integrations/google'
 *
 * const google = new GoogleClient({
 *   clientId: process.env.GOOGLE_CLIENT_ID,
 *   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
 *   refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
 * })
 *
 * // List recent emails
 * const emails = await google.gmail.listMessages({ maxResults: 10 })
 *
 * // Get calendar events
 * const events = await google.calendar.listEvents({ maxResults: 10 })
 */

import { ok, fail, type Result, type ClientConfig } from '../types.js'
import type {
  GmailMessage,
  GmailThread,
  GmailLabel,
  CalendarEvent,
  DriveFile,
  DriveFileList,
  ListMessagesParams,
  GetMessageParams,
  SendMessageParams,
  ListEventsParams,
  CreateEventParams,
  ListFilesParams,
  GetFileParams,
  ListMessagesResponse,
  ListEventsResponse,
  ListCalendarsResponse,
  // Sheets types
  Spreadsheet,
  ValueRange,
  UpdateValuesResponse,
  AppendValuesResponse,
  ClearValuesResponse,
  BatchUpdateSpreadsheetResponse,
  SheetProperties,
  GetSpreadsheetParams,
  GetValuesParams,
  UpdateValuesParams,
  AppendValuesParams,
  ClearValuesParams,
  CreateSpreadsheetParams,
  AddSheetParams,
  DeleteSheetParams,
  CopySheetParams,
  // Tasks types
  TaskList,
  TaskListsResponse,
  Task,
  TasksResponse,
  ListTaskListsParams,
  CreateTaskListParams,
  UpdateTaskListParams,
  ListTasksParams,
  CreateTaskParams,
  UpdateTaskParams,
  MoveTaskParams,
  // Docs types
  Document,
  BatchUpdateDocumentResponse,
  GetDocumentParams,
  CreateDocumentParams,
  InsertTextParams,
  DeleteContentParams,
  ReplaceTextParams,
  InsertImageParams,
  InsertTableParams,
  // Slides types
  Presentation,
  BatchUpdatePresentationResponse,
  GetPresentationParams,
  CreatePresentationParams,
  CreateSlideParams,
  DeleteSlideParams,
  DuplicateSlideParams,
  InsertSlideTextParams,
  ReplaceSlideTextParams,
  InsertSlideImageParams,
  // Forms types
  Form,
  FormResponse,
  ListFormResponsesResponse,
  Watch,
  BatchUpdateFormResponse,
  GetFormParams,
  CreateFormParams,
  ListFormResponsesParams,
  GetFormResponseParams,
  CreateWatchParams,
  DeleteWatchParams,
  // Meet types
  MeetSpace,
  ConferenceRecord,
  ListConferenceRecordsResponse,
  ListRecordingsResponse,
  ListTranscriptsResponse,
  CreateMeetSpaceParams,
  GetMeetSpaceParams,
  EndActiveConferenceParams,
  ListConferenceRecordsParams,
  ListRecordingsParams,
  ListTranscriptsParams,
} from './types.js'

// ============================================================================
// Configuration
// ============================================================================

export interface GoogleClientConfig extends ClientConfig {
  /** Google OAuth Client ID */
  clientId: string
  /** Google OAuth Client Secret */
  clientSecret: string
  /** OAuth Refresh Token */
  refreshToken: string
}

// ============================================================================
// Token Management
// ============================================================================

interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
}

// ============================================================================
// Client Implementation
// ============================================================================

export class GoogleClient {
  private clientId: string
  private clientSecret: string
  private refreshToken: string
  private accessToken: string | null = null
  private tokenExpiry: number = 0
  private timeout: number
  private fetchFn: typeof fetch
  private debug: boolean

  public readonly gmail: GmailClient
  public readonly calendar: CalendarClient
  public readonly drive: DriveClient
  public readonly sheets: SheetsClient
  public readonly tasks: TasksClient
  public readonly docs: DocsClient
  public readonly slides: SlidesClient
  public readonly forms: FormsClient
  public readonly meet: MeetClient

  constructor(config: GoogleClientConfig) {
    if (!config.clientId || !config.clientSecret || !config.refreshToken) {
      throw new Error('GoogleClient requires clientId, clientSecret, and refreshToken')
    }

    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.refreshToken = config.refreshToken
    this.timeout = config.timeout ?? 30000
    this.fetchFn = config.fetch ?? fetch.bind(globalThis)
    this.debug = config.debug ?? false

    // Initialize sub-clients
    this.gmail = new GmailClient(this)
    this.calendar = new CalendarClient(this)
    this.drive = new DriveClient(this)
    this.sheets = new SheetsClient(this)
    this.tasks = new TasksClient(this)
    this.docs = new DocsClient(this)
    this.slides = new SlidesClient(this)
    this.forms = new FormsClient(this)
    this.meet = new MeetClient(this)
  }

  // --------------------------------------------------------------------------
  // Token Refresh
  // --------------------------------------------------------------------------

  async getAccessToken(): Promise<Result<string>> {
    // Return cached token if still valid (with 60s buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return ok(this.accessToken)
    }

    if (this.debug) {
      console.log('[GoogleClient] Refreshing access token...')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await this.fetchFn('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        return fail('TOKEN_REFRESH_ERROR', `Failed to refresh token: ${errorText}`, response.status)
      }

      const data = (await response.json()) as TokenResponse
      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + data.expires_in * 1000

      if (this.debug) {
        console.log('[GoogleClient] Token refreshed, expires in', data.expires_in, 'seconds')
      }

      return ok(this.accessToken)
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return fail('TIMEOUT', `Token refresh timed out after ${this.timeout}ms`)
        }
        return fail('NETWORK_ERROR', error.message)
      }

      return fail('UNKNOWN_ERROR', String(error))
    }
  }

  // --------------------------------------------------------------------------
  // HTTP Request Helper
  // --------------------------------------------------------------------------

  async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<Result<T>> {
    const tokenResult = await this.getAccessToken()
    if (!tokenResult.success) {
      return tokenResult
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await this.fetchFn(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${tokenResult.data}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        return fail('API_ERROR', `Google API error (${response.status}): ${errorText}`, response.status)
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return ok({} as T)
      }

      const data = (await response.json()) as T
      return ok(data)
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
}

// ============================================================================
// Gmail Client
// ============================================================================

class GmailClient {
  private client: GoogleClient

  constructor(client: GoogleClient) {
    this.client = client
  }

  /**
   * List messages in the user's mailbox
   */
  async listMessages(params: ListMessagesParams = {}): Promise<Result<ListMessagesResponse>> {
    const query = new URLSearchParams()
    if (params.maxResults) query.set('maxResults', String(params.maxResults))
    if (params.pageToken) query.set('pageToken', params.pageToken)
    if (params.q) query.set('q', params.q)
    if (params.labelIds) params.labelIds.forEach((id) => query.append('labelIds', id))
    if (params.includeSpamTrash) query.set('includeSpamTrash', 'true')

    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?${query}`
    return this.client.request<ListMessagesResponse>(url)
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(params: GetMessageParams): Promise<Result<GmailMessage>> {
    const query = new URLSearchParams()
    if (params.format) query.set('format', params.format)
    if (params.metadataHeaders) {
      params.metadataHeaders.forEach((h) => query.append('metadataHeaders', h))
    }

    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${params.id}?${query}`
    return this.client.request<GmailMessage>(url)
  }

  /**
   * Get a thread by ID with all messages
   */
  async getThread(threadId: string): Promise<Result<GmailThread>> {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`
    return this.client.request<GmailThread>(url)
  }

  /**
   * List all labels
   */
  async listLabels(): Promise<Result<{ labels: GmailLabel[] }>> {
    const url = 'https://gmail.googleapis.com/gmail/v1/users/me/labels'
    return this.client.request<{ labels: GmailLabel[] }>(url)
  }

  /**
   * Send an email message
   */
  async sendMessage(params: SendMessageParams): Promise<Result<GmailMessage>> {
    // Build RFC 2822 message
    const headers = [
      `To: ${params.to}`,
      `Subject: ${params.subject}`,
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
    ]

    if (params.cc) headers.push(`Cc: ${params.cc}`)
    if (params.bcc) headers.push(`Bcc: ${params.bcc}`)
    if (params.replyTo) headers.push(`Reply-To: ${params.replyTo}`)
    if (params.inReplyTo) headers.push(`In-Reply-To: ${params.inReplyTo}`)

    const rawMessage = `${headers.join('\r\n')}\r\n\r\n${params.body}`

    // Encode UTF-8 string to base64 (handles emojis and non-Latin1 characters)
    const bytes = new TextEncoder().encode(rawMessage)
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
    const encodedMessage = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const body: Record<string, unknown> = { raw: encodedMessage }
    if (params.threadId) body.threadId = params.threadId

    const url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'
    return this.client.request<GmailMessage>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /**
   * Modify labels on a message
   */
  async modifyLabels(
    messageId: string,
    addLabelIds: string[] = [],
    removeLabelIds: string[] = []
  ): Promise<Result<GmailMessage>> {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`
    return this.client.request<GmailMessage>(url, {
      method: 'POST',
      body: JSON.stringify({ addLabelIds, removeLabelIds }),
    })
  }

  /**
   * Trash a message
   */
  async trashMessage(messageId: string): Promise<Result<GmailMessage>> {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`
    return this.client.request<GmailMessage>(url, { method: 'POST' })
  }

  /**
   * Untrash a message
   */
  async untrashMessage(messageId: string): Promise<Result<GmailMessage>> {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/untrash`
    return this.client.request<GmailMessage>(url, { method: 'POST' })
  }
}

// ============================================================================
// Calendar Client
// ============================================================================

class CalendarClient {
  private client: GoogleClient

  constructor(client: GoogleClient) {
    this.client = client
  }

  /**
   * List calendars the user has access to
   */
  async listCalendars(): Promise<Result<ListCalendarsResponse>> {
    const url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList'
    return this.client.request<ListCalendarsResponse>(url)
  }

  /**
   * List events from a calendar
   */
  async listEvents(params: ListEventsParams = {}): Promise<Result<ListEventsResponse>> {
    const calendarId = params.calendarId ?? 'primary'
    const query = new URLSearchParams()

    if (params.maxResults) query.set('maxResults', String(params.maxResults))
    if (params.pageToken) query.set('pageToken', params.pageToken)
    if (params.timeMin) query.set('timeMin', params.timeMin)
    if (params.timeMax) query.set('timeMax', params.timeMax)
    if (params.q) query.set('q', params.q)
    if (params.singleEvents !== undefined) query.set('singleEvents', String(params.singleEvents))
    if (params.orderBy) query.set('orderBy', params.orderBy)

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${query}`
    return this.client.request<ListEventsResponse>(url)
  }

  /**
   * Get a specific event by ID
   */
  async getEvent(eventId: string, calendarId = 'primary'): Promise<Result<CalendarEvent>> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`
    return this.client.request<CalendarEvent>(url)
  }

  /**
   * Create a new calendar event
   */
  async createEvent(params: CreateEventParams): Promise<Result<CalendarEvent>> {
    const calendarId = params.calendarId ?? 'primary'
    const query = new URLSearchParams()

    if (params.sendUpdates) query.set('sendUpdates', params.sendUpdates)
    if (params.conferenceData?.createRequest) {
      query.set('conferenceDataVersion', '1')
    }

    const body: Record<string, unknown> = {
      summary: params.summary,
      start: params.start,
      end: params.end,
    }

    if (params.description) body.description = params.description
    if (params.location) body.location = params.location
    if (params.attendees) body.attendees = params.attendees
    if (params.conferenceData) body.conferenceData = params.conferenceData

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${query}`
    return this.client.request<CalendarEvent>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    eventId: string,
    updates: Partial<CreateEventParams>,
    calendarId = 'primary'
  ): Promise<Result<CalendarEvent>> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`
    return this.client.request<CalendarEvent>(url, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string, calendarId = 'primary'): Promise<Result<void>> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`
    return this.client.request<void>(url, { method: 'DELETE' })
  }
}

// ============================================================================
// Drive Client
// ============================================================================

class DriveClient {
  private client: GoogleClient

  constructor(client: GoogleClient) {
    this.client = client
  }

  /**
   * List files in Google Drive
   */
  async listFiles(params: ListFilesParams = {}): Promise<Result<DriveFileList>> {
    const query = new URLSearchParams()

    if (params.maxResults) query.set('pageSize', String(params.maxResults))
    if (params.pageToken) query.set('pageToken', params.pageToken)
    if (params.q) query.set('q', params.q)
    if (params.orderBy) query.set('orderBy', params.orderBy)
    if (params.fields) query.set('fields', params.fields)
    if (params.spaces) query.set('spaces', params.spaces)

    // Default fields if not specified
    if (!params.fields) {
      query.set(
        'fields',
        'nextPageToken,files(id,name,mimeType,description,starred,trashed,parents,webViewLink,webContentLink,createdTime,modifiedTime,size,owners,lastModifyingUser,shared,capabilities)'
      )
    }

    const url = `https://www.googleapis.com/drive/v3/files?${query}`
    return this.client.request<DriveFileList>(url)
  }

  /**
   * Get metadata for a specific file
   */
  async getFile(params: GetFileParams): Promise<Result<DriveFile>> {
    const query = new URLSearchParams()
    if (params.fields) {
      query.set('fields', params.fields)
    } else {
      query.set(
        'fields',
        'id,name,mimeType,description,starred,trashed,parents,webViewLink,webContentLink,createdTime,modifiedTime,size,owners,lastModifyingUser,shared,capabilities'
      )
    }

    const url = `https://www.googleapis.com/drive/v3/files/${params.fileId}?${query}`
    return this.client.request<DriveFile>(url)
  }

  /**
   * Download file content (for non-Google Workspace files)
   */
  async downloadFile(fileId: string): Promise<Result<ArrayBuffer>> {
    const tokenResult = await this.client.getAccessToken()
    if (!tokenResult.success) {
      return tokenResult
    }

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${tokenResult.data}` },
      })

      if (!response.ok) {
        const errorText = await response.text()
        return fail('DOWNLOAD_ERROR', `Failed to download file: ${errorText}`, response.status)
      }

      const data = await response.arrayBuffer()
      return ok(data)
    } catch (error) {
      if (error instanceof Error) {
        return fail('NETWORK_ERROR', error.message)
      }
      return fail('UNKNOWN_ERROR', String(error))
    }
  }

  /**
   * Export Google Workspace files (Docs, Sheets, etc.) to a specific format
   */
  async exportFile(
    fileId: string,
    mimeType: string
  ): Promise<Result<ArrayBuffer>> {
    const tokenResult = await this.client.getAccessToken()
    if (!tokenResult.success) {
      return tokenResult
    }

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(mimeType)}`

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${tokenResult.data}` },
      })

      if (!response.ok) {
        const errorText = await response.text()
        return fail('EXPORT_ERROR', `Failed to export file: ${errorText}`, response.status)
      }

      const data = await response.arrayBuffer()
      return ok(data)
    } catch (error) {
      if (error instanceof Error) {
        return fail('NETWORK_ERROR', error.message)
      }
      return fail('UNKNOWN_ERROR', String(error))
    }
  }

  /**
   * Search for files using query
   */
  async searchFiles(searchQuery: string, maxResults = 10): Promise<Result<DriveFileList>> {
    return this.listFiles({ q: searchQuery, maxResults })
  }
}

// ============================================================================
// Sheets Client
// ============================================================================

class SheetsClient {
  private client: GoogleClient

  constructor(client: GoogleClient) {
    this.client = client
  }

  /**
   * Get spreadsheet metadata and optionally sheet data
   */
  async getSpreadsheet(params: GetSpreadsheetParams): Promise<Result<Spreadsheet>> {
    const query = new URLSearchParams()
    if (params.ranges) {
      params.ranges.forEach((r) => query.append('ranges', r))
    }
    if (params.includeGridData) query.set('includeGridData', 'true')

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}?${query}`
    return this.client.request<Spreadsheet>(url)
  }

  /**
   * Read values from a range (e.g., "Sheet1!A1:D10")
   */
  async getValues(params: GetValuesParams): Promise<Result<ValueRange>> {
    const query = new URLSearchParams()
    if (params.majorDimension) query.set('majorDimension', params.majorDimension)
    if (params.valueRenderOption) query.set('valueRenderOption', params.valueRenderOption)
    if (params.dateTimeRenderOption) query.set('dateTimeRenderOption', params.dateTimeRenderOption)

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}/values/${encodeURIComponent(params.range)}?${query}`
    return this.client.request<ValueRange>(url)
  }

  /**
   * Write values to a range
   */
  async updateValues(params: UpdateValuesParams): Promise<Result<UpdateValuesResponse>> {
    const query = new URLSearchParams()
    query.set('valueInputOption', params.valueInputOption ?? 'USER_ENTERED')
    if (params.includeValuesInResponse) query.set('includeValuesInResponse', 'true')

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}/values/${encodeURIComponent(params.range)}?${query}`
    return this.client.request<UpdateValuesResponse>(url, {
      method: 'PUT',
      body: JSON.stringify({ values: params.values }),
    })
  }

  /**
   * Append values to a table (adds rows after existing data)
   */
  async appendValues(params: AppendValuesParams): Promise<Result<AppendValuesResponse>> {
    const query = new URLSearchParams()
    query.set('valueInputOption', params.valueInputOption ?? 'USER_ENTERED')
    if (params.insertDataOption) query.set('insertDataOption', params.insertDataOption)
    if (params.includeValuesInResponse) query.set('includeValuesInResponse', 'true')

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}/values/${encodeURIComponent(params.range)}:append?${query}`
    return this.client.request<AppendValuesResponse>(url, {
      method: 'POST',
      body: JSON.stringify({ values: params.values }),
    })
  }

  /**
   * Clear values from a range
   */
  async clearValues(params: ClearValuesParams): Promise<Result<ClearValuesResponse>> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}/values/${encodeURIComponent(params.range)}:clear`
    return this.client.request<ClearValuesResponse>(url, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  /**
   * Create a new spreadsheet
   */
  async createSpreadsheet(params: CreateSpreadsheetParams): Promise<Result<Spreadsheet>> {
    const body: Record<string, unknown> = {
      properties: { title: params.title },
    }
    if (params.sheets) body.sheets = params.sheets

    const url = 'https://sheets.googleapis.com/v4/spreadsheets'
    return this.client.request<Spreadsheet>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /**
   * Add a new sheet (tab) to a spreadsheet
   */
  async addSheet(params: AddSheetParams): Promise<Result<BatchUpdateSpreadsheetResponse>> {
    const request = {
      addSheet: {
        properties: {
          title: params.title,
          gridProperties: {
            rowCount: params.rowCount ?? 1000,
            columnCount: params.columnCount ?? 26,
          },
        },
      },
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}:batchUpdate`
    return this.client.request<BatchUpdateSpreadsheetResponse>(url, {
      method: 'POST',
      body: JSON.stringify({ requests: [request] }),
    })
  }

  /**
   * Delete a sheet (tab) from a spreadsheet
   */
  async deleteSheet(params: DeleteSheetParams): Promise<Result<BatchUpdateSpreadsheetResponse>> {
    const request = {
      deleteSheet: { sheetId: params.sheetId },
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}:batchUpdate`
    return this.client.request<BatchUpdateSpreadsheetResponse>(url, {
      method: 'POST',
      body: JSON.stringify({ requests: [request] }),
    })
  }

  /**
   * Copy a sheet to another spreadsheet
   */
  async copySheet(params: CopySheetParams): Promise<Result<SheetProperties>> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}/sheets/${params.sheetId}:copyTo`
    return this.client.request<SheetProperties>(url, {
      method: 'POST',
      body: JSON.stringify({ destinationSpreadsheetId: params.destinationSpreadsheetId }),
    })
  }

  /**
   * Batch update - multiple operations in one call
   */
  async batchUpdate(
    spreadsheetId: string,
    requests: unknown[]
  ): Promise<Result<BatchUpdateSpreadsheetResponse>> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`
    return this.client.request<BatchUpdateSpreadsheetResponse>(url, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    })
  }
}

// ============================================================================
// Tasks Client
// ============================================================================

class TasksClient {
  private client: GoogleClient

  constructor(client: GoogleClient) {
    this.client = client
  }

  /**
   * List all task lists
   */
  async listTaskLists(params: ListTaskListsParams = {}): Promise<Result<TaskListsResponse>> {
    const query = new URLSearchParams()
    if (params.maxResults) query.set('maxResults', String(params.maxResults))
    if (params.pageToken) query.set('pageToken', params.pageToken)

    const url = `https://tasks.googleapis.com/tasks/v1/users/@me/lists?${query}`
    return this.client.request<TaskListsResponse>(url)
  }

  /**
   * Get a specific task list
   */
  async getTaskList(taskListId: string): Promise<Result<TaskList>> {
    const url = `https://tasks.googleapis.com/tasks/v1/users/@me/lists/${taskListId}`
    return this.client.request<TaskList>(url)
  }

  /**
   * Create a new task list
   */
  async createTaskList(params: CreateTaskListParams): Promise<Result<TaskList>> {
    const url = 'https://tasks.googleapis.com/tasks/v1/users/@me/lists'
    return this.client.request<TaskList>(url, {
      method: 'POST',
      body: JSON.stringify({ title: params.title }),
    })
  }

  /**
   * Update a task list
   */
  async updateTaskList(params: UpdateTaskListParams): Promise<Result<TaskList>> {
    const url = `https://tasks.googleapis.com/tasks/v1/users/@me/lists/${params.taskListId}`
    return this.client.request<TaskList>(url, {
      method: 'PATCH',
      body: JSON.stringify({ title: params.title }),
    })
  }

  /**
   * Delete a task list
   */
  async deleteTaskList(taskListId: string): Promise<Result<void>> {
    const url = `https://tasks.googleapis.com/tasks/v1/users/@me/lists/${taskListId}`
    return this.client.request<void>(url, { method: 'DELETE' })
  }

  /**
   * List tasks in a task list
   */
  async listTasks(params: ListTasksParams): Promise<Result<TasksResponse>> {
    const query = new URLSearchParams()
    if (params.maxResults) query.set('maxResults', String(params.maxResults))
    if (params.pageToken) query.set('pageToken', params.pageToken)
    if (params.showCompleted !== undefined) query.set('showCompleted', String(params.showCompleted))
    if (params.showDeleted !== undefined) query.set('showDeleted', String(params.showDeleted))
    if (params.showHidden !== undefined) query.set('showHidden', String(params.showHidden))
    if (params.dueMin) query.set('dueMin', params.dueMin)
    if (params.dueMax) query.set('dueMax', params.dueMax)

    const url = `https://tasks.googleapis.com/tasks/v1/lists/${params.taskListId}/tasks?${query}`
    return this.client.request<TasksResponse>(url)
  }

  /**
   * Get a specific task
   */
  async getTask(taskListId: string, taskId: string): Promise<Result<Task>> {
    const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`
    return this.client.request<Task>(url)
  }

  /**
   * Create a new task
   */
  async createTask(params: CreateTaskParams): Promise<Result<Task>> {
    const query = new URLSearchParams()
    if (params.parent) query.set('parent', params.parent)
    if (params.previous) query.set('previous', params.previous)

    const body: Record<string, unknown> = { title: params.title }
    if (params.notes) body.notes = params.notes
    if (params.due) body.due = params.due
    if (params.status) body.status = params.status

    const url = `https://tasks.googleapis.com/tasks/v1/lists/${params.taskListId}/tasks?${query}`
    return this.client.request<Task>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /**
   * Update a task
   */
  async updateTask(params: UpdateTaskParams): Promise<Result<Task>> {
    const body: Record<string, unknown> = {}
    if (params.title !== undefined) body.title = params.title
    if (params.notes !== undefined) body.notes = params.notes
    if (params.due !== undefined) body.due = params.due
    if (params.status !== undefined) body.status = params.status

    const url = `https://tasks.googleapis.com/tasks/v1/lists/${params.taskListId}/tasks/${params.taskId}`
    return this.client.request<Task>(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  /**
   * Delete a task
   */
  async deleteTask(taskListId: string, taskId: string): Promise<Result<void>> {
    const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`
    return this.client.request<void>(url, { method: 'DELETE' })
  }

  /**
   * Move a task to a different position
   */
  async moveTask(params: MoveTaskParams): Promise<Result<Task>> {
    const query = new URLSearchParams()
    if (params.parent) query.set('parent', params.parent)
    if (params.previous) query.set('previous', params.previous)

    const url = `https://tasks.googleapis.com/tasks/v1/lists/${params.taskListId}/tasks/${params.taskId}/move?${query}`
    return this.client.request<Task>(url, { method: 'POST' })
  }

  /**
   * Complete a task (shorthand for updateTask with status=completed)
   */
  async completeTask(taskListId: string, taskId: string): Promise<Result<Task>> {
    return this.updateTask({
      taskListId,
      taskId,
      status: 'completed',
    })
  }
}

// ============================================================================
// Docs Client
// ============================================================================

class DocsClient {
  private client: GoogleClient

  constructor(client: GoogleClient) {
    this.client = client
  }

  /**
   * Get a document by ID
   */
  async getDocument(params: GetDocumentParams): Promise<Result<Document>> {
    const query = new URLSearchParams()
    if (params.suggestionsViewMode) {
      query.set('suggestionsViewMode', params.suggestionsViewMode)
    }

    const url = `https://docs.googleapis.com/v1/documents/${params.documentId}?${query}`
    return this.client.request<Document>(url)
  }

  /**
   * Create a new document
   */
  async createDocument(params: CreateDocumentParams): Promise<Result<Document>> {
    const url = 'https://docs.googleapis.com/v1/documents'
    return this.client.request<Document>(url, {
      method: 'POST',
      body: JSON.stringify({ title: params.title }),
    })
  }

  /**
   * Batch update a document (multiple operations)
   */
  async batchUpdate(
    documentId: string,
    requests: unknown[]
  ): Promise<Result<BatchUpdateDocumentResponse>> {
    const url = `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`
    return this.client.request<BatchUpdateDocumentResponse>(url, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    })
  }

  /**
   * Insert text at a specific location
   */
  async insertText(params: InsertTextParams): Promise<Result<BatchUpdateDocumentResponse>> {
    const request = {
      insertText: {
        location: {
          index: params.index,
          segmentId: params.segmentId,
        },
        text: params.text,
      },
    }
    return this.batchUpdate(params.documentId, [request])
  }

  /**
   * Delete content in a range
   */
  async deleteContent(params: DeleteContentParams): Promise<Result<BatchUpdateDocumentResponse>> {
    const request = {
      deleteContentRange: {
        range: {
          startIndex: params.startIndex,
          endIndex: params.endIndex,
          segmentId: params.segmentId,
        },
      },
    }
    return this.batchUpdate(params.documentId, [request])
  }

  /**
   * Replace all occurrences of text
   */
  async replaceText(params: ReplaceTextParams): Promise<Result<BatchUpdateDocumentResponse>> {
    const request = {
      replaceAllText: {
        containsText: {
          text: params.findText,
          matchCase: params.matchCase ?? false,
        },
        replaceText: params.replaceText,
      },
    }
    return this.batchUpdate(params.documentId, [request])
  }

  /**
   * Insert an image at a specific location
   */
  async insertImage(params: InsertImageParams): Promise<Result<BatchUpdateDocumentResponse>> {
    const request: Record<string, unknown> = {
      insertInlineImage: {
        location: { index: params.index },
        uri: params.imageUri,
      },
    }

    // Add size if specified
    if (params.width || params.height) {
      (request.insertInlineImage as Record<string, unknown>).objectSize = {
        ...(params.width && { width: { magnitude: params.width, unit: 'PT' } }),
        ...(params.height && { height: { magnitude: params.height, unit: 'PT' } }),
      }
    }

    return this.batchUpdate(params.documentId, [request])
  }

  /**
   * Insert a table at a specific location
   */
  async insertTable(params: InsertTableParams): Promise<Result<BatchUpdateDocumentResponse>> {
    const request = {
      insertTable: {
        location: { index: params.index },
        rows: params.rows,
        columns: params.columns,
      },
    }
    return this.batchUpdate(params.documentId, [request])
  }

  /**
   * Get plain text content from a document
   */
  async getPlainText(documentId: string): Promise<Result<string>> {
    const docResult = await this.getDocument({ documentId })
    if (!docResult.success) return docResult

    // Extract plain text from the document body
    let text = ''
    const content = docResult.data.body?.content ?? []
    for (const element of content) {
      if (element.paragraph) {
        for (const paragraphElement of element.paragraph.elements) {
          if (paragraphElement.textRun?.content) {
            text += paragraphElement.textRun.content
          }
        }
      }
    }

    return ok(text)
  }
}

// ============================================================================
// Slides Client
// ============================================================================

class SlidesClient {
  private client: GoogleClient

  constructor(client: GoogleClient) {
    this.client = client
  }

  /**
   * Get a presentation by ID
   */
  async getPresentation(params: GetPresentationParams): Promise<Result<Presentation>> {
    const url = `https://slides.googleapis.com/v1/presentations/${params.presentationId}`
    return this.client.request<Presentation>(url)
  }

  /**
   * Create a new presentation
   */
  async createPresentation(params: CreatePresentationParams): Promise<Result<Presentation>> {
    const url = 'https://slides.googleapis.com/v1/presentations'
    return this.client.request<Presentation>(url, {
      method: 'POST',
      body: JSON.stringify({ title: params.title }),
    })
  }

  /**
   * Batch update a presentation (multiple operations)
   */
  async batchUpdate(
    presentationId: string,
    requests: unknown[]
  ): Promise<Result<BatchUpdatePresentationResponse>> {
    const url = `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`
    return this.client.request<BatchUpdatePresentationResponse>(url, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    })
  }

  /**
   * Create a new slide
   */
  async createSlide(params: CreateSlideParams): Promise<Result<BatchUpdatePresentationResponse>> {
    const request: Record<string, unknown> = {
      createSlide: {
        insertionIndex: params.insertionIndex,
      },
    }

    // Add layout if specified
    if (params.layout) {
      (request.createSlide as Record<string, unknown>).slideLayoutReference = {
        predefinedLayout: params.layout,
      }
    }

    return this.batchUpdate(params.presentationId, [request])
  }

  /**
   * Delete a slide
   */
  async deleteSlide(params: DeleteSlideParams): Promise<Result<BatchUpdatePresentationResponse>> {
    const request = {
      deleteObject: {
        objectId: params.slideObjectId,
      },
    }
    return this.batchUpdate(params.presentationId, [request])
  }

  /**
   * Duplicate a slide
   */
  async duplicateSlide(params: DuplicateSlideParams): Promise<Result<BatchUpdatePresentationResponse>> {
    const request = {
      duplicateObject: {
        objectId: params.slideObjectId,
      },
    }
    return this.batchUpdate(params.presentationId, [request])
  }

  /**
   * Insert text into a shape
   */
  async insertText(params: InsertSlideTextParams): Promise<Result<BatchUpdatePresentationResponse>> {
    const request: Record<string, unknown> = {
      insertText: {
        objectId: params.shapeObjectId,
        text: params.text,
      },
    }

    if (params.insertionIndex !== undefined) {
      (request.insertText as Record<string, unknown>).insertionIndex = params.insertionIndex
    }

    return this.batchUpdate(params.presentationId, [request])
  }

  /**
   * Replace all occurrences of text in the presentation
   */
  async replaceText(params: ReplaceSlideTextParams): Promise<Result<BatchUpdatePresentationResponse>> {
    const request: Record<string, unknown> = {
      replaceAllText: {
        containsText: {
          text: params.findText,
          matchCase: params.matchCase ?? false,
        },
        replaceText: params.replaceText,
      },
    }

    if (params.slideObjectIds) {
      (request.replaceAllText as Record<string, unknown>).pageObjectIds = params.slideObjectIds
    }

    return this.batchUpdate(params.presentationId, [request])
  }

  /**
   * Insert an image into a slide
   */
  async insertImage(params: InsertSlideImageParams): Promise<Result<BatchUpdatePresentationResponse>> {
    const request = {
      createImage: {
        url: params.imageUrl,
        elementProperties: {
          pageObjectId: params.slideObjectId,
          size: {
            width: { magnitude: params.width ?? 300, unit: 'PT' },
            height: { magnitude: params.height ?? 200, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: params.translateX ?? 100,
            translateY: params.translateY ?? 100,
            unit: 'PT',
          },
        },
      },
    }
    return this.batchUpdate(params.presentationId, [request])
  }

  /**
   * Get slide count
   */
  async getSlideCount(presentationId: string): Promise<Result<number>> {
    const result = await this.getPresentation({ presentationId })
    if (!result.success) return result
    return ok(result.data.slides?.length ?? 0)
  }
}

// ============================================================================
// Forms Sub-Client
// ============================================================================

class FormsClient {
  private client: GoogleClient

  constructor(client: GoogleClient) {
    this.client = client
  }

  /**
   * Get a form by ID
   */
  async getForm(params: GetFormParams): Promise<Result<Form>> {
    const url = `https://forms.googleapis.com/v1/forms/${params.formId}`
    return this.client.request<Form>(url)
  }

  /**
   * Create a new form
   */
  async createForm(params: CreateFormParams): Promise<Result<Form>> {
    const url = 'https://forms.googleapis.com/v1/forms'
    const body: Record<string, unknown> = {
      info: {
        title: params.title,
      },
    }
    if (params.documentTitle) {
      body.info = { ...body.info as object, documentTitle: params.documentTitle }
    }
    return this.client.request<Form>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /**
   * Batch update a form (add/modify questions, etc.)
   */
  async batchUpdate(
    formId: string,
    requests: unknown[]
  ): Promise<Result<BatchUpdateFormResponse>> {
    const url = `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`
    return this.client.request<BatchUpdateFormResponse>(url, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    })
  }

  /**
   * List form responses
   */
  async listResponses(params: ListFormResponsesParams): Promise<Result<ListFormResponsesResponse>> {
    const queryParams = new URLSearchParams()
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    if (params.pageToken) queryParams.append('pageToken', params.pageToken)
    if (params.filter) queryParams.append('filter', params.filter)

    const query = queryParams.toString()
    const url = `https://forms.googleapis.com/v1/forms/${params.formId}/responses${query ? `?${query}` : ''}`
    return this.client.request<ListFormResponsesResponse>(url)
  }

  /**
   * Get a single form response
   */
  async getResponse(params: GetFormResponseParams): Promise<Result<FormResponse>> {
    const url = `https://forms.googleapis.com/v1/forms/${params.formId}/responses/${params.responseId}`
    return this.client.request<FormResponse>(url)
  }

  /**
   * Create a watch to receive notifications for new responses
   */
  async createWatch(params: CreateWatchParams): Promise<Result<Watch>> {
    const url = `https://forms.googleapis.com/v1/forms/${params.formId}/watches`
    return this.client.request<Watch>(url, {
      method: 'POST',
      body: JSON.stringify({
        watch: {
          target: {
            topic: {
              topicName: params.topicName,
            },
          },
          eventType: params.eventType,
        },
      }),
    })
  }

  /**
   * Delete a watch
   */
  async deleteWatch(params: DeleteWatchParams): Promise<Result<void>> {
    const url = `https://forms.googleapis.com/v1/forms/${params.formId}/watches/${params.watchId}`
    return this.client.request<void>(url, {
      method: 'DELETE',
    })
  }
}

// ============================================================================
// Meet Sub-Client
// ============================================================================

class MeetClient {
  private client: GoogleClient

  constructor(client: GoogleClient) {
    this.client = client
  }

  /**
   * Create a new meeting space
   */
  async createSpace(params?: CreateMeetSpaceParams): Promise<Result<MeetSpace>> {
    const url = 'https://meet.googleapis.com/v2/spaces'
    const body: Record<string, unknown> = {}
    if (params?.accessType) {
      body.config = { accessType: params.accessType }
    }
    return this.client.request<MeetSpace>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /**
   * Get a meeting space by name or meeting code
   */
  async getSpace(params: GetMeetSpaceParams): Promise<Result<MeetSpace>> {
    // Handle both space names (spaces/xxx) and meeting codes
    const spaceName = params.spaceName.startsWith('spaces/')
      ? params.spaceName
      : `spaces/${params.spaceName}`
    const url = `https://meet.googleapis.com/v2/${spaceName}`
    return this.client.request<MeetSpace>(url)
  }

  /**
   * End an active conference in a space
   */
  async endActiveConference(params: EndActiveConferenceParams): Promise<Result<void>> {
    const spaceName = params.spaceName.startsWith('spaces/')
      ? params.spaceName
      : `spaces/${params.spaceName}`
    const url = `https://meet.googleapis.com/v2/${spaceName}:endActiveConference`
    return this.client.request<void>(url, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  /**
   * List conference records (past meetings)
   */
  async listConferenceRecords(
    params?: ListConferenceRecordsParams
  ): Promise<Result<ListConferenceRecordsResponse>> {
    const queryParams = new URLSearchParams()
    if (params?.filter) queryParams.append('filter', params.filter)
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    if (params?.pageToken) queryParams.append('pageToken', params.pageToken)

    const query = queryParams.toString()
    const url = `https://meet.googleapis.com/v2/conferenceRecords${query ? `?${query}` : ''}`
    return this.client.request<ListConferenceRecordsResponse>(url)
  }

  /**
   * Get a specific conference record
   */
  async getConferenceRecord(conferenceRecordName: string): Promise<Result<ConferenceRecord>> {
    const name = conferenceRecordName.startsWith('conferenceRecords/')
      ? conferenceRecordName
      : `conferenceRecords/${conferenceRecordName}`
    const url = `https://meet.googleapis.com/v2/${name}`
    return this.client.request<ConferenceRecord>(url)
  }

  /**
   * List recordings for a conference
   */
  async listRecordings(params: ListRecordingsParams): Promise<Result<ListRecordingsResponse>> {
    const name = params.conferenceRecordName.startsWith('conferenceRecords/')
      ? params.conferenceRecordName
      : `conferenceRecords/${params.conferenceRecordName}`

    const queryParams = new URLSearchParams()
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    if (params.pageToken) queryParams.append('pageToken', params.pageToken)

    const query = queryParams.toString()
    const url = `https://meet.googleapis.com/v2/${name}/recordings${query ? `?${query}` : ''}`
    return this.client.request<ListRecordingsResponse>(url)
  }

  /**
   * List transcripts for a conference
   */
  async listTranscripts(params: ListTranscriptsParams): Promise<Result<ListTranscriptsResponse>> {
    const name = params.conferenceRecordName.startsWith('conferenceRecords/')
      ? params.conferenceRecordName
      : `conferenceRecords/${params.conferenceRecordName}`

    const queryParams = new URLSearchParams()
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    if (params.pageToken) queryParams.append('pageToken', params.pageToken)

    const query = queryParams.toString()
    const url = `https://meet.googleapis.com/v2/${name}/transcripts${query ? `?${query}` : ''}`
    return this.client.request<ListTranscriptsResponse>(url)
  }
}
