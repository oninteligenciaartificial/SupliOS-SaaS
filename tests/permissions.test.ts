import { describe, expect, it } from "vitest";
import { hasPermission, getRolePermissions } from "@/lib/permissions";

describe("hasPermission — SUPERADMIN/ADMIN", () => {
  it("SUPERADMIN can do anything", () => {
    expect(hasPermission("SUPERADMIN", "products:delete")).toBe(true);
    expect(hasPermission("SUPERADMIN", "staff:manage")).toBe(true);
    expect(hasPermission("SUPERADMIN", "audit:view")).toBe(true);
  });

  it("ADMIN can do anything", () => {
    expect(hasPermission("ADMIN", "products:delete")).toBe(true);
    expect(hasPermission("ADMIN", "staff:manage")).toBe(true);
    expect(hasPermission("ADMIN", "settings:edit")).toBe(true);
  });
});

describe("hasPermission — MANAGER", () => {
  it("MANAGER can create products and orders", () => {
    expect(hasPermission("MANAGER", "products:create")).toBe(true);
    expect(hasPermission("MANAGER", "orders:create")).toBe(true);
  });

  it("MANAGER can view reports", () => {
    expect(hasPermission("MANAGER", "reports:view")).toBe(true);
    expect(hasPermission("MANAGER", "caja:view")).toBe(true);
  });

  it("MANAGER cannot manage staff", () => {
    expect(hasPermission("MANAGER", "staff:manage")).toBe(false);
  });

  it("MANAGER cannot delete products", () => {
    expect(hasPermission("MANAGER", "products:delete")).toBe(false);
  });

  it("MANAGER cannot view audit", () => {
    expect(hasPermission("MANAGER", "audit:view")).toBe(false);
  });
});

describe("hasPermission — STAFF", () => {
  it("STAFF can create orders and edit products", () => {
    expect(hasPermission("STAFF", "orders:create")).toBe(true);
    expect(hasPermission("STAFF", "products:edit")).toBe(true);
  });

  it("STAFF can view customers but not create discounts", () => {
    expect(hasPermission("STAFF", "customers:view")).toBe(true);
    expect(hasPermission("STAFF", "discounts:create")).toBe(false);
  });

  it("STAFF cannot view reports", () => {
    expect(hasPermission("STAFF", "reports:view")).toBe(false);
  });

  it("STAFF cannot manage staff or branches", () => {
    expect(hasPermission("STAFF", "staff:manage")).toBe(false);
    expect(hasPermission("STAFF", "branches:manage")).toBe(false);
  });
});

describe("hasPermission — VIEWER", () => {
  it("VIEWER can only view (customers, reports, caja)", () => {
    expect(hasPermission("VIEWER", "customers:view")).toBe(true);
    expect(hasPermission("VIEWER", "reports:view")).toBe(true);
    expect(hasPermission("VIEWER", "caja:view")).toBe(true);
  });

  it("VIEWER cannot create or edit anything", () => {
    expect(hasPermission("VIEWER", "products:create")).toBe(false);
    expect(hasPermission("VIEWER", "orders:create")).toBe(false);
    expect(hasPermission("VIEWER", "customers:create")).toBe(false);
  });

  it("VIEWER cannot delete or manage", () => {
    expect(hasPermission("VIEWER", "products:delete")).toBe(false);
    expect(hasPermission("VIEWER", "staff:manage")).toBe(false);
  });
});

describe("hasPermission — unknown role", () => {
  it("unknown role has no permissions", () => {
    expect(hasPermission("UNKNOWN", "products:create")).toBe(false);
    expect(hasPermission("UNKNOWN", "orders:create")).toBe(false);
  });
});

describe("hasPermission — extraPermissions override", () => {
  it("STAFF gains permission via extraPermissions", () => {
    expect(hasPermission("STAFF", "reports:view", ["reports:view"])).toBe(true);
  });

  it("VIEWER gains edit permission via extraPermissions", () => {
    expect(hasPermission("VIEWER", "products:edit", ["products:edit"])).toBe(true);
  });
});

describe("getRolePermissions", () => {
  it("MANAGER has expected permissions", () => {
    const perms = getRolePermissions("MANAGER");
    expect(perms).toContain("products:create");
    expect(perms).toContain("orders:delete");
    expect(perms).toContain("reports:view");
  });

  it("STAFF has limited permissions", () => {
    const perms = getRolePermissions("STAFF");
    expect(perms).toContain("orders:create");
    expect(perms).not.toContain("staff:manage");
    expect(perms).not.toContain("reports:view");
  });

  it("VIEWER has only 3 permissions", () => {
    const perms = getRolePermissions("VIEWER");
    expect(perms).toHaveLength(3);
  });

  it("unknown role returns empty array", () => {
    expect(getRolePermissions("GHOST")).toEqual([]);
  });
});
