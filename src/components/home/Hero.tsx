import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Gem, Leaf, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import heroStudioAsset from "@/assets/primple-studio-hero-wide.png.asset.json";

export function Hero() {
  const reduce = useReducedMotion();
  const { t } = useI18n();

  return (
    <section className="relative min-h-[clamp(620px,100svh,900px)] overflow-hidden bg-ink text-ink-foreground lg:min-h-[max(760px,min(100svh,900px))]">
      <img
        src={heroStudioAsset.url}
        alt="Collection de supports imprimés PRIMPLE dans un studio lumineux"
        className="absolute inset-0 size-full object-cover object-[68%_center] sm:object-[60%_center] lg:object-center"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-linear-to-r from-ink/80 via-ink/40 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-ink/25 via-transparent to-ink/10" />

      <div className="relative flex min-h-[clamp(620px,100svh,900px)] items-start px-5 pb-16 pt-[20vh] sm:px-8 lg:min-h-[max(760px,min(100svh,900px))] lg:px-[max(48px,6vw)] lg:pt-[17vh]">
        <div className="relative z-10 w-full max-w-[calc(100%-8px)] lg:max-w-[520px]">

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[13px] font-medium uppercase leading-[1.5] tracking-[0.2em] text-ink-foreground/75 lg:text-[14px]"
          >
            {t("hero.eyebrow")}
          </motion.p>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-4 whitespace-pre-line text-[clamp(32px,8.5vw,44px)] font-bold leading-[0.98] tracking-[-0.045em] text-ink-foreground drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)] md:mt-5 md:text-[clamp(40px,3.4vw,56px)]"
          >
            {t("hero.title")}{"\n"}
            <span className="text-primary">{t("hero.titleAccent")}</span>
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-[480px] text-[16px] leading-[1.5] text-ink-foreground/85 lg:text-[17px]"
          >
            {t("hero.sub")}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-7 flex flex-wrap items-center gap-4"
          >
            <Button asChild size="default" className="h-14 rounded-full px-8 text-[16px]">
              <Link to="/products">
                {t("cta.start")}
                <ArrowRight className="size-4 -rotate-45 rtl:rotate-180" />
              </Link>
            </Button>
            <Button
              asChild
              size="default"
              variant="outline"
              className="h-14 rounded-full border-white/35 bg-white/5 px-8 text-[16px] text-ink-foreground hover:bg-white/12 hover:text-ink-foreground"
            >
              <Link to="/partners">{t("cta.partner")}</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-9 flex max-w-[500px] flex-nowrap gap-x-7 text-left text-[15px] leading-snug text-ink-foreground/85 lg:gap-x-11"
          >
            <span className="flex max-w-[8rem] flex-col items-start gap-3">
              <Gem className="size-8 shrink-0 stroke-[1.25] text-ink-foreground" />
              {t("hero.f1")}
            </span>
            <span className="flex max-w-[8rem] flex-col items-start gap-3">
              <Truck className="size-8 shrink-0 stroke-[1.25] text-ink-foreground" />
              {t("hero.f2")}
            </span>
            <span className="flex max-w-[8rem] flex-col items-start gap-3">
              <Leaf className="size-8 shrink-0 stroke-[1.25] text-ink-foreground" />
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

