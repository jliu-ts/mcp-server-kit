/**
 * N8N API Types
 * https://docs.n8n.io/api/
 */

import { z } from 'zod'

// ============================================================================
// Configuration
// ============================================================================

export interface N8NConfig {
  apiKey: string
  baseUrl: string
  timeout?: number
}

// ============================================================================
// Workflows
// ============================================================================

export interface Workflow {
  id: string
  name: string
  active: boolean
  createdAt: string
  updatedAt: string
  nodes: WorkflowNode[]
  connections: Record<string, unknown>
  settings?: Record<string, unknown>
  tags?: Tag[]
}

export interface WorkflowNode {
  id: string
  name: string
  type: string
  position: [number, number]
  parameters: Record<string, unknown>
}

export interface Tag {
  id: string
  name: string
}

export interface WorkflowsResponse {
  data: Workflow[]
  nextCursor?: string
}

// ============================================================================
// Executions
// ============================================================================

export interface Execution {
  id: string
  finished: boolean
  mode: 'manual' | 'trigger' | 'webhook' | 'retry'
  startedAt: string
  stoppedAt?: string
  workflowId: string
  workflowData?: Workflow
  status: 'waiting' | 'running' | 'success' | 'error' | 'canceled'
  data?: {
    resultData?: {
      runData?: Record<string, unknown>
    }
  }
}

export interface ExecutionsResponse {
  data: Execution[]
  nextCursor?: string
}

// ============================================================================
// Credentials
// ============================================================================

export interface CredentialType {
  name: string
  displayName: string
  documentationUrl?: string
  properties: Array<{
    name: string
    displayName: string
    type: string
    required?: boolean
  }>
}

export interface Credential {
  id: string
  name: string
  type: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Zod Schemas for Tool Inputs
// ============================================================================

export const ListWorkflowsInputSchema = z.object({
  active: z.boolean().optional().describe('Filter by active status'),
  tags: z.array(z.string()).optional().describe('Filter by tag names'),
  limit: z.number().max(100).default(50).describe('Maximum workflows to return'),
})

export const GetWorkflowInputSchema = z.object({
  workflowId: z.string().describe('Workflow ID'),
})

export const ExecuteWorkflowInputSchema = z.object({
  workflowId: z.string().describe('Workflow ID to execute'),
  data: z.record(z.unknown()).optional().describe('Input data for the workflow'),
})

export const ActivateWorkflowInputSchema = z.object({
  workflowId: z.string().describe('Workflow ID to activate'),
})

export const DeactivateWorkflowInputSchema = z.object({
  workflowId: z.string().describe('Workflow ID to deactivate'),
})

export const ListExecutionsInputSchema = z.object({
  workflowId: z.string().optional().describe('Filter by workflow ID'),
  status: z
    .enum(['waiting', 'running', 'success', 'error', 'canceled'])
    .optional()
    .describe('Filter by status'),
  limit: z.number().max(100).default(20).describe('Maximum executions to return'),
})

export const GetExecutionInputSchema = z.object({
  executionId: z.string().describe('Execution ID'),
  includeData: z.boolean().default(false).describe('Include execution output data'),
})

export const ListCredentialTypesInputSchema = z.object({
  limit: z.number().max(100).default(50).describe('Maximum types to return'),
})
