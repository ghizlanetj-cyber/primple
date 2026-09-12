import { Link } from "@tanstack/react-router";
import { ArrowRight, Factory, LayoutDashboard, Plug, Store } from "lucide-react";
import { motion } from "motion/react";

import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const cards = [
  {
    icon: Store,
    title: "A simpler process",
    copy: "Configure, order and follow your print without chasing anyone by phone.",
  },
  {
    icon: LayoutDashboard,
    title: "Prices you can see",
    copy: "The price, the production time and the delivery date appear before you order.",
  },
  {
    icon: Plug,
    title: "Guidance on your options",
    copy: "Paper, finish, format: each option is explained where you choose it.",
  },
  {
    icon: Factory,
    title: "Printing that carries your brand",
    copy: "Reorder the same setup so your materials stay consistent over time.",
  },
  {
    icon: LayoutDashboard,
    title: "Orders you can follow",
    copy: "Artwork approval, production, delivery: every stage is visible from your account.",
  },
  {
    icon: Store,
    title: "Custom projects welcome",
    copy: "Specific format or material? Send your project and we work out the options with you.",
  },
];

export function PlatformBridge() {
  const { tr } = useI18n();
  return (
    <section className="relative overflow-hidden bg-ink py-24 text-ink-foreground md:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-primary/60 shadow-glow"
      />
      <div className="section-shell relative">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-primary">{tr("Why Primple")}</p>
          <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl">
            {tr("A print partner, not just a supplier.")}
          </h2>
          <p className="mt-6 text-lg text-ink-muted">
            {tr(
              "Ideas, design, print, physical impact — the same workflow from first question to delivered box.",
            )}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="h-full rounded-xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/20">
                  <c.icon className="size-5 text-primary" />
                </span>
                <h3 className="mt-5 text-lg text-ink-foreground">{tr(c.title)}</h3>
                <p className="mt-2 text-sm text-ink-muted">{tr(c.copy)}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <Button asChild size="lg" className="mt-12 rounded-full px-7">
            <Link to="/products">
              {tr("Get a price")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
