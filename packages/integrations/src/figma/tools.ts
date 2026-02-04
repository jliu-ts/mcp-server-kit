/**
 * Figma AI SDK Tools
 * MCP-compatible tools for Figma design operations
 */

import { tool } from 'ai'
import { FigmaClient } from './client.js'
import {
  GetFileInputSchema,
  GetFileNodesInputSchema,
  GetImagesInputSchema,
  GetCommentsInputSchema,
  PostCommentInputSchema,
  ListProjectsInputSchema,
} from './types.js'

export function createFigmaTools(client: FigmaClient) {
  return {
    // ========================================================================
    // Files
    // ========================================================================
    figma_get_file: tool({
      description:
        'Get a Figma file with its document structure, components, and styles.',
      inputSchema: GetFileInputSchema,
      execute: async (params) => {
        const result = await client.getFile(params.fileKey, { depth: params.depth })
        if (!result.success) throw new Error(result.error.message)

        const file = result.data
        return {
          name: file.name,
          lastModified: file.lastModified,
          version: file.version,
          thumbnailUrl: file.thumbnailUrl,
          componentCount: Object.keys(file.components).length,
          styleCount: Object.keys(file.styles).length,
          document: {
            id: file.document.id,
            name: file.document.name,
            type: file.document.type,
            childCount: file.document.children?.length ?? 0,
          },
        }
      },
    }),

    figma_get_file_nodes: tool({
      description: 'Get specific nodes from a Figma file by their IDs.',
      inputSchema: GetFileNodesInputSchema,
      execute: async (params) => {
        const result = await client.getFileNodes(params.fileKey, params.nodeIds)
        if (!result.success) throw new Error(result.error.message)

        const nodes = Object.entries(result.data.nodes).map(([id, data]) => ({
          id,
          name: data.document.name,
          type: data.document.type,
          hasChildren: !!data.document.children?.length,
        }))

        return {
          count: nodes.length,
          nodes,
        }
      },
    }),

    // ========================================================================
    // Images
    // ========================================================================
    figma_get_images: tool({
      description:
        'Export nodes as images (PNG, JPG, SVG, or PDF). Returns URLs to download.',
      inputSchema: GetImagesInputSchema,
      execute: async (params) => {
        const result = await client.getImages(params.fileKey, params.nodeIds, {
          format: params.format,
          scale: params.scale,
        })
        if (!result.success) throw new Error(result.error.message)

        const images = Object.entries(result.data.images).map(([nodeId, url]) => ({
          nodeId,
          url,
          format: params.format,
        }))

        return {
          count: images.length,
          images,
        }
      },
    }),

    // ========================================================================
    // Comments
    // ========================================================================
    figma_get_comments: tool({
      description: 'List all comments on a Figma file.',
      inputSchema: GetCommentsInputSchema,
      execute: async (params) => {
        const result = await client.getComments(params.fileKey)
        if (!result.success) throw new Error(result.error.message)

        return {
          count: result.data.comments.length,
          comments: result.data.comments.map((c) => ({
            id: c.id,
            message: c.message,
            author: c.user.handle,
            createdAt: c.created_at,
            resolved: !!c.resolved_at,
            isReply: !!c.parent_id,
          })),
        }
      },
    }),

    figma_post_comment: tool({
      description: 'Add a comment to a Figma file, optionally on a specific node.',
      inputSchema: PostCommentInputSchema,
      execute: async (params) => {
        const result = await client.postComment(params.fileKey, params.message, {
          nodeId: params.nodeId,
          replyToId: params.replyToId,
        })
        if (!result.success) throw new Error(result.error.message)

        return {
          id: result.data.id,
          message: result.data.message,
          createdAt: result.data.created_at,
        }
      },
    }),

    // ========================================================================
    // Projects
    // ========================================================================
    figma_list_projects: tool({
      description: 'List projects in a Figma team.',
      inputSchema: ListProjectsInputSchema,
      execute: async (params) => {
        const result = await client.listProjects(params.teamId)
        if (!result.success) throw new Error(result.error.message)

        return {
          count: result.data.projects.length,
          projects: result.data.projects.map((p) => ({
            id: p.id,
            name: p.name,
          })),
        }
      },
    }),
  }
}

export type FigmaTools = ReturnType<typeof createFigmaTools>
