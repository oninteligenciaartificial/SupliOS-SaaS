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

// Cleanup expired buckets every 60 seconds to prevent memory leaks
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

/**
 * Rate limit response headers
 */
function rateLimitHeaders(result: RateLimitResult, max: number): Record<string, string> {
  return {
    "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
    "X-RateLimit-Limit": String(max),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
  };
}

/**
 * Create a rate-limited 429 response
 */
export function rateLimitResponse(result: RateLimitResult, max: number): NextResponse {
  return NextResponse.json(
    { error: "Demasiadas solicitudes. Intenta nuevamente en unos minutos." },
    { status: 429, headers: rateLimitHeaders(result, max) }
  );
}

/**
 * Helper to apply rate limiting to a route handler.
 * Returns null if allowed, or a 429 response if rate limited.
 *
 * Usage:
 * ```typescript
 * export async function POST(request: Request) {
 *   const rateLimited = checkRateLimit(request, "route-key", { windowMs: 60000, max: 10 });
 *   if (rateLimited) return rateLimited;
 *   // ... handler logic
 * }
 * ```
 */
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

/**
 * Apply rate limiting using organization ID as key (for authenticated endpoints).
 * Returns null if allowed, or a 429 response if rate limited.
 *
 * Usage:
 * ```typescript
 * export async function POST(request: Request) {
 *   const profile = await getTenantProfile();
 *   if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
 *
 *   const rateLimited = checkOrgRateLimit(profile.organizationId, "route-key", { windowMs: 60000, max: 10 });
 *   if (rateLimited) return rateLimited;
 *   // ... handler logic
 * }
 * ```
 */
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

