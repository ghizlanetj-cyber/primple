import type { Product } from "@/data/products";

/** Only a minimum is enforced; `verifiedMax` is the end of the verified price table. */
export type QuantityLimits = { min: number; verifiedMax: number };

export function productQuantityLimits(product: Pick<Product, "quantities">): QuantityLimits {
  return {
    min: Math.min(...product.quantities),
    verifiedMax: Math.max(...product.quantities),
  };
}

/** Quantities we cannot price from verified data go to a quote request — never an invented price. */
export function isBulkQuoteQuantity(product: Pick<Product, "bulkQuoteAt" | "quantities">, quantity: number) {
  if (product.bulkQuoteAt !== undefined && quantity >= product.bulkQuoteAt) return true;
  return quantity > Math.max(...product.quantities);
}

export function parseQuantity(value: string, limits: Pick<QuantityLimits, "min">): number | null {
  if (!/^[1-9]\d*$/.test(value.trim())) return null;
  const quantity = Number(value.trim());
  if (!Number.isSafeInteger(quantity) || quantity < limits.min) return null;
  return quantity;
}
