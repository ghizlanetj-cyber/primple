import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero, ContentSection } from "@/components/shared/PageHero";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const title = "Impression pour entreprises multi-sites | Primple";
const description =
  "Centralisez les commandes d'impression de vos équipes : modèles de marque, validations, facturation consolidée et un interlocuteur dédié.";

export const Route = createFileRoute("/enterprise")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.lovable.app/enterprise" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.lovable.app/enterprise" }],
  }),
  component: EnterprisePage,
});

function EnterprisePage() {
  const { tr } = useI18n();
  return (
    <SiteShell>
      <PageHero
        eyebrow="Enterprise"
        title="One print workflow for every branch, brand and budget."
        subtitle="Give every team the right templates, keep procurement in control, and pay on terms that suit your finance team."
      >
        <Button asChild size="lg" className="rounded-full px-7">
          <Link to="/contact">{tr("Talk to sales")}</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-full px-7">
          <Link to="/pricing">{tr("See pricing")}</Link>
        </Button>
      </PageHero>

      <ContentSection
        title="Built for procurement"
        items={[
          {
            title: "Brand templates",
            body: "Locked layouts so branches order on-brand without design reviews.",
          },
          {
            title: "Approval flows",
            body: "Orders above a threshold wait for the approver you nominate.",
          },
          {
            title: "Consolidated invoicing",
            body: "One monthly invoice across sites, departments and cost centres.",
          },
          {
            title: "Volume pricing",
            body: "Negotiated rates on your recurring products and quantities.",
          },
          {
            title: "Named account manager",
            body: "A single contact for deadlines, escalations and planning.",
          },
          {
            title: "Reporting",
            body: "Spend, lead times and on-time delivery by team and product.",
          },
        ]}
      />

      <ContentSection
        title="Payment terms"
        intro="The standard Primple terms are 50% advance and 50% cash on delivery. Enterprise accounts can request monthly invoicing after a review."
        items={[
          { title: "Standard", body: "50% advance to release production, 50% cash on delivery." },
          { title: "Enterprise", body: "Monthly consolidated invoicing, subject to approval." },
          { title: "Projects", body: "Milestone billing for large or phased campaigns." },
        ]}
      />
    </SiteShell>
  );
}
