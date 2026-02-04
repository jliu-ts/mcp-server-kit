# MCP Server

**Production URL:** https://mcp.trendingsociety.com

Unified API server for AI agents to access Trending Society infrastructure via the Model Context Protocol.

## Quick Start

```bash
# Health check
curl https://mcp.trendingsociety.com/health

# List tools (331 tools across 23 platforms)
curl https://mcp.trendingsociety.com/tools/list

# Execute a tool
curl -X POST https://mcp.trendingsociety.com/tools/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"tool": "linear_list_issues", "params": {"team": "Engineering", "limit": 5}}'
```

## Local Development

```bash
cd services/mcp
cp .dev.vars.example .dev.vars  # Add your secrets
pnpm dev                         # Start dev server
curl http://localhost:8787/health
```

## Deployment

```bash
pnpm deploy                      # Deploy to Cloudflare
wrangler secret put API_KEY      # Set secrets
wrangler tail                    # View logs
```

## Documentation

| Audience | Location |
|----------|----------|
| **AI Agents** | [agents/skills/mcp-registry/SKILL.md](../../agents/skills/mcp-registry/SKILL.md) |
| **Architecture** | [agents/skills/mcp-registry/references/ARCHITECTURE.md](../../agents/skills/mcp-registry/references/ARCHITECTURE.md) |
| **Adding Tools** | [agents/skills/mcp-registry/references/ADDING-TOOLS.md](../../agents/skills/mcp-registry/references/ADDING-TOOLS.md) |

## Claude Desktop / Cursor Integration

```json
{
  "mcpServers": {
    "trendingsociety": {
      "type": "http",
      "url": "https://mcp.trendingsociety.com/mcp",
      "headers": {
        "X-API-Key": "YOUR_API_KEY"
      }
    }
  }
}
```
