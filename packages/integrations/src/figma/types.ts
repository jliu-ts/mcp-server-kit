/**
 * Figma API Types
 * https://www.figma.com/developers/api
 */

import { z } from 'zod'

// ============================================================================
// Configuration
// ============================================================================

export interface FigmaConfig {
  accessToken: string
  baseUrl?: string
  timeout?: number
}

// ============================================================================
// Files
// ============================================================================

export interface FigmaFile {
  name: string
  lastModified: string
  thumbnailUrl: string
  version: string
  document: DocumentNode
  components: Record<string, Component>
  styles: Record<string, Style>
}

export interface DocumentNode {
  id: string
  name: string
  type: string
  children?: DocumentNode[]
}

export interface Component {
  key: string
  name: string
  description: string
  componentSetId?: string
}

export interface Style {
  key: string
  name: string
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID'
  description: string
}

// ============================================================================
// Images
// ============================================================================

export interface ImageExportParams {
  fileKey: string
  ids: string[]
  scale?: number
  format?: 'jpg' | 'png' | 'svg' | 'pdf'
}

export interface ImageExportResponse {
  err: string | null
  images: Record<string, string>
}

// ============================================================================
// Comments
// ============================================================================

export interface Comment {
  id: string
  message: string
  file_key: string
  parent_id?: string
  user: {
    id: string
    handle: string
    img_url: string
  }
  created_at: string
  resolved_at?: string
  order_id: string
}

export interface CommentsResponse {
  comments: Comment[]
}

export interface PostCommentParams {
  fileKey: string
  message: string
  client_meta?: {
    x?: number
    y?: number
    node_id?: string
    node_offset?: { x: number; y: number }
  }
  comment_id?: string // For replies
}

// ============================================================================
// Projects
// ============================================================================

export interface Project {
  id: string
  name: string
}

export interface ProjectFile {
  key: string
  name: string
  thumbnail_url: string
  last_modified: string
}

export interface ProjectFilesResponse {
  name: string
  files: ProjectFile[]
}

// ============================================================================
// Zod Schemas for Tool Inputs
// ============================================================================

export const GetFileInputSchema = z.object({
  fileKey: z.string().describe('Figma file key (from URL: figma.com/file/{fileKey}/...)'),
  depth: z.number().min(1).max(5).default(2).describe('Depth of document tree to return'),
})

export const GetFileNodesInputSchema = z.object({
  fileKey: z.string().describe('Figma file key'),
  nodeIds: z.array(z.string()).describe('Node IDs to retrieve'),
})

export const GetImagesInputSchema = z.object({
  fileKey: z.string().describe('Figma file key'),
  nodeIds: z.array(z.string()).describe('Node IDs to export as images'),
  format: z.enum(['jpg', 'png', 'svg', 'pdf']).default('png').describe('Export format'),
  scale: z.number().min(0.01).max(4).default(1).describe('Export scale (0.01-4)'),
})

export const GetCommentsInputSchema = z.object({
  fileKey: z.string().describe('Figma file key'),
})

export const PostCommentInputSchema = z.object({
  fileKey: z.string().describe('Figma file key'),
  message: z.string().describe('Comment message'),
  nodeId: z.string().optional().describe('Node ID to attach comment to'),
  replyToId: z.string().optional().describe('Comment ID to reply to'),
})

export const ListProjectsInputSchema = z.object({
  teamId: z.string().describe('Figma team ID'),
})
