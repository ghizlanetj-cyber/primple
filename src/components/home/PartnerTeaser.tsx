import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const benefits = [
  "Qualified orders from businesses ready to print",
  "Digital quotations instead of phone calls",
  "Production, payments and customers in one dashboard",
  "Get paid on a schedule you can plan around",
];

export function PartnerTeaser() {
  const { tr } = useI18n();
  return (
    <section className="section-shell py-24 md:py-32">
      <div className="grid items-center gap-12 border-y border-border py-12 md:py-16 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow text-primary">{tr("For print partners")}</p>
          <h2 className="display-xl mt-4 text-4xl md:text-6xl">
            {tr("More customers. Less time chasing them.")}
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            {tr(
              "Join the Primple network and receive qualified printing orders from businesses looking for reliable production partners.",
            )}
          </p>
          <Button asChild size="lg" className="mt-8 rounded-full px-7">
            <Link to="/partners">
              {tr("Become a Print Partner")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        </Reveal>

        <Reveal delay={0.12}>
          <ul className="space-y-2 rounded-xl bg-secondary/70 p-3">
            {benefits.map((b) => (
              <li key={b} className="flex gap-3 rounded-lg bg-card p-4 text-sm">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/25">
                  <Check className="size-3" />
                </span>
                {tr(b)}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
