import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

import type { PricingRow } from "@/data/catalog-config";

/** Public, read-only: live price overrides (kind, slug, config, version only). */
export const fetchPublicPricing = createServerFn({ method: "GET" }).handler(async (): Promise<PricingRow[]> => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Pricing unavailable");
  const db = createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
  const { data, error } = await db.from("catalog_pricing").select("kind, slug, config, version");
  if (error) throw new Error("Pricing unavailable");
  return (data ?? []) as PricingRow[];
});
