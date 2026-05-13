import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock prisma before importing
vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: { update: vi.fn() },
    qrPayment: { findFirst: vi.fn(), updateMany: vi.fn() },
    order: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";

describe("tryActivatePlanFromQr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("activates plan when orderId starts with plan_", async () => {
    // Import the module to test
    const { handleWebhookEvent } = await import("@/lib/qr-bolivia");

    // Create a mock webhook event for a plan payment
    const mockEvent = {
      externalId: "ext_123",
      status: "PAGADO" as const,
      paidAt: new Date().toISOString(),
      payerInfo: { bank: "Ganadero" },
      raw: {},
    };

    // Mock the QR payment lookup
    (prisma.qrPayment.findFirst as any).mockResolvedValue({
      id: "qr_123",
      orderId: "plan_CRECER_3_org_abc123",
      status: "PENDIENTE",
    });

    // Mock the transaction
    (prisma.$transaction as any).mockResolvedValue([]);

    await handleWebhookEvent(mockEvent);

    // Verify the organization was updated with the new plan
    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: "org_abc123" },
      data: expect.objectContaining({
        plan: "CRECER",
        planExpiresAt: expect.any(Date),
        trialEndsAt: null,
      }),
    });
  });

  it("does not activate plan for regular order payments", async () => {
    const { handleWebhookEvent } = await import("@/lib/qr-bolivia");

    const mockEvent = {
      externalId: "ext_456",
      status: "PAGADO" as const,
      paidAt: new Date().toISOString(),
      payerInfo: {},
      raw: {},
    };

    (prisma.qrPayment.findFirst as any).mockResolvedValue({
      id: "qr_456",
      orderId: "order_regular_123",
      status: "PENDIENTE",
    });

    (prisma.$transaction as any).mockResolvedValue([]);

    await handleWebhookEvent(mockEvent);

    // Should not call organization.update for regular orders
    expect(prisma.organization.update).not.toHaveBeenCalled();
  });

  it("does not activate plan for non-PAGADO status", async () => {
    const { handleWebhookEvent } = await import("@/lib/qr-bolivia");

    const mockEvent = {
      externalId: "ext_789",
      status: "EXPIRADO" as const,
      raw: {},
    };

    (prisma.qrPayment.findFirst as any).mockResolvedValue({
      id: "qr_789",
      orderId: "plan_PRO_6_org_xyz",
      status: "PENDIENTE",
    });

    (prisma.$transaction as any).mockResolvedValue([]);

    await handleWebhookEvent(mockEvent);

    // Should not activate plan for expired payments
    expect(prisma.organization.update).not.toHaveBeenCalled();
  });
});
