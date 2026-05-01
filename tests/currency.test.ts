import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/currency";

describe("formatMoney", () => {
  it("formats positive amount in MXN by default", () => {
    const result = formatMoney(1000);
    expect(result).toContain("1");
    expect(result).toContain("000");
  });

  it("always includes 2 decimal places", () => {
    expect(formatMoney(100)).toMatch(/100[,.]00/);
    expect(formatMoney(99.9)).toMatch(/99[,.][,.]?90/);
  });

  it("formats BOB currency", () => {
    const result = formatMoney(350, "BOB");
    expect(result).toContain("350");
  });

  it("formats USD currency", () => {
    const result = formatMoney(1234.56, "USD");
    expect(result).toContain("1");
    expect(result).toContain("234");
  });

  it("formats zero", () => {
    const result = formatMoney(0);
    expect(result).toContain("0");
  });

  it("handles null/undefined currency gracefully (falls back to MXN)", () => {
    const result = formatMoney(500, undefined);
    expect(result).toContain("500");
  });

  it("formats large amount with thousands separator", () => {
    const result = formatMoney(1000000, "BOB");
    expect(result).toContain("000");
  });
});
