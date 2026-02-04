/**
 * MCP (Model Context Protocol) Streamable HTTP Handler
 *
 * Registry-based implementation with auto-discovery.
 * Implements MCP 2025-11-25 spec with Streamable HTTP transport.
 *
 * Transport:
 * - POST /mcp/message → JSON-RPC messages (client → server)
 * - GET /mcp → Streamable HTTP stream (server → client)
 *
 * Protocol: JSON-RPC 2.0 over Streamable HTTP
 * Spec: https://modelcontextprotocol.io/specification/2025-11-25
 */

import { registry } from "../core/registry";
import type { McpToolDefinition } from "../core/types";
import { Env } from "../index";

// MCP Protocol Constants
const MCP_PROTOCOL_VERSION = "2025-11-25";
const SUPPORTED_PROTOCOL_VERSIONS = [
  "2025-11-25",
  "2025-06-18",
  "2025-03-26",
  "2024-11-05",
];

// Session store (in production, use KV or Durable Objects)
const sessions = new Map<string, { createdAt: number; lastEventId: number }>();

// JSON-RPC 2.0 types
interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface McpServerCapabilities {
  tools?: {};
  resources?: {};
  prompts?: {};
}

/**
 * Generate cryptographically secure session ID
 */
function generateSessionId(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate Origin header for DNS rebinding protection
 */
function validateOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get("Origin");

  // No origin header = same-origin request (allowed)
  if (!origin) return true;

  // Allow localhost for development
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) return true;

  // Allow your domains and known AI clients
  // TODO: Update these for your deployment
  const allowedOrigins = [
    // 'https://your-mcp-server.workers.dev',
    // 'https://your-domain.com',
    "https://claude.ai",
    "https://chat.openai.com",
    "https://chatgpt.com",
    "https://platform.openai.com",
    "https://cursor.sh",
    "vscode://", // VS Code extensions
    "vscode-webview://", // VS Code webviews
    "file://", // Electron apps (Claude Code)
    "app://", // Electron apps
  ];

  return allowedOrigins.some((allowed) => origin.startsWith(allowed));
}

/**
 * Validate MCP-Protocol-Version header
 */
function validateProtocolVersion(request: Request): {
  valid: boolean;
  version: string;
} {
  const version = request.headers.get("MCP-Protocol-Version") || "2025-03-26";
  return {
    valid: SUPPORTED_PROTOCOL_VERSIONS.includes(version),
    version,
  };
}

/**
 * Validate session ID
 */
function validateSession(request: Request): {
  valid: boolean;
  sessionId: string | null;
} {
  const sessionId = request.headers.get("MCP-Session-Id");
  if (!sessionId) return { valid: true, sessionId: null }; // No session yet

  const session = sessions.get(sessionId);
  if (!session) return { valid: false, sessionId };

  // Session expires after 1 hour
  if (Date.now() - session.createdAt > 3600000) {
    sessions.delete(sessionId);
    return { valid: false, sessionId };
  }

  return { valid: true, sessionId };
}

// Get tools from registry (for backwards compatibility)
export function getMcpTools(): McpToolDefinition[] {
  return registry.getAllToolDefinitions();
}

/**
 * Format stream message (SSE format for Streamable HTTP transport)
 */
function sseMessage(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Format JSON-RPC response
 */
function jsonRpcResponse(
  id: string | number | null,
  result: unknown,
): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

function jsonRpcError(
  id: string | number | null,
  code: number,
  message: string,
): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    error: { code, message },
  };
}

/**
 * Handle MCP protocol messages
 * Returns response and optional session ID for new sessions
 */
export async function handleMcpMessage(
  request: JsonRpcRequest,
  env: Env,
  toolHandler: (
    tool: string,
    params: Record<string, unknown>,
  ) => Promise<unknown>,
  existingSessionId?: string | null,
): Promise<{ response: JsonRpcResponse; sessionId?: string }> {
  const { id, method, params } = request;

  switch (method) {
    case "initialize":
      // Client initializing connection - create new session
      const newSessionId = generateSessionId();
      sessions.set(newSessionId, { createdAt: Date.now(), lastEventId: 0 });

      // Negotiate protocol version
      const clientVersion = (params as { protocolVersion?: string })
        ?.protocolVersion;
      const negotiatedVersion =
        clientVersion && SUPPORTED_PROTOCOL_VERSIONS.includes(clientVersion)
          ? clientVersion
          : MCP_PROTOCOL_VERSION;

      return {
        response: jsonRpcResponse(id, {
          protocolVersion: negotiatedVersion,
          capabilities: {
            tools: {},
            // Future: Add resources, prompts when implemented
          } as McpServerCapabilities,
          serverInfo: {
            name: "mcp-server", // TODO: Update for your deployment
            version: "2.0.0",
          },
        }),
        sessionId: newSessionId,
      };

    case "initialized":
      // Client confirming initialization
      return { response: jsonRpcResponse(id, {}) };

    case "tools/list":
      // Return available tools from registry
      return {
        response: jsonRpcResponse(id, {
          tools: registry.getAllToolDefinitions(),
        }),
      };

    case "tools/call":
      // Execute a tool
      const toolParams = params as {
        name: string;
        arguments?: Record<string, unknown>;
      };
      if (!toolParams?.name) {
        return { response: jsonRpcError(id, -32602, "Missing tool name") };
      }

      try {
        const result = await toolHandler(
          toolParams.name,
          toolParams.arguments || {},
        );
        return {
          response: jsonRpcResponse(id, {
            content: [
              {
                type: "text",
                text:
                  typeof result === "string"
                    ? result
                    : JSON.stringify(result, null, 2),
              },
            ],
          }),
        };
      } catch (err) {
        return {
          response: jsonRpcError(id, -32603, `Tool execution failed: ${err}`),
        };
      }

    case "ping":
      return { response: jsonRpcResponse(id, {}) };

    case "notifications/cancelled":
      // Client cancelled a request - acknowledge
      return { response: jsonRpcResponse(id, {}) };

    default:
      return {
        response: jsonRpcError(id, -32601, `Method not found: ${method}`),
      };
  }
}

/**
 * Create Streamable HTTP response for MCP endpoint (GET /mcp)
 * Implements 2025-11-25 spec with session management and resumability
 *
 * Returns a stream for server→client messages (Streamable HTTP transport, 2025-11-25 spec)
 */
export function createMcpStreamHandler(
  env: Env,
  toolHandler: (
    tool: string,
    params: Record<string, unknown>,
  ) => Promise<unknown>,
) {
  const encoder = new TextEncoder();

  return (request: Request): Response => {
    // Validate Origin header (security requirement)
    if (!validateOrigin(request, env)) {
      return new Response(
        JSON.stringify(jsonRpcError(null, -32600, "Origin not allowed")),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate session if provided (lenient - allow stateless mode)
    const sessionValidation = validateSession(request);
    // Note: We don't reject invalid sessions to support stateless clients like OpenAI

    // Get Last-Event-ID for resumability
    const lastEventId = request.headers.get("Last-Event-ID");
    let eventCounter = lastEventId ? parseInt(lastEventId, 10) + 1 : 1;

    const stream = new ReadableStream({
      async start(controller) {
        // Send initial event with ID for resumability (per 2025 spec)
        const initialEvent = `id: ${eventCounter}\ndata: \n\n`;
        controller.enqueue(encoder.encode(initialEvent));
        eventCounter++;

        // Send connected status
        controller.enqueue(
          encoder.encode(
            `id: ${eventCounter}\nevent: open\ndata: ${JSON.stringify({ status: "connected", protocolVersion: MCP_PROTOCOL_VERSION })}\n\n`,
          ),
        );
        eventCounter++;

        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(
              encoder.encode(
                `id: ${eventCounter}\nevent: ping\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`,
              ),
            );
            eventCounter++;
          } catch {
            clearInterval(pingInterval);
          }
        }, 30000);

        // Update session's last event ID
        if (sessionValidation.sessionId) {
          const session = sessions.get(sessionValidation.sessionId);
          if (session) {
            session.lastEventId = eventCounter;
          }
        }
      },
    });

    const headers: Record<string, string> = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
      "Access-Control-Allow-Headers":
        "Content-Type, X-API-Key, Authorization, MCP-Session-Id, MCP-Protocol-Version",
      "Access-Control-Expose-Headers": "MCP-Session-Id",
    };

    // Include session ID in response if we have one
    if (sessionValidation.sessionId) {
      headers["MCP-Session-Id"] = sessionValidation.sessionId;
    }

    return new Response(stream, { headers });
  };
}

/**
 * Handle MCP message POST endpoint (POST /mcp/message)
 * Implements 2025-11-25 spec with full validation
 */
export async function handleMcpMessagePost(
  request: Request,
  env: Env,
  toolHandler: (
    tool: string,
    params: Record<string, unknown>,
  ) => Promise<unknown>,
): Promise<Response> {
  // Validate Origin header (security requirement)
  if (!validateOrigin(request, env)) {
    return new Response(
      JSON.stringify(jsonRpcError(null, -32600, "Origin not allowed")),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Validate protocol version
  const protocolValidation = validateProtocolVersion(request);
  if (!protocolValidation.valid) {
    return new Response(
      JSON.stringify(
        jsonRpcError(
          null,
          -32600,
          `Unsupported protocol version: ${protocolValidation.version}`,
        ),
      ),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Validate session if provided (lenient - allow stateless mode)
  const sessionValidation = validateSession(request);
  // Note: We don't reject invalid sessions to support stateless clients like OpenAI

  try {
    const body = (await request.json()) as JsonRpcRequest;
    const { response, sessionId } = await handleMcpMessage(
      body,
      env,
      toolHandler,
      sessionValidation.sessionId,
    );

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
      "Access-Control-Allow-Headers":
        "Content-Type, X-API-Key, Authorization, MCP-Session-Id, MCP-Protocol-Version",
      "Access-Control-Expose-Headers": "MCP-Session-Id",
    };

    // Include session ID in response header (per 2025 spec)
    if (sessionId) {
      headers["MCP-Session-Id"] = sessionId;
    } else if (sessionValidation.sessionId) {
      headers["MCP-Session-Id"] = sessionValidation.sessionId;
    }

    return new Response(JSON.stringify(response), { headers });
  } catch (err) {
    return new Response(
      JSON.stringify(jsonRpcError(null, -32700, "Parse error")),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

/**
 * Handle session deletion (DELETE /mcp)
 * Per 2025-11-25 spec, client can request session termination
 *
 * NOTE: Returns 204 even for unknown sessions to support stateless clients
 * like OpenAI/ChatGPT that send DELETE before session is fully established.
 */
export async function handleMcpDelete(
  request: Request,
  env: Env,
): Promise<Response> {
  const sessionId = request.headers.get("MCP-Session-Id");

  // Delete session if it exists (no-op if it doesn't)
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
  }

  // Always return 204 - stateless-friendly
  // This prevents OpenAI's "Session terminated" error
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
      "Access-Control-Allow-Headers":
        "Content-Type, X-API-Key, Authorization, MCP-Session-Id, MCP-Protocol-Version",
    },
  });
}

// Export validation functions for use in main index.ts
export { validateOrigin, validateProtocolVersion, validateSession };
