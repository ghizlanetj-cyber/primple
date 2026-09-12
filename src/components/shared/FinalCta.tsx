import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

export function FinalCta({
  title = "Your next print job starts here.",
  copy = "Get a price, choose your options and start printing in minutes.",
  primary = { label: "Start Printing", to: "/products" },
  secondary = { label: "Explore Products", to: "/products" },
}: {
  title?: string;
  copy?: string;
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string };
}) {
  const { tr } = useI18n();
  return (
     <section className="section-shell pb-24 pt-8 md:pb-32">
      <Reveal>
         <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-secondary px-8 py-16 text-center md:px-16 md:py-24">
          <div
            aria-hidden
             className="pointer-events-none absolute bottom-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-primary shadow-glow"
          />
          <div className="relative mx-auto max-w-2xl">
             <h2 className="display-xl text-4xl md:text-5xl lg:text-6xl">{tr(title)}</h2>
            <p className="mt-5 text-lg text-foreground/70">{tr(copy)}</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link to={primary.to}>
                  {tr(primary.label)}
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <Link to={secondary.to}>{tr(secondary.label)}</Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
