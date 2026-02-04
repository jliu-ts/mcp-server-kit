/**
 * OpenAI Integration
 *
 * @example
 * ```typescript
 * import { OpenAIClient, createOpenAITools } from '@trendingsociety/integrations/openai'
 *
 * const client = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY })
 * const tools = createOpenAITools(client)
 *
 * // Use tools with AI SDK or MCP
 * const result = await tools.openai_chat_completion.execute({
 *   model: 'gpt-4o',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * })
 * ```
 */

export { OpenAIClient, type OpenAIClientConfig } from './client.js'
export { createOpenAITools, type OpenAITools } from './tools.js'
export {
  // Schemas
  ChatCompletionInputSchema,
  EmbeddingInputSchema,
  ListModelsInputSchema,
  ImageGenerateInputSchema,
  ImageEditInputSchema,
  SpeechInputSchema,
  TranscriptionInputSchema,
  ModerationInputSchema,
  ListFilesInputSchema,
  UploadFileInputSchema,
  FineTuneInputSchema,
  ListFineTunesInputSchema,
  // Types
  type OpenAIConfig,
  type ChatMessage,
  type ChatCompletionParams,
  type ChatCompletion,
  type EmbeddingParams,
  type EmbeddingResponse,
  type Model,
  type ModelsResponse,
  type ImageGenerateParams,
  type ImageEditParams,
  type ImageResponse,
  type SpeechParams,
  type TranscriptionParams,
  type TranscriptionResponse,
  type ModerationParams,
  type ModerationResponse,
  type FileObject,
  type FilesResponse,
  type UploadFileParams,
  type FineTuneParams,
  type FineTuneJob,
  type FineTuneJobsResponse,
} from './types.js'
