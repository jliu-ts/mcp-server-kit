/**
 * N8N AI SDK Tools
 * MCP-compatible tools for N8N workflow automation
 */

import { tool } from 'ai'
import { N8NClient } from './client.js'
import {
  ListWorkflowsInputSchema,
  GetWorkflowInputSchema,
  ExecuteWorkflowInputSchema,
  ActivateWorkflowInputSchema,
  DeactivateWorkflowInputSchema,
  ListExecutionsInputSchema,
  GetExecutionInputSchema,
  ListCredentialTypesInputSchema,
} from './types.js'

export function createN8NTools(client: N8NClient) {
  return {
    // ========================================================================
    // Workflows
    // ========================================================================
    n8n_list_workflows: tool({
      description:
        'List all workflows in N8N. Can filter by active status and tags.',
      inputSchema: ListWorkflowsInputSchema,
      execute: async (params) => {
        const result = await client.listWorkflows({
          active: params.active,
          tags: params.tags,
          limit: params.limit,
        })
        if (!result.success) throw new Error(result.error.message)

        return {
          count: result.data.data.length,
          workflows: result.data.data.map((w) => ({
            id: w.id,
            name: w.name,
            active: w.active,
            updatedAt: w.updatedAt,
            tags: w.tags?.map((t) => t.name) ?? [],
          })),
          hasMore: !!result.data.nextCursor,
        }
      },
    }),

    n8n_get_workflow: tool({
      description:
        'Get detailed information about a specific workflow including nodes and connections.',
      inputSchema: GetWorkflowInputSchema,
      execute: async (params) => {
        const result = await client.getWorkflow(params.workflowId)
        if (!result.success) throw new Error(result.error.message)

        return {
          id: result.data.id,
          name: result.data.name,
          active: result.data.active,
          createdAt: result.data.createdAt,
          updatedAt: result.data.updatedAt,
          nodes: result.data.nodes.map((n) => ({
            name: n.name,
            type: n.type,
          })),
          tags: result.data.tags?.map((t) => t.name) ?? [],
        }
      },
    }),

    n8n_execute_workflow: tool({
      description:
        'Execute a workflow manually. Returns an execution ID to track the run.',
      inputSchema: ExecuteWorkflowInputSchema,
      execute: async (params) => {
        const result = await client.executeWorkflow(params.workflowId, params.data)
        if (!result.success) throw new Error(result.error.message)

        return {
          executionId: result.data.executionId,
          message: 'Workflow execution started. Use n8n_get_execution to check status.',
        }
      },
    }),

    n8n_activate_workflow: tool({
      description: 'Activate a workflow so it runs on its configured triggers.',
      inputSchema: ActivateWorkflowInputSchema,
      execute: async (params) => {
        const result = await client.activateWorkflow(params.workflowId)
        if (!result.success) throw new Error(result.error.message)

        return {
          id: result.data.id,
          name: result.data.name,
          active: result.data.active,
        }
      },
    }),

    n8n_deactivate_workflow: tool({
      description: 'Deactivate a workflow so it stops running on triggers.',
      inputSchema: DeactivateWorkflowInputSchema,
      execute: async (params) => {
        const result = await client.deactivateWorkflow(params.workflowId)
        if (!result.success) throw new Error(result.error.message)

        return {
          id: result.data.id,
          name: result.data.name,
          active: result.data.active,
        }
      },
    }),

    // ========================================================================
    // Executions
    // ========================================================================
    n8n_list_executions: tool({
      description:
        'List workflow executions. Can filter by workflow ID and status.',
      inputSchema: ListExecutionsInputSchema,
      execute: async (params) => {
        const result = await client.listExecutions({
          workflowId: params.workflowId,
          status: params.status,
          limit: params.limit,
        })
        if (!result.success) throw new Error(result.error.message)

        return {
          count: result.data.data.length,
          executions: result.data.data.map((e) => ({
            id: e.id,
            workflowId: e.workflowId,
            status: e.status,
            mode: e.mode,
            startedAt: e.startedAt,
            stoppedAt: e.stoppedAt,
          })),
          hasMore: !!result.data.nextCursor,
        }
      },
    }),

    n8n_get_execution: tool({
      description:
        'Get details of a specific execution including status and optionally output data.',
      inputSchema: GetExecutionInputSchema,
      execute: async (params) => {
        const result = await client.getExecution(params.executionId, params.includeData)
        if (!result.success) throw new Error(result.error.message)

        return {
          id: result.data.id,
          workflowId: result.data.workflowId,
          status: result.data.status,
          mode: result.data.mode,
          finished: result.data.finished,
          startedAt: result.data.startedAt,
          stoppedAt: result.data.stoppedAt,
          data: params.includeData ? result.data.data : undefined,
        }
      },
    }),

    // ========================================================================
    // Credentials
    // ========================================================================
    n8n_list_credential_types: tool({
      description: 'List available credential types that can be configured in N8N.',
      inputSchema: ListCredentialTypesInputSchema,
      execute: async (params) => {
        const result = await client.listCredentialTypes()
        if (!result.success) throw new Error(result.error.message)

        const types = result.data.slice(0, params.limit)
        return {
          count: types.length,
          types: types.map((t) => ({
            name: t.name,
            displayName: t.displayName,
            documentationUrl: t.documentationUrl,
          })),
        }
      },
    }),
  }
}

export type N8NTools = ReturnType<typeof createN8NTools>
