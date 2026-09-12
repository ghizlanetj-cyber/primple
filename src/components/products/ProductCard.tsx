import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import type { Product } from "@/data/products";
import { productImages } from "@/data/productImages";
import { mad } from "@/lib/format";
import { useI18n } from "@/i18n";

export function ProductCard({ product }: { product: Product }) {
  const { tr } = useI18n();
  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={productImages[product.slug]}
          alt={`${tr(product.name)} — Primpel`}
          width={800}
          height={600}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg">{tr(product.name)}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{tr(product.benefit)}</p>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm font-semibold">{tr("From")} {mad(product.fromPrice)}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground/80 transition-colors group-hover:text-primary">
            {tr("Configure yours")}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
          </span>
        </div>
      </div>
    </Link>
  );
}
