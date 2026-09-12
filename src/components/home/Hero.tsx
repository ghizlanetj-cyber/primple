import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, CheckCircle2, Star, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import heroStudioAsset from "@/assets/primple-studio-hero-wide.png.asset.json";

export function Hero() {
  const reduce = useReducedMotion();
  const { t } = useI18n();

  return (
    <section className="relative min-h-[780px] overflow-hidden bg-ink text-ink-foreground md:min-h-[min(920px,100svh)]">
      <img
        src={heroStudioAsset.url}
        alt="Collection de supports imprimés PRIMPLE dans un studio lumineux"
        className="absolute inset-0 size-full object-cover object-center"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-linear-to-r from-ink/55 via-ink/10 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-ink/30 via-transparent to-ink/15" />

      <div className="section-shell relative flex min-h-[780px] items-center pb-24 pt-28 md:min-h-[min(920px,100svh)] md:pb-24 md:pt-36">
        <div className="relative z-10 max-w-[35rem] md:max-w-[38rem] lg:max-w-[42rem]">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[0.7rem] font-medium uppercase leading-relaxed tracking-[0.28em] text-ink-foreground/75"
          >
            {t("hero.eyebrow")}
          </motion.p>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="display-xl mt-6 max-w-[12ch] text-5xl leading-[0.92] tracking-tight sm:text-7xl lg:text-[5.5rem]"
          >
            {t("hero.title")} <span className="display-accent">{t("hero.titleAccent")}</span>
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-7 max-w-md text-base leading-relaxed text-ink-foreground/85 md:text-lg"
          >
            {t("hero.sub")}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to="/products">
                {t("cta.start")}
                <ArrowRight className="size-4 -rotate-45 rtl:rotate-180" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/35 bg-white/5 px-8 text-ink-foreground hover:bg-white/12 hover:text-ink-foreground"
            >
              <Link to="/partners">{t("cta.partner")}</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-12 flex max-w-xl flex-wrap gap-x-10 gap-y-6 text-xs leading-snug text-ink-foreground/85"
          >
            <span className="flex max-w-[7.5rem] flex-col gap-3">
              <Gem className="size-6 shrink-0 stroke-[1.25] text-ink-foreground" />
              {t("hero.f1")}
            </span>
            <span className="flex max-w-[7.5rem] flex-col gap-3">
              <Truck className="size-6 shrink-0 stroke-[1.25] text-ink-foreground" />
              {t("hero.f2")}
            </span>
            <span className="flex max-w-[7.5rem] flex-col gap-3">
              <Leaf className="size-6 shrink-0 stroke-[1.25] text-ink-foreground" />
              {t("hero.f3")}
            </span>
          </motion.div>
        </div>

        <div className="pointer-events-none absolute end-6 top-28 z-10 hidden text-[0.65rem] uppercase leading-[1.9] tracking-[0.3em] text-ink-foreground/70 lg:block">
          <span className="mb-3 block h-px w-6 bg-ink-foreground/50" />
          Ideas
          <br />
          People
          <br />
          Brands
          <br />
          In print
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 hidden items-center justify-between px-6 text-[0.65rem] uppercase tracking-[0.3em] text-ink-foreground/70 lg:flex">
          <span className="mx-auto flex items-center gap-4">
            Print <span className="h-px w-8 bg-ink-foreground/40" /> People{" "}
            <span className="h-px w-8 bg-ink-foreground/40" /> Possibility
          </span>
          <span className="text-end leading-[1.8]">
            Primple
            <br />
            <span className="text-[0.6rem] tracking-[0.22em] text-ink-foreground/60">A brighter printed tomorrow</span>
          </span>
        </div>
      </div>
    </section>
  );
}

