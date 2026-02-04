/**
 * ElevenLabs Types
 *
 * Types for ElevenLabs Text-to-Speech and Voice AI operations.
 */

// ============================================================================
// Voice Types
// ============================================================================

export interface Voice {
  voice_id: string
  name: string
  category?: string
  description?: string
  labels?: Record<string, string>
  preview_url?: string
  available_for_tiers?: string[]
  settings?: VoiceSettings
  samples?: VoiceSample[]
  fine_tuning?: FineTuning
}

export interface VoiceSettings {
  stability: number
  similarity_boost: number
  style?: number
  use_speaker_boost?: boolean
}

export interface VoiceSample {
  sample_id: string
  file_name: string
  mime_type: string
  size_bytes: number
  hash: string
}

export interface FineTuning {
  is_allowed_to_fine_tune: boolean
  finetuning_state: string
  verification_attempts_count: number
  manual_verification_requested: boolean
  slice_ids?: string[]
}

export interface VoicesResponse {
  voices: Voice[]
}

// ============================================================================
// Text-to-Speech Types
// ============================================================================

export interface TextToSpeechParams {
  /** The text to convert to speech */
  text: string
  /** Voice ID to use */
  voice_id: string
  /** Model ID (default: eleven_monolingual_v1) */
  model_id?: string
  /** Voice settings override */
  voice_settings?: VoiceSettings
  /** Output format */
  output_format?: OutputFormat
}

export type OutputFormat =
  | 'mp3_44100_128'
  | 'mp3_44100_192'
  | 'pcm_16000'
  | 'pcm_22050'
  | 'pcm_24000'
  | 'pcm_44100'
  | 'ulaw_8000'

export interface TextToSpeechResult {
  /** Audio data as base64 */
  audio_base64: string
  /** Content type */
  content_type: string
  /** Character count used */
  character_count: number
}

// ============================================================================
// Sound Effects Types
// ============================================================================

export interface SoundEffectParams {
  /** Text description of the sound effect */
  text: string
  /** Duration in seconds (0.5-22) */
  duration_seconds?: number
  /** Prompt influence (0-1) */
  prompt_influence?: number
}

export interface SoundEffectResult {
  /** Audio data as base64 */
  audio_base64: string
  /** Content type */
  content_type: string
}

// ============================================================================
// History Types
// ============================================================================

export interface HistoryItem {
  history_item_id: string
  request_id: string
  voice_id: string
  voice_name: string
  text: string
  date_unix: number
  character_count_change_from: number
  character_count_change_to: number
  content_type: string
  state: 'created' | 'deleted' | 'processing'
  settings?: VoiceSettings
  feedback?: {
    thumbs_up: boolean
    feedback: string
    emotions: boolean
    inaccurate_clone: boolean
    glitches: boolean
    audio_quality: boolean
    other: boolean
    review_status: string
  }
}

export interface HistoryResponse {
  history: HistoryItem[]
  has_more: boolean
  last_history_item_id?: string
}

export interface ListHistoryParams {
  page_size?: number
  start_after_history_item_id?: string
  voice_id?: string
}

// ============================================================================
// Model Types
// ============================================================================

export interface Model {
  model_id: string
  name: string
  description: string
  can_be_finetuned: boolean
  can_do_text_to_speech: boolean
  can_do_voice_conversion: boolean
  can_use_style: boolean
  can_use_speaker_boost: boolean
  serves_pro_voices: boolean
  token_cost_factor: number
  languages: ModelLanguage[]
}

export interface ModelLanguage {
  language_id: string
  name: string
}

export interface ModelsResponse {
  models: Model[]
}

// ============================================================================
// Subscription Types
// ============================================================================

export interface Subscription {
  tier: string
  character_count: number
  character_limit: number
  can_extend_character_limit: boolean
  allowed_to_extend_character_limit: boolean
  next_character_count_reset_unix: number
  voice_limit: number
  max_voice_add_edits: number
  voice_add_edit_counter: number
  professional_voice_limit: number
  can_extend_voice_limit: boolean
  can_use_instant_voice_cloning: boolean
  can_use_professional_voice_cloning: boolean
  currency: string
  status: string
}

export interface UserInfo {
  subscription: Subscription
  is_new_user: boolean
  xi_api_key: string
  can_use_delayed_payment_methods: boolean
  is_onboarding_completed: boolean
  first_name?: string
}

// ============================================================================
// API Params
// ============================================================================

export interface GetVoiceParams {
  voice_id: string
  with_settings?: boolean
}

export interface GetVoiceSettingsParams {
  voice_id: string
}

export interface EditVoiceSettingsParams {
  voice_id: string
  settings: VoiceSettings
}

export interface GetHistoryAudioParams {
  history_item_id: string
}

export interface DeleteHistoryItemParams {
  history_item_id: string
}

// ============================================================================
// Speech to Text Types
// ============================================================================

export interface SpeechToTextParams {
  /** Audio file as base64 or URL */
  audio_base64?: string
  /** URL to audio file (alternative to audio_base64) */
  audio_url?: string
  /** Model ID (default: scribe_v1) */
  model_id?: 'scribe_v1' | 'scribe_v1_experimental'
  /** Source language code (auto-detect if not specified) */
  language_code?: string
  /** Enable speaker diarization */
  diarize?: boolean
  /** Number of speakers (for diarization) */
  num_speakers?: number
  /** Include word-level timestamps */
  timestamps_granularity?: 'word' | 'segment'
}

export interface SpeechToTextResult {
  /** Transcribed text */
  text: string
  /** Language detected/used */
  language_code: string
  /** Word-level timestamps if requested */
  words?: Array<{
    text: string
    start: number
    end: number
    speaker?: string
  }>
  /** Segments with timestamps */
  segments?: Array<{
    text: string
    start: number
    end: number
    speaker?: string
  }>
}

// ============================================================================
// Audio Isolation Types
// ============================================================================

export interface AudioIsolationParams {
  /** Audio file as base64 */
  audio_base64: string
  /** Audio format */
  file_format?: 'pcm_s16le_16' | 'other'
}

export interface AudioIsolationResult {
  /** Isolated audio as base64 */
  audio_base64: string
  /** Content type */
  content_type: string
}

// ============================================================================
// Voice Changer (Speech-to-Speech) Types
// ============================================================================

export interface VoiceChangerParams {
  /** Audio file as base64 */
  audio_base64: string
  /** Target voice ID */
  voice_id: string
  /** Model ID (default: eleven_english_sts_v2) */
  model_id?: string
  /** Voice settings override */
  voice_settings?: VoiceSettings
  /** Remove background noise */
  remove_background_noise?: boolean
  /** Random seed for reproducibility */
  seed?: number
}

export interface VoiceChangerResult {
  /** Converted audio as base64 */
  audio_base64: string
  /** Content type */
  content_type: string
}

// ============================================================================
// Voice Cloning Types
// ============================================================================

export interface AddVoiceParams {
  /** Name for the new voice */
  name: string
  /** Audio samples as base64 (1-25 samples) */
  files_base64: string[]
  /** Voice description */
  description?: string
  /** Labels for the voice */
  labels?: Record<string, string>
  /** Remove background noise from samples */
  remove_background_noise?: boolean
}

export interface AddVoiceResult {
  /** ID of the created voice */
  voice_id: string
}

export interface DeleteVoiceParams {
  /** Voice ID to delete */
  voice_id: string
}

// ============================================================================
// Dubbing Types
// ============================================================================

export interface CreateDubbingParams {
  /** Audio/video file as base64 */
  file_base64?: string
  /** URL to audio/video file */
  source_url?: string
  /** Source language (auto-detect if not specified) */
  source_lang?: string
  /** Target language code */
  target_lang: string
  /** Number of speakers (0 for auto-detect) */
  num_speakers?: number
  /** Add watermark to output */
  watermark?: boolean
  /** Project name */
  name?: string
  /** Start time in source (seconds) */
  start_time?: number
  /** End time in source (seconds) */
  end_time?: number
  /** Use highest resolution */
  highest_resolution?: boolean
  /** Drop background audio */
  drop_background_audio?: boolean
}

export interface CreateDubbingResult {
  /** Dubbing project ID */
  dubbing_id: string
  /** Expected duration in seconds */
  expected_duration_sec?: number
}

export interface GetDubbingParams {
  /** Dubbing project ID */
  dubbing_id: string
}

export interface DubbingStatus {
  /** Dubbing project ID */
  dubbing_id: string
  /** Project name */
  name: string
  /** Current status */
  status: 'dubbing' | 'dubbed' | 'failed'
  /** Target languages */
  target_languages: string[]
  /** Error message if failed */
  error?: string
}

export interface GetDubbedAudioParams {
  /** Dubbing project ID */
  dubbing_id: string
  /** Language code for dubbed audio */
  language_code: string
}

export interface DeleteDubbingParams {
  /** Dubbing project ID */
  dubbing_id: string
}
