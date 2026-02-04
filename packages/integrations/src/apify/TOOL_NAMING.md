---
description: Vendor-namespaced tool naming convention for multi-vendor MCP integrations
---

## Overview

All MCP tools follow a **vendor-namespaced naming convention** for multi-vendor scalability.

## Format

```
<vendor>.<tool_name>
```

**Examples:**

- `apify.call_actor`
- `apify.scrape_instagram`
- `firecrawl.scrape_url` (future)
- `browserbase.navigate` (future)

## Rationale

### Why Namespacing?

1. **Multi-vendor support**: When adding Firecrawl, Browserbase, or other scraping vendors, `scrape_instagram` becomes ambiguous. Namespace makes vendor explicit.

2. **Clear debugging**: Logs show `tool: apify.scrape_instagram` instead of just `scrape_instagram`.

3. **Ecosystem alignment**: Maps closely to official vendor MCP servers while maintaining our custom implementations.

4. **Future-proofing**: Adding new vendors requires no breaking changes to existing tools.

### Why Not Just 1:1 Mapping?

1:1 naming (e.g., `call_actor` matching Apify's `call-actor`) works for single-vendor setups but breaks when:

- Multiple vendors offer similar tools
- Implementations differ from vendor defaults
- Versioning/deprecation cycles diverge

## Current Tools

### Apify (`apify.*`)

| Tool Name                   | Description                         |
| --------------------------- | ----------------------------------- |
| `apify.search_actors`       | Search Apify Store for actors       |
| `apify.fetch_actor_details` | Get actor input schema and pricing  |
| `apify.call_actor`          | Run any Apify actor                 |
| `apify.get_actor_run`       | Get run status and stats            |
| `apify.get_actor_log`       | Get execution logs                  |
| `apify.get_dataset_items`   | Fetch dataset items with pagination |
| `apify.scrape_instagram`    | Scrape Instagram posts              |
| `apify.scrape_tiktok`       | Scrape TikTok videos                |
| `apify.scrape_twitter`      | Scrape Twitter/X posts              |
| `apify.scrape_youtube`      | Scrape YouTube videos               |
| `apify.scrape_linkedin`     | Scrape LinkedIn posts               |
| `apify.scrape_threads`      | Scrape Threads posts                |

## Adding New Vendors

When adding a new vendor (e.g., Firecrawl):

1. Create `packages/integrations/src/firecrawl/`
2. Export tools with `firecrawl.` prefix
3. Register in MCP server under `firecrawl` namespace
4. Add to this table

---

_Reference: [Apify MCP Docs](https://docs.apify.com/platform/integrations/mcp)_
