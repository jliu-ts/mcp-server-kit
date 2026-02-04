#!/bin/bash
# MCP Server Kit - Setup Script

set -e

echo "🚀 MCP Server Kit Setup"
echo "========================"

# Check prerequisites
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required. Install with: npm i -g pnpm"; exit 1; }
command -v wrangler >/dev/null 2>&1 || { echo "❌ wrangler is required. Install with: npm i -g wrangler"; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Copy env template
if [ ! -f .env ]; then
  echo "📋 Creating .env from template..."
  cp .env.example .env
  echo "   Edit .env with your API keys"
fi

# Build integrations
echo "🔨 Building integrations package..."
pnpm --filter @mcp/integrations build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API keys"
echo "  2. Configure Cloudflare secrets: cd servers/mcp && wrangler secret put <SECRET_NAME>"
echo "  3. Deploy: pnpm deploy"
echo ""
echo "For local development: pnpm dev"
