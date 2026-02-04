/**
 * N8N Integration
 *
 * @example
 * ```typescript
 * import { N8NClient, createN8NTools } from '@trendingsociety/integrations/n8n'
 *
 * const client = new N8NClient({
 *   apiKey: process.env.N8N_API_KEY,
 *   baseUrl: process.env.N8N_HOST, // e.g., https://n8n.example.com
 * })
 * const tools = createN8NTools(client)
 *
 * // List workflows
 * const result = await tools.n8n_list_workflows.execute({
 *   active: true,
 * })
 *
 * // Execute a workflow
 * const execution = await tools.n8n_execute_workflow.execute({
 *   workflowId: 'abc123',
 *   data: { message: 'Hello!' },
 * })
 * ```
 */

export { N8NClient, type N8NClientConfig } from './client.js'
export { createN8NTools, type N8NTools } from './tools.js'
export {
  // Schemas
  ListWorkflowsInputSchema,
  GetWorkflowInputSchema,
  ExecuteWorkflowInputSchema,
  ActivateWorkflowInputSchema,
  DeactivateWorkflowInputSchema,
  ListExecutionsInputSchema,
  GetExecutionInputSchema,
  ListCredentialTypesInputSchema,
  // Types
  type N8NConfig,
  type Workflow,
  type WorkflowNode,
  type Tag,
  type WorkflowsResponse,
  type Execution,
  type ExecutionsResponse,
  type CredentialType,
  type Credential,
} from './types.js'
