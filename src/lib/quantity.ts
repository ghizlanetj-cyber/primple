import type { Product } from "@/data/products";

export type QuantityLimits = { min: number; max: number };

export function productQuantityLimits(product: Pick<Product, "quantities">): QuantityLimits {
  return {
    min: Math.min(...product.quantities),
    max: Math.max(...product.quantities),
  };
}

export function parseQuantity(value: string, limits: QuantityLimits): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const quantity = Number(value);
  if (!Number.isSafeInteger(quantity) || quantity < limits.min || quantity > limits.max) return null;
  return quantity;
}