/**
 * AI SDK Tool Adapter
 *
 * Converts AI SDK tool definitions (with Zod schemas) to MCP registry entries.
 * This enables single source of truth for schemas while preserving MCP-specific metadata.
 *
 * @example
 * import { createLinearTools, ListIssuesInputSchema } from '@mcp/integrations/linear'
 * import { createMcpToolsFromAiSdk } from '../lib/ai-sdk-adapter'
 *
 * const mcpTools = createMcpToolsFromAiSdk({
 *   tools: createLinearTools(client),
 *   schemas: { linear_list_issues: ListIssuesInputSchema },
 *   metadata: { linear_list_issues: { cacheable: true, cacheTTL: 60 } },
 * })
 */

import { zodToJsonSchema } from 'zod-to-json-schema'
import type { z } from 'zod'
import type { ToolRegistryEntry, McpToolDefinition, ToolMetadata } from '../core/types'

// ============================================================================
// Types
// ============================================================================

/**
 * AI SDK Tool type - compatible with AI SDK v6+ flexible schema types
 *
 * In AI SDK v6+, inputSchema can be a Zod schema, JSON Schema, or other schema types.
 * The execute function takes (params, options) but we only use params.
 */
export interface AiSdkTool {
  /** Tool description (optional in AI SDK v6+) */
  description?: string
  /** AI SDK v5+ uses inputSchema - can be Zod, JSON Schema, or other */
  inputSchema: z.ZodType<any> | Record<string, unknown> | unknown
  /** Execute function - AI SDK v6 passes (params, options), we use just params */
  execute: (...args: any[]) => Promise<any>
}

/**
 * AI SDK ToolSet - a Record of tool names to tools
 * Uses Record<string, any> to be maximally compatible with AI SDK's Tool type
 */
export type AiSdkToolSet = Record<string, any>

export interface McpMetadataOverlay {
  [toolName: string]: ToolMetadata
}

export interface AdapterOptions<TClient> {
  /** AI SDK tools from integrations package */
  tools: AiSdkToolSet
  /** Optional: Override/extend metadata for specific tools */
  metadata?: McpMetadataOverlay
  /** Optional: Client instance (for registry compatibility) */
  client?: TClient
}

// ============================================================================
// Schema Conversion
// ============================================================================

/**
 * Internal type for JSON Schema object with properties
 */
interface JsonSchemaObject {
  type?: string
  properties?: Record<string, unknown>
  required?: string[]
  [key: string]: unknown
}

/**
 * Convert Zod schema to MCP-compatible JSON Schema
 */
export function zodToMcpSchema(schema: z.ZodType<any>): McpToolDefinition['inputSchema'] {
  const rawSchema = zodToJsonSchema(schema, {
    $refStrategy: 'none', // Inline all references
    target: 'jsonSchema7',
  })

  // Cast to working type for property access
  const jsonSchema = rawSchema as JsonSchemaObject

  // Ensure we have the expected shape
  if (typeof jsonSchema !== 'object' || jsonSchema.type !== 'object') {
    return {
      type: 'object',
      properties: {},
    }
  }

  // Extract properties and required fields
  const properties: McpToolDefinition['inputSchema']['properties'] = {}

  if (jsonSchema.properties && typeof jsonSchema.properties === 'object') {
    for (const [key, value] of Object.entries(jsonSchema.properties)) {
      if (typeof value === 'object' && value !== null) {
        properties[key] = {
          type: (value as any).type || 'string',
          description: (value as any).description,
          enum: (value as any).enum,
          items: (value as any).items,
          default: (value as any).default,
        }
      }
    }
  }

  return {
    type: 'object',
    properties,
    required: Array.isArray(jsonSchema.required) ? jsonSchema.required : undefined,
  }
}

// ============================================================================
// Adapter Functions
// ============================================================================

/**
 * Convert a single AI SDK tool to MCP tool definition
 */
export function aiSdkToolToMcpDefinition(
  name: string,
  tool: AiSdkTool,
  metadata?: ToolMetadata
): McpToolDefinition & { metadata?: ToolMetadata } {
  return {
    name,
    description: tool.description || `${name} tool`,
    inputSchema: zodToMcpSchema(tool.inputSchema as z.ZodType<any>),
    ...(metadata && { metadata }),
  }
}

/**
 * Create MCP-compatible registry entries from AI SDK tools
 *
 * This adapter wraps AI SDK tools for use with the MCP registry system.
 * The execute function is called directly (bypassing client method lookup).
 */
export function createMcpEntriesFromAiSdk<TClient = unknown>(
  options: AdapterOptions<TClient>
): Array<ToolRegistryEntry<TClient, keyof TClient>> {
  const entries: Array<ToolRegistryEntry<TClient, keyof TClient>> = []

  for (const [name, tool] of Object.entries(options.tools)) {
    const metadata = options.metadata?.[name]

    // Create registry entry with direct execute
    // We use 'execute' as a pseudo-method and handle it specially in the executor
    entries.push({
      name,
      description: tool.description || `${name} tool`,
      method: '_aiSdkExecute' as keyof TClient, // Special marker
      inputSchema: zodToMcpSchema(tool.inputSchema as z.ZodType<any>),
      metadata,
      // Store the actual execute function for direct invocation
      transformParams: (params) => params, // Pass through
      transformResult: (result) => {
        // AI SDK tools throw on error, so if we get here it succeeded
        return { success: true, data: result }
      },
    } as ToolRegistryEntry<TClient, keyof TClient>)
  }

  return entries
}

/**
 * Create a wrapper client that can execute AI SDK tools
 *
 * This creates a proxy object that makes AI SDK tools compatible
 * with the registry's method-based execution pattern.
 */
export function createAiSdkClientWrapper<TClient>(
  tools: AiSdkToolSet,
  originalClient?: TClient
): TClient & { _aiSdkExecute: (toolName: string, params: any) => Promise<any> } {
  const wrapper = {
    // Spread original client methods if provided
    ...(originalClient || {}),

    // Add AI SDK execute method
    _aiSdkExecute: async (toolName: string, params: any) => {
      const tool = tools[toolName]
      if (!tool) {
        throw new Error(`AI SDK tool not found: ${toolName}`)
      }
      return tool.execute(params)
    },
  }

  return wrapper as TClient & { _aiSdkExecute: (toolName: string, params: any) => Promise<any> }
}

/**
 * Get all MCP tool definitions from AI SDK tools
 *
 * Useful for tools/list endpoint
 */
export function getMcpToolDefinitions(
  tools: AiSdkToolSet,
  metadata?: McpMetadataOverlay
): McpToolDefinition[] {
  return Object.entries(tools).map(([name, tool]) =>
    aiSdkToolToMcpDefinition(name, tool, metadata?.[name])
  )
}
