import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Clock, Sparkles, Truck } from "lucide-react";
import { toast } from "sonner";

import { ArtworkUpload, type ArtworkState } from "@/components/products/ArtworkUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  defaultSelection,
  priceQuote,
  selectionLabels,
  type Product,
  type Selection,
} from "@/data/products";
import { mad, madUnit } from "@/lib/format";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

export function Configurator({ product }: { product: Product }) {
  const { tr, number } = useI18n();
  const navigate = useNavigate();
  const add = useCart((s) => s.add);

  const [quantity, setQuantity] = useState(product.quantities[2] ?? product.quantities[0]!);
  const [customQuantity, setCustomQuantity] = useState("");
  const [selection, setSelection] = useState<Selection>(() => defaultSelection(product));
  const [artwork, setArtwork] = useState<ArtworkState | null>(null);

  const quote = useMemo(() => priceQuote(product, quantity, selection), [product, quantity, selection]);
  const total = quote.total;

  const addToCart = () => {
    add({
      slug: product.slug,
      name: product.name,
      quantity,
      selection,
      labels: selectionLabels(product, selection),
      unitPrice: quote.unitPrice,
      subtotal: quote.subtotal,
      delivery: quote.delivery,
      productionDays: quote.productionDays,
      deliveryMin: quote.deliveryMin,
      deliveryMax: quote.deliveryMax,
      ...(artwork ? { artwork: artwork.name } : {}),
    });
    toast.success(`${number(quantity)} ${tr(product.name)} — ${tr("added to your cart.")}`);
    navigate({ to: "/cart" });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start">
      <div className="space-y-8">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl">{tr("Configure your print")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tr("Change anything — the price and dates update as you go.")}
          </p>

          <fieldset className="mt-6 border-0 p-0">
            <legend className="text-sm font-semibold">{tr("Quantity")}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.quantities.map((q) => (
                <ChipRadio
                  key={q}
                  name="quantity"
                  value={String(q)}
                  checked={quantity === q && customQuantity === ""}
                  onSelect={() => {
                    setQuantity(q);
                    setCustomQuantity("");
                  }}
                >
                  {number(q)}
                </ChipRadio>
              ))}
              <Input
                value={customQuantity}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  setCustomQuantity(v);
                  if (v) setQuantity(Math.max(1, Number(v)));
                }}
                placeholder={tr("Custom")}
                inputMode="numeric"
                aria-label={tr("Or enter your own quantity")}
                className="h-9 w-24 rounded-full text-center"
              />
            </div>
            {quote.savingsPercent > 0 && (
              <p className="mt-3 text-sm text-success">
                {tr("You save")} {quote.savingsPercent}% {tr("per unit at this quantity.")}
              </p>
            )}
          </fieldset>

          {product.options.map((group) => (
            <fieldset key={group.id} className="mt-7 border-0 p-0">
              <legend className="text-sm font-semibold">{tr(group.label)}</legend>
              {group.help && <p className="text-xs text-muted-foreground">{tr(group.help)}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {group.choices.map((choice) => (
                  <ChipRadio
                    key={choice.id}
                    name={`option-${group.id}`}
                    value={choice.id}
                    checked={selection[group.id] === choice.id}
                    onSelect={() => setSelection((s) => ({ ...s, [group.id]: choice.id }))}
                  >
                    {tr(choice.label)}
                    {choice.note && (
                       <span className="ms-1.5 text-xs font-normal opacity-70">{tr(choice.note)}</span>
                    )}
                  </ChipRadio>
                ))}
              </div>
            </fieldset>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl">{tr("Your artwork")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tr("We check your file before production and tell you if anything needs attention.")}
          </p>
          <div className="mt-5">
            <ArtworkUpload artwork={artwork} onChange={setArtwork} />
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-sm text-muted-foreground">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            {tr("No file yet? Get help preparing your artwork or turning an idea into something you can print — add it later without losing this configuration.")}
          </p>
        </section>

      </div>

      <aside className="lg:sticky lg:top-28">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lift">
          <p className="eyebrow text-muted-foreground">{tr("Your price")}</p>
          <AnimatePresence mode="popLayout">
            <motion.p
              key={Math.round(total)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="mt-2 font-display text-4xl font-extrabold tracking-tight"
            >
              {mad(total)}
            </motion.p>
          </AnimatePresence>
          <p className="mt-1 text-sm text-muted-foreground">
            {number(quantity)} {tr("units")} · {madUnit(quote.unitPrice)} {tr("each")}
          </p>

          <dl className="mt-6 space-y-2.5 border-t border-border pt-5 text-sm">
            <Row label={tr("Subtotal")} value={mad(quote.subtotal)} />
            <Row
              label={tr("Delivery")}
              value={quote.delivery === 0 ? tr("Included") : mad(quote.delivery)}
            />
            <div className="flex items-center justify-between border-t border-border pt-3 font-semibold">
              <dt>{tr("Estimated total")}</dt>
              <dd>{mad(total)}</dd>
            </div>
          </dl>

          <div className="mt-5 space-y-2 rounded-xl bg-secondary/60 p-4 text-sm">
            <p className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
               {tr("Production")}: {quote.productionDays} {tr(quote.productionDays === 1 ? "day" : "days")}
            </p>
            <p className="flex items-center gap-2">
              <Truck className="size-4 text-muted-foreground" />
               {tr("Delivery")}: {quote.deliveryMin}–{quote.deliveryMax} {tr("days")}
            </p>
          </div>

          <Button size="lg" className="mt-6 w-full rounded-full" onClick={addToCart}>
            {tr(artwork ? "Start this print" : "Continue to artwork")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {tr("No surprise fees at checkout. Pay when you're happy with the setup.")}
          </p>
        </div>

      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-soft"
          : "border-border bg-background text-foreground/80 hover:border-primary/50",
      )}
    >
      {children}
    </button>
  );
}
