/**
 * Twilio API Client
 *
 * Runtime-agnostic client for Twilio SMS and Voice APIs.
 * Works in Node.js, Edge runtimes, and Cloudflare Workers.
 *
 * @example
 * import { TwilioClient } from '@trendingsociety/integrations/twilio'
 *
 * const twilio = new TwilioClient({
 *   accountSid: process.env.TWILIO_ACCOUNT_SID,
 *   authToken: process.env.TWILIO_AUTH_TOKEN,
 *   defaultFrom: '+15551234567',
 * })
 *
 * // Send SMS
 * await twilio.sendMessage({
 *   to: '+15559876543',
 *   body: 'Hello from Jarvis!',
 * })
 *
 * // Make call
 * await twilio.makeCall({
 *   to: '+15559876543',
 *   from: '+15551234567',
 *   twiml: '<Response><Say>Hello from Jarvis!</Say></Response>',
 * })
 */

import { ok, fail, type Result, type ClientConfig } from '../types.js'
import type {
  TwilioConfig,
  SendMessageParams,
  Message,
  MessageList,
  ListMessagesParams,
  MakeCallParams,
  Call,
  CallList,
  ListCallsParams,
  UpdateCallParams,
  Recording,
  RecordingList,
  ListRecordingsParams,
  Account,
} from './types.js'

// ============================================================================
// Configuration
// ============================================================================

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01'

export interface TwilioClientConfig extends ClientConfig, TwilioConfig {}

// ============================================================================
// Client Implementation
// ============================================================================

export class TwilioClient {
  private accountSid: string
  private authToken: string
  private defaultFrom?: string
  private messagingServiceSid?: string
  private timeout: number
  private fetchFn: typeof fetch
  private debug: boolean

  constructor(config: TwilioClientConfig) {
    if (!config.accountSid) {
      throw new Error('TwilioClient requires accountSid')
    }
    if (!config.authToken) {
      throw new Error('TwilioClient requires authToken')
    }

    this.accountSid = config.accountSid
    this.authToken = config.authToken
    this.defaultFrom = config.defaultFrom
    this.messagingServiceSid = config.messagingServiceSid
    this.timeout = config.timeout ?? 30000
    this.fetchFn = config.fetch ?? fetch.bind(globalThis)
    this.debug = config.debug ?? false
  }

  // --------------------------------------------------------------------------
  // HTTP Helpers
  // --------------------------------------------------------------------------

  private getAuthHeader(): string {
    const credentials = btoa(`${this.accountSid}:${this.authToken}`)
    return `Basic ${credentials}`
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: Record<string, unknown>
  ): Promise<Result<T>> {
    const url = `${TWILIO_API_BASE}/Accounts/${this.accountSid}${path}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const headers: Record<string, string> = {
        Authorization: this.getAuthHeader(),
      }

      let requestBody: string | undefined
      if (body && method === 'POST') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded'
        // Convert to URL-encoded form data
        requestBody = this.toFormData(body)
      }

      if (this.debug) {
        console.log(`[TwilioClient] ${method} ${url}`)
        if (requestBody) {
          console.log(`[TwilioClient] Body: ${requestBody}`)
        }
      }

      const response = await this.fetchFn(url, {
        method,
        headers,
        body: requestBody,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const json = (await response.json()) as T & { code?: number; message?: string; more_info?: string }

      if (!response.ok) {
        return fail(
          String(json.code ?? 'API_ERROR'),
          json.message ?? `Twilio API error (${response.status})`,
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

  private toFormData(obj: Record<string, unknown>): string {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue

      // Convert camelCase to PascalCase for Twilio API
      const apiKey = this.toPascalCase(key)

      if (Array.isArray(value)) {
        // Handle arrays (e.g., MediaUrl, StatusCallbackEvent)
        for (const item of value) {
          params.append(apiKey, String(item))
        }
      } else if (typeof value === 'boolean') {
        params.append(apiKey, value ? 'true' : 'false')
      } else {
        params.append(apiKey, String(value))
      }
    }
    return params.toString()
  }

  private toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  // --------------------------------------------------------------------------
  // SMS/MMS Messages
  // --------------------------------------------------------------------------

  /**
   * Send an SMS or MMS message
   */
  async sendMessage(params: SendMessageParams): Promise<Result<Message>> {
    const from = params.from ?? this.defaultFrom
    const messagingServiceSid = params.messagingServiceSid ?? this.messagingServiceSid

    if (!from && !messagingServiceSid) {
      return fail('INVALID_PARAMS', 'Either "from" or "messagingServiceSid" is required')
    }

    if (!params.body && !params.mediaUrl && !params.contentSid) {
      return fail('INVALID_PARAMS', 'Message requires body, mediaUrl, or contentSid')
    }

    const body: Record<string, unknown> = {
      to: params.to,
    }

    if (from) body.from = from
    if (messagingServiceSid) body.messagingServiceSid = messagingServiceSid
    if (params.body) body.body = params.body
    if (params.mediaUrl) body.mediaUrl = params.mediaUrl
    if (params.contentSid) body.contentSid = params.contentSid
    if (params.statusCallback) body.statusCallback = params.statusCallback

    return this.request<Message>('POST', '/Messages.json', body)
  }

  /**
   * Get a message by SID
   */
  async getMessage(messageSid: string): Promise<Result<Message>> {
    return this.request<Message>('GET', `/Messages/${messageSid}.json`)
  }

  /**
   * List messages with optional filters
   */
  async listMessages(params?: ListMessagesParams): Promise<Result<MessageList>> {
    let path = '/Messages.json'

    if (params) {
      const queryParams = new URLSearchParams()
      if (params.to) queryParams.set('To', params.to)
      if (params.from) queryParams.set('From', params.from)
      if (params.dateSentAfter) queryParams.set('DateSent>', params.dateSentAfter)
      if (params.dateSentBefore) queryParams.set('DateSent<', params.dateSentBefore)
      if (params.pageSize) queryParams.set('PageSize', String(params.pageSize))

      const query = queryParams.toString()
      if (query) path += `?${query}`
    }

    return this.request<MessageList>('GET', path)
  }

  /**
   * Delete a message by SID
   */
  async deleteMessage(messageSid: string): Promise<Result<{ deleted: boolean }>> {
    const result = await this.request<void>('DELETE', `/Messages/${messageSid}.json`)
    if (!result.success) return result as Result<never>
    return ok({ deleted: true })
  }

  /**
   * Update/redact a message (only body can be updated to empty string for redaction)
   */
  async updateMessage(messageSid: string, body: string): Promise<Result<Message>> {
    return this.request<Message>('POST', `/Messages/${messageSid}.json`, { body })
  }

  // --------------------------------------------------------------------------
  // Voice Calls
  // --------------------------------------------------------------------------

  /**
   * Make an outbound call
   */
  async makeCall(params: MakeCallParams): Promise<Result<Call>> {
    if (!params.url && !params.twiml) {
      return fail('INVALID_PARAMS', 'Either "url" or "twiml" is required for call handling')
    }

    const body: Record<string, unknown> = {
      to: params.to,
      from: params.from,
    }

    if (params.url) body.url = params.url
    if (params.twiml) body.twiml = params.twiml
    if (params.method) body.method = params.method
    if (params.statusCallback) body.statusCallback = params.statusCallback
    if (params.statusCallbackEvent) body.statusCallbackEvent = params.statusCallbackEvent
    if (params.statusCallbackMethod) body.statusCallbackMethod = params.statusCallbackMethod
    if (params.record !== undefined) body.record = params.record
    if (params.recordingChannels) body.recordingChannels = params.recordingChannels
    if (params.timeout) body.timeout = params.timeout
    if (params.machineDetection) body.machineDetection = params.machineDetection
    if (params.callerName) body.callerName = params.callerName

    return this.request<Call>('POST', '/Calls.json', body)
  }

  /**
   * Get a call by SID
   */
  async getCall(callSid: string): Promise<Result<Call>> {
    return this.request<Call>('GET', `/Calls/${callSid}.json`)
  }

  /**
   * List calls with optional filters
   */
  async listCalls(params?: ListCallsParams): Promise<Result<CallList>> {
    let path = '/Calls.json'

    if (params) {
      const queryParams = new URLSearchParams()
      if (params.to) queryParams.set('To', params.to)
      if (params.from) queryParams.set('From', params.from)
      if (params.status) queryParams.set('Status', params.status)
      if (params.startTimeAfter) queryParams.set('StartTime>', params.startTimeAfter)
      if (params.startTimeBefore) queryParams.set('StartTime<', params.startTimeBefore)
      if (params.parentCallSid) queryParams.set('ParentCallSid', params.parentCallSid)
      if (params.pageSize) queryParams.set('PageSize', String(params.pageSize))

      const query = queryParams.toString()
      if (query) path += `?${query}`
    }

    return this.request<CallList>('GET', path)
  }

  /**
   * Update a call in progress
   */
  async updateCall(callSid: string, params: UpdateCallParams): Promise<Result<Call>> {
    const body: Record<string, unknown> = {}

    if (params.status) body.status = params.status
    if (params.url) body.url = params.url
    if (params.twiml) body.twiml = params.twiml
    if (params.method) body.method = params.method
    if (params.statusCallback) body.statusCallback = params.statusCallback
    if (params.statusCallbackMethod) body.statusCallbackMethod = params.statusCallbackMethod

    return this.request<Call>('POST', `/Calls/${callSid}.json`, body)
  }

  // --------------------------------------------------------------------------
  // Recordings
  // --------------------------------------------------------------------------

  /**
   * List recordings with optional filters
   */
  async listRecordings(params?: ListRecordingsParams): Promise<Result<RecordingList>> {
    let path = '/Recordings.json'

    if (params) {
      const queryParams = new URLSearchParams()
      if (params.callSid) queryParams.set('CallSid', params.callSid)
      if (params.dateCreatedAfter) queryParams.set('DateCreated>', params.dateCreatedAfter)
      if (params.dateCreatedBefore) queryParams.set('DateCreated<', params.dateCreatedBefore)
      if (params.pageSize) queryParams.set('PageSize', String(params.pageSize))

      const query = queryParams.toString()
      if (query) path += `?${query}`
    }

    return this.request<RecordingList>('GET', path)
  }

  /**
   * Get a recording by SID
   */
  async getRecording(recordingSid: string): Promise<Result<Recording>> {
    return this.request<Recording>('GET', `/Recordings/${recordingSid}.json`)
  }

  /**
   * Delete a recording by SID
   */
  async deleteRecording(recordingSid: string): Promise<Result<{ deleted: boolean }>> {
    const result = await this.request<void>('DELETE', `/Recordings/${recordingSid}.json`)
    if (!result.success) return result as Result<never>
    return ok({ deleted: true })
  }

  // --------------------------------------------------------------------------
  // Account
  // --------------------------------------------------------------------------

  /**
   * Get account details
   */
  async getAccount(): Promise<Result<Account>> {
    return this.request<Account>('GET', '.json')
  }
}
