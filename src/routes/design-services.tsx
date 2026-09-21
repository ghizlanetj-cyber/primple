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
  DESIGN_SERVICE_SLUG,
  designBriefEstimate,
  designDeliverableLabels,
  designDeliverables,
  designServiceExcludes,
  designServiceIncludes,
  type DesignBriefInput,
  type DesignDeliverable,
} from "@/data/design-service";
import { mad } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useI18n } from "@/i18n";

const title = "Service de design à 100 MAD / heure | Primple";
const description =
  "Décrivez votre besoin et obtenez une estimation immédiate en heures, facturées 100 MAD par heure. Création de logo et identité de marque non incluses.";

export const Route = createFileRoute("/design-services")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.ma/design-services" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.ma/design-services" }],
  }),
  component: DesignServicesPage,
});

function DesignServicesPage() {
  const { tr, number } = useI18n();
  const navigate = useNavigate();
  const add = useCart((s) => s.add);

  const [deliverable, setDeliverable] = useState<DesignDeliverable>("adaptation");
  const [hasSourceFile, setHasSourceFile] = useState(true);
  const [formats, setFormats] = useState(1);
  const [pages, setPages] = useState(1);
  const [brief, setBrief] = useState("");
  const [date, setDate] = useState("");
  const [urgent, setUrgent] = useState(false);

  const input: DesignBriefInput = { deliverable, hasSourceFile, formats, pages, brief, urgent };
  const quote = useMemo(
    () => designBriefEstimate(input),
    [deliverable, hasSourceFile, formats, pages, brief, urgent],
  );

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
        deliverable,
        sourceFile: hasSourceFile ? "yes" : "no",
        formats: String(formats),
        pages: String(pages),
        urgent: urgent ? "yes" : "no",
        brief: brief.trim().slice(0, 1000),
        ...(date ? { date } : {}),
      },
      labels: [
        { group: "Deliverable", value: designDeliverableLabels[deliverable] },
        { group: "Estimated hours", value: `${quote.hours} h` },
        { group: "Final formats", value: String(formats) },
        { group: "Pages or sides", value: String(pages) },
        { group: "Editable source file", value: hasSourceFile ? "Yes" : "No" },
        ...(urgent ? [{ group: "Urgent", value: "Within 48 hours" }] : []),
        ...(date ? [{ group: "Preferred date", value: date }] : []),
      ],
      unitPrice: DESIGN_HOURLY_RATE,
      subtotal: quote.subtotal,
      delivery: 0,
      productionDays: urgent ? 1 : 2,
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
            "Describe what you need and see the estimated hours and price update instantly, before you order.",
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
            <h2 className="text-xl">{tr("Tell us about your project")}</h2>

            <fieldset className="mt-5 border-0 p-0">
              <legend className="text-sm font-semibold">{tr("What do you need?")}</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {designDeliverables.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDeliverable(value)}
                    aria-pressed={deliverable === value}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-start text-sm font-medium transition-colors",
                      deliverable === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/50",
                    )}
                  >
                    {tr(designDeliverableLabels[value])}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-6 border-0 p-0">
              <legend className="text-sm font-semibold">
                {tr("Do you have an editable source file?")}
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {[true, false].map((value) => (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => setHasSourceFile(value)}
                    aria-pressed={hasSourceFile === value}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                      hasSourceFile === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/50",
                    )}
                  >
                    {value ? tr("Yes") : tr("No")}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="design-formats">{tr("Number of final formats")}</Label>
                <Input
                  id="design-formats"
                  type="number"
                  min={1}
                  max={50}
                  value={formats}
                  onChange={(e) => setFormats(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="design-pages">{tr("Number of pages or sides")}</Label>
                <Input
                  id="design-pages"
                  type="number"
                  min={1}
                  max={200}
                  value={pages}
                  onChange={(e) => setPages(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="mt-6">
              <Label htmlFor="design-brief">{tr("What do you need designed?")}</Label>
              <Textarea
                id="design-brief"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={5}
                className="mt-1.5"
                placeholder={tr("For example: adapt my A5 flyer to A4 and prepare it for printing.")}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {tr("The more detail you give, the more accurate the estimate.")}
              </p>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="design-date">{tr("Preferred start date")}</Label>
                <Input
                  id="design-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div className="flex items-end">
                <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={urgent}
                    onChange={(e) => setUrgent(e.target.checked)}
                    className="size-4 accent-[hsl(var(--primary))]"
                  />
                  {tr("I need it within 48 hours")}
                </label>
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-6 shadow-lift lg:sticky lg:top-28">
          <p className="eyebrow text-muted-foreground">{tr("Your instant estimate")}</p>
          <p className="mt-2 font-display text-4xl font-extrabold tracking-tight">
            {mad(quote.total)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {tr("Estimated")} {number(quote.hours)} h × {mad(DESIGN_HOURLY_RATE)}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {tr("No delivery fee: this service is delivered as files.")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {tr("If your project turns out to need less time, you only pay the hours used.")}
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
