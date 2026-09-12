import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero, ContentSection } from "@/components/shared/PageHero";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const title = "About Primpel | Printing without the back-and-forth";
const description =
  "Primpel connects Moroccan businesses with verified print partners: transparent prices, checked artwork and tracked delivery.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { tr } = useI18n();
  return (
    <SiteShell>
      <PageHero
        eyebrow="About us"
        title="We made printing as simple as ordering anything else."
        subtitle="Primpel is a printing marketplace built in Casablanca. We compare verified printers, show the real price up front and follow every job to your door."
      >
        <Button asChild size="lg" className="rounded-full px-7">
          <Link to="/products">{tr("Start Printing")}</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-full px-7">
          <Link to="/contact">{tr("Talk to us")}</Link>
        </Button>
      </PageHero>

      <ContentSection
        title="What we believe"
        intro="Three principles shape every decision we make."
        items={[
          {
            title: "Prices you can trust",
            body: "Every quote includes production and delivery. No surprise plate fees, no late add-ons.",
          },
          {
            title: "Printers we verify",
            body: "Partners join only after we check equipment, samples and delivery record.",
          },
          {
            title: "Visibility end to end",
            body: "From artwork check to courier handover, you always know where your job is.",
          },
        ]}
      />

      <ContentSection
        title="How Primpel works"
        items={[
          { title: "1. Configure", body: "Pick your product, paper, finish and quantity and see the price move live." },
          { title: "2. Upload artwork", body: "We check bleed, resolution and colour before anything reaches a press." },
          { title: "3. We match a printer", body: "Your job goes to the verified partner best placed for the deadline." },
          { title: "4. Pay 50% now", body: "A 50% advance releases production; the remaining 50% is cash on delivery." },
          { title: "5. Track production", body: "Live stages from artwork approval to quality check." },
          { title: "6. Delivered", body: "Tracked delivery across Morocco, with reorder in one click." },
        ]}
      />
    </SiteShell>
  );
}
