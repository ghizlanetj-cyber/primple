import { create } from "zustand";
import { persist } from "zustand/middleware";

import { getProduct, priceQuote } from "@/data/products";
import { fromCents, toCents } from "@/lib/format";


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
  printer?: string;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "id">) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
};

/** Always re-price an item from the live catalog so the cart can never show a stale price. */
function reprice(item: CartItem, quantity = item.quantity): CartItem {
  const product = getProduct(item.slug);
  if (!product) return { ...item, quantity, subtotal: item.unitPrice * quantity };
  const quote = priceQuote(product, quantity, item.selection);
  return {
    ...item,
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
      add: (item) =>
        set((state) => ({
          items: [...state.items, reprice({ ...item, id: `${item.slug}-${Date.now()}` })],
        })),
      remove: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? reprice(i, quantity) : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "primpel-cart",
      onRehydrateStorage: () => (state) => {
        if (state) state.items = state.items.map((i) => reprice(i));
      },
    },
  ),
);


/** Fixed standard delivery fee in MAD, charged once per order. */
export const DELIVERY_FEE = 30;
/** Fixed express delivery fee in MAD, charged once per order. */
export const EXPRESS_DELIVERY_FEE = 120;

export function cartTotals(items: CartItem[]) {
  // Summed on integer centimes so total always equals subtotal + delivery.
  const subtotalCents = items.reduce((sum, i) => sum + toCents(i.subtotal), 0);
  const hasExpress = items.some((item) => item.selection["delivery"] === "express");
  const deliveryCents = toCents(
    items.length === 0 ? 0 : hasExpress ? EXPRESS_DELIVERY_FEE : DELIVERY_FEE,
  );
  return {
    subtotal: fromCents(subtotalCents),
    delivery: fromCents(deliveryCents),
    total: fromCents(subtotalCents + deliveryCents),
  };
}
