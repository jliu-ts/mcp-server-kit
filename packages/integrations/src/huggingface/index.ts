/**
 * Hugging Face Integration
 *
 * @example
 * ```typescript
 * import { HuggingFaceClient, createHuggingFaceTools } from '@trendingsociety/integrations/huggingface'
 *
 * const client = new HuggingFaceClient({ apiKey: process.env.HUGGINGFACE_API_KEY })
 * const tools = createHuggingFaceTools(client)
 *
 * // Generate text
 * const result = await tools.huggingface_text_generation.execute({
 *   model: 'gpt2',
 *   inputs: 'Once upon a time',
 *   max_new_tokens: 50,
 * })
 *
 * // Classify an image
 * const classification = await tools.huggingface_image_classification.execute({
 *   model: 'google/vit-base-patch16-224',
 *   image_url: 'https://example.com/cat.jpg',
 * })
 * ```
 */

export { HuggingFaceClient, type HuggingFaceClientConfig } from './client.js'
export { createHuggingFaceTools, type HuggingFaceTools } from './tools.js'
export {
  // Schemas
  InferenceInputSchema,
  ListModelsInputSchema,
  GetModelInputSchema,
  TextGenerationInputSchema,
  ImageClassificationInputSchema,
  ObjectDetectionInputSchema,
  SummarizationInputSchema,
  TranslationInputSchema,
  // Types
  type HuggingFaceConfig,
  type Model,
  type ModelSearchParams,
  type InferenceParams,
  type TextGenerationParams,
  type TextGenerationResponse,
  type SummarizationParams,
  type SummarizationResponse,
  type TranslationParams,
  type TranslationResponse,
  type ImageClassificationParams,
  type ImageClassificationResponse,
  type ObjectDetectionParams,
  type ObjectDetectionResponse,
} from './types.js'
