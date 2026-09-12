import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero, ContentSection } from "@/components/shared/PageHero";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const title = "Security & data protection | Primple";
const description =
  "How Primple protects your artwork, account data and payments — encryption, access control and printer confidentiality.";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/security" }],
  }),
  component: SecurityPage,
});

function SecurityPage() {
  const { tr } = useI18n();
  return (
    <SiteShell>
      <PageHero
        eyebrow="Security"
        title="Your files and your data stay yours."
        subtitle="Artwork is shared only with the printer producing your job, and only for as long as the job runs."
      >
        <Button asChild size="lg" variant="outline" className="rounded-full px-7">
          <Link to="/contact">{tr("Ask a security question")}</Link>
        </Button>
      </PageHero>

      <ContentSection
        title="How we protect your work"
        items={[
          { title: "Encrypted in transit", body: "Every upload and page load runs over HTTPS." },
          { title: "Access control", body: "Your orders and files are readable only by your account." },
          { title: "Printer confidentiality", body: "Partners see only the job they produce, under a confidentiality agreement." },
          { title: "Payment safety", body: "Card details for the 50% advance are handled by our payment processor, never stored by us." },
          { title: "Backups", body: "Order records are backed up so your history and invoices survive incidents." },
          { title: "Deletion on request", body: "Ask us and we remove your artwork and account data." },
        ]}
      />
    </SiteShell>
  );
}
