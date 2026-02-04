/**
 * Linear AI SDK Tools
 *
 * AI SDK 6 native tool definitions for Linear operations.
 * Single source of truth - used by both MCP server and AI SDK agents.
 *
 * @example
 * import { createLinearTools } from '@trendingsociety/integrations/linear'
 * import { LinearClient } from '@trendingsociety/integrations/linear'
 *
 * const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })
 * const tools = createLinearTools(client)
 *
 * // Use with AI SDK agent
 * const agent = new ToolLoopAgent({
 *   tools: { ...tools },
 * })
 */

import { tool } from 'ai'
import { z } from 'zod'
import type { LinearClient } from './client.js'

// ============================================================================
// Input Schemas (Zod)
// ============================================================================

export const ListIssuesInputSchema = z.object({
  team: z.string().optional().describe('Filter by team name (partial match)'),
  project: z.string().optional().describe('Filter by project name (partial match)'),
  status: z.string().optional().describe('Filter by status name (partial match)'),
  assignee: z.string().optional().describe('Filter by assignee name (partial match)'),
  limit: z.number().optional().default(50).describe('Max issues to return'),
})

export const GetIssueInputSchema = z.object({
  id: z.string().describe('Issue identifier (e.g., "ENG-246") or UUID'),
})

export const CreateIssueInputSchema = z.object({
  title: z.string().describe('Issue title (required)'),
  team: z.string().describe('Team name (required)'),
  description: z.string().optional().describe('Issue description (markdown)'),
  project: z.string().optional().describe('Project name'),
  assignee: z.string().optional().describe('Assignee name'),
  priority: z.number().min(0).max(4).optional().describe('Priority: 0=none, 1=urgent, 2=high, 3=medium, 4=low'),
  labels: z.array(z.string()).optional().describe('Label names to apply'),
})

export const UpdateIssueInputSchema = z.object({
  id: z.string().describe('Issue identifier (e.g., "ENG-246") or UUID'),
  title: z.string().optional().describe('New title'),
  description: z.string().optional().describe('New description'),
  status: z.string().optional().describe('New status name'),
  assignee: z.string().optional().describe('New assignee name'),
  priority: z.number().min(0).max(4).optional().describe('New priority'),
  labels: z.array(z.string()).optional().describe('New labels (replaces existing)'),
})

export const SearchIssuesInputSchema = z.object({
  query: z.string().describe('Search query text'),
  limit: z.number().optional().default(50).describe('Max results to return'),
})

export const CreateCommentInputSchema = z.object({
  id: z.string().describe('Issue identifier (e.g., "ENG-246") or UUID'),
  body: z.string().describe('Comment body (markdown)'),
})

export const ListTeamsInputSchema = z.object({
  limit: z.number().optional().default(50).describe('Max teams to return'),
})

export const ListProjectsInputSchema = z.object({
  state: z.string().optional().describe('Filter by project state'),
  limit: z.number().optional().default(50).describe('Max projects to return'),
})

export const ListIssueLabelsInputSchema = z.object({
  team: z.string().optional().describe('Filter by team name'),
  limit: z.number().optional().default(50).describe('Max labels to return'),
})

export const ListIssueStatusesInputSchema = z.object({
  team: z.string().optional().describe('Filter by team name'),
  type: z.string().optional().describe('Filter by state type'),
})

export const ListUsersInputSchema = z.object({
  limit: z.number().optional().default(50).describe('Max users to return'),
})

export const GetUserInputSchema = z.object({
  id: z.string().describe('User UUID'),
})

export const ListCommentsInputSchema = z.object({
  issueId: z.string().describe('Issue identifier (e.g., "ENG-246") or UUID'),
  limit: z.number().optional().default(50).describe('Max comments to return'),
})

export const GetIssueStatusInputSchema = z.object({
  id: z.string().describe('Workflow state UUID'),
})

export const ListProjectLabelsInputSchema = z.object({
  projectId: z.string().describe('Project UUID'),
  limit: z.number().optional().default(50).describe('Max labels to return'),
})

export const ListDocumentsInputSchema = z.object({
  limit: z.number().optional().default(50).describe('Max documents to return'),
})

export const GetDocumentInputSchema = z.object({
  id: z.string().describe('Document UUID'),
})

export const CreateDocumentInputSchema = z.object({
  title: z.string().describe('Document title (required)'),
  content: z.string().optional().describe('Document content (markdown)'),
  projectId: z.string().optional().describe('Project UUID to associate with'),
})

export const UpdateDocumentInputSchema = z.object({
  id: z.string().describe('Document UUID'),
  title: z.string().optional().describe('New title'),
  content: z.string().optional().describe('New content (markdown)'),
})

export const SearchDocumentationInputSchema = z.object({
  query: z.string().describe('Search query text'),
  limit: z.number().optional().default(50).describe('Max results to return'),
})

// Issue Lifecycle Schemas
export const ArchiveIssueInputSchema = z.object({
  id: z.string().describe('Issue identifier (e.g., "ENG-246") or UUID'),
})

export const UnarchiveIssueInputSchema = z.object({
  id: z.string().describe('Issue identifier (e.g., "ENG-246") or UUID'),
})

export const DeleteIssueInputSchema = z.object({
  id: z.string().describe('Issue identifier (e.g., "ENG-246") or UUID'),
})

export const GetIssueHistoryInputSchema = z.object({
  id: z.string().describe('Issue identifier (e.g., "ENG-246") or UUID'),
  limit: z.number().optional().default(50).describe('Max history entries to return'),
})

// Comment Management Schemas
export const UpdateCommentInputSchema = z.object({
  id: z.string().describe('Comment UUID'),
  body: z.string().describe('New comment body (markdown)'),
})

export const DeleteCommentInputSchema = z.object({
  id: z.string().describe('Comment UUID'),
})

// Attachment Schemas
export const ListAttachmentsInputSchema = z.object({
  issueId: z.string().describe('Issue identifier (e.g., "ENG-246") or UUID'),
  limit: z.number().optional().default(50).describe('Max attachments to return'),
})

export const CreateAttachmentInputSchema = z.object({
  issueId: z.string().describe('Issue identifier (e.g., "ENG-246") or UUID'),
  url: z.string().describe('URL of the attachment'),
  title: z.string().optional().describe('Attachment title'),
})

// Sub-issue Schemas
export const ListSubIssuesInputSchema = z.object({
  issueId: z.string().describe('Parent issue identifier (e.g., "ENG-246") or UUID'),
  limit: z.number().optional().default(50).describe('Max sub-issues to return'),
})

export const CreateSubIssueInputSchema = z.object({
  parentId: z.string().describe('Parent issue identifier (e.g., "ENG-246") or UUID'),
  title: z.string().describe('Sub-issue title'),
  description: z.string().optional().describe('Sub-issue description (markdown)'),
})

// Issue Relation Schemas
export const ListIssueRelationsInputSchema = z.object({
  issueId: z.string().describe('Issue identifier (e.g., "ENG-246") or UUID'),
})

export const CreateIssueRelationInputSchema = z.object({
  issueId: z.string().describe('Issue identifier (e.g., "ENG-246") or UUID'),
  relatedIssueId: z.string().describe('Related issue identifier or UUID'),
  type: z.enum(['blocks', 'duplicate', 'related']).describe('Relation type'),
})

// Subscription Schemas
export const SubscribeToIssueInputSchema = z.object({
  id: z.string().describe('Issue identifier (e.g., "ENG-246") or UUID'),
})

export const UnsubscribeFromIssueInputSchema = z.object({
  id: z.string().describe('Issue identifier (e.g., "ENG-246") or UUID'),
})

// Project Lifecycle Schemas
export const ArchiveProjectInputSchema = z.object({
  id: z.string().describe('Project UUID'),
})

export const DeleteProjectInputSchema = z.object({
  id: z.string().describe('Project UUID'),
})

// Milestone Schemas
export const ListMilestonesInputSchema = z.object({
  projectId: z.string().describe('Project UUID'),
  limit: z.number().optional().default(50).describe('Max milestones to return'),
})

export const CreateMilestoneInputSchema = z.object({
  projectId: z.string().describe('Project UUID'),
  name: z.string().describe('Milestone name'),
  targetDate: z.string().optional().describe('Target date (ISO format)'),
  description: z.string().optional().describe('Milestone description'),
})

export const UpdateMilestoneInputSchema = z.object({
  id: z.string().describe('Milestone UUID'),
  name: z.string().optional().describe('New name'),
  targetDate: z.string().optional().describe('New target date'),
  description: z.string().optional().describe('New description'),
})

export const DeleteMilestoneInputSchema = z.object({
  id: z.string().describe('Milestone UUID'),
})

// Project Update Schemas
export const ListProjectUpdatesInputSchema = z.object({
  projectId: z.string().describe('Project UUID'),
  limit: z.number().optional().default(50).describe('Max updates to return'),
})

export const CreateProjectUpdateInputSchema = z.object({
  projectId: z.string().describe('Project UUID'),
  body: z.string().describe('Update body (markdown)'),
  health: z.enum(['onTrack', 'atRisk', 'offTrack']).optional().describe('Project health status'),
})

// Cycle Schemas
export const GetCycleInputSchema = z.object({
  id: z.string().describe('Cycle UUID'),
})

export const UpdateCycleInputSchema = z.object({
  id: z.string().describe('Cycle UUID'),
  name: z.string().optional().describe('New name'),
  startsAt: z.string().optional().describe('New start date'),
  endsAt: z.string().optional().describe('New end date'),
})

export const ArchiveCycleInputSchema = z.object({
  id: z.string().describe('Cycle UUID'),
})

// Webhook Schemas
export const ListWebhooksInputSchema = z.object({
  limit: z.number().optional().default(50).describe('Max webhooks to return'),
})

export const CreateWebhookInputSchema = z.object({
  url: z.string().describe('Webhook URL'),
  resourceTypes: z.array(z.string()).describe('Resource types to subscribe to (e.g., ["Issue", "Comment"])'),
  label: z.string().optional().describe('Webhook label'),
})

export const DeleteWebhookInputSchema = z.object({
  id: z.string().describe('Webhook UUID'),
})

// Initiative Schemas
export const ListInitiativesInputSchema = z.object({
  limit: z.number().optional().default(50).describe('Max initiatives to return'),
})

export const CreateInitiativeInputSchema = z.object({
  name: z.string().describe('Initiative name'),
  description: z.string().optional().describe('Initiative description'),
  targetDate: z.string().optional().describe('Target date (ISO format)'),
})

export const LinkProjectToInitiativeInputSchema = z.object({
  projectId: z.string().describe('Project UUID'),
  initiativeId: z.string().describe('Initiative UUID'),
})

// Team & Project Extended Schemas
export const GetTeamInputSchema = z.object({
  id: z.string().describe('Team ID or key'),
})

export const GetProjectInputSchema = z.object({
  id: z.string().describe('Project ID or name'),
})

export const CreateProjectInputSchema = z.object({
  name: z.string().describe('Project name'),
  teamIds: z.array(z.string()).describe('Team IDs'),
  description: z.string().optional().describe('Project description'),
  leadId: z.string().optional().describe('Project lead user ID'),
  state: z.enum(['planned', 'started', 'paused', 'completed', 'canceled']).optional().describe('Project state'),
  priority: z.number().min(0).max(4).optional().describe('Priority 0-4'),
  startDate: z.string().optional().describe('Start date (ISO 8601)'),
  targetDate: z.string().optional().describe('Target completion date'),
})

export const UpdateProjectInputSchema = z.object({
  id: z.string().describe('Project ID'),
  name: z.string().optional().describe('New name'),
  description: z.string().optional().describe('New description'),
  state: z.enum(['planned', 'started', 'paused', 'completed', 'canceled']).optional().describe('New state'),
  priority: z.number().min(0).max(4).optional().describe('New priority'),
  progress: z.number().min(0).max(100).optional().describe('Progress percentage (0-100)'),
  targetDate: z.string().optional().describe('New target date'),
})

// Cycle Extended Schemas
export const ListCyclesInputSchema = z.object({
  team: z.string().optional().describe('Filter by team name'),
  isActive: z.boolean().optional().describe('Filter active cycles'),
  limit: z.number().optional().default(50).describe('Max cycles to return'),
})

export const GetCurrentCycleInputSchema = z.object({
  team: z.string().describe('Team name (required)'),
})

export const CreateCycleInputSchema = z.object({
  teamId: z.string().describe('Team ID'),
  name: z.string().describe('Cycle name'),
  startsAt: z.string().describe('Start date (ISO 8601)'),
  endsAt: z.string().describe('End date (ISO 8601)'),
  description: z.string().optional().describe('Cycle description'),
})

// Label Extended Schemas
export const CreateIssueLabelInputSchema = z.object({
  name: z.string().describe('Label name'),
  team: z.string().describe('Team name or ID to scope label to'),
  color: z.string().optional().describe('Hex color (e.g., "#ff0000")'),
  description: z.string().optional().describe('An optional description of the label'),
})

// User Extended Schemas
export const GetViewerInputSchema = z.object({})

// ============================================================================
// Tool Factory
// ============================================================================

/**
 * Create AI SDK tools for Linear operations
 *
 * @param client - Initialized LinearClient instance
 * @returns Object containing all Linear tools
 */
export function createLinearTools(client: LinearClient) {
  return {
    // -------------------------------------------------------------------------
    // Issues
    // -------------------------------------------------------------------------

    linear_list_issues: tool({
      description: 'List Linear issues with optional filters for team, project, status, or assignee',
      inputSchema: ListIssuesInputSchema,
      execute: async (params) => {
        const result = await client.listIssues(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_get_issue: tool({
      description: 'Get a single Linear issue by identifier (e.g., ENG-246) or UUID, including comments',
      inputSchema: GetIssueInputSchema,
      execute: async (params) => {
        const result = await client.getIssue(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_create_issue: tool({
      description: 'Create a new Linear issue with title, team, and optional description/labels',
      inputSchema: CreateIssueInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.createIssue(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_update_issue: tool({
      description: 'Update an existing Linear issue (status, assignee, priority, etc.)',
      inputSchema: UpdateIssueInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.updateIssue(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_search_issues: tool({
      description: 'Search Linear issues by text query',
      inputSchema: SearchIssuesInputSchema,
      execute: async (params) => {
        const result = await client.searchIssues(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_create_comment: tool({
      description: 'Add a comment to a Linear issue',
      inputSchema: CreateCommentInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.createComment(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Teams & Projects
    // -------------------------------------------------------------------------

    linear_list_teams: tool({
      description: 'List all Linear teams in the workspace',
      inputSchema: ListTeamsInputSchema,
      execute: async (params) => {
        const result = await client.listTeams(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_get_team: tool({
      description: 'Get team details by ID or key',
      inputSchema: GetTeamInputSchema,
      execute: async (params) => {
        const result = await client.getTeam(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_list_projects: tool({
      description: 'List Linear projects with optional state filter',
      inputSchema: ListProjectsInputSchema,
      execute: async (params) => {
        const result = await client.listProjects(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_get_project: tool({
      description: 'Get project details by ID or name',
      inputSchema: GetProjectInputSchema,
      execute: async (params) => {
        const result = await client.getProject(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_create_project: tool({
      description: 'Create a new project',
      inputSchema: CreateProjectInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.createProject(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_update_project: tool({
      description: 'Update an existing project',
      inputSchema: UpdateProjectInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.updateProject(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Labels & States
    // -------------------------------------------------------------------------

    linear_list_issue_labels: tool({
      description: 'List available issue labels',
      inputSchema: ListIssueLabelsInputSchema,
      execute: async (params) => {
        const result = await client.listIssueLabels(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_create_issue_label: tool({
      description: 'Create a new issue label',
      inputSchema: CreateIssueLabelInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.createIssueLabel(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_list_issue_statuses: tool({
      description: 'List workflow states (statuses) for issues',
      inputSchema: ListIssueStatusesInputSchema,
      execute: async (params) => {
        const result = await client.listIssueStatuses(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Users
    // -------------------------------------------------------------------------

    linear_list_users: tool({
      description: 'List users in the Linear workspace',
      inputSchema: ListUsersInputSchema,
      execute: async (params) => {
        const result = await client.listUsers(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_get_user: tool({
      description: 'Get a single user by UUID',
      inputSchema: GetUserInputSchema,
      execute: async (params) => {
        const result = await client.getUser(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_get_viewer: tool({
      description: 'Get the current authenticated user',
      inputSchema: GetViewerInputSchema,
      execute: async () => {
        const result = await client.getViewer()
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Comments
    // -------------------------------------------------------------------------

    linear_list_comments: tool({
      description: 'List comments on a Linear issue',
      inputSchema: ListCommentsInputSchema,
      execute: async (params) => {
        const result = await client.listComments(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Issue Statuses
    // -------------------------------------------------------------------------

    linear_get_issue_status: tool({
      description: 'Get a workflow state (status) by UUID',
      inputSchema: GetIssueStatusInputSchema,
      execute: async (params) => {
        const result = await client.getIssueStatus(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Project Labels
    // -------------------------------------------------------------------------

    linear_list_project_labels: tool({
      description: 'List labels associated with a project',
      inputSchema: ListProjectLabelsInputSchema,
      execute: async (params) => {
        const result = await client.listProjectLabels(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Documents
    // -------------------------------------------------------------------------

    linear_list_documents: tool({
      description: 'List documents in the Linear workspace',
      inputSchema: ListDocumentsInputSchema,
      execute: async (params) => {
        const result = await client.listDocuments(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_get_document: tool({
      description: 'Get a single document by UUID',
      inputSchema: GetDocumentInputSchema,
      execute: async (params) => {
        const result = await client.getDocument(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_create_document: tool({
      description: 'Create a new document in Linear',
      inputSchema: CreateDocumentInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.createDocument(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_update_document: tool({
      description: 'Update an existing document',
      inputSchema: UpdateDocumentInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.updateDocument(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_search_documentation: tool({
      description: 'Search documents by text query',
      inputSchema: SearchDocumentationInputSchema,
      execute: async (params) => {
        const result = await client.searchDocumentation(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Issue Lifecycle
    // -------------------------------------------------------------------------

    linear_archive_issue: tool({
      description: 'Archive an issue',
      inputSchema: ArchiveIssueInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.archiveIssue(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_unarchive_issue: tool({
      description: 'Unarchive an issue',
      inputSchema: UnarchiveIssueInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.unarchiveIssue(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_delete_issue: tool({
      description: 'Permanently delete an issue',
      inputSchema: DeleteIssueInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.deleteIssue(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Comment Management
    // -------------------------------------------------------------------------

    linear_update_comment: tool({
      description: 'Update an existing comment',
      inputSchema: UpdateCommentInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.updateComment(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_delete_comment: tool({
      description: 'Delete a comment',
      inputSchema: DeleteCommentInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.deleteComment(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Attachments
    // -------------------------------------------------------------------------

    linear_list_attachments: tool({
      description: 'List attachments on an issue',
      inputSchema: ListAttachmentsInputSchema,
      execute: async (params) => {
        const result = await client.listAttachments(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_create_attachment: tool({
      description: 'Add an attachment to an issue',
      inputSchema: CreateAttachmentInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.createAttachment(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Sub-issues
    // -------------------------------------------------------------------------

    linear_list_sub_issues: tool({
      description: 'List sub-issues (children) of an issue',
      inputSchema: ListSubIssuesInputSchema,
      execute: async (params) => {
        const result = await client.listSubIssues(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_create_sub_issue: tool({
      description: 'Create a sub-issue under a parent issue',
      inputSchema: CreateSubIssueInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.createSubIssue(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Issue Relations
    // -------------------------------------------------------------------------

    linear_list_issue_relations: tool({
      description: 'List relations for an issue (blocks, duplicates, related)',
      inputSchema: ListIssueRelationsInputSchema,
      execute: async (params) => {
        const result = await client.listIssueRelations(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_create_issue_relation: tool({
      description: 'Create a relation between two issues',
      inputSchema: CreateIssueRelationInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.createIssueRelation(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Issue Subscriptions
    // -------------------------------------------------------------------------

    linear_subscribe_to_issue: tool({
      description: 'Subscribe to issue notifications',
      inputSchema: SubscribeToIssueInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.subscribeToIssue(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_unsubscribe_from_issue: tool({
      description: 'Unsubscribe from issue notifications',
      inputSchema: UnsubscribeFromIssueInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.unsubscribeFromIssue(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_get_issue_history: tool({
      description: 'Get activity history for an issue (changes to title, status, assignee, priority, etc.)',
      inputSchema: GetIssueHistoryInputSchema,
      execute: async (params) => {
        const result = await client.getIssueHistory(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Project Lifecycle
    // -------------------------------------------------------------------------

    linear_archive_project: tool({
      description: 'Archive a project',
      inputSchema: ArchiveProjectInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.archiveProject(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_delete_project: tool({
      description: 'Permanently delete a project',
      inputSchema: DeleteProjectInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.deleteProject(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Milestones
    // -------------------------------------------------------------------------

    linear_list_milestones: tool({
      description: 'List milestones for a project',
      inputSchema: ListMilestonesInputSchema,
      execute: async (params) => {
        const result = await client.listMilestones(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_create_milestone: tool({
      description: 'Create a milestone for a project',
      inputSchema: CreateMilestoneInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.createMilestone(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_update_milestone: tool({
      description: 'Update an existing milestone',
      inputSchema: UpdateMilestoneInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.updateMilestone(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_delete_milestone: tool({
      description: 'Delete a milestone',
      inputSchema: DeleteMilestoneInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.deleteMilestone(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Project Updates
    // -------------------------------------------------------------------------

    linear_list_project_updates: tool({
      description: 'List status updates for a project',
      inputSchema: ListProjectUpdatesInputSchema,
      execute: async (params) => {
        const result = await client.listProjectUpdates(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_create_project_update: tool({
      description: 'Create a status update for a project',
      inputSchema: CreateProjectUpdateInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.createProjectUpdate(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Cycles (Extended)
    // -------------------------------------------------------------------------

    linear_list_cycles: tool({
      description: 'List cycles (sprints) with optional team filter',
      inputSchema: ListCyclesInputSchema,
      execute: async (params) => {
        const result = await client.listCycles(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_get_current_cycle: tool({
      description: 'Get the currently active cycle for a team',
      inputSchema: GetCurrentCycleInputSchema,
      execute: async (params) => {
        const result = await client.getCurrentCycle(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_create_cycle: tool({
      description: 'Create a new cycle (sprint)',
      inputSchema: CreateCycleInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.createCycle(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_get_cycle: tool({
      description: 'Get a cycle by UUID',
      inputSchema: GetCycleInputSchema,
      execute: async (params) => {
        const result = await client.getCycle(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_update_cycle: tool({
      description: 'Update an existing cycle',
      inputSchema: UpdateCycleInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.updateCycle(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_archive_cycle: tool({
      description: 'Archive a cycle',
      inputSchema: ArchiveCycleInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.archiveCycle(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Webhooks
    // -------------------------------------------------------------------------

    linear_list_webhooks: tool({
      description: 'List webhooks in the workspace',
      inputSchema: ListWebhooksInputSchema,
      execute: async (params) => {
        const result = await client.listWebhooks(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_create_webhook: tool({
      description: 'Create a webhook for real-time notifications',
      inputSchema: CreateWebhookInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.createWebhook(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_delete_webhook: tool({
      description: 'Delete a webhook',
      inputSchema: DeleteWebhookInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.deleteWebhook(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    // -------------------------------------------------------------------------
    // Initiatives
    // -------------------------------------------------------------------------

    linear_list_initiatives: tool({
      description: 'List initiatives (OKRs/goals)',
      inputSchema: ListInitiativesInputSchema,
      execute: async (params) => {
        const result = await client.listInitiatives(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_create_initiative: tool({
      description: 'Create an initiative',
      inputSchema: CreateInitiativeInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.createInitiative(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    linear_link_project_to_initiative: tool({
      description: 'Link a project to an initiative',
      inputSchema: LinkProjectToInitiativeInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.linkProjectToInitiative(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type LinearTools = ReturnType<typeof createLinearTools>
export type LinearToolName = keyof LinearTools
