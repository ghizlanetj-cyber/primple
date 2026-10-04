import { fromCents, toCents } from "@/lib/format";
import { defaultSelection, getProduct, priceQuote, type Selection } from "@/data/products";

/** Every pack is sold at 20% off the sum of the individual items it contains. */
export const PACK_DISCOUNT = 0.2;
export const PACK_SLUG_PREFIX = "pack-";
const PACK_IMAGE_VERSION = "20260921";

function packImage(slug: string) {
  return `/packs/${slug}.webp?v=${PACK_IMAGE_VERSION}`;
}

/**
 * Items that are not sold on their own in the catalog yet. Prices are per unit,
 * in MAD, and live here so packs and the server recompute share one source.
 */
export const internalPackItems: Record<string, { label: string; unitPrice: number }> = {
  letterhead: { label: "Letterhead A4", unitPrice: 1.6 },
  envelopes: { label: "Printed envelopes", unitPrice: 2.2 },
  folders: { label: "Presentation folders", unitPrice: 14 },
  notebooks: { label: "Branded notebooks", unitPrice: 36 },
  "loyalty-cards": { label: "Loyalty cards", unitPrice: 1.3 },
  "appointment-cards": { label: "Appointment cards", unitPrice: 1.1 },
  "gift-vouchers": { label: "Gift vouchers", unitPrice: 2.6 },
  "thank-you-cards": { label: "Thank-you cards", unitPrice: 2.2 },
  "brand-cards": { label: "Brand story cards", unitPrice: 1.6 },
  inserts: { label: "Packaging inserts", unitPrice: 1.4 },
  "packaging-sleeves": { label: "Packaging sleeves", unitPrice: 3.2 },
  "packaging-seals": { label: "Packaging seals", unitPrice: 0.8 },
  "packing-tape": { label: "Branded packing tape", unitPrice: 45 },
  "price-tags": { label: "Price tags", unitPrice: 0.9 },
  "price-list": { label: "Price list board", unitPrice: 9 },
  "table-cards": { label: "Table cards", unitPrice: 6 },
  invitations: { label: "Invitations", unitPrice: 3.2 },
  "directional-signs": { label: "Directional signs", unitPrice: 95 },
  "site-boards": { label: "Site boards", unitPrice: 180 },
  "vehicle-stickers": { label: "Vehicle stickers", unitPrice: 120 },
  "quote-folders": { label: "Quotation folders", unitPrice: 14 },
  "window-stickers": { label: "Window stickers", unitPrice: 25 },
  "bag-stickers": { label: "Shopping bag stickers", unitPrice: 0.7 },
};

export type PackLine =
  | { kind: "product"; ref: string; label: string; quantity: number; selection?: Selection }
  | { kind: "internal"; ref: string; label: string; quantity: number };

export type Pack = {
  slug: string;
  name: string;
  audience: string;
  description: string;
  image: string;
  imageAlt: string;
  lines: PackLine[];
};

function product(ref: string, label: string, quantity: number, selection?: Selection): PackLine {
  return selection
    ? { kind: "product", ref, label, quantity, selection }
    : { kind: "product", ref, label, quantity };
}

function internal(ref: string, quantity: number): PackLine {
  return { kind: "internal", ref, label: internalPackItems[ref]?.label ?? ref, quantity };
}

export const packs: Pack[] = [
  {
    slug: "launch",
    name: "Primple Launch Pack",
    audience: "New businesses and startups",
    description: "Everything a new company needs on day one, printed and ready to hand out.",
    image: packImage("launch"),
    imageAlt: "Flat lay of business cards, flyers, stickers and a roll-up banner",
    lines: [
      product("business-cards", "Business cards", 500),
      product("flyers", "Flyers", 1000),
      product("stickers", "Stickers", 500),
      internal("letterhead", 250),
      product("roll-up-banners", "Roll-up banner", 1),
    ],
  },
  {
    slug: "beauty",
    name: "Primple Beauty Pack",
    audience: "Beauty centres, spas and nail bars",
    description: "Loyalty, appointments and service menus in one coordinated set.",
    image: packImage("beauty"),
    imageAlt: "Flat lay of loyalty cards, appointment cards, a service menu and gift vouchers",
    lines: [
      internal("loyalty-cards", 500),
      internal("appointment-cards", 500),
      product("menus", "Service menus", 50),
      product("flyers", "Flyers", 1000),
      internal("gift-vouchers", 250),
      product("stickers", "Stickers", 500),
    ],
  },
  {
    slug: "salon",
    name: "Primple Salon Pack",
    audience: "Hair salons and barbershops",
    description: "Front-desk essentials for a salon that books out.",
    image: packImage("salon"),
    imageAlt: "Flat lay of loyalty cards, a price list, flyers and window stickers",
    lines: [
      internal("loyalty-cards", 500),
      internal("appointment-cards", 500),
      internal("price-list", 5),
      product("flyers", "Flyers", 1000),
      product("business-cards", "Business cards", 500),
      internal("window-stickers", 4),
    ],
  },
  {
    slug: "ecommerce",
    name: "Primple E-commerce Pack",
    audience: "Online shops",
    description: "Unboxing that looks like your brand, from the label to the tape.",
    image: packImage("ecommerce"),
    imageAlt: "Flat lay of thank-you cards, product labels, inserts and branded packing tape",
    lines: [
      internal("thank-you-cards", 500),
      product("stickers", "Logo stickers", 500),
      product("labels", "Product labels", 1000),
      internal("packaging-seals", 500),
      internal("inserts", 500),
      internal("packing-tape", 6),
    ],
  },
  {
    slug: "brand",
    name: "Primple Brand Pack",
    audience: "New product brands",
    description: "Labels, sleeves and cards that make a first product run look established.",
    image: packImage("brand"),
    imageAlt: "Flat lay of product labels, packaging sleeves, brand cards and launch flyers",
    lines: [
      product("labels", "Product labels", 1000),
      product("stickers", "Stickers", 500),
      internal("brand-cards", 500),
      internal("packaging-sleeves", 250),
      internal("thank-you-cards", 250),
      product("flyers", "Launch flyers", 1000),
    ],
  },
  {
    slug: "btp",
    name: "Primple BTP Pack",
    audience: "Construction and contractors",
    description: "Site-ready printing that holds up outdoors and on the road.",
    image: packImage("btp"),
    imageAlt: "Flat lay of business cards, quotation folders, a site board and vehicle stickers",
    lines: [
      product("business-cards", "Business cards", 500),
      internal("quote-folders", 100),
      internal("site-boards", 2),
      product("large-format", "PVC banners", 2, { material: "pvc", finishing: "hem", width: "3", height: "1.5" }),
      internal("vehicle-stickers", 4),
      product("flyers", "Flyers", 1000),
    ],
  },
  {
    slug: "restaurant",
    name: "Primple Restaurant Pack",
    audience: "Restaurants and cafés",
    description: "From the table to the delivery bag, everything carries your name.",
    image: packImage("restaurant"),
    imageAlt: "Flat lay of menus, table cards, takeaway stickers and loyalty cards",
    lines: [
      product("menus", "Menus", 50),
      product("stickers", "Takeaway stickers", 1000),
      internal("table-cards", 30),
      product("flyers", "Flyers", 1000),
      internal("loyalty-cards", 500),
      product("labels", "Delivery packaging labels", 1000),
    ],
  },
  {
    slug: "event",
    name: "Primple Event Pack",
    audience: "Openings, launches and events",
    description: "Invite, sign and guide your guests with one consistent set.",
    image: packImage("event"),
    imageAlt: "Flat lay of invitations, flyers, posters and a roll-up banner",
    lines: [
      internal("invitations", 250),
      product("flyers", "Flyers", 1000),
      product("roll-up-banners", "Roll-up banner", 2),
      product("posters", "Posters", 25),
      internal("directional-signs", 4),
      product("stickers", "Stickers", 500),
    ],
  },
  {
    slug: "office",
    name: "Primple Office Pack",
    audience: "Companies and agencies",
    description: "The full stationery set for meetings, proposals and onboarding.",
    image: packImage("office"),
    imageAlt: "Flat lay of letterhead, envelopes, folders and branded notebooks",
    lines: [
      product("business-cards", "Business cards", 1000),
      internal("letterhead", 500),
      internal("envelopes", 250),
      internal("folders", 100),
      internal("notebooks", 50),
      product("brochures", "Presentation brochures", 100),
    ],
  },
  {
    slug: "retail",
    name: "Primple Retail Pack",
    audience: "Shops and boutiques",
    description: "Shelf, bag and counter printing for a store that sells.",
    image: packImage("retail"),
    imageAlt: "Flat lay of price tags, bag stickers, loyalty cards and window stickers",
    lines: [
      internal("price-tags", 1000),
      internal("bag-stickers", 500),
      internal("loyalty-cards", 500),
      product("flyers", "Flyers", 1000),
      internal("window-stickers", 4),
      internal("thank-you-cards", 250),
    ],
  },
];

export function getPack(slug: string) {
  return packs.find((p) => p.slug === slug);
}

export function packCartSlug(pack: Pack | string) {
  return `${PACK_SLUG_PREFIX}${typeof pack === "string" ? pack : pack.slug}`;
}

export function isPackSlug(slug: string) {
  return slug.startsWith(PACK_SLUG_PREFIX);
}

export function packSlugFromCartSlug(slug: string) {
  return slug.slice(PACK_SLUG_PREFIX.length);
}

function clampQuantity(quantity: number) {
  const n = Math.floor(Number(quantity));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(99999, n);
}

/**
 * Smallest quantity a pack line accepts: the catalogue minimum for products,
 * the pack's own quantity for items not sold separately. Prevents a single
 * unit from getting a bulk-production price.
 */
export function packLineMinimum(packSlug: string, ref: string): number {
  const base = getPack(packSlug)?.lines.find((l) => l.ref === ref);
  if (!base) return 1;
  if (base.kind === "product") {
    const catalogProduct = getProduct(base.ref);
    return catalogProduct ? Math.min(...catalogProduct.quantities) : base.quantity;
  }
  return base.quantity;
}

/** Price of one pack line at the individual (undiscounted) catalog price. */
export function packLineSubtotal(line: PackLine): number {
  const quantity = clampQuantity(line.quantity);
  if (line.kind === "internal") {
    const item = internalPackItems[line.ref];
    if (!item) return 0;
    return fromCents(toCents(item.unitPrice) * quantity);
  }
  const catalogProduct = getProduct(line.ref);
  if (!catalogProduct) return 0;
  const selection = { ...defaultSelection(catalogProduct), ...(line.selection ?? {}) };
  return priceQuote(catalogProduct, quantity, selection).subtotal;
}

export type PackQuote = {
  lines: { line: PackLine; subtotal: number }[];
  /** Sum of the individual prices, before the pack discount. */
  normalPrice: number;
  /** What the customer pays: 80% of the normal price. */
  packPrice: number;
  savings: number;
  discountPercent: number;
};

/** The single pricing function every pack surface uses. */
export function packQuote(lines: PackLine[]): PackQuote {
  const priced = lines.map((line) => ({ line, subtotal: packLineSubtotal(line) }));
  const normalCents = priced.reduce((sum, l) => sum + toCents(l.subtotal), 0);
  const packCents = Math.round(normalCents * (1 - PACK_DISCOUNT));
  return {
    lines: priced,
    normalPrice: fromCents(normalCents),
    packPrice: fromCents(packCents),
    savings: fromCents(normalCents - packCents),
    discountPercent: Math.round(PACK_DISCOUNT * 100),
  };
}

/**
 * Rebuilds pack lines from a cart/order selection so the server can re-price a
 * pack without trusting any amount sent by the browser.
 */
export function parsePackLines(packSlug: string, raw: string | undefined): PackLine[] | null {
  const pack = getPack(packSlug);
  if (!pack) return null;
  if (!raw) return pack.lines;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const quantities = new Map<string, number>();
  for (const entry of parsed) {
    const ref = (entry as { ref?: unknown })?.ref;
    const quantity = Number((entry as { quantity?: unknown })?.quantity);
    if (typeof ref !== "string" || !pack.lines.some((l) => l.ref === ref)) return null;
    // Invalid or below-minimum quantities are rejected, never clamped.
    if (!Number.isInteger(quantity) || quantity < packLineMinimum(packSlug, ref) || quantity > 99999) return null;
    quantities.set(ref, quantity);
  }
  // Only quantities are customer-editable; refs and prices stay server-defined.
  return pack.lines.map((line) => ({ ...line, quantity: quantities.get(line.ref) ?? line.quantity }));
}

export function serializePackLines(lines: PackLine[]) {
  return JSON.stringify(lines.map((line) => ({ ref: line.ref, quantity: line.quantity })));
}
