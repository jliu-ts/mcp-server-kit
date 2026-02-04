/**
 * OpenAI AI SDK Tools
 * MCP-compatible tools for OpenAI API operations
 */

import { tool } from 'ai'
import { OpenAIClient } from './client.js'
import {
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
} from './types.js'

export function createOpenAITools(client: OpenAIClient) {
  return {
    // ========================================================================
    // Chat Completions
    // ========================================================================
    openai_chat_completion: tool({
      description:
        'Create a chat completion using OpenAI GPT models. Supports GPT-4o, GPT-4o-mini, GPT-3.5-turbo, and other models.',
      inputSchema: ChatCompletionInputSchema,
      execute: async (params) => {
        const result = await client.createChatCompletion({
          model: params.model,
          messages: params.messages,
          temperature: params.temperature,
          max_tokens: params.max_tokens,
        })
        if (!result.success) throw new Error(result.error.message)
        return {
          id: result.data.id,
          model: result.data.model,
          message: result.data.choices[0]?.message,
          finish_reason: result.data.choices[0]?.finish_reason,
          usage: result.data.usage,
        }
      },
    }),

    // ========================================================================
    // Embeddings
    // ========================================================================
    openai_create_embedding: tool({
      description:
        'Generate embeddings for text using OpenAI embedding models. Useful for semantic search, clustering, and similarity.',
      inputSchema: EmbeddingInputSchema,
      execute: async (params) => {
        const result = await client.createEmbedding({
          model: params.model,
          input: params.input,
          dimensions: params.dimensions,
        })
        if (!result.success) throw new Error(result.error.message)
        return {
          model: result.data.model,
          embeddings: result.data.data.map((d) => ({
            index: d.index,
            dimensions: d.embedding.length,
            // Return first/last few values as preview (full embedding too large)
            preview: [...d.embedding.slice(0, 3), '...', ...d.embedding.slice(-3)],
          })),
          usage: result.data.usage,
        }
      },
    }),

    // ========================================================================
    // Models
    // ========================================================================
    openai_list_models: tool({
      description: 'List all available OpenAI models including GPT-4, GPT-3.5, embeddings, and more.',
      inputSchema: ListModelsInputSchema,
      execute: async () => {
        const result = await client.listModels()
        if (!result.success) throw new Error(result.error.message)
        return {
          count: result.data.data.length,
          models: result.data.data
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((m) => ({
              id: m.id,
              owned_by: m.owned_by,
            })),
        }
      },
    }),

    // ========================================================================
    // Images
    // ========================================================================
    openai_create_image: tool({
      description:
        'Generate images using DALL-E 3 or DALL-E 2. Create images from text descriptions.',
      inputSchema: ImageGenerateInputSchema,
      execute: async (params) => {
        const result = await client.createImage({
          prompt: params.prompt,
          model: params.model,
          size: params.size,
          quality: params.quality,
          n: params.n,
        })
        if (!result.success) throw new Error(result.error.message)
        return {
          created: result.data.created,
          images: result.data.data.map((img) => ({
            url: img.url,
            revised_prompt: img.revised_prompt,
          })),
        }
      },
    }),

    openai_edit_image: tool({
      description:
        'Edit an existing image using DALL-E 2. Provide a base image and describe the changes.',
      inputSchema: ImageEditInputSchema,
      execute: async (params) => {
        const result = await client.editImage({
          image: params.image,
          prompt: params.prompt,
          mask: params.mask,
          size: params.size,
        })
        if (!result.success) throw new Error(result.error.message)
        return {
          created: result.data.created,
          images: result.data.data.map((img) => ({
            url: img.url,
          })),
        }
      },
    }),

    // ========================================================================
    // Audio
    // ========================================================================
    openai_create_speech: tool({
      description:
        'Convert text to speech using OpenAI TTS models. Choose from 6 voices: alloy, echo, fable, onyx, nova, shimmer.',
      inputSchema: SpeechInputSchema,
      execute: async (params) => {
        const result = await client.createSpeech({
          model: params.model,
          input: params.input,
          voice: params.voice,
          speed: params.speed,
          response_format: params.response_format,
        })
        if (!result.success) throw new Error(result.error.message)
        return {
          format: result.data.format,
          audio_base64: result.data.audio,
        }
      },
    }),

    openai_create_transcription: tool({
      description:
        'Transcribe audio to text using Whisper. Supports multiple languages and formats.',
      inputSchema: TranscriptionInputSchema,
      execute: async (params) => {
        const result = await client.createTranscription({
          file: params.file,
          model: params.model,
          language: params.language,
          prompt: params.prompt,
        })
        if (!result.success) throw new Error(result.error.message)
        return {
          text: result.data.text,
          language: result.data.language,
          duration: result.data.duration,
        }
      },
    }),

    // ========================================================================
    // Moderation
    // ========================================================================
    openai_create_moderation: tool({
      description:
        'Check if text violates OpenAI usage policies. Detects hate, violence, sexual content, and more.',
      inputSchema: ModerationInputSchema,
      execute: async (params) => {
        const result = await client.createModeration({
          input: params.input,
        })
        if (!result.success) throw new Error(result.error.message)
        return {
          id: result.data.id,
          results: result.data.results.map((r) => ({
            flagged: r.flagged,
            categories: Object.entries(r.categories)
              .filter(([, v]) => v)
              .map(([k]) => k),
            scores: Object.entries(r.category_scores)
              .filter(([, v]) => v > 0.1)
              .map(([k, v]) => ({ category: k, score: Math.round(v * 100) / 100 })),
          })),
        }
      },
    }),

    // ========================================================================
    // Files
    // ========================================================================
    openai_list_files: tool({
      description: 'List files uploaded to OpenAI for fine-tuning or assistants.',
      inputSchema: ListFilesInputSchema,
      execute: async (params) => {
        const result = await client.listFiles(params.purpose)
        if (!result.success) throw new Error(result.error.message)
        return {
          count: result.data.data.length,
          files: result.data.data.map((f) => ({
            id: f.id,
            filename: f.filename,
            bytes: f.bytes,
            purpose: f.purpose,
            status: f.status,
            created_at: new Date(f.created_at * 1000).toISOString(),
          })),
        }
      },
    }),

    openai_upload_file: tool({
      description: 'Upload a file to OpenAI for fine-tuning or use with assistants.',
      inputSchema: UploadFileInputSchema,
      execute: async (params) => {
        const result = await client.uploadFile({
          file: params.file,
          filename: params.filename,
          purpose: params.purpose,
        })
        if (!result.success) throw new Error(result.error.message)
        return {
          id: result.data.id,
          filename: result.data.filename,
          bytes: result.data.bytes,
          purpose: result.data.purpose,
          status: result.data.status,
        }
      },
    }),

    // ========================================================================
    // Fine-tuning
    // ========================================================================
    openai_create_fine_tune: tool({
      description:
        'Start a fine-tuning job to customize an OpenAI model with your training data.',
      inputSchema: FineTuneInputSchema,
      execute: async (params) => {
        const result = await client.createFineTune({
          training_file: params.training_file,
          model: params.model,
          validation_file: params.validation_file,
          suffix: params.suffix,
        })
        if (!result.success) throw new Error(result.error.message)
        return {
          id: result.data.id,
          model: result.data.model,
          status: result.data.status,
          created_at: new Date(result.data.created_at * 1000).toISOString(),
        }
      },
    }),

    openai_list_fine_tunes: tool({
      description: 'List fine-tuning jobs and their status.',
      inputSchema: ListFineTunesInputSchema,
      execute: async (params) => {
        const result = await client.listFineTunes(params.limit)
        if (!result.success) throw new Error(result.error.message)
        return {
          count: result.data.data.length,
          has_more: result.data.has_more,
          jobs: result.data.data.map((j) => ({
            id: j.id,
            model: j.model,
            fine_tuned_model: j.fine_tuned_model,
            status: j.status,
            created_at: new Date(j.created_at * 1000).toISOString(),
            finished_at: j.finished_at
              ? new Date(j.finished_at * 1000).toISOString()
              : null,
          })),
        }
      },
    }),
  }
}

export type OpenAITools = ReturnType<typeof createOpenAITools>
