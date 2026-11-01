// foreignPrice is entered directly in USD (the international-student rate,
// which is what the recommendation engine's budget matching compares
// against) — see src/lib/recommendation/hardFilters.ts. Keeping priceUsd
// in sync here means new/edited programs stay matchable without a
// separate backfill step.
export function priceUsdFields(foreignPrice: number | null | undefined) {
  return {
    priceUsd: foreignPrice ?? null,
    priceUsdUpdatedAt: foreignPrice != null ? new Date() : null,
  };
}

type PriceInput = number | string | { toString(): string } | null | undefined;

// Accepts Prisma Decimal, PostgREST strings/numbers and client numbers.
// Returns null for missing, non-numeric or non-positive values.
export function toPriceNumber(v: PriceInput): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v.toString());
  if (Number.isNaN(n) || n <= 0) return null;
  return n;
}

// Any price in any currency means paid; free only when both are unset/zero.
export function isFreePricing(local: PriceInput, foreign: PriceInput): boolean {
  return toPriceNumber(local) === null && toPriceNumber(foreign) === null;
}

// LKR local price if set, otherwise the USD foreign price, otherwise null.
export function chargeFor(
  local: PriceInput,
  foreign: PriceInput,
): { amount: number; currency: "LKR" | "USD" } | null {
  const l = toPriceNumber(local);
  if (l !== null) return { amount: l, currency: "LKR" };
  const f = toPriceNumber(foreign);
  if (f !== null) return { amount: f, currency: "USD" };
  return null;
}
