/**
 * Linear API Types
 *
 * Type definitions for Linear GraphQL API responses.
 */

import { z } from 'zod'

// ============================================================================
// Zod Schemas (for runtime validation)
// ============================================================================

export const LinearUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
})

export const LinearTeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
})

export const LinearProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const LinearStateSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const LinearLabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
})

export const LinearCommentSchema = z.object({
  id: z.string(),
  body: z.string(),
  createdAt: z.string(),
  user: LinearUserSchema.optional(),
})

export const LinearIssueSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  title: z.string(),
  description: z.string().optional(),
  state: LinearStateSchema.optional(),
  assignee: LinearUserSchema.optional(),
  project: LinearProjectSchema.optional(),
  team: LinearTeamSchema.optional(),
  labels: z.object({ nodes: z.array(LinearLabelSchema) }).optional(),
  priority: z.number().optional(),
  estimate: z.number().optional(),
  url: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  comments: z.object({ nodes: z.array(LinearCommentSchema) }).optional(),
})

// ============================================================================
// TypeScript Types (inferred from Zod)
// ============================================================================

export type LinearUser = z.infer<typeof LinearUserSchema>
export type LinearTeam = z.infer<typeof LinearTeamSchema>
export type LinearProject = z.infer<typeof LinearProjectSchema>
export type LinearState = z.infer<typeof LinearStateSchema>
export type LinearLabel = z.infer<typeof LinearLabelSchema>
export type LinearComment = z.infer<typeof LinearCommentSchema>
export type LinearIssue = z.infer<typeof LinearIssueSchema>

// ============================================================================
// Input Types
// ============================================================================

export interface ListIssuesParams {
  /** Filter by project name (partial match) */
  project?: string
  /** Filter by status name (partial match) */
  status?: string
  /** Filter by assignee name (partial match) */
  assignee?: string
  /** Filter by team name (partial match) */
  team?: string
  /** Max issues to return (default: 50) */
  limit?: number
}

export interface GetIssueParams {
  /** Issue identifier (e.g., "PRD-108") or UUID */
  id: string
}

export interface CreateIssueParams {
  /** Issue title (required) */
  title: string
  /** Team name (required) */
  team: string
  /** Issue description (markdown) */
  description?: string
  /** Project name */
  project?: string
  /** Assignee name */
  assignee?: string
  /** Priority (0-4, 0=no priority, 1=urgent, 4=low) */
  priority?: number
  /** Label names */
  labels?: string[]
}

export interface UpdateIssueParams {
  /** Issue identifier or UUID (required) */
  id: string
  /** New title */
  title?: string
  /** New description */
  description?: string
  /** New status name */
  status?: string
  /** New assignee name */
  assignee?: string
  /** New priority */
  priority?: number
  /** New label names (replaces existing) */
  labels?: string[]
}

export interface CreateCommentParams {
  /** Issue identifier or UUID (required) */
  id: string
  /** Comment body (markdown) */
  body: string
}

// ============================================================================
// Response Types
// ============================================================================

export interface ListIssuesResponse {
  count: number
  filters: {
    project?: string
    status?: string
    assignee?: string
    team?: string
    query?: string  // Used by searchIssues
  }
  issues: LinearIssue[]
}

export interface CreateIssueResponse {
  issue: {
    id: string
    identifier: string
    title: string
    url: string
  }
}

export interface UpdateIssueResponse {
  issue: {
    id: string
    identifier: string
    title: string
    state?: { name: string }
    assignee?: { name: string }
  }
}

export interface CreateCommentResponse {
  comment: {
    id: string
    body: string
    createdAt: string
    user?: { name: string }
  }
}
