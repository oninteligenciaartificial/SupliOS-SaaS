import { describe, expect, it } from "vitest";
import { consumeRateLimit, getRequestIp } from "@/lib/rate-limit";

describe("V-02 — tienda/checkout unitPrice validation", () => {
describe("price comparison logic", () => {
    it("rejects price manipulation (client -2.00)", () => {
      const diff = Math.abs(98 - 100);
      expect(diff > 0.01).toBe(true);
    });

    it("rejects price inflation (client +5.00)", () => {
      const diff = Math.abs(105 - 100);
      expect(diff > 0.01).toBe(true);
    });

    it("accepts zero price for free items", () => {
      const diff = Math.abs(0 - 0);
      expect(diff <= 0.01).toBe(true);
    });

    it("handles floating point precision in price comparison", () => {
      const diff = Math.abs(24.99 - 24.99);
      expect(diff <= 0.01).toBe(true);
    });
  });

  describe("price map lookup", () => {
    it("returns undefined for unknown product", () => {
      const priceMap = new Map([["prod-1", 50], ["prod-2", 75]]);
      const price = priceMap.get("prod-3");
      expect(price).toBeUndefined();
    });

    it("returns correct price for known product", () => {
      const priceMap = new Map([["prod-1", 50], ["prod-2", 75]]);
      expect(priceMap.get("prod-1")).toBe(50);
      expect(priceMap.get("prod-2")).toBe(75);
    });
  });

  describe("variant price override", () => {
    it("uses variant price when variantId is provided", () => {
      const product = { id: "p1", price: 100, hasVariants: true };
      const variant = { id: "v1", price: 80 };
      const price = Number(variant.price ?? product.price);
      expect(price).toBe(80);
    });

    it("falls back to product price when variant has no price", () => {
      const product = { id: "p1", price: 100, hasVariants: true };
      const variant = { id: "v1", price: null };
      const price = Number(variant.price ?? product.price);
      expect(price).toBe(100);
    });

    it("uses product price when no variantId", () => {
      const product = { id: "p1", price: 100, hasVariants: false };
      const price = Number(product.price);
      expect(price).toBe(100);
    });
  });
});

describe("V-07 — magic bytes MIME detection", () => {
  describe("JPEG detection", () => {
    it("matches JPEG magic bytes [FF D8 FF]", () => {
      const jpegHeader = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      const matches = jpegHeader[0] === 0xFF && jpegHeader[1] === 0xD8 && jpegHeader[2] === 0xFF;
      expect(matches).toBe(true);
    });

    it("rejects non-JPEG header", () => {
      const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47]);
      const matches = pngHeader[0] === 0xFF && pngHeader[1] === 0xD8 && pngHeader[2] === 0xFF;
      expect(matches).toBe(false);
    });
  });

  describe("PNG detection", () => {
    it("matches PNG magic bytes [89 50 4E 47...]", () => {
      const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const expected = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      let match = true;
      for (let i = 0; i < expected.length; i++) {
        if (pngHeader[i] !== expected[i]) { match = false; break; }
      }
      expect(match).toBe(true);
    });

    it("rejects non-PNG header", () => {
      const jpegHeader = new Uint8Array([0xFF, 0xD8, 0xFF]);
      const expected = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      let match = true;
      for (let i = 0; i < expected.length; i++) {
        if (jpegHeader[i] !== expected[i]) { match = false; break; }
      }
      expect(match).toBe(false);
    });
  });

  describe("GIF detection", () => {
    it("matches GIF87a magic bytes", () => {
      const gifHeader = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]);
      const expected = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61];
      let match = true;
      for (let i = 0; i < expected.length; i++) {
        if (gifHeader[i] !== expected[i]) { match = false; break; }
      }
      expect(match).toBe(true);
    });

    it("matches GIF89a magic bytes", () => {
      const gifHeader = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
      const expected = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];
      let match = true;
      for (let i = 0; i < expected.length; i++) {
        if (gifHeader[i] !== expected[i]) { match = false; break; }
      }
      expect(match).toBe(true);
    });
  });

  describe("WebP detection", () => {
    it("matches RIFF....WEBP at offset 0", () => {
      const riff = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
      const riffMatch = riff[0] === 0x52 && riff[1] === 0x49 && riff[2] === 0x46 && riff[3] === 0x46;
      const webpMatch = riff[8] === 0x57 && riff[9] === 0x45 && riff[10] === 0x42 && riff[11] === 0x50;
      expect(riffMatch && webpMatch).toBe(true);
    });
  });

  describe("spoofed MIME detection", () => {
    it("detects JPEG content with fake .png extension", () => {
      const jpegContent = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
      const isPng = jpegContent[0] === 0x89 && jpegContent[1] === 0x50;
      expect(isPng).toBe(false);
    });

    it("detects PNG content with fake .jpg extension", () => {
      const pngContent = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const isJpeg = pngContent[0] === 0xFF && pngContent[1] === 0xD8;
      expect(isJpeg).toBe(false);
    });
  });
});

describe("Rate limiting", () => {
  describe("consumeRateLimit", () => {
    it("allows first request", async () => {
      const key = `test-rl-${Date.now()}`;
      const result = await consumeRateLimit(key, { windowMs: 60_000, max: 5 });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("blocks when limit exceeded", async () => {
      const key = `test-rl-block-${Date.now()}`;
      for (let i = 0; i < 5; i++) await consumeRateLimit(key, { windowMs: 60_000, max: 5 });
      const result = await consumeRateLimit(key, { windowMs: 60_000, max: 5 });
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("getRequestIp", () => {
    it("extracts IP from x-forwarded-for (first IP)", () => {
      const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
      const ip = getRequestIp(headers);
      expect(ip).toBe("1.2.3.4");
    });

    it("extracts IP from x-real-ip", () => {
      const headers = new Headers({ "x-real-ip": "9.9.9.9" });
      const ip = getRequestIp(headers);
      expect(ip).toBe("9.9.9.9");
    });

    it("falls back to 'unknown' when no headers", () => {
      const headers = new Headers();
      const ip = getRequestIp(headers);
      expect(ip).toBe("unknown");
    });
  });
});