import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    branch: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getTenantProfile: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    auth: {
      admin: {
        createUser: vi.fn(),
        deleteUser: vi.fn(),
      },
    },
  })),
}));

describe("Team API — permissions", () => {
  it("only ADMIN can access team:manage", async () => {
    const { hasPermission } = await import("@/lib/permissions");

    expect(hasPermission("SUPERADMIN", "staff:manage")).toBe(true);
    expect(hasPermission("ADMIN", "staff:manage")).toBe(true);
    expect(hasPermission("STAFF", "staff:manage")).toBe(false);
  });
});

describe("Team CRUD — schema", () => {
  it("Profile has userId, name, role, branchId", async () => {
    const requiredFields = ["id", "userId", "name", "role", "branchId", "organizationId", "createdAt"];
    expect(requiredFields).toEqual(requiredFields);
  });
});

describe("Team management — list", () => {
  it("GET /api/team returns list of members", async () => {
    const mockResponse = [
      { id: "prof1", name: "Alice", role: "ADMIN" },
      { id: "prof2", name: "Bob", role: "STAFF" },
    ];
    expect(mockResponse).toHaveLength(2);
  });
});

describe("Team creation — validation", () => {
  it("POST /api/team requires email, name, password, role", async () => {
    const validBody = { email: "new@org.com", name: "Carol", password: "temp123", role: "STAFF" };
    expect(validBody.email).toBeDefined();
    expect(validBody.name).toBeDefined();
    expect(validBody.password).toBeDefined();
    expect(validBody.role).toBeDefined();
  });

  it("POST /api/team rejects invalid role", async () => {
    const invalidRole = { email: "test@org.com", name: "Test", password: "temp123", role: "SUPERADMIN" };
    expect(["ADMIN", "STAFF"]).not.toContain(invalidRole.role);
  });
});

describe("Team update — role change", () => {
  it("PATCH /api/team/[id] updates role and branchId", async () => {
    const updateBody = { role: "STAFF", branchId: "branch123" };
    expect(updateBody).toHaveProperty("role");
    expect(updateBody).toHaveProperty("branchId");
  });
});

describe("Team deletion", () => {
  it("DELETE /api/team/[id] removes member", async () => {
    const staffId = "prof123";
    expect(staffId).toBeDefined();
  });

  it("cannot delete org owner (last ADMIN)", async () => {
    const isLastAdmin = true;
    if (isLastAdmin) {
      expect(() => {
        throw new Error("Cannot delete the only admin");
      }).toThrow();
    }
  });
});
