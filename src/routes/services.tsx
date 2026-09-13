import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero, ContentSection } from "@/components/shared/PageHero";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const title = "Services d'impression pour marques et entreprises | Primple";
const description =
  "Vérification des fichiers, choix des options, suivi de production et livraison : tout ce que Primple prend en charge autour de votre impression.";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.lovable.app/services" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.lovable.app/services" }],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { tr } = useI18n();
  return (
    <SiteShell>
      <PageHero
        eyebrow="Services"
        title="Everything between your file and your front door."
        subtitle="You choose the product. We handle artwork, printer selection, production follow-up and delivery."
      >
        <Button asChild size="lg" className="rounded-full px-7">
          <Link to="/products">{tr("See all products")}</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-full px-7">
          <Link to="/pricing">{tr("See pricing")}</Link>
        </Button>
      </PageHero>

      <ContentSection
        title="Core services"
        items={[
          {
            title: "Artwork preflight",
            body: "Bleed, resolution, fonts and colour profile checked before printing.",
          },
          {
            title: "Printer matching",
            body: "We route your job to the verified partner that fits your deadline and finish.",
          },
          {
            title: "Transparent quoting",
            body: "Production pricing and the fixed 30 DH standard delivery fee are visible before you commit.",
          },
          {
            title: "Production tracking",
            body: "Live stages from approval to quality check inside your dashboard.",
          },
          {
            title: "Tracked delivery",
            body: "Nationwide delivery with expected dates you can plan around.",
          },
          { title: "Reorders", body: "Repeat any past job with the same specs in one click." },
        ]}
      />

      <ContentSection
        title="For larger teams"
        intro="Recurring print, multiple sites or brand control — we adapt the workflow."
        items={[
          {
            title: "Brand templates",
            body: "Locked templates so every branch orders on-brand material.",
          },
          {
            title: "Multi-site delivery",
            body: "One order, several delivery addresses, one invoice.",
          },
          {
            title: "Account management",
            body: "A named contact for deadlines, quotes and escalations.",
          },
        ]}
      />
    </SiteShell>
  );
}
