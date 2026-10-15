import {
  getProduct as getSourceProduct,
  products as sourceProducts,
  type Product,
  type QuantityBreak,
} from "@/data/products";
import {
  PACK_DISCOUNT,
  getPack as getSourcePack,
  internalPackItems,
  packs as sourcePacks,
  type CatalogLike,
  type Pack,
} from "@/data/packs";
import { fromCents, toCents } from "@/lib/format";

/**
 * Admin pricing overrides. The source catalogue in src/data stays the default:
 * a missing row means "use the source value". Overrides are applied by building
 * new objects, never by mutating the shared module arrays, so concurrent server
 * requests cannot leak prices into each other.
 */
export type ProductPricing = {
  anchorCents: number;
  anchorQuantity: number;
  /** Sorted, unique presets. The first is the minimum, the last ends the automatic price range. */
  quantities: number[];
  /** Quote request from this quantity, even inside the preset range. */
  bulkQuoteAt: number | null;
  productionDays: number;
  /** Quantity discount tiers; null = automatic volume curve. */
  breaks: QuantityBreak[] | null;
  optionFactors: Record<string, Record<string, number>>;
};
export type PackPricing = { discountPercent: number; lines: Record<string, number> };
export type InternalPricing = { unitPriceCents: number };
export type PricingKind = "product" | "pack" | "internal";
export type PricingRow = { kind: string; slug: string; config: unknown; version: number };

export type Catalog = CatalogLike & {
  products: Product[];
  packs: Pack[];
  versions: Record<string, number>;
  /** Changes whenever any override changes. */
  key: string;
};

const MAX_QTY = 10_000_000;
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= min && v <= max;
const isNum = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > min && v <= max;

function bad(message: string): never {
  throw new Error(message);
}

export function defaultProductPricing(p: Product): ProductPricing {
  const optionFactors: Record<string, Record<string, number>> = {};
  for (const g of p.options) {
    if (g.id === "delivery") continue;
    optionFactors[g.id] = Object.fromEntries(g.choices.map((c) => [c.id, c.factor ?? 1]));
  }
  return {
    anchorCents: toCents(p.anchor.subtotal),
    anchorQuantity: p.anchor.quantity,
    quantities: [...p.quantities],
    bulkQuoteAt: p.bulkQuoteAt ?? null,
    productionDays: p.baseProductionDays,
    breaks: p.quantityBreaks ? p.quantityBreaks.map((b) => ({ ...b })) : null,
    optionFactors,
  };
}

/** Strict validation; error messages are shown to admins in French. */
export function validateProductPricing(raw: unknown, p: Product): ProductPricing {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (!isInt(o["anchorCents"], 1, 1_000_000_000)) bad("Prix de référence invalide.");
  if (!isInt(o["anchorQuantity"], 1, MAX_QTY)) bad("Quantité de référence invalide.");
  const q = o["quantities"];
  if (!Array.isArray(q) || q.length < 1 || q.length > 20 || !q.every((n) => isInt(n, 1, MAX_QTY)))
    bad("Préréglages de quantité invalides (nombres entiers, 20 au maximum).");
  for (let i = 1; i < q.length; i += 1) if (q[i] <= q[i - 1]) bad("Les préréglages doivent être croissants et uniques.");
  const quantities = q as number[];
  const min = quantities[0]!;
  const max = quantities[quantities.length - 1]!;
  if ((o["anchorQuantity"] as number) > max) bad("La quantité de référence doit rester dans la plage de prix automatique.");
  const bulk = o["bulkQuoteAt"] ?? null;
  if (bulk !== null && !isInt(bulk, min + 1, MAX_QTY)) bad("Le seuil de devis doit être un entier supérieur au minimum.");
  if (!isInt(o["productionDays"], 1, 60)) bad("Délai de production invalide (1 à 60 jours).");
  let breaks: QuantityBreak[] | null = null;
  if (o["breaks"] != null) {
    const b = o["breaks"];
    if (!Array.isArray(b) || b.length < 2 || b.length > 20) bad("Remises : entre 2 et 20 paliers.");
    breaks = b.map((t) => {
      const tier = (t ?? {}) as Record<string, unknown>;
      if (!isInt(tier["quantity"], 1, MAX_QTY) || !isNum(tier["factor"], 0, 1.5)) bad("Palier de remise invalide.");
      return { quantity: tier["quantity"] as number, factor: Math.round((tier["factor"] as number) * 10000) / 10000 };
    });
    for (let i = 1; i < breaks.length; i += 1) {
      if (breaks[i]!.quantity <= breaks[i - 1]!.quantity) bad("Les paliers de remise doivent être croissants et uniques.");
      if (breaks[i]!.factor > breaks[i - 1]!.factor) bad("Le prix unitaire ne peut pas augmenter avec la quantité.");
    }
  }
  const rawFactors = (o["optionFactors"] ?? {}) as Record<string, unknown>;
  if (typeof rawFactors !== "object" || Array.isArray(rawFactors)) bad("Multiplicateurs invalides.");
  const optionFactors = defaultProductPricing(p).optionFactors;
  for (const [gid, choices] of Object.entries(rawFactors)) {
    const group = optionFactors[gid];
    if (!group || !choices || typeof choices !== "object") bad("Option inconnue.");
    for (const [cid, f] of Object.entries(choices as Record<string, unknown>)) {
      if (!(cid in group)) bad("Choix d'option inconnu.");
      if (!isNum(f, 0, 10)) bad("Multiplicateur invalide (supérieur à 0, 10 au maximum).");
      group[cid] = Math.round((f as number) * 10000) / 10000;
    }
  }
  return {
    anchorCents: o["anchorCents"] as number,
    anchorQuantity: o["anchorQuantity"] as number,
    quantities,
    bulkQuoteAt: bulk as number | null,
    productionDays: o["productionDays"] as number,
    breaks,
    optionFactors,
  };
}

export function applyProductPricing(p: Product, o: ProductPricing): Product {
  const options = p.options.map((g) =>
    g.id === "delivery"
      ? g
      : { ...g, choices: g.choices.map((c) => ({ ...c, factor: o.optionFactors[g.id]?.[c.id] ?? c.factor ?? 1 })) },
  );
  const next: Product = {
    ...p,
    anchor: { ...p.anchor, quantity: o.anchorQuantity, subtotal: fromCents(o.anchorCents) },
    quantities: [...o.quantities],
    baseProductionDays: o.productionDays,
    options,
  };
  if (o.breaks) next.quantityBreaks = o.breaks.map((b) => ({ ...b }));
  else delete next.quantityBreaks;
  if (o.bulkQuoteAt !== null) next.bulkQuoteAt = o.bulkQuoteAt;
  else delete next.bulkQuoteAt;
  return next;
}

export function defaultPackPricing(pack: Pack): PackPricing {
  return {
    discountPercent: Math.round(PACK_DISCOUNT * 10000) / 100,
    lines: Object.fromEntries(pack.lines.map((l) => [l.ref, l.quantity])),
  };
}

export function validatePackPricing(raw: unknown, pack: Pack, productOf: (slug: string) => Product | undefined): PackPricing {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = o["discountPercent"];
  if (typeof d !== "number" || !Number.isFinite(d) || d < 0 || d > 90) bad("Remise du pack invalide (0 à 90 %).");
  const rawLines = (o["lines"] ?? {}) as Record<string, unknown>;
  const lines = defaultPackPricing(pack).lines;
  for (const [ref, qty] of Object.entries(rawLines)) {
    const line = pack.lines.find((l) => l.ref === ref);
    if (!line) bad("Ligne de pack inconnue.");
    if (!isInt(qty, 1, MAX_QTY)) bad("Quantité de pack invalide.");
    if (line.kind === "product") {
      const prod = productOf(line.ref);
      if (!prod) bad("Produit du pack introuvable.");
      if (qty < Math.min(...prod.quantities)) bad(`${line.label} : sous le minimum du produit.`);
      if (qty > Math.max(...prod.quantities) || (prod.bulkQuoteAt !== undefined && qty >= prod.bulkQuoteAt))
        bad(`${line.label} : au-delà de la plage de prix automatique.`);
    }
    lines[ref] = qty;
  }
  return { discountPercent: Math.round(d * 100) / 100, lines };
}

export function validateInternalPricing(raw: unknown): InternalPricing {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (!isInt(o["unitPriceCents"], 1, 100_000_000)) bad("Prix unitaire invalide.");
  return { unitPriceCents: o["unitPriceCents"] as number };
}

/** Builds an immutable catalogue view. Throws when a stored override is invalid (fail closed). */
export function buildCatalog(rows: PricingRow[] = []): Catalog {
  const versions: Record<string, number> = {};
  const productRows = new Map<string, unknown>();
  const packRows = new Map<string, unknown>();
  const internalRows = new Map<string, unknown>();
  for (const r of rows) {
    versions[`${r.kind}:${r.slug}`] = r.version;
    if (r.kind === "product") productRows.set(r.slug, r.config);
    else if (r.kind === "pack") packRows.set(r.slug, r.config);
    else if (r.kind === "internal") internalRows.set(r.slug, r.config);
  }
  const products = sourceProducts.map((p) =>
    productRows.has(p.slug) ? applyProductPricing(p, validateProductPricing(productRows.get(p.slug), p)) : p,
  );
  const productMap = new Map(products.map((p) => [p.slug, p]));
  const getProduct = (slug: string) => productMap.get(slug);
  const discounts = new Map<string, number>();
  const packs = sourcePacks.map((pack) => {
    if (!packRows.has(pack.slug)) return pack;
    const cfg = validatePackPricing(packRows.get(pack.slug), pack, getProduct);
    discounts.set(pack.slug, cfg.discountPercent / 100);
    return { ...pack, lines: pack.lines.map((l) => ({ ...l, quantity: cfg.lines[l.ref] ?? l.quantity })) };
  });
  const packMap = new Map(packs.map((p) => [p.slug, p]));
  const internal = new Map<string, number>();
  for (const [ref, cfg] of internalRows) {
    if (!internalPackItems[ref]) continue;
    internal.set(ref, fromCents(validateInternalPricing(cfg).unitPriceCents));
  }
  const key = Object.entries(versions).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}@${v}`).join("|");
  return {
    products,
    packs,
    versions,
    key: key || "source",
    getProduct,
    getPack: (slug) => packMap.get(slug),
    internalUnitPrice: (ref) => internal.get(ref) ?? internalPackItems[ref]?.unitPrice,
    packDiscount: (slug) => discounts.get(slug) ?? PACK_DISCOUNT,
  };
}

export const SOURCE_CATALOG: Catalog = buildCatalog([]);

export function sourceProduct(slug: string) {
  return getSourceProduct(slug);
}
export function sourcePack(slug: string) {
  return getSourcePack(slug);
}
