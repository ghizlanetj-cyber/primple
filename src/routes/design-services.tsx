import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, X } from "lucide-react";
import { toast } from "sonner";

import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DESIGN_HOURLY_RATE,
  DESIGN_MAX_HOURS,
  DESIGN_MIN_HOURS,
  DESIGN_SERVICE_SLUG,
  designServiceExcludes,
  designServiceIncludes,
  designServiceQuote,
} from "@/data/design-service";
import { mad } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useI18n } from "@/i18n";

const title = "Service de design à 100 MAD / heure | Primple";
const description =
  "Mise en page, adaptation de format et préparation de fichiers d'impression, facturées 100 MAD par heure. Création de logo et identité de marque non incluses.";

export const Route = createFileRoute("/design-services")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.lovable.app/design-services" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.lovable.app/design-services" }],
  }),
  component: DesignServicesPage,
});

function DesignServicesPage() {
  const { tr, number } = useI18n();
  const navigate = useNavigate();
  const add = useCart((s) => s.add);

  const [hours, setHours] = useState(2);
  const [brief, setBrief] = useState("");
  const [date, setDate] = useState("");

  const quote = useMemo(() => designServiceQuote(hours), [hours]);

  const addToCart = () => {
    if (brief.trim().length < 10) {
      toast.error(tr("Tell us in a sentence or two what you need designed."));
      return;
    }
    add({
      slug: DESIGN_SERVICE_SLUG,
      name: "Design Service",
      quantity: quote.hours,
      selection: {
        hours: String(quote.hours),
        brief: brief.trim().slice(0, 1000),
        ...(date ? { date } : {}),
      },
      labels: [
        { group: "Hours", value: `${quote.hours} h` },
        ...(date ? [{ group: "Preferred date", value: date }] : []),
      ],
      unitPrice: DESIGN_HOURLY_RATE,
      subtotal: quote.subtotal,
      delivery: 0,
      productionDays: 2,
      deliveryMin: 1,
      deliveryMax: 3,
    });
    toast.success(tr("Design time added to your cart."));
    navigate({ to: "/cart" });
  };

  return (
    <SiteShell>
      <section className="section-shell pb-10 pt-24 md:py-20">
        <p className="eyebrow text-primary">{tr("Design service")}</p>
        <h1 className="mt-4 text-4xl md:text-5xl">
          {tr("A designer on your file, for 100 MAD an hour.")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          {tr(
            "Book the exact number of hours you need. We lay out, adapt and prepare your artwork so it prints the way you expect.",
          )}
        </p>
      </section>

      <section className="section-shell grid gap-8 pb-24 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl">{tr("What this service covers")}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {designServiceIncludes.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  {tr(item)}
                </li>
              ))}
            </ul>
            <h3 className="mt-7 text-sm font-semibold">{tr("Not included")}</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              {designServiceExcludes.map((item) => (
                <li key={item} className="flex gap-2">
                  <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                  {tr(item)}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-muted-foreground">
              {tr(
                "Branding, brand strategy and logo creation are separate projects — tell us about them on the contact page.",
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl">{tr("Book your design hours")}</h2>

            <fieldset className="mt-5 border-0 p-0">
              <legend className="text-sm font-semibold">{tr("Hours")}</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: DESIGN_MAX_HOURS }, (_, i) => i + DESIGN_MIN_HOURS).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHours(h)}
                    aria-pressed={hours === h}
                    className={
                      hours === h
                        ? "rounded-full border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        : "rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:border-primary/50"
                    }
                  >
                    {number(h)} h
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-6">
              <Label htmlFor="design-brief">{tr("What do you need designed?")}</Label>
              <Textarea
                id="design-brief"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={4}
                className="mt-1.5"
                placeholder={tr("For example: adapt my A5 flyer to A4 and prepare it for printing.")}
              />
            </div>

            <div className="mt-5 max-w-xs">
              <Label htmlFor="design-date">{tr("Preferred start date")}</Label>
              <Input
                id="design-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-6 shadow-lift lg:sticky lg:top-28">
          <p className="eyebrow text-muted-foreground">{tr("Your price")}</p>
          <p className="mt-2 font-display text-4xl font-extrabold tracking-tight">
            {mad(quote.total)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {number(quote.hours)} h × {mad(DESIGN_HOURLY_RATE)}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {tr("No delivery fee: this service is delivered as files.")}
          </p>
          <Button size="lg" className="mt-6 w-full rounded-full" onClick={addToCart}>
            {tr("Add design time to my cart")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
        </aside>
      </section>
    </SiteShell>
  );
}
