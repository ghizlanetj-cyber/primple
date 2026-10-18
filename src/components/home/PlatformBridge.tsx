import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Focus, Truck, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const cards = [
  { icon: Clock, title: "Order on your schedule.", copy: "Evenings, weekends or between appointments: place your order online whenever it suits you." },
  { icon: Focus, title: "Stay focused on your business.", copy: "No more trips to place your print order. Spend that time on your customers and your ideas." },
  { icon: Truck, title: "Your print, delivered to you.", copy: "We deliver your printed materials across Morocco, to your home or your business." },
  { icon: ShieldCheck, title: "Quality that represents your brand.", copy: "Our team checks print quality and helps you when you need guidance." },
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
            {tr("Your business moves forward. Your printing does too.")}
          </h2>
          <p className="mt-6 text-lg text-ink-muted">
            {tr(
              "Less time managing your printing. More time bringing your ideas to life.",
            )}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
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
              {tr("Explore products")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
