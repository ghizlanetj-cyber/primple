import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { packQuote, packs } from "@/data/packs";
import { mad } from "@/lib/format";
import { useI18n } from "@/i18n";

export function PacksTeaser() {
  const { tr } = useI18n();
  const featured = packs.slice(0, 4);

  return (
    <section className="border-y border-border bg-card/50">
      <div className="section-shell py-16 md:py-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="eyebrow text-primary">{tr("New — Packs")}</p>
            <h2 className="mt-3 text-3xl md:text-4xl">
              {tr("Ready-made packs, 20% cheaper.")}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {tr(
                "Each pack bundles the pieces a business really needs and costs 20% less than ordering the same items one by one.",
              )}
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/packs">
              {tr("See all packs")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((pack, i) => {
            const quote = packQuote(pack.lines);
            return (
              <Reveal key={pack.slug} delay={(i % 4) * 0.06}>
                <Link
                  to="/packs/$slug"
                  params={{ slug: pack.slug }}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
                >
                  <img
                    src={pack.image}
                    alt={tr(pack.imageAlt)}
                    width={1024}
                    height={768}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-base font-semibold">{tr(pack.name)}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{tr(pack.audience)}</p>
                    <p className="mt-3 text-xs text-muted-foreground line-through">
                      {mad(quote.normalPrice)}
                    </p>
                    <p className="font-display text-lg font-extrabold">{mad(quote.packPrice)}</p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
