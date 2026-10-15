import type { SupabaseClient } from "@supabase/supabase-js";

import { buildCatalog, type Catalog, type PricingRow } from "@/data/catalog-config";

/**
 * Live catalogue for server pricing paths. Reads the admin overrides fresh on
 * every call and builds a request-local catalogue. Any read or validation
 * failure throws: checkout and payment never fall back to source defaults
 * when live pricing may exist.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadLiveCatalog(db: SupabaseClient<any>): Promise<Catalog> {
  const { data, error } = await db.from("catalog_pricing").select("kind, slug, config, version");
  if (error) throw new Error("Prices are temporarily unavailable. Please try again in a moment.");
  try {
    return buildCatalog((data ?? []) as PricingRow[]);
  } catch {
    throw new Error("Prices are temporarily unavailable. Please try again in a moment.");
  }
}

export const PRICE_CHANGED =
  "The price of this order has changed since it was placed. Please review your cart and place a new order. Nothing was charged.";
