/**
 * ElevenLabs AI SDK Tools
 *
 * Tools for text-to-speech, voice management, and sound effects.
 */

import { tool } from 'ai'
import { z } from 'zod'
import type { ElevenLabsClient } from './client.js'

// ============================================================================
// Input Schemas
// ============================================================================

export const ListVoicesInputSchema = z.object({})

export const GetVoiceInputSchema = z.object({
  voice_id: z.string().describe('The voice ID to retrieve'),
  with_settings: z.boolean().optional().default(false).describe('Include voice settings in response'),
})

export const TextToSpeechInputSchema = z.object({
  text: z.string().min(1).max(5000).describe('Text to convert to speech (max 5000 characters)'),
  voice_id: z.string().describe('Voice ID to use for synthesis'),
  model_id: z
    .string()
    .optional()
    .describe('Model ID (default: eleven_monolingual_v1). Use eleven_multilingual_v2 for non-English.'),
  stability: z.number().min(0).max(1).optional().describe('Voice stability (0-1, default: 0.5)'),
  similarity_boost: z.number().min(0).max(1).optional().describe('Similarity boost (0-1, default: 0.75)'),
  output_format: z
    .enum(['mp3_44100_128', 'mp3_44100_192', 'pcm_16000', 'pcm_22050', 'pcm_24000', 'pcm_44100', 'ulaw_8000'])
    .optional()
    .describe('Audio output format (default: mp3_44100_128)'),
})

export const GenerateSoundEffectInputSchema = z.object({
  text: z.string().min(1).max(500).describe('Text description of the sound effect to generate'),
  duration_seconds: z.number().min(0.5).max(22).optional().describe('Duration in seconds (0.5-22)'),
  prompt_influence: z.number().min(0).max(1).optional().describe('How closely to follow the prompt (0-1)'),
})

export const ListHistoryInputSchema = z.object({
  page_size: z.number().min(1).max(1000).optional().describe('Number of items to return (default: 100)'),
  voice_id: z.string().optional().describe('Filter history by voice ID'),
})

export const GetHistoryItemInputSchema = z.object({
  history_item_id: z.string().describe('The history item ID to retrieve'),
})

export const DeleteHistoryItemInputSchema = z.object({
  history_item_id: z.string().describe('The history item ID to delete'),
})

export const GetHistoryAudioInputSchema = z.object({
  history_item_id: z.string().describe('The history item ID to get audio for'),
})

export const ListModelsInputSchema = z.object({})

export const GetUserInfoInputSchema = z.object({})

export const EditVoiceSettingsInputSchema = z.object({
  voice_id: z.string().describe('The voice ID to edit settings for'),
  stability: z.number().min(0).max(1).describe('Voice stability (0-1)'),
  similarity_boost: z.number().min(0).max(1).describe('Similarity boost (0-1)'),
  style: z.number().min(0).max(1).optional().describe('Style exaggeration (0-1, only for v2 models)'),
  use_speaker_boost: z.boolean().optional().describe('Enable speaker boost'),
})

// ============================================================================
// Speech to Text Input Schemas
// ============================================================================

export const SpeechToTextInputSchema = z.object({
  audio_base64: z.string().optional().describe('Audio file as base64 encoded string'),
  audio_url: z.string().url().optional().describe('URL to audio file (alternative to audio_base64)'),
  model_id: z
    .enum(['scribe_v1', 'scribe_v1_experimental'])
    .optional()
    .describe('Transcription model (default: scribe_v1)'),
  language_code: z.string().optional().describe('Source language code (auto-detect if not specified)'),
  diarize: z.boolean().optional().describe('Enable speaker diarization to identify different speakers'),
  num_speakers: z.number().min(1).max(10).optional().describe('Number of speakers (for diarization)'),
  timestamps_granularity: z
    .enum(['word', 'segment'])
    .optional()
    .describe('Include word-level or segment-level timestamps'),
})

// ============================================================================
// Audio Isolation Input Schemas
// ============================================================================

export const AudioIsolationInputSchema = z.object({
  audio_base64: z.string().describe('Audio file as base64 encoded string'),
  file_format: z
    .enum(['pcm_s16le_16', 'other'])
    .optional()
    .describe('Audio format hint for processing'),
})

// ============================================================================
// Voice Changer (Speech-to-Speech) Input Schemas
// ============================================================================

export const VoiceChangerInputSchema = z.object({
  audio_base64: z.string().describe('Source audio file as base64 encoded string'),
  voice_id: z.string().describe('Target voice ID to convert to'),
  model_id: z.string().optional().describe('Model ID (default: eleven_english_sts_v2)'),
  stability: z.number().min(0).max(1).optional().describe('Voice stability (0-1)'),
  similarity_boost: z.number().min(0).max(1).optional().describe('Similarity boost (0-1)'),
  remove_background_noise: z.boolean().optional().describe('Remove background noise from source audio'),
  seed: z.number().optional().describe('Random seed for reproducibility'),
})

// ============================================================================
// Voice Cloning Input Schemas
// ============================================================================

export const AddVoiceInputSchema = z.object({
  name: z.string().min(1).max(100).describe('Name for the new cloned voice'),
  files_base64: z
    .array(z.string())
    .min(1)
    .max(25)
    .describe('Audio samples as base64 (1-25 samples, each 1-30 seconds)'),
  description: z.string().max(500).optional().describe('Description of the voice'),
  labels: z.record(z.string()).optional().describe('Labels for the voice (e.g., {"accent": "British"})'),
  remove_background_noise: z.boolean().optional().describe('Remove background noise from samples'),
})

export const DeleteVoiceInputSchema = z.object({
  voice_id: z.string().describe('Voice ID to delete'),
})

// ============================================================================
// Dubbing Input Schemas
// ============================================================================

export const CreateDubbingInputSchema = z.object({
  file_base64: z.string().optional().describe('Audio/video file as base64'),
  source_url: z.string().url().optional().describe('URL to audio/video file (alternative to file_base64)'),
  source_lang: z.string().optional().describe('Source language code (auto-detect if not specified)'),
  target_lang: z.string().describe('Target language code for dubbing (e.g., "es", "fr", "de")'),
  num_speakers: z.number().min(0).max(10).optional().describe('Number of speakers (0 for auto-detect)'),
  watermark: z.boolean().optional().describe('Add watermark to output'),
  name: z.string().optional().describe('Project name for reference'),
  start_time: z.number().min(0).optional().describe('Start time in source (seconds)'),
  end_time: z.number().min(0).optional().describe('End time in source (seconds)'),
  highest_resolution: z.boolean().optional().describe('Use highest resolution output'),
  drop_background_audio: z.boolean().optional().describe('Drop background audio in output'),
})

export const GetDubbingInputSchema = z.object({
  dubbing_id: z.string().describe('Dubbing project ID'),
})

export const GetDubbedAudioInputSchema = z.object({
  dubbing_id: z.string().describe('Dubbing project ID'),
  language_code: z.string().describe('Language code for dubbed audio output'),
})

export const DeleteDubbingInputSchema = z.object({
  dubbing_id: z.string().describe('Dubbing project ID to delete'),
})

// ============================================================================
// Tool Factory
// ============================================================================

/**
 * Create AI SDK tools for ElevenLabs operations
 */
export function createElevenLabsTools(client: ElevenLabsClient) {
  return {
    elevenlabs_list_voices: tool({
      description:
        'List all available voices from ElevenLabs including premade voices and custom cloned voices.',
      inputSchema: ListVoicesInputSchema,
      execute: async () => {
        const result = await client.listVoices()
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          voices: result.data.map((v) => ({
            voice_id: v.voice_id,
            name: v.name,
            category: v.category,
            description: v.description,
            labels: v.labels,
            preview_url: v.preview_url,
          })),
          count: result.data.length,
        }
      },
    }),

    elevenlabs_get_voice: tool({
      description: 'Get detailed information about a specific voice including settings and samples.',
      inputSchema: GetVoiceInputSchema,
      execute: async (params) => {
        const result = await client.getVoice(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    elevenlabs_text_to_speech: tool({
      description:
        'Convert text to speech using ElevenLabs. Returns audio as base64. Use for generating voiceovers, narration, or any text-to-speech needs.',
      inputSchema: TextToSpeechInputSchema,
      execute: async (params) => {
        const { stability, similarity_boost, ...rest } = params
        const voice_settings =
          stability !== undefined || similarity_boost !== undefined
            ? {
                stability: stability ?? 0.5,
                similarity_boost: similarity_boost ?? 0.75,
              }
            : undefined

        const result = await client.textToSpeech({
          ...rest,
          voice_settings,
        })
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          audio_base64: result.data.audio_base64,
          content_type: result.data.content_type,
          character_count: result.data.character_count,
          text_length: params.text.length,
        }
      },
    }),

    elevenlabs_generate_sound_effect: tool({
      description:
        'Generate a sound effect from a text description. Great for creating ambient sounds, UI sounds, or any audio effects.',
      inputSchema: GenerateSoundEffectInputSchema,
      execute: async (params) => {
        const result = await client.generateSoundEffect(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          audio_base64: result.data.audio_base64,
          content_type: result.data.content_type,
          description: params.text,
        }
      },
    }),

    elevenlabs_list_history: tool({
      description: 'List generation history showing past text-to-speech conversions.',
      inputSchema: ListHistoryInputSchema,
      execute: async (params) => {
        const result = await client.listHistory(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          history: result.data.history.map((h) => ({
            history_item_id: h.history_item_id,
            voice_id: h.voice_id,
            voice_name: h.voice_name,
            text: h.text.substring(0, 100) + (h.text.length > 100 ? '...' : ''),
            date: new Date(h.date_unix * 1000).toISOString(),
            character_count: h.character_count_change_to - h.character_count_change_from,
            state: h.state,
          })),
          has_more: result.data.has_more,
          count: result.data.history.length,
        }
      },
    }),

    elevenlabs_get_history_item: tool({
      description: 'Get details of a specific history item including the full text used.',
      inputSchema: GetHistoryItemInputSchema,
      execute: async (params) => {
        const result = await client.getHistoryItem(params.history_item_id)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    elevenlabs_get_history_audio: tool({
      description: 'Download the audio from a previous generation in history.',
      inputSchema: GetHistoryAudioInputSchema,
      execute: async (params) => {
        const result = await client.getHistoryAudio(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return result.data
      },
    }),

    elevenlabs_delete_history_item: tool({
      description: 'Delete a history item to free up storage or remove unwanted generations.',
      inputSchema: DeleteHistoryItemInputSchema,
      execute: async (params) => {
        const result = await client.deleteHistoryItem(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return { success: true, deleted_id: params.history_item_id }
      },
    }),

    elevenlabs_list_models: tool({
      description:
        'List available ElevenLabs models. Different models support different languages and have different capabilities.',
      inputSchema: ListModelsInputSchema,
      execute: async () => {
        const result = await client.listModels()
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          models: result.data.map((m) => ({
            model_id: m.model_id,
            name: m.name,
            description: m.description,
            can_do_text_to_speech: m.can_do_text_to_speech,
            can_use_style: m.can_use_style,
            languages: m.languages.map((l) => l.name),
          })),
          count: result.data.length,
        }
      },
    }),

    elevenlabs_get_user_info: tool({
      description:
        'Get information about the current user including subscription status and character usage.',
      inputSchema: GetUserInfoInputSchema,
      execute: async () => {
        const result = await client.getUserInfo()
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          subscription: {
            tier: result.data.subscription.tier,
            character_count: result.data.subscription.character_count,
            character_limit: result.data.subscription.character_limit,
            characters_remaining:
              result.data.subscription.character_limit - result.data.subscription.character_count,
            next_reset: new Date(result.data.subscription.next_character_count_reset_unix * 1000).toISOString(),
            voice_limit: result.data.subscription.voice_limit,
            can_use_instant_voice_cloning: result.data.subscription.can_use_instant_voice_cloning,
          },
          is_new_user: result.data.is_new_user,
        }
      },
    }),

    elevenlabs_edit_voice_settings: tool({
      description:
        'Edit the default settings for a voice. Affects stability, similarity boost, and style.',
      inputSchema: EditVoiceSettingsInputSchema,
      execute: async (params) => {
        const { voice_id, ...settings } = params
        const result = await client.editVoiceSettings({
          voice_id,
          settings: {
            stability: settings.stability,
            similarity_boost: settings.similarity_boost,
            style: settings.style,
            use_speaker_boost: settings.use_speaker_boost,
          },
        })
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return { success: true, voice_id, updated_settings: result.data }
      },
    }),

    // ========================================================================
    // Speech to Text Tools
    // ========================================================================

    elevenlabs_speech_to_text: tool({
      description:
        'Transcribe audio to text using ElevenLabs Scribe. Supports speaker diarization and word-level timestamps. Provide either audio_base64 or audio_url.',
      inputSchema: SpeechToTextInputSchema,
      execute: async (params) => {
        if (!params.audio_base64 && !params.audio_url) {
          throw new Error('Either audio_base64 or audio_url must be provided')
        }
        const result = await client.speechToText(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          text: result.data.text,
          language_code: result.data.language_code,
          word_count: result.data.text.split(/\s+/).filter(Boolean).length,
          has_timestamps: !!(result.data.words || result.data.segments),
          segments: result.data.segments,
          words: result.data.words,
        }
      },
    }),

    // ========================================================================
    // Audio Isolation Tools
    // ========================================================================

    elevenlabs_isolate_audio: tool({
      description:
        'Remove background noise and isolate voice from audio. Returns cleaned audio with only the voice track.',
      inputSchema: AudioIsolationInputSchema,
      execute: async (params) => {
        const result = await client.isolateAudio(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          audio_base64: result.data.audio_base64,
          content_type: result.data.content_type,
        }
      },
    }),

    // ========================================================================
    // Voice Changer (Speech-to-Speech) Tools
    // ========================================================================

    elevenlabs_change_voice: tool({
      description:
        'Convert speech from one voice to another. Takes source audio and converts it to sound like a different voice while preserving the speech content.',
      inputSchema: VoiceChangerInputSchema,
      execute: async (params) => {
        const { stability, similarity_boost, ...rest } = params
        const voice_settings =
          stability !== undefined || similarity_boost !== undefined
            ? {
                stability: stability ?? 0.5,
                similarity_boost: similarity_boost ?? 0.75,
              }
            : undefined

        const result = await client.changeVoice({
          ...rest,
          voice_settings,
        })
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          audio_base64: result.data.audio_base64,
          content_type: result.data.content_type,
          target_voice_id: params.voice_id,
        }
      },
    }),

    // ========================================================================
    // Voice Cloning Tools
    // ========================================================================

    elevenlabs_add_voice: tool({
      description:
        'Create a new cloned voice from audio samples. Provide 1-25 audio samples (each 1-30 seconds) for best results. Higher quality samples produce better clones.',
      inputSchema: AddVoiceInputSchema,
      execute: async (params) => {
        const result = await client.addVoice(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          voice_id: result.data.voice_id,
          name: params.name,
          samples_count: params.files_base64.length,
        }
      },
    }),

    elevenlabs_delete_voice: tool({
      description: 'Delete a cloned voice. This action cannot be undone.',
      inputSchema: DeleteVoiceInputSchema,
      execute: async (params) => {
        const result = await client.deleteVoice(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return { success: true, deleted_voice_id: params.voice_id }
      },
    }),

    // ========================================================================
    // Dubbing Tools
    // ========================================================================

    elevenlabs_create_dubbing: tool({
      description:
        'Create a dubbing project to translate audio/video to another language. Automatically detects speakers and synthesizes voices in the target language. Provide either file_base64 or source_url.',
      inputSchema: CreateDubbingInputSchema,
      execute: async (params) => {
        if (!params.file_base64 && !params.source_url) {
          throw new Error('Either file_base64 or source_url must be provided')
        }
        const result = await client.createDubbing(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          dubbing_id: result.data.dubbing_id,
          expected_duration_sec: result.data.expected_duration_sec,
          target_lang: params.target_lang,
          status: 'dubbing',
        }
      },
    }),

    elevenlabs_get_dubbing: tool({
      description:
        'Get the status of a dubbing project. Check if dubbing is complete, in progress, or failed.',
      inputSchema: GetDubbingInputSchema,
      execute: async (params) => {
        const result = await client.getDubbing(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          dubbing_id: result.data.dubbing_id,
          name: result.data.name,
          status: result.data.status,
          target_languages: result.data.target_languages,
          error: result.data.error,
        }
      },
    }),

    elevenlabs_get_dubbed_audio: tool({
      description:
        'Download the dubbed audio/video for a completed dubbing project. Specify the target language to retrieve.',
      inputSchema: GetDubbedAudioInputSchema,
      execute: async (params) => {
        const result = await client.getDubbedAudio(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return {
          audio_base64: result.data.audio_base64,
          content_type: result.data.content_type,
          language_code: params.language_code,
        }
      },
    }),

    elevenlabs_delete_dubbing: tool({
      description: 'Delete a dubbing project and all associated files.',
      inputSchema: DeleteDubbingInputSchema,
      execute: async (params) => {
        const result = await client.deleteDubbing(params)
        if (!result.success) {
          throw new Error(result.error.message)
        }
        return { success: true, deleted_dubbing_id: params.dubbing_id }
      },
    }),
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type ElevenLabsTools = ReturnType<typeof createElevenLabsTools>
