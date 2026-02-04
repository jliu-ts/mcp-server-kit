/**
 * Universal Registry Engine
 *
 * Handles tool discovery, validation, and execution for ALL platforms.
 * Supports both traditional client-method pattern and AI SDK tool pattern.
 */

import type {
  ToolRegistryEntry,
  PlatformRegistry,
  McpToolDefinition,
  ToolExecutionResult,
  McpContext,
} from './types'
import type { AiSdkToolSet } from '../lib/ai-sdk-adapter'
import { zodToMcpSchema } from '../lib/ai-sdk-adapter'

// ============================================================================
// Registry Manager
// ============================================================================

export class RegistryManager {
  private platforms: Map<string, PlatformRegistry<any>> = new Map()
  private toolIndex: Map<string, { platform: string; entry: ToolRegistryEntry<any, any> }> =
    new Map()
  private aiSdkTools: Map<string, { platform: string; execute: (params: any) => Promise<any> }> =
    new Map()

  /**
   * Register a platform with its tools
   */
  registerPlatform<TClient>(registry: PlatformRegistry<TClient>): void {
    this.platforms.set(registry.platform, registry)

    // Index all tools for fast lookup
    for (const tool of registry.tools) {
      this.toolIndex.set(tool.name, {
        platform: registry.platform,
        entry: tool,
      })
    }
  }

  /**
   * Register AI SDK tools directly
   *
   * This allows using AI SDK tool definitions from @mcp/integrations
   * without needing the traditional client-method pattern.
   */
  registerAiSdkTools(
    platform: string,
    tools: AiSdkToolSet,
    metadata?: Record<string, any>
  ): void {
    for (const [name, tool] of Object.entries(tools)) {
      // Store execute function for direct invocation
      this.aiSdkTools.set(name, {
        platform,
        execute: tool.execute,
      })

      // Also index in tool registry for discovery
      const entry: ToolRegistryEntry<any, any> = {
        name,
        description: tool.description || `${name} tool`, // Fallback for optional descriptions
        method: '_aiSdkExecute' as any, // Marker for AI SDK execution
        inputSchema: zodToMcpSchema(tool.inputSchema as any),
        metadata: metadata?.[name],
      }

      this.toolIndex.set(name, { platform, entry })
    }
  }

  /**
   * Get all tool definitions (for MCP tools/list)
   * Includes both platform-registered tools and AI SDK tools
   */
  getAllToolDefinitions(): McpToolDefinition[] {
    const definitions: McpToolDefinition[] = []
    const seenTools = new Set<string>()

    // Add tools from traditional platform registrations
    for (const [platform, registry] of this.platforms) {
      for (const tool of registry.tools) {
        seenTools.add(tool.name)
        definitions.push({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          // Include metadata if present
          ...(tool.metadata?.examples && { examples: tool.metadata.examples }),
          ...(tool.metadata?.category && { category: tool.metadata.category }),
          ...(tool.metadata?.tags && { tags: tool.metadata.tags }),
        })
      }
    }

    // Add AI SDK tools (from toolIndex, not already seen)
    for (const [name, toolInfo] of this.toolIndex) {
      if (!seenTools.has(name)) {
        const entry = toolInfo.entry
        definitions.push({
          name: entry.name,
          description: entry.description,
          inputSchema: entry.inputSchema,
          // Include metadata if present
          ...(entry.metadata?.examples && { examples: entry.metadata.examples }),
          ...(entry.metadata?.category && { category: entry.metadata.category }),
          ...(entry.metadata?.tags && { tags: entry.metadata.tags }),
        })
      }
    }

    return definitions
  }

  /**
   * Get tools by platform
   */
  getToolsByPlatform(platform: string): McpToolDefinition[] {
    const registry = this.platforms.get(platform)
    if (!registry) return []

    return registry.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }))
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): McpToolDefinition[] {
    const definitions: McpToolDefinition[] = []

    for (const [_, registry] of this.platforms) {
      for (const tool of registry.tools) {
        if (tool.metadata?.category === category) {
          definitions.push({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          })
        }
      }
    }

    return definitions
  }

  /**
   * Execute a tool
   */
  async executeTool(
    toolName: string,
    params: Record<string, unknown>,
    context?: McpContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now()

    // Check for AI SDK tool first (direct execution path)
    const aiSdkTool = this.aiSdkTools.get(toolName)
    if (aiSdkTool) {
      try {
        const result = await aiSdkTool.execute(params)
        return {
          success: true,
          tool: toolName,
          data: result,
          duration: Date.now() - startTime,
        }
      } catch (error) {
        return {
          success: false,
          tool: toolName,
          error: {
            code: 'EXECUTION_ERROR',
            message: error instanceof Error ? error.message : String(error),
          },
          duration: Date.now() - startTime,
        }
      }
    }

    // Find tool in index (traditional client-method pattern)
    const toolInfo = this.toolIndex.get(toolName)
    if (!toolInfo) {
      return {
        success: false,
        tool: toolName,
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Tool not found: ${toolName}`,
          statusCode: 404,
        },
        duration: Date.now() - startTime,
      }
    }

    const { platform, entry } = toolInfo
    const registry = this.platforms.get(platform)

    // If no registry (AI SDK tools that weren't in aiSdkTools map), error
    if (!registry) {
      return {
        success: false,
        tool: toolName,
        error: {
          code: 'PLATFORM_NOT_FOUND',
          message: `Platform not found for tool: ${toolName}`,
          statusCode: 404,
        },
        duration: Date.now() - startTime,
      }
    }

    try {
      // Transform params if needed
      const transformedParams = entry.transformParams
        ? entry.transformParams(params, context)
        : params

      // Execute the method on the client
      const method = registry.client[entry.method] as Function

      // If transformParams returned an array, spread it as multiple arguments
      // Otherwise pass as single argument (object or primitive)
      const result = Array.isArray(transformedParams)
        ? await method.apply(registry.client, transformedParams)
        : await method.call(registry.client, transformedParams)

      // Transform result if needed
      const finalResult = entry.transformResult ? entry.transformResult(result) : result

      // Check if it's a Result<T> type
      if (finalResult && typeof finalResult === 'object' && 'success' in finalResult) {
        return {
          success: finalResult.success,
          tool: toolName,
          data: finalResult.success ? finalResult.data : undefined,
          error: finalResult.success
            ? undefined
            : {
                code: finalResult.error?.code || 'EXECUTION_FAILED',
                message: finalResult.error?.message || 'Tool execution failed',
              },
          duration: Date.now() - startTime,
        }
      }

      // Direct result
      return {
        success: true,
        tool: toolName,
        data: finalResult,
        duration: Date.now() - startTime,
      }
    } catch (error) {
      return {
        success: false,
        tool: toolName,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
        duration: Date.now() - startTime,
      }
    }
  }

  /**
   * Get tool metadata
   */
  getToolMetadata(toolName: string) {
    const toolInfo = this.toolIndex.get(toolName)
    return toolInfo?.entry.metadata
  }

  /**
   * Get registry stats
   */
  getStats() {
    const stats = {
      platforms: this.platforms.size + this.getAiSdkPlatformCount(),
      totalTools: this.toolIndex.size,
      byPlatform: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
    }

    // Count all tools from toolIndex (includes both platform and AI SDK tools)
    for (const [_, toolInfo] of this.toolIndex) {
      const platform = toolInfo.platform
      stats.byPlatform[platform] = (stats.byPlatform[platform] || 0) + 1

      const category = toolInfo.entry.metadata?.category || 'uncategorized'
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1
    }

    return stats
  }

  /**
   * Count unique platforms from AI SDK tools (not in platforms map)
   */
  private getAiSdkPlatformCount(): number {
    const aiSdkPlatforms = new Set<string>()
    for (const [_, info] of this.aiSdkTools) {
      if (!this.platforms.has(info.platform)) {
        aiSdkPlatforms.add(info.platform)
      }
    }
    return aiSdkPlatforms.size
  }
}

// ============================================================================
// Global Registry Instance
// ============================================================================

export const registry = new RegistryManager()

