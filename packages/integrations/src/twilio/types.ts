/**
 * Twilio API Types
 *
 * Type definitions for Twilio SMS and Voice APIs.
 * Based on Twilio REST API 2010-04-01.
 */

// ============================================================================
// Configuration
// ============================================================================

export interface TwilioConfig {
  /** Twilio Account SID */
  accountSid: string
  /** Twilio Auth Token or API Key Secret */
  authToken: string
  /** Optional: Default From phone number */
  defaultFrom?: string
  /** Optional: Messaging Service SID (alternative to From) */
  messagingServiceSid?: string
}

// ============================================================================
// Message Types (SMS/MMS)
// ============================================================================

export interface SendMessageParams {
  /** Recipient phone number (E.164 format) */
  to: string
  /** Sender phone number, short code, or alphanumeric ID */
  from?: string
  /** Messaging Service SID (alternative to from) */
  messagingServiceSid?: string
  /** Message body (max 1600 characters for SMS) */
  body?: string
  /** Media URLs for MMS (up to 10) */
  mediaUrl?: string[]
  /** Content template SID */
  contentSid?: string
  /** Webhook URL for status updates */
  statusCallback?: string
}

export interface Message {
  /** Message SID (unique identifier) */
  sid: string
  /** Account SID */
  accountSid: string
  /** Sender phone number */
  from: string
  /** Recipient phone number */
  to: string
  /** Message body */
  body: string
  /** Message status */
  status: MessageStatus
  /** Number of SMS segments */
  numSegments: string
  /** Number of media items */
  numMedia: string
  /** Direction of message */
  direction: 'inbound' | 'outbound-api' | 'outbound-call' | 'outbound-reply'
  /** Price in USD */
  price?: string
  /** Price unit */
  priceUnit?: string
  /** Error code if failed */
  errorCode?: number
  /** Error message if failed */
  errorMessage?: string
  /** Date created */
  dateCreated: string
  /** Date updated */
  dateUpdated: string
  /** Date sent */
  dateSent?: string
  /** API version */
  apiVersion: string
  /** Message URI */
  uri: string
  /** Media subresource URIs */
  subresourceUris?: {
    media?: string
  }
}

export type MessageStatus =
  | 'accepted'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'delivered'
  | 'undelivered'
  | 'receiving'
  | 'received'
  | 'read'

export interface ListMessagesParams {
  /** Filter by recipient */
  to?: string
  /** Filter by sender */
  from?: string
  /** Filter by date sent (on or after) */
  dateSentAfter?: string
  /** Filter by date sent (on or before) */
  dateSentBefore?: string
  /** Page size (default 50, max 1000) */
  pageSize?: number
}

export interface MessageList {
  messages: Message[]
  firstPageUri: string
  nextPageUri?: string
  previousPageUri?: string
  page: number
  pageSize: number
}

// ============================================================================
// Call Types (Voice)
// ============================================================================

export interface MakeCallParams {
  /** Recipient phone number (E.164 format) */
  to: string
  /** Caller ID phone number */
  from: string
  /** TwiML URL to execute when call connects */
  url?: string
  /** Inline TwiML for call handling */
  twiml?: string
  /** Webhook method for URL (GET or POST) */
  method?: 'GET' | 'POST'
  /** URL for call status updates */
  statusCallback?: string
  /** Events to receive status callbacks for */
  statusCallbackEvent?: CallStatusEvent[]
  /** Webhook method for status callback */
  statusCallbackMethod?: 'GET' | 'POST'
  /** Record the call */
  record?: boolean
  /** Recording channels (mono or dual) */
  recordingChannels?: 'mono' | 'dual'
  /** Timeout for answer in seconds */
  timeout?: number
  /** Machine detection mode */
  machineDetection?: 'Enable' | 'DetectMessageEnd'
  /** Caller ID name (CNAM) */
  callerName?: string
}

export interface Call {
  /** Call SID (unique identifier) */
  sid: string
  /** Account SID */
  accountSid: string
  /** Parent call SID (if child call) */
  parentCallSid?: string
  /** Caller phone number */
  from: string
  /** Formatted caller number */
  fromFormatted: string
  /** Recipient phone number */
  to: string
  /** Formatted recipient number */
  toFormatted: string
  /** Call status */
  status: CallStatus
  /** Call direction */
  direction: 'inbound' | 'outbound-api' | 'outbound-dial'
  /** Price in USD */
  price?: string
  /** Price unit */
  priceUnit?: string
  /** Call duration in seconds */
  duration?: string
  /** Date created */
  dateCreated: string
  /** Date updated */
  dateUpdated: string
  /** Answered by (human or machine) */
  answeredBy?: 'human' | 'machine_start' | 'machine_end_beep' | 'machine_end_silence' | 'machine_end_other' | 'fax' | 'unknown'
  /** API version */
  apiVersion: string
  /** Call URI */
  uri: string
  /** Subresource URIs */
  subresourceUris?: {
    recordings?: string
    notifications?: string
    payments?: string
    siprec?: string
    streams?: string
    transcriptions?: string
    user_defined_messages?: string
  }
}

export type CallStatus =
  | 'queued'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'busy'
  | 'failed'
  | 'no-answer'
  | 'canceled'

export type CallStatusEvent =
  | 'initiated'
  | 'ringing'
  | 'answered'
  | 'completed'

export interface UpdateCallParams {
  /** New status for call */
  status?: 'completed' | 'canceled'
  /** New URL for TwiML instructions */
  url?: string
  /** Inline TwiML to execute */
  twiml?: string
  /** HTTP method for URL */
  method?: 'GET' | 'POST'
  /** Status callback URL */
  statusCallback?: string
  /** Status callback method */
  statusCallbackMethod?: 'GET' | 'POST'
}

export interface ListCallsParams {
  /** Filter by recipient */
  to?: string
  /** Filter by caller */
  from?: string
  /** Filter by status */
  status?: CallStatus
  /** Filter by start time (on or after) */
  startTimeAfter?: string
  /** Filter by start time (on or before) */
  startTimeBefore?: string
  /** Filter by parent call SID */
  parentCallSid?: string
  /** Page size (default 50, max 1000) */
  pageSize?: number
}

export interface CallList {
  calls: Call[]
  firstPageUri: string
  nextPageUri?: string
  previousPageUri?: string
  page: number
  pageSize: number
}

// ============================================================================
// Recording Types
// ============================================================================

export interface Recording {
  /** Recording SID */
  sid: string
  /** Account SID */
  accountSid: string
  /** Call SID this recording is from */
  callSid: string
  /** Recording duration in seconds */
  duration: string
  /** Recording status */
  status: 'in-progress' | 'paused' | 'stopped' | 'processing' | 'completed' | 'absent'
  /** Number of channels */
  channels: number
  /** Audio source */
  source: 'DialVerb' | 'Conference' | 'OutboundAPI' | 'Trunking' | 'RecordVerb' | 'StartCallRecordingAPI' | 'StartConferenceRecordingAPI'
  /** Price in USD */
  price?: string
  /** Price unit */
  priceUnit?: string
  /** Date created */
  dateCreated: string
  /** Date updated */
  dateUpdated: string
  /** Recording URI */
  uri: string
  /** Media URL for recording file */
  mediaUrl?: string
}

export interface RecordingList {
  recordings: Recording[]
  firstPageUri: string
  nextPageUri?: string
  previousPageUri?: string
  page: number
  pageSize: number
}

export interface ListRecordingsParams {
  /** Filter by call SID */
  callSid?: string
  /** Filter by date created (on or after) */
  dateCreatedAfter?: string
  /** Filter by date created (on or before) */
  dateCreatedBefore?: string
  /** Page size (default 50, max 1000) */
  pageSize?: number
}

// ============================================================================
// Account Types
// ============================================================================

export interface Account {
  /** Account SID */
  sid: string
  /** Friendly name */
  friendlyName: string
  /** Account status */
  status: 'active' | 'suspended' | 'closed'
  /** Account type */
  type: 'Trial' | 'Full'
  /** Owner account SID (if subaccount) */
  ownerAccountSid?: string
  /** Date created */
  dateCreated: string
  /** Date updated */
  dateUpdated: string
  /** API version */
  apiVersion: string
  /** Account URI */
  uri: string
}

// ============================================================================
// Response Types
// ============================================================================

export interface SendMessageResponse {
  message: Message
}

export interface MakeCallResponse {
  call: Call
}
