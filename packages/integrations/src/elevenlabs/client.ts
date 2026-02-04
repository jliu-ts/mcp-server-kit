/**
 * ElevenLabs Client
 *
 * Runtime-agnostic client for ElevenLabs Text-to-Speech and Voice AI.
 * Works in Node.js, Edge runtimes, and Cloudflare Workers.
 *
 * @example
 * import { ElevenLabsClient } from '@trendingsociety/integrations/elevenlabs'
 *
 * const eleven = new ElevenLabsClient({
 *   apiKey: process.env.ELEVENLABS_API_KEY,
 * })
 *
 * // Generate speech
 * const audio = await eleven.textToSpeech({
 *   text: 'Hello world!',
 *   voice_id: 'EXAVITQu4vr4xnSDxMaL', // Sarah
 * })
 *
 * // List voices
 * const voices = await eleven.listVoices()
 */

import { ok, fail, type Result, type ClientConfig } from '../types.js'
import type {
  Voice,
  VoiceSettings,
  VoicesResponse,
  TextToSpeechParams,
  TextToSpeechResult,
  SoundEffectParams,
  SoundEffectResult,
  HistoryResponse,
  HistoryItem,
  ListHistoryParams,
  Model,
  UserInfo,
  GetVoiceParams,
  GetVoiceSettingsParams,
  EditVoiceSettingsParams,
  GetHistoryAudioParams,
  DeleteHistoryItemParams,
  SpeechToTextParams,
  SpeechToTextResult,
  AudioIsolationParams,
  AudioIsolationResult,
  VoiceChangerParams,
  VoiceChangerResult,
  AddVoiceParams,
  AddVoiceResult,
  DeleteVoiceParams,
  CreateDubbingParams,
  CreateDubbingResult,
  GetDubbingParams,
  DubbingStatus,
  GetDubbedAudioParams,
  DeleteDubbingParams,
} from './types.js'

// ============================================================================
// Configuration
// ============================================================================

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

export interface ElevenLabsClientConfig extends ClientConfig {
  /** ElevenLabs API Key */
  apiKey: string
}

// ============================================================================
// Client Implementation
// ============================================================================

export class ElevenLabsClient {
  private apiKey: string
  private timeout: number
  private fetchFn: typeof fetch
  private debug: boolean

  constructor(config: ElevenLabsClientConfig) {
    if (!config.apiKey) {
      throw new Error('ElevenLabsClient requires apiKey')
    }

    this.apiKey = config.apiKey
    this.timeout = config.timeout ?? 60000 // 60s default for audio generation
    this.fetchFn = config.fetch ?? fetch.bind(globalThis)
    this.debug = config.debug ?? false
  }

  // --------------------------------------------------------------------------
  // Voices
  // --------------------------------------------------------------------------

  /**
   * List all available voices
   */
  async listVoices(): Promise<Result<Voice[]>> {
    const result = await this.request<VoicesResponse>('/voices')
    if (!result.success) return result
    return ok(result.data.voices)
  }

  /**
   * Get a specific voice by ID
   */
  async getVoice(params: GetVoiceParams): Promise<Result<Voice>> {
    const query = params.with_settings ? '?with_settings=true' : ''
    return this.request<Voice>(`/voices/${params.voice_id}${query}`)
  }

  /**
   * Get default voice settings
   */
  async getDefaultVoiceSettings(): Promise<Result<VoiceSettings>> {
    return this.request<VoiceSettings>('/voices/settings/default')
  }

  /**
   * Get voice settings for a specific voice
   */
  async getVoiceSettings(params: GetVoiceSettingsParams): Promise<Result<VoiceSettings>> {
    return this.request<VoiceSettings>(`/voices/${params.voice_id}/settings`)
  }

  /**
   * Edit voice settings
   */
  async editVoiceSettings(params: EditVoiceSettingsParams): Promise<Result<VoiceSettings>> {
    return this.request<VoiceSettings>(`/voices/${params.voice_id}/settings/edit`, {
      method: 'POST',
      body: JSON.stringify(params.settings),
    })
  }

  // --------------------------------------------------------------------------
  // Text-to-Speech
  // --------------------------------------------------------------------------

  /**
   * Convert text to speech
   */
  async textToSpeech(params: TextToSpeechParams): Promise<Result<TextToSpeechResult>> {
    const { voice_id, text, model_id, voice_settings, output_format } = params

    if (!text || text.trim().length === 0) {
      return fail('INVALID_PARAMS', 'Text is required')
    }

    const format = output_format ?? 'mp3_44100_128'
    const url = `/text-to-speech/${voice_id}?output_format=${format}`

    const body: Record<string, unknown> = {
      text,
      model_id: model_id ?? 'eleven_monolingual_v1',
    }

    if (voice_settings) {
      body.voice_settings = voice_settings
    }

    if (this.debug) {
      console.log('[ElevenLabsClient] TTS request:', { voice_id, text: text.substring(0, 50) + '...' })
    }

    const result = await this.requestAudio(url, {
      method: 'POST',
      body: JSON.stringify(body),
    })

    if (!result.success) return result

    return ok({
      audio_base64: result.data.audio_base64,
      content_type: result.data.content_type,
      character_count: text.length,
    })
  }

  /**
   * Stream text-to-speech (returns audio as it's generated)
   * Note: For edge runtimes, this returns the full audio after generation
   */
  async textToSpeechStream(params: TextToSpeechParams): Promise<Result<TextToSpeechResult>> {
    const { voice_id, text, model_id, voice_settings, output_format } = params

    if (!text || text.trim().length === 0) {
      return fail('INVALID_PARAMS', 'Text is required')
    }

    const format = output_format ?? 'mp3_44100_128'
    const url = `/text-to-speech/${voice_id}/stream?output_format=${format}`

    const body: Record<string, unknown> = {
      text,
      model_id: model_id ?? 'eleven_monolingual_v1',
    }

    if (voice_settings) {
      body.voice_settings = voice_settings
    }

    return this.requestAudio(url, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((result) => {
      if (!result.success) return result
      return ok({
        audio_base64: result.data.audio_base64,
        content_type: result.data.content_type,
        character_count: text.length,
      })
    })
  }

  // --------------------------------------------------------------------------
  // Sound Effects
  // --------------------------------------------------------------------------

  /**
   * Generate a sound effect from a text description
   */
  async generateSoundEffect(params: SoundEffectParams): Promise<Result<SoundEffectResult>> {
    const { text, duration_seconds, prompt_influence } = params

    if (!text || text.trim().length === 0) {
      return fail('INVALID_PARAMS', 'Text description is required')
    }

    const body: Record<string, unknown> = { text }
    if (duration_seconds !== undefined) {
      body.duration_seconds = duration_seconds
    }
    if (prompt_influence !== undefined) {
      body.prompt_influence = prompt_influence
    }

    if (this.debug) {
      console.log('[ElevenLabsClient] Sound effect request:', { text: text.substring(0, 50) })
    }

    return this.requestAudio('/sound-generation', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  // --------------------------------------------------------------------------
  // History
  // --------------------------------------------------------------------------

  /**
   * List generation history
   */
  async listHistory(params?: ListHistoryParams): Promise<Result<HistoryResponse>> {
    const queryParams = new URLSearchParams()
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString())
    if (params?.start_after_history_item_id) {
      queryParams.append('start_after_history_item_id', params.start_after_history_item_id)
    }
    if (params?.voice_id) queryParams.append('voice_id', params.voice_id)

    const query = queryParams.toString()
    return this.request<HistoryResponse>(`/history${query ? `?${query}` : ''}`)
  }

  /**
   * Get a specific history item
   */
  async getHistoryItem(historyItemId: string): Promise<Result<HistoryItem>> {
    return this.request<HistoryItem>(`/history/${historyItemId}`)
  }

  /**
   * Get audio from a history item
   */
  async getHistoryAudio(params: GetHistoryAudioParams): Promise<Result<{ audio_base64: string; content_type: string }>> {
    return this.requestAudio(`/history/${params.history_item_id}/audio`)
  }

  /**
   * Delete a history item
   */
  async deleteHistoryItem(params: DeleteHistoryItemParams): Promise<Result<void>> {
    return this.request<void>(`/history/${params.history_item_id}`, {
      method: 'DELETE',
    })
  }

  // --------------------------------------------------------------------------
  // Models
  // --------------------------------------------------------------------------

  /**
   * List available models
   */
  async listModels(): Promise<Result<Model[]>> {
    const result = await this.request<Model[]>('/models')
    return result
  }

  // --------------------------------------------------------------------------
  // User
  // --------------------------------------------------------------------------

  /**
   * Get user info and subscription status
   */
  async getUserInfo(): Promise<Result<UserInfo>> {
    return this.request<UserInfo>('/user')
  }

  /**
   * Get subscription info
   */
  async getSubscription(): Promise<Result<UserInfo['subscription']>> {
    const result = await this.request<UserInfo>('/user/subscription')
    if (!result.success) return result
    return ok(result.data.subscription)
  }

  // --------------------------------------------------------------------------
  // Speech to Text
  // --------------------------------------------------------------------------

  /**
   * Transcribe audio to text
   */
  async speechToText(params: SpeechToTextParams): Promise<Result<SpeechToTextResult>> {
    if (!params.audio_base64 && !params.audio_url) {
      return fail('INVALID_PARAMS', 'Either audio_base64 or audio_url is required')
    }

    // Build form data for multipart request
    const formData = new FormData()

    if (params.audio_base64) {
      // Convert base64 to blob
      const binaryString = atob(params.audio_base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' })
      formData.append('audio', blob, 'audio.mp3')
    } else if (params.audio_url) {
      formData.append('cloud_storage_url', params.audio_url)
    }

    if (params.model_id) formData.append('model_id', params.model_id)
    if (params.language_code) formData.append('language_code', params.language_code)
    if (params.diarize) formData.append('diarize', 'true')
    if (params.num_speakers) formData.append('num_speakers', params.num_speakers.toString())
    if (params.timestamps_granularity) formData.append('timestamps_granularity', params.timestamps_granularity)

    return this.requestFormData<SpeechToTextResult>('/speech-to-text', formData)
  }

  // --------------------------------------------------------------------------
  // Audio Isolation
  // --------------------------------------------------------------------------

  /**
   * Remove background noise from audio, isolating the voice
   */
  async isolateAudio(params: AudioIsolationParams): Promise<Result<AudioIsolationResult>> {
    // Convert base64 to blob
    const binaryString = atob(params.audio_base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: 'audio/mpeg' })

    const formData = new FormData()
    formData.append('audio', blob, 'audio.mp3')
    if (params.file_format) formData.append('file_format', params.file_format)

    return this.requestFormDataAudio('/audio-isolation', formData)
  }

  // --------------------------------------------------------------------------
  // Voice Changer (Speech-to-Speech)
  // --------------------------------------------------------------------------

  /**
   * Convert speech to a different voice while preserving emotion and intonation
   */
  async changeVoice(params: VoiceChangerParams): Promise<Result<VoiceChangerResult>> {
    // Convert base64 to blob
    const binaryString = atob(params.audio_base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: 'audio/mpeg' })

    const formData = new FormData()
    formData.append('audio', blob, 'audio.mp3')
    if (params.model_id) formData.append('model_id', params.model_id)
    if (params.voice_settings) formData.append('voice_settings', JSON.stringify(params.voice_settings))
    if (params.remove_background_noise) formData.append('remove_background_noise', 'true')
    if (params.seed !== undefined) formData.append('seed', params.seed.toString())

    return this.requestFormDataAudio(`/speech-to-speech/${params.voice_id}`, formData)
  }

  // --------------------------------------------------------------------------
  // Voice Cloning
  // --------------------------------------------------------------------------

  /**
   * Create a new voice clone from audio samples
   */
  async addVoice(params: AddVoiceParams): Promise<Result<AddVoiceResult>> {
    if (!params.files_base64 || params.files_base64.length === 0) {
      return fail('INVALID_PARAMS', 'At least one audio sample is required')
    }

    const formData = new FormData()
    formData.append('name', params.name)

    // Add audio files
    for (let i = 0; i < params.files_base64.length; i++) {
      const binaryString = atob(params.files_base64[i]!)
      const bytes = new Uint8Array(binaryString.length)
      for (let j = 0; j < binaryString.length; j++) {
        bytes[j] = binaryString.charCodeAt(j)
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' })
      formData.append('files', blob, `sample_${i}.mp3`)
    }

    if (params.description) formData.append('description', params.description)
    if (params.labels) formData.append('labels', JSON.stringify(params.labels))
    if (params.remove_background_noise) formData.append('remove_background_noise', 'true')

    return this.requestFormData<AddVoiceResult>('/voices/add', formData)
  }

  /**
   * Delete a voice clone
   */
  async deleteVoice(params: DeleteVoiceParams): Promise<Result<void>> {
    return this.request<void>(`/voices/${params.voice_id}`, {
      method: 'DELETE',
    })
  }

  // --------------------------------------------------------------------------
  // Dubbing
  // --------------------------------------------------------------------------

  /**
   * Create a dubbing project to translate audio/video into another language
   */
  async createDubbing(params: CreateDubbingParams): Promise<Result<CreateDubbingResult>> {
    if (!params.file_base64 && !params.source_url) {
      return fail('INVALID_PARAMS', 'Either file_base64 or source_url is required')
    }

    const formData = new FormData()

    if (params.file_base64) {
      const binaryString = atob(params.file_base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: 'video/mp4' })
      formData.append('file', blob, 'video.mp4')
    } else if (params.source_url) {
      formData.append('source_url', params.source_url)
    }

    formData.append('target_lang', params.target_lang)
    if (params.source_lang) formData.append('source_lang', params.source_lang)
    if (params.num_speakers !== undefined) formData.append('num_speakers', params.num_speakers.toString())
    if (params.watermark !== undefined) formData.append('watermark', params.watermark.toString())
    if (params.name) formData.append('name', params.name)
    if (params.start_time !== undefined) formData.append('start_time', params.start_time.toString())
    if (params.end_time !== undefined) formData.append('end_time', params.end_time.toString())
    if (params.highest_resolution) formData.append('highest_resolution', 'true')
    if (params.drop_background_audio) formData.append('drop_background_audio', 'true')

    return this.requestFormData<CreateDubbingResult>('/dubbing', formData)
  }

  /**
   * Get dubbing project status
   */
  async getDubbing(params: GetDubbingParams): Promise<Result<DubbingStatus>> {
    return this.request<DubbingStatus>(`/dubbing/${params.dubbing_id}`)
  }

  /**
   * Get dubbed audio for a completed project
   */
  async getDubbedAudio(params: GetDubbedAudioParams): Promise<Result<{ audio_base64: string; content_type: string }>> {
    return this.requestAudio(`/dubbing/${params.dubbing_id}/audio/${params.language_code}`)
  }

  /**
   * Delete a dubbing project
   */
  async deleteDubbing(params: DeleteDubbingParams): Promise<Result<void>> {
    return this.request<void>(`/dubbing/${params.dubbing_id}`, {
      method: 'DELETE',
    })
  }

  // --------------------------------------------------------------------------
  // Internal Request Handlers
  // --------------------------------------------------------------------------

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Result<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await this.fetchFn(`${ELEVENLABS_API_URL}${endpoint}`, {
        ...options,
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          return fail(
            errorJson.detail?.status || 'API_ERROR',
            errorJson.detail?.message || `ElevenLabs API error (${response.status})`,
            response.status
          )
        } catch {
          return fail('API_ERROR', `ElevenLabs API error (${response.status}): ${errorText}`, response.status)
        }
      }

      // Handle empty responses (like DELETE)
      const contentLength = response.headers.get('content-length')
      if (contentLength === '0' || response.status === 204) {
        return ok(undefined as T)
      }

      const data = await response.json() as T

      if (this.debug) {
        console.log('[ElevenLabsClient] Response:', JSON.stringify(data, null, 2).substring(0, 500))
      }

      return ok(data)
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return fail('TIMEOUT', `Request timed out after ${this.timeout}ms`)
        }
        return fail('NETWORK_ERROR', error.message)
      }

      return fail('UNKNOWN_ERROR', String(error))
    }
  }

  private async requestAudio(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Result<{ audio_base64: string; content_type: string }>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await this.fetchFn(`${ELEVENLABS_API_URL}${endpoint}`, {
        ...options,
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          return fail(
            errorJson.detail?.status || 'API_ERROR',
            errorJson.detail?.message || `ElevenLabs API error (${response.status})`,
            response.status
          )
        } catch {
          return fail('API_ERROR', `ElevenLabs API error (${response.status}): ${errorText}`, response.status)
        }
      }

      const arrayBuffer = await response.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // Convert to base64
      let binary = ''
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]!)
      }
      const audio_base64 = btoa(binary)

      const content_type = response.headers.get('content-type') || 'audio/mpeg'

      if (this.debug) {
        console.log('[ElevenLabsClient] Audio response:', {
          size: arrayBuffer.byteLength,
          content_type
        })
      }

      return ok({ audio_base64, content_type })
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return fail('TIMEOUT', `Request timed out after ${this.timeout}ms`)
        }
        return fail('NETWORK_ERROR', error.message)
      }

      return fail('UNKNOWN_ERROR', String(error))
    }
  }

  /**
   * Request handler for multipart form data (JSON response)
   */
  private async requestFormData<T>(
    endpoint: string,
    formData: FormData
  ): Promise<Result<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await this.fetchFn(`${ELEVENLABS_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          Accept: 'application/json',
          // Note: Don't set Content-Type - browser will set it with boundary
        },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          return fail(
            errorJson.detail?.status || 'API_ERROR',
            errorJson.detail?.message || `ElevenLabs API error (${response.status})`,
            response.status
          )
        } catch {
          return fail('API_ERROR', `ElevenLabs API error (${response.status}): ${errorText}`, response.status)
        }
      }

      const data = await response.json() as T

      if (this.debug) {
        console.log('[ElevenLabsClient] FormData response:', JSON.stringify(data, null, 2).substring(0, 500))
      }

      return ok(data)
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return fail('TIMEOUT', `Request timed out after ${this.timeout}ms`)
        }
        return fail('NETWORK_ERROR', error.message)
      }

      return fail('UNKNOWN_ERROR', String(error))
    }
  }

  /**
   * Request handler for multipart form data (audio response)
   */
  private async requestFormDataAudio(
    endpoint: string,
    formData: FormData
  ): Promise<Result<{ audio_base64: string; content_type: string }>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await this.fetchFn(`${ELEVENLABS_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          Accept: 'audio/mpeg',
          // Note: Don't set Content-Type - browser will set it with boundary
        },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          return fail(
            errorJson.detail?.status || 'API_ERROR',
            errorJson.detail?.message || `ElevenLabs API error (${response.status})`,
            response.status
          )
        } catch {
          return fail('API_ERROR', `ElevenLabs API error (${response.status}): ${errorText}`, response.status)
        }
      }

      const arrayBuffer = await response.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // Convert to base64
      let binary = ''
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]!)
      }
      const audio_base64 = btoa(binary)

      const content_type = response.headers.get('content-type') || 'audio/mpeg'

      if (this.debug) {
        console.log('[ElevenLabsClient] FormData audio response:', {
          size: arrayBuffer.byteLength,
          content_type
        })
      }

      return ok({ audio_base64, content_type })
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return fail('TIMEOUT', `Request timed out after ${this.timeout}ms`)
        }
        return fail('NETWORK_ERROR', error.message)
      }

      return fail('UNKNOWN_ERROR', String(error))
    }
  }
}
