/**
 * Hugging Face AI SDK Tools
 * MCP-compatible tools for Hugging Face inference and model discovery
 */

import { tool } from 'ai'
import { HuggingFaceClient } from './client.js'
import {
  InferenceInputSchema,
  ListModelsInputSchema,
  GetModelInputSchema,
  TextGenerationInputSchema,
  ImageClassificationInputSchema,
  ObjectDetectionInputSchema,
  SummarizationInputSchema,
  TranslationInputSchema,
} from './types.js'

export function createHuggingFaceTools(client: HuggingFaceClient) {
  return {
    // ========================================================================
    // Inference
    // ========================================================================
    huggingface_inference: tool({
      description:
        'Run inference on any Hugging Face model. Flexible input for various model types.',
      inputSchema: InferenceInputSchema,
      execute: async (params) => {
        const result = await client.inference({
          model: params.model,
          inputs: params.inputs,
          parameters: params.parameters,
          options: { wait_for_model: params.wait_for_model },
        })
        if (!result.success) throw new Error(result.error.message)

        return {
          model: params.model,
          output: result.data,
        }
      },
    }),

    // ========================================================================
    // Models
    // ========================================================================
    huggingface_list_models: tool({
      description:
        'Search and list Hugging Face models. Filter by author, pipeline type, or search query.',
      inputSchema: ListModelsInputSchema,
      execute: async (params) => {
        const result = await client.listModels({
          search: params.search,
          author: params.author,
          filter: params.filter,
          sort: params.sort,
          limit: params.limit,
        })
        if (!result.success) throw new Error(result.error.message)

        return {
          count: result.data.length,
          models: result.data.map((m) => ({
            id: m.id,
            author: m.author,
            pipeline: m.pipeline_tag,
            downloads: m.downloads,
            likes: m.likes,
            tags: m.tags.slice(0, 5),
          })),
        }
      },
    }),

    huggingface_get_model: tool({
      description: 'Get detailed information about a specific Hugging Face model.',
      inputSchema: GetModelInputSchema,
      execute: async (params) => {
        const result = await client.getModel(params.modelId)
        if (!result.success) throw new Error(result.error.message)

        return {
          id: result.data.id,
          author: result.data.author,
          pipeline: result.data.pipeline_tag,
          library: result.data.library_name,
          downloads: result.data.downloads,
          likes: result.data.likes,
          tags: result.data.tags,
          gated: result.data.gated,
          lastModified: result.data.lastModified,
        }
      },
    }),

    // ========================================================================
    // Text Generation
    // ========================================================================
    huggingface_text_generation: tool({
      description:
        'Generate text using a language model. Supports GPT-2, LLaMA, Mistral, and more.',
      inputSchema: TextGenerationInputSchema,
      execute: async (params) => {
        const result = await client.textGeneration({
          model: params.model,
          inputs: params.inputs,
          parameters: {
            max_new_tokens: params.max_new_tokens,
            temperature: params.temperature,
            top_p: params.top_p,
            do_sample: params.do_sample,
          },
        })
        if (!result.success) throw new Error(result.error.message)

        return {
          model: params.model,
          generated_text: result.data[0]?.generated_text ?? '',
        }
      },
    }),

    // ========================================================================
    // Image Tasks
    // ========================================================================
    huggingface_image_classification: tool({
      description:
        'Classify an image using a vision model. Returns labels with confidence scores.',
      inputSchema: ImageClassificationInputSchema,
      execute: async (params) => {
        const result = await client.imageClassification(params.model, params.image_url)
        if (!result.success) throw new Error(result.error.message)

        return {
          model: params.model,
          classifications: result.data.slice(0, 5).map((c) => ({
            label: c.label,
            confidence: Math.round(c.score * 100) / 100,
          })),
        }
      },
    }),

    huggingface_object_detection: tool({
      description:
        'Detect objects in an image. Returns bounding boxes with labels.',
      inputSchema: ObjectDetectionInputSchema,
      execute: async (params) => {
        const result = await client.objectDetection(params.model, params.image_url)
        if (!result.success) throw new Error(result.error.message)

        return {
          model: params.model,
          objects: result.data.map((o) => ({
            label: o.label,
            confidence: Math.round(o.score * 100) / 100,
            box: o.box,
          })),
        }
      },
    }),

    // ========================================================================
    // Text Tasks
    // ========================================================================
    huggingface_summarization: tool({
      description: 'Summarize text using a summarization model like BART or T5.',
      inputSchema: SummarizationInputSchema,
      execute: async (params) => {
        const result = await client.summarization({
          model: params.model,
          inputs: params.text,
          parameters: {
            max_length: params.max_length,
            min_length: params.min_length,
          },
        })
        if (!result.success) throw new Error(result.error.message)

        return {
          model: params.model,
          summary: result.data[0]?.summary_text ?? '',
        }
      },
    }),

    huggingface_translation: tool({
      description:
        'Translate text between languages. Use Helsinki-NLP models (e.g., Helsinki-NLP/opus-mt-en-fr).',
      inputSchema: TranslationInputSchema,
      execute: async (params) => {
        const result = await client.translation({
          model: params.model,
          inputs: params.text,
        })
        if (!result.success) throw new Error(result.error.message)

        return {
          model: params.model,
          translation: result.data[0]?.translation_text ?? '',
        }
      },
    }),
  }
}

export type HuggingFaceTools = ReturnType<typeof createHuggingFaceTools>
