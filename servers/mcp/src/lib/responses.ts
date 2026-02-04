/**
 * Shared response helpers for MCP Server
 * Updated for MCP 2025-11-25 spec
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization, MCP-Session-Id, MCP-Protocol-Version, Last-Event-ID',
  'Access-Control-Expose-Headers': 'MCP-Session-Id',
};

export function success<T>(data: T): Response {
  return Response.json(
    { success: true, data },
    { headers: corsHeaders }
  );
}

export function error(message: string, status: number = 400): Response {
  return Response.json(
    { success: false, error: message },
    { status, headers: corsHeaders }
  );
}

export function toolResult<T>(tool: string, data: T): Response {
  return Response.json(
    { success: true, tool, data },
    { headers: corsHeaders }
  );
}

export function toolError(tool: string, message: string, status: number = 400): Response {
  return Response.json(
    { success: false, tool, error: message },
    { status, headers: corsHeaders }
  );
}
