import { describe, expect, it } from "vitest";
import { priceUsdFields } from "../pricing";

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
