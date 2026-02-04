/**
 * MCP Server - Cloudflare Worker
 *
 * Registry-based MCP server with auto-discovery.
 * All platforms use AI SDK tools pattern for portability.
 *
 * Platforms (355+ tools, 21+ platforms - depends on configured secrets):
 * - Google Workspace (Gmail, Calendar, Drive, Sheets, Docs, Slides, Tasks, Forms, Meet) - 64 tools
 * - Linear (issues, projects, cycles, teams, labels, users) - 60 tools
 * - Stripe (customers, products, prices, subscriptions, invoices, payments) - 34 tools
 * - Resend (emails, domains, API keys, audiences, contacts, broadcasts) - 29 tools
 * - Webflow (sites, pages, collections, CMS items, assets, custom code) - 21 tools
 * - ElevenLabs (TTS, STT, voice cloning, dubbing, sound effects, audio isolation) - 20 tools
 * - Shopify Admin API (products, orders, customers, inventory) - 19 tools
 * - Cal.com (bookings, event types, schedules, slots, availability) - 18 tools
 * - Shopify Storefront API (headless commerce: cart, checkout, search) - 14 tools
 * - OpenAI (chat, embeddings, images, audio, moderation, files, fine-tuning) - 12 tools
 * - Twilio (SMS, MMS, voice calls, recordings) - 11 tools
 * - Airtable (bases, records, batch operations, comments) - 10 tools
 * - N8N (workflows, executions, credentials) - 8 tools
 * - Anthropic (messages, token counting, batches) - 7 tools
 * - Figma (files, images, comments, projects) - 6 tools
 * - Firecrawl (scrape, crawl, map, search) - 5 tools
 * - WebScraper (web content extraction) - 5 tools
 * - Tavily (AI-powered web search and content extraction) - 4 tools
 * - Pollo.AI (video generation: text-to-video, image-to-video) - 4 tools
 * - Supabase (database queries) - 3 tools
 * - Slack (messages) - 1 tool
 *
 * Additional platforms (require API keys):
 * - Hugging Face (models, inference, text generation, translation) - 8 tools
 * - Make.com (scenarios, connections, organizations) - 6 tools
 * - Zapier NLA (actions, execution logs) - 5 tools
 * - Perplexity (chat with web search, models) - 4 tools
 *
 * Architecture:
 * - AI SDK tools pattern (createXTools) for all platforms
 * - MCP native with full protocol support (2025-11-25 spec)
 * - REST API for direct tool execution
 */
import {
  AirtableClient,
  createAirtableTools,
} from "@mcp/integrations/airtable";
import {
  AnthropicClient,
  createAnthropicTools,
} from "@mcp/integrations/anthropic";
import { ApifyClient, createApifyTools } from "@mcp/integrations/apify";
import { CalComClient, createCalComTools } from "@mcp/integrations/calcom";
import {
  ElevenLabsClient,
  createElevenLabsTools,
} from "@mcp/integrations/elevenlabs";
import { FigmaClient, createFigmaTools } from "@mcp/integrations/figma";
import { GoogleClient, createGoogleTools } from "@mcp/integrations/google";
import {
  HuggingFaceClient,
  createHuggingFaceTools,
} from "@mcp/integrations/huggingface";
import { LinearClient, createLinearTools } from "@mcp/integrations/linear";
import { MakeClient, createMakeTools } from "@mcp/integrations/make";
import { N8NClient, createN8NTools } from "@mcp/integrations/n8n";
import { NotionClient, createNotionTools } from "@mcp/integrations/notion";
import { OpenAIClient, createOpenAITools } from "@mcp/integrations/openai";
import {
  PerplexityClient,
  createPerplexityTools,
} from "@mcp/integrations/perplexity";
import { PolloClient, createPolloTools } from "@mcp/integrations/pollo";
import { ResendClient, createResendTools } from "@mcp/integrations/resend";
import {
  ShopifyClient,
  StorefrontClient,
  createShopifyTools,
  createStorefrontTools,
} from "@mcp/integrations/shopify";
import { SlackClient, createSlackTools } from "@mcp/integrations/slack";
import { StripeClient, createStripeTools } from "@mcp/integrations/stripe";
import {
  SupabaseClient,
  createSupabaseTools,
} from "@mcp/integrations/supabase";
import { TavilyClient, createTavilyTools } from "@mcp/integrations/tavily";
import { TenantClient, createTenantTools } from "@mcp/integrations/tenant";
import { TwilioClient, createTwilioTools } from "@mcp/integrations/twilio";
import { WebflowClient, createWebflowTools } from "@mcp/integrations/webflow";
import {
  WebScraperClient,
  createWebScraperTools,
} from "@mcp/integrations/webscraper";
import { ZapierClient, createZapierTools } from "@mcp/integrations/zapier";
import { AUTH_HELP_ENDPOINT, getAuthHelpResponse } from "./config/keys";
import { registry } from "./core/registry";
import { handleScheduled } from "./jobs";
import { validateApiKey } from "./lib/auth";
import {
  createMcpStreamHandler,
  handleMcpDelete,
  handleMcpMessagePost,
} from "./lib/mcp";
import { checkRateLimit } from "./lib/rateLimit";
import { corsHeaders, error, success, toolResult } from "./lib/responses";
import { createBlockedResponse, validateToolCall } from "./lib/validation";
import { handleNotionWebhook } from "./lib/webhooks/notion";

export interface Env {
  // KV Namespaces (uncomment when created)
  // API_KEYS: KVNamespace;
  // RATE_LIMITS: KVNamespace;

  // Environment variables
  ENVIRONMENT: string;
  RATE_LIMIT_PER_MINUTE: string;
  DEBUG?: string; // Set to 'true' to enable debug logging

  // Secrets (set via wrangler secret put)
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
  SHOPIFY_STORE_DOMAIN?: string;
  SHOPIFY_ACCESS_TOKEN?: string;
  SHOPIFY_STOREFRONT_ACCESS_TOKEN?: string;
  LINEAR_API_KEY?: string;
  SLACK_WEBHOOK_URL?: string;
  POLLO_AI_API_KEY?: string;
  TAVILY_API_KEY?: string;

  // Google Workspace (OAuth)
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;

  // ElevenLabs (TTS & Sound Effects)
  ELEVENLABS_API_KEY?: string;

  // Stripe (Payments)
  STRIPE_SECRET_KEY?: string;

  // Webflow (CMS & Site Management)
  WEBFLOW_ACCESS_TOKEN?: string;

  // Twilio (SMS, MMS, Voice)
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_DEFAULT_FROM?: string;

  // OpenAI (Chat, Embeddings, Images, Audio)
  OPENAI_API_KEY?: string;
  OPENAI_ORGANIZATION?: string;

  // Anthropic (Claude)
  ANTHROPIC_API_KEY?: string;

  // Firecrawl (Web Scraping)
  FIRECRAWL_API_KEY?: string;

  // Airtable (Database)
  AIRTABLE_API_KEY?: string;

  // N8N (Workflow Automation)
  N8N_API_KEY?: string;
  N8N_HOST?: string;

  // Perplexity (AI Search)
  PERPLEXITY_API_KEY?: string;

  // Hugging Face (ML Models)
  HUGGINGFACE_API_KEY?: string;

  // Make.com (Automation)
  MAKE_API_KEY?: string;
  MAKE_TEAM_ID?: string;

  // Figma (Design)
  FIGMA_ACCESS_TOKEN?: string;

  // Zapier (NLA)
  ZAPIER_NLA_API_KEY?: string;

  // Resend (Email)
  RESEND_API_KEY?: string;
  RESEND_DEFAULT_FROM?: string;

  // Cal.com (Scheduling)
  CAL_API_KEY?: string;

  // Notion (Pages, Databases, Comments)
  NOTION_TOKEN?: string;
  NOTION_WEBHOOK_SECRET?: string;

  // Apify (Social Media Scraping)
  APIFY_TOKEN?: string;

  API_KEYS: KVNamespace;
}

// Tool request body type
interface ToolRequest {
  tool: string;
  params?: Record<string, unknown>;
  input?: Record<string, unknown>; // MCP protocol compatibility
}

/**
 * Initialize registry with all platforms
 */
function initializeRegistry(env: Env) {
  // Only initialize once
  if (registry.getStats().totalTools > 0) {
    return;
  }

  // Register Google Workspace platform (Gmail, Calendar, Drive)
  // Uses AI SDK tools pattern (createGoogleTools) since GoogleClient has nested sub-clients
  if (
    env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_SECRET &&
    env.GOOGLE_REFRESH_TOKEN
  ) {
    const googleClient = new GoogleClient({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      refreshToken: env.GOOGLE_REFRESH_TOKEN,
    });
    const googleTools = createGoogleTools(googleClient);
    registry.registerAiSdkTools("google", googleTools, {
      gmail_list_messages: { category: "gmail", tags: ["read", "list"] },
      gmail_get_message: { category: "gmail", tags: ["read"] },
      gmail_send_email: { category: "gmail", tags: ["write", "send"] },
      gmail_list_labels: { category: "gmail", tags: ["read", "list"] },
      calendar_list_events: { category: "calendar", tags: ["read", "list"] },
      calendar_get_event: { category: "calendar", tags: ["read"] },
      calendar_create_event: {
        category: "calendar",
        tags: ["write", "create"],
      },
      calendar_delete_event: {
        category: "calendar",
        tags: ["write", "delete"],
      },
      calendar_update_event: {
        category: "calendar",
        tags: ["write", "update"],
      },
      calendar_list_calendars: { category: "calendar", tags: ["read", "list"] },
      drive_list_files: { category: "drive", tags: ["read", "list"] },
      drive_get_file: { category: "drive", tags: ["read"] },
      drive_search_files: { category: "drive", tags: ["read", "search"] },
    });
  }

  // Register Linear platform (AI SDK tools pattern)
  if (env.LINEAR_API_KEY) {
    const linearClient = new LinearClient({ apiKey: env.LINEAR_API_KEY });
    const linearTools = createLinearTools(linearClient);
    registry.registerAiSdkTools("linear", linearTools);
  }

  // Register Shopify Admin API platform (AI SDK tools pattern)
  if (env.SHOPIFY_STORE_DOMAIN && env.SHOPIFY_ACCESS_TOKEN) {
    const shopifyClient = new ShopifyClient({
      storeDomain: env.SHOPIFY_STORE_DOMAIN,
      accessToken: env.SHOPIFY_ACCESS_TOKEN,
    });
    const shopifyTools = createShopifyTools(shopifyClient);
    registry.registerAiSdkTools("shopify", shopifyTools);
  }

  // Register Shopify Storefront API platform (AI SDK tools pattern)
  if (env.SHOPIFY_STORE_DOMAIN && env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
    const storefrontClient = new StorefrontClient({
      storeDomain: env.SHOPIFY_STORE_DOMAIN,
      storefrontAccessToken: env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    });
    const storefrontTools = createStorefrontTools(storefrontClient);
    registry.registerAiSdkTools("shopify_storefront", storefrontTools);
  }

  // Register Slack platform (AI SDK tools pattern)
  if (env.SLACK_WEBHOOK_URL) {
    const slackClient = new SlackClient({ webhookUrl: env.SLACK_WEBHOOK_URL });
    const slackTools = createSlackTools(slackClient);
    registry.registerAiSdkTools("slack", slackTools);
  }

  // Register Tavily platform (AI SDK tools pattern)
  if (env.TAVILY_API_KEY) {
    const tavilyClient = new TavilyClient({ apiKey: env.TAVILY_API_KEY });
    const tavilyTools = createTavilyTools(tavilyClient);
    registry.registerAiSdkTools("tavily", tavilyTools);
  }

  // Register Supabase platform (AI SDK tools pattern)
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    const supabaseClient = new SupabaseClient({
      url: env.SUPABASE_URL,
      serviceKey: env.SUPABASE_SERVICE_KEY,
    });
    const supabaseTools = createSupabaseTools(supabaseClient);
    registry.registerAiSdkTools("supabase", supabaseTools);

    // Register Tenant platform (uses Supabase credentials)
    const tenantClient = new TenantClient({
      supabaseUrl: env.SUPABASE_URL,
      supabaseKey: env.SUPABASE_SERVICE_KEY,
    });
    const tenantTools = createTenantTools(tenantClient);
    registry.registerAiSdkTools("tenant", tenantTools);
  }

  // Register Pollo.AI platform (AI SDK tools pattern)
  if (env.POLLO_AI_API_KEY) {
    const polloClient = new PolloClient({ apiKey: env.POLLO_AI_API_KEY });
    const polloTools = createPolloTools(polloClient);
    registry.registerAiSdkTools("pollo", polloTools);
  }

  // Register WebScraper platform (AI SDK tools pattern)
  // No API key required - uses fetch for web scraping
  const webScraperClient = new WebScraperClient();
  const webScraperTools = createWebScraperTools(webScraperClient);
  registry.registerAiSdkTools("webscraper", webScraperTools);

  // Register ElevenLabs platform (AI SDK tools pattern)
  if (env.ELEVENLABS_API_KEY) {
    const elevenLabsClient = new ElevenLabsClient({
      apiKey: env.ELEVENLABS_API_KEY,
    });
    const elevenLabsTools = createElevenLabsTools(elevenLabsClient);
    registry.registerAiSdkTools("elevenlabs", elevenLabsTools);
  }

  // Register Stripe platform (AI SDK tools pattern)
  if (env.STRIPE_SECRET_KEY) {
    const stripeClient = new StripeClient({ secretKey: env.STRIPE_SECRET_KEY });
    const stripeTools = createStripeTools(stripeClient);
    registry.registerAiSdkTools("stripe", stripeTools);
  }

  // Register Webflow platform (AI SDK tools pattern)
  if (env.WEBFLOW_ACCESS_TOKEN) {
    const webflowClient = new WebflowClient({
      accessToken: env.WEBFLOW_ACCESS_TOKEN,
    });
    const webflowTools = createWebflowTools(webflowClient);
    registry.registerAiSdkTools("webflow", webflowTools);
  }

  // Register Twilio platform (AI SDK tools pattern)
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
    const twilioClient = new TwilioClient({
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      defaultFrom: env.TWILIO_DEFAULT_FROM,
    });
    const twilioTools = createTwilioTools(twilioClient);
    registry.registerAiSdkTools("twilio", twilioTools);
  }

  // Register OpenAI platform (AI SDK tools pattern)
  if (env.OPENAI_API_KEY) {
    const openaiClient = new OpenAIClient({
      apiKey: env.OPENAI_API_KEY,
      organization: env.OPENAI_ORGANIZATION,
    });
    const openaiTools = createOpenAITools(openaiClient);
    registry.registerAiSdkTools("openai", openaiTools);
  }

  // Register Anthropic platform (AI SDK tools pattern)
  if (env.ANTHROPIC_API_KEY) {
    const anthropicClient = new AnthropicClient({
      apiKey: env.ANTHROPIC_API_KEY,
    });
    const anthropicTools = createAnthropicTools(anthropicClient);
    registry.registerAiSdkTools("anthropic", anthropicTools);
  }

  // Firecrawl integration removed - using Crawlee instead
  // If you need Firecrawl, add the integration to packages/integrations

  // Register Airtable platform (AI SDK tools pattern)
  if (env.AIRTABLE_API_KEY) {
    const airtableClient = new AirtableClient({ apiKey: env.AIRTABLE_API_KEY });
    const airtableTools = createAirtableTools(airtableClient);
    registry.registerAiSdkTools("airtable", airtableTools);
  }

  // Register N8N platform (AI SDK tools pattern)
  if (env.N8N_API_KEY && env.N8N_HOST) {
    const n8nClient = new N8NClient({
      apiKey: env.N8N_API_KEY,
      baseUrl: env.N8N_HOST,
    });
    const n8nTools = createN8NTools(n8nClient);
    registry.registerAiSdkTools("n8n", n8nTools);
  }

  // Register Perplexity platform (AI SDK tools pattern)
  if (env.PERPLEXITY_API_KEY) {
    const perplexityClient = new PerplexityClient({
      apiKey: env.PERPLEXITY_API_KEY,
    });
    const perplexityTools = createPerplexityTools(perplexityClient);
    registry.registerAiSdkTools("perplexity", perplexityTools);
  }

  // Register Hugging Face platform (AI SDK tools pattern)
  if (env.HUGGINGFACE_API_KEY) {
    const huggingfaceClient = new HuggingFaceClient({
      apiKey: env.HUGGINGFACE_API_KEY,
    });
    const huggingfaceTools = createHuggingFaceTools(huggingfaceClient);
    registry.registerAiSdkTools("huggingface", huggingfaceTools);
  }

  // Register Make.com platform (AI SDK tools pattern)
  if (env.MAKE_API_KEY) {
    const makeClient = new MakeClient({
      apiKey: env.MAKE_API_KEY,
      teamId: env.MAKE_TEAM_ID ? parseInt(env.MAKE_TEAM_ID) : undefined,
    });
    const makeTools = createMakeTools(makeClient);
    registry.registerAiSdkTools("make", makeTools);
  }

  // Register Figma platform (AI SDK tools pattern)
  if (env.FIGMA_ACCESS_TOKEN) {
    const figmaClient = new FigmaClient({
      accessToken: env.FIGMA_ACCESS_TOKEN,
    });
    const figmaTools = createFigmaTools(figmaClient);
    registry.registerAiSdkTools("figma", figmaTools);
  }

  // Register Zapier NLA platform (AI SDK tools pattern)
  if (env.ZAPIER_NLA_API_KEY) {
    const zapierClient = new ZapierClient({ apiKey: env.ZAPIER_NLA_API_KEY });
    const zapierTools = createZapierTools(zapierClient);
    registry.registerAiSdkTools("zapier", zapierTools);
  }

  // Register Resend platform (AI SDK tools pattern)
  if (env.RESEND_API_KEY) {
    const resendClient = new ResendClient({
      apiKey: env.RESEND_API_KEY,
      defaultFrom: env.RESEND_DEFAULT_FROM,
    });
    const resendTools = createResendTools(resendClient);
    registry.registerAiSdkTools("resend", resendTools);
  }

  // Register Cal.com platform (AI SDK tools pattern)
  if (env.CAL_API_KEY) {
    const calcomClient = new CalComClient({
      apiKey: env.CAL_API_KEY,
    });
    const calcomTools = createCalComTools(calcomClient);
    registry.registerAiSdkTools("calcom", calcomTools);
  }

  // Register Notion platform (AI SDK tools pattern)
  if (env.NOTION_TOKEN) {
    const notionClient = new NotionClient({
      token: env.NOTION_TOKEN,
    });
    const notionTools = createNotionTools(notionClient);
    registry.registerAiSdkTools("notion", notionTools);
  }

  // Register Apify platform (AI SDK tools pattern)
  // Enables: apify_scrape_instagram, apify_scrape_tiktok, apify_scrape_twitter, etc.
  if (env.APIFY_TOKEN) {
    const apifyClient = new ApifyClient({ apiKey: env.APIFY_TOKEN });
    const apifyTools = createApifyTools(apifyClient);
    registry.registerAiSdkTools("apify", apifyTools);
  }
}

/**
 * Internal tool executor - shared by MCP and REST endpoints
 *
 * Routes all tool calls through the registry with AI SDK tools pattern.
 *
 * IMPORTANT: All tool calls pass through validation middleware first.
 * Invalid calls are blocked with structured error messages.
 */
async function executeToolInternal(
  tool: string,
  params: Record<string, unknown>,
  env: Env,
): Promise<unknown> {
  // ==========================================================================
  // VALIDATION MIDDLEWARE - Real-time enforcement
  // ==========================================================================
  // This intercepts tool calls BEFORE execution to validate parameters.
  // If validation fails, the tool is NOT executed and agent receives
  // structured guidance to self-correct.
  const validationResult = validateToolCall(tool, params);

  if (!validationResult.proceed) {
    // Return structured error - agent can use this to fix and retry
    return createBlockedResponse(tool, validationResult);
  }

  // Log any warnings (tool will still proceed)
  if (validationResult.validation?.warnings?.length) {
    console.warn(
      `[MCP Validation] Warnings for ${tool}:`,
      validationResult.validation.warnings,
    );
  }

  // ==========================================================================
  // TOOL EXECUTION
  // ==========================================================================

  // Initialize registry on first use
  initializeRegistry(env);

  // All tools go through registry
  const result = await registry.executeTool(tool, params);

  // Check if tool was found
  if (!result.success && result.error?.code === "TOOL_NOT_FOUND") {
    throw new Error(`Unknown tool: ${tool}`);
  }

  return result;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check endpoint
    if (path === "/" || path === "/health") {
      return success({
        status: "ok",
        service: "mcp-server",
        version: "1.0.0",
        environment: env.ENVIRONMENT,
        timestamp: new Date().toISOString(),
        mcp: {
          stream: "/mcp",
          message: "/mcp/message",
          tools: "/mcp/tools",
          protocol: "2025-11-25",
        },
      });
    }

    // Auth help endpoint - no auth required, self-documenting
    if (path === AUTH_HELP_ENDPOINT || path === "/auth") {
      return success(getAuthHelpResponse());
    }

    // ==========================================================================
    // MCP Protocol Endpoints (for Claude Code native integration)
    // ==========================================================================

    // MCP stream endpoint - establishes Streamable HTTP connection (2025-11-25 spec)
    if (path === "/mcp" && request.method === "GET") {
      const streamHandler = createMcpStreamHandler(
        env,
        async (tool, params) => {
          return executeToolInternal(tool, params, env);
        },
      );
      return streamHandler(request);
    }

    // MCP message endpoint - receives JSON-RPC messages
    // Handle both /mcp (Streamable HTTP spec) and /mcp/message (explicit path)
    if (
      (path === "/mcp" || path === "/mcp/message") &&
      request.method === "POST"
    ) {
      // Initialize registry for tools/list and tools/call
      initializeRegistry(env);
      return handleMcpMessagePost(request, env, async (tool, params) => {
        return executeToolInternal(tool, params, env);
      });
    }

    // MCP session deletion (2025-11-25 spec)
    if (path === "/mcp" && request.method === "DELETE") {
      return handleMcpDelete(request, env);
    }

    // MCP tools list in MCP format
    if (path === "/mcp/tools") {
      initializeRegistry(env);
      return success({
        tools: registry.getAllToolDefinitions(),
      });
    }

    // Registry stats endpoint
    if (path === "/tools/stats") {
      initializeRegistry(env);
      return success(registry.getStats());
    }

    // List available tools (unified with /mcp/tools)
    if (path === "/tools/list") {
      initializeRegistry(env);

      // All tools come from registry - single source of truth
      const tools = registry.getAllToolDefinitions().map((tool) => ({
        name: tool.name,
        description: tool.description,
        category: tool.category || "uncategorized",
        status: "available",
        inputSchema: tool.inputSchema,
      }));

      // Group by category
      const categories = [...new Set(tools.map((t) => t.category))];

      return success({
        summary: {
          total: tools.length,
          available: tools.length,
          categories,
        },
        tools,
      });
    }

    // Execute tool endpoint (main entry point)
    if (path === "/tools/execute" && request.method === "POST") {
      const debug = env.DEBUG === "true";

      let rawBody: string;
      try {
        rawBody = await request.text();
        if (debug) console.log("[DEBUG] Raw body:", rawBody);
      } catch (e) {
        console.error("[ERROR] Failed to read body:", e);
        return error("Failed to read request body", 400);
      }

      let body: ToolRequest;
      try {
        body = JSON.parse(rawBody) as ToolRequest;
        if (debug) console.log("[DEBUG] Parsed:", body.tool);
      } catch (e) {
        console.error("[ERROR] JSON parse error:", e);
        return error("Invalid JSON in request body", 400);
      }

      const { tool, input, params } = body;
      // Support both 'input' (MCP/AI SDK standard) and 'params' for flexibility
      const actualParams = input || params || {};

      // Validate API key
      const auth = await validateApiKey(request, env);
      if (!auth.valid) {
        return error(auth.error || "Unauthorized", 401);
      }

      // Rate limiting
      const rateLimit = await checkRateLimit(
        request.headers.get("X-API-Key")!,
        env,
        parseInt(env.RATE_LIMIT_PER_MINUTE || "100"),
      );
      if (!rateLimit.allowed) {
        return error("Rate limit exceeded. Try again in 1 minute.", 429);
      }

      if (!tool) {
        return error("Missing required field: tool", 400);
      }

      // Execute tool via registry
      try {
        const result = await executeToolInternal(tool, actualParams, env);
        return toolResult(tool, result);
      } catch (err) {
        return error(`Tool execution failed: ${err}`, 500);
      }
    }

    // ==========================================================================
    // Webhook Endpoints (for external integrations)
    // ==========================================================================

    // Notion webhook - receives events from Notion
    if (path === "/webhooks/notion") {
      return handleNotionWebhook(request, env);
    }

    // 404 for unknown routes
    return error(
      `Not found: ${path}. Available: /, /health, /auth/help, /tools/list, /tools/execute, /mcp, /mcp/message, /mcp/tools, /webhooks/notion`,
      404,
    );
  },

  /**
   * Scheduled handler for cron-triggered automations
   * See wrangler.toml for cron expressions
   */
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    await handleScheduled(event, env, ctx);
  },
};
