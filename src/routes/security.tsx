import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero, ContentSection } from "@/components/shared/PageHero";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const title = "Sécurité et protection des données | Primple";
const description =
  "Comment Primple protège vos fichiers, vos données de compte et vos paiements : chiffrement, contrôle d’accès et confidentialité des imprimeurs.";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.ma/security" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.ma/security" }],
  }),
  component: SecurityPage,
});

function SecurityPage() {
  const { tr } = useI18n();
  return (
    <SiteShell>
      <PageHero
        eyebrow="Sécurité"
        title="Vos fichiers et vos données restent les vôtres."
        subtitle="Vos fichiers sont partagés uniquement avec l’imprimeur chargé de votre travail, et seulement pendant sa réalisation."
      >
        <Button asChild size="lg" variant="outline" className="rounded-full px-7">
          <Link to="/contact">{tr("Ask a security question")}</Link>
        </Button>
      </PageHero>

      <ContentSection
        title="Comment nous protégeons votre travail"
        items={[
          {
            title: "Chiffrement des échanges",
            body: "Chaque importation et chaque chargement de page utilisent HTTPS.",
          },
          {
            title: "Contrôle d’accès",
            body: "Vos commandes et vos fichiers sont accessibles uniquement depuis votre compte.",
          },
          {
            title: "Confidentialité des imprimeurs",
            body: "Les partenaires voient uniquement le travail qu’ils produisent, dans le cadre d’un accord de confidentialité.",
          },
          {
            title: "Sécurité des paiements",
            body: "Primple ne collecte ni ne stocke les données de carte bancaire. Les paiements sont traités en dirhams (MAD) par YouCan Pay sur notre checkout sécurisé.",
          },
          {
            title: "Sauvegardes",
            body: "Les dossiers de commande sont sauvegardés afin de préserver votre historique et vos factures en cas d’incident.",
          },
          {
            title: "Suppression sur demande",
            body: "Demandez-nous de supprimer vos fichiers et les données de votre compte.",
          },
        ]}
      />
    </SiteShell>
  );
}
