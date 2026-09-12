import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero, ContentSection } from "@/components/shared/PageHero";
import { FaqSection } from "@/components/shared/FaqSection";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const title = "Designers : imprimez les projets de vos clients avec Primple";
const description =
  "Faites imprimer les projets de vos clients via Primple : vous gardez votre marge, nous gérons la production, la qualité et la livraison.";

export const Route = createFileRoute("/designers")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.lovable.app/designers" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.lovable.app/designers" }],
  }),
  component: DesignersPage,
});

function DesignersPage() {
  const { tr } = useI18n();
  return (
    <SiteShell>
      <PageHero
        eyebrow="For designers"
        title="Design it. We'll print it, check it and deliver it."
        subtitle="Freelancers and studios use Primple to produce client work without chasing printers, quotes or couriers."
      >
        <Button asChild size="lg" className="rounded-full px-7">
          <Link to="/signup" search={{ role: "designer" }}>
            {tr("Create a designer account")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-full px-7">
          <Link to="/products">{tr("Browse products")}</Link>
        </Button>
      </PageHero>

      <ContentSection
        title="Why designers work with us"
        items={[
          {
            title: "Keep your margin",
            body: "Quote your client at your price; you pay the Primple production price.",
          },
          {
            title: "Preflight on every file",
            body: "We catch bleed, resolution and colour issues before the press runs.",
          },
          {
            title: "Client-ready delivery",
            body: "Ship straight to your client with tracked delivery and your name on the job.",
          },
          {
            title: "Predictable deadlines",
            body: "Production in 2–3 working days on most products.",
          },
          { title: "One dashboard", body: "Every client job, quote and invoice in one place." },
          {
            title: "Simple payment",
            body: "50% advance to start production, 50% cash on delivery.",
          },
        ]}
      />

      <FaqSection
        eyebrow="Designer FAQ"
        title="Questions before you sign up."
        items={[
          {
            q: "Can I deliver directly to my client?",
            a: "Yes. Set your client's address as the delivery address and we ship straight to them.",
          },
          {
            q: "Do you show Primple branding on the delivery?",
            a: "Deliveries are neutral. Your client receives the printed work, not our marketing.",
          },
          {
            q: "What file formats do you accept?",
            a: "Print-ready PDF is best. We also accept AI, INDD packages and high-resolution PNG or TIFF.",
          },
          {
            q: "Can I order a sample first?",
            a: "Yes, ask for a proof copy and we'll quote a single sample before the run.",
          },
        ]}
      />

      <section className="section-shell pb-24">
        <div className="surface-card p-8 text-center md:p-12">
          <h2 className="text-3xl">{tr("Start your next client job with Primple.")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            {tr("Create your designer account in a minute — no subscription, no minimum volume.")}
          </p>
          <Button asChild size="lg" className="mt-7 rounded-full px-7">
            <Link to="/signup" search={{ role: "designer" }}>
              {tr("Create a designer account")}
            </Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
