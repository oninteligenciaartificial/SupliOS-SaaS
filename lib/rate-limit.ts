import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Lazy init — avoids crash during static build without UPSTASH env vars
const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      // Fallback: no-op Redis for dev without Upstash
      return () => Promise.resolve(null);
    }

    if (!globalThis.__upstashRedis) {
      globalThis.__upstashRedis = new Redis({ url, token });
    }

    return (globalThis.__upstashRedis as unknown as Record<string, unknown>)[prop as string];
  },
});

declare global {
  // eslint-disable-next-line no-var
  var __upstashRedis: Redis | undefined;
}

type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function getRequestIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export async function consumeRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Fallback to in-memory if Upstash not configured
  if (!url || !token) {
    return consumeRateLimitInMemory(key, options);
  }

  const now = Date.now();
  const resetAt = now + options.windowMs;

  try {
    const multi = (redis as Redis).multi();
    multi.incr(key);
    multi.expire(key, Math.ceil(options.windowMs / 1000));
    const results = await multi.exec() as [number, number];
    const count = results[0];

    if (count > options.max) {
      return { allowed: false, remaining: 0, resetAt };
    }

    return {
      allowed: true,
      remaining: Math.max(options.max - count, 0),
      resetAt,
    };
  } catch {
    // If Redis fails, allow the request (fail open)
    return { allowed: true, remaining: options.max, resetAt };
  }
}

// In-memory fallback (same as old implementation)
const buckets = new Map<string, { count: number; resetAt: number }>();
let lastCleanup = Date.now();

function consumeRateLimitInMemory(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  if (now - lastCleanup > 60_000) {
    lastCleanup = now;
    for (const [k, b] of buckets.entries()) {
      if (now >= b.resetAt) buckets.delete(k);
    }
  }

  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: Math.max(options.max - 1, 0), resetAt: now + options.windowMs };
  }
  if (existing.count >= options.max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return { allowed: true, remaining: Math.max(options.max - existing.count, 0), resetAt: existing.resetAt };
}

function rateLimitHeaders(result: RateLimitResult, max: number): Record<string, string> {
  return {
    "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
    "X-RateLimit-Limit": String(max),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
  };
}

export async function rateLimitResponse(result: RateLimitResult, max: number): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Demasiadas solicitudes. Intenta nuevamente en unos minutos." },
    { status: 429, headers: rateLimitHeaders(result, max) }
  );
}

export async function checkRateLimit(
  request: Request,
  keyPrefix: string,
  options: RateLimitOptions
): Promise<NextResponse | null> {
  const ip = getRequestIp(request.headers);
  const result = await consumeRateLimit(`${keyPrefix}:${ip}`, options);
  if (!result.allowed) {
    return rateLimitResponse(result, options.max);
  }
  return null;
}

export async function checkOrgRateLimit(
  orgId: string,
  keyPrefix: string,
  options: RateLimitOptions
): Promise<NextResponse | null> {
  const result = await consumeRateLimit(`${keyPrefix}:${orgId}`, options);
  if (!result.allowed) {
    return rateLimitResponse(result, options.max);
  }
  return null;
}

export const RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, max: 5 },
  setup: { windowMs: 60 * 1000, max: 3 },
  import: { windowMs: 60 * 1000, max: 3 },
  export: { windowMs: 60 * 60 * 1000, max: 10 },
  upload: { windowMs: 60 * 1000, max: 10 },
  write: { windowMs: 60 * 1000, max: 30 },
  read: { windowMs: 60 * 1000, max: 100 },
  superadmin: { windowMs: 60 * 1000, max: 20 },
  cron: { windowMs: 60 * 1000, max: 2 },
} as const;
