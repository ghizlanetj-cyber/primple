import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Clock, Star, Truck } from "lucide-react";

import { SiteShell } from "@/components/layout/SiteShell";
import { Configurator } from "@/components/products/Configurator";
import { ProductCard } from "@/components/products/ProductCard";
import { Reveal } from "@/components/motion/Reveal";
import { FaqSection } from "@/components/shared/FaqSection";
import { getProduct, products } from "@/data/products";
import { productImages } from "@/data/productImages";
import { mad } from "@/lib/format";
import { useI18n } from "@/i18n";
import { productPhrases } from "@/i18n/product-translations";
import { phrases } from "@/i18n/translations";

export const Route = createFileRoute("/products/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Produit introuvable — Primple" }, { name: "robots", content: "noindex" }],
      };
    }
    const { product } = loaderData;
    const name = productPhrases[product.name]?.fr ?? phrases[product.name]?.fr ?? product.name;
    const title = `Impression ${name.toLowerCase()} sur mesure — à partir de ${mad(product.fromPrice)} | Primple`;
    const description = `${name} sur mesure : formats, papiers, finitions et quantités au choix. Prix et délai affichés avant la commande, production suivie jusqu'à la livraison.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `https://primple.lovable.app/products/${params.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `https://primple.lovable.app/products/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name,
            description,
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: product.rating,
              reviewCount: product.reviews,
            },
            offers: {
              "@type": "Offer",
              price: product.fromPrice,
              priceCurrency: "MAD",
            },
          }),
        },
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: ProductNotFound,
});

function ProductPage() {
  const { tr } = useI18n();
  const { product } = Route.useLoaderData();
  const related = products.filter((p) => p.slug !== product.slug).slice(0, 3);

  return (
    <SiteShell>
      <section className="section-shell pt-10">
        <nav className="text-sm text-muted-foreground">
          <Link to="/products" className="hover:text-foreground">
            {tr("Products")}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{tr(product.name)}</span>
        </nav>

        <div className="mt-8 grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow text-primary">{tr(product.category)}</p>
            <h1 className="mt-4 text-4xl md:text-5xl">{tr(product.heroHeadline)}</h1>
            <p className="mt-5 text-lg text-muted-foreground">{tr(product.heroCopy)}</p>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <span className="font-display text-lg font-extrabold">
                {tr("From")} {mad(product.fromPrice)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-4" />
                {tr("Production from")} {product.baseProductionDays}{" "}
                {tr(product.baseProductionDays === 1 ? "day" : "days")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Truck className="size-4" />
                {tr("Delivery")} 1–5 {tr("days")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Star className="size-4 fill-primary text-primary" />
                {product.rating} · {product.reviews} {tr("reviews")}
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <img
              src={productImages[product.slug]}
              alt={`${tr(product.name)} — Primple`}
              width={800}
              height={600}
              className="w-full rounded-3xl border border-border object-cover shadow-lift"
            />
          </Reveal>
        </div>
      </section>

      <section className="section-shell py-14">
        <Configurator product={product} />
      </section>

      <section className="border-y border-border bg-card/50">
        <div className="section-shell grid gap-10 py-16 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <h2 className="text-3xl">{tr("Why businesses print this with Primple")}</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {tr(product.description)}
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "The price on screen is the price you pay",
                "Artwork checked before production starts",
                "Verified partners with real ratings",
                "Reorder the same setup in a few clicks",
              ].map((b) => (
                <li key={b} className="flex gap-2 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {tr(b)}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <FaqSection
        items={product.faqs}
        eyebrow={tr(product.name)}
        title={`${tr(product.name)} — ${tr("good to know")}`}
      />

      <section className="section-shell pb-24">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl">{tr("Often printed together")}</h2>
          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-sm font-semibold hover:text-primary"
          >
            {tr("All products")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}

function ProductNotFound() {
  const { tr } = useI18n();
  return (
    <SiteShell>
      <div className="section-shell py-32 text-center">
        <h1 className="text-4xl">{tr("We don't print this product yet.")}</h1>
        <p className="mt-4 text-muted-foreground">
          {tr("Browse all our products or request a custom quote.")}
        </p>
        <Link
          to="/products"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          {tr("View all products")}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>
      </div>
    </SiteShell>
  );
}
