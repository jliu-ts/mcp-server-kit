/**
 * Linear Integration
 *
 * @example
 * import { LinearClient, createIssueValidated, LABEL_TAXONOMY } from '@trendingsociety/integrations/linear'
 *
 * const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })
 *
 * // Recommended: Use validated creation (enforces all standards)
 * const result = await createIssueValidated(linear, {
 *   title: 'Add user dashboard',
 *   team: 'Engineering',
 *   priority: 2,
 *   labels: ['Feature', 'platform', 'database'],
 *   description: 'Full description here...',
 * });
 *
 * // Or use the raw client for simple queries
 * const issues = await linear.listIssues({ team: 'Product' })
 */

// Core client
export { LinearClient, type LinearClientConfig } from './client.js';
export * from './types.js';

// Validation (Zero Hallucination Layer 5)
export * from './validation.js';

// Templates (Token-efficient description generation)
export * from './templates.js';

// Helpers (Validated operations + dedup)
export * from './helpers.js';

// AI SDK Tools (Single source of truth for MCP + Agents)
export * from './tools.js';
