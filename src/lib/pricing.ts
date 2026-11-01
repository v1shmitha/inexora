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
