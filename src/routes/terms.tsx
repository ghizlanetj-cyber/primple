import { createFileRoute } from "@tanstack/react-router";

import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/shared/PageHero";
import { LegalBody } from "@/components/shared/LegalBody";

const title = "Conditions d’utilisation | Primple";
const description =
  "Les conditions applicables à vos commandes Primple : commande, paiement 50/50, livraison, réimpression et responsabilité.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.lovable.app/terms" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.lovable.app/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Mentions légales"
        title="Conditions d’utilisation"
        subtitle="Ces conditions s’appliquent à toute commande passée via Primple."
      />
      <LegalBody
        sections={[
          {
            title: "1. Commandes",
            body: "Une commande est confirmée lorsque vous terminez le paiement et que l’acompte de 50 % est reçu. Nous contrôlons votre fichier avant la production ; s’il ne peut pas être imprimé correctement, nous vous contactons avant toute utilisation de la presse.",
          },
          {
            title: "2. Paiement",
            body: "Les conditions standard de Primple prévoient le paiement à l’avance de 50 % du total de la commande, puis le règlement des 50 % restants en espèces au livreur lors de la livraison. La production commence uniquement après réception de l’acompte. En cas de refus de la commande à la livraison, l’acompte déjà versé reste dû.",
          },
          {
            title: "3. Prix",
            body: "Les prix affichés lors du paiement comprennent la production et la livraison standard, sauf indication contraire. Les prix peuvent changer pour de futures commandes, mais jamais après la confirmation d’une commande.",
          },
          {
            title: "4. Livraison",
            body: "Les délais estimés de production et de livraison sont indiqués en jours ouvrés. Nous vous informons des retards, mais ne sommes pas responsables des retards du transporteur qui échappent à notre contrôle.",
          },
          {
            title: "5. Fichiers et droits",
            body: "Vous confirmez détenir les droits sur les fichiers que vous importez. Ces fichiers sont partagés uniquement avec l’imprimeur chargé de votre travail.",
          },
          {
            title: "6. Qualité et réimpressions",
            body: "Si votre commande est défectueuse, signalez-le avec des photos dans les 7 jours suivant la livraison. Nous réimprimons ou remboursons les articles concernés. Les différences causées par le fichier que vous avez fourni ne sont pas couvertes.",
          },
          {
            title: "7. Annulations",
            body: "Vous pouvez annuler sans frais avant le début de la production. Une fois l’impression commencée, l’acompte n’est pas remboursable, car les matières et le temps de presse sont engagés.",
          },
          {
            title: "8. Responsabilité",
            body: "Notre responsabilité pour toute commande est limitée au montant payé pour cette commande.",
          },
          {
            title: "9. Contact",
            body: "Pour toute question concernant ces conditions : contact@primpel.com.",
          },
        ]}
      />
    </SiteShell>
  );
}
