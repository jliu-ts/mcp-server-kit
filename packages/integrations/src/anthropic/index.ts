/**
 * Anthropic Claude Integration
 *
 * @example
 * ```typescript
 * import { AnthropicClient, createAnthropicTools } from '@trendingsociety/integrations/anthropic'
 *
 * const client = new AnthropicClient({ apiKey: process.env.ANTHROPIC_API_KEY })
 * const tools = createAnthropicTools(client)
 *
 * // Use tools with AI SDK or MCP
 * const result = await tools.anthropic_create_message.execute({
 *   model: 'claude-sonnet-4-20250514',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 *   max_tokens: 1024,
 * })
 * ```
 */

export { AnthropicClient, type AnthropicClientConfig } from './client.js'
export { createAnthropicTools, type AnthropicTools } from './tools.js'
export {
  // Schemas
  CreateMessageInputSchema,
  CountTokensInputSchema,
  ListModelsInputSchema,
  CreateBatchInputSchema,
  GetBatchInputSchema,
  ListBatchesInputSchema,
  CancelBatchInputSchema,
  // Types
  type AnthropicConfig,
  type ContentBlock,
  type Message,
  type CreateMessageParams,
  type MessageResponse,
  type CountTokensParams,
  type TokenCountResponse,
  type Model,
  type ModelsResponse,
  type BatchRequest,
  type CreateBatchParams,
  type BatchResponse,
  type BatchListResponse,
} from './types.js'
