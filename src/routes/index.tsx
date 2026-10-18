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
import { FaqSection } from "@/components/shared/FaqSection";
import { FinalCta } from "@/components/shared/FinalCta";
import { useI18n } from "@/i18n";

const title = "Imprime en ligne sans te déplacer | Primple Maroc";
const description =
  "Commande tes cartes de visite, menus, flyers et packs en ligne, quand tu veux. Aide au design et livraison partout au Maroc avec Primple.";

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
    "q": "Can I order in the evening or at the weekend?",
    "a": "Yes. Place your order online at any time. Production, delivery and our team's replies follow their working schedules."
  },
  {
    "q": "Can you help if I don't have a design?",
    "a": "Yes. Upload your print-ready file, or choose design help. The price is shown before you confirm. Logo creation and brand identity are not included."
  },
  {
    "q": "Where do you deliver?",
    "a": "We deliver across Morocco, to your home or your business. Delivery costs and the estimated timeframe are shown with your order."
  },
  {
    "q": "How can I pay?",
    "a": "Pay in full by card, bank transfer or Cash Plus. For payment on delivery, pay a 50% advance by card, bank transfer or Cash Plus, then the remaining 50% in cash on delivery. Our team must confirm bank transfer and Cash Plus payments before production starts."
  }
];


function Home() {
  const { lang, tr } = useI18n();

  useEffect(() => {
    const localizedTitle =
      lang === "en" ? "Print online without the trips | Primple Morocco" : lang === "ar" ? "الطباعة أونلاين فالمغرب | Primple" : title;
    const localizedDescription =
      lang === "en"
        ? "Order business cards, menus, flyers and business packs online whenever you want. Design help and delivery across Morocco with Primple."
        : lang === "ar"
          ? "طلب كارت فيزيت، مينو، فلايرات وباكات أونلاين. مساعدة فالديزاين وتوصيل فالمغرب كامل مع Primple."
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
      <FaqSection items={faqs} title="Questions before printing" />
      <FinalCta />
    </SiteShell>
  );
}
