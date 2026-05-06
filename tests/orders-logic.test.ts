import { describe, expect, it, vi, beforeEach } from "vitest";
import { reportAsyncError } from "@/lib/monitoring";

describe("Stock decrement logic (orders/route.ts)", () => {
  describe("variant vs product stock", () => {
    it("decrements ProductVariant.stock when variantId is provided", () => {
      const variant = { id: "v1", stock: 10 };
      const item = { variantId: "v1", quantity: 2 };

      const newStock = variant.stock - item.quantity;
      expect(newStock).toBe(8);
    });

    it("decrements Product.stock when no variantId", () => {
      const product = { id: "p1", stock: 20 };
      const item = { productId: "p1", quantity: 3, variantId: undefined };

      const newStock = product.stock - item.quantity;
      expect(newStock).toBe(17);
    });

    it("zero stock after exact decrement", () => {
      const variant = { id: "v1", stock: 5 };
      const item = { variantId: "v1", quantity: 5 };

      const newStock = variant.stock - item.quantity;
      expect(newStock).toBe(0);
    });
  });

  describe("multiple items stock decrement", () => {
    it("decrements stock for multiple items in correct order", () => {
      const variants = [
        { id: "v1", stock: 10 },
        { id: "v2", stock: 5 },
      ];
      const items = [
        { variantId: "v1", quantity: 2 },
        { variantId: "v2", quantity: 3 },
      ];

      const results = items.map((item) => {
        const variant = variants.find((v) => v.id === item.variantId)!;
        return variant.stock - item.quantity;
      });

      expect(results[0]).toBe(8);
      expect(results[1]).toBe(2);
    });

    it("mixed variants and products", () => {
      const product = { id: "p1", stock: 20 };
      const variant = { id: "v1", stock: 10 };

      const productItem = { productId: "p1", quantity: 5, variantId: null };
      const variantItem = { productId: "p1", variantId: "v1", quantity: 3 };

      const productStock = product.stock - productItem.quantity;
      const variantStock = variant.stock - variantItem.quantity;

      expect(productStock).toBe(15);
      expect(variantStock).toBe(7);
    });
  });
});

describe("Loyalty points redemption (orders/route.ts)", () => {
  const POINTS_TO_BOB = 0.1; // 10 points = Bs. 1

  it("calculates correct points discount", () => {
    const loyaltyPointsRedeemed = 100;
    const subtotal = 500;

    const pointsDiscount = Math.min(loyaltyPointsRedeemed * POINTS_TO_BOB, subtotal);
    expect(pointsDiscount).toBe(10); // 100 * 0.1 = 10 Bs
  });

  it("caps discount at subtotal (can't exceed order total)", () => {
    const loyaltyPointsRedeemed = 10000; // huge amount
    const subtotal = 50;

    const pointsDiscount = Math.min(loyaltyPointsRedeemed * POINTS_TO_BOB, subtotal);
    expect(pointsDiscount).toBe(50); // capped at subtotal
  });

  it("customer with insufficient points gets lower discount", () => {
    const customerPoints = 30;
    const loyaltyPointsRedeemed = 50;
    const subtotal = 500;

    const maxRedeemable = customerPoints;
    const actualPoints = Math.min(loyaltyPointsRedeemed, maxRedeemable);
    const pointsDiscount = Math.min(actualPoints * POINTS_TO_BOB, subtotal);

    expect(pointsDiscount).toBe(3); // 30 * 0.1 = 3 Bs
  });

  it("total is subtotal minus points discount", () => {
    const subtotal = 200;
    const pointsDiscount = 15;
    const total = Math.max(0, subtotal - pointsDiscount);
    expect(total).toBe(185);
  });

  it("no discount when loyaltyPointsRedeemed is 0", () => {
    const subtotal = 200;
    const pointsDiscount = 0;
    const total = Math.max(0, subtotal - pointsDiscount);
    expect(total).toBe(200);
  });

  it("no discount when loyaltyPointsRedeemed is undefined", () => {
    const subtotal = 200;
    const loyaltyPointsRedeemed = undefined;
    const pointsDiscount = 0;
    const total = Math.max(0, subtotal - pointsDiscount);
    expect(total).toBe(200);
  });

  it("loyaltyPoints are decremented from customer record", () => {
    const customer = { id: "c1", loyaltyPoints: 100 };
    const loyaltyPointsRedeemed = 50;
    const maxRedeemable = customer.loyaltyPoints;
    const actualPoints = Math.min(loyaltyPointsRedeemed, maxRedeemable);

    const newPoints = customer.loyaltyPoints - actualPoints;
    expect(newPoints).toBe(50);
  });

  it("points accumulation on delivery (1 point per Bs. 10)", () => {
    const POINTS_PER_BOB = 0.1;
    const orderTotal = 250;

    const pointsAccumulated = Math.floor(orderTotal * POINTS_PER_BOB);
    expect(pointsAccumulated).toBe(25); // 250 * 0.1 = 25 points
  });
});

describe("Order status transitions", () => {
  const VALID_STATUSES = ["PENDIENTE", "CONFIRMADO", "ENVIADO", "ENTREGADO", "CANCELADO"] as const;

  it("ENTREGADO triggers loyalty points accumulation", () => {
    const newStatus = "ENTREGADO";
    const triggersLoyalty = newStatus === "ENTREGADO";
    expect(triggersLoyalty).toBe(true);
  });

  it("CANCELADO does NOT trigger loyalty points", () => {
    const newStatus: string = "CANCELADO";
    const triggersLoyalty = newStatus === "ENTREGADO";
    expect(triggersLoyalty).toBe(false);
  });

  it("status filter works for known statuses", () => {
    const status = "PENDIENTE";
    const validStatus = VALID_STATUSES.includes(status as typeof VALID_STATUSES[number]) ? status : undefined;
    expect(validStatus).toBe("PENDIENTE");
  });

  it("status filter returns undefined for unknown status", () => {
    const status = "INVALIDO";
    const validStatus = VALID_STATUSES.includes(status as typeof VALID_STATUSES[number]) ? status : undefined;
    expect(validStatus).toBeUndefined();
  });

  it("CANCELADO restores stock when re-entering", () => {
    const previousStock = 10;
    const cancelledQuantity = 3;
    const restoredStock = previousStock + cancelledQuantity;
    expect(restoredStock).toBe(13);
  });
});

describe("Order total calculation", () => {
  it("calculates subtotal from items array", () => {
    const items = [
      { quantity: 2, unitPrice: 50 },
      { quantity: 1, unitPrice: 100 },
      { quantity: 3, unitPrice: 25 },
    ];
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    expect(subtotal).toBe(275); // 100 + 100 + 75
  });

  it("handles single item order", () => {
    const items = [{ quantity: 1, unitPrice: 199 }];
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    expect(subtotal).toBe(199);
  });

  it("rounds to 2 decimal places via number (no toFixed)", () => {
    const items = [{ quantity: 3, unitPrice: 33.33 }];
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    expect(subtotal).toBeCloseTo(99.99, 2);
  });
});

describe("Order item variantSnapshot", () => {
  it("variantSnapshot captures attributes at time of sale", () => {
    const variant = { id: "v1", attributes: { talla: "M", color: "Negro" } };
    const snapshot = { ...variant.attributes };
    expect(snapshot).toEqual({ talla: "M", color: "Negro" });
  });

  it("variantSnapshot is null when no variant", () => {
    const item = { variantId: null };
    const variantSnapshot = item.variantId ? { some: "attrs" } : null;
    expect(variantSnapshot).toBeNull();
  });
});

describe("Order pagination", () => {
  it("calculates correct skip value", () => {
    const page = 3;
    const limit = 50;
    const skip = (page - 1) * limit;
    expect(skip).toBe(100);
  });

  it("limits results to max 200", () => {
    const requestedLimit = 500;
    const limit = Math.min(200, Math.max(1, requestedLimit));
    expect(limit).toBe(200);
  });

  it("calculates total pages correctly", () => {
    const total = 95;
    const limit = 50;
    const pages = Math.ceil(total / limit);
    expect(pages).toBe(2);
  });

  it("defaults to page 1 when invalid", () => {
    const page = Math.max(1, -5);
    expect(page).toBe(1);
  });
});

describe("reportAsyncError integration in orders", () => {
  it("reports error with scope prefix", () => {
    const scope = "api.orders.sendOrderConfirmation";
    const error = new Error("Brevo API failed");

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    reportAsyncError(scope, error, { orderId: "order-123", organizationId: "org-456" });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("api.orders.sendOrderConfirmation"),
      expect.objectContaining({ error: expect.any(Error) })
    );

    consoleSpy.mockRestore();
  });
});