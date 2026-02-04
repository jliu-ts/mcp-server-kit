// @ts-nocheck
/**
 * Zapier NLA AI SDK Tools
 * MCP-compatible tools for Zapier Natural Language Actions
 */

import { tool } from 'ai'
import { ZapierClient } from './client.js'
import {
  ListActionsInputSchema,
  ExecuteActionInputSchema,
  GetExecutionInputSchema,
  ListZapsInputSchema,
  GetZapInputSchema,
} from './types.js'

export function createZapierTools(client: ZapierClient) {
  return {
    // ========================================================================
    // Actions (NLA)
    // ========================================================================
    zapier_list_actions: tool({
      description:
        'List available Zapier actions that can be executed via natural language. Configure actions at https://nla.zapier.com/credentials/',
      inputSchema: ListActionsInputSchema,
      execute: async () => {
        const result = await client.listActions()
        if (!result.success) throw new Error(result.error.message)

        return {
          count: result.data.results.length,
          configurationUrl: result.data.configuration_link,
          actions: result.data.results.map((a) => ({
            id: a.id,
            description: a.description,
            operationId: a.operation_id,
            requiredParams: Object.entries(a.params)
              .filter(([, v]) => v.required)
              .map(([k, v]) => ({ name: k, description: v.description })),
          })),
        }
      },
    }),

    zapier_execute_action: tool({
      description:
        'Execute a Zapier action using natural language instructions. The AI will interpret your instructions and fill in parameters.',
      inputSchema: ExecuteActionInputSchema,
      execute: async (params) => {
        const result = await client.executeAction({
          actionId: params.actionId,
          instructions: params.instructions,
          params: params.params,
          preview_only: params.preview_only,
        })
        if (!result.success) throw new Error(result.error.message)

        const response = result.data
        return {
          id: response.id,
          status: response.status,
          actionUsed: response.action_used,
          inputParams: response.input_params,
          result: response.result,
          reviewUrl: response.review_url,
          error: response.error,
        }
      },
    }),

    zapier_get_execution: tool({
      description: 'Get the result of a previously executed action.',
      inputSchema: GetExecutionInputSchema,
      execute: async (params) => {
        const result = await client.getExecutionLog(params.executionId)
        if (!result.success) throw new Error(result.error.message)

        return {
          id: result.data.id,
          actionId: result.data.action_id,
          status: result.data.status,
          inputParams: result.data.input_params,
          result: result.data.result,
          createdAt: result.data.created_at,
        }
      },
    }),

    // ========================================================================
    // Zaps (placeholder - requires different API)
    // ========================================================================
    zapier_list_zaps: tool({
      description:
        'List Zaps in your account. Note: Requires Zapier Partner API access.',
      inputSchema: ListZapsInputSchema,
      execute: async () => {
        return {
          message:
            'Zap management requires the Zapier Partner API. Use NLA actions for automation.',
          configureAt: 'https://nla.zapier.com/credentials/',
          note: 'Enable actions there, then use zapier_list_actions and zapier_execute_action.',
        }
      },
    }),

    zapier_get_zap: tool({
      description: 'Get details of a specific Zap. Note: Requires Zapier Partner API access.',
      inputSchema: GetZapInputSchema,
      execute: async () => {
        return {
          message:
            'Zap details require the Zapier Partner API. Use NLA actions for automation.',
          configureAt: 'https://nla.zapier.com/credentials/',
        }
      },
    }),
  }
}

export type ZapierTools = ReturnType<typeof createZapierTools>
