/**
 * Figma API Client
 * https://www.figma.com/developers/api
 */

import { type Result, ok, fail, type ClientConfig } from '../types.js'
import type {
  FigmaFile,
  DocumentNode,
  ImageExportResponse,
  CommentsResponse,
  Comment,
  Project,
  ProjectFilesResponse,
} from './types.js'

export interface FigmaClientConfig extends ClientConfig {
  accessToken: string
  baseUrl?: string
}

export class FigmaClient {
  private accessToken: string
  private baseUrl: string
  private timeout: number
  private fetchFn: typeof fetch

  constructor(config: FigmaClientConfig) {
    this.accessToken = config.accessToken
    this.baseUrl = config.baseUrl ?? 'https://api.figma.com/v1'
    this.timeout = config.timeout ?? 30000
    this.fetchFn = config.fetch ?? fetch.bind(globalThis)
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Result<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const headers: Record<string, string> = {
        'X-Figma-Token': this.accessToken,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      }

      const response = await this.fetchFn(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        return fail(
          'FIGMA_API_ERROR',
          error.err || error.message || `HTTP ${response.status}`,
          response.status
        )
      }

      const data = await response.json()
      return ok(data as T)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        return fail('TIMEOUT', 'Request timed out', 408)
      }
      return fail(
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  // ============================================================================
  // Files
  // ============================================================================

  async getFile(
    fileKey: string,
    options?: { depth?: number }
  ): Promise<Result<FigmaFile>> {
    const params = options?.depth ? `?depth=${options.depth}` : ''
    return this.request<FigmaFile>(`/files/${fileKey}${params}`)
  }

  async getFileNodes(
    fileKey: string,
    nodeIds: string[]
  ): Promise<Result<{ nodes: Record<string, { document: DocumentNode }> }>> {
    const ids = nodeIds.join(',')
    return this.request<{ nodes: Record<string, { document: DocumentNode }> }>(
      `/files/${fileKey}/nodes?ids=${encodeURIComponent(ids)}`
    )
  }

  // ============================================================================
  // Images
  // ============================================================================

  async getImages(
    fileKey: string,
    nodeIds: string[],
    options?: { format?: 'jpg' | 'png' | 'svg' | 'pdf'; scale?: number }
  ): Promise<Result<ImageExportResponse>> {
    const params = new URLSearchParams()
    params.set('ids', nodeIds.join(','))
    if (options?.format) params.set('format', options.format)
    if (options?.scale) params.set('scale', String(options.scale))

    return this.request<ImageExportResponse>(
      `/images/${fileKey}?${params.toString()}`
    )
  }

  // ============================================================================
  // Comments
  // ============================================================================

  async getComments(fileKey: string): Promise<Result<CommentsResponse>> {
    return this.request<CommentsResponse>(`/files/${fileKey}/comments`)
  }

  async postComment(
    fileKey: string,
    message: string,
    options?: {
      nodeId?: string
      replyToId?: string
    }
  ): Promise<Result<Comment>> {
    const body: Record<string, unknown> = { message }
    if (options?.nodeId) {
      body.client_meta = { node_id: options.nodeId }
    }
    if (options?.replyToId) {
      body.comment_id = options.replyToId
    }

    return this.request<Comment>(`/files/${fileKey}/comments`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  // ============================================================================
  // Projects
  // ============================================================================

  async listProjects(teamId: string): Promise<Result<{ projects: Project[] }>> {
    return this.request<{ projects: Project[] }>(`/teams/${teamId}/projects`)
  }

  async getProjectFiles(projectId: string): Promise<Result<ProjectFilesResponse>> {
    return this.request<ProjectFilesResponse>(`/projects/${projectId}/files`)
  }
}
