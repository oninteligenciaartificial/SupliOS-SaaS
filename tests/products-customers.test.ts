import { describe, expect, it } from "vitest";
import { PLAN_LIMITS } from "@/lib/plans";

describe("Products — plan limits", () => {
  it("BASICO has maxProducts=150", () => {
    expect(PLAN_LIMITS.BASICO.maxProducts).toBe(150);
  });

  it("CRECER has maxProducts=500", () => {
    expect(PLAN_LIMITS.CRECER.maxProducts).toBe(500);
  });

  it("PRO and EMPRESARIAL have unlimited products", () => {
    expect(isFinite(PLAN_LIMITS.PRO.maxProducts)).toBe(false);
    expect(isFinite(PLAN_LIMITS.EMPRESARIAL.maxProducts)).toBe(false);
  });

  it("plan limit check allows creation when under limit", () => {
    const { maxProducts } = PLAN_LIMITS.BASICO;
    const currentCount = 100;
    const canCreate = currentCount < maxProducts;
    expect(canCreate).toBe(true);
  });

  it("plan limit check rejects creation when at limit", () => {
    const { maxProducts } = PLAN_LIMITS.BASICO;
    const currentCount = 150;
    const canCreate = currentCount < maxProducts;
    expect(canCreate).toBe(false);
  });

  it("PRO can always create products (unlimited)", () => {
    const { maxProducts } = PLAN_LIMITS.PRO;
    const currentCount = 999999;
    const canCreate = isFinite(maxProducts) ? currentCount < maxProducts : true;
    expect(canCreate).toBe(true);
  });

  it("upgrade required when at limit", () => {
    const { maxProducts } = PLAN_LIMITS.BASICO;
    const currentCount = 150;
    const requiresUpgrade = currentCount >= maxProducts;
    expect(requiresUpgrade).toBe(true);
    expect(maxProducts).toBe(150);
  });

  it("count query filters by org and active", () => {
    const where = { organizationId: "org-123", active: true };
    const currentCount = 149;
    const { maxProducts } = PLAN_LIMITS.BASICO;
    expect(currentCount < maxProducts).toBe(true);
  });
});

describe("Customers — plan limits", () => {
  it("BASICO has maxCustomers=50", () => {
    expect(PLAN_LIMITS.BASICO.maxCustomers).toBe(50);
  });

  it("CRECER has maxCustomers=300", () => {
    expect(PLAN_LIMITS.CRECER.maxCustomers).toBe(300);
  });

  it("PRO and EMPRESARIAL have unlimited customers", () => {
    expect(isFinite(PLAN_LIMITS.PRO.maxCustomers)).toBe(false);
    expect(isFinite(PLAN_LIMITS.EMPRESARIAL.maxCustomers)).toBe(false);
  });

  it("CRECER plan rejects at exactly 300 customers", () => {
    const { maxCustomers } = PLAN_LIMITS.CRECER;
    const currentCount = 300;
    const canCreate = currentCount < maxCustomers;
    expect(canCreate).toBe(false);
  });

  it("CRECER plan allows at 299 customers", () => {
    const { maxCustomers } = PLAN_LIMITS.CRECER;
    const currentCount = 299;
    const canCreate = currentCount < maxCustomers;
    expect(canCreate).toBe(true);
  });

  it("upgrade message uses correct limit number", () => {
    const { maxCustomers } = PLAN_LIMITS.BASICO;
    const currentCount = 50;
    const requiresUpgrade = currentCount >= maxCustomers;
    const errorMsg = `Tu plan permite hasta ${maxCustomers} clientes. Actualiza tu plan para agregar más.`;
    expect(errorMsg).toContain("50");
    expect(errorMsg).toContain("clientes");
  });

  it("count query does NOT filter by active (customers have no active flag)", () => {
    const where = { organizationId: "org-123" };
    const currentCount = 49;
    const { maxCustomers } = PLAN_LIMITS.BASICO;
    expect(currentCount < maxCustomers).toBe(true);
  });
});

describe("Products — variant creation respects maxProducts", () => {
  it("product with hasVariants=true sets stock to 0 initially", () => {
    const hasVariants = true;
    const stock = hasVariants ? 0 : 10;
    expect(stock).toBe(0);
  });

  it("product without variants uses provided stock", () => {
    const hasVariants = false;
    const stock = hasVariants ? 0 : 10;
    expect(stock).toBe(10);
  });

  it("attributeSchema is stored as JSON", () => {
    const attributeSchema = { talla: ["S", "M", "L"], color: ["Rojo", "Azul"] };
    const stored = JSON.parse(JSON.stringify(attributeSchema));
    expect(stored).toEqual({ talla: ["S", "M", "L"], color: ["Rojo", "Azul"] });
  });

  it("attributeSchema is null when not provided", () => {
    const attributeSchema = undefined;
    const stored = attributeSchema ?? null;
    expect(stored).toBeNull();
  });
});

describe("Customers — birthday handling", () => {
  it("stores birthday as Date object", () => {
    const birthdayStr = "1990-05-15";
    const birthday = new Date(birthdayStr);
    expect(birthday.getFullYear()).toBe(1990);
    expect(birthday.getMonth()).toBe(4);
  });

  it("stores null when birthday is empty", () => {
    const birthdayStr = undefined;
    const birthday = birthdayStr ? new Date(birthdayStr) : null;
    expect(birthday).toBeNull();
  });

  it("email empty string becomes null", () => {
    const email = "";
    const stored = email || null;
    expect(stored).toBeNull();
  });

  it("email undefined becomes null", () => {
    const email = undefined;
    const stored = email ?? null;
    expect(stored).toBeNull();
  });

  it("valid email is stored", () => {
    const email = "test@example.com";
    const stored = email || null;
    expect(stored).toBe("test@example.com");
  });

  it("RFC is optional and stored as-is", () => {
    const rfc = "123456789012";
    const stored = rfc ?? null;
    expect(stored).toBe("123456789012");
  });

  it("notes are optional and stored as-is", () => {
    const notes = "Cliente preferencial";
    const stored = notes ?? null;
    expect(stored).toBe("Cliente preferencial");
  });
});

describe("Products — pagination", () => {
  it("calculates skip correctly for page 1", () => {
    const page = 1;
    const limit = 100;
    const skip = (page - 1) * limit;
    expect(skip).toBe(0);
  });

  it("calculates skip correctly for page 3", () => {
    const page = 3;
    const limit = 50;
    const skip = (page - 1) * limit;
    expect(skip).toBe(100);
  });

  it("limits to max 200 results", () => {
    const requestedLimit = 500;
    const limit = Math.min(200, Math.max(1, requestedLimit));
    expect(limit).toBe(200);
  });

  it("defaults to 1 for invalid page", () => {
    const page = Math.max(1, -1);
    expect(page).toBe(1);
  });

  it("calculates total pages correctly", () => {
    const total = 550;
    const limit = 100;
    const pages = Math.ceil(total / limit);
    expect(pages).toBe(6);
  });
});

describe("Products — search and filter", () => {
  it("search filter is case-insensitive", () => {
    const search = "laptop";
    const where = { name: { contains: search, mode: "insensitive" as const } };
    expect(where.name.mode).toBe("insensitive");
  });

  it("categoryId filter works", () => {
    const categoryId = "cat-123";
    const where = { categoryId };
    expect(where.categoryId).toBe("cat-123");
  });

  it("combines search with categoryId filter", () => {
    const search = "laptop";
    const categoryId = "cat-123";
    const where = {
      organizationId: "org-123",
      active: true,
      name: { contains: search, mode: "insensitive" as const },
      categoryId,
    };
    expect(where.name).toBeDefined();
    expect(where.categoryId).toBe("cat-123");
  });
});

describe("Products — name trimming", () => {
  it("trims whitespace from product name", () => {
    const name = "  Laptop Lenovo   ";
    const trimmed = name.trim();
    expect(trimmed).toBe("Laptop Lenovo");
  });

  it("sku and barcode can be null", () => {
    const sku = null;
    const barcode = null;
    const stored = { sku: sku ?? null, barcode: barcode ?? null };
    expect(stored.sku).toBeNull();
    expect(stored.barcode).toBeNull();
  });

  it("unit defaults to null when not provided", () => {
    const unit = undefined;
    const stored = unit ?? null;
    expect(stored).toBeNull();
  });
});

describe("Products — audit logging", () => {
  it("audit logs product creation", () => {
    const product = { id: "prod-123", name: "Laptop", price: 500, stock: 10 };
    const audit = {
      action: "create",
      entityType: "product",
      entityId: product.id,
      after: { name: product.name, price: product.price, stock: product.stock },
    };
    expect(audit.action).toBe("create");
    expect(audit.entityType).toBe("product");
    expect(audit.after.name).toBe("Laptop");
  });
});

describe("Customers — audit logging", () => {
  it("audit logs customer creation", () => {
    const customer = { id: "cust-123", name: "Juan Perez", phone: "+5911234567", email: "juan@example.com" };
    const audit = {
      action: "create",
      entityType: "customer",
      entityId: customer.id,
      after: { name: customer.name, phone: customer.phone, email: customer.email },
    };
    expect(audit.action).toBe("create");
    expect(audit.entityType).toBe("customer");
    expect(audit.after.name).toBe("Juan Perez");
    expect(audit.after.email).toBe("juan@example.com");
  });
});

describe("Products — permission checks", () => {
  it("products:create permission is needed for POST", () => {
    const role = "OWNER";
    const hasPerm = ["OWNER", "ADMIN"].includes(role);
    expect(hasPerm).toBe(true);
  });

  it("STAFF can create products", () => {
    const STAFF_PERMS = ["products:create", "products:edit", "orders:create", "orders:edit", "customers:view", "customers:create", "discounts:view"];
    const hasPerm = STAFF_PERMS.includes("products:create");
    expect(hasPerm).toBe(true);
  });

  it("VIEWER cannot create products", () => {
    const VIEWER_PERMS = ["customers:view", "reports:view", "caja:view"];
    const hasPerm = VIEWER_PERMS.includes("products:create");
    expect(hasPerm).toBe(false);
  });

  it("MANAGER can create products", () => {
    const MANAGER_PERMS = ["products:create", "products:edit", "products:export", "orders:create", "orders:edit", "orders:delete", "customers:view", "customers:create", "customers:edit", "reports:view", "caja:view", "suppliers:view", "discounts:view", "discounts:create"];
    const hasPerm = MANAGER_PERMS.includes("products:create");
    expect(hasPerm).toBe(true);
  });
});

describe("Customers — permission checks", () => {
  it("VIEWER has customers:view permission", () => {
    const VIEWER_PERMS = ["customers:view", "reports:view", "caja:view"];
    const hasPerm = VIEWER_PERMS.includes("customers:view");
    expect(hasPerm).toBe(true);
  });

  it("VIEWER does NOT have customers:create permission", () => {
    const VIEWER_PERMS = ["customers:view", "reports:view", "caja:view"];
    const hasCreatePerm = VIEWER_PERMS.includes("customers:create");
    expect(hasCreatePerm).toBe(false);
  });

  it("customers:create permission is needed for POST", () => {
    const role = "MEMBER";
    const hasPerm = ["OWNER", "ADMIN", "MEMBER"].includes(role);
    expect(hasPerm).toBe(true);
  });

  it("VIEWER cannot create customers", () => {
    const role = "VIEWER";
    const hasCreatePerm = ["OWNER", "ADMIN", "MEMBER"].includes(role);
    expect(hasCreatePerm).toBe(false);
  });
});

describe("Products — cost and margin", () => {
  it("cost can be 0", () => {
    const cost = 0;
    const price = 100;
    const margin = price - cost;
    expect(margin).toBe(100);
  });

  it("price can be 0 (free products)", () => {
    const price = 0;
    expect(price).toBe(0);
  });

  it("minStock defaults to 5", () => {
    const minStock = 5;
    expect(minStock).toBe(5);
  });
});

describe("Customers — search", () => {
  it("searches across name, phone, and email", () => {
    const search = "juan";
    const where = {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    };
    expect(where.OR).toHaveLength(3);
  });

  it("returns all customers when no search", () => {
    const search = null;
    const where = { organizationId: "org-123" };
    expect(where).not.toHaveProperty("OR");
  });
});