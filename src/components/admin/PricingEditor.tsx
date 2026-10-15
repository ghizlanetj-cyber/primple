import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  applyProductPricing,
  buildCatalog,
  defaultPackPricing,
  defaultProductPricing,
  isOverride,
  validateInternalPricing,
  validatePackPricing,
  validateProductPricing,
  type Catalog,
  type PricingRow,
  type ProductPricing,
} from "@/data/catalog-config";
import { internalPackItems, packQuote, type Pack } from "@/data/packs";
import { defaultSelection, priceQuote, type Product } from "@/data/products";
import { productPhrases } from "@/i18n/product-translations";
import { phrases } from "@/i18n/translations";
import { adminSetPricing } from "@/lib/admin.functions";
import { errText, mad } from "./shared";

export const fr = (s: string) => productPhrases[s]?.fr ?? phrases[s]?.fr ?? s;

export type EditTarget =
  | { kind: "product"; product: Product }
  | { kind: "pack"; pack: Pack }
  | { kind: "internal"; ref: string };

/** Accepts "12,5" or "12.5"; returns centimes or null. */
export function madToCents(v: string): number | null {
  const n = Number(v.trim().replace(",", "."));
  if (!v.trim() || !Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}
const intOf = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v.trim()) : NaN);
export function parseList(v: string): number[] {
  return v
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map(intOf);
}
const centsText = (c: number) => (c / 100).toFixed(2).replace(/\.00$/, "");

function useSave(onDone: () => void) {
  const qc = useQueryClient();
  const save = useServerFn(adminSetPricing);
  return useMutation({
    mutationFn: (v: { kind: string; slug: string; version: number; config: unknown }) => save({ data: v }),
    onSuccess: (_r, v) => {
      toast.success(v.config === null ? "Prix du site rétablis" : "Prix enregistrés");
      void qc.invalidateQueries({ queryKey: ["admin", "pricing"] });
      void qc.invalidateQueries({ queryKey: ["catalog-pricing"] });
      onDone();
    },
    onError: (e) => toast.error(errText(e)),
  });
}

export function PricingDialog({
  target,
  rows,
  catalog,
  onClose,
}: {
  target: EditTarget | null;
  rows: PricingRow[];
  catalog: Catalog;
  onClose: () => void;
}) {
  if (!target) return null;
  const kind = target.kind;
  const slug = kind === "product" ? target.product.slug : kind === "pack" ? target.pack.slug : target.ref;
  const row = rows.find((r) => r.kind === kind && r.slug === slug) ?? null;
  const title =
    kind === "product" ? fr(target.product.name) : kind === "pack" ? fr(target.pack.name) : fr(internalPackItems[slug]?.label ?? slug);
  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Prix : {title}</DialogTitle>
          <DialogDescription>
            {row && isOverride(row.config) ? `Prix modifiés (version ${row.version}).` : "Prix du site par défaut."} Les commandes déjà payées gardent leur montant.
            Un panier ou une commande non payée au mauvais prix doit être revu par le client avant paiement.
          </DialogDescription>
        </DialogHeader>
        {kind === "product" ? (
          <ProductForm key={`${slug}:${row?.version ?? 0}`} product={target.product} row={row} onClose={onClose} />
        ) : kind === "pack" ? (
          <PackForm key={`${slug}:${row?.version ?? 0}`} pack={target.pack} row={row} rows={rows} onClose={onClose} />
        ) : (
          <InternalForm key={`${slug}:${row?.version ?? 0}`} slug={slug} row={row} onClose={onClose} />
        )}
        <p className="text-xs text-muted-foreground">Catalogue actuel : {catalog.key === "source" ? "prix du site" : "avec modifications"}.</p>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function Actions({
  pending,
  canSave,
  hasOverride,
  onSave,
  onReset,
  onClose,
}: {
  pending: boolean;
  canSave: boolean;
  hasOverride: boolean;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
      {hasOverride ? (
        <Button variant="outline" disabled={pending} onClick={onReset}>
          Revenir aux prix du site
        </Button>
      ) : null}
      <Button variant="ghost" onClick={onClose} disabled={pending}>
        Annuler
      </Button>
      <Button onClick={onSave} disabled={pending || !canSave}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </div>
  );
}

function ProductForm({ product, row, onClose }: { product: Product; row: PricingRow | null; onClose: () => void }) {
  const start: ProductPricing = row && isOverride(row.config) ? validateProductPricing(row.config, product) : defaultProductPricing(product);
  const [anchor, setAnchor] = useState(centsText(start.anchorCents));
  const [anchorQty, setAnchorQty] = useState(String(start.anchorQuantity));
  const [presets, setPresets] = useState(start.quantities.join(", "));
  const [bulk, setBulk] = useState(start.bulkQuoteAt === null ? "" : String(start.bulkQuoteAt));
  const [days, setDays] = useState(String(start.productionDays));
  const [auto, setAuto] = useState(start.breaks === null);
  const [tiers, setTiers] = useState(
    (start.breaks ?? [
      { quantity: start.quantities[0]!, factor: 1 },
      { quantity: start.quantities[start.quantities.length - 1]!, factor: 1 },
    ]).map((b) => ({ quantity: String(b.quantity), discount: String(Math.round((1 - b.factor) * 10000) / 100) })),
  );
  const [factors, setFactors] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(
      Object.entries(start.optionFactors).map(([g, c]) => [g, Object.fromEntries(Object.entries(c).map(([k, v]) => [k, String(v)]))]),
    ),
  );
  const save = useSave(onClose);

  const draft = useMemo(() => {
    try {
      const cents = madToCents(anchor);
      if (cents === null) throw new Error("Prix de référence invalide.");
      const config = {
        anchorCents: cents,
        anchorQuantity: intOf(anchorQty),
        quantities: parseList(presets),
        bulkQuoteAt: bulk.trim() ? intOf(bulk) : null,
        productionDays: intOf(days),
        breaks: auto
          ? null
          : tiers.map((t) => ({ quantity: intOf(t.quantity), factor: 1 - Number(t.discount.replace(",", ".")) / 100 })),
        optionFactors: Object.fromEntries(
          Object.entries(factors).map(([g, c]) => [g, Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Number(v.replace(",", "."))]))]),
        ),
      };
      const clean = validateProductPricing(config, product);
      return { ok: true as const, clean, preview: applyProductPricing(product, clean) };
    } catch (e) {
      return { ok: false as const, error: errText(e) };
    }
  }, [anchor, anchorQty, presets, bulk, days, auto, tiers, factors, product]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prix de référence (MAD)" hint="Montant exact pour la quantité de référence, configuration de base, hors livraison.">
          <Input inputMode="decimal" value={anchor} onChange={(e) => setAnchor(e.target.value)} />
        </Field>
        <Field label="Quantité de référence">
          <Input inputMode="numeric" value={anchorQty} onChange={(e) => setAnchorQty(e.target.value)} />
        </Field>
        <Field
          label="Préréglages de quantité"
          hint="Nombres entiers croissants, séparés par des virgules. Le premier est le minimum, le dernier termine la plage de prix automatique. Le client peut saisir toute quantité au-dessus du minimum ; au-delà de la plage il reçoit une demande de devis."
        >
          <Input value={presets} onChange={(e) => setPresets(e.target.value)} />
        </Field>
        <Field label="Seuil de devis (optionnel)" hint="À partir de cette quantité, demande de devis même dans la plage.">
          <Input inputMode="numeric" value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder="Aucun" />
        </Field>
        <Field label="Délai de production (jours ouvrés)">
          <Input inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
        </Field>
      </div>

      <fieldset className="space-y-2 rounded-lg border p-3">
        <legend className="px-1 text-sm font-semibold">Remises par quantité</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Courbe automatique
        </label>
        {!auto ? (
          <div className="space-y-2">
            {tiers.map((t, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                <Input
                  aria-label={`Quantité du palier ${i + 1}`}
                  className="w-28"
                  inputMode="numeric"
                  value={t.quantity}
                  onChange={(e) => setTiers((all) => all.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))}
                />
                <span>unités →</span>
                <Input
                  aria-label={`Remise du palier ${i + 1}`}
                  className="w-24"
                  inputMode="decimal"
                  value={t.discount}
                  onChange={(e) => setTiers((all) => all.map((x, j) => (j === i ? { ...x, discount: e.target.value } : x)))}
                />
                <span>% de remise</span>
                {tiers.length > 2 ? (
                  <Button size="sm" variant="ghost" onClick={() => setTiers((all) => all.filter((_, j) => j !== i))}>
                    Retirer
                  </Button>
                ) : null}
              </div>
            ))}
            <Button size="sm" variant="outline" disabled={tiers.length >= 20} onClick={() => setTiers((all) => [...all, { quantity: "", discount: "0" }])}>
              Ajouter un palier
            </Button>
            <p className="text-xs text-muted-foreground">Le prix unitaire est interpolé entre deux paliers et ne peut pas augmenter avec la quantité.</p>
          </div>
        ) : null}
      </fieldset>

      <fieldset className="space-y-3 rounded-lg border p-3">
        <legend className="px-1 text-sm font-semibold">Multiplicateurs d'options</legend>
        {product.options
          .filter((g) => g.id !== "delivery")
          .map((g) => (
            <div key={g.id}>
              <p className="text-xs font-semibold uppercase text-muted-foreground">{fr(g.label)}</p>
              <div className="mt-1 grid gap-2 sm:grid-cols-2">
                {g.choices.map((c) => (
                  <label key={c.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>{fr(c.label)}</span>
                    <span className="flex items-center gap-1">
                      ×
                      <Input
                        aria-label={`${fr(g.label)} ${fr(c.label)}`}
                        className="h-8 w-20"
                        inputMode="decimal"
                        value={factors[g.id]?.[c.id] ?? "1"}
                        onChange={(e) => setFactors((f) => ({ ...f, [g.id]: { ...f[g.id], [c.id]: e.target.value } }))}
                      />
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
      </fieldset>

      {draft.ok ? (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <p className="font-semibold">Aperçu, configuration de base hors livraison</p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {draft.preview.quantities.slice(0, 8).map((q) => (
              <li key={q} className="flex justify-between gap-3">
                <span>{q.toLocaleString("fr-FR")} u.</span>
                <span>{mad(priceQuote(draft.preview, q, defaultSelection(draft.preview)).subtotal)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {draft.error}
        </p>
      )}

      <Actions
        pending={save.isPending}
        canSave={draft.ok}
        hasOverride={Boolean(row && isOverride(row.config))}
        onClose={onClose}
        onSave={() => draft.ok && save.mutate({ kind: "product", slug: product.slug, version: row?.version ?? 0, config: draft.clean })}
        onReset={() => save.mutate({ kind: "product", slug: product.slug, version: row?.version ?? 0, config: null })}
      />
    </div>
  );
}

function PackForm({ pack, row, rows, onClose }: { pack: Pack; row: PricingRow | null; rows: PricingRow[]; onClose: () => void }) {
  const others = useMemo(() => {
    try {
      return buildCatalog(rows.filter((r) => !(r.kind === "pack" && r.slug === pack.slug)));
    } catch {
      return null;
    }
  }, [rows, pack.slug]);
  const start = row && others && isOverride(row.config) ? (() => {
    try {
      return validatePackPricing(row.config, pack, others.getProduct);
    } catch {
      return defaultPackPricing(pack);
    }
  })() : defaultPackPricing(pack);
  const [discount, setDiscount] = useState(String(start.discountPercent));
  const [lines, setLines] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(start.lines).map(([k, v]) => [k, String(v)])),
  );
  const save = useSave(onClose);
  const draft = useMemo(() => {
    try {
      if (!others) throw new Error("Catalogue illisible.");
      const clean = validatePackPricing(
        { discountPercent: Number(discount.replace(",", ".")), lines: Object.fromEntries(Object.entries(lines).map(([k, v]) => [k, intOf(v)])) },
        pack,
        others.getProduct,
      );
      const livePack = { ...pack, lines: pack.lines.map((l) => ({ ...l, quantity: clean.lines[l.ref] ?? l.quantity })) };
      const quote = packQuote(livePack.lines, { ...others, packDiscount: () => clean.discountPercent / 100 }, pack.slug);
      return { ok: true as const, clean, quote };
    } catch (e) {
      return { ok: false as const, error: errText(e) };
    }
  }, [discount, lines, pack, others]);

  return (
    <div className="space-y-5">
      <Field label="Remise du pack (%)" hint="Appliquée à la somme des prix individuels. 0 à 90 %.">
        <Input inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} />
      </Field>
      <fieldset className="space-y-2 rounded-lg border p-3">
        <legend className="px-1 text-sm font-semibold">Quantités par défaut</legend>
        {pack.lines.map((l) => (
          <label key={l.ref} className="flex items-center justify-between gap-2 text-sm">
            <span>
              {fr(l.label)}
              {l.kind === "internal" ? <span className="ml-1 text-xs text-muted-foreground">(article interne)</span> : null}
            </span>
            <Input
              className="h-8 w-28"
              inputMode="numeric"
              value={lines[l.ref] ?? ""}
              onChange={(e) => setLines((x) => ({ ...x, [l.ref]: e.target.value }))}
            />
          </label>
        ))}
        <p className="text-xs text-muted-foreground">
          Les articles internes ont pour minimum la quantité par défaut. Les produits suivent leur minimum et leur plage de prix.
        </p>
      </fieldset>
      {draft.ok ? (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          Prix séparé {mad(draft.quote.normalPrice)} → prix du pack <strong>{mad(draft.quote.packPrice)}</strong>
        </div>
      ) : (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {draft.error}
        </p>
      )}
      <Actions
        pending={save.isPending}
        canSave={draft.ok}
        hasOverride={Boolean(row && isOverride(row.config))}
        onClose={onClose}
        onSave={() => draft.ok && save.mutate({ kind: "pack", slug: pack.slug, version: row?.version ?? 0, config: draft.clean })}
        onReset={() => save.mutate({ kind: "pack", slug: pack.slug, version: row?.version ?? 0, config: null })}
      />
    </div>
  );
}

function InternalForm({ slug, row, onClose }: { slug: string; row: PricingRow | null; onClose: () => void }) {
  const base = internalPackItems[slug]!;
  const startCents = row && isOverride(row.config) ? validateInternalPricing(row.config).unitPriceCents : Math.round(base.unitPrice * 100);
  const [price, setPrice] = useState(centsText(startCents));
  const cents = madToCents(price);
  const save = useSave(onClose);
  return (
    <div className="space-y-5">
      <Field label="Prix unitaire (MAD)" hint="Article vendu uniquement dans les packs. Prix avant la remise du pack.">
        <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
      </Field>
      {cents === null ? <p role="alert" className="text-sm text-destructive">Prix unitaire invalide.</p> : null}
      <Actions
        pending={save.isPending}
        canSave={cents !== null}
        hasOverride={Boolean(row && isOverride(row.config))}
        onClose={onClose}
        onSave={() => cents !== null && save.mutate({ kind: "internal", slug, version: row?.version ?? 0, config: { unitPriceCents: cents } })}
        onReset={() => save.mutate({ kind: "internal", slug, version: row?.version ?? 0, config: null })}
      />
    </div>
  );
}
