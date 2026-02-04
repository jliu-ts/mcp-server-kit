# @mcp/integrations

AI SDK 6 native tool definitions for third-party integrations. Single source of truth used by both MCP server and AI SDK agents.

## Installation

```bash
pnpm add @mcp/integrations
```

## Quick Start

```typescript
import { LinearClient, createLinearTools } from "@mcp/integrations/linear";
import { ShopifyClient, createShopifyTools } from "@mcp/integrations/shopify";

// Create clients
const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });
const shopify = new ShopifyClient({
  storeDomain: "mystore.myshopify.com",
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
});

// Get AI SDK 6 tools
const linearTools = createLinearTools(linear);
const shopifyTools = createShopifyTools(shopify);

// Use with AI SDK
import { generateText } from "ai";

const result = await generateText({
  model: anthropic("claude-sonnet-4-20250514"),
  tools: { ...linearTools, ...shopifyTools },
  prompt: "List my in-progress Linear issues",
});
```

## Available Integrations

| Integration            | Tools    | Description                                               |
| ---------------------- | -------- | --------------------------------------------------------- |
| **Linear**             | 60       | Project management - issues, projects, cycles, documents  |
| **Shopify Admin**      | 19       | Store management - products, orders, inventory, analytics |
| **Shopify Storefront** | 14       | Headless commerce - products, cart, checkout              |
| **Slack**              | 1        | Messaging - send notifications                            |
| **Tavily**             | 1        | Web search                                                |
| **OpenAI**             | Multiple | AI generation                                             |
| **Anthropic**          | Multiple | Claude AI                                                 |
| **Notion**             | Multiple | Documentation & databases                                 |
| **Airtable**           | Multiple | Database operations                                       |
| **Cal.com**            | Multiple | Scheduling                                                |
| **Resend**             | Multiple | Email sending                                             |
| **Stripe**             | Multiple | Payments                                                  |
| **Supabase**           | Multiple | Database & auth                                           |
| **GitHub**             | Multiple | Repository operations                                     |
| **And more...**        |          | See source for full list                                  |

## AI SDK 6 Features

All tools use AI SDK 6 patterns:

```typescript
// Tool definition pattern
linear_create_issue: tool({
  description: 'Create a new issue in Linear',
  inputSchema: CreateIssueInputSchema,  // Zod schema
  needsApproval: true,  // Human-in-the-loop for write ops
  execute: async (params) => {
    const result = await client.createIssue(params)
    if (!result.success) throw new Error(result.error.message)
    return result.data
  },
}),
```

### `needsApproval: true`

Write operations require approval:

- `create_*` - Creating resources
- `update_*` - Modifying resources
- `delete_*` - Deleting resources
- `archive_*` - Archiving resources
- `fulfill_*` - Order fulfillment
- `adjust_*` - Inventory adjustments

Read operations (`list_*`, `get_*`, `search_*`) do not require approval.

## Exports

```typescript
// Linear
import { LinearClient, createLinearTools } from "@mcp/integrations/linear";

// Shopify Admin
import { ShopifyClient, createShopifyTools } from "@mcp/integrations/shopify";

// Shopify Storefront
import {
  StorefrontClient,
  createStorefrontTools,
} from "@mcp/integrations/shopify";

// Slack
import { SlackClient, createSlackTools } from "@mcp/integrations/slack";

// Tavily (Web Search)
import { TavilyClient, createTavilyTools } from "@mcp/integrations/tavily";

// OpenAI
import { OpenAIClient, createOpenAITools } from "@mcp/integrations/openai";

// Notion
import { NotionClient, createNotionTools } from "@mcp/integrations/notion";
```

## Environment Variables

```bash
# Linear
LINEAR_API_KEY=lin_api_...

# Shopify Admin
SHOPIFY_STORE_DOMAIN=mystore.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_...

# Shopify Storefront
SHOPIFY_STOREFRONT_ACCESS_TOKEN=...

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# Tavily
TAVILY_API_KEY=tvly-...

# OpenAI
OPENAI_API_KEY=sk-...

# See .env.example for full list
```

## MCP Server

These tools are exposed via the MCP server when deployed:

```bash
# List all available tools
curl https://your-mcp-server.workers.dev/tools/list

# Execute a tool
curl -X POST https://your-mcp-server.workers.dev/tools/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"tool": "linear_list_issues", "params": {"team": "Product"}}'
```

## License

MIT
