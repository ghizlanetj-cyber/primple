import { Link } from "@tanstack/react-router";
import { ArrowRight, Factory, LayoutDashboard, Plug, Store } from "lucide-react";
import { motion } from "motion/react";

import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const cards = [
  {
    icon: Store,
    title: "Marketplace",
    copy: "Find verified printers, receive competitive offers and track production from one workspace.",
  },
  {
    icon: LayoutDashboard,
    title: "Production & Orders",
    copy: "Manage jobs, quotations and invoices without spreadsheets.",
  },
  {
    icon: Factory,
    title: "For Printers",
    copy: "Manage pricing, production, customers and payments from one dashboard.",
  },
  {
    icon: Plug,
    title: "Enterprise & API",
    copy: "Connect Primpel to your existing systems and automate printing workflows at scale.",
  },
];

export function PlatformBridge() {
  const { tr } = useI18n();
  return (
    <section className="relative overflow-hidden bg-ink py-24 text-ink-foreground md:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 size-[40rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="section-shell relative">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-primary">{tr("The platform underneath")}</p>
          <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl">
            {tr("More than ordering. This is how printing gets run.")}
          </h2>
          <p className="mt-6 text-lg text-ink-muted">
            {tr("Behind every order is a system built for production management, quoting, payments and growth — for businesses and printers alike.")}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
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
            <Link to="/platform">
              {tr("See the full platform")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
