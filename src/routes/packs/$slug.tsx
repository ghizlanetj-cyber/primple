import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Clock, Truck } from "lucide-react";
import { toast } from "sonner";

import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPack,
  packCartSlug,
  packLineMinimum,
  packQuote,
  packLineNeedsQuote,
  serializePackLines,
  type PackLine,
} from "@/data/packs";
import { mad } from "@/lib/format";
import { contact } from "@/config/contact";
import { useCart } from "@/store/cart";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/packs/$slug")({
  loader: ({ params }) => {
    const pack = getPack(params.slug);
    if (!pack) throw notFound();
    return { pack };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Pack introuvable — Primple" }, { name: "robots", content: "noindex" }] };
    }
    const { pack } = loaderData;
    const quote = packQuote(pack.lines);
    const title = `${pack.name} — ${mad(quote.packPrice)} au lieu de ${mad(quote.normalPrice)} | Primple`;
    const description = `${pack.description} Pack complet pour ${pack.audience.toLowerCase()}, 20 % moins cher que les articles commandés séparément.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `https://primple.ma/packs/${params.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `https://primple.ma/packs/${params.slug}` }],
    };
  },
  component: PackPage,
  notFoundComponent: PackNotFound,
});

function PackPage() {
  const { tr, number } = useI18n();
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const { pack } = Route.useLoaderData();

  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(pack.lines.map((l) => [l.ref, l.quantity])),
  );

  const lines: PackLine[] = useMemo(
    () => pack.lines.map((line) => ({ ...line, quantity: quantities[line.ref] ?? line.quantity })),
    [pack, quantities],
  );
  const quote = useMemo(() => packQuote(lines), [lines]);
  const belowMinimum = lines.some((l) => l.quantity < packLineMinimum(pack.slug, l.ref));
  const needsQuote = lines.some(packLineNeedsQuote);
  const quoteHref = `${contact.whatsapp}?text=${encodeURIComponent(
    `${tr("Request a quote")} — ${tr(pack.name)} · ${lines.map((l) => `${tr(l.label)} × ${l.quantity}`).join(" · ")}`,
  )}`;

  const addToCart = () => {
    add({
      slug: packCartSlug(pack),
      name: pack.name,
      quantity: 1,
      selection: { lines: serializePackLines(lines), delivery: "standard" },
      labels: lines.map((l) => ({ group: l.label, value: `${l.quantity} × ${l.label}` })),
      unitPrice: quote.packPrice,
      subtotal: quote.packPrice,
      delivery: 30,
      productionDays: 5,
      deliveryMin: 3,
      deliveryMax: 6,
    });
    toast.success(`${tr(pack.name)} — ${tr("added to your cart.")}`);
    navigate({ to: "/cart" });
  };

  return (
    <SiteShell>
      <section className="section-shell pt-10">
        <nav className="text-sm text-muted-foreground">
          <Link to="/packs" className="hover:text-foreground">
            {tr("Packs")}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{tr(pack.name)}</span>
        </nav>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-primary">{tr(pack.audience)}</p>
            <h1 className="mt-4 text-4xl md:text-5xl">{tr(pack.name)}</h1>
            <p className="mt-5 text-lg text-muted-foreground">{tr(pack.description)}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" />
                {tr("Production")} 5 {tr("days")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Truck className="size-4" />
                {tr("Delivery")} 3–6 {tr("days")}
              </span>
            </div>
          </div>
          <img
            src={pack.image}
            alt={tr(pack.imageAlt)}
            width={1024}
            height={768}
            loading="lazy"
            className="w-full rounded-3xl border border-border object-cover shadow-lift"
          />
        </div>
      </section>

      <section className="section-shell grid gap-8 py-14 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl">{tr("What's in this pack")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tr("Change any quantity — the pack price follows immediately.")}
          </p>
          <ul className="mt-6 divide-y divide-border">
            {quote.lines.map(({ line, subtotal }) => (
              <li key={line.ref} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-semibold">{tr(line.label)}</p>
                  <p className="text-xs text-muted-foreground">
                    {tr("Sold separately")}: {mad(subtotal)}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm" htmlFor={`qty-${line.ref}`}>
                  {tr("Quantity")}
                  <Input
                    id={`qty-${line.ref}`}
                    type="text"
                    inputMode="numeric"
                    value={String(quantities[line.ref] ?? line.quantity)}
                    onChange={(e) => {
                      const next = Math.max(0, Math.floor(Number(e.target.value) || 0));
                      setQuantities((q) => ({ ...q, [line.ref]: next }));
                    }}
                    onBlur={() => {
                      const min = packLineMinimum(pack.slug, line.ref);
                      setQuantities((q) => ({ ...q, [line.ref]: Math.max(min, q[line.ref] ?? min) }));
                    }}
                    aria-describedby={`min-${line.ref}`}
                    className="h-9 w-24 rounded-full text-center"
                  />
                  <span id={`min-${line.ref}`} className="text-xs text-muted-foreground">
                    {tr("Min.")} {number(packLineMinimum(pack.slug, line.ref))}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-6 shadow-lift lg:sticky lg:top-28">
          <p className="eyebrow text-muted-foreground">{tr("Pack price")}</p>
          <p className="mt-2 text-sm text-muted-foreground line-through">{mad(quote.normalPrice)}</p>
          <p className="font-display text-4xl font-extrabold tracking-tight">{mad(quote.packPrice)}</p>
          <p className="mt-2 inline-flex rounded-full bg-success/15 px-3 py-1 text-sm font-semibold text-success">
            {tr("Save 20%")} · {mad(quote.savings)}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {tr("{count} items included, delivery charged once.").replace(
              "{count}",
              number(quote.lines.length),
            )}
          </p>
          {needsQuote && (
            <p className="mt-4 text-sm font-semibold text-primary">
              {tr("These quantities are beyond our listed prices. Send your request and we confirm a price.")}
            </p>
          )}
          <Button
            size="lg"
            className="mt-6 w-full rounded-full"
            onClick={needsQuote ? () => window.open(quoteHref, "_blank", "noopener") : addToCart}
            disabled={belowMinimum}
          >
            {tr(needsQuote ? "Request a quote" : "Add the pack to my cart")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {tr("Secure card payment in MAD · Artwork checked before production")}
          </p>
        </aside>
      </section>
    </SiteShell>
  );
}

function PackNotFound() {
  const { tr } = useI18n();
  return (
    <SiteShell>
      <div className="section-shell py-32 text-center">
        <h1 className="text-4xl">{tr("This pack doesn't exist.")}</h1>
        <Link
          to="/packs"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          {tr("See all packs")}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>
      </div>
    </SiteShell>
  );
}
