import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero, ContentSection } from "@/components/shared/PageHero";
import { FaqSection } from "@/components/shared/FaqSection";
import { Button } from "@/components/ui/button";
import { PaymentHelpAssistant } from "@/components/payment/PaymentHelpAssistant";
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
      { property: "og:url", content: "https://primple.ma/help" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.ma/help" }],
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
      <div className="section-shell max-w-2xl py-8">
        <PaymentHelpAssistant />
      </div>

      <ContentSection
        title="Popular topics"
        items={[
          {
            title: "Preparing your file",
            body: "Export as PDF with 3mm bleed, 300dpi images and fonts outlined.",
          },
          {
            title: "Payment terms",
            body: "Payment is made in full by card in MAD on our secure checkout, powered by YouCan Pay. Production starts once the payment is confirmed.",
          },
          {
            title: "Delivery times",
            body: "Standard delivery is organized across Morocco for a fixed 30 DH fee. The delivery window is shown before you confirm.",
          },
          {
            title: "Tracking an order",
            body: "Open your dashboard to see the live production stage of every job.",
          },
          {
            title: "Changing an order",
            body: "Contact us before production starts and we'll update the job.",
          },
          {
            title: "Quality issues",
            body: "Send photos within 7 days of delivery and we reprint or refund.",
          },
        ]}
      />

      <FaqSection
        items={[
          {
            q: "How do I pay for an order?",
            a: "Add your print job to the cart, enter your delivery details, then pay the full amount by card in MAD on our secure checkout. YouCan Pay handles the transaction; Primple never stores your card details. Production starts once the payment is confirmed.",
          },
          {
            q: "Can I get a sample before a big run?",
            a: "Yes. Ask for a proof copy on the contact page and we'll quote a single sample before the full run.",
          },
          {
            q: "Do you deliver across Morocco?",
            a: "Yes. Standard delivery is organized nationwide for a fixed 30 DH fee. Express options, when available, are shown separately.",
          },
          {
            q: "What if my artwork fails the check?",
            a: "We tell you exactly what to fix and hold the job until you upload a corrected file — at no extra cost.",
          },
          {
            q: "Can I get an invoice for my company?",
            a: "You can open and print an invoice from your dashboard when the order contains the required billing details.",
          },
        ]}
      />
    </SiteShell>
  );
}
