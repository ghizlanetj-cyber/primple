import { createFileRoute } from "@tanstack/react-router";

import { SiteShell } from "@/components/layout/SiteShell";
import { Hero } from "@/components/home/Hero";

import { Stats } from "@/components/home/Stats";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Categories } from "@/components/home/Categories";

import { PlatformBridge } from "@/components/home/PlatformBridge";
import { PartnerTeaser } from "@/components/home/PartnerTeaser";
import { Testimonials } from "@/components/home/Testimonials";
import { FaqSection } from "@/components/shared/FaqSection";
import { FinalCta } from "@/components/shared/FinalCta";
import { useI18n } from "@/i18n";

const title = "Primpel — Order professional printing without the back-and-forth";
const description =
  "Configure printing, get an instant price, choose a verified printer and track production to delivery. Business cards, packaging, flyers, labels and more.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Primpel",
          description,
          url: "/",
        }),
      },
    ],
  }),
  component: Home,
});

const faqs = [
  {
    q: "How does Primpel work?",
    a: "Choose your product, configure it, upload your artwork, choose a printer and place your order. You see the price, production time and delivery date before you pay.",
  },
  {
    q: "Can I choose my printer?",
    a: "Yes, where multiple verified partners are available you compare their price, production time, rating and location and pick the one you want.",
  },
  {
    q: "Can I order again?",
    a: "Yes. Reorder previous products directly from your dashboard with the same configuration and artwork — change the quantity if you need to.",
  },
  {
    q: "Can I request a custom quote?",
    a: "Yes. Request a quote when your project needs custom specifications, and compare the offers printers send back.",
  },
  {
    q: "Can I track my order?",
    a: "Yes. Follow artwork approval, production, quality check and delivery from your dashboard.",
  },
  {
    q: "What if there is a problem with my order?",
    a: "Report an issue from the order page. Our team reviews it with your printer within one working day and arranges a reprint or refund where the fault is ours.",
  },
];

function Home() {
  const { tr } = useI18n();
  return (
    <SiteShell>
      <h1 className="sr-only">
         {tr("Primpel — the online printing marketplace and printing management platform")}
      </h1>
      <Hero />
      
      <Stats />
      <HowItWorks />
      <Categories />
      
      <PlatformBridge />
      <PartnerTeaser />
      <Testimonials />
      <FaqSection items={faqs} />
      <FinalCta />
    </SiteShell>
  );
}
