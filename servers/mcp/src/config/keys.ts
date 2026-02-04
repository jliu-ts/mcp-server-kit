/**
 * API Key Configuration
 *
 * SINGLE SOURCE OF TRUTH for MCP API keys.
 * All error messages, docs, and endpoints reference this file.
 *
 * TODO: Update these values for your deployment
 */

/** Primary API key for all MCP access */
export const API_KEY = "mcp_prod_platform";

/** @deprecated Use API_KEY instead */
export const API_KEYS = {
  production: API_KEY,
} as const;

/** Base URL for MCP server - UPDATE THIS */
export const MCP_BASE_URL = "https://your-mcp-server.workers.dev";

/** Auth help endpoint */
export const AUTH_HELP_ENDPOINT = "/auth/help";

/** Full URL to auth help */
export const AUTH_HELP_URL = `${MCP_BASE_URL}${AUTH_HELP_ENDPOINT}`;

/** Documentation URL - UPDATE THIS */
export const AUTH_DOCS_URL = "https://your-docs-url.com/api/authentication";

/**
 * Get formatted list of valid keys for error messages
 */
export function getValidKeysMessage(): string {
  return API_KEY;
}

/**
 * Get auth help response object
 */
export function getAuthHelpResponse() {
  return {
    message: "MCP Server Authentication",
    key: API_KEY,
    usage: {
      header: "X-API-Key",
      example: `curl -H "X-API-Key: ${API_KEY}" ${MCP_BASE_URL}/tools/execute`,
    },
    docs: AUTH_DOCS_URL,
    rate_limit: "100 requests per minute",
  };
}
