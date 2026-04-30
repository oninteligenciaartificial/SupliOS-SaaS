import { describe, expect, it, vi } from "vitest";
import { isPlanAtLeast } from "@/lib/plans";

// Mock prisma at top level (required by Vitest — hoisted before tests)
vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock("@/lib/monitoring", () => ({
  reportAsyncError: vi.fn(),
}));

describe("logAudit plan gate (via isPlanAtLeast)", () => {
  it("EMPRESARIAL passes the gate", () => {
    expect(isPlanAtLeast("EMPRESARIAL", "EMPRESARIAL")).toBe(true);
  });

  it("PRO does not pass the EMPRESARIAL gate", () => {
    expect(isPlanAtLeast("PRO", "EMPRESARIAL")).toBe(false);
  });

  it("CRECER does not pass the EMPRESARIAL gate", () => {
    expect(isPlanAtLeast("CRECER", "EMPRESARIAL")).toBe(false);
  });

  it("BASICO does not pass the EMPRESARIAL gate", () => {
    expect(isPlanAtLeast("BASICO", "EMPRESARIAL")).toBe(false);
  });
});

describe("logAudit behavior", () => {
  it("resolves without throwing for non-EMPRESARIAL plans", async () => {
    const { logAudit } = await import("@/lib/audit");

    await expect(
      logAudit({
        orgId: "org-1",
        orgPlan: "BASICO",
        userId: "user-1",
        action: "create",
        entityType: "product",
        entityId: "prod-1",
        after: { name: "Test" },
      })
    ).resolves.toBeUndefined();
  });

  it("resolves without throwing for EMPRESARIAL plan (fires DB create)", async () => {
    const { logAudit } = await import("@/lib/audit");

    await expect(
      logAudit({
        orgId: "org-2",
        orgPlan: "EMPRESARIAL",
        userId: "user-2",
        action: "delete",
        entityType: "customer",
        entityId: "cust-1",
        before: { name: "Cliente" },
        after: null,
      })
    ).resolves.toBeUndefined();
  });

  it("does NOT call prisma.create for non-EMPRESARIAL plans (early return)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const createSpy = vi.mocked(prisma.auditLog.create);
    createSpy.mockClear();

    const { logAudit } = await import("@/lib/audit");

    await logAudit({
      orgId: "org-3",
      orgPlan: "PRO",
      userId: "user-3",
      action: "update",
      entityType: "product",
      entityId: "prod-3",
    });

    expect(createSpy).not.toHaveBeenCalled();
  });
});
