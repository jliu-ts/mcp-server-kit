/**
 * Core MCP Registry Types
 *
 * Generic, reusable types for all platforms
 */

// ============================================================================
// MCP Protocol Types
// ============================================================================

/**
 * JSON Schema property definition for MCP tools
 * Supports standard JSON Schema fields for validation
 */
export interface McpSchemaProperty {
  type: string
  description?: string
  enum?: (string | number)[]
  items?: McpSchemaProperty
  properties?: Record<string, McpSchemaProperty>
  required?: string[]
  // JSON Schema validation
  default?: unknown
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  // Additional metadata
  format?: string
}

export interface McpToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, McpSchemaProperty>
    required?: string[]
  }
  // Optional metadata extensions
  examples?: McpToolExample[]
  category?: string
  tags?: string[]
}

export interface McpContext {
  user?: {
    id: string
    name: string
    email: string
  }
  session?: {
    id: string
    startedAt: string
  }
  interface?: 'claude' | 'chatgpt' | 'gemini' | 'rest' | 'voice'
}

export interface McpToolExample {
  description: string
  params: Record<string, unknown>
  expectedResult?: string
}

// ============================================================================
// Registry Types
// ============================================================================

export interface ToolMetadata {
  // MCP enhancements
  examples?: McpToolExample[]
  voiceTemplate?: string
  cacheable?: boolean
  cacheTTL?: number // seconds
  streaming?: boolean
  contextAware?: boolean

  // Resource linking
  linkedResources?: string[]

  // Categories for organization
  category?: string
  tags?: string[]

  // Rate limiting
  rateLimit?: {
    maxCalls: number
    windowSeconds: number
  }
}

export interface ToolRegistryEntry<TClient, TMethod extends keyof TClient> {
  // Core fields
  name: string
  description: string
  method: TMethod
  inputSchema: McpToolDefinition['inputSchema']

  // Optional metadata
  metadata?: ToolMetadata

  // Optional transforms
  transformParams?: (params: Record<string, unknown>, context?: McpContext) => any
  transformResult?: (result: any) => any
}

export interface PlatformRegistry<TClient> {
  platform: string
  client: TClient
  tools: Array<ToolRegistryEntry<TClient, keyof TClient>>
}

// ============================================================================
// Execution Types
// ============================================================================

export interface ToolExecutionContext {
  toolName: string
  params: Record<string, unknown>
  context?: McpContext
  startTime: number
}

export interface ToolExecutionResult {
  success: boolean
  tool: string
  data?: unknown
  error?: {
    code: string
    message: string
    statusCode?: number
  }
  duration: number
  cached?: boolean
}

