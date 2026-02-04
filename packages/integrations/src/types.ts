/**
 * Shared Types for Integration Clients
 *
 * All clients return Result<T, IntegrationError> for consistent error handling.
 */

// ============================================================================
// Result Type
// ============================================================================

import { API } from "./config/constants";
import { type Result as BaseResult, ok as baseOk } from "./config/result";

/**
 * Integration-specific error type.
 * Uses `status` (optional) instead of `statusCode` for HTTP-agnostic integrations.
 */
export interface IntegrationError {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

/**
 * Result type for integration clients.
 */
export type Result<T> = BaseResult<T, IntegrationError>;

/**
 * Re-export ok constructor.
 */
export const ok: <T>(data: T) => Result<T> = baseOk;

/**
 * Create a failure result with IntegrationError.
 */
export function fail(
  code: string,
  message: string,
  status?: number,
  details?: unknown,
): Result<never> {
  return { success: false, error: { code, message, status, details } };
}

// ============================================================================
// Client Configuration
// ============================================================================

export interface ClientConfig {
  /** Request timeout in ms (default: API.defaultTimeout) */
  timeout?: number;
  /** Custom fetch implementation (for testing or edge runtimes) */
  fetch?: typeof fetch;
  /** Enable debug logging */
  debug?: boolean;
}

// ============================================================================
// Pagination
// ============================================================================

export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  cursor?: string;
  total?: number;
}

// ============================================================================
// GraphQL Helpers
// ============================================================================

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
}

export async function graphqlRequest<T>(
  url: string,
  query: string,
  variables: Record<string, unknown> | undefined,
  headers: Record<string, string>,
  fetchFn: typeof fetch = fetch,
  timeout: number = API.defaultTimeout,
): Promise<Result<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetchFn(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return fail(
        "HTTP_ERROR",
        `API returned ${response.status}: ${errorText}`,
        response.status,
      );
    }

    const json = (await response.json()) as GraphQLResponse<T>;

    if (json.errors && json.errors.length > 0) {
      const messages = json.errors.map((e) => e.message).join(", ");
      return fail("GRAPHQL_ERROR", messages, 400, json.errors);
    }

    if (!json.data) {
      return fail("NO_DATA", "Response contained no data");
    }

    return ok(json.data);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return fail("TIMEOUT", `Request timed out after ${timeout}ms`);
      }
      return fail("NETWORK_ERROR", error.message);
    }

    return fail("UNKNOWN_ERROR", String(error));
  }
}
