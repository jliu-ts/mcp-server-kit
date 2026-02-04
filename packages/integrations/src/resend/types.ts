/**
 * Resend API Types
 *
 * Type definitions for Resend Email API.
 * Based on Resend REST API v1.
 */

// ============================================================================
// Configuration
// ============================================================================

export interface ResendConfig {
  /** Resend API key */
  apiKey: string
  /** Default from email address */
  defaultFrom?: string
}

// ============================================================================
// Email Types
// ============================================================================

export interface SendEmailParams {
  /** Sender email address (e.g., "Acme <onboarding@acme.com>") */
  from?: string
  /** Recipient email address or array of addresses */
  to: string | string[]
  /** Email subject line */
  subject: string
  /** CC recipients */
  cc?: string | string[]
  /** BCC recipients */
  bcc?: string | string[]
  /** Reply-to address */
  replyTo?: string | string[]
  /** HTML email body */
  html?: string
  /** Plain text email body */
  text?: string
  /** React component for email body (serialized) */
  react?: string
  /** Custom headers */
  headers?: Record<string, string>
  /** Attachments */
  attachments?: Attachment[]
  /** Tags for categorization */
  tags?: Tag[]
  /** Scheduled send time (ISO 8601) */
  scheduledAt?: string
}

export interface Attachment {
  /** Filename */
  filename: string
  /** Base64 encoded content or URL */
  content?: string
  /** File path (for Node.js) */
  path?: string
  /** Content type */
  contentType?: string
}

export interface Tag {
  /** Tag name */
  name: string
  /** Tag value */
  value: string
}

export interface Email {
  /** Email ID */
  id: string
  /** Sender address */
  from: string
  /** Recipients */
  to: string[]
  /** Subject */
  subject: string
  /** HTML body */
  html?: string
  /** Text body */
  text?: string
  /** BCC recipients */
  bcc?: string[]
  /** CC recipients */
  cc?: string[]
  /** Reply-to addresses */
  replyTo?: string[]
  /** Last event type */
  lastEvent?: EmailEventType
  /** Date created */
  createdAt: string
  /** Scheduled send time */
  scheduledAt?: string
}

export type EmailEventType =
  | 'sent'
  | 'delivered'
  | 'delivery_delayed'
  | 'complained'
  | 'bounced'
  | 'opened'
  | 'clicked'

export interface SendEmailResponse {
  /** Email ID */
  id: string
}

export interface BatchSendParams {
  /** Array of emails to send */
  emails: SendEmailParams[]
}

export interface BatchSendResponse {
  /** Array of email IDs */
  data: { id: string }[]
}

export interface ListEmailsParams {
  /** Number of emails to return */
  limit?: number
}

export interface ListEmailsResponse {
  data: Email[]
}

export interface UpdateEmailParams {
  /** Email ID */
  id: string
  /** New scheduled time (to reschedule) */
  scheduledAt: string
}

// ============================================================================
// Domain Types
// ============================================================================

export interface Domain {
  /** Domain ID */
  id: string
  /** Domain name */
  name: string
  /** Status */
  status: DomainStatus
  /** Region */
  region: string
  /** Date created */
  createdAt: string
  /** DNS records to add */
  records: DnsRecord[]
}

export type DomainStatus = 'pending' | 'verified' | 'failed' | 'temporary_failure' | 'not_started'

export interface DnsRecord {
  /** Record type (TXT, CNAME, MX) */
  record: string
  /** Record name */
  name: string
  /** Record value */
  value: string
  /** Record type */
  type: 'TXT' | 'CNAME' | 'MX'
  /** TTL */
  ttl: string
  /** Record status */
  status: 'verified' | 'pending' | 'not_started'
  /** Priority (for MX) */
  priority?: number
}

export interface CreateDomainParams {
  /** Domain name */
  name: string
  /** Region (us-east-1, eu-west-1, sa-east-1) */
  region?: 'us-east-1' | 'eu-west-1' | 'sa-east-1'
}

export interface ListDomainsResponse {
  data: Domain[]
}

export interface VerifyDomainResponse {
  /** Domain object */
  object: 'domain'
  id: string
}

export interface UpdateDomainParams {
  /** Domain ID */
  id: string
  /** Click tracking */
  clickTracking?: boolean
  /** Open tracking */
  openTracking?: boolean
  /** TLS enforcement */
  tls?: 'enforced' | 'opportunistic'
}

// ============================================================================
// API Key Types
// ============================================================================

export interface ApiKey {
  /** API key ID */
  id: string
  /** API key name */
  name: string
  /** Date created */
  createdAt: string
}

export interface CreateApiKeyParams {
  /** API key name */
  name: string
  /** Permission level */
  permission?: 'full_access' | 'sending_access'
  /** Restrict to specific domain */
  domainId?: string
}

export interface CreateApiKeyResponse {
  /** API key ID */
  id: string
  /** API key token (only shown once) */
  token: string
}

export interface ListApiKeysResponse {
  data: ApiKey[]
}

// ============================================================================
// Audience Types
// ============================================================================

export interface Audience {
  /** Audience ID */
  id: string
  /** Audience name */
  name: string
  /** Date created */
  createdAt: string
}

export interface CreateAudienceParams {
  /** Audience name */
  name: string
}

export interface ListAudiencesResponse {
  data: Audience[]
}

// ============================================================================
// Contact Types
// ============================================================================

export interface Contact {
  /** Contact ID */
  id: string
  /** Contact email */
  email: string
  /** First name */
  firstName?: string
  /** Last name */
  lastName?: string
  /** Subscription status */
  unsubscribed: boolean
  /** Date created */
  createdAt: string
}

export interface CreateContactParams {
  /** Audience ID */
  audienceId: string
  /** Contact email */
  email: string
  /** First name */
  firstName?: string
  /** Last name */
  lastName?: string
  /** Subscription status */
  unsubscribed?: boolean
}

export interface UpdateContactParams {
  /** Audience ID */
  audienceId: string
  /** Contact ID */
  id: string
  /** First name */
  firstName?: string
  /** Last name */
  lastName?: string
  /** Subscription status */
  unsubscribed?: boolean
}

export interface ListContactsParams {
  /** Audience ID */
  audienceId: string
}

export interface ListContactsResponse {
  data: Contact[]
}

// ============================================================================
// Broadcast Types
// ============================================================================

export interface Broadcast {
  /** Broadcast ID */
  id: string
  /** Audience ID */
  audienceId: string
  /** Sender email */
  from: string
  /** Subject */
  subject: string
  /** Reply-to */
  replyTo?: string
  /** Broadcast name */
  name: string
  /** Status */
  status: BroadcastStatus
  /** Date created */
  createdAt: string
  /** Date scheduled */
  scheduledAt?: string
  /** Date sent */
  sentAt?: string
}

export type BroadcastStatus = 'draft' | 'queued' | 'sending' | 'sent' | 'canceled'

export interface CreateBroadcastParams {
  /** Audience ID */
  audienceId: string
  /** Sender email */
  from: string
  /** Subject */
  subject: string
  /** Reply-to */
  replyTo?: string
  /** HTML content */
  html?: string
  /** Text content */
  text?: string
  /** Broadcast name */
  name?: string
}

export interface SendBroadcastParams {
  /** Broadcast ID */
  broadcastId: string
  /** Schedule time (ISO 8601) */
  scheduledAt?: string
}

export interface ListBroadcastsResponse {
  data: Broadcast[]
}

// ============================================================================
// Error Types
// ============================================================================

export interface ResendError {
  statusCode: number
  message: string
  name: string
}
