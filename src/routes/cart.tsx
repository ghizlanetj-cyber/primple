import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, FileText, ShoppingBag, Trash2, Truck } from "lucide-react";
import { motion } from "motion/react";

import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/button";
import { mad, madUnit } from "@/lib/format";
import { cartTotals, useCart } from "@/store/cart";
import { productImages } from "@/data/productImages";
import { getProduct } from "@/data/products";
import { isPackSlug, packSlugFromCartSlug } from "@/data/packs";
import { DESIGN_SERVICE_SLUG } from "@/data/design-service";
import { isBulkQuoteQuantity, parseQuantity, productQuantityLimits } from "@/lib/quantity";
import type { CartItem } from "@/store/cart";
import { useI18n } from "@/i18n";

const title = "Votre panier d’impression | Primple";
const description =
  "Vérifiez vos produits, configurations, délais de production et livraison avant de finaliser votre commande.";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.lovable.app/cart" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://primple.lovable.app/cart" }],
  }),
  component: CartPage,
});

function CartPage() {
  const { tr, number } = useI18n();
  const { items, remove, setQuantity } = useCart();
  const totals = cartTotals(items);

  return (
    <SiteShell>
      <section className="section-shell pb-14 pt-24 md:py-20">
        <h1 className="text-4xl md:text-5xl">{tr("Your printing cart")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {tr("Check the setup, then review and confirm your order. Prices include everything you see here.")}
        </p>

        {items.length === 0 ? (
          <div className="mt-14 rounded-3xl border border-border bg-card p-12 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
              <ShoppingBag className="size-5 text-muted-foreground" />
            </span>
            <p className="mt-5 font-display text-xl font-bold">{tr("Nothing to print yet.")}</p>
            <p className="mt-2 text-muted-foreground">
              {tr("Configure a product and your price appears here instantly.")}
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full px-7">
              <Link to="/products">
                {tr("Start Printing")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
            <div className="space-y-4">
              {items.map((item) => (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid gap-5 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[140px_1fr]"
                >
                  {lineImage(item.slug) ? (
                    <img
                      src={lineImage(item.slug)}
                      alt={tr(item.name)}
                      width={800}
                      height={600}
                      loading="lazy"
                      className="h-28 w-full rounded-xl object-cover sm:h-full"
                    />
                  ) : (
                    <div className="flex h-28 w-full items-center justify-center rounded-xl bg-secondary text-sm text-muted-foreground sm:h-full">
                      {tr("Design service")}
                    </div>
                  )}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg">{tr(item.name)}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.labels.map((l) => tr(l.value)).join(" · ")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${tr("Remove")} ${tr(item.name)}`}
                        onClick={() => remove(item.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-4" />
                        {tr("Production")} {item.productionDays}{" "}
                        {tr(item.productionDays === 1 ? "day" : "days")}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Truck className="size-4" />
                        {tr("Delivery")} {item.deliveryMin}–{item.deliveryMax} {tr("days")}
                      </span>
                      {item.artwork && (
                        <span className="inline-flex items-center gap-1.5">
                          <FileText className="size-4" />
                          {item.artwork}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                      <CartQuantityInput item={item} onValidQuantity={setQuantity} />
                      <div className="text-end">
                        <p className="text-xs text-muted-foreground">
                          {madUnit(item.unitPrice)} {tr("per unit")}
                        </p>
                        <p className="font-display text-lg font-extrabold">{mad(item.subtotal)}</p>
                      </div>
                    </div>

                    {isPackSlug(item.slug) ? (
                      <Link
                        to="/packs/$slug"
                        params={{ slug: packSlugFromCartSlug(item.slug) }}
                        className="mt-3 inline-flex text-sm font-semibold hover:text-primary"
                      >
                        {tr("Edit this pack")}
                      </Link>
                    ) : item.slug === DESIGN_SERVICE_SLUG ? (
                      <Link
                        to="/design-services"
                        className="mt-3 inline-flex text-sm font-semibold hover:text-primary"
                      >
                        {tr("Change my design hours")}
                      </Link>
                    ) : (
                      <Link
                        to="/products/$slug"
                        params={{ slug: item.slug }}
                        className="mt-3 inline-flex text-sm font-semibold hover:text-primary"
                      >
                        {tr("Edit configuration")}
                      </Link>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>

            <aside className="rounded-2xl border border-border bg-card p-6 shadow-lift lg:sticky lg:top-28">
              <h2 className="text-xl">{tr("Order summary")}</h2>
              <dl className="mt-5 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{tr("Subtotal")}</dt>
                  <dd>{mad(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{tr("Delivery")}</dt>
                  <dd>{mad(totals.delivery)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3 font-semibold">
                  <dt>{tr("Total")}</dt>
                  <dd>{mad(totals.total)}</dd>
                </div>
              </dl>
              <Button asChild size="lg" className="mt-6 w-full rounded-full">
                <Link to="/checkout">
                  {tr("Review order")}
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {tr("Secure card payment in MAD · Artwork checked before production")}
              </p>
            </aside>
          </div>
        )}
      </section>
    </SiteShell>
  );
}

function CartQuantityInput({
  item,
  onValidQuantity,
}: {
  item: CartItem;
  onValidQuantity: (id: string, quantity: number) => void;
}) {
  const { tr, number } = useI18n();
  const [value, setValue] = useState(String(item.quantity));
  const product = getProduct(item.slug);
  const limits = product ? productQuantityLimits(product) : { min: 1, max: Number.MAX_SAFE_INTEGER };
  const parsed = parseQuantity(value, limits);
  const invalid = parsed === null || (product ? isBulkQuoteQuantity(product, parsed) : false);
  const errorId = `cart-quantity-error-${item.id}`;

  useEffect(() => setValue(String(item.quantity)), [item.quantity]);

  const error = tr("Enter a whole number between {min} and {max}.")
    .replace("{min}", number(limits.min))
    .replace("{max}", number(limits.max));

  return (
    <div>
      <label className="flex items-center gap-2 text-sm" htmlFor={`cart-quantity-${item.id}`}>
        {tr("Quantity")}
        <input
          id={`cart-quantity-${item.id}`}
          type="text"
          inputMode="numeric"
          value={value}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          onChange={(event) => {
            const next = event.target.value;
            setValue(next);
            const quantity = parseQuantity(next, limits);
            if (quantity !== null && (!product || !isBulkQuoteQuantity(product, quantity))) onValidQuantity(item.id, quantity);
          }}
          className="h-9 w-24 rounded-full border border-input bg-background px-3 text-center text-sm"
        />
      </label>
      {invalid && (
        <p id={errorId} className="mt-2 max-w-xs text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
