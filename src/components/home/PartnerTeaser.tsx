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
    <section className="section-shell py-20 md:py-28">
      <div className="grid items-center gap-12 rounded-3xl border border-border bg-card p-8 shadow-soft md:p-12 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow text-primary">{tr("For print partners")}</p>
          <h2 className="mt-4 text-4xl md:text-5xl">{tr("More customers. Less time chasing them.")}</h2>
          <p className="mt-5 text-lg text-muted-foreground">
            {tr("Join the Primpel network and receive qualified printing orders from businesses looking for reliable production partners.")}
          </p>
          <Button asChild size="lg" className="mt-8 rounded-full px-7">
            <Link to="/partners">
              {tr("Become a Print Partner")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        </Reveal>

        <Reveal delay={0.12}>
          <ul className="space-y-4 rounded-2xl bg-secondary/60 p-6">
            {benefits.map((b) => (
              <li key={b} className="flex gap-3 text-sm">
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
