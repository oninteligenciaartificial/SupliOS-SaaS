import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock prisma before importing email module
const mockCreate = vi.fn().mockResolvedValue({ id: "log-1" });
const mockUpdateMany = vi.fn().mockResolvedValue({ count: 1 });

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailLog: {
      create: mockCreate,
      updateMany: mockUpdateMany,
    },
  },
}));

vi.mock("@/lib/monitoring", () => ({
  reportAsyncError: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 280, resetAt: Date.now() + 86400000 }),
}));

describe("sendEmail core", () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreate.mockClear();
    // Set BREVO_API_KEY for tests that need it
    process.env.BREVO_API_KEY = "test-api-key";
    process.env.BREVO_SENDER_EMAIL = "test@gmail.com";
  });

  afterEach(() => {
    delete process.env.BREVO_API_KEY;
    delete process.env.BREVO_SENDER_EMAIL;
    vi.restoreAllMocks();
  });

  it("should skip sending when BREVO_API_KEY is not set", async () => {
    delete process.env.BREVO_API_KEY;

    const { sendOrderConfirmation } = await import("@/lib/email");
    await sendOrderConfirmation({
      to: "test@example.com",
      customerName: "Test",
      orgName: "Test Org",
      orderId: "cm1234567890",
      items: [{ name: "Product", quantity: 1, unitPrice: 100 }],
      total: 100,
      paymentMethod: "EFECTIVO",
    });

    // Should log as FAILED due to missing API key
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          error: expect.stringContaining("BREVO_API_KEY not configured"),
        }),
      })
    );
  });

  it("should use BREVO_SENDER_EMAIL when configured", async () => {
    process.env.BREVO_SENDER_EMAIL = "verified@gmail.com";

    const { sendOrderConfirmation } = await import("@/lib/email");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messageId: "msg-123" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await sendOrderConfirmation({
      to: "customer@example.com",
      customerName: "Customer",
      orgName: "Org",
      orderId: "cm1234567890",
      items: [{ name: "Item", quantity: 2, unitPrice: 50 }],
      total: 100,
      paymentMethod: "TARJETA",
    });

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.sender.email).toBe("verified@gmail.com");

    vi.unstubAllGlobals();
  });

  it("should fallback to Gmail when BREVO_SENDER_EMAIL is not set", async () => {
    delete process.env.BREVO_SENDER_EMAIL;

    const { sendOrderConfirmation } = await import("@/lib/email");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messageId: "msg-123" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await sendOrderConfirmation({
      to: "customer@example.com",
      customerName: "Customer",
      orgName: "Org",
      orderId: "cm1234567890",
      items: [{ name: "Item", quantity: 1, unitPrice: 100 }],
      total: 100,
      paymentMethod: "EFECTIVO",
    });

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.sender.email).toBe("oninteligenciaartificial@gmail.com");

    vi.unstubAllGlobals();
  });
});

describe("email types", () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreate.mockClear();
    mockCreate.mockResolvedValue({ id: "log-1" });
    process.env.BREVO_API_KEY = "test-api-key";
    process.env.BREVO_SENDER_EMAIL = "test@gmail.com";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messageId: "msg-123" }),
    });
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    delete process.env.BREVO_API_KEY;
    delete process.env.BREVO_SENDER_EMAIL;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sendWelcomeEmail should log with type 'welcome_email'", async () => {
    const { sendWelcomeEmail } = await import("@/lib/email");
    await sendWelcomeEmail({
      to: "new@example.com",
      customerName: "New Customer",
      orgName: "Test Org",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "welcome_email",
          to: "new@example.com",
          status: "SENT",
          brevoMessageId: "msg-123",
        }),
      })
    );
  });

  it("sendBirthdayEmail should log with type 'birthday_email'", async () => {
    const { sendBirthdayEmail } = await import("@/lib/email");
    await sendBirthdayEmail({
      to: "birthday@example.com",
      customerName: "Birthday Person",
      orgName: "Test Org",
      discountCode: "CUMPLE20",
      discountValue: 20,
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "birthday_email",
          to: "birthday@example.com",
        }),
      })
    );
  });

  it("sendLowStockAlert should log with type 'low_stock_alert'", async () => {
    const { sendLowStockAlert } = await import("@/lib/email");
    await sendLowStockAlert({
      to: "admin@example.com",
      orgName: "Test Org",
      products: [{ name: "Product A", stock: 2, minStock: 10 }],
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "low_stock_alert",
          to: "admin@example.com",
        }),
      })
    );
  });

  it("sendPlanExpiryWarning should log with type 'plan_expiry_warning'", async () => {
    const { sendPlanExpiryWarning } = await import("@/lib/email");
    await sendPlanExpiryWarning({
      to: "admin@example.com",
      orgName: "Test Org",
      daysLeft: 3,
      planLabel: "Pro",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "plan_expiry_warning",
          to: "admin@example.com",
        }),
      })
    );
  });

  it("sendPlanExpired should log with type 'plan_expired'", async () => {
    const { sendPlanExpired } = await import("@/lib/email");
    await sendPlanExpired({
      to: "admin@example.com",
      orgName: "Test Org",
      planLabel: "Pro",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "plan_expired",
          to: "admin@example.com",
        }),
      })
    );
  });

  it("sendPlanActivatedEmail should log with type 'plan_activated'", async () => {
    const { sendPlanActivatedEmail } = await import("@/lib/email");
    await sendPlanActivatedEmail({
      to: "admin@example.com",
      orgName: "Test Org",
      plan: "PRO",
      expiresAt: new Date("2026-06-01"),
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "plan_activated",
          to: "admin@example.com",
        }),
      })
    );
  });

  it("sendNewOrderAlert should log with type 'new_order_alert'", async () => {
    const { sendNewOrderAlert } = await import("@/lib/email");
    await sendNewOrderAlert({
      to: "admin@example.com",
      orgName: "Test Org",
      orderId: "cm1234567890",
      customerName: "Customer",
      total: 150,
      items: [{ name: "Product", quantity: 3, unitPrice: 50 }],
      paymentMethod: "EFECTIVO",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "new_order_alert",
          to: "admin@example.com",
        }),
      })
    );
  });

  it("sendOrderStatusUpdate should log with type 'order_status_update'", async () => {
    const { sendOrderStatusUpdate } = await import("@/lib/email");
    await sendOrderStatusUpdate({
      to: "customer@example.com",
      customerName: "Customer",
      orgName: "Test Org",
      orderId: "cm1234567890",
      status: "ENTREGADO",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "order_status_update",
          to: "customer@example.com",
        }),
      })
    );
  });

  it("sendLoyaltyPointsEmail should log with type 'loyalty_points_email'", async () => {
    const { sendLoyaltyPointsEmail } = await import("@/lib/email");
    await sendLoyaltyPointsEmail({
      to: "customer@example.com",
      customerName: "Customer",
      orgName: "Test Org",
      pointsEarned: 15,
      totalPoints: 150,
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "loyalty_points_email",
          to: "customer@example.com",
        }),
      })
    );
  });

  it("sendExpiryAlert should log with type 'expiry_alert'", async () => {
    const { sendExpiryAlert } = await import("@/lib/email");
    await sendExpiryAlert({
      to: "admin@example.com",
      orgName: "Test Org",
      products: [{ name: "Product", sku: "SKU-001", batchExpiry: new Date(), daysLeft: 2 }],
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "expiry_alert",
          to: "admin@example.com",
        }),
      })
    );
  });

  it("sendInactiveCustomerEmail should log with type 'inactive_customer_email'", async () => {
    const { sendInactiveCustomerEmail } = await import("@/lib/email");
    await sendInactiveCustomerEmail({
      to: "inactive@example.com",
      customerName: "Inactive",
      orgName: "Test Org",
      daysSinceLastOrder: 45,
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "inactive_customer_email",
          to: "inactive@example.com",
        }),
      })
    );
  });

  it("sendPlainNotification should log with type 'plain_notification'", async () => {
    const { sendPlainNotification } = await import("@/lib/email");
    await sendPlainNotification({
      to: "admin@example.com",
      subject: "Test",
      text: "Test content",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "plain_notification",
          to: "admin@example.com",
        }),
      })
    );
  });

  it("sendOrderConfirmation should log with type 'order_confirmation'", async () => {
    const { sendOrderConfirmation } = await import("@/lib/email");
    await sendOrderConfirmation({
      to: "customer@example.com",
      customerName: "Customer",
      orgName: "Test Org",
      orderId: "cm1234567890",
      items: [{ name: "Product", quantity: 1, unitPrice: 100 }],
      total: 100,
      paymentMethod: "EFECTIVO",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "order_confirmation",
          to: "customer@example.com",
        }),
      })
    );
  });
});

describe("error handling", () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreate.mockClear();
    mockCreate.mockResolvedValue({ id: "log-1" });
    process.env.BREVO_API_KEY = "test-api-key";
    process.env.BREVO_SENDER_EMAIL = "test@gmail.com";
  });

  afterEach(() => {
    delete process.env.BREVO_API_KEY;
    delete process.env.BREVO_SENDER_EMAIL;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should log FAILED status when Brevo API returns error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Invalid API key"),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { sendOrderConfirmation } = await import("@/lib/email");
    await sendOrderConfirmation({
      to: "customer@example.com",
      customerName: "Customer",
      orgName: "Test Org",
      orderId: "cm1234567890",
      items: [{ name: "Product", quantity: 1, unitPrice: 100 }],
      total: 100,
      paymentMethod: "EFECTIVO",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          error: expect.stringContaining("Brevo API error: 401"),
        }),
      })
    );
  });

  it("should log FAILED status when fetch throws", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.stubGlobal("fetch", mockFetch);

    const { sendOrderConfirmation } = await import("@/lib/email");
    await sendOrderConfirmation({
      to: "customer@example.com",
      customerName: "Customer",
      orgName: "Test Org",
      orderId: "cm1234567890",
      items: [{ name: "Product", quantity: 1, unitPrice: 100 }],
      total: 100,
      paymentMethod: "EFECTIVO",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          error: "Network error",
        }),
      })
    );
  });
});
