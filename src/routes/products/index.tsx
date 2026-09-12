import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, X } from "lucide-react";

import { SiteShell } from "@/components/layout/SiteShell";
import { ProductCard } from "@/components/products/ProductCard";
import { Reveal } from "@/components/motion/Reveal";
import { FinalCta } from "@/components/shared/FinalCta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { products } from "@/data/products";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

/** lowercase, strip accents/diacritics and punctuation so "cartes" matches "Cartes de visite". */
function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u064b-\u0652]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const title = "Produits d'impression : cartes de visite, flyers, packaging | Primple";
const description =
  "Tous les produits imprimés par Primple. Choisissez le format, le papier et la finition, voyez le prix immédiatement et lancez votre commande.";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.lovable.app/products" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.lovable.app/products" }],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { tr } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [],
  );

  // Index the localized (visible) labels plus the English source strings and keywords.
  const searchIndex = useMemo(
    () =>
      new Map(
        products.map((p) => [
          p.slug,
          normalize(
            [
              tr(p.name),
              tr(p.benefit),
              tr(p.category),
              p.name,
              p.benefit,
              p.category,
              p.slug.replace(/-/g, " "),
              p.keywords.join(" "),
            ].join(" "),
          ),
        ]),
      ),
    [tr],
  );

  const terms = normalize(query).split(" ").filter(Boolean);

  const visible = products.filter((p) => {
    const matchesCategory = category === "All" || p.category === category;
    const haystack = searchIndex.get(p.slug) ?? "";
    const matchesQuery = terms.every((term) => haystack.includes(term));
    return matchesCategory && matchesQuery;
  });

  return (
    <SiteShell>
      <section className="section-shell pb-10 pt-14 md:pt-20">
        <Reveal className="max-w-3xl">
           <p className="eyebrow text-primary">{tr("Products")}</p>
          <h1 className="display-xl mt-4 text-4xl md:text-6xl">
             {tr("Everything you print,")} <span className="display-accent">{tr("in one place.")}</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
             {tr("Pick a product, configure it and see the price, production time and delivery date before you commit.")}
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                 placeholder={tr("Search products")}
                 aria-label={tr("Search products")}
                 className="rounded-full ps-10 pe-10"
              />
              {query !== "" && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={tr("Clear search")}
                  className="absolute end-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    category === c
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                   {tr(c)}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 0.06}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="mt-16 text-center" role="status" aria-live="polite">
            <p className="text-muted-foreground">
              {tr("Nothing matches that search. Try a different product name.")}
            </p>
            <Button
              variant="outline"
              className="mt-5 rounded-full"
              onClick={() => {
                setQuery("");
                setCategory("All");
              }}
            >
              {tr("Clear search")}
            </Button>
          </div>
        )}
      </section>

      <FinalCta
        title="Not sure which product fits?"
        copy="Tell us what you need printed and we'll suggest the right format, material and quantity."
        primary={{ label: "Get a printing price", to: "/pricing" }}
        secondary={{ label: "Talk to our team", to: "/partners" }}
      />
    </SiteShell>
  );
}
