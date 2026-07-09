import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Allow fallback to in-memory if Redis env vars are missing (for local dev)
const useRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = useRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

const inMemoryStore = new Map<string, { count: number; expiresAt: number }>();

export async function checkRateLimit(key: string, limit: number, windowMs: number) {
  if (redis) {
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      analytics: false,
    });
    const { success, limit: _limit, remaining, reset } = await ratelimit.limit(key);
    return { ok: success, remaining, resetAt: reset };
  } else {
    // Fallback in-memory
    const now = Date.now();
    const existing = inMemoryStore.get(key);

    if (!existing || existing.expiresAt <= now) {
      inMemoryStore.set(key, { count: 1, expiresAt: now + windowMs });
      return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    if (existing.count >= limit) {
      return { ok: false, remaining: 0, resetAt: existing.expiresAt };
    }

    existing.count += 1;
    inMemoryStore.set(key, existing);
    return { ok: true, remaining: limit - existing.count, resetAt: existing.expiresAt };
  }
}
