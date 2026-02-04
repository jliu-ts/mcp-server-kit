/**
 * Zapier NLA (Natural Language Actions) Integration
 *
 * @example
 * ```typescript
 * import { ZapierClient, createZapierTools } from '@trendingsociety/integrations/zapier'
 *
 * const client = new ZapierClient({ apiKey: process.env.ZAPIER_NLA_API_KEY })
 * const tools = createZapierTools(client)
 *
 * // List available actions
 * const actions = await tools.zapier_list_actions.execute({})
 *
 * // Execute an action with natural language
 * const result = await tools.zapier_execute_action.execute({
 *   actionId: 'abc123',
 *   instructions: 'Send an email to john@example.com with subject "Hello"',
 * })
 * ```
 *
 * Configure actions at: https://nla.zapier.com/credentials/
 */

export { ZapierClient, type ZapierClientConfig } from './client.js'
export { createZapierTools, type ZapierTools } from './tools.js'
export {
  // Schemas
  ListActionsInputSchema,
  ExecuteActionInputSchema,
  GetExecutionInputSchema,
  ListZapsInputSchema,
  GetZapInputSchema,
  // Types
  type ZapierConfig,
  type Action,
  type ActionsResponse,
  type ExecuteActionParams,
  type ExecuteActionResponse,
  type ExecutionLogEntry,
} from './types.js'
