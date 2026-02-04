/**
 * Resend AI SDK Tools
 *
 * AI SDK 6 native tool definitions for Resend Email operations.
 * Single source of truth - used by both MCP server and AI SDK agents.
 *
 * @example
 * import { createResendTools } from '@trendingsociety/integrations/resend'
 * import { ResendClient } from '@trendingsociety/integrations/resend'
 *
 * const client = new ResendClient({
 *   apiKey: process.env.RESEND_API_KEY,
 *   defaultFrom: 'Acme <hello@acme.com>',
 * })
 * const tools = createResendTools(client)
 */

import { tool } from 'ai'
import { z } from 'zod'
import type { ResendClient } from './client.js'

// ============================================================================
// Input Schemas (Zod)
// ============================================================================

// Email Schemas
export const SendEmailInputSchema = z.object({
  to: z
    .union([z.string().email(), z.array(z.string().email())])
    .describe('Recipient email address or array of addresses'),
  subject: z.string().describe('Email subject line'),
  from: z.string().optional().describe('Sender email address (e.g., "Acme <hello@acme.com>")'),
  cc: z
    .union([z.string().email(), z.array(z.string().email())])
    .optional()
    .describe('CC recipients'),
  bcc: z
    .union([z.string().email(), z.array(z.string().email())])
    .optional()
    .describe('BCC recipients'),
  replyTo: z
    .union([z.string().email(), z.array(z.string().email())])
    .optional()
    .describe('Reply-to address'),
  html: z.string().optional().describe('HTML email body'),
  text: z.string().optional().describe('Plain text email body'),
  scheduledAt: z.string().optional().describe('Scheduled send time (ISO 8601)'),
})

export const GetEmailInputSchema = z.object({
  id: z.string().describe('The email ID to retrieve'),
})

export const ListEmailsInputSchema = z.object({
  limit: z.number().min(1).max(100).optional().describe('Maximum emails to return (default: 10)'),
})

export const UpdateEmailInputSchema = z.object({
  id: z.string().describe('The email ID to update'),
  scheduledAt: z.string().describe('New scheduled time (ISO 8601)'),
})

export const CancelEmailInputSchema = z.object({
  id: z.string().describe('The email ID to cancel'),
})

// Domain Schemas
export const CreateDomainInputSchema = z.object({
  name: z.string().describe('Domain name (e.g., "example.com")'),
  region: z
    .enum(['us-east-1', 'eu-west-1', 'sa-east-1'])
    .optional()
    .describe('Region for the domain'),
})

export const GetDomainInputSchema = z.object({
  id: z.string().describe('The domain ID'),
})

export const VerifyDomainInputSchema = z.object({
  id: z.string().describe('The domain ID to verify'),
})

export const UpdateDomainInputSchema = z.object({
  id: z.string().describe('The domain ID to update'),
  clickTracking: z.boolean().optional().describe('Enable click tracking'),
  openTracking: z.boolean().optional().describe('Enable open tracking'),
  tls: z.enum(['enforced', 'opportunistic']).optional().describe('TLS enforcement mode'),
})

export const DeleteDomainInputSchema = z.object({
  id: z.string().describe('The domain ID to delete'),
})

// API Key Schemas
export const CreateApiKeyInputSchema = z.object({
  name: z.string().describe('Name for the API key'),
  permission: z
    .enum(['full_access', 'sending_access'])
    .optional()
    .describe('Permission level'),
  domainId: z.string().optional().describe('Restrict to specific domain'),
})

export const DeleteApiKeyInputSchema = z.object({
  id: z.string().describe('The API key ID to delete'),
})

// Audience Schemas
export const CreateAudienceInputSchema = z.object({
  name: z.string().describe('Audience name'),
})

export const GetAudienceInputSchema = z.object({
  id: z.string().describe('The audience ID'),
})

export const DeleteAudienceInputSchema = z.object({
  id: z.string().describe('The audience ID to delete'),
})

// Contact Schemas
export const CreateContactInputSchema = z.object({
  audienceId: z.string().describe('The audience ID to add the contact to'),
  email: z.string().email().describe('Contact email address'),
  firstName: z.string().optional().describe('Contact first name'),
  lastName: z.string().optional().describe('Contact last name'),
  unsubscribed: z.boolean().optional().describe('Whether the contact is unsubscribed'),
})

export const GetContactInputSchema = z.object({
  audienceId: z.string().describe('The audience ID'),
  id: z.string().describe('The contact ID'),
})

export const ListContactsInputSchema = z.object({
  audienceId: z.string().describe('The audience ID'),
})

export const UpdateContactInputSchema = z.object({
  audienceId: z.string().describe('The audience ID'),
  id: z.string().describe('The contact ID to update'),
  firstName: z.string().optional().describe('New first name'),
  lastName: z.string().optional().describe('New last name'),
  unsubscribed: z.boolean().optional().describe('Update subscription status'),
})

export const DeleteContactInputSchema = z.object({
  audienceId: z.string().describe('The audience ID'),
  id: z.string().describe('The contact ID to delete'),
})

// Broadcast Schemas
export const CreateBroadcastInputSchema = z.object({
  audienceId: z.string().describe('The audience ID to send to'),
  from: z.string().describe('Sender email address'),
  subject: z.string().describe('Email subject'),
  replyTo: z.string().optional().describe('Reply-to address'),
  html: z.string().optional().describe('HTML content'),
  text: z.string().optional().describe('Plain text content'),
  name: z.string().optional().describe('Broadcast name for reference'),
})

export const GetBroadcastInputSchema = z.object({
  id: z.string().describe('The broadcast ID'),
})

export const SendBroadcastInputSchema = z.object({
  broadcastId: z.string().describe('The broadcast ID to send'),
  scheduledAt: z.string().optional().describe('Schedule time (ISO 8601)'),
})

export const DeleteBroadcastInputSchema = z.object({
  id: z.string().describe('The broadcast ID to delete'),
})

// ============================================================================
// Tool Factory
// ============================================================================

/**
 * Create AI SDK tools for Resend Email operations
 *
 * @param client - Initialized ResendClient instance
 * @returns Object containing all Resend tools (29 tools)
 */
export function createResendTools(client: ResendClient) {
  return {
    // -------------------------------------------------------------------------
    // Email Tools
    // -------------------------------------------------------------------------

    resend_send_email: tool({
      description:
        'Send an email via Resend. Supports HTML/text body, CC/BCC, reply-to, and scheduled sending.',
      inputSchema: SendEmailInputSchema,
      execute: async (params) => {
        const result = await client.sendEmail({
          to: params.to,
          subject: params.subject,
          from: params.from,
          cc: params.cc,
          bcc: params.bcc,
          replyTo: params.replyTo,
          html: params.html,
          text: params.text,
          scheduledAt: params.scheduledAt,
        })
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return { id: result.data.id }
      },
    }),

    resend_get_email: tool({
      description: 'Get details of a specific email by its ID.',
      inputSchema: GetEmailInputSchema,
      execute: async (params) => {
        const result = await client.getEmail(params.id)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    resend_list_emails: tool({
      description: 'List recent emails sent through Resend.',
      inputSchema: ListEmailsInputSchema,
      execute: async (params) => {
        const result = await client.listEmails(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    resend_update_email: tool({
      description: 'Reschedule a scheduled email.',
      inputSchema: UpdateEmailInputSchema,
      execute: async (params) => {
        const result = await client.updateEmail(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    resend_cancel_email: tool({
      description: 'Cancel a scheduled email.',
      inputSchema: CancelEmailInputSchema,
      execute: async (params) => {
        const result = await client.cancelEmail(params.id)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return { canceled: true, id: params.id }
      },
    }),

    // -------------------------------------------------------------------------
    // Domain Tools
    // -------------------------------------------------------------------------

    resend_create_domain: tool({
      description: 'Add a new domain to Resend for email sending.',
      inputSchema: CreateDomainInputSchema,
      execute: async (params) => {
        const result = await client.createDomain(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          id: result.data.id,
          name: result.data.name,
          status: result.data.status,
          records: result.data.records,
        }
      },
    }),

    resend_get_domain: tool({
      description: 'Get details of a specific domain including DNS records.',
      inputSchema: GetDomainInputSchema,
      execute: async (params) => {
        const result = await client.getDomain(params.id)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    resend_list_domains: tool({
      description: 'List all domains configured in Resend.',
      inputSchema: z.object({}),
      execute: async () => {
        const result = await client.listDomains()
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    resend_verify_domain: tool({
      description: 'Trigger domain verification. DNS records must be configured first.',
      inputSchema: VerifyDomainInputSchema,
      execute: async (params) => {
        const result = await client.verifyDomain(params.id)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    resend_update_domain: tool({
      description: 'Update domain settings like click tracking, open tracking, or TLS.',
      inputSchema: UpdateDomainInputSchema,
      execute: async (params) => {
        const result = await client.updateDomain(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    resend_delete_domain: tool({
      description: 'Delete a domain from Resend.',
      inputSchema: DeleteDomainInputSchema,
      execute: async (params) => {
        const result = await client.deleteDomain(params.id)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return { deleted: true, id: params.id }
      },
    }),

    // -------------------------------------------------------------------------
    // API Key Tools
    // -------------------------------------------------------------------------

    resend_create_api_key: tool({
      description:
        'Create a new API key. The token is only shown once in the response.',
      inputSchema: CreateApiKeyInputSchema,
      execute: async (params) => {
        const result = await client.createApiKey(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return { id: result.data.id, token: result.data.token }
      },
    }),

    resend_list_api_keys: tool({
      description: 'List all API keys (tokens are not included).',
      inputSchema: z.object({}),
      execute: async () => {
        const result = await client.listApiKeys()
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    resend_delete_api_key: tool({
      description: 'Delete an API key.',
      inputSchema: DeleteApiKeyInputSchema,
      execute: async (params) => {
        const result = await client.deleteApiKey(params.id)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return { deleted: true, id: params.id }
      },
    }),

    // -------------------------------------------------------------------------
    // Audience Tools
    // -------------------------------------------------------------------------

    resend_create_audience: tool({
      description: 'Create a new audience (contact list) for broadcasts.',
      inputSchema: CreateAudienceInputSchema,
      execute: async (params) => {
        const result = await client.createAudience(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    resend_get_audience: tool({
      description: 'Get details of a specific audience.',
      inputSchema: GetAudienceInputSchema,
      execute: async (params) => {
        const result = await client.getAudience(params.id)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    resend_list_audiences: tool({
      description: 'List all audiences in Resend.',
      inputSchema: z.object({}),
      execute: async () => {
        const result = await client.listAudiences()
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    resend_delete_audience: tool({
      description: 'Delete an audience and all its contacts.',
      inputSchema: DeleteAudienceInputSchema,
      execute: async (params) => {
        const result = await client.deleteAudience(params.id)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return { deleted: true, id: params.id }
      },
    }),

    // -------------------------------------------------------------------------
    // Contact Tools
    // -------------------------------------------------------------------------

    resend_create_contact: tool({
      description: 'Add a contact to an audience.',
      inputSchema: CreateContactInputSchema,
      execute: async (params) => {
        const result = await client.createContact(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    resend_get_contact: tool({
      description: 'Get details of a specific contact.',
      inputSchema: GetContactInputSchema,
      execute: async (params) => {
        const result = await client.getContact(params.audienceId, params.id)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    resend_list_contacts: tool({
      description: 'List all contacts in an audience.',
      inputSchema: ListContactsInputSchema,
      execute: async (params) => {
        const result = await client.listContacts(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    resend_update_contact: tool({
      description: 'Update a contact (name, subscription status).',
      inputSchema: UpdateContactInputSchema,
      execute: async (params) => {
        const result = await client.updateContact(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    resend_delete_contact: tool({
      description: 'Remove a contact from an audience.',
      inputSchema: DeleteContactInputSchema,
      execute: async (params) => {
        const result = await client.deleteContact(params.audienceId, params.id)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return { deleted: true, id: params.id }
      },
    }),

    // -------------------------------------------------------------------------
    // Broadcast Tools
    // -------------------------------------------------------------------------

    resend_create_broadcast: tool({
      description: 'Create a new broadcast (bulk email) draft.',
      inputSchema: CreateBroadcastInputSchema,
      execute: async (params) => {
        const result = await client.createBroadcast(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          id: result.data.id,
          name: result.data.name,
          status: result.data.status,
        }
      },
    }),

    resend_get_broadcast: tool({
      description: 'Get details of a specific broadcast.',
      inputSchema: GetBroadcastInputSchema,
      execute: async (params) => {
        const result = await client.getBroadcast(params.id)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    resend_list_broadcasts: tool({
      description: 'List all broadcasts.',
      inputSchema: z.object({}),
      execute: async () => {
        const result = await client.listBroadcasts()
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    resend_send_broadcast: tool({
      description: 'Send a broadcast immediately or schedule it.',
      inputSchema: SendBroadcastInputSchema,
      execute: async (params) => {
        const result = await client.sendBroadcast(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          id: result.data.id,
          status: result.data.status,
          scheduledAt: result.data.scheduledAt,
        }
      },
    }),

    resend_delete_broadcast: tool({
      description: 'Delete a broadcast draft.',
      inputSchema: DeleteBroadcastInputSchema,
      execute: async (params) => {
        const result = await client.deleteBroadcast(params.id)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return { deleted: true, id: params.id }
      },
    }),
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type ResendTools = ReturnType<typeof createResendTools>
