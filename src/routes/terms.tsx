import { createFileRoute } from "@tanstack/react-router";

import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/shared/PageHero";
import { LegalBody } from "@/components/shared/LegalBody";

const title = "Terms of Service | Primple";
const description =
  "The terms that apply when you order printing through Primple: orders, 50/50 payment, delivery, reprints and liability.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Legal"
        title="Terms of Service"
        subtitle="These terms apply to every order placed through Primple."
      />
      <LegalBody
        sections={[
          {
            title: "1. Orders",
            body: "An order is confirmed once you complete checkout and the 50% advance is received. We check your artwork before production; if the file cannot be printed correctly we contact you before any press time is used.",
          },
          {
            title: "2. Payment",
            body: "Primple's standard terms are 50% of the order total paid in advance and the remaining 50% paid in cash to the courier on delivery. Production starts only after the advance is received. Orders refused on delivery remain payable for the advance already paid.",
          },
          {
            title: "3. Prices",
            body: "Prices shown at checkout include production and standard delivery unless stated otherwise. Prices may change for future orders but never after an order is confirmed.",
          },
          {
            title: "4. Delivery",
            body: "Estimated production and delivery dates are given in working days. We keep you informed of delays but are not liable for courier delays outside our control.",
          },
          {
            title: "5. Artwork and rights",
            body: "You confirm you hold the rights to the artwork you upload. Artwork is shared only with the printer producing your job.",
          },
          {
            title: "6. Quality and reprints",
            body: "If your order is defective, report it with photos within 7 days of delivery. We reprint or refund the affected items. Differences caused by your supplied file are not covered.",
          },
          {
            title: "7. Cancellations",
            body: "You may cancel free of charge before production starts. Once printing begins, the advance is non-refundable because materials and press time are committed.",
          },
          {
            title: "8. Liability",
            body: "Our liability for any order is limited to the amount paid for that order.",
          },
          {
            title: "9. Contact",
            body: "Questions about these terms: contact@primpel.com.",
          },
        ]}
      />
    </SiteShell>
  );
}
