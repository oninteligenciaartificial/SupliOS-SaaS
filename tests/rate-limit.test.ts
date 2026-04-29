import { afterEach, describe, expect, it, vi } from "vitest";
import { consumeRateLimit, getRequestIp } from "@/lib/rate-limit";

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

  it("allows requests until the max threshold", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-29T12:00:00.000Z"));

    const key = `test-limit-${Date.now()}`;
    const options = { windowMs: 60_000, max: 2 };

    const first = consumeRateLimit(key, options);
    const second = consumeRateLimit(key, options);
    const third = consumeRateLimit(key, options);

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);

    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);

    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("resets bucket after the window expires", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-29T12:00:00.000Z"));

    const key = `test-reset-${Date.now()}`;
    const options = { windowMs: 1_000, max: 1 };

    const first = consumeRateLimit(key, options);
    const blocked = consumeRateLimit(key, options);

    vi.advanceTimersByTime(1_100);

    const afterWindow = consumeRateLimit(key, options);

    expect(first.allowed).toBe(true);
    expect(blocked.allowed).toBe(false);
    expect(afterWindow.allowed).toBe(true);
    expect(afterWindow.remaining).toBe(0);
  });
});

