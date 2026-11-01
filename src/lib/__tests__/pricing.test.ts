import { describe, expect, it } from "vitest";
import {
  chargeFor,
  isFreePricing,
  priceUsdFields,
  toPriceNumber,
} from "../pricing";

describe("priceUsdFields", () => {
  it("mirrors a set foreign price and stamps the update time", () => {
    const r = priceUsdFields(1200);
    expect(r.priceUsd).toBe(1200);
    expect(r.priceUsdUpdatedAt).toBeInstanceOf(Date);
  });

  it("keeps zero as a real price", () => {
    expect(priceUsdFields(0).priceUsd).toBe(0);
  });

  it.each([null, undefined])("clears both fields for %s", (v) => {
    expect(priceUsdFields(v)).toEqual({
      priceUsd: null,
      priceUsdUpdatedAt: null,
    });
  });
});

const dec = (v: string) => ({ toString: () => v });

describe("toPriceNumber", () => {
  it.each([null, undefined, 0, "0", "abc", -5, NaN])("is null for %s", (v) => {
    expect(toPriceNumber(v)).toBeNull();
  });
  it("parses numbers, strings and Decimal-like values", () => {
    expect(toPriceNumber(10)).toBe(10);
    expect(toPriceNumber("12.50")).toBe(12.5);
    expect(toPriceNumber(dec("99.99"))).toBe(99.99);
  });
});

describe("isFreePricing", () => {
  it("is free only when both are unset or zero", () => {
    expect(isFreePricing(null, null)).toBe(true);
    expect(isFreePricing(0, "0")).toBe(true);
    expect(isFreePricing(undefined, undefined)).toBe(true);
  });
  it("is paid when any price is set", () => {
    expect(isFreePricing(1000, null)).toBe(false);
    expect(isFreePricing(null, 50)).toBe(false);
    expect(isFreePricing(dec("1000"), dec("50"))).toBe(false);
    expect(isFreePricing(0, "20")).toBe(false);
  });
});

describe("chargeFor", () => {
  it("returns null when free", () => {
    expect(chargeFor(null, 0)).toBeNull();
  });
  it("uses LKR when local is set", () => {
    expect(chargeFor(1000, null)).toEqual({ amount: 1000, currency: "LKR" });
  });
  it("uses USD for foreign-only", () => {
    expect(chargeFor(null, "50")).toEqual({ amount: 50, currency: "USD" });
    expect(chargeFor(0, dec("75"))).toEqual({ amount: 75, currency: "USD" });
  });
  it("prefers LKR when both are set", () => {
    expect(chargeFor(dec("2000"), 50)).toEqual({ amount: 2000, currency: "LKR" });
  });
});
