import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { fromPriceBasis, type Product } from "@/data/products";
import { productImageAlt, productImages } from "@/data/productImages";
import { mad } from "@/lib/format";
import { useUnavailable } from "@/hooks/use-availability";
import { useI18n } from "@/i18n";
import { useLivePricing } from "@/hooks/use-pricing";

export function ProductCard({ product }: { product: Product }) {
  const { tr, number } = useI18n();
  const live = useLivePricing();
  const liveProduct = live.catalog?.getProduct(product.slug);
  // No price until live pricing is loaded: never show an outdated default.
  const basis = liveProduct ? fromPriceBasis(liveProduct) : null;
  const unavailable = useUnavailable("product", product.slug);
  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="aspect-[4/3] overflow-hidden bg-secondary/60 p-2">
        <img
          src={productImages[product.slug]}
          alt={
            productImageAlt[product.slug]
              ? tr(productImageAlt[product.slug]!)
              : `${tr(product.name)} — Primple`
          }
          width={800}
          height={600}
          loading="lazy"
          className="premium-image size-full rounded-lg object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl">{tr(product.name)}</h3>
        {unavailable && (
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            {tr("This product is temporarily unavailable.")}
          </p>
        )}
        <p className="mt-1.5 text-sm text-muted-foreground">{tr(product.benefit)}</p>
        {!product.quoteOnly && (
          <p className="mt-3 text-xs text-muted-foreground">
            {tr("Standard delivery: 30 DH")} · {tr("Estimated total shown before payment")}
          </p>
        )}
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          {product.quoteOnly ? (
            <span className="text-sm font-semibold">{tr("Request a quote")}</span>
          ) : !basis ? (
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {live.status === "error" ? tr("Price shown on the product page") : "…"}
            </span>
          ) : (
            <span className="text-sm font-semibold">
              {tr("From")} {mad(basis.amount)}
              <span className="block text-xs font-normal text-muted-foreground">
                {tr(
                  basis.quantity === 1
                    ? "for 1 unit, delivery not included"
                    : "for {quantity} units, delivery not included",
                ).replace("{quantity}", number(basis.quantity))}
              </span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground/80 transition-colors group-hover:text-primary">
            {tr("Get a price")}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
          </span>
        </div>
      </div>
    </Link>
  );
}
