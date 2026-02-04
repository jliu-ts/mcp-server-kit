/**
 * Zapier NLA (Natural Language Actions) API Types
 * https://nla.zapier.com/docs
 */

import { z } from 'zod'

// ============================================================================
// Configuration
// ============================================================================

export interface ZapierConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
}

// ============================================================================
// Actions (NLA)
// ============================================================================

export interface Action {
  id: string
  description: string
  operation_id: string
  params: Record<
    string,
    {
      type: string
      title: string
      description?: string
      required?: boolean
      enum?: string[]
    }
  >
}

export interface ActionsResponse {
  results: Action[]
  configuration_link: string
}

export interface ExecuteActionParams {
  actionId: string
  instructions: string
  params?: Record<string, unknown>
  preview_only?: boolean
}

export interface ExecuteActionResponse {
  id: string
  action_used: string
  input_params: Record<string, unknown>
  review_url: string
  result: Record<string, unknown> | null
  result_field_labels: Record<string, string>
  status: 'success' | 'error' | 'preview'
  error?: string
}

// ============================================================================
// Execution Log
// ============================================================================

export interface ExecutionLogEntry {
  id: string
  action_id: string
  status: 'success' | 'error'
  input_params: Record<string, unknown>
  result: Record<string, unknown> | null
  created_at: string
}

// ============================================================================
// Zod Schemas for Tool Inputs
// ============================================================================

export const ListActionsInputSchema = z.object({})

export const ExecuteActionInputSchema = z.object({
  actionId: z.string().describe('Action ID from zapier_list_actions'),
  instructions: z
    .string()
    .describe('Natural language instructions for the action (e.g., "Send email to john@example.com")'),
  params: z
    .record(z.unknown())
    .optional()
    .describe('Optional explicit parameters to pass'),
  preview_only: z
    .boolean()
    .default(false)
    .describe('Preview without executing'),
})

export const GetExecutionInputSchema = z.object({
  executionId: z.string().describe('Execution ID from zapier_execute_action'),
})

export const ListZapsInputSchema = z.object({
  limit: z.number().max(100).default(20).describe('Maximum Zaps to return'),
})

export const GetZapInputSchema = z.object({
  zapId: z.string().describe('Zap ID'),
})
