import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { products } from "@/data/products";
import { useI18n } from "@/i18n";

export function Categories() {
  const { tr } = useI18n();
  return (
    <section className="section-shell py-24 md:py-32">
      <Reveal className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">{tr("Products")}</p>
          <h2 className="display-xl mt-4 text-4xl md:text-6xl">
            {tr("Know your price before you print.")}
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            {tr(
              "Configure a product, see the price, the production time and the delivery date on the same screen.",
            )}
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/products">
            {tr("See all products")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </Button>
      </Reveal>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.slice(0, 9).map((p, i) => (
          <Reveal key={p.slug} delay={(i % 3) * 0.08}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
