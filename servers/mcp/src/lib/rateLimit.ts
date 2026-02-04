// Rate Limiting using KV

interface RateLimitEnv {
  API_KEYS: KVNamespace;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  apiKey: string,
  env: RateLimitEnv,
  limitPerMinute: number = 100
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = Math.floor(now / 60000) * 60000; // Current minute
  const resetAt = windowStart + 60000;

  const rateLimitKey = `ratelimit:${apiKey}:${windowStart}`;

  // Get current count
  const currentCount = await env.API_KEYS.get(rateLimitKey);
  const count = currentCount ? parseInt(currentCount, 10) : 0;

  if (count >= limitPerMinute) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Increment count (expires after 2 minutes)
  await env.API_KEYS.put(rateLimitKey, String(count + 1), {
    expirationTtl: 120,
  });

  return {
    allowed: true,
    remaining: limitPerMinute - count - 1,
    resetAt,
  };
}
