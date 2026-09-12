import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, CheckCircle2, Star, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { productImages } from "@/data/productImages";
import { useI18n } from "@/i18n";

export function Hero() {
  const reduce = useReducedMotion();
  const { t } = useI18n();

  return (
    <section className="relative min-h-[min(900px,100svh)] overflow-hidden bg-ink text-ink-foreground">
      <div className="section-shell relative grid min-h-[min(900px,100svh)] items-center gap-14 pb-20 pt-32 md:pt-40 lg:grid-cols-[0.86fr_1.14fr] lg:gap-16">
        <div className="relative z-10 max-w-2xl">
          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="display-xl text-6xl sm:text-7xl lg:text-[5.4rem]"
          >
            {t("hero.title")} <span className="display-accent">{t("hero.titleAccent")}</span>
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-7 max-w-xl text-lg leading-relaxed text-ink-muted md:text-xl"
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
            className="mt-9 grid gap-3 border-t border-white/10 pt-7 text-sm text-ink-muted sm:grid-cols-3"
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

        <motion.div
          initial={reduce ? false : { opacity: 0, x: 24, scale: 1.03 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="relative min-h-[430px] lg:min-h-[610px]"
        >
          <div className="absolute inset-0 overflow-hidden rounded-2xl border border-white/10 bg-card/5 shadow-lift">
            <img
              src={productImages.packaging}
              alt=""
              className="premium-image size-full object-cover opacity-95"
            />
            <div className="absolute inset-0 bg-linear-to-r from-ink/25 via-transparent to-transparent" />
          </div>
          <div className="absolute -bottom-5 -left-5 w-[48%] overflow-hidden rounded-xl border border-white/15 bg-card p-2 shadow-lift sm:-left-8">
            <img
              src={productImages["business-cards"]}
              alt=""
              className="premium-image aspect-[4/3] w-full rounded-lg object-cover"
            />
          </div>
          <div className="absolute -right-3 -top-4 w-[34%] overflow-hidden rounded-xl border border-white/15 bg-card p-2 shadow-lift sm:-right-7">
            <img
              src={productImages.brochures}
              alt=""
              className="premium-image aspect-[4/3] w-full rounded-lg object-cover"
            />
          </div>
          <div className="glass-panel absolute bottom-5 right-5 rounded-full px-5 py-3 text-xs font-semibold text-ink-foreground">
            {t("hero.f2")}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

