import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Boxes, FileCheck2, Layers, Repeat, Users } from "lucide-react";

import { SiteShell } from "@/components/layout/SiteShell";
import { Reveal } from "@/components/motion/Reveal";
import { FaqSection } from "@/components/shared/FaqSection";
import { FinalCta } from "@/components/shared/FinalCta";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const title = "Gérer toutes vos impressions depuis un seul espace | Primple";
const description =
  "Validations, configurations enregistrées, suivi de production, dépenses et recommandes : pilotez toutes vos impressions au même endroit.";

export const Route = createFileRoute("/platform")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.ma/platform" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.ma/platform" }],
  }),
  component: PlatformPage,
});

const capabilities = [
  {
    icon: Layers,
    title: "Saved brand setups",
    copy: "Your papers, finishes and sizes stored once. Every reorder comes out identical.",
  },
  {
    icon: FileCheck2,
    title: "Artwork checks and approvals",
    copy: "Files reviewed before production, with a clear approval step for whoever signs off.",
  },
  {
    icon: Boxes,
    title: "Live production tracking",
    copy: "See which printer has the job, what stage it's at and when it lands.",
  },
  {
    icon: BarChart3,
    title: "Spend you can explain",
    copy: "Every order, invoice and budget in one view — by team, brand or location.",
  },
  {
    icon: Users,
    title: "Teams and permissions",
    copy: "Let people order what they need without losing control of the brand or the budget.",
  },
  {
    icon: Repeat,
    title: "One-click reorders",
    copy: "Past jobs become templates. Restocking takes seconds instead of emails.",
  },
];

const workflow = [
  { step: "Request", copy: "Anyone on the team requests a print job from a saved setup." },
  { step: "Approve", copy: "The right person approves the file, quantity and budget." },
  { step: "Produce", copy: "The job goes to a verified printer with capacity today." },
  { step: "Track", copy: "Production and delivery update themselves until it arrives." },
];

const faqs = [
  {
    q: "Do we need to change how we work today?",
    a: "No. Most teams start with one product and one approver, then bring in more people once they trust the flow.",
  },
  {
    q: "Can we keep our current printer?",
    a: "Yes. We can onboard a printer you already trust so they receive jobs through Primple alongside our verified partners.",
  },
  {
    q: "How do approvals work with multiple brands or locations?",
    a: "Each brand or location gets its own saved setups, approvers and budget view, all inside the same account.",
  },
  {
    q: "What does it cost?",
    a: "The platform is included when you order through Primple. Larger teams can add enterprise features — see pricing.",
  },
];

function PlatformPage() {
  const { tr } = useI18n();
  return (
    <SiteShell>
      <section className="section-shell py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <Reveal>
            <p className="eyebrow text-primary">{tr("The platform")}</p>
            <h1 className="display-xl mt-4 text-4xl md:text-6xl">
              {tr("Printing stops being a chase.")}{" "}
              <span className="display-accent">{tr("It becomes a process.")}</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              {tr(
                "Primple is where your team requests, approves, tracks and reorders printing — with the production side already handled.",
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link to="/login">
                  {tr("Set up my team")}
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <Link to="/pricing">{tr("See pricing")}</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-lift">
              <p className="eyebrow text-muted-foreground">{tr("Demonstration preview")}</p>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Awaiting approval", value: "3 requests", tone: "primary" },
                  { label: "In production", value: "5 jobs", tone: "muted" },
                  { label: "Arriving", value: "2 deliveries", tone: "muted" },
                  { label: "Spend this month", value: "18,420 MAD", tone: "muted" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-xl border border-border bg-background p-4"
                  >
                    <span className="text-sm text-muted-foreground">{tr(row.label)}</span>
                    <span className="font-display text-sm font-bold">{tr(row.value)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                {tr("Illustrative preview — demonstration data, not customer data.")}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="band-sand border-y border-border">
        <div className="section-shell py-20 md:py-28">
          <Reveal>
            <h2 className="max-w-2xl text-3xl md:text-4xl">
              {tr("Everything a team needs to keep printing consistent.")}
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.05}>
                <div className="h-full rounded-2xl border border-border bg-background p-6">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15">
                    <c.icon className="size-5 text-foreground" />
                  </span>
                  <h3 className="mt-5 text-lg">{tr(c.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tr(c.copy)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell py-20 md:py-28">
        <Reveal>
          <p className="eyebrow text-primary">{tr("The workflow")}</p>
          <h2 className="mt-4 max-w-2xl text-3xl md:text-4xl">
            {tr("Four steps, every single time.")}
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {workflow.map((w, i) => (
            <Reveal key={w.step} delay={i * 0.06}>
              <div className="border-t-2 border-primary pt-5">
                <p className="font-display text-sm font-bold text-muted-foreground">0{i + 1}</p>
                <h3 className="mt-2 text-lg">{tr(w.step)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tr(w.copy)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <FaqSection items={faqs} eyebrow="Platform" title="What teams ask us first." />
      <FinalCta />
    </SiteShell>
  );
}
