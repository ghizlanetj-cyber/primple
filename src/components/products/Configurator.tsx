import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Clock, Sparkles, Truck } from "lucide-react";
import { toast } from "sonner";

import { ArtworkUpload, type ArtworkState } from "@/components/products/ArtworkUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  defaultSelection,
  bindingError,
  priceQuote,
  selectionLabels,
  type Product,
  type Selection,
} from "@/data/products";
import { mad, madUnit } from "@/lib/format";
import { DESIGN_ADDON_KEY, DESIGN_ADDON_VALUE, designAddonQuote } from "@/data/design-service";
import { contact } from "@/config/contact";
import { isBulkQuoteQuantity, parseQuantity, productQuantityLimits } from "@/lib/quantity";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { quantityChoiceDetails } from "./quantity-choice";

export function Configurator({ product }: { product: Product }) {
  const { tr, number } = useI18n();
  const navigate = useNavigate();
  const add = useCart((s) => s.add);

  const limits = productQuantityLimits(product);
  const initialQuantity = product.quantities[2] ?? product.quantities[0] ?? limits.min;
  const [quantity, setQuantity] = useState(initialQuantity);
  const [customQuantity, setCustomQuantity] = useState("");
  const [selection, setSelection] = useState<Selection>(() => defaultSelection(product));
  const [artwork, setArtwork] = useState<ArtworkState | null>(null);
  const [artworkMode, setArtworkMode] = useState<"file" | "design">("file");
  const designAddon = designAddonQuote(product.slug);
  const needsDesign = artworkMode === "design";
  const chooseMode = (mode: "file" | "design") => {
    // Switching always clears the other path's state: no stale file, no duplicate add-on.
    setArtworkMode(mode);
    if (mode === "design") setArtwork(null);
  };

  const quote = useMemo(
    () => priceQuote(product, quantity, selection),
    [product, quantity, selection],
  );
  const designAmount = needsDesign ? designAddon.subtotal : 0;
  const subtotal = Math.round((quote.subtotal + designAmount) * 100) / 100;
  const total = Math.round((subtotal + quote.delivery) * 100) / 100;
  const parsedCustomQuantity = customQuantity === "" ? null : parseQuantity(customQuantity, limits);
  const customQuantityInvalid = customQuantity !== "" && parsedCustomQuantity === null;
  const bulkQuote = isBulkQuoteQuantity(product, quantity);
  const quantityError = tr("Enter a whole number between {min} and {max}.")
    .replace("{min}", number(limits.min))
    .replace("{max}", number(limits.max));
  const pages = product.pageRange ? Number(selection["pages"] ?? product.pageRange.default) : null;
  const pagesInvalid = product.pageRange
    ? !Number.isInteger(pages) || pages === null || pages < product.pageRange.min || pages > product.pageRange.max
    : false;
  const pagesError = product.pageRange
    ? tr("Enter a whole number between {min} and {max} pages.")
        .replace("{min}", number(product.pageRange.min))
        .replace("{max}", number(product.pageRange.max))
    : "";
  const bindingInvalid = Boolean(bindingError(product, selection)) && !pagesInvalid;
  const dimensionValue = (key: "width" | "height", fallback: number) => {
    const raw = selection[key];
    return raw === undefined || raw === "" ? fallback : Number(raw);
  };
  const dimensionsInvalid = product.dimensions
    ? !(
        Number.isFinite(dimensionValue("width", product.dimensions.defaultWidth)) &&
        dimensionValue("width", product.dimensions.defaultWidth) > 0 &&
        Number.isFinite(dimensionValue("height", product.dimensions.defaultHeight)) &&
        dimensionValue("height", product.dimensions.defaultHeight) > 0
      )
    : false;

  const addToCart = () => {
    if (customQuantityInvalid || pagesInvalid || bindingInvalid || dimensionsInvalid || bulkQuote) return;
    if (product.quoteOnly) {
      window.open(quoteHref, "_blank", "noopener");
      return;
    }
    const { [DESIGN_ADDON_KEY]: _stale, ...base } = selection;
    const lineSelection: Selection = needsDesign ? { ...base, [DESIGN_ADDON_KEY]: DESIGN_ADDON_VALUE } : base;
    const labels = selectionLabels(product, base);
    add({
      slug: product.slug,
      name: product.name,
      quantity,
      selection: lineSelection,
      labels: needsDesign
        ? [...labels, { group: "Design", value: "Design by Primple — 100 MAD/h" }]
        : labels,
      unitPrice: quote.unitPrice,
      subtotal,
      delivery: quote.delivery,
      productionDays: quote.productionDays,
      deliveryMin: quote.deliveryMin,
      deliveryMax: quote.deliveryMax,
      ...(artwork && !needsDesign
        ? {
            artwork: artwork.name,
            artworkPath: artwork.path,
            ...(artwork.guestToken ? { artworkGuestToken: artwork.guestToken } : {}),
          }
        : {}),
    });
    toast.success(`${number(quantity)} ${tr(product.name)} — ${tr("added to your cart.")}`);
    navigate({ to: "/cart" });
  };

  const quoteHref = `${contact.whatsapp}?text=${encodeURIComponent(
    `${tr("Request a quote")} — ${tr(product.name)} · ${number(quantity)} · ${selectionLabels(product, selection)
      .map((l) => tr(l.value))
      .join(" · ")}${needsDesign ? ` · ${tr("Design by Primple — 100 MAD/h")}` : ""}`,
  )}`;

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
              {product.quantities.map((q) => {
                const tierQuote = priceQuote(product, q, selection);
                const choice = quantityChoiceDetails(number(q), tierQuote.savingsPercent);
                return (
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
                    <span className="flex flex-col items-center leading-tight">
                      <span>{choice.quantity}</span>
                      {choice.savings && (
                        <span className="text-[11px] font-semibold text-success">
                          {choice.savings}
                        </span>
                      )}
                    </span>
                  </ChipRadio>
                );
              })}
              <Input
                id={`custom-quantity-${product.slug}`}
                value={customQuantity}
                onChange={(e) => {
                  const v = e.target.value;
                  setCustomQuantity(v);
                  const parsed = parseQuantity(v, limits);
                  if (parsed !== null) setQuantity(parsed);
                }}
                placeholder={tr("Custom")}
                inputMode="numeric"
                aria-label={tr("Or enter your own quantity")}
                aria-invalid={customQuantityInvalid}
                aria-describedby={customQuantityInvalid ? `custom-quantity-error-${product.slug}` : undefined}
                className="h-9 w-24 rounded-full text-center"
              />
            </div>
            {customQuantityInvalid && (
              <p id={`custom-quantity-error-${product.slug}`} className="mt-2 text-sm text-destructive" role="alert">
                {quantityError}
              </p>
            )}
            {quote.savingsPercent > 0 && (
              <p className="mt-3 text-sm text-success">
                {tr("You save")} {quote.savingsPercent}% {tr("per unit at this quantity.")}
              </p>
            )}
          </fieldset>

          {product.pageRange && (
            <fieldset className="mt-7 border-0 p-0">
              <legend className="text-sm font-semibold">{tr("Page count")}</legend>
              <p className="text-xs text-muted-foreground">{tr("The price is based on the total number of interior pages.")}</p>
              <Input
                id={`pages-${product.slug}`}
                type="text"
                inputMode="numeric"
                value={selection["pages"] ?? String(product.pageRange.default)}
                onChange={(event) => {
                  const next = event.target.value;
                  setSelection((current) => ({
                    ...current,
                    pages: next,
                    ...(Number(next) > 64 && current["binding"] === "saddle-stitched"
                      ? { binding: "perfect-bound" }
                      : {}),
                  }));
                }}
                aria-invalid={pagesInvalid}
                aria-describedby={pagesInvalid ? `pages-error-${product.slug}` : undefined}
                className="mt-3 h-10 w-32 rounded-full text-center"
              />
              {pagesInvalid && <p id={`pages-error-${product.slug}`} className="mt-2 text-sm text-destructive" role="alert">{pagesError}</p>}
            </fieldset>
          )}

          {product.dimensions && (
            <fieldset className="mt-7 border-0 p-0">
              <legend className="text-sm font-semibold">{tr("Dimensions")}</legend>
              <p className="text-xs text-muted-foreground">
                {tr("The price is based on the printed surface in square metres.")}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm" htmlFor={`width-${product.slug}`}>
                  {tr("Width (m)")}
                  <Input
                    id={`width-${product.slug}`}
                    type="text"
                    inputMode="decimal"
                    value={selection["width"] ?? String(product.dimensions.defaultWidth)}
                    onChange={(e) => setSelection((s) => ({ ...s, width: e.target.value }))}
                    aria-invalid={dimensionsInvalid}
                    className="h-10 w-24 rounded-full text-center"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm" htmlFor={`height-${product.slug}`}>
                  {tr("Height (m)")}
                  <Input
                    id={`height-${product.slug}`}
                    type="text"
                    inputMode="decimal"
                    value={selection["height"] ?? String(product.dimensions.defaultHeight)}
                    onChange={(e) => setSelection((s) => ({ ...s, height: e.target.value }))}
                    aria-invalid={dimensionsInvalid}
                    className="h-10 w-24 rounded-full text-center"
                  />
                </label>
              </div>
              {dimensionsInvalid ? (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  {tr("Enter a width and a height greater than zero, in metres.")}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  {tr("Printed surface")}: {number(quote.area ?? 0)} m² · {madUnit(quote.unitPrice)}{" "}
                  {tr("per unit")}
                </p>
              )}
            </fieldset>
          )}



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
                    disabled={group.id === "binding" && choice.id === "saddle-stitched" && (pages === null || pages > 64)}
                    onSelect={() => setSelection((s) => ({ ...s, [group.id]: choice.id }))}
                  >
                    {tr(choice.label)}
                    {choice.note && (
                      <span className="ms-1.5 text-xs font-normal opacity-70">
                        {tr(choice.note)}
                      </span>
                    )}
                  </ChipRadio>
                ))}
              </div>
            </fieldset>
          ))}
          {product.bulkQuoteAt && (
            <p className={cn("mt-6 text-sm", bulkQuote ? "font-semibold text-primary" : "text-muted-foreground")}>
              <a href={quoteHref} target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-primary">
                {tr("500+ copies: request a custom quote.")}
              </a>
            </p>
          )}
          {product.pageRange && (
            <p className="mt-3 text-sm text-muted-foreground">{tr("Reference: 73 DH for 1 A5 book, 132 interior pages (66 double-sided sheets), black and white on 80g offset, 350g laminated cover, perfect binding. Delivery not included. Page count, options and quantity update the price.")}</p>
          )}
          {bindingInvalid && (
            <p role="alert" className="mt-3 text-sm font-semibold text-destructive">{tr("Saddle stitching needs 24–64 pages in multiples of 4.")}</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl">{tr("Your artwork")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tr("We check your file before production and tell you if anything needs attention.")}
          </p>
          <fieldset className="mt-5 grid gap-2 border-0 p-0 sm:grid-cols-2">
            <legend className="sr-only">{tr("Your artwork")}</legend>
            <ChipRadio name="artwork-mode" value="file" checked={!needsDesign} onSelect={() => chooseMode("file")}>
              <span className="block font-semibold">{tr("I have a print-ready file")}</span>
            </ChipRadio>
            <ChipRadio name="artwork-mode" value="design" checked={needsDesign} onSelect={() => chooseMode("design")}>
              <span className="block font-semibold">{tr("I need Primple to create the design")}</span>
            </ChipRadio>
          </fieldset>
          {needsDesign ? (
            <div className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm">
              <p className="flex items-start gap-2 font-semibold">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                {tr("Design by Primple — 100 MAD/h")}
              </p>
              <p className="mt-1 text-muted-foreground">
                {tr("{hours} h of design for this product, added to your order: {price}. No file needed — a designer contacts you after the order.")
                  .replace("{hours}", number(designAddon.hours))
                  .replace("{price}", mad(designAddon.subtotal))}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{tr("Branding and logo creation are not included.")}</p>
            </div>
          ) : (
            <>
              <div className="mt-5">
                <ArtworkUpload artwork={artwork} onChange={setArtwork} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                <Link to="/design-services" className="underline">{tr("Book a designer — 100 MAD/h")}</Link>
              </p>
            </>
          )}
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
              {product.quoteOnly ? tr("Request a quote") : mad(total)}
            </motion.p>
          </AnimatePresence>
          {!product.quoteOnly && (
          <p className="mt-1 text-sm text-muted-foreground">
            {number(quantity)} {tr("units")} · {madUnit(quote.unitPrice)} {tr("each")}
          </p>
          )}

          {!product.quoteOnly && (
          <dl className="mt-6 space-y-2.5 border-t border-border pt-5 text-sm">
            <Row label={tr("Subtotal")} value={mad(quote.subtotal)} />
            {needsDesign && <Row label={tr("Design by Primple — 100 MAD/h")} value={mad(designAmount)} />}
            <Row
              label={tr("Delivery")}
              value={quote.delivery === 0 ? tr("Included") : mad(quote.delivery)}
            />
            <div className="flex items-center justify-between border-t border-border pt-3 font-semibold">
              <dt>{tr("Estimated total")}</dt>
              <dd>{mad(total)}</dd>
            </div>
          </dl>
          )}

          <div className="mt-5 space-y-2 rounded-xl bg-secondary/60 p-4 text-sm">
            <p className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              {tr("Production")}: {quote.productionDays}{" "}
              {tr(quote.productionDays === 1 ? "day" : "days")}
            </p>
            <p className="flex items-center gap-2">
              <Truck className="size-4 text-muted-foreground" />
              {tr("Delivery")}: {quote.deliveryMin}–{quote.deliveryMax} {tr("days")}
            </p>
            <p className="font-semibold">
              {tr("Estimated arrival")}: {quote.productionDays + quote.deliveryMin}–{quote.productionDays + quote.deliveryMax} {tr("working days")}
            </p>
            <p className="text-xs text-muted-foreground">
              {tr("Production starts after payment and artwork approval. Weekends are not counted.")}
            </p>
          </div>

          <Button
            size="lg"
            className="mt-6 w-full rounded-full"
            onClick={addToCart}
            disabled={customQuantityInvalid || pagesInvalid || bindingInvalid || dimensionsInvalid || bulkQuote}
          >
            {tr(product.quoteOnly ? "Request a quote" : bulkQuote ? "Request a custom quote" : "Add to cart")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {tr(
              product.quoteOnly
                ? "Configure your packaging in a few minutes. Receive a clear quote and a confirmed lead time within 4 business hours."
                : "Your payment is made online by card in MAD. Production starts once the payment is confirmed.",
            )}
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

/** Chip styled as before, but with native radio semantics and keyboard support. */
function ChipRadio({
  children,
  name,
  value,
  checked,
  disabled = false,
  onSelect,
}: {
  children: React.ReactNode;
  name: string;
  value: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "cursor-pointer select-none rounded-full border px-4 py-2 text-sm font-medium transition-all",
        disabled && "cursor-not-allowed opacity-45",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
        checked
          ? "border-primary bg-primary text-primary-foreground shadow-soft"
          : "border-border bg-background text-foreground/80 hover:border-primary/50",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />
      {children}
    </label>
  );
}
