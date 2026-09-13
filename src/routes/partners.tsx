import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Clock, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";

import { SiteShell } from "@/components/layout/SiteShell";
import { Reveal } from "@/components/motion/Reveal";
import { FaqSection } from "@/components/shared/FaqSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";

const title = "Devenir imprimeur partenaire de Primple";
const description =
  "Recevez des commandes d'impression qualifiées, des fichiers vérifiés avant production et des paiements à échéance claire.";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.lovable.app/partners" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.lovable.app/partners" }],
  }),
  component: PartnersPage,
});

const benefits = [
  {
    icon: TrendingUp,
    title: "Jobs, not leads",
    copy: "Work arrives configured, priced and approved. No quoting marathons.",
  },
  {
    icon: BadgeCheck,
    title: "Files that print",
    copy: "Artwork is checked for resolution, bleed and colours before it reaches your team.",
  },
  {
    icon: Clock,
    title: "Fill idle capacity",
    copy: "Tell us your open slots and we route jobs that fit your presses and turnaround.",
  },
  {
    icon: Wallet,
    title: "Clear payment terms",
    copy: "Customers confirm their order with Primple and arrange a 50% advance on WhatsApp; the balance is paid in cash on delivery. Payment terms with partner printers are agreed case by case.",
  },
];

const faqs = [
  {
    q: "What do you need from us to start?",
    a: "Your equipment list, the products and turnaround you can commit to, and a few samples so we can verify quality.",
  },
  {
    q: "How are jobs routed to us?",
    a: "By capability, capacity, location and rating. Customers can also choose you directly from your profile.",
  },
  {
    q: "Can we keep our own direct customers?",
    a: "Absolutely. Primple is extra capacity utilisation, not an exclusivity agreement.",
  },
  {
    q: "What does it cost to join?",
    a: "Nothing upfront. We take a share of the jobs we bring you, so we only earn when you produce.",
  },
];

function PartnersPage() {
  const { tr } = useI18n();
  return (
    <SiteShell>
      <section className="section-shell py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <Reveal>
            <p className="eyebrow text-primary">{tr("For printers")}</p>
            <h1 className="display-xl mt-4 text-4xl md:text-6xl">
              {tr("Your presses running.")}{" "}
              <span className="display-accent">{tr("Your sales team relieved.")}</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              {tr(
                "Primple sends you print-ready jobs from businesses that confirmed their order and arranged the 50% advance. You do what you do best — produce beautifully, on time.",
              )}
            </p>

            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {benefits.map((b, i) => (
                <Reveal key={b.title} delay={i * 0.05}>
                  <div className="h-full rounded-2xl border border-border bg-card p-6">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15">
                      <b.icon className="size-5" />
                    </span>
                    <h3 className="mt-5 text-lg">{tr(b.title)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {tr(b.copy)}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <form
              className="rounded-3xl border border-border bg-card p-7 shadow-lift lg:sticky lg:top-28"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success(
                  tr("Thanks — our partner team will be in touch within two working days."),
                );
                (e.target as HTMLFormElement).reset();
              }}
            >
              <h2 className="text-xl">{tr("Apply to become a partner")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {tr("Tell us what you print. We'll come back within two working days.")}
              </p>
              <div className="mt-6 space-y-4">
                <Field label="Company name" name="company" />
                <Field label="Contact name" name="contact" />
                <Field label="Email" name="email" type="email" />
                <Field label="City" name="city" />
                <div>
                  <Label htmlFor="capabilities">{tr("What can you produce?")}</Label>
                  <Textarea
                    id="capabilities"
                    name="capabilities"
                    required
                    rows={4}
                    placeholder={tr(
                      "Offset and digital press, large format, finishing, typical turnaround…",
                    )}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <Button type="submit" size="lg" className="mt-6 w-full rounded-full">
                {tr("Send application")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Button>
            </form>
          </Reveal>
        </div>
      </section>

      <FaqSection items={faqs} eyebrow="Partners" title="What printers ask before joining." />

      <section className="section-shell pb-24">
        <div className="rounded-3xl bg-foreground p-10 text-center md:p-16">
          <h2 className="mx-auto max-w-2xl text-3xl text-background md:text-4xl">
            {tr("Let's get your capacity working.")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-background/70">
            {tr("Join the printers already producing for businesses across Morocco.")}
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8 rounded-full px-8">
            <Link to="/login">
              {tr("Create a partner account")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}


function Field({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  const { tr } = useI18n();
  return (
    <div>
      <Label htmlFor={name}>{tr(label)}</Label>
      <Input id={name} name={name} type={type} required className="mt-1.5" />
    </div>
  );
}
