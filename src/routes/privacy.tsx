import { createFileRoute } from "@tanstack/react-router";

import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/shared/PageHero";
import { LegalBody } from "@/components/shared/LegalBody";

const title = "Privacy Policy | Primpel";
const description =
  "What personal data Primpel collects, why we collect it, who we share it with and how you can have it deleted.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle="What we collect, why we collect it, and how to have it removed."
      />
      <LegalBody
        sections={[
          {
            title: "Data we collect",
            body: "Account details (name, email), order details (products, delivery address, phone) and the artwork you upload. We also keep basic usage data to keep the service reliable.",
          },
          {
            title: "Why we use it",
            body: "To produce and deliver your orders, to keep your order history and invoices available, and to answer your messages.",
          },
          {
            title: "Who we share it with",
            body: "The printer producing your job receives only what is needed to print and deliver it. Couriers receive delivery details. Payment processors handle the 50% advance. We never sell your data.",
          },
          {
            title: "How long we keep it",
            body: "Order records are kept for accounting purposes. Artwork is removed on request once a job is delivered.",
          },
          {
            title: "Your rights",
            body: "You can ask for a copy of your data, correct it, or ask us to delete your account and files. Write to contact@primpel.com.",
          },
          {
            title: "Cookies",
            body: "We use essential cookies to keep you signed in and to remember your cart and language.",
          },
        ]}
      />
    </SiteShell>
  );
}
