import {
  DESIGN_SERVICE_SLUG,
  clampDesignHours,
  designAddonQuote,
  designServiceQuote,
  hasDesignAddon,
} from "@/data/design-service";
import {
  isPackSlug,
  packQuote,
  packSlugFromCartSlug,
  parsePackLines,
} from "@/data/packs";
import { getProduct, priceQuote, type Selection } from "@/data/products";

export type LineQuote = {
  subtotal: number;
  unitPrice: number;
  /** Delivery owed by this line on its own; the cart charges it once. */
  delivery: number;
  productionDays: number;
  deliveryMin: number;
  deliveryMax: number;
  savingsPercent: number;
  area: number | null;
  /** Digital lines never carry delivery. */
  digital: boolean;
};

/** Standard delivery fee in MAD, charged once per order. */
export const DELIVERY_FEE = 30;
/** Express delivery fee in MAD, charged once per order. */
export const EXPRESS_DELIVERY_FEE = 120;

/**
 * The one place that turns (slug, quantity, selection) into money. Catalog
 * products, packs and the design service all go through it, on the client and
 * on the server, so the cart, checkout and payment can never disagree.
 */
export function lineQuote(
  slug: string,
  quantity: number,
  selection: Selection = {},
): LineQuote | null {
  if (slug === DESIGN_SERVICE_SLUG) {
    const hours = clampDesignHours(Number(selection["hours"] ?? quantity));
    const quote = designServiceQuote(hours);
    return {
      subtotal: quote.subtotal,
      unitPrice: quote.unitPrice,
      delivery: 0,
      productionDays: 2,
      deliveryMin: 1,
      deliveryMax: 3,
      savingsPercent: 0,
      area: null,
      digital: true,
    };
  }

  if (isPackSlug(slug)) {
    const lines = parsePackLines(packSlugFromCartSlug(slug), selection["lines"]);
    if (!lines) return null;
    const quote = packQuote(lines);
    return {
      subtotal: quote.packPrice,
      unitPrice: quote.packPrice,
      delivery: selection["delivery"] === "express" ? EXPRESS_DELIVERY_FEE : DELIVERY_FEE,
      productionDays: 5,
      deliveryMin: 3,
      deliveryMax: 6,
      savingsPercent: quote.discountPercent,
      area: null,
      digital: false,
    };
  }

  const product = getProduct(slug);
  if (!product || product.quoteOnly) return null;
  const quote = priceQuote(product, quantity, selection);
  // "Design by Primple" add-on: flat design hours for this product, no delivery.
  const designCents = hasDesignAddon(selection) ? Math.round(designAddonQuote(slug).subtotal * 100) : 0;
  return {
    subtotal: (Math.round(quote.subtotal * 100) + designCents) / 100,
    unitPrice: quote.unitPrice,
    delivery: quote.delivery,
    productionDays: quote.productionDays,
    deliveryMin: quote.deliveryMin,
    deliveryMax: quote.deliveryMax,
    savingsPercent: quote.savingsPercent,
    area: quote.area,
    digital: false,
  };
}

export function isDigitalSlug(slug: string) {
  return slug === DESIGN_SERVICE_SLUG;
}

export type OrderLineInput = {
  slug: string;
  quantity: number;
  selection?: Selection;
};

export type OrderTotals = {
  subtotalCents: number;
  deliveryCents: number;
  totalCents: number;
  /** Longest production time across the order. */
  productionDays: number;
  /** Longest delivery window across the order. */
  deliveryMax: number;
  quotes: LineQuote[];
};

/**
 * The one aggregation used by the cart, the order creation and the payment
 * recompute, so the browser total and the charged amount can never diverge.
 * Delivery is charged once per order: the highest fee among shipped lines.
 */
export function orderTotals(lines: OrderLineInput[]): OrderTotals | null {
  let subtotalCents = 0;
  let deliveryCents = 0;
  let productionDays = 0;
  let deliveryMax = 0;
  const quotes: LineQuote[] = [];

  for (const line of lines) {
    const quantity = Number(line.quantity);
    const quote = lineQuote(
      line.slug,
      Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      line.selection ?? {},
    );
    if (!quote) return null;
    quotes.push(quote);
    subtotalCents += Math.round(quote.subtotal * 100);
    deliveryCents = Math.max(deliveryCents, Math.round(quote.delivery * 100));
    productionDays = Math.max(productionDays, quote.productionDays);
    deliveryMax = Math.max(deliveryMax, quote.deliveryMax);
  }

  return {
    subtotalCents,
    deliveryCents,
    totalCents: subtotalCents + deliveryCents,
    productionDays,
    deliveryMax,
    quotes,
  };
}
