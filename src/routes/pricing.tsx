import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { SiteShell } from "@/components/layout/SiteShell";
import { Reveal } from "@/components/motion/Reveal";
import { FaqSection } from "@/components/shared/FaqSection";
import { FinalCta } from "@/components/shared/FinalCta";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

const title = "Pricing — pay for printing, not for software | Primple";
const description =
  "Transparent printing prices with no hidden fees. Free to order, with advanced features for teams and enterprises.";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Starter",
    price: "Free",
    note: "You only pay for what you print.",
    for: "Small businesses and founders",
    features: [
      "Instant pricing on every product",
      "Artwork checks before production",
      "Verified printers with real ratings",
      "Order tracking and delivery updates",
      "Saved configurations for reorders",
    ],
    cta: "Start printing",
    to: "/products" as const,
  },
  {
    name: "Team",
    price: "Included",
    note: "Unlocked once your team orders regularly.",
    for: "Marketing and operations teams",
    features: [
      "Everything in Starter",
      "Approvals and permissions",
      "Brand setups shared across the team",
      "Spend view by team or location",
      "Priority production slots",
      "Named account contact",
    ],
    cta: "Set up my team",
    to: "/platform" as const,
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "Built around your volumes and rules.",
    for: "Groups, franchises and large brands",
    features: [
      "Everything in Team",
      "Contract pricing across printers",
      "Multi-brand and multi-location control",
      "Dedicated production capacity",
      "Onboarding for your own printers",
      "Invoicing on your terms",
    ],
    cta: "Talk to us",
    to: "/partners" as const,
  },
];

const faqs = [
  {
    q: "Is the price I see the price I pay?",
    a: "Yes. Paper, finish, quantity and delivery are all in the number on screen. Nothing appears at checkout.",
  },
  {
    q: "Do you charge a subscription?",
    a: "No. Ordering and the platform are free — we earn on production, so our interest is in you printing well, not in a monthly fee.",
  },
  {
    q: "How do quantity discounts work?",
    a: "Bigger runs cost less per unit and the saving shows live as you change the quantity in any configurator.",
  },
  {
    q: "Can we get contract pricing?",
    a: "Yes, on Enterprise. We agree rates with printers for your volumes so every team pays the same, everywhere.",
  },
];

function PricingPage() {
  const { tr } = useI18n();
  return (
    <SiteShell>
      <section className="section-shell py-16 md:py-24">
        <Reveal className="max-w-3xl">
           <p className="eyebrow text-primary">{tr("Pricing")}</p>
          <h1 className="display-xl mt-4 text-4xl md:text-6xl">
             {tr("Pay for printing.")} <span className="display-accent">{tr("The rest is included.")}</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
             {tr("No subscriptions, no setup fees, no surprises at checkout. The price you configure is the price you pay.")}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.07}>
              <div
                className={cn(
                  "flex h-full flex-col rounded-3xl border p-7",
                  plan.featured
                    ? "border-primary bg-primary/10 shadow-lift"
                    : "border-border bg-card",
                )}
              >
                {plan.featured && (
                  <span className="mb-4 w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                     {tr("Most teams choose this")}
                  </span>
                )}
                 <h2 className="text-xl">{tr(plan.name)}</h2>
                <p className="mt-4 font-display text-4xl font-extrabold tracking-tight">
                   {tr(plan.price)}
                </p>
                 <p className="mt-2 text-sm text-muted-foreground">{tr(plan.note)}</p>
                 <p className="mt-5 text-sm font-semibold">{tr(plan.for)}</p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                       {tr(f)}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  size="lg"
                  variant={plan.featured ? "default" : "outline"}
                  className="mt-7 w-full rounded-full"
                >
                  <Link to={plan.to}>
                     {tr(plan.cta)}
                     <ArrowRight className="size-4 rtl:rotate-180" />
                  </Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <FaqSection items={faqs} eyebrow="Pricing" title="Straight answers about money." />
      <FinalCta />
    </SiteShell>
  );
}
