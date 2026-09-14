import { createFileRoute } from "@tanstack/react-router";

import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/shared/PageHero";
import { LegalBody } from "@/components/shared/LegalBody";

const title = "Politique de confidentialité | Primple";
const description =
  "Les données personnelles collectées par Primple, leur utilisation, leur partage et la procédure pour demander leur suppression.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.lovable.app/privacy" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.lovable.app/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Mentions légales"
        title="Politique de confidentialité"
        subtitle="Ce que nous collectons, pourquoi nous le collectons et comment demander sa suppression."
      />
      <LegalBody
        sections={[
          {
            title: "Données que nous collectons",
            body: "Les informations du compte (nom, e-mail), les informations de commande (produits, adresse de livraison, téléphone) et les fichiers que vous importez. Nous conservons également des données d’utilisation élémentaires pour assurer la fiabilité du service.",
          },
          {
            title: "Pourquoi nous les utilisons",
            body: "Pour produire et livrer vos commandes, mettre à votre disposition l’historique de vos commandes et vos factures, et répondre à vos messages.",
          },
          {
            title: "Avec qui nous les partageons",
            body: "The printer handling your job receives only what is needed for printing and delivery. Couriers receive delivery details. Payments are processed by YouCan Pay on Primple's secure checkout; no card details are collected or stored on this website. We never sell your data.",
          },
          {
            title: "Durée de conservation",
            body: "Les dossiers de commande sont conservés à des fins comptables. Les fichiers sont supprimés sur demande une fois le travail livré.",
          },
          {
            title: "Vos droits",
            body: "You may request a copy or correction of your data, or ask us to delete your account and files. Write to {contactEmail}.",
          },
          {
            title: "Cookies",
            body: "Nous utilisons des cookies essentiels pour maintenir votre connexion et mémoriser votre panier et votre langue.",
          },
        ]}
      />
    </SiteShell>
  );
}
