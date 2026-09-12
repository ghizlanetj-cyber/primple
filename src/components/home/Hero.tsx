import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, CheckCircle2, Star, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import heroStudioAsset from "@/assets/primple-studio-hero.png.asset.json";

export function Hero() {
  const reduce = useReducedMotion();
  const { t } = useI18n();

  return (
    <section className="relative min-h-[780px] overflow-hidden bg-ink text-ink-foreground md:min-h-[min(920px,100svh)]">
      <img
        src={heroStudioAsset.url}
        alt="Collection de supports imprimés PRIMPLE dans un studio lumineux"
        className="absolute inset-0 size-full object-cover object-[62%_center] md:object-center"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-linear-to-r from-ink from-0% via-ink/78 via-34% to-ink/5 to-72% md:via-ink/62 md:via-38%" />
      <div className="absolute inset-0 bg-linear-to-t from-ink/35 via-transparent to-ink/20" />

      <div className="section-shell relative flex min-h-[780px] items-center pb-14 pt-28 md:min-h-[min(920px,100svh)] md:pb-12 md:pt-32">
        <div className="relative z-10 max-w-[35rem] md:max-w-[38rem] lg:max-w-[40rem]">
          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="display-xl max-w-[11ch] text-5xl sm:text-7xl lg:text-[5.25rem]"
          >
            {t("hero.title")} <span className="display-accent">{t("hero.titleAccent")}</span>
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-7 max-w-md text-base leading-relaxed text-ink-foreground/80 md:text-lg"
          >
            {t("hero.sub")}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button asChild size="lg" className="rounded-full px-7">
              <Link to="/products">
                {t("cta.start")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 px-7 text-ink-foreground hover:bg-white/10 hover:text-ink-foreground">
              <Link to="/partners">{t("cta.partner")}</Link>
            </Button>
          </motion.div>

          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-9 grid max-w-xl gap-3 border-t border-white/20 pt-7 text-xs text-ink-foreground/80 sm:grid-cols-3"
          >
            <span className="inline-flex items-center gap-1.5">
               <CheckCircle2 className="size-4 shrink-0 text-primary" />
              {t("hero.f1")}
            </span>
            <span className="inline-flex items-center gap-1.5">
               <Star className="size-4 shrink-0 text-primary" />
              {t("hero.f2")}
            </span>
            <span className="inline-flex items-center gap-1.5">
               <Truck className="size-4 shrink-0 text-primary" />
              {t("hero.f3")}
            </span>
          </motion.p>
        </div>
      </div>
    </section>
  );
}

