import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  reportAsyncError,
  setSentryUser,
  clearSentryUser,
  addSentryBreadcrumb,
  captureSentryMessage,
} from "@/lib/monitoring";

// Mock @sentry/nextjs
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

describe("reportAsyncError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("logs error to console", () => {
    const error = new Error("Test error");
    reportAsyncError("test-scope", error, { key: "value" });

    expect(console.error).toHaveBeenCalledWith(
      "[test-scope] operación async falló",
      { error, key: "value" }
    );
  });

  it("calls Sentry captureException", async () => {
    const sentry = await import("@sentry/nextjs");
    const error = new Error("Test error");

    reportAsyncError("test-scope", error, { userId: "123" });

    // Wait for async import
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { scope: "test-scope" },
      extra: { userId: "123" },
    });
  });
});

describe("setSentryUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets user context in Sentry", async () => {
    const sentry = await import("@sentry/nextjs");

    await setSentryUser({
      id: "user-123",
      email: "test@example.com",
      organizationId: "org-456",
      role: "ADMIN",
    });

    expect(sentry.setUser).toHaveBeenCalledWith({
      id: "user-123",
      email: "test@example.com",
      organizationId: "org-456",
      role: "ADMIN",
    });
  });
});

describe("clearSentryUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears user context in Sentry", async () => {
    const sentry = await import("@sentry/nextjs");

    await clearSentryUser();

    expect(sentry.setUser).toHaveBeenCalledWith(null);
  });
});

describe("addSentryBreadcrumb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds breadcrumb to Sentry", async () => {
    const sentry = await import("@sentry/nextjs");

    await addSentryBreadcrumb("api", "Request completed", {
      method: "GET",
      path: "/api/products",
    });

    expect(sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: "api",
      message: "Request completed",
      data: { method: "GET", path: "/api/products" },
      level: "info",
    });
  });
});

describe("captureSentryMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures info message", async () => {
    const sentry = await import("@sentry/nextjs");

    await captureSentryMessage("User signed up", "info", { plan: "BASICO" });

    expect(sentry.captureMessage).toHaveBeenCalledWith("User signed up", {
      level: "info",
      extra: { plan: "BASICO" },
    });
  });

  it("captures warning message", async () => {
    const sentry = await import("@sentry/nextjs");

    await captureSentryMessage("Rate limit approaching", "warning");

    expect(sentry.captureMessage).toHaveBeenCalledWith("Rate limit approaching", {
      level: "warning",
      extra: undefined,
    });
  });
});
