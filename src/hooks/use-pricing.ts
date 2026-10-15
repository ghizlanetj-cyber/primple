import { useEffect, useMemo } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { buildCatalog, type Catalog } from "@/data/catalog-config";
import { fetchPublicPricing } from "@/lib/pricing.functions";
import { useCart } from "@/store/cart";

export const PRICING_QUERY_KEY = ["catalog-pricing"] as const;

export function pricingQuery(fetcher: () => ReturnType<typeof fetchPublicPricing>) {
  return queryOptions({ queryKey: PRICING_QUERY_KEY, queryFn: () => fetcher(), staleTime: 30_000, refetchOnWindowFocus: true, refetchInterval: 60_000 });
}

export type LivePricing =
  | { status: "loading"; catalog: null }
  | { status: "error"; catalog: null }
  | { status: "ready"; catalog: Catalog };

/**
 * Live catalogue for public pages. While loading or after a read failure the
 * catalogue is null: pages show no price rather than an outdated default.
 */
export function useLivePricing(): LivePricing {
  const fetcher = useServerFn(fetchPublicPricing);
  const q = useQuery(pricingQuery(() => fetcher()));
  return useMemo<LivePricing>(() => {
    // A failed refresh never keeps offering cached prices.
    if (q.isError) return { status: "error", catalog: null };
    if (q.data) {
      try {
        return { status: "ready", catalog: buildCatalog(q.data) };
      } catch {
        return { status: "error", catalog: null };
      }
    }
    return { status: "loading", catalog: null };
  }, [q.data, q.isError]);
}

/** Mounted once in the root: keeps the cart priced with the live catalogue. */
export function PricingSync() {
  const live = useLivePricing();
  const apply = useCart((s) => s.applyCatalog);
  const clear = useCart((s) => s.clearCatalog);
  useEffect(() => {
    if (live.catalog) apply(live.catalog);
    else clear();
  }, [live.catalog, apply, clear]);
  return null;
}
