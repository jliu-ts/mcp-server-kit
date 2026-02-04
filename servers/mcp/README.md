# MCP Server

Cloudflare Worker that exposes AI SDK tools via the Model Context Protocol (MCP).

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up Cloudflare (create KV namespace)
cd servers/mcp
npx wrangler kv namespace create API_KEYS

# Update wrangler.toml with the namespace ID

# Set secrets
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put LINEAR_API_KEY
# ... add other secrets as needed

# Deploy
pnpm deploy
```

## Local Development

```bash
cd servers/mcp
cp .dev.vars.example .dev.vars  # Add your secrets
pnpm dev                         # Start dev server
curl http://localhost:8787/health
```

## API Endpoints

```bash
# Health check
curl https://your-mcp-server.workers.dev

# List MCP tools
curl https://your-mcp-server.workers.dev/mcp/tools

# MCP Message endpoint (for AI clients)
POST https://your-mcp-server.workers.dev/mcp/message
```

## Deployment

```bash
pnpm deploy                      # Deploy to Cloudflare
wrangler secret put API_KEY      # Set secrets
wrangler tail                    # View logs
```

## Claude Desktop / Cursor Integration

```json
{
  "mcpServers": {
    "my-mcp": {
      "type": "http",
      "url": "https://your-mcp-server.workers.dev/mcp",
      "headers": {
        "X-API-Key": "YOUR_API_KEY"
      }
    }
  }
}
```

## Configuration

See `wrangler.toml` for:

- KV namespace bindings
- Environment variables
- Cron triggers
- Worker settings

See `.env.example` in the root for all available API keys.
