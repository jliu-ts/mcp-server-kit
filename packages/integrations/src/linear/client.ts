/**
 * Linear API Client
 *
 * Runtime-agnostic client for Linear's GraphQL API.
 * Works in Node.js, Edge runtimes, and Cloudflare Workers.
 *
 * @example
 * import { LinearClient } from '@trendingsociety/integrations/linear'
 *
 * const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })
 *
 * // List issues
 * const result = await linear.listIssues({ team: 'Product', status: 'In Progress' })
 * if (result.success) {
 *   console.log(result.data.issues)
 * }
 *
 * // Create issue
 * const created = await linear.createIssue({
 *   team: 'Product',
 *   title: 'New feature request',
 *   description: 'Details here...',
 * })
 */

import { API } from '../config/constants'
import { graphqlRequest, ok, fail, type Result, type ClientConfig } from '../types.js'
import type {
  LinearIssue,
  ListIssuesParams,
  ListIssuesResponse,
  GetIssueParams,
  CreateIssueParams,
  CreateIssueResponse,
  UpdateIssueParams,
  UpdateIssueResponse,
  CreateCommentParams,
  CreateCommentResponse,
} from './types.js'

// ============================================================================
// Configuration
// ============================================================================

const LINEAR_API = 'https://api.linear.app/graphql'

export interface LinearClientConfig extends ClientConfig {
  /** Linear API key (required) */
  apiKey: string
}

// ============================================================================
// Client Implementation
// ============================================================================

export class LinearClient {
  private apiKey: string
  private timeout: number
  private fetchFn: typeof fetch
  private debug: boolean

  constructor(config: LinearClientConfig) {
    if (!config.apiKey) {
      throw new Error('LinearClient requires apiKey')
    }

    this.apiKey = config.apiKey
    this.timeout = config.timeout ?? API.defaultTimeout
    this.fetchFn = config.fetch ?? fetch
    this.debug = config.debug ?? false
  }

  // --------------------------------------------------------------------------
  // List Issues
  // --------------------------------------------------------------------------

  async listIssues(params: ListIssuesParams = {}): Promise<Result<ListIssuesResponse>> {
    const limit = params.limit ?? 50

    // Build filter object
    const filter: Record<string, unknown> = {}
    if (params.project) {
      filter.project = { name: { containsIgnoreCase: params.project } }
    }
    if (params.status) {
      filter.state = { name: { containsIgnoreCase: params.status } }
    }
    if (params.assignee) {
      filter.assignee = { name: { containsIgnoreCase: params.assignee } }
    }
    if (params.team) {
      filter.team = { name: { containsIgnoreCase: params.team } }
    }

    const query = `
      query ListIssues($filter: IssueFilter, $first: Int) {
        issues(filter: $filter, first: $first, orderBy: updatedAt) {
          nodes {
            id
            identifier
            title
            state { id name }
            assignee { id name }
            project { id name }
            team { id name key }
            priority
            createdAt
            updatedAt
          }
        }
      }
    `

    const result = await this.query<{ issues: { nodes: LinearIssue[] } }>(query, {
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      first: limit,
    })

    if (!result.success) {
      return result
    }

    const issues = result.data.issues?.nodes ?? []

    return ok({
      count: issues.length,
      filters: {
        project: params.project,
        status: params.status,
        assignee: params.assignee,
        team: params.team,
      },
      issues,
    })
  }

  // --------------------------------------------------------------------------
  // Get Issue
  // --------------------------------------------------------------------------

  async getIssue(params: GetIssueParams): Promise<Result<LinearIssue>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    // Determine if ID is identifier (PRD-108) or UUID
    const isIdentifier = params.id.includes('-') && !params.id.match(/^[0-9a-f-]{36}$/i)

    const query = isIdentifier
      ? `
        query SearchIssueByIdentifier($term: String!) {
          searchIssues(term: $term, first: 1) {
            nodes {
              id
              identifier
              title
              description
              state { id name }
              assignee { id name email }
              project { id name }
              team { id name key }
              labels { nodes { id name color } }
              priority
              estimate
              url
              createdAt
              updatedAt
              comments(first: 10) {
                nodes {
                  id
                  body
                  createdAt
                  user { id name }
                }
              }
            }
          }
        }
      `
      : `
        query GetIssue($id: String!) {
          issue(id: $id) {
            id
            identifier
            title
            description
            state { id name }
            assignee { id name email }
            project { id name }
            team { id name key }
            labels { nodes { id name color } }
            priority
            estimate
            url
            createdAt
            updatedAt
            comments(first: 10) {
              nodes {
                id
                body
                createdAt
                user { id name }
              }
            }
          }
        }
      `

    type IssueResult = { issue: LinearIssue } | { searchIssues: { nodes: LinearIssue[] } }

    const result = await this.query<IssueResult>(
      query,
      isIdentifier ? { term: params.id } : { id: params.id }
    )

    if (!result.success) {
      return result
    }

    const issue = isIdentifier
      ? (result.data as { searchIssues: { nodes: LinearIssue[] } }).searchIssues?.nodes?.[0]
      : (result.data as { issue: LinearIssue }).issue

    if (!issue) {
      return fail('NOT_FOUND', `Issue not found: ${params.id}`, 404)
    }

    return ok(issue)
  }

  // --------------------------------------------------------------------------
  // Create Issue
  // --------------------------------------------------------------------------

  async createIssue(params: CreateIssueParams): Promise<Result<CreateIssueResponse>> {
    if (!params.title) {
      return fail('INVALID_PARAMS', 'Missing required parameter: title')
    }
    if (!params.team) {
      return fail('INVALID_PARAMS', 'Missing required parameter: team')
    }

    // Resolve team name to ID
    const teamResult = await this.resolveTeam(params.team)
    if (!teamResult.success) {
      return teamResult
    }

    const input: Record<string, unknown> = {
      teamId: teamResult.data.id,
      title: params.title,
    }

    if (params.description) input.description = params.description
    if (params.priority !== undefined) input.priority = params.priority

    // Resolve project if provided
    if (params.project) {
      const projectResult = await this.resolveProject(params.project)
      if (projectResult.success) {
        input.projectId = projectResult.data.id
      }
    }

    // Resolve assignee if provided
    if (params.assignee) {
      const userResult = await this.resolveUser(params.assignee)
      if (userResult.success) {
        input.assigneeId = userResult.data.id
      }
    }

    const mutation = `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            title
            url
          }
        }
      }
    `

    const result = await this.query<{
      issueCreate: { success: boolean; issue: CreateIssueResponse['issue'] }
    }>(mutation, { input })

    if (!result.success) {
      return result
    }

    if (!result.data.issueCreate?.success) {
      return fail('CREATE_FAILED', 'Failed to create issue')
    }

    return ok({ issue: result.data.issueCreate.issue })
  }

  // --------------------------------------------------------------------------
  // Update Issue
  // --------------------------------------------------------------------------

  async updateIssue(params: UpdateIssueParams): Promise<Result<UpdateIssueResponse>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    // Resolve issue to get UUID and team ID
    const issueResult = await this.getIssue({ id: params.id })
    if (!issueResult.success) {
      return issueResult
    }

    const uuid = issueResult.data.id
    const teamId = issueResult.data.team?.id

    // Build update input
    const input: Record<string, unknown> = {}

    if (params.title) input.title = params.title
    if (params.description) input.description = params.description
    if (params.priority !== undefined) input.priority = params.priority

    // Resolve status if provided
    if (params.status && teamId) {
      const stateResult = await this.resolveState(params.status, teamId)
      if (stateResult.success) {
        input.stateId = stateResult.data.id
      }
    }

    // Resolve assignee if provided
    if (params.assignee) {
      const userResult = await this.resolveUser(params.assignee)
      if (userResult.success) {
        input.assigneeId = userResult.data.id
      }
    }

    // Resolve labels if provided
    if (params.labels && params.labels.length > 0) {
      const labelIds: string[] = []
      for (const labelName of params.labels) {
        const labelResult = await this.resolveLabel(labelName)
        if (labelResult.success) {
          labelIds.push(labelResult.data.id)
        }
      }
      if (labelIds.length > 0) {
        input.labelIds = labelIds
      }
    }

    if (Object.keys(input).length === 0) {
      return fail('INVALID_PARAMS', 'No update fields provided')
    }

    const mutation = `
      mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
          issue {
            id
            identifier
            title
            state { name }
            assignee { name }
          }
        }
      }
    `

    const result = await this.query<{
      issueUpdate: { success: boolean; issue: UpdateIssueResponse['issue'] }
    }>(mutation, { id: uuid, input })

    if (!result.success) {
      return result
    }

    if (!result.data.issueUpdate?.success) {
      return fail('UPDATE_FAILED', 'Failed to update issue')
    }

    return ok({ issue: result.data.issueUpdate.issue })
  }

  // --------------------------------------------------------------------------
  // Search Issues
  // --------------------------------------------------------------------------

  async searchIssues(params: { query: string; limit?: number }): Promise<Result<ListIssuesResponse>> {
    const limit = params.limit ?? 50

    const query = `
      query SearchIssues($term: String!, $first: Int) {
        searchIssues(term: $term, first: $first) {
          nodes {
            id
            identifier
            title
            state { id name }
            assignee { id name }
            project { id name }
            team { id name key }
            priority
            createdAt
            updatedAt
          }
        }
      }
    `

    const result = await this.query<{ searchIssues: { nodes: LinearIssue[] } }>(query, {
      term: params.query,
      first: limit,
    })

    if (!result.success) {
      return result
    }

    const issues = result.data.searchIssues?.nodes ?? []

    return ok({
      count: issues.length,
      filters: { query: params.query },
      issues,
    })
  }

  // --------------------------------------------------------------------------
  // Create Comment (was: Add Comment)
  // --------------------------------------------------------------------------

  async createComment(params: CreateCommentParams): Promise<Result<CreateCommentResponse>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }
    if (!params.body) {
      return fail('INVALID_PARAMS', 'Missing required parameter: body')
    }

    // Resolve issue to get UUID
    const issueResult = await this.getIssue({ id: params.id })
    if (!issueResult.success) {
      return issueResult
    }

    const mutation = `
      mutation AddComment($input: CommentCreateInput!) {
        commentCreate(input: $input) {
          success
          comment {
            id
            body
            createdAt
            user { name }
          }
        }
      }
    `

    const result = await this.query<{
      commentCreate: { success: boolean; comment: CreateCommentResponse['comment'] }
    }>(mutation, {
      input: {
        issueId: issueResult.data.id,
        body: params.body,
      },
    })

    if (!result.success) {
      return result
    }

    if (!result.data.commentCreate?.success) {
      return fail('COMMENT_FAILED', 'Failed to add comment')
    }

    return ok({ comment: result.data.commentCreate.comment })
  }

  // --------------------------------------------------------------------------
  // List Comments
  // --------------------------------------------------------------------------

  async listComments(params: { issueId: string; limit?: number }): Promise<Result<{ comments: any[] }>> {
    if (!params.issueId) {
      return fail('INVALID_PARAMS', 'Missing required parameter: issueId')
    }

    const limit = params.limit ?? 50

    // First resolve issue to get UUID
    const issueResult = await this.getIssue({ id: params.issueId })
    if (!issueResult.success) {
      return issueResult
    }

    const query = `
      query ListComments($issueId: String!, $first: Int) {
        issue(id: $issueId) {
          comments(first: $first) {
            nodes {
              id
              body
              createdAt
              updatedAt
              user { id name email }
            }
          }
        }
      }
    `

    const result = await this.query<{ issue: { comments: { nodes: any[] } } }>(query, {
      issueId: issueResult.data.id,
      first: limit,
    })

    if (!result.success) {
      return result
    }

    return ok({ comments: result.data.issue?.comments?.nodes ?? [] })
  }

  // --------------------------------------------------------------------------
  // Issue Lifecycle
  // --------------------------------------------------------------------------

  async archiveIssue(params: { id: string }): Promise<Result<{ success: boolean }>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const issueResult = await this.getIssue({ id: params.id })
    if (!issueResult.success) {
      return issueResult
    }

    const mutation = `
      mutation ArchiveIssue($id: String!) {
        issueArchive(id: $id) {
          success
        }
      }
    `

    const result = await this.query<{ issueArchive: { success: boolean } }>(mutation, {
      id: issueResult.data.id,
    })

    if (!result.success) {
      return result
    }

    return ok({ success: result.data.issueArchive?.success ?? false })
  }

  async unarchiveIssue(params: { id: string }): Promise<Result<{ success: boolean }>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const issueResult = await this.getIssue({ id: params.id })
    if (!issueResult.success) {
      return issueResult
    }

    const mutation = `
      mutation UnarchiveIssue($id: String!) {
        issueUnarchive(id: $id) {
          success
        }
      }
    `

    const result = await this.query<{ issueUnarchive: { success: boolean } }>(mutation, {
      id: issueResult.data.id,
    })

    if (!result.success) {
      return result
    }

    return ok({ success: result.data.issueUnarchive?.success ?? false })
  }

  async deleteIssue(params: { id: string }): Promise<Result<{ success: boolean }>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const issueResult = await this.getIssue({ id: params.id })
    if (!issueResult.success) {
      return issueResult
    }

    const mutation = `
      mutation DeleteIssue($id: String!) {
        issueDelete(id: $id) {
          success
        }
      }
    `

    const result = await this.query<{ issueDelete: { success: boolean } }>(mutation, {
      id: issueResult.data.id,
    })

    if (!result.success) {
      return result
    }

    return ok({ success: result.data.issueDelete?.success ?? false })
  }

  // --------------------------------------------------------------------------
  // Comment Management
  // --------------------------------------------------------------------------

  async updateComment(params: { id: string; body: string }): Promise<Result<any>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }
    if (!params.body) {
      return fail('INVALID_PARAMS', 'Missing required parameter: body')
    }

    const mutation = `
      mutation UpdateComment($id: String!, $input: CommentUpdateInput!) {
        commentUpdate(id: $id, input: $input) {
          success
          comment {
            id
            body
            updatedAt
          }
        }
      }
    `

    const result = await this.query<{ commentUpdate: { success: boolean; comment: any } }>(mutation, {
      id: params.id,
      input: { body: params.body },
    })

    if (!result.success) {
      return result
    }

    if (!result.data.commentUpdate?.success) {
      return fail('UPDATE_FAILED', 'Failed to update comment')
    }

    return ok(result.data.commentUpdate.comment)
  }

  async deleteComment(params: { id: string }): Promise<Result<{ success: boolean }>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const mutation = `
      mutation DeleteComment($id: String!) {
        commentDelete(id: $id) {
          success
        }
      }
    `

    const result = await this.query<{ commentDelete: { success: boolean } }>(mutation, {
      id: params.id,
    })

    if (!result.success) {
      return result
    }

    return ok({ success: result.data.commentDelete?.success ?? false })
  }

  // --------------------------------------------------------------------------
  // Attachments
  // --------------------------------------------------------------------------

  async listAttachments(params: { issueId: string; limit?: number }): Promise<Result<{ attachments: any[] }>> {
    if (!params.issueId) {
      return fail('INVALID_PARAMS', 'Missing required parameter: issueId')
    }

    const issueResult = await this.getIssue({ id: params.issueId })
    if (!issueResult.success) {
      return issueResult
    }

    const limit = params.limit ?? 50

    const query = `
      query ListAttachments($issueId: String!, $first: Int) {
        issue(id: $issueId) {
          attachments(first: $first) {
            nodes {
              id
              title
              url
              sourceType
              createdAt
            }
          }
        }
      }
    `

    const result = await this.query<{ issue: { attachments: { nodes: any[] } } }>(query, {
      issueId: issueResult.data.id,
      first: limit,
    })

    if (!result.success) {
      return result
    }

    return ok({ attachments: result.data.issue?.attachments?.nodes ?? [] })
  }

  async createAttachment(params: { issueId: string; url: string; title?: string }): Promise<Result<any>> {
    if (!params.issueId) {
      return fail('INVALID_PARAMS', 'Missing required parameter: issueId')
    }
    if (!params.url) {
      return fail('INVALID_PARAMS', 'Missing required parameter: url')
    }

    const issueResult = await this.getIssue({ id: params.issueId })
    if (!issueResult.success) {
      return issueResult
    }

    const input: Record<string, unknown> = {
      issueId: issueResult.data.id,
      url: params.url,
    }

    if (params.title) input.title = params.title

    const mutation = `
      mutation CreateAttachment($input: AttachmentCreateInput!) {
        attachmentCreate(input: $input) {
          success
          attachment {
            id
            title
            url
          }
        }
      }
    `

    const result = await this.query<{ attachmentCreate: { success: boolean; attachment: any } }>(mutation, {
      input,
    })

    if (!result.success) {
      return result
    }

    if (!result.data.attachmentCreate?.success) {
      return fail('CREATE_FAILED', 'Failed to create attachment')
    }

    return ok(result.data.attachmentCreate.attachment)
  }

  // --------------------------------------------------------------------------
  // Sub-issues
  // --------------------------------------------------------------------------

  async listSubIssues(params: { issueId: string; limit?: number }): Promise<Result<{ issues: any[] }>> {
    if (!params.issueId) {
      return fail('INVALID_PARAMS', 'Missing required parameter: issueId')
    }

    const issueResult = await this.getIssue({ id: params.issueId })
    if (!issueResult.success) {
      return issueResult
    }

    const limit = params.limit ?? 50

    const query = `
      query ListSubIssues($issueId: String!, $first: Int) {
        issue(id: $issueId) {
          children(first: $first) {
            nodes {
              id
              identifier
              title
              state { id name }
              assignee { id name }
              priority
              createdAt
            }
          }
        }
      }
    `

    const result = await this.query<{ issue: { children: { nodes: any[] } } }>(query, {
      issueId: issueResult.data.id,
      first: limit,
    })

    if (!result.success) {
      return result
    }

    return ok({ issues: result.data.issue?.children?.nodes ?? [] })
  }

  async createSubIssue(params: { parentId: string; title: string; description?: string }): Promise<Result<any>> {
    if (!params.parentId) {
      return fail('INVALID_PARAMS', 'Missing required parameter: parentId')
    }
    if (!params.title) {
      return fail('INVALID_PARAMS', 'Missing required parameter: title')
    }

    // Get parent issue to get team ID
    const parentResult = await this.getIssue({ id: params.parentId })
    if (!parentResult.success) {
      return parentResult
    }

    const input: Record<string, unknown> = {
      parentId: parentResult.data.id,
      teamId: parentResult.data.team?.id,
      title: params.title,
    }

    if (params.description) input.description = params.description

    const mutation = `
      mutation CreateSubIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            title
            url
          }
        }
      }
    `

    const result = await this.query<{ issueCreate: { success: boolean; issue: any } }>(mutation, {
      input,
    })

    if (!result.success) {
      return result
    }

    if (!result.data.issueCreate?.success) {
      return fail('CREATE_FAILED', 'Failed to create sub-issue')
    }

    return ok(result.data.issueCreate.issue)
  }

  // --------------------------------------------------------------------------
  // Issue Relations
  // --------------------------------------------------------------------------

  async listIssueRelations(params: { issueId: string }): Promise<Result<{ relations: any[] }>> {
    if (!params.issueId) {
      return fail('INVALID_PARAMS', 'Missing required parameter: issueId')
    }

    const issueResult = await this.getIssue({ id: params.issueId })
    if (!issueResult.success) {
      return issueResult
    }

    const query = `
      query ListIssueRelations($issueId: String!) {
        issue(id: $issueId) {
          relations {
            nodes {
              id
              type
              relatedIssue {
                id
                identifier
                title
                state { name }
              }
            }
          }
        }
      }
    `

    const result = await this.query<{ issue: { relations: { nodes: any[] } } }>(query, {
      issueId: issueResult.data.id,
    })

    if (!result.success) {
      return result
    }

    return ok({ relations: result.data.issue?.relations?.nodes ?? [] })
  }

  async createIssueRelation(params: { issueId: string; relatedIssueId: string; type: string }): Promise<Result<any>> {
    if (!params.issueId) {
      return fail('INVALID_PARAMS', 'Missing required parameter: issueId')
    }
    if (!params.relatedIssueId) {
      return fail('INVALID_PARAMS', 'Missing required parameter: relatedIssueId')
    }
    if (!params.type) {
      return fail('INVALID_PARAMS', 'Missing required parameter: type')
    }

    // Resolve both issues
    const issueResult = await this.getIssue({ id: params.issueId })
    if (!issueResult.success) {
      return issueResult
    }

    const relatedResult = await this.getIssue({ id: params.relatedIssueId })
    if (!relatedResult.success) {
      return relatedResult
    }

    const mutation = `
      mutation CreateIssueRelation($input: IssueRelationCreateInput!) {
        issueRelationCreate(input: $input) {
          success
          issueRelation {
            id
            type
          }
        }
      }
    `

    const result = await this.query<{ issueRelationCreate: { success: boolean; issueRelation: any } }>(mutation, {
      input: {
        issueId: issueResult.data.id,
        relatedIssueId: relatedResult.data.id,
        type: params.type,
      },
    })

    if (!result.success) {
      return result
    }

    if (!result.data.issueRelationCreate?.success) {
      return fail('CREATE_FAILED', 'Failed to create issue relation')
    }

    return ok(result.data.issueRelationCreate.issueRelation)
  }

  // --------------------------------------------------------------------------
  // Issue Subscriptions
  // --------------------------------------------------------------------------

  async subscribeToIssue(params: { id: string }): Promise<Result<{ success: boolean }>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const issueResult = await this.getIssue({ id: params.id })
    if (!issueResult.success) {
      return issueResult
    }

    const mutation = `
      mutation SubscribeToIssue($id: String!) {
        issueSubscribe(id: $id) {
          success
        }
      }
    `

    const result = await this.query<{ issueSubscribe: { success: boolean } }>(mutation, {
      id: issueResult.data.id,
    })

    if (!result.success) {
      return result
    }

    return ok({ success: result.data.issueSubscribe?.success ?? false })
  }

  async unsubscribeFromIssue(params: { id: string }): Promise<Result<{ success: boolean }>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const issueResult = await this.getIssue({ id: params.id })
    if (!issueResult.success) {
      return issueResult
    }

    const mutation = `
      mutation UnsubscribeFromIssue($id: String!) {
        issueUnsubscribe(id: $id) {
          success
        }
      }
    `

    const result = await this.query<{ issueUnsubscribe: { success: boolean } }>(mutation, {
      id: issueResult.data.id,
    })

    if (!result.success) {
      return result
    }

    return ok({ success: result.data.issueUnsubscribe?.success ?? false })
  }

  // --------------------------------------------------------------------------
  // Issue History
  // --------------------------------------------------------------------------

  async getIssueHistory(params: { id: string; limit?: number }): Promise<Result<{ history: any[] }>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const issueResult = await this.getIssue({ id: params.id })
    if (!issueResult.success) {
      return issueResult
    }

    const limit = params.limit ?? 50

    const query = `
      query GetIssueHistory($issueId: String!, $first: Int) {
        issue(id: $issueId) {
          history(first: $first) {
            nodes {
              id
              createdAt
              updatedAt
              fromTitle
              toTitle
              fromPriority
              toPriority
              fromEstimate
              toEstimate
              fromAssignee { id name }
              toAssignee { id name }
              fromState { id name }
              toState { id name }
              actor { id name }
            }
          }
        }
      }
    `

    const result = await this.query<{ issue: { history: { nodes: any[] } } }>(query, {
      issueId: issueResult.data.id,
      first: limit,
    })

    if (!result.success) {
      return result
    }

    return ok({ history: result.data.issue?.history?.nodes ?? [] })
  }

  // --------------------------------------------------------------------------
  // Teams
  // --------------------------------------------------------------------------

  async listTeams(params: { limit?: number } = {}): Promise<Result<{ teams: any[] }>> {
    const limit = params.limit ?? 50

    const query = `
      query ListTeams($first: Int) {
        teams(first: $first) {
          nodes {
            id
            name
            key
            description
            icon
            color
          }
        }
      }
    `

    const result = await this.query<{ teams: { nodes: any[] } }>(query, { first: limit })

    if (!result.success) {
      return result
    }

    return ok({ teams: result.data.teams?.nodes ?? [] })
  }

  async getTeam(params: { id: string }): Promise<Result<any>> {
    const query = `
      query GetTeam($id: String!) {
        team(id: $id) {
          id
          name
          key
          description
          icon
          color
        }
      }
    `

    const result = await this.query<{ team: any }>(query, { id: params.id })

    if (!result.success) {
      return result
    }

    if (!result.data.team) {
      return fail('NOT_FOUND', `Team not found: ${params.id}`, 404)
    }

    return ok(result.data.team)
  }

  // --------------------------------------------------------------------------
  // Projects
  // --------------------------------------------------------------------------

  async listProjects(params: { state?: string; limit?: number } = {}): Promise<Result<{ projects: any[] }>> {
    const limit = params.limit ?? 50

    const filter: Record<string, unknown> = {}
    if (params.state) {
      filter.state = { eq: params.state }
    }

    const query = `
      query ListProjects($filter: ProjectFilter, $first: Int) {
        projects(filter: $filter, first: $first) {
          nodes {
            id
            name
            description
            state
            progress
            startDate
            targetDate
            lead { id name }
          }
        }
      }
    `

    const result = await this.query<{ projects: { nodes: any[] } }>(query, {
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      first: limit,
    })

    if (!result.success) {
      return result
    }

    return ok({ projects: result.data.projects?.nodes ?? [] })
  }

  async getProject(params: { id: string }): Promise<Result<any>> {
    const query = `
      query GetProject($id: String!) {
        project(id: $id) {
          id
          name
          description
          state
          progress
          startDate
          targetDate
          lead { id name }
        }
      }
    `

    const result = await this.query<{ project: any }>(query, { id: params.id })

    if (!result.success) {
      return result
    }

    if (!result.data.project) {
      return fail('NOT_FOUND', `Project not found: ${params.id}`, 404)
    }

    return ok(result.data.project)
  }

  async createProject(params: any): Promise<Result<any>> {
    const mutation = `
      mutation CreateProject($input: ProjectCreateInput!) {
        projectCreate(input: $input) {
          success
          project {
            id
            name
          }
        }
      }
    `

    const result = await this.query<{ projectCreate: { success: boolean; project: any } }>(mutation, {
      input: params,
    })

    if (!result.success) {
      return result
    }

    if (!result.data.projectCreate?.success) {
      return fail('CREATE_FAILED', 'Failed to create project')
    }

    return ok(result.data.projectCreate.project)
  }

  async updateProject(params: { id: string; [key: string]: any }): Promise<Result<any>> {
    const { id, ...input } = params

    const mutation = `
      mutation UpdateProject($id: String!, $input: ProjectUpdateInput!) {
        projectUpdate(id: $id, input: $input) {
          success
          project {
            id
            name
          }
        }
      }
    `

    const result = await this.query<{ projectUpdate: { success: boolean; project: any } }>(mutation, {
      id,
      input,
    })

    if (!result.success) {
      return result
    }

    if (!result.data.projectUpdate?.success) {
      return fail('UPDATE_FAILED', 'Failed to update project')
    }

    return ok(result.data.projectUpdate.project)
  }

  async archiveProject(params: { id: string }): Promise<Result<{ success: boolean }>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const mutation = `
      mutation ArchiveProject($id: String!) {
        projectArchive(id: $id) {
          success
        }
      }
    `

    const result = await this.query<{ projectArchive: { success: boolean } }>(mutation, {
      id: params.id,
    })

    if (!result.success) {
      return result
    }

    return ok({ success: result.data.projectArchive?.success ?? false })
  }

  async deleteProject(params: { id: string }): Promise<Result<{ success: boolean }>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const mutation = `
      mutation DeleteProject($id: String!) {
        projectDelete(id: $id) {
          success
        }
      }
    `

    const result = await this.query<{ projectDelete: { success: boolean } }>(mutation, {
      id: params.id,
    })

    if (!result.success) {
      return result
    }

    return ok({ success: result.data.projectDelete?.success ?? false })
  }

  // --------------------------------------------------------------------------
  // Milestones
  // --------------------------------------------------------------------------

  async listMilestones(params: { projectId: string; limit?: number }): Promise<Result<{ milestones: any[] }>> {
    if (!params.projectId) {
      return fail('INVALID_PARAMS', 'Missing required parameter: projectId')
    }

    const limit = params.limit ?? 50

    const query = `
      query ListMilestones($projectId: String!, $first: Int) {
        project(id: $projectId) {
          projectMilestones(first: $first) {
            nodes {
              id
              name
              description
              targetDate
              sortOrder
            }
          }
        }
      }
    `

    const result = await this.query<{ project: { projectMilestones: { nodes: any[] } } }>(query, {
      projectId: params.projectId,
      first: limit,
    })

    if (!result.success) {
      return result
    }

    return ok({ milestones: result.data.project?.projectMilestones?.nodes ?? [] })
  }

  async createMilestone(params: { projectId: string; name: string; targetDate?: string; description?: string }): Promise<Result<any>> {
    if (!params.projectId) {
      return fail('INVALID_PARAMS', 'Missing required parameter: projectId')
    }
    if (!params.name) {
      return fail('INVALID_PARAMS', 'Missing required parameter: name')
    }

    const input: Record<string, unknown> = {
      projectId: params.projectId,
      name: params.name,
    }

    if (params.targetDate) input.targetDate = params.targetDate
    if (params.description) input.description = params.description

    const mutation = `
      mutation CreateMilestone($input: ProjectMilestoneCreateInput!) {
        projectMilestoneCreate(input: $input) {
          success
          projectMilestone {
            id
            name
            targetDate
          }
        }
      }
    `

    const result = await this.query<{ projectMilestoneCreate: { success: boolean; projectMilestone: any } }>(mutation, {
      input,
    })

    if (!result.success) {
      return result
    }

    if (!result.data.projectMilestoneCreate?.success) {
      return fail('CREATE_FAILED', 'Failed to create milestone')
    }

    return ok(result.data.projectMilestoneCreate.projectMilestone)
  }

  async updateMilestone(params: { id: string; name?: string; targetDate?: string; description?: string }): Promise<Result<any>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const { id, ...input } = params

    if (Object.keys(input).length === 0) {
      return fail('INVALID_PARAMS', 'No update fields provided')
    }

    const mutation = `
      mutation UpdateMilestone($id: String!, $input: ProjectMilestoneUpdateInput!) {
        projectMilestoneUpdate(id: $id, input: $input) {
          success
          projectMilestone {
            id
            name
            targetDate
          }
        }
      }
    `

    const result = await this.query<{ projectMilestoneUpdate: { success: boolean; projectMilestone: any } }>(mutation, {
      id,
      input,
    })

    if (!result.success) {
      return result
    }

    if (!result.data.projectMilestoneUpdate?.success) {
      return fail('UPDATE_FAILED', 'Failed to update milestone')
    }

    return ok(result.data.projectMilestoneUpdate.projectMilestone)
  }

  async deleteMilestone(params: { id: string }): Promise<Result<{ success: boolean }>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const mutation = `
      mutation DeleteMilestone($id: String!) {
        projectMilestoneDelete(id: $id) {
          success
        }
      }
    `

    const result = await this.query<{ projectMilestoneDelete: { success: boolean } }>(mutation, {
      id: params.id,
    })

    if (!result.success) {
      return result
    }

    return ok({ success: result.data.projectMilestoneDelete?.success ?? false })
  }

  // --------------------------------------------------------------------------
  // Project Updates
  // --------------------------------------------------------------------------

  async listProjectUpdates(params: { projectId: string; limit?: number }): Promise<Result<{ updates: any[] }>> {
    if (!params.projectId) {
      return fail('INVALID_PARAMS', 'Missing required parameter: projectId')
    }

    const limit = params.limit ?? 50

    const query = `
      query ListProjectUpdates($projectId: String!, $first: Int) {
        project(id: $projectId) {
          projectUpdates(first: $first) {
            nodes {
              id
              body
              health
              createdAt
              user { id name }
            }
          }
        }
      }
    `

    const result = await this.query<{ project: { projectUpdates: { nodes: any[] } } }>(query, {
      projectId: params.projectId,
      first: limit,
    })

    if (!result.success) {
      return result
    }

    return ok({ updates: result.data.project?.projectUpdates?.nodes ?? [] })
  }

  async createProjectUpdate(params: { projectId: string; body: string; health?: string }): Promise<Result<any>> {
    if (!params.projectId) {
      return fail('INVALID_PARAMS', 'Missing required parameter: projectId')
    }
    if (!params.body) {
      return fail('INVALID_PARAMS', 'Missing required parameter: body')
    }

    const input: Record<string, unknown> = {
      projectId: params.projectId,
      body: params.body,
    }

    if (params.health) input.health = params.health

    const mutation = `
      mutation CreateProjectUpdate($input: ProjectUpdateCreateInput!) {
        projectUpdateCreate(input: $input) {
          success
          projectUpdate {
            id
            body
            health
            createdAt
          }
        }
      }
    `

    const result = await this.query<{ projectUpdateCreate: { success: boolean; projectUpdate: any } }>(mutation, {
      input,
    })

    if (!result.success) {
      return result
    }

    if (!result.data.projectUpdateCreate?.success) {
      return fail('CREATE_FAILED', 'Failed to create project update')
    }

    return ok(result.data.projectUpdateCreate.projectUpdate)
  }

  // --------------------------------------------------------------------------
  // Cycles
  // --------------------------------------------------------------------------

  async listCycles(params: { team?: string; isActive?: boolean; limit?: number } = {}): Promise<Result<{ cycles: any[] }>> {
    const limit = params.limit ?? 50

    const filter: Record<string, unknown> = {}
    if (params.isActive !== undefined) {
      filter.isActive = { eq: params.isActive }
    }

    const query = `
      query ListCycles($filter: CycleFilter, $first: Int) {
        cycles(filter: $filter, first: $first) {
          nodes {
            id
            name
            number
            startsAt
            endsAt
            progress
            team { id name }
          }
        }
      }
    `

    const result = await this.query<{ cycles: { nodes: any[] } }>(query, {
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      first: limit,
    })

    if (!result.success) {
      return result
    }

    return ok({ cycles: result.data.cycles?.nodes ?? [] })
  }

  async getCurrentCycle(params: { team: string }): Promise<Result<any>> {
    // First resolve team
    const teamResult = await this.resolveTeam(params.team)
    if (!teamResult.success) {
      return teamResult
    }

    const query = `
      query GetCurrentCycle($teamId: ID!) {
        cycles(filter: { team: { id: { eq: $teamId } }, isActive: { eq: true } }, first: 1) {
          nodes {
            id
            name
            number
            startsAt
            endsAt
            progress
          }
        }
      }
    `

    const result = await this.query<{ cycles: { nodes: any[] } }>(query, { teamId: teamResult.data.id })

    if (!result.success) {
      return result
    }

    const cycle = result.data.cycles?.nodes?.[0]
    if (!cycle) {
      return fail('NOT_FOUND', 'No active cycle found', 404)
    }

    return ok(cycle)
  }

  async createCycle(params: any): Promise<Result<any>> {
    const mutation = `
      mutation CreateCycle($input: CycleCreateInput!) {
        cycleCreate(input: $input) {
          success
          cycle {
            id
            name
          }
        }
      }
    `

    const result = await this.query<{ cycleCreate: { success: boolean; cycle: any } }>(mutation, {
      input: params,
    })

    if (!result.success) {
      return result
    }

    if (!result.data.cycleCreate?.success) {
      return fail('CREATE_FAILED', 'Failed to create cycle')
    }

    return ok(result.data.cycleCreate.cycle)
  }

  async getCycle(params: { id: string }): Promise<Result<any>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const query = `
      query GetCycle($id: String!) {
        cycle(id: $id) {
          id
          name
          number
          startsAt
          endsAt
          progress
          team { id name }
        }
      }
    `

    const result = await this.query<{ cycle: any }>(query, { id: params.id })

    if (!result.success) {
      return result
    }

    if (!result.data.cycle) {
      return fail('NOT_FOUND', `Cycle not found: ${params.id}`, 404)
    }

    return ok(result.data.cycle)
  }

  async updateCycle(params: { id: string; name?: string; startsAt?: string; endsAt?: string }): Promise<Result<any>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const { id, ...input } = params

    if (Object.keys(input).length === 0) {
      return fail('INVALID_PARAMS', 'No update fields provided')
    }

    const mutation = `
      mutation UpdateCycle($id: String!, $input: CycleUpdateInput!) {
        cycleUpdate(id: $id, input: $input) {
          success
          cycle {
            id
            name
            startsAt
            endsAt
          }
        }
      }
    `

    const result = await this.query<{ cycleUpdate: { success: boolean; cycle: any } }>(mutation, {
      id,
      input,
    })

    if (!result.success) {
      return result
    }

    if (!result.data.cycleUpdate?.success) {
      return fail('UPDATE_FAILED', 'Failed to update cycle')
    }

    return ok(result.data.cycleUpdate.cycle)
  }

  async archiveCycle(params: { id: string }): Promise<Result<{ success: boolean }>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const mutation = `
      mutation ArchiveCycle($id: String!) {
        cycleArchive(id: $id) {
          success
        }
      }
    `

    const result = await this.query<{ cycleArchive: { success: boolean } }>(mutation, {
      id: params.id,
    })

    if (!result.success) {
      return result
    }

    return ok({ success: result.data.cycleArchive?.success ?? false })
  }

  // --------------------------------------------------------------------------
  // Issue Statuses (was: States)
  // --------------------------------------------------------------------------

  async listIssueStatuses(params: { team?: string; type?: string } = {}): Promise<Result<{ states: any[] }>> {
    const filter: Record<string, unknown> = {}
    if (params.type) {
      filter.type = { eq: params.type }
    }

    const query = `
      query ListStates($filter: WorkflowStateFilter) {
        workflowStates(filter: $filter) {
          nodes {
            id
            name
            type
            color
            position
            team { id name }
          }
        }
      }
    `

    const result = await this.query<{ workflowStates: { nodes: any[] } }>(query, {
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    })

    if (!result.success) {
      return result
    }

    return ok({ states: result.data.workflowStates?.nodes ?? [] })
  }

  async getIssueStatus(params: { id: string }): Promise<Result<any>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const query = `
      query GetIssueStatus($id: String!) {
        workflowState(id: $id) {
          id
          name
          type
          color
          position
          team { id name key }
        }
      }
    `

    const result = await this.query<{ workflowState: any }>(query, { id: params.id })

    if (!result.success) {
      return result
    }

    if (!result.data.workflowState) {
      return fail('NOT_FOUND', `Issue status not found: ${params.id}`, 404)
    }

    return ok(result.data.workflowState)
  }

  // --------------------------------------------------------------------------
  // Issue Labels (was: Labels)
  // --------------------------------------------------------------------------

  async listIssueLabels(params: { team?: string; limit?: number } = {}): Promise<Result<{ labels: any[] }>> {
    const limit = params.limit ?? 50

    const query = `
      query ListLabels($first: Int) {
        issueLabels(first: $first) {
          nodes {
            id
            name
            color
            description
          }
        }
      }
    `

    const result = await this.query<{ issueLabels: { nodes: any[] } }>(query, { first: limit })

    if (!result.success) {
      return result
    }

    return ok({ labels: result.data.issueLabels?.nodes ?? [] })
  }

  async createIssueLabel(params: { team: string; name: string; color?: string; description?: string }): Promise<Result<any>> {
    const input: Record<string, unknown> = {
      name: params.name,
    }

    if (params.color) input.color = params.color
    if (params.description) input.description = params.description

    const mutation = `
      mutation CreateLabel($input: IssueLabelCreateInput!) {
        issueLabelCreate(input: $input) {
          success
          issueLabel {
            id
            name
          }
        }
      }
    `

    const result = await this.query<{ issueLabelCreate: { success: boolean; issueLabel: any } }>(mutation, {
      input,
    })

    if (!result.success) {
      return result
    }

    if (!result.data.issueLabelCreate?.success) {
      return fail('CREATE_FAILED', 'Failed to create label')
    }

    return ok(result.data.issueLabelCreate.issueLabel)
  }

  async listProjectLabels(params: { projectId: string; limit?: number }): Promise<Result<{ labels: any[] }>> {
    if (!params.projectId) {
      return fail('INVALID_PARAMS', 'Missing required parameter: projectId')
    }

    const limit = params.limit ?? 50

    const query = `
      query ListProjectLabels($projectId: String!, $first: Int) {
        project(id: $projectId) {
          labels(first: $first) {
            nodes {
              id
              name
              color
              description
            }
          }
        }
      }
    `

    const result = await this.query<{ project: { labels: { nodes: any[] } } }>(query, {
      projectId: params.projectId,
      first: limit,
    })

    if (!result.success) {
      return result
    }

    return ok({ labels: result.data.project?.labels?.nodes ?? [] })
  }

  // --------------------------------------------------------------------------
  // Documents
  // --------------------------------------------------------------------------

  async listDocuments(params: { limit?: number } = {}): Promise<Result<{ documents: any[] }>> {
    const limit = params.limit ?? 50

    const query = `
      query ListDocuments($first: Int) {
        documents(first: $first) {
          nodes {
            id
            title
            content
            createdAt
            updatedAt
            creator { id name }
            project { id name }
          }
        }
      }
    `

    const result = await this.query<{ documents: { nodes: any[] } }>(query, { first: limit })

    if (!result.success) {
      return result
    }

    return ok({ documents: result.data.documents?.nodes ?? [] })
  }

  async getDocument(params: { id: string }): Promise<Result<any>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const query = `
      query GetDocument($id: String!) {
        document(id: $id) {
          id
          title
          content
          createdAt
          updatedAt
          creator { id name email }
          project { id name }
        }
      }
    `

    const result = await this.query<{ document: any }>(query, { id: params.id })

    if (!result.success) {
      return result
    }

    if (!result.data.document) {
      return fail('NOT_FOUND', `Document not found: ${params.id}`, 404)
    }

    return ok(result.data.document)
  }

  async createDocument(params: { title: string; content?: string; projectId?: string }): Promise<Result<any>> {
    if (!params.title) {
      return fail('INVALID_PARAMS', 'Missing required parameter: title')
    }

    const input: Record<string, unknown> = {
      title: params.title,
    }

    if (params.content) input.content = params.content
    if (params.projectId) input.projectId = params.projectId

    const mutation = `
      mutation CreateDocument($input: DocumentCreateInput!) {
        documentCreate(input: $input) {
          success
          document {
            id
            title
          }
        }
      }
    `

    const result = await this.query<{ documentCreate: { success: boolean; document: any } }>(mutation, {
      input,
    })

    if (!result.success) {
      return result
    }

    if (!result.data.documentCreate?.success) {
      return fail('CREATE_FAILED', 'Failed to create document')
    }

    return ok(result.data.documentCreate.document)
  }

  async updateDocument(params: { id: string; title?: string; content?: string }): Promise<Result<any>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const { id, ...input } = params

    if (Object.keys(input).length === 0) {
      return fail('INVALID_PARAMS', 'No update fields provided')
    }

    const mutation = `
      mutation UpdateDocument($id: String!, $input: DocumentUpdateInput!) {
        documentUpdate(id: $id, input: $input) {
          success
          document {
            id
            title
          }
        }
      }
    `

    const result = await this.query<{ documentUpdate: { success: boolean; document: any } }>(mutation, {
      id,
      input,
    })

    if (!result.success) {
      return result
    }

    if (!result.data.documentUpdate?.success) {
      return fail('UPDATE_FAILED', 'Failed to update document')
    }

    return ok(result.data.documentUpdate.document)
  }

  async searchDocumentation(params: { query: string; limit?: number }): Promise<Result<{ documents: any[] }>> {
    if (!params.query) {
      return fail('INVALID_PARAMS', 'Missing required parameter: query')
    }

    const limit = params.limit ?? 50

    const query = `
      query SearchDocumentation($term: String!, $first: Int) {
        searchDocuments(term: $term, first: $first) {
          nodes {
            id
            title
            content
          }
        }
      }
    `

    const result = await this.query<{ searchDocuments: { nodes: any[] } }>(query, {
      term: params.query,
      first: limit,
    })

    if (!result.success) {
      return result
    }

    return ok({ documents: result.data.searchDocuments?.nodes ?? [] })
  }

  // --------------------------------------------------------------------------
  // Users
  // --------------------------------------------------------------------------

  async getViewer(): Promise<Result<any>> {
    const query = `
      query GetViewer {
        viewer {
          id
          name
          email
          avatarUrl
        }
      }
    `

    const result = await this.query<{ viewer: any }>(query)

    if (!result.success) {
      return result
    }

    return ok(result.data.viewer)
  }

  async listUsers(params: { limit?: number } = {}): Promise<Result<{ users: any[] }>> {
    const limit = params.limit ?? 50

    const query = `
      query ListUsers($first: Int) {
        users(first: $first) {
          nodes {
            id
            name
            email
            avatarUrl
            active
          }
        }
      }
    `

    const result = await this.query<{ users: { nodes: any[] } }>(query, { first: limit })

    if (!result.success) {
      return result
    }

    return ok({ users: result.data.users?.nodes ?? [] })
  }

  async getUser(params: { id: string }): Promise<Result<any>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const query = `
      query GetUser($id: String!) {
        user(id: $id) {
          id
          name
          email
          avatarUrl
          active
          admin
          createdAt
        }
      }
    `

    const result = await this.query<{ user: any }>(query, { id: params.id })

    if (!result.success) {
      return result
    }

    if (!result.data.user) {
      return fail('NOT_FOUND', `User not found: ${params.id}`, 404)
    }

    return ok(result.data.user)
  }

  // --------------------------------------------------------------------------
  // Webhooks
  // --------------------------------------------------------------------------

  async listWebhooks(params: { limit?: number } = {}): Promise<Result<{ webhooks: any[] }>> {
    const limit = params.limit ?? 50

    const query = `
      query ListWebhooks($first: Int) {
        webhooks(first: $first) {
          nodes {
            id
            label
            url
            enabled
            resourceTypes
            createdAt
          }
        }
      }
    `

    const result = await this.query<{ webhooks: { nodes: any[] } }>(query, { first: limit })

    if (!result.success) {
      return result
    }

    return ok({ webhooks: result.data.webhooks?.nodes ?? [] })
  }

  async createWebhook(params: { url: string; resourceTypes: string[]; label?: string }): Promise<Result<any>> {
    if (!params.url) {
      return fail('INVALID_PARAMS', 'Missing required parameter: url')
    }
    if (!params.resourceTypes || params.resourceTypes.length === 0) {
      return fail('INVALID_PARAMS', 'Missing required parameter: resourceTypes')
    }

    const input: Record<string, unknown> = {
      url: params.url,
      resourceTypes: params.resourceTypes,
    }

    if (params.label) input.label = params.label

    const mutation = `
      mutation CreateWebhook($input: WebhookCreateInput!) {
        webhookCreate(input: $input) {
          success
          webhook {
            id
            label
            url
            enabled
          }
        }
      }
    `

    const result = await this.query<{ webhookCreate: { success: boolean; webhook: any } }>(mutation, {
      input,
    })

    if (!result.success) {
      return result
    }

    if (!result.data.webhookCreate?.success) {
      return fail('CREATE_FAILED', 'Failed to create webhook')
    }

    return ok(result.data.webhookCreate.webhook)
  }

  async deleteWebhook(params: { id: string }): Promise<Result<{ success: boolean }>> {
    if (!params.id) {
      return fail('INVALID_PARAMS', 'Missing required parameter: id')
    }

    const mutation = `
      mutation DeleteWebhook($id: String!) {
        webhookDelete(id: $id) {
          success
        }
      }
    `

    const result = await this.query<{ webhookDelete: { success: boolean } }>(mutation, {
      id: params.id,
    })

    if (!result.success) {
      return result
    }

    return ok({ success: result.data.webhookDelete?.success ?? false })
  }

  // --------------------------------------------------------------------------
  // Initiatives
  // --------------------------------------------------------------------------

  async listInitiatives(params: { limit?: number } = {}): Promise<Result<{ initiatives: any[] }>> {
    const limit = params.limit ?? 50

    const query = `
      query ListInitiatives($first: Int) {
        initiatives(first: $first) {
          nodes {
            id
            name
            description
            status
            targetDate
            createdAt
          }
        }
      }
    `

    const result = await this.query<{ initiatives: { nodes: any[] } }>(query, { first: limit })

    if (!result.success) {
      return result
    }

    return ok({ initiatives: result.data.initiatives?.nodes ?? [] })
  }

  async createInitiative(params: { name: string; description?: string; targetDate?: string }): Promise<Result<any>> {
    if (!params.name) {
      return fail('INVALID_PARAMS', 'Missing required parameter: name')
    }

    const input: Record<string, unknown> = {
      name: params.name,
    }

    if (params.description) input.description = params.description
    if (params.targetDate) input.targetDate = params.targetDate

    const mutation = `
      mutation CreateInitiative($input: InitiativeCreateInput!) {
        initiativeCreate(input: $input) {
          success
          initiative {
            id
            name
          }
        }
      }
    `

    const result = await this.query<{ initiativeCreate: { success: boolean; initiative: any } }>(mutation, {
      input,
    })

    if (!result.success) {
      return result
    }

    if (!result.data.initiativeCreate?.success) {
      return fail('CREATE_FAILED', 'Failed to create initiative')
    }

    return ok(result.data.initiativeCreate.initiative)
  }

  async linkProjectToInitiative(params: { projectId: string; initiativeId: string }): Promise<Result<any>> {
    if (!params.projectId) {
      return fail('INVALID_PARAMS', 'Missing required parameter: projectId')
    }
    if (!params.initiativeId) {
      return fail('INVALID_PARAMS', 'Missing required parameter: initiativeId')
    }

    const mutation = `
      mutation LinkProjectToInitiative($input: InitiativeToProjectCreateInput!) {
        initiativeToProjectCreate(input: $input) {
          success
          initiativeToProject {
            id
          }
        }
      }
    `

    const result = await this.query<{ initiativeToProjectCreate: { success: boolean; initiativeToProject: any } }>(mutation, {
      input: {
        projectId: params.projectId,
        initiativeId: params.initiativeId,
      },
    })

    if (!result.success) {
      return result
    }

    if (!result.data.initiativeToProjectCreate?.success) {
      return fail('CREATE_FAILED', 'Failed to link project to initiative')
    }

    return ok(result.data.initiativeToProjectCreate.initiativeToProject)
  }

  // --------------------------------------------------------------------------
  // Resolution Helpers
  // --------------------------------------------------------------------------

  private async resolveTeam(name: string): Promise<Result<{ id: string; name: string }>> {
    const query = `
      query GetTeam($name: String!) {
        teams(filter: { name: { containsIgnoreCase: $name } }, first: 1) {
          nodes { id name }
        }
      }
    `

    const result = await this.query<{ teams: { nodes: Array<{ id: string; name: string }> } }>(
      query,
      { name }
    )

    if (!result.success) {
      return result
    }

    const team = result.data.teams?.nodes?.[0]
    if (!team) {
      return fail('NOT_FOUND', `Team not found: ${name}`, 404)
    }

    return ok(team)
  }

  private async resolveProject(name: string): Promise<Result<{ id: string; name: string }>> {
    const query = `
      query GetProject($name: String!) {
        projects(filter: { name: { containsIgnoreCase: $name } }, first: 1) {
          nodes { id name }
        }
      }
    `

    const result = await this.query<{ projects: { nodes: Array<{ id: string; name: string }> } }>(
      query,
      { name }
    )

    if (!result.success) {
      return result
    }

    const project = result.data.projects?.nodes?.[0]
    if (!project) {
      return fail('NOT_FOUND', `Project not found: ${name}`, 404)
    }

    return ok(project)
  }

  private async resolveUser(name: string): Promise<Result<{ id: string; name: string }>> {
    const query = `
      query GetUser($name: String!) {
        users(filter: { name: { containsIgnoreCase: $name } }, first: 1) {
          nodes { id name }
        }
      }
    `

    const result = await this.query<{ users: { nodes: Array<{ id: string; name: string }> } }>(
      query,
      { name }
    )

    if (!result.success) {
      return result
    }

    const user = result.data.users?.nodes?.[0]
    if (!user) {
      return fail('NOT_FOUND', `User not found: ${name}`, 404)
    }

    return ok(user)
  }

  private async resolveState(
    name: string,
    teamId: string
  ): Promise<Result<{ id: string; name: string }>> {
    const query = `
      query GetState($name: String!, $teamId: ID!) {
        workflowStates(
          filter: { name: { containsIgnoreCase: $name }, team: { id: { eq: $teamId } } }
          first: 1
        ) {
          nodes { id name }
        }
      }
    `

    const result = await this.query<{
      workflowStates: { nodes: Array<{ id: string; name: string }> }
    }>(query, { name, teamId })

    if (!result.success) {
      return result
    }

    const state = result.data.workflowStates?.nodes?.[0]
    if (!state) {
      return fail('NOT_FOUND', `State not found: ${name}`, 404)
    }

    return ok(state)
  }

  private async resolveLabel(name: string): Promise<Result<{ id: string; name: string }>> {
    const query = `
      query GetLabel($name: String!) {
        issueLabels(filter: { name: { containsIgnoreCase: $name } }, first: 1) {
          nodes { id name }
        }
      }
    `

    const result = await this.query<{ issueLabels: { nodes: Array<{ id: string; name: string }> } }>(
      query,
      { name }
    )

    if (!result.success) {
      return result
    }

    const label = result.data.issueLabels?.nodes?.[0]
    if (!label) {
      return fail('NOT_FOUND', `Label not found: ${name}`, 404)
    }

    return ok(label)
  }

  // --------------------------------------------------------------------------
  // GraphQL Helper
  // --------------------------------------------------------------------------

  private async query<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<Result<T>> {
    if (this.debug) {
      console.log('[LinearClient] Query:', query.trim().substring(0, 100))
      console.log('[LinearClient] Variables:', variables)
    }

    return graphqlRequest<T>(
      LINEAR_API,
      query,
      variables,
      { Authorization: this.apiKey },
      this.fetchFn,
      this.timeout
    )
  }
}
