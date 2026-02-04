/**
 * Notion Webhook Handler
 *
 * Receives webhook events from Notion for:
 * - Page events (created, updated, deleted, etc.)
 * - Database events
 * - Comment events
 * - File upload events
 *
 * Endpoint: POST /webhooks/notion
 */

import { corsHeaders, error, success } from "../responses";

export interface NotionWebhookEvent {
  type: string;
  event?: string;
  entity?: {
    id: string;
    type: string;
    [key: string]: unknown;
  };
  timestamp?: string;
  workspace?: {
    id: string;
    name: string;
  };
  [key: string]: unknown;
}

/**
 * Verify webhook signature from Notion
 */
async function verifySignature(
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(body)
  );

  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signature === expectedSignature;
}

/**
 * Handle Notion webhook request
 */
export async function handleNotionWebhook(
  request: Request,
  env: { NOTION_WEBHOOK_SECRET?: string }
): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  if (request.method === "GET") {
    return success({
      status: "ok",
      endpoint: "Notion Webhook",
      supportedEvents: [
        "page.created",
        "page.content_updated",
        "page.properties_updated",
        "page.deleted",
        "page.moved_to_trash",
        "page.restored",
        "database.created",
        "database.updated",
        "comment.created",
        "comment.updated",
        "comment.deleted",
        "file.uploaded",
      ],
    });
  }

  if (request.method !== "POST") {
    return error("Method not allowed", 405);
  }

  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody) as NotionWebhookEvent;

    // Handle Notion's URL verification challenge
    if (body.type === "url_verification") {
      console.log("[Notion Webhook] URL verification challenge received");
      return success({ challenge: (body as { challenge?: string }).challenge });
    }

    // Verify webhook signature (optional but recommended)
    const signature = request.headers.get("x-notion-signature");
    if (env.NOTION_WEBHOOK_SECRET) {
      const isValid = await verifySignature(
        rawBody,
        signature,
        env.NOTION_WEBHOOK_SECRET
      );
      if (!isValid) {
        console.warn("[Notion Webhook] Invalid signature");
        return error("Invalid signature", 401);
      }
    }

    // Log the event
    console.log("[Notion Webhook] Event received:", {
      type: body.type,
      entity: body.entity?.id,
      timestamp: body.timestamp,
    });

    // Route to appropriate handler based on event type
    await routeWebhookEvent(body);

    return success({ received: true, type: body.type });
  } catch (err) {
    console.error("[Notion Webhook] Error processing webhook:", err);
    return error("Internal server error", 500);
  }
}

/**
 * Route webhook event to appropriate handler
 */
async function routeWebhookEvent(event: NotionWebhookEvent): Promise<void> {
  switch (event.type) {
    case "page.created":
      await handlePageCreated(event);
      break;
    case "page.content_updated":
    case "page.properties_updated":
      await handlePageUpdated(event);
      break;
    case "page.deleted":
    case "page.moved_to_trash":
      await handlePageDeleted(event);
      break;
    case "page.restored":
      await handlePageRestored(event);
      break;
    case "database.created":
    case "database.updated":
      await handleDatabaseEvent(event);
      break;
    case "comment.created":
    case "comment.updated":
    case "comment.deleted":
      await handleCommentEvent(event);
      break;
    case "file.uploaded":
      await handleFileUpload(event);
      break;
    default:
      console.log("[Notion Webhook] Unhandled event type:", event.type);
  }
}

// Event handlers - customize these for automation needs

async function handlePageCreated(event: NotionWebhookEvent): Promise<void> {
  console.log("[Notion] Page created:", event.entity?.id);
  // TODO: Sync to Supabase, trigger content pipeline, send notification
}

async function handlePageUpdated(event: NotionWebhookEvent): Promise<void> {
  console.log("[Notion] Page updated:", event.entity?.id);
  // TODO: Re-sync content, update search index
}

async function handlePageDeleted(event: NotionWebhookEvent): Promise<void> {
  console.log("[Notion] Page deleted/trashed:", event.entity?.id);
  // TODO: Remove from sync, archive content
}

async function handlePageRestored(event: NotionWebhookEvent): Promise<void> {
  console.log("[Notion] Page restored:", event.entity?.id);
  // TODO: Re-sync restored content
}

async function handleDatabaseEvent(event: NotionWebhookEvent): Promise<void> {
  console.log("[Notion] Database event:", event.type, event.entity?.id);
  // TODO: Sync database schema changes
}

async function handleCommentEvent(event: NotionWebhookEvent): Promise<void> {
  console.log("[Notion] Comment event:", event.type, event.entity?.id);
  // TODO: Send notification, track feedback
}

async function handleFileUpload(event: NotionWebhookEvent): Promise<void> {
  console.log("[Notion] File uploaded:", event.entity?.id);
  // TODO: Process uploaded files, sync to storage
}
