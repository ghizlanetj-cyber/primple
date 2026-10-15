import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  DELIVERY_FEE as STANDARD_DELIVERY_FEE,
  EXPRESS_DELIVERY_FEE as EXPRESS_FEE,
  isDigitalSlug,
  lineQuote,
} from "@/data/pricing";
import { fromCents, toCents } from "@/lib/format";
import type { Catalog } from "@/data/catalog-config";


export type CartItem = {
  id: string;
  slug: string;
  name: string;
  quantity: number;
  selection: Record<string, string>;
  labels: { group: string; value: string }[];
  unitPrice: number;
  subtotal: number;
  delivery: number;
  productionDays: number;
  deliveryMin: number;
  deliveryMax: number;
  artwork?: string;
  artworkPath?: string;
  artworkGuestToken?: string;
  printer?: string;
  /** Live catalogue cannot price this line (quote range, retired option): no amount is shown or charged. */
  unpriced?: boolean;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "id">) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  /** True when retired items were dropped from a saved cart; checkout waits for a cart review. */
  removedNotice: boolean;
  acknowledgeRemoved: () => void;
  /** Live prices loaded. Adding and checkout wait for it; no default price is ever used meanwhile. */
  pricingReady: boolean;
  /** Key of the live price set the cart is priced with. */
  pricingKey: string | null;
  /** True when a saved item's price changed; checkout waits for a cart review. */
  priceNotice: boolean;
  acknowledgePrice: () => void;
  applyCatalog: (catalog: Catalog) => void;
  /** Live prices unavailable: hide amounts and block checkout, keep items. */
  clearCatalog: () => void;
};

/** Browser-only: the live catalogue the cart prices with (set by PricingSync). */
let activeCatalog: Catalog | null = null;
export function getActiveCatalog() {
  return activeCatalog;
}

/** Products no longer offered; saved carts containing them are cleaned on load. */
const RETIRED_SLUGS = new Set(["packaging", "corporate-gifts"]);

/** Always re-price an item from the live catalog so the cart can never show a stale price. */
function reprice(item: CartItem, quantity = item.quantity, catalog: Catalog | null = activeCatalog): CartItem {
  if (!catalog) return { ...item, quantity };
  const quote = lineQuote(item.slug, quantity, item.selection, catalog);
  if (!quote) return { ...item, quantity, unpriced: true };
  return {
    ...item,
    unpriced: false,
    quantity,
    unitPrice: quote.unitPrice,
    subtotal: quote.subtotal,
    delivery: quote.delivery,
    productionDays: quote.productionDays,
    deliveryMin: quote.deliveryMin,
    deliveryMax: quote.deliveryMax,
  };
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      removedNotice: false,
      acknowledgeRemoved: () => set({ removedNotice: false }),
      pricingReady: false,
      pricingKey: null,
      priceNotice: false,
      acknowledgePrice: () => set({ priceNotice: false }),
      clearCatalog: () => {
        activeCatalog = null;
        set({ pricingReady: false, pricingKey: null });
      },
      applyCatalog: (catalog) => {
        activeCatalog = catalog;
        set((state) => {
          const next = state.items.map((i) => reprice(i, i.quantity, catalog));
          const changed = next.some(
            (n, idx) => toCents(n.subtotal) !== toCents(state.items[idx]!.subtotal) || Boolean(n.unpriced) !== Boolean(state.items[idx]!.unpriced),
          );
          return { items: next, pricingReady: true, pricingKey: catalog.key, priceNotice: state.priceNotice || changed };
        });
      },
      add: (item) => {
        // Never price a new item without the live catalogue.
        if (!activeCatalog) return;
        set((state) => ({
          items: [...state.items, reprice({ ...item, id: `${item.slug}-${Date.now()}` })],
        }));
      },
      remove: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? reprice(i, quantity) : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "primpel-cart",
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const kept = state.items.filter((i) => !RETIRED_SLUGS.has(i.slug));
        if (kept.length !== state.items.length) useCart.setState({ removedNotice: true });
        // Repriced once live prices load (applyCatalog), never with source defaults.
        state.items = activeCatalog ? kept.map((i) => reprice(i)) : kept;
      },
    },
  ),
);


/** Fixed standard delivery fee in MAD, charged once per order. */
export const DELIVERY_FEE = STANDARD_DELIVERY_FEE;
/** Fixed express delivery fee in MAD, charged once per order. */
export const EXPRESS_DELIVERY_FEE = EXPRESS_FEE;

/** True when any line needs a quote or review: totals are hidden and checkout is blocked. */
export function hasUnpriced(items: CartItem[]) {
  return items.some((i) => i.unpriced);
}

export function cartTotals(items: CartItem[]) {
  // Summed on integer centimes so total always equals subtotal + delivery.
  const subtotalCents = items.reduce((sum, i) => sum + toCents(i.subtotal), 0);
  // Digital services (design hours) never trigger a delivery fee.
  const shipped = items.filter((item) => !isDigitalSlug(item.slug));
  const hasExpress = shipped.some((item) => item.selection["delivery"] === "express");
  const deliveryCents = toCents(
    shipped.length === 0 ? 0 : hasExpress ? EXPRESS_DELIVERY_FEE : DELIVERY_FEE,
  );
  return {
    subtotal: fromCents(subtotalCents),
    delivery: fromCents(deliveryCents),
    total: fromCents(subtotalCents + deliveryCents),
  };
}
