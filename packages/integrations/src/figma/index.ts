/**
 * Figma Integration
 *
 * @example
 * ```typescript
 * import { FigmaClient, createFigmaTools } from '@trendingsociety/integrations/figma'
 *
 * const client = new FigmaClient({ accessToken: process.env.FIGMA_ACCESS_TOKEN })
 * const tools = createFigmaTools(client)
 *
 * // Get file info
 * const result = await tools.figma_get_file.execute({
 *   fileKey: 'abc123XYZ',
 * })
 *
 * // Export nodes as images
 * const images = await tools.figma_get_images.execute({
 *   fileKey: 'abc123XYZ',
 *   nodeIds: ['1:2', '1:3'],
 *   format: 'png',
 *   scale: 2,
 * })
 * ```
 */

export { FigmaClient, type FigmaClientConfig } from './client.js'
export { createFigmaTools, type FigmaTools } from './tools.js'
export {
  // Schemas
  GetFileInputSchema,
  GetFileNodesInputSchema,
  GetImagesInputSchema,
  GetCommentsInputSchema,
  PostCommentInputSchema,
  ListProjectsInputSchema,
  // Types
  type FigmaConfig,
  type FigmaFile,
  type DocumentNode,
  type Component,
  type Style,
  type ImageExportParams,
  type ImageExportResponse,
  type Comment,
  type CommentsResponse,
  type PostCommentParams,
  type Project,
  type ProjectFile,
  type ProjectFilesResponse,
} from './types.js'
