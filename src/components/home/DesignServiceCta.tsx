import { Link } from "@tanstack/react-router";
import { ArrowRight, PenTool } from "lucide-react";

import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { DESIGN_HOURLY_RATE } from "@/data/design-service";
import { mad } from "@/lib/format";
import { useI18n } from "@/i18n";

export function DesignServiceCta() {
  const { tr } = useI18n();
  return (
    <section className="section-shell py-16 md:py-20">
      <Reveal className="flex flex-col gap-6 rounded-3xl border border-border bg-secondary/50 p-8 md:flex-row md:items-center md:justify-between md:p-10">
        <div className="max-w-2xl">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/15">
            <PenTool className="size-5 text-primary" />
          </span>
          <h2 className="mt-4 text-2xl md:text-3xl">
            {tr("No print-ready file? Book a designer for")} {mad(DESIGN_HOURLY_RATE)}{" "}
            {tr("an hour.")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {tr(
              "Layout, format adaptation and print file preparation. Logo creation and brand identity are not included.",
            )}
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0 rounded-full">
          <Link to="/design-services">
            {tr("Book design time")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </Button>
      </Reveal>
    </section>
  );
}
