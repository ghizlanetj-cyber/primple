import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { SiteShell } from "@/components/layout/SiteShell";
import { Hero } from "@/components/home/Hero";

import { Stats } from "@/components/home/Stats";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Categories } from "@/components/home/Categories";
import { PacksTeaser } from "@/components/home/PacksTeaser";
import { DesignServiceCta } from "@/components/home/DesignServiceCta";

import { PlatformBridge } from "@/components/home/PlatformBridge";
import { Testimonials } from "@/components/home/Testimonials";
import { FaqSection } from "@/components/shared/FaqSection";
import { FinalCta } from "@/components/shared/FinalCta";
import { useI18n } from "@/i18n";

const title = "Impression professionnelle et personnalisée au Maroc | Primple";
const description =
  "Cartes de visite, flyers, brochures, étiquettes : configurez votre impression, voyez le prix et le délai avant de commander, et suivez la production jusqu'à la livraison.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://primple.ma/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.ma/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Primple",
          description,
          url: "https://primple.ma/",
        }),
      },
    ],
  }),
  component: Home,
});

const faqs = [
  {
    q: "How do I order a print on Primple?",
    a: "Choose your product, set the format, paper, finish and quantity, upload your file and confirm. The price, production time and delivery date are shown before payment.",
  },
  {
    q: "I don't know which paper or finish to choose. Can you help?",
    a: "Each paper and finish is described where you select it, with its effect on price and production time. If you still hesitate, send us your project and we go through the options with you.",
  },
  {
    q: "How do I know how much my print will cost?",
    a: "The price updates as you configure your product, so you see the total for your exact options and quantity before ordering.",
  },
  {
    q: "How do I prepare my file for printing?",
    a: "Send a print-ready PDF with your artwork at final size. If your file needs adjusting, we tell you what to change before production starts.",
  },
  {
    q: "Can I order a custom format or material?",
    a: "Yes. Request a quote with your specifications and we come back with the options and the price for your project.",
  },
  {
    q: "Can I follow my order?",
    a: "Yes. From your account you follow artwork approval, production and delivery for each order.",
  },
  {
    q: "Can I reorder the same print?",
    a: "Yes. Reorder a previous job with the same configuration and file, and change the quantity if you need to.",
  },
];

function Home() {
  const { lang, tr } = useI18n();

  useEffect(() => {
    const localizedTitle =
      lang === "en" ? "Professional and custom printing in Morocco | Primple" : title;
    const localizedDescription =
      lang === "en"
        ? "Business cards, flyers, brochures and labels: configure your print, see the price and lead time, and track production through delivery."
        : description;

    document.title = localizedTitle;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", localizedDescription);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", localizedTitle);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", localizedDescription);
  }, [lang]);

  return (
    <SiteShell>
      <p className="sr-only">
        {tr(
          "Primple — professional and custom printing for brands, businesses and creatives in Morocco",
        )}
      </p>
      <Hero />
      <Categories />
      <PacksTeaser />
      <HowItWorks />
      <DesignServiceCta />
      <Stats />
      <PlatformBridge />
      <Testimonials />
      <FaqSection items={faqs.slice(0, 4)} title="Questions before printing" />
      <FinalCta />
    </SiteShell>
  );
}
