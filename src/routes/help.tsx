import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero, ContentSection } from "@/components/shared/PageHero";
import { FaqSection } from "@/components/shared/FaqSection";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const title = "Aide : fichiers, délais, livraison et suivi de commande | Primple";
const description =
  "Réponses sur la préparation des fichiers, le paiement, les délais de production et le suivi de vos commandes d'impression Primple.";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/help" }],
  }),
  component: HelpPage,
});

function HelpPage() {
  const { tr } = useI18n();
  return (
    <SiteShell>
      <PageHero
        eyebrow="Help Center"
        title="Answers before, during and after your print run."
        subtitle="Artwork rules, payment terms, delivery windows and what to do if something looks wrong."
      >
        <Button asChild size="lg" className="rounded-full px-7">
          <Link to="/contact">{tr("Contact support")}</Link>
        </Button>
      </PageHero>

      <ContentSection
        title="Popular topics"
        items={[
          { title: "Preparing your file", body: "Export as PDF with 3mm bleed, 300dpi images and fonts outlined." },
          { title: "Payment terms", body: "Pay 50% when you order, and the remaining 50% in cash on delivery." },
          { title: "Delivery times", body: "Most jobs are produced in 2–3 working days and delivered within 5." },
          { title: "Tracking an order", body: "Open your dashboard to see the live production stage of every job." },
          { title: "Changing an order", body: "Contact us before production starts and we'll update the job." },
          { title: "Quality issues", body: "Send photos within 7 days of delivery and we reprint or refund." },
        ]}
      />

      <FaqSection
        items={[
          { q: "How does the 50/50 payment work?", a: "You pay 50% of the total when you place the order, which releases your job to the printer. The remaining 50% is paid in cash to the courier on delivery." },
          { q: "Can I get a sample before a big run?", a: "Yes. Ask for a proof copy on the contact page and we'll quote a single sample before the full run." },
          { q: "Do you deliver across Morocco?", a: "Yes, we deliver nationwide with tracked courier partners." },
          { q: "What if my artwork fails the check?", a: "We tell you exactly what to fix and hold the job until you upload a corrected file — at no extra cost." },
          { q: "Can I get an invoice for my company?", a: "Every order generates an invoice you can download from your dashboard." },
        ]}
      />
    </SiteShell>
  );
}
