import { NextResponse } from "next/server";

type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanupExpiredBuckets() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, bucket] of buckets.entries()) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

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

export function consumeRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  cleanupExpiredBuckets();

  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + options.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(options.max - 1, 0),
      resetAt,
    };
  }

  if (existing.count >= options.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(options.max - existing.count, 0),
    resetAt: existing.resetAt,
  };
}

function rateLimitHeaders(result: RateLimitResult, max: number): Record<string, string> {
  return {
    "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
    "X-RateLimit-Limit": String(max),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
  };
}

export function rateLimitResponse(result: RateLimitResult, max: number): NextResponse {
  return NextResponse.json(
    { error: "Demasiadas solicitudes. Intenta nuevamente en unos minutos." },
    { status: 429, headers: rateLimitHeaders(result, max) }
  );
}

export function checkRateLimit(
  request: Request,
  keyPrefix: string,
  options: RateLimitOptions
): NextResponse | null {
  const ip = getRequestIp(request.headers);
  const result = consumeRateLimit(`${keyPrefix}:${ip}`, options);

  if (!result.allowed) {
    return rateLimitResponse(result, options.max);
  }

  return null;
}

export function checkOrgRateLimit(
  orgId: string,
  keyPrefix: string,
  options: RateLimitOptions
): NextResponse | null {
  const result = consumeRateLimit(`${keyPrefix}:${orgId}`, options);

  if (!result.allowed) {
    return rateLimitResponse(result, options.max);
  }

  return null;
}

/**
 * Predefined rate limit configurations per endpoint type.
 * Use these constants for consistent rate limiting across the app.
 */
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
