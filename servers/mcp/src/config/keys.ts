/**
 * API Key Configuration
 *
 * SINGLE SOURCE OF TRUTH for MCP API keys.
 * All error messages, docs, and endpoints reference this file.
 */

/** Primary API key for all MCP access */
export const API_KEY = 'mcp_prod_platform';

/** @deprecated Use API_KEY instead */
export const API_KEYS = {
  production: API_KEY,
} as const;

/** Base URL for MCP server */
export const MCP_BASE_URL = 'https://mcp.trendingsociety.com';

/** Auth help endpoint */
export const AUTH_HELP_ENDPOINT = '/auth/help';

/** Full URL to auth help */
export const AUTH_HELP_URL = `${MCP_BASE_URL}${AUTH_HELP_ENDPOINT}`;

/** Documentation URL */
export const AUTH_DOCS_URL = 'https://docs.trendingsociety.com/api/authentication';

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
    message: 'MCP Server Authentication',
    key: API_KEY,
    usage: {
      header: 'X-API-Key',
      example: `curl -H "X-API-Key: ${API_KEY}" https://mcp.trendingsociety.com/tools/execute`,
    },
    docs: AUTH_DOCS_URL,
    rate_limit: '100 requests per minute',
  };
}
