# MCP Server Kit

A production-ready template for building MCP (Model Context Protocol) servers on Cloudflare Workers. Includes 26+ platform integrations out of the box.

## Features

- 🚀 **Cloudflare Workers** - Edge deployment with global distribution
- 🔌 **26+ Integrations** - Ready-to-use connectors for popular platforms
- 🔐 **API Key Management** - Built-in authentication via KV storage
- ⏰ **Cron Triggers** - Schedule automated tasks
- 📦 **Monorepo Structure** - Clean separation of concerns

## Included Integrations

| Category          | Platforms                        |
| ----------------- | -------------------------------- |
| **AI/ML**         | OpenAI, Anthropic, Replicate     |
| **Productivity**  | Linear, Notion, Airtable, Google |
| **Communication** | Slack, Gmail                     |
| **Development**   | GitHub, Supabase, Vercel         |
| **Marketing**     | Mailchimp, HubSpot, Meta Ads     |
| **Analytics**     | Mixpanel, Posthog                |
| **Scheduling**    | Cal.com                          |
| **Automation**    | Zapier, Make                     |
| **Design**        | Figma                            |
| **Web Scraping**  | Crawlee, Apify                   |

## Quick Start

### 1. Clone this template

```bash
gh repo create my-mcp-server --template jliu-trendingsociety/mcp-server-kit --private
cd my-mcp-server
```

Or manually:

```bash
git clone https://github.com/jliu-trendingsociety/mcp-server-kit.git my-mcp-server
cd my-mcp-server
rm -rf .git && git init
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure Cloudflare

Create your KV namespace:

```bash
cd servers/mcp
npx wrangler kv namespace create API_KEYS
```

Update `servers/mcp/wrangler.toml` with the returned namespace ID.

### 4. Set secrets

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put LINEAR_API_KEY
# ... add secrets for integrations you want to use
```

### 5. Deploy

```bash
pnpm --filter @mcp/server deploy
```

## Project Structure

```
├── packages/
│   └── integrations/       # Platform integration clients + tools
│       ├── openai/
│       ├── linear/
│       ├── slack/
│       └── ...
├── servers/
│   └── mcp/               # Cloudflare Worker
│       ├── src/index.ts   # Main entry point
│       └── wrangler.toml  # Worker configuration
├── config/
│   └── .mcp.json.example  # MCP client configuration template
└── .env.example           # Environment variables template
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your API keys. See the file for all available options.

### MCP Client Configuration

Copy `config/.mcp.json.example` to your MCP client's configuration directory. Update the URL and API key.

## Development

```bash
# Build integrations package
pnpm --filter @mcp/integrations build

# Generate types for worker
pnpm --filter @mcp/server types

# Run worker locally
pnpm --filter @mcp/server dev

# Deploy to Cloudflare
pnpm --filter @mcp/server deploy
```

## Adding New Integrations

1. Create a new directory in `packages/integrations/src/<platform>/`
2. Implement the client and tools following existing patterns
3. Export from `packages/integrations/src/index.ts`
4. Register in `servers/mcp/src/index.ts`

## License

MIT
