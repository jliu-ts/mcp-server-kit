/**
 * @trendingsociety/integrations
 *
 * Third-party integration clients for the platform.
 * Provides typed, runtime-agnostic clients for Linear, Shopify, Slack, and more.
 *
 * @example
 * // Linear integration
 * import { LinearClient } from '@trendingsociety/integrations/linear'
 * const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })
 * const issues = await linear.listIssues({ team: 'Product' })
 *
 * @example
 * // Shopify integration
 * import { ShopifyClient } from '@trendingsociety/integrations/shopify'
 * const shopify = new ShopifyClient({
 *   storeDomain: 'mystore.myshopify.com',
 *   accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
 * })
 * const products = await shopify.getProducts()
 *
 * @example
 * // Slack integration
 * import { SlackClient, SlackBlocks } from '@trendingsociety/integrations/slack'
 * const slack = new SlackClient({ webhookUrl: process.env.SLACK_WEBHOOK_URL })
 * await slack.sendMessage({ text: 'Hello!' })
 */

// ============================================================================
// Shared Types
// ============================================================================

export {
  fail,
  ok,
  type ClientConfig,
  type IntegrationError,
  type PaginatedResult,
  type Result,
} from "./types.js";

// ============================================================================
// Linear
// ============================================================================

export { LinearClient, type LinearClientConfig } from "./linear/client.js";
export { createLinearTools, type LinearTools } from "./linear/tools.js";
export type {
  CreateCommentParams,
  CreateCommentResponse,
  CreateIssueParams,
  CreateIssueResponse,
  GetIssueParams,
  LinearComment,
  LinearIssue,
  LinearLabel,
  LinearProject,
  LinearState,
  LinearTeam,
  LinearUser,
  ListIssuesParams,
  ListIssuesResponse,
  UpdateIssueParams,
  UpdateIssueResponse,
} from "./linear/types.js";

// ============================================================================
// Shopify (Admin API + Storefront API)
// ============================================================================

export { ShopifyClient, type ShopifyClientConfig } from "./shopify/client.js";
export {
  StorefrontClient,
  type StorefrontClientConfig,
} from "./shopify/storefront-client.js";
export {
  createStorefrontTools,
  type StorefrontTools,
} from "./shopify/storefront-tools.js";
export { createShopifyTools, type ShopifyTools } from "./shopify/tools.js";
export type {
  GetCustomersParams,
  GetCustomersResponse,
  GetOrdersParams,
  GetOrdersResponse,
  GetProductsParams,
  GetProductsResponse,
  Money,
  ProductVariant,
  ShopifyCustomer,
  ShopifyOrder,
  ShopifyProduct,
} from "./shopify/types.js";

// ============================================================================
// Slack
// ============================================================================

export { SlackClient, type SlackClientConfig } from "./slack/client.js";
export { createSlackTools, type SlackTools } from "./slack/tools.js";
export {
  SlackBlocks,
  type Block,
  type ContextBlock,
  type DividerBlock,
  type HeaderBlock,
  type SectionBlock,
  type SendMessageParams,
  type SendMessageResponse,
  type TextObject,
} from "./slack/types.js";

// ============================================================================
// Pollo.AI (Video Generation)
// ============================================================================

export { PolloClient, type PolloClientConfig } from "./pollo/client.js";
export { createPolloTools, type PolloTools } from "./pollo/tools.js";
export type {
  CreditBalance,
  GenerateVideoResponse,
  GetTaskStatusParams,
  ImageToVideoParams,
  Resolution,
  TaskStatus,
  TextToVideoParams,
  VideoModel,
  VideoStatusResponse,
} from "./pollo/types.js";

// ============================================================================
// Tavily (AI Search)
// ============================================================================

export { TavilyClient, type TavilyClientConfig } from "./tavily/client.js";
export { createTavilyTools, type TavilyTools } from "./tavily/tools.js";
export type {
  ExtractParams,
  ExtractResponse,
  ExtractedContent,
  SearchImage,
  SearchParams,
  SearchResponse,
  SearchResult,
} from "./tavily/types.js";

// ============================================================================
// Supabase (Database)
// ============================================================================

export {
  SupabaseClient,
  type SupabaseClientConfig,
} from "./supabase/client.js";
export { createSupabaseTools, type SupabaseTools } from "./supabase/tools.js";
export type {
  ColumnInfo,
  GetSchemaParams,
  GetSchemaResponse,
  ListTablesParams,
  ListTablesResponse,
  QueryParams,
  QueryResponse,
  TableInfo,
} from "./supabase/types.js";

// ============================================================================
// Google Workspace (Gmail, Calendar, Drive)
// ============================================================================

export { GoogleClient, type GoogleClientConfig } from "./google/client.js";
export { createGoogleTools, type GoogleTools } from "./google/tools.js";
export type {
  CreateEventParams as CalendarCreateEventParams,
  // Calendar
  CalendarEvent,
  CalendarList,
  ListCalendarsResponse as CalendarListCalendarsResponse,
  ListEventsParams as CalendarListEventsParams,
  ListEventsResponse as CalendarListEventsResponse,
  // Drive
  DriveFile,
  DriveFileList,
  GetFileParams as DriveGetFileParams,
  ListFilesParams as DriveListFilesParams,
  GetMessageParams as GmailGetMessageParams,
  GmailLabel,
  // Params
  ListMessagesParams as GmailListMessagesParams,
  // Responses
  ListMessagesResponse as GmailListMessagesResponse,
  // Gmail
  GmailMessage,
  GmailMessagePart,
  SendMessageParams as GmailSendMessageParams,
  GmailThread,
} from "./google/types.js";

// ============================================================================
// WebScraper (Web Content Extraction)
// ============================================================================

export {
  WebScraperClient,
  type WebScraperClientConfig,
} from "./webscraper/client.js";
export {
  createWebScraperTools,
  type WebScraperTools,
} from "./webscraper/tools.js";
export type {
  BatchFetchParams,
  BatchFetchResult,
  ExtractLinksParams,
  ExtractMetadataParams,
  ExtractTextParams,
  ExtractedText,
  FetchPageParams,
  PageContent,
  PageImage,
  PageLink,
  PageMetadata,
} from "./webscraper/types.js";

// ============================================================================
// ElevenLabs (Text-to-Speech & Sound Effects)
// ============================================================================

export {
  ElevenLabsClient,
  type ElevenLabsClientConfig,
} from "./elevenlabs/client.js";
export {
  createElevenLabsTools,
  type ElevenLabsTools,
} from "./elevenlabs/tools.js";
export type {
  HistoryItem,
  HistoryResponse,
  ListHistoryParams,
  Model,
  ModelLanguage,
  OutputFormat,
  SoundEffectParams,
  SoundEffectResult,
  Subscription,
  TextToSpeechParams,
  TextToSpeechResult,
  UserInfo,
  Voice,
  VoiceSample,
  VoiceSettings,
} from "./elevenlabs/types.js";

// ============================================================================
// Stripe (Payments, Subscriptions, Invoices)
// ============================================================================

export { StripeClient, type StripeClientConfig } from "./stripe/client.js";
export { createStripeTools, type StripeTools } from "./stripe/tools.js";
export type {
  InvoiceStatus,
  PaymentIntentStatus,
  RefundStatus,
  Address as StripeAddress,
  // Balance
  StripeBalance,
  StripeBalanceTransaction,
  // Charges
  StripeCharge,
  CreateCustomerParams as StripeCreateCustomerParams,
  CreateInvoiceParams as StripeCreateInvoiceParams,
  CreatePaymentIntentParams as StripeCreatePaymentIntentParams,
  CreatePriceParams as StripeCreatePriceParams,
  CreateProductParams as StripeCreateProductParams,
  CreateRefundParams as StripeCreateRefundParams,
  CreateSubscriptionParams as StripeCreateSubscriptionParams,
  // Customers
  StripeCustomer,
  // Invoices
  StripeInvoice,
  ListBalanceTransactionsParams as StripeListBalanceTransactionsParams,
  ListChargesParams as StripeListChargesParams,
  ListCustomersParams as StripeListCustomersParams,
  ListCustomersResponse as StripeListCustomersResponse,
  ListInvoicesParams as StripeListInvoicesParams,
  ListPaymentIntentsParams as StripeListPaymentIntentsParams,
  ListPricesParams as StripeListPricesParams,
  ListProductsParams as StripeListProductsParams,
  ListRefundsParams as StripeListRefundsParams,
  ListSubscriptionsParams as StripeListSubscriptionsParams,
  ListWebhookEndpointsParams as StripeListWebhookEndpointsParams,
  Metadata as StripeMetadata,
  // Core types
  Money as StripeMoney,
  // Payment Intents
  StripePaymentIntent,
  // Prices
  StripePrice,
  // Products
  StripeProduct,
  // Refunds
  StripeRefund,
  // Subscriptions
  StripeSubscription,
  UpdateCustomerParams as StripeUpdateCustomerParams,
  UpdateProductParams as StripeUpdateProductParams,
  UpdateSubscriptionParams as StripeUpdateSubscriptionParams,
  // Webhooks
  StripeWebhookEndpoint,
  SubscriptionStatus,
} from "./stripe/types.js";

// ============================================================================
// Webflow (CMS & Site Management)
// ============================================================================

export { WebflowClient, type WebflowClientConfig } from "./webflow/client.js";
export { createWebflowTools, type WebflowTools } from "./webflow/tools.js";
export type {
  AssetVariant,
  CollectionField,
  CollectionFieldType,
  CustomCodeScript,
  CustomDomain,
  SiteLocale,
  WebflowAsset,
  WebflowCollection,
  WebflowCollectionItem,
  CreateCollectionItemParams as WebflowCreateCollectionItemParams,
  WebflowCustomCode,
  DeleteCollectionItemParams as WebflowDeleteCollectionItemParams,
  GetAssetParams as WebflowGetAssetParams,
  GetCollectionItemParams as WebflowGetCollectionItemParams,
  GetCollectionParams as WebflowGetCollectionParams,
  GetPageCustomCodeParams as WebflowGetPageCustomCodeParams,
  GetPageParams as WebflowGetPageParams,
  // Custom Code
  GetSiteCustomCodeParams as WebflowGetSiteCustomCodeParams,
  GetSiteParams as WebflowGetSiteParams,
  // Assets
  ListAssetsParams as WebflowListAssetsParams,
  ListAssetsResponse as WebflowListAssetsResponse,
  // Collection Items
  ListCollectionItemsParams as WebflowListCollectionItemsParams,
  ListCollectionItemsResponse as WebflowListCollectionItemsResponse,
  // Collections
  ListCollectionsParams as WebflowListCollectionsParams,
  ListCollectionsResponse as WebflowListCollectionsResponse,
  // Pages
  ListPagesParams as WebflowListPagesParams,
  ListPagesResponse as WebflowListPagesResponse,
  // Sites
  ListSitesParams as WebflowListSitesParams,
  ListSitesResponse as WebflowListSitesResponse,
  WebflowPage,
  PageMetadata as WebflowPageMetadata,
  PageOpenGraph as WebflowPageOpenGraph,
  PageSeo as WebflowPageSeo,
  PaginationInfo as WebflowPaginationInfo,
  PublishCollectionItemsParams as WebflowPublishCollectionItemsParams,
  PublishSiteParams as WebflowPublishSiteParams,
  RegisterPageCustomCodeParams as WebflowRegisterPageCustomCodeParams,
  RegisterSiteCustomCodeParams as WebflowRegisterSiteCustomCodeParams,
  // Core types
  WebflowSite,
  UpdateCollectionItemParams as WebflowUpdateCollectionItemParams,
  UpdatePageMetadataParams as WebflowUpdatePageMetadataParams,
} from "./webflow/types.js";

// ============================================================================
// Twilio (SMS, MMS, Voice)
// ============================================================================

export { TwilioClient, type TwilioClientConfig } from "./twilio/client.js";
export { createTwilioTools, type TwilioTools } from "./twilio/tools.js";
export type {
  Account as TwilioAccount,
  Call as TwilioCall,
  CallList as TwilioCallList,
  CallStatus as TwilioCallStatus,
  CallStatusEvent as TwilioCallStatusEvent,
  TwilioConfig,
  ListCallsParams as TwilioListCallsParams,
  ListMessagesParams as TwilioListMessagesParams,
  ListRecordingsParams as TwilioListRecordingsParams,
  MakeCallParams as TwilioMakeCallParams,
  Message as TwilioMessage,
  MessageList as TwilioMessageList,
  MessageStatus as TwilioMessageStatus,
  Recording as TwilioRecording,
  RecordingList as TwilioRecordingList,
  SendMessageParams as TwilioSendMessageParams,
  UpdateCallParams as TwilioUpdateCallParams,
} from "./twilio/types.js";

// ============================================================================
// OpenAI (GPT, DALL-E, Whisper, Embeddings)
// ============================================================================

export { OpenAIClient, type OpenAIClientConfig } from "./openai/client.js";
export { createOpenAITools, type OpenAITools } from "./openai/tools.js";
export type {
  ChatCompletion as OpenAIChatCompletion,
  ChatCompletionParams as OpenAIChatCompletionParams,
  ChatMessage as OpenAIChatMessage,
  OpenAIConfig,
  EmbeddingParams as OpenAIEmbeddingParams,
  EmbeddingResponse as OpenAIEmbeddingResponse,
  ImageEditParams as OpenAIImageEditParams,
  ImageGenerateParams as OpenAIImageGenerateParams,
  ImageResponse as OpenAIImageResponse,
  Model as OpenAIModel,
  ModelsResponse as OpenAIModelsResponse,
  ModerationParams as OpenAIModerationParams,
  ModerationResponse as OpenAIModerationResponse,
  SpeechParams as OpenAISpeechParams,
  TranscriptionParams as OpenAITranscriptionParams,
  TranscriptionResponse as OpenAITranscriptionResponse,
} from "./openai/types.js";

// ============================================================================
// Anthropic (Claude)
// ============================================================================

export {
  AnthropicClient,
  type AnthropicClientConfig,
} from "./anthropic/client.js";
export {
  createAnthropicTools,
  type AnthropicTools,
} from "./anthropic/tools.js";
export type {
  BatchListResponse as AnthropicBatchListResponse,
  BatchRequest as AnthropicBatchRequest,
  BatchResponse as AnthropicBatchResponse,
  AnthropicConfig,
  ContentBlock as AnthropicContentBlock,
  CountTokensParams as AnthropicCountTokensParams,
  CreateBatchParams as AnthropicCreateBatchParams,
  CreateMessageParams as AnthropicCreateMessageParams,
  Message as AnthropicMessage,
  MessageResponse as AnthropicMessageResponse,
  Model as AnthropicModel,
  ModelsResponse as AnthropicModelsResponse,
  TokenCountResponse as AnthropicTokenCountResponse,
} from "./anthropic/types.js";

// NOTE: Firecrawl has been deprecated and replaced by the self-hosted Crawler Worker
// See: services/crawler/ and packages/integrations/src/crawlee/

// ============================================================================
// Airtable (Database)
// ============================================================================

export {
  AirtableClient,
  type AirtableClientConfig,
} from "./airtable/client.js";
export { createAirtableTools, type AirtableTools } from "./airtable/tools.js";
export type {
  Base as AirtableBase,
  BaseSchema as AirtableBaseSchema,
  BasesResponse as AirtableBasesResponse,
  Comment as AirtableComment,
  CommentsResponse as AirtableCommentsResponse,
  AirtableConfig,
  CreateRecordParams as AirtableCreateRecordParams,
  Field as AirtableField,
  ListRecordsParams as AirtableListRecordsParams,
  AirtableRecord,
  RecordFields as AirtableRecordFields,
  RecordsResponse as AirtableRecordsResponse,
  Table as AirtableTable,
  UpdateRecordParams as AirtableUpdateRecordParams,
  View as AirtableView,
} from "./airtable/types.js";

// ============================================================================
// Notion (Pages, Databases, Comments)
// ============================================================================

export { NotionClient, type NotionClientConfig } from "./notion/client.js";
export { createNotionTools, type NotionTools } from "./notion/tools.js";
export type {
  Block as NotionBlock,
  BlocksResponse as NotionBlocksResponse,
  NotionComment,
  CommentsResponse as NotionCommentsResponse,
  NotionConfig,
  NotionDatabase,
  DatabaseProperty as NotionDatabaseProperty,
  DatabaseQueryResponse as NotionDatabaseQueryResponse,
  NotionPage,
  Parent as NotionParent,
  PropertyValue as NotionPropertyValue,
  RichText as NotionRichText,
  SearchResponse as NotionSearchResponse,
  NotionUser,
} from "./notion/types.js";

// ============================================================================
// N8N (Workflow Automation)
// ============================================================================

export { N8NClient, type N8NClientConfig } from "./n8n/client.js";
export { createN8NTools, type N8NTools } from "./n8n/tools.js";
export type {
  N8NConfig,
  Credential as N8NCredential,
  CredentialType as N8NCredentialType,
  Execution as N8NExecution,
  ExecutionsResponse as N8NExecutionsResponse,
  Tag as N8NTag,
  Workflow as N8NWorkflow,
  WorkflowNode as N8NWorkflowNode,
  WorkflowsResponse as N8NWorkflowsResponse,
} from "./n8n/types.js";

// ============================================================================
// Perplexity (AI Search)
// ============================================================================

export {
  PerplexityClient,
  type PerplexityClientConfig,
} from "./perplexity/client.js";
export {
  createPerplexityTools,
  type PerplexityTools,
} from "./perplexity/tools.js";
export {
  PERPLEXITY_MODELS,
  type ChatCompletion as PerplexityChatCompletion,
  type ChatCompletionParams as PerplexityChatCompletionParams,
  type ChatMessage as PerplexityChatMessage,
  type PerplexityConfig,
  type PerplexityModel,
} from "./perplexity/types.js";

// ============================================================================
// Hugging Face (ML Inference)
// ============================================================================

export {
  HuggingFaceClient,
  type HuggingFaceClientConfig,
} from "./huggingface/client.js";
export {
  createHuggingFaceTools,
  type HuggingFaceTools,
} from "./huggingface/tools.js";
export type {
  HuggingFaceConfig,
  ImageClassificationParams as HuggingFaceImageClassificationParams,
  ImageClassificationResponse as HuggingFaceImageClassificationResponse,
  InferenceParams as HuggingFaceInferenceParams,
  Model as HuggingFaceModel,
  ModelSearchParams as HuggingFaceModelSearchParams,
  ObjectDetectionParams as HuggingFaceObjectDetectionParams,
  ObjectDetectionResponse as HuggingFaceObjectDetectionResponse,
  SummarizationParams as HuggingFaceSummarizationParams,
  SummarizationResponse as HuggingFaceSummarizationResponse,
  TextGenerationParams as HuggingFaceTextGenerationParams,
  TextGenerationResponse as HuggingFaceTextGenerationResponse,
  TranslationParams as HuggingFaceTranslationParams,
  TranslationResponse as HuggingFaceTranslationResponse,
} from "./huggingface/types.js";

// ============================================================================
// Make.com (Automation)
// ============================================================================

export { MakeClient, type MakeClientConfig } from "./make/client.js";
export { createMakeTools, type MakeTools } from "./make/tools.js";
export type {
  MakeConfig,
  Connection as MakeConnection,
  Organization as MakeOrganization,
  Scenario as MakeScenario,
  ScenarioRun as MakeScenarioRun,
  Team as MakeTeam,
} from "./make/types.js";

// ============================================================================
// Figma (Design)
// ============================================================================

export { FigmaClient, type FigmaClientConfig } from "./figma/client.js";
export { createFigmaTools, type FigmaTools } from "./figma/tools.js";
export type {
  Comment as FigmaComment,
  CommentsResponse as FigmaCommentsResponse,
  Component as FigmaComponent,
  FigmaConfig,
  DocumentNode as FigmaDocumentNode,
  FigmaFile,
  ImageExportParams as FigmaImageExportParams,
  ImageExportResponse as FigmaImageExportResponse,
  PostCommentParams as FigmaPostCommentParams,
  Project as FigmaProject,
  ProjectFile as FigmaProjectFile,
  ProjectFilesResponse as FigmaProjectFilesResponse,
  Style as FigmaStyle,
} from "./figma/types.js";

// ============================================================================
// Zapier NLA (Natural Language Actions)
// ============================================================================

export { ZapierClient, type ZapierClientConfig } from "./zapier/client.js";
export { createZapierTools, type ZapierTools } from "./zapier/tools.js";
export type {
  Action as ZapierAction,
  ActionsResponse as ZapierActionsResponse,
  ZapierConfig,
  ExecuteActionParams as ZapierExecuteActionParams,
  ExecuteActionResponse as ZapierExecuteActionResponse,
  ExecutionLogEntry as ZapierExecutionLogEntry,
} from "./zapier/types.js";

// ============================================================================
// Resend (Email)
// ============================================================================

export { ResendClient, type ResendClientConfig } from "./resend/client.js";
export { createResendTools, type ResendTools } from "./resend/tools.js";
export type {
  // API Key types
  ApiKey as ResendApiKey,
  Attachment as ResendAttachment,
  // Audience types
  Audience as ResendAudience,
  BatchSendParams as ResendBatchSendParams,
  BatchSendResponse as ResendBatchSendResponse,
  // Broadcast types
  Broadcast as ResendBroadcast,
  BroadcastStatus as ResendBroadcastStatus,
  ResendConfig,
  // Contact types
  Contact as ResendContact,
  CreateApiKeyParams as ResendCreateApiKeyParams,
  CreateApiKeyResponse as ResendCreateApiKeyResponse,
  CreateAudienceParams as ResendCreateAudienceParams,
  CreateBroadcastParams as ResendCreateBroadcastParams,
  CreateContactParams as ResendCreateContactParams,
  CreateDomainParams as ResendCreateDomainParams,
  DnsRecord as ResendDnsRecord,
  // Domain types
  Domain as ResendDomain,
  DomainStatus as ResendDomainStatus,
  Email as ResendEmail,
  EmailEventType as ResendEmailEventType,
  // Error types
  ResendError,
  ListApiKeysResponse as ResendListApiKeysResponse,
  ListAudiencesResponse as ResendListAudiencesResponse,
  ListBroadcastsResponse as ResendListBroadcastsResponse,
  ListContactsParams as ResendListContactsParams,
  ListContactsResponse as ResendListContactsResponse,
  ListDomainsResponse as ResendListDomainsResponse,
  ListEmailsParams as ResendListEmailsParams,
  ListEmailsResponse as ResendListEmailsResponse,
  SendBroadcastParams as ResendSendBroadcastParams,
  // Email types
  SendEmailParams as ResendSendEmailParams,
  SendEmailResponse as ResendSendEmailResponse,
  Tag as ResendTag,
  UpdateContactParams as ResendUpdateContactParams,
  UpdateDomainParams as ResendUpdateDomainParams,
  UpdateEmailParams as ResendUpdateEmailParams,
  VerifyDomainResponse as ResendVerifyDomainResponse,
} from "./resend/types.js";

// ============================================================================
// Cal.com (Scheduling)
// ============================================================================

export { CalComClient, type CalComClientConfig } from "./calcom/client.js";
export { createCalComTools, type CalComTools } from "./calcom/tools.js";
export type {
  // Booking types
  Attendee as CalComAttendee,
  Booking as CalComBooking,
  BookingReference as CalComBookingReference,
  BookingStatus as CalComBookingStatus,
  CancelBookingParams as CalComCancelBookingParams,
  CalComConfig,
  CreateBookingParams as CalComCreateBookingParams,
  CreateEventTypeParams as CalComCreateEventTypeParams,
  CreateScheduleParams as CalComCreateScheduleParams,
  DateOverride as CalComDateOverride,
  // Error types
  CalComError,
  EventType as CalComEventType,
  EventTypeLocation as CalComEventTypeLocation,
  GetSlotsParams as CalComGetSlotsParams,
  ListBookingsParams as CalComListBookingsParams,
  ListEventTypesParams as CalComListEventTypesParams,
  CalComListResponse,
  CalComPagination,
  RescheduleBookingParams as CalComRescheduleBookingParams,
  Schedule as CalComSchedule,
  // Schedule types
  ScheduleAvailability as CalComScheduleAvailability,
  // Event Type types
  SchedulingType as CalComSchedulingType,
  CalComSingleResponse,
  // Slots types
  Slot as CalComSlot,
  SlotsResponse as CalComSlotsResponse,
  UpdateEventTypeParams as CalComUpdateEventTypeParams,
  UpdateScheduleParams as CalComUpdateScheduleParams,
  UpdateUserParams as CalComUpdateUserParams,
  // User types
  User as CalComUser,
} from "./calcom/types.js";

// ============================================================================
// Apify (Social Media Scraping)
// ============================================================================

export { ApifyClient, type ApifyClientConfig } from "./apify/client.js";
export { createApifyTools, type ApifyTools } from "./apify/tools.js";
export type {
  ActorRunResponse as ApifyActorRunResponse,
  DatasetItemsResponse as ApifyDatasetItemsResponse,
  PLATFORM_ACTORS as ApifyPlatformActors,
  SupportedPlatform as ApifySupportedPlatform,
} from "./apify/types.js";

// ============================================================================
// Crawler (Self-Hosted Web Scraping - Replaces Firecrawl)
// ============================================================================

export {
  CrawlerClient,
  type CrawlerConfig,
  type ScrapeResult,
} from "./crawlee/client.js";
export { createCrawlerTools, type CrawlerTools } from "./crawlee/tools.js";
