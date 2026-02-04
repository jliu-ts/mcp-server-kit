/**
 * Result Type - Discriminated Union for Type-Safe Error Handling
 *
 * Forces explicit error handling at compile time.
 * Every operation returns Result<T, E> instead of throwing.
 *
 * @example
 * const result = await someOperation()
 * if (!result.success) {
 *   return errorResponse(result.error.message, result.error.code)
 * }
 * return successResponse(result.data)
 */

// ============================================================================
// Core Result Type
// ============================================================================

/**
 * Discriminated union for success/failure results.
 * TypeScript forces checking `success` before accessing `data` or `error`.
 */
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Result with optional metadata (pagination, timing, etc.)
 */
export type ResultWithMeta<T, M, E = AppError> =
  | { success: true; data: T; meta: M }
  | { success: false; error: E }

// ============================================================================
// Error Types
// ============================================================================

export interface AppError {
  code: string
  message: string
  statusCode: number
  details?: Record<string, unknown>
}

// ============================================================================
// Result Constructors
// ============================================================================

/**
 * Create a success result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data }
}

/**
 * Create a success result with metadata
 */
export function okWithMeta<T, M>(data: T, meta: M): ResultWithMeta<T, M, never> {
  return { success: true, data, meta }
}

/**
 * Create a failure result
 */
export function err<E extends AppError>(error: E): Result<never, E> {
  return { success: false, error }
}

/**
 * Create a failure result with common error shape
 */
export function fail(
  code: string,
  message: string,
  statusCode = 500,
  details?: Record<string, unknown>
): Result<never, AppError> {
  return { success: false, error: { code, message, statusCode, details } }
}

// ============================================================================
// Result Utilities
// ============================================================================

/**
 * Unwrap a Result, throwing if it's an error
 * Use sparingly - prefer pattern matching
 */
export function unwrap<T, E extends AppError>(result: Result<T, E>): T {
  if (result.success) {
    return result.data
  }
  const error = new Error(result.error.message)
  ;(error as any).code = result.error.code
  ;(error as any).statusCode = result.error.statusCode
  throw error
}

/**
 * Unwrap a Result with a default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.success ? result.data : defaultValue
}

/**
 * Map a Result's success value
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (result.success) {
    return { success: true, data: fn(result.data) }
  }
  return result
}

/**
 * Map a Result's error value
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (!result.success) {
    return { success: false, error: fn(result.error) }
  }
  return result
}

/**
 * Chain Results (flatMap)
 */
export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return fn(result.data)
  }
  return result
}

/**
 * Execute multiple Results and collect successes
 * Returns first error if any fail
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const data: T[] = []
  for (const result of results) {
    if (!result.success) {
      return result
    }
    data.push(result.data)
  }
  return { success: true, data }
}

/**
 * Convert Promise to Result, catching any thrown errors
 */
export async function fromPromise<T>(
  promise: Promise<T>
): Promise<Result<T, AppError>> {
  try {
    const data = await promise
    return ok(data)
  } catch (error) {
    return fail(
      'PROMISE_ERROR',
      error instanceof Error ? error.message : String(error),
      500
    )
  }
}

/**
 * Convert try/catch to Result
 */
export function tryCatch<T>(fn: () => T): Result<T, AppError> {
  try {
    return ok(fn())
  } catch (error) {
    return fail(
      'CAUGHT_ERROR',
      error instanceof Error ? error.message : String(error),
      500
    )
  }
}

/**
 * Check if a value is a Result type
 */
export function isResult<T, E>(value: unknown): value is Result<T, E> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as any).success === 'boolean'
  )
}
