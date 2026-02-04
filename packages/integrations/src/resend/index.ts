/**
 * Resend Integration
 *
 * Email sending and management via Resend API.
 * Provides 29 AI SDK tools for email operations.
 *
 * Features:
 * - Email sending (single and batch)
 * - Scheduled emails
 * - Domain management
 * - API key management
 * - Audience (contact list) management
 * - Contact management
 * - Broadcast (bulk email) management
 *
 * @example
 * import { ResendClient, createResendTools } from '@trendingsociety/integrations/resend'
 *
 * const client = new ResendClient({
 *   apiKey: process.env.RESEND_API_KEY,
 *   defaultFrom: 'Acme <hello@acme.com>',
 * })
 *
 * const tools = createResendTools(client)
 *
 * // Use with AI SDK
 * const response = await generateText({
 *   model: anthropic('claude-sonnet-4-20250514'),
 *   tools,
 *   prompt: 'Send a welcome email to user@example.com',
 * })
 */

// Client
export { ResendClient, type ResendClientConfig } from './client.js'

// Tools
export { createResendTools, type ResendTools } from './tools.js'

// Input schemas for validation
export {
  // Email schemas
  SendEmailInputSchema,
  GetEmailInputSchema,
  ListEmailsInputSchema,
  UpdateEmailInputSchema,
  CancelEmailInputSchema,
  // Domain schemas
  CreateDomainInputSchema,
  GetDomainInputSchema,
  VerifyDomainInputSchema,
  UpdateDomainInputSchema,
  DeleteDomainInputSchema,
  // API Key schemas
  CreateApiKeyInputSchema,
  DeleteApiKeyInputSchema,
  // Audience schemas
  CreateAudienceInputSchema,
  GetAudienceInputSchema,
  DeleteAudienceInputSchema,
  // Contact schemas
  CreateContactInputSchema,
  GetContactInputSchema,
  ListContactsInputSchema,
  UpdateContactInputSchema,
  DeleteContactInputSchema,
  // Broadcast schemas
  CreateBroadcastInputSchema,
  GetBroadcastInputSchema,
  SendBroadcastInputSchema,
  DeleteBroadcastInputSchema,
} from './tools.js'

// Types
export type {
  ResendConfig,
  // Email types
  SendEmailParams,
  SendEmailResponse,
  Email,
  EmailEventType,
  BatchSendParams,
  BatchSendResponse,
  ListEmailsParams,
  ListEmailsResponse,
  UpdateEmailParams,
  Attachment,
  Tag,
  // Domain types
  Domain,
  DomainStatus,
  DnsRecord,
  CreateDomainParams,
  ListDomainsResponse,
  VerifyDomainResponse,
  UpdateDomainParams,
  // API Key types
  ApiKey,
  CreateApiKeyParams,
  CreateApiKeyResponse,
  ListApiKeysResponse,
  // Audience types
  Audience,
  CreateAudienceParams,
  ListAudiencesResponse,
  // Contact types
  Contact,
  CreateContactParams,
  UpdateContactParams,
  ListContactsParams,
  ListContactsResponse,
  // Broadcast types
  Broadcast,
  BroadcastStatus,
  CreateBroadcastParams,
  SendBroadcastParams,
  ListBroadcastsResponse,
  // Error types
  ResendError,
} from './types.js'
