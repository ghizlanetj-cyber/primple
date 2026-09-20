import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { SiteShell } from "@/components/layout/SiteShell";
import { Reveal } from "@/components/motion/Reveal";
import { packQuote, packs } from "@/data/packs";
import { mad } from "@/lib/format";
import { useI18n } from "@/i18n";

const title = "Packs d'impression pour votre activité | Primple";
const description =
  "Des packs prêts à commander pour les nouvelles entreprises, salons, restaurants, e-commerce et chantiers : 20 % moins cher que les articles achetés séparément.";

export const Route = createFileRoute("/packs/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.lovable.app/packs" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.lovable.app/packs" }],
  }),
  component: PacksPage,
});

function PacksPage() {
  const { tr } = useI18n();
  return (
    <SiteShell>
      <section className="section-shell pb-10 pt-24 md:py-20">
        <p className="eyebrow text-primary">{tr("Packs")}</p>
        <h1 className="mt-4 text-4xl md:text-5xl">{tr("Everything your business prints, in one pack.")}</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          {tr(
            "Each pack bundles the pieces a business really needs and costs 20% less than ordering the same items one by one.",
          )}
        </p>
      </section>

      <section className="section-shell pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack, i) => {
            const quote = packQuote(pack.lines);
            return (
              <Reveal key={pack.slug} delay={(i % 3) * 0.06}>
                <Link
                  to="/packs/$slug"
                  params={{ slug: pack.slug }}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-secondary/60 p-2">
                    <img
                      src={pack.image}
                      alt={tr(pack.imageAlt)}
                      width={1024}
                      height={768}
                      loading="lazy"
                      className="premium-image size-full rounded-lg object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="text-xl">{tr(pack.name)}</h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">{tr(pack.audience)}</p>
                    <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
                      <div>
                        <p className="text-xs text-muted-foreground line-through">
                          {mad(quote.normalPrice)}
                        </p>
                        <p className="font-display text-lg font-extrabold">{mad(quote.packPrice)}</p>
                      </div>
                      <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                        {tr("Save 20%")}
                      </span>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold group-hover:text-primary">
                      {tr("See what's inside")}
                      <ArrowRight className="size-4 rtl:rotate-180" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>
    </SiteShell>
  );
}
