# @trendingsociety/integrations

AI SDK 6 native tool definitions for third-party integrations. Single source of truth used by both MCP server and AI SDK agents.

## Installation

```bash
pnpm add @trendingsociety/integrations
```

## Quick Start

```typescript
import { LinearClient, createLinearTools } from '@trendingsociety/integrations/linear'
import { ShopifyClient, createShopifyTools } from '@trendingsociety/integrations/shopify'

// Create clients
const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })
const shopify = new ShopifyClient({
  storeDomain: 'mystore.myshopify.com',
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
})

// Get AI SDK 6 tools
const linearTools = createLinearTools(linear)
const shopifyTools = createShopifyTools(shopify)

// Use with AI SDK
import { generateText } from 'ai'

const result = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: { ...linearTools, ...shopifyTools },
  prompt: 'List my in-progress Linear issues',
})
```

## Available Integrations

| Integration | Tools | Description |
|-------------|-------|-------------|
| **Linear** | 60 | Project management - issues, projects, cycles, documents |
| **Shopify Admin** | 19 | Store management - products, orders, inventory, analytics |
| **Shopify Storefront** | 14 | Headless commerce - products, cart, checkout |
| **Slack** | 1 | Messaging - send notifications |
| **Tavily** | 1 | Web search |

## Linear Tools (60)

### Issues (21)
| Tool | Description | Approval |
|------|-------------|----------|
| `linear_list_issues` | List issues with filters | - |
| `linear_get_issue` | Get issue by ID or identifier | - |
| `linear_create_issue` | Create new issue | Required |
| `linear_update_issue` | Update issue fields | Required |
| `linear_search_issues` | Full-text search | - |
| `linear_create_comment` | Add comment to issue | Required |
| `linear_list_comments` | List comments on issue | - |
| `linear_update_comment` | Edit a comment | Required |
| `linear_delete_comment` | Delete a comment | Required |
| `linear_archive_issue` | Archive issue | Required |
| `linear_unarchive_issue` | Restore archived issue | Required |
| `linear_delete_issue` | Permanently delete | Required |
| `linear_list_attachments` | List issue attachments | - |
| `linear_create_attachment` | Add attachment URL | Required |
| `linear_list_sub_issues` | List child issues | - |
| `linear_create_sub_issue` | Create sub-issue | Required |
| `linear_list_issue_relations` | List issue relations | - |
| `linear_create_issue_relation` | Link issues | Required |
| `linear_subscribe_to_issue` | Subscribe to updates | Required |
| `linear_unsubscribe_from_issue` | Unsubscribe | Required |
| `linear_get_issue_history` | Get activity changelog | - |

### Projects (12)
| Tool | Description | Approval |
|------|-------------|----------|
| `linear_list_projects` | List all projects | - |
| `linear_get_project` | Get project details | - |
| `linear_create_project` | Create project | Required |
| `linear_update_project` | Update project | Required |
| `linear_archive_project` | Archive project | Required |
| `linear_delete_project` | Delete project | Required |
| `linear_list_milestones` | List project milestones | - |
| `linear_create_milestone` | Create milestone | Required |
| `linear_update_milestone` | Update milestone | Required |
| `linear_delete_milestone` | Delete milestone | Required |
| `linear_list_project_updates` | List status updates | - |
| `linear_create_project_update` | Post status update | Required |

### Cycles (6)
| Tool | Description | Approval |
|------|-------------|----------|
| `linear_list_cycles` | List cycles/sprints | - |
| `linear_get_current_cycle` | Get active cycle | - |
| `linear_get_cycle` | Get cycle by ID | - |
| `linear_create_cycle` | Create cycle | Required |
| `linear_update_cycle` | Update cycle | Required |
| `linear_archive_cycle` | Archive cycle | Required |

### Documents (5)
| Tool | Description | Approval |
|------|-------------|----------|
| `linear_list_documents` | List documents | - |
| `linear_get_document` | Get document | - |
| `linear_create_document` | Create document | Required |
| `linear_update_document` | Update document | Required |
| `linear_search_documentation` | Search docs | - |

### Teams, Users, Labels, Statuses (16)
| Tool | Description | Approval |
|------|-------------|----------|
| `linear_list_teams` | List teams | - |
| `linear_get_team` | Get team | - |
| `linear_list_users` | List users | - |
| `linear_get_user` | Get user | - |
| `linear_get_viewer` | Get current user | - |
| `linear_list_issue_labels` | List labels | - |
| `linear_create_issue_label` | Create label | Required |
| `linear_list_project_labels` | List project labels | - |
| `linear_list_issue_statuses` | List workflow states | - |
| `linear_get_issue_status` | Get status | - |
| `linear_list_webhooks` | List webhooks | - |
| `linear_create_webhook` | Create webhook | Required |
| `linear_delete_webhook` | Delete webhook | Required |
| `linear_list_initiatives` | List initiatives | - |
| `linear_create_initiative` | Create initiative | Required |
| `linear_link_project_to_initiative` | Link project | Required |

## Shopify Admin Tools (19)

### Products & Inventory
| Tool | Description | Approval |
|------|-------------|----------|
| `shopify_get_products` | List products | - |
| `shopify_get_product` | Get product details | - |
| `shopify_create_product` | Create product | Required |
| `shopify_update_product` | Update product | Required |
| `shopify_get_collections` | List collections | - |
| `shopify_get_inventory_levels` | Get inventory | - |
| `shopify_adjust_inventory` | Adjust stock | Required |
| `shopify_get_low_stock_alerts` | Low stock items | - |
| `shopify_get_locations` | List locations | - |

### Orders & Customers
| Tool | Description | Approval |
|------|-------------|----------|
| `shopify_get_orders` | List orders | - |
| `shopify_get_order` | Get order details | - |
| `shopify_fulfill_order` | Mark fulfilled | Required |
| `shopify_get_customers` | List customers | - |
| `shopify_get_discount_codes` | List discounts | - |

### Analytics & Dashboard
| Tool | Description | Approval |
|------|-------------|----------|
| `shopify_get_shop` | Store info | - |
| `shopify_get_dashboard_kpis` | Revenue, AOV, orders | - |
| `shopify_get_revenue_trend` | Daily revenue chart | - |
| `shopify_get_top_products` | Best sellers | - |
| `shopify_get_action_queue` | Pending actions | - |

## Shopify Storefront Tools (14)

For headless commerce / customer-facing apps:

| Tool | Description | Approval |
|------|-------------|----------|
| `storefront_get_products` | List products | - |
| `storefront_get_product` | Get by handle/ID | - |
| `storefront_get_recommendations` | Related products | - |
| `storefront_get_collections` | List collections | - |
| `storefront_get_collection` | Collection + products | - |
| `storefront_search` | Search products | - |
| `storefront_predictive_search` | Autocomplete | - |
| `storefront_create_cart` | Create cart | Required |
| `storefront_get_cart` | Get cart | - |
| `storefront_add_to_cart` | Add items | Required |
| `storefront_update_cart` | Update quantities | Required |
| `storefront_remove_from_cart` | Remove items | Required |
| `storefront_apply_discount` | Apply promo code | Required |
| `storefront_get_shop` | Shop branding | - |

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
import { LinearClient, createLinearTools } from '@trendingsociety/integrations/linear'

// Shopify Admin
import { ShopifyClient, createShopifyTools } from '@trendingsociety/integrations/shopify'

// Shopify Storefront
import { StorefrontClient, createStorefrontTools } from '@trendingsociety/integrations/shopify'

// Slack
import { SlackClient, createSlackTools } from '@trendingsociety/integrations/slack'

// Tavily (Web Search)
import { TavilyClient, createTavilyTools } from '@trendingsociety/integrations/tavily'
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
```

## MCP Server

These tools are exposed via the MCP server at `mcp.trendingsociety.com`:

```bash
# List all available tools
curl https://mcp.trendingsociety.com/tools/list

# Execute a tool
curl -X POST https://mcp.trendingsociety.com/tools/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"tool": "linear_list_issues", "params": {"team": "Product"}}'
```

## Agent Skills

See the following documentation for integration patterns:

| Resource | Path | Purpose |
|----------|------|---------|
| Linear Skill | `agents/skills/linear/SKILL.md` | Governance, API patterns |
| Shopify Skill | `agents/skills/shopify/SKILL.md` | E-commerce patterns |
| MCP Registry | `agents/skills/mcp-registry/SKILL.md` | Tool registration, deployment |

## License

Private - Trending Society
