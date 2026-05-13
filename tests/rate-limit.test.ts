import { afterEach, describe, expect, it, vi } from "vitest";
import { consumeRateLimit, getRequestIp, checkRateLimit, checkOrgRateLimit } from "@/lib/rate-limit";

describe("getRequestIp", () => {
  it("prefers x-forwarded-for first IP", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 198.51.100.7",
      "x-real-ip": "198.51.100.8",
    });

    expect(getRequestIp(headers)).toBe("203.0.113.10");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({
      "x-real-ip": "198.51.100.8",
    });

    expect(getRequestIp(headers)).toBe("198.51.100.8");
  });

  it("returns unknown when no IP headers exist", () => {
    expect(getRequestIp(new Headers())).toBe("unknown");
  });
});

describe("consumeRateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests until the max threshold", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-29T12:00:00.000Z"));

    const key = `test-limit-${Date.now()}`;
    const options = { windowMs: 60_000, max: 2 };

    const first = await consumeRateLimit(key, options);
    const second = await consumeRateLimit(key, options);
    const third = await consumeRateLimit(key, options);

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);

    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);

    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("resets bucket after the window expires", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-29T12:00:00.000Z"));

    const key = `test-reset-${Date.now()}`;
    const options = { windowMs: 1_000, max: 1 };

    const first = await consumeRateLimit(key, options);
    const blocked = await consumeRateLimit(key, options);

    vi.advanceTimersByTime(1_100);

    const afterWindow = await consumeRateLimit(key, options);

    expect(first.allowed).toBe(true);
    expect(blocked.allowed).toBe(false);
    expect(afterWindow.allowed).toBe(true);
    expect(afterWindow.remaining).toBe(0);
  });
});

describe("checkRateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when request is allowed", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-06T12:00:00.000Z"));

    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "192.168.1.1" },
    });

    const result = await checkRateLimit(request, "test-check", { windowMs: 60_000, max: 10 });
    expect(result).toBeNull();
  });

  it("returns 429 response when rate limited", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-06T12:00:00.000Z"));

    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "192.168.1.2" },
    });

    // Exhaust the limit
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(request, "test-check-limit", { windowMs: 60_000, max: 3 });
    }

    const result = await checkRateLimit(request, "test-check-limit", { windowMs: 60_000, max: 3 });
    expect(result).not.toBeNull();
    expect(result?.status).toBe(429);
  });
});

describe("checkOrgRateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when request is allowed", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-06T12:00:00.000Z"));

    const result = await checkOrgRateLimit("org-123", "test-org", { windowMs: 60_000, max: 10 });
    expect(result).toBeNull();
  });

  it("returns 429 response when rate limited", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-06T12:00:00.000Z"));

    // Exhaust the limit
    for (let i = 0; i < 5; i++) {
      await checkOrgRateLimit("org-456", "test-org-limit", { windowMs: 60_000, max: 5 });
    }

    const result = await checkOrgRateLimit("org-456", "test-org-limit", { windowMs: 60_000, max: 5 });
    expect(result).not.toBeNull();
    expect(result?.status).toBe(429);
  });

  it("isolates different organizations", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-06T12:00:00.000Z"));

    // Exhaust limit for org-A
    for (let i = 0; i < 3; i++) {
      await checkOrgRateLimit("org-A", "test-isolate", { windowMs: 60_000, max: 3 });
    }

    // org-B should still be allowed
    const result = await checkOrgRateLimit("org-B", "test-isolate", { windowMs: 60_000, max: 3 });
    expect(result).toBeNull();
  });
});
