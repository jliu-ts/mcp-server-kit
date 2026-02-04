// API Key Authentication

import { AUTH_HELP_URL, getValidKeysMessage } from '../config/keys';

interface AuthEnv {
  API_KEYS: KVNamespace;
}

export interface ApiKeyData {
  name: string;
  created_at: string;
  permissions: string[];
  rate_limit?: number;
}

// Validate API key from request header
export async function validateApiKey(
  request: Request,
  env: AuthEnv
): Promise<{ valid: boolean; error?: string; keyData?: ApiKeyData }> {
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    return {
      valid: false,
      error: `Missing X-API-Key header. See ${AUTH_HELP_URL}`
    };
  }

  // Look up key in KV store
  const keyData = (await env.API_KEYS.get(apiKey, 'json')) as ApiKeyData | null;

  if (!keyData) {
    return {
      valid: false,
      error: `Invalid API key "${apiKey.slice(0, 8)}...". Valid: ${getValidKeysMessage()}. See ${AUTH_HELP_URL}`
    };
  }

  return { valid: true, keyData };
}

// Generate a new API key
export function generateApiKey(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const prefix = 'mcp_';
  let key = prefix;

  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return key;
}
