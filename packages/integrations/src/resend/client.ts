/**
 * Resend API Client
 *
 * Runtime-agnostic client for Resend Email API.
 * Works in Node.js, Edge runtimes, and Cloudflare Workers.
 *
 * @example
 * import { ResendClient } from '@trendingsociety/integrations/resend'
 *
 * const resend = new ResendClient({
 *   apiKey: process.env.RESEND_API_KEY,
 *   defaultFrom: 'Acme <hello@acme.com>',
 * })
 *
 * // Send email
 * await resend.sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Hello!',
 *   html: '<p>Welcome to our platform!</p>',
 * })
 */

import { ok, fail, type Result, type ClientConfig } from '../types.js'
import type {
  ResendConfig,
  SendEmailParams,
  SendEmailResponse,
  Email,
  BatchSendParams,
  BatchSendResponse,
  ListEmailsParams,
  ListEmailsResponse,
  UpdateEmailParams,
  Domain,
  CreateDomainParams,
  ListDomainsResponse,
  VerifyDomainResponse,
  UpdateDomainParams,
  CreateApiKeyParams,
  CreateApiKeyResponse,
  ListApiKeysResponse,
  Audience,
  CreateAudienceParams,
  ListAudiencesResponse,
  Contact,
  CreateContactParams,
  UpdateContactParams,
  ListContactsParams,
  ListContactsResponse,
  Broadcast,
  CreateBroadcastParams,
  SendBroadcastParams,
  ListBroadcastsResponse,
} from './types.js'

// ============================================================================
// Configuration
// ============================================================================

const RESEND_API_BASE = 'https://api.resend.com'

export interface ResendClientConfig extends ClientConfig, ResendConfig {}

// ============================================================================
// Client Implementation
// ============================================================================

export class ResendClient {
  private apiKey: string
  private defaultFrom?: string
  private timeout: number
  private fetchFn: typeof fetch
  private debug: boolean

  constructor(config: ResendClientConfig) {
    if (!config.apiKey) {
      throw new Error('ResendClient requires apiKey')
    }

    this.apiKey = config.apiKey
    this.defaultFrom = config.defaultFrom
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
    body?: Record<string, unknown>
  ): Promise<Result<T>> {
    const url = `${RESEND_API_BASE}${path}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const headers: Record<string, string> = {
        Authorization: this.getAuthHeader(),
      }

      let requestBody: string | undefined
      if (body && (method === 'POST' || method === 'PATCH')) {
        headers['Content-Type'] = 'application/json'
        requestBody = JSON.stringify(body)
      }

      if (this.debug) {
        console.log(`[ResendClient] ${method} ${url}`)
        if (requestBody) {
          console.log(`[ResendClient] Body: ${requestBody}`)
        }
      }

      const response = await this.fetchFn(url, {
        method,
        headers,
        body: requestBody,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle 204 No Content (for DELETE)
      if (response.status === 204) {
        return ok({} as T)
      }

      const json = (await response.json()) as T & {
        statusCode?: number
        message?: string
        name?: string
      }

      if (!response.ok) {
        return fail(
          json.name ?? 'API_ERROR',
          json.message ?? `Resend API error (${response.status})`,
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
  // Emails
  // --------------------------------------------------------------------------

  /**
   * Send an email
   */
  async sendEmail(params: SendEmailParams): Promise<Result<SendEmailResponse>> {
    const from = params.from ?? this.defaultFrom

    if (!from) {
      return fail('INVALID_PARAMS', '"from" is required')
    }

    const body: Record<string, unknown> = {
      from,
      to: params.to,
      subject: params.subject,
    }

    if (params.cc) body.cc = params.cc
    if (params.bcc) body.bcc = params.bcc
    if (params.replyTo) body.reply_to = params.replyTo
    if (params.html) body.html = params.html
    if (params.text) body.text = params.text
    if (params.react) body.react = params.react
    if (params.headers) body.headers = params.headers
    if (params.attachments) body.attachments = params.attachments
    if (params.tags) body.tags = params.tags
    if (params.scheduledAt) body.scheduled_at = params.scheduledAt

    return this.request<SendEmailResponse>('POST', '/emails', body)
  }

  /**
   * Send batch emails
   */
  async batchSend(params: BatchSendParams): Promise<Result<BatchSendResponse>> {
    const emails = params.emails.map((email) => ({
      ...email,
      from: email.from ?? this.defaultFrom,
    }))

    // Validate all emails have from
    const missingFrom = emails.find((e) => !e.from)
    if (missingFrom) {
      return fail('INVALID_PARAMS', 'All emails require a "from" address')
    }

    return this.request<BatchSendResponse>('POST', '/emails/batch', emails as unknown as Record<string, unknown>)
  }

  /**
   * Get an email by ID
   */
  async getEmail(emailId: string): Promise<Result<Email>> {
    return this.request<Email>('GET', `/emails/${emailId}`)
  }

  /**
   * List emails
   */
  async listEmails(params?: ListEmailsParams): Promise<Result<ListEmailsResponse>> {
    let path = '/emails'

    if (params?.limit) {
      path += `?limit=${params.limit}`
    }

    return this.request<ListEmailsResponse>('GET', path)
  }

  /**
   * Update (reschedule) an email
   */
  async updateEmail(params: UpdateEmailParams): Promise<Result<Email>> {
    return this.request<Email>('PATCH', `/emails/${params.id}`, {
      scheduled_at: params.scheduledAt,
    })
  }

  /**
   * Cancel a scheduled email
   */
  async cancelEmail(emailId: string): Promise<Result<{ canceled: boolean }>> {
    const result = await this.request<{ object: string; id: string }>(
      'POST',
      `/emails/${emailId}/cancel`
    )
    if (!result.success) return result as Result<never>
    return ok({ canceled: true })
  }

  // --------------------------------------------------------------------------
  // Domains
  // --------------------------------------------------------------------------

  /**
   * Create a domain
   */
  async createDomain(params: CreateDomainParams): Promise<Result<Domain>> {
    return this.request<Domain>('POST', '/domains', params as unknown as Record<string, unknown>)
  }

  /**
   * Get a domain by ID
   */
  async getDomain(domainId: string): Promise<Result<Domain>> {
    return this.request<Domain>('GET', `/domains/${domainId}`)
  }

  /**
   * List domains
   */
  async listDomains(): Promise<Result<ListDomainsResponse>> {
    return this.request<ListDomainsResponse>('GET', '/domains')
  }

  /**
   * Verify a domain
   */
  async verifyDomain(domainId: string): Promise<Result<VerifyDomainResponse>> {
    return this.request<VerifyDomainResponse>('POST', `/domains/${domainId}/verify`)
  }

  /**
   * Update a domain
   */
  async updateDomain(params: UpdateDomainParams): Promise<Result<Domain>> {
    const { id, ...body } = params
    return this.request<Domain>('PATCH', `/domains/${id}`, body as Record<string, unknown>)
  }

  /**
   * Delete a domain
   */
  async deleteDomain(domainId: string): Promise<Result<{ deleted: boolean }>> {
    const result = await this.request<{ deleted: boolean }>('DELETE', `/domains/${domainId}`)
    if (!result.success) return result
    return ok({ deleted: true })
  }

  // --------------------------------------------------------------------------
  // API Keys
  // --------------------------------------------------------------------------

  /**
   * Create an API key
   */
  async createApiKey(params: CreateApiKeyParams): Promise<Result<CreateApiKeyResponse>> {
    return this.request<CreateApiKeyResponse>('POST', '/api-keys', params as unknown as Record<string, unknown>)
  }

  /**
   * List API keys
   */
  async listApiKeys(): Promise<Result<ListApiKeysResponse>> {
    return this.request<ListApiKeysResponse>('GET', '/api-keys')
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(apiKeyId: string): Promise<Result<{ deleted: boolean }>> {
    const result = await this.request<void>('DELETE', `/api-keys/${apiKeyId}`)
    if (!result.success) return result as Result<never>
    return ok({ deleted: true })
  }

  // --------------------------------------------------------------------------
  // Audiences
  // --------------------------------------------------------------------------

  /**
   * Create an audience
   */
  async createAudience(params: CreateAudienceParams): Promise<Result<Audience>> {
    return this.request<Audience>('POST', '/audiences', params as unknown as Record<string, unknown>)
  }

  /**
   * Get an audience by ID
   */
  async getAudience(audienceId: string): Promise<Result<Audience>> {
    return this.request<Audience>('GET', `/audiences/${audienceId}`)
  }

  /**
   * List audiences
   */
  async listAudiences(): Promise<Result<ListAudiencesResponse>> {
    return this.request<ListAudiencesResponse>('GET', '/audiences')
  }

  /**
   * Delete an audience
   */
  async deleteAudience(audienceId: string): Promise<Result<{ deleted: boolean }>> {
    const result = await this.request<void>('DELETE', `/audiences/${audienceId}`)
    if (!result.success) return result as Result<never>
    return ok({ deleted: true })
  }

  // --------------------------------------------------------------------------
  // Contacts
  // --------------------------------------------------------------------------

  /**
   * Create a contact
   */
  async createContact(params: CreateContactParams): Promise<Result<Contact>> {
    const { audienceId, ...body } = params
    return this.request<Contact>('POST', `/audiences/${audienceId}/contacts`, body as Record<string, unknown>)
  }

  /**
   * Get a contact by ID
   */
  async getContact(audienceId: string, contactId: string): Promise<Result<Contact>> {
    return this.request<Contact>('GET', `/audiences/${audienceId}/contacts/${contactId}`)
  }

  /**
   * List contacts in an audience
   */
  async listContacts(params: ListContactsParams): Promise<Result<ListContactsResponse>> {
    return this.request<ListContactsResponse>('GET', `/audiences/${params.audienceId}/contacts`)
  }

  /**
   * Update a contact
   */
  async updateContact(params: UpdateContactParams): Promise<Result<Contact>> {
    const { audienceId, id, ...body } = params
    return this.request<Contact>('PATCH', `/audiences/${audienceId}/contacts/${id}`, body as Record<string, unknown>)
  }

  /**
   * Delete a contact
   */
  async deleteContact(audienceId: string, contactId: string): Promise<Result<{ deleted: boolean }>> {
    const result = await this.request<void>('DELETE', `/audiences/${audienceId}/contacts/${contactId}`)
    if (!result.success) return result as Result<never>
    return ok({ deleted: true })
  }

  // --------------------------------------------------------------------------
  // Broadcasts
  // --------------------------------------------------------------------------

  /**
   * Create a broadcast
   */
  async createBroadcast(params: CreateBroadcastParams): Promise<Result<Broadcast>> {
    const body: Record<string, unknown> = {
      audience_id: params.audienceId,
      from: params.from,
      subject: params.subject,
    }

    if (params.replyTo) body.reply_to = params.replyTo
    if (params.html) body.html = params.html
    if (params.text) body.text = params.text
    if (params.name) body.name = params.name

    return this.request<Broadcast>('POST', '/broadcasts', body)
  }

  /**
   * Get a broadcast by ID
   */
  async getBroadcast(broadcastId: string): Promise<Result<Broadcast>> {
    return this.request<Broadcast>('GET', `/broadcasts/${broadcastId}`)
  }

  /**
   * List broadcasts
   */
  async listBroadcasts(): Promise<Result<ListBroadcastsResponse>> {
    return this.request<ListBroadcastsResponse>('GET', '/broadcasts')
  }

  /**
   * Send a broadcast
   */
  async sendBroadcast(params: SendBroadcastParams): Promise<Result<Broadcast>> {
    const body: Record<string, unknown> = {}
    if (params.scheduledAt) body.scheduled_at = params.scheduledAt

    return this.request<Broadcast>('POST', `/broadcasts/${params.broadcastId}/send`, body)
  }

  /**
   * Delete a broadcast
   */
  async deleteBroadcast(broadcastId: string): Promise<Result<{ deleted: boolean }>> {
    const result = await this.request<void>('DELETE', `/broadcasts/${broadcastId}`)
    if (!result.success) return result as Result<never>
    return ok({ deleted: true })
  }
}
