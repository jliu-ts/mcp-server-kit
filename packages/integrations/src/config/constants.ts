/**
 * MCP Server Kit - Constants
 *
 * Standalone constants for the MCP integrations package.
 */

export const API = {
  /** Default page size for list endpoints */
  defaultPageSize: 20,

  /** Maximum page size allowed */
  maxPageSize: 100,

  /** Default timeout for API requests (ms) */
  defaultTimeout: 30_000,

  /** Maximum request body size (bytes) */
  maxBodySize: 10 * 1024 * 1024, // 10MB

  /** Rate limit window (ms) */
  rateLimitWindow: 60_000,

  /** Default rate limit per window */
  defaultRateLimit: 100,
} as const;
