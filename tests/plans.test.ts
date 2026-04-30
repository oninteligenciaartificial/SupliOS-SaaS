import { describe, expect, it } from "vitest";
import {
  PLAN_LIMITS,
  canUseFeature,
  isPlanAtLeast,
  planGateError,
  limitGateError,
} from "@/lib/plans";

describe("isPlanAtLeast", () => {
  it("returns true when plan meets requirement exactly", () => {
    expect(isPlanAtLeast("CRECER", "CRECER")).toBe(true);
  });

  it("returns true when plan exceeds requirement", () => {
    expect(isPlanAtLeast("EMPRESARIAL", "BASICO")).toBe(true);
    expect(isPlanAtLeast("PRO", "CRECER")).toBe(true);
  });

  it("returns false when plan is below requirement", () => {
    expect(isPlanAtLeast("BASICO", "CRECER")).toBe(false);
    expect(isPlanAtLeast("CRECER", "PRO")).toBe(false);
    expect(isPlanAtLeast("PRO", "EMPRESARIAL")).toBe(false);
  });
});

describe("canUseFeature", () => {
  it("blocks BASICO from reports (requires CRECER)", () => {
    expect(canUseFeature("BASICO", "reports")).toBe(false);
  });

  it("allows CRECER to use reports", () => {
    expect(canUseFeature("CRECER", "reports")).toBe(true);
  });

  it("blocks BASICO from audit_log (requires EMPRESARIAL)", () => {
    expect(canUseFeature("BASICO", "audit_log")).toBe(false);
  });

  it("blocks PRO from audit_log (requires EMPRESARIAL)", () => {
    expect(canUseFeature("PRO", "audit_log")).toBe(false);
  });

  it("allows EMPRESARIAL to use audit_log", () => {
    expect(canUseFeature("EMPRESARIAL", "audit_log")).toBe(true);
  });

  it("allows any plan to use unknown feature", () => {
    expect(canUseFeature("BASICO", "nonexistent_feature")).toBe(true);
  });
});

describe("PLAN_LIMITS — products", () => {
  it("BASICO has 150 product limit", () => {
    expect(PLAN_LIMITS.BASICO.maxProducts).toBe(150);
  });

  it("CRECER has 500 product limit", () => {
    expect(PLAN_LIMITS.CRECER.maxProducts).toBe(500);
  });

  it("PRO has infinite products", () => {
    expect(isFinite(PLAN_LIMITS.PRO.maxProducts)).toBe(false);
  });

  it("EMPRESARIAL has infinite products", () => {
    expect(isFinite(PLAN_LIMITS.EMPRESARIAL.maxProducts)).toBe(false);
  });
});

describe("PLAN_LIMITS — customers", () => {
  it("BASICO has 50 customer limit", () => {
    expect(PLAN_LIMITS.BASICO.maxCustomers).toBe(50);
  });

  it("CRECER has 300 customer limit", () => {
    expect(PLAN_LIMITS.CRECER.maxCustomers).toBe(300);
  });

  it("PRO has infinite customers", () => {
    expect(isFinite(PLAN_LIMITS.PRO.maxCustomers)).toBe(false);
  });
});

describe("planGateError", () => {
  it("returns upgrade flag and correct plan for audit_log", () => {
    const err = planGateError("audit_log");
    expect(err.upgrade).toBe(true);
    expect(err.requiredPlan).toBe("EMPRESARIAL");
    expect(err.error).toContain("Empresarial");
  });

  it("returns upgrade flag and correct plan for reports", () => {
    const err = planGateError("reports");
    expect(err.upgrade).toBe(true);
    expect(err.requiredPlan).toBe("CRECER");
  });
});

describe("limitGateError", () => {
  it("includes resource name and limit in error", () => {
    const err = limitGateError("productos", 150, "BASICO");
    expect(err.upgrade).toBe(true);
    expect(err.limit).toBe(150);
    expect(err.error).toContain("150");
    expect(err.error).toContain("productos");
  });
});
