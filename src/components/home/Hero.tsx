import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, CheckCircle2, Star, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

export function Hero() {
  const reduce = useReducedMotion();
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 size-[36rem] rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-64 size-[28rem] rounded-full bg-secondary blur-3xl"
      />

      <div className="section-shell relative py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="display-xl mt-6 text-5xl sm:text-6xl lg:text-7xl"
          >
            {t("hero.title")} <span className="display-accent">{t("hero.titleAccent")}</span>
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
          >
            {t("hero.sub")}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Button asChild size="lg" className="rounded-full px-7">
              <Link to="/products">
                {t("cta.start")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7">
              <Link to="/partners">{t("cta.partner")}</Link>
            </Button>
          </motion.div>

          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-success" />
              {t("hero.f1")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="size-4 text-primary" />
              {t("hero.f2")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Truck className="size-4 text-foreground/60" />
              {t("hero.f3")}
            </span>
          </motion.p>
        </div>
      </div>
    </section>
  );
}

