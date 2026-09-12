import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Gem, Leaf, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import heroStudioAsset from "@/assets/primple-studio-hero-wide.png.asset.json";

const benefits = [
  { icon: Gem, key: "hero.f1" as const },
  { icon: Truck, key: "hero.f2" as const },
  { icon: Leaf, key: "hero.f3" as const },
];

export function Hero() {
  const reduce = useReducedMotion();
  const { t } = useI18n();

  return (
    <section className="relative isolate flex min-h-[640px] flex-col overflow-hidden bg-ink text-ink-foreground lg:h-[100svh] lg:min-h-[720px]">
      <img
        src={heroStudioAsset.url}
        alt="Collection de supports imprimés PRIMPLE dans un studio lumineux"
        className="absolute inset-0 -z-10 size-full object-cover object-[64%_center] sm:object-[60%_center] lg:object-[58%_center] 2xl:object-[54%_center]"
        fetchPriority="high"
      />
      {/* Directional overlay: strong on the left for legibility, clear on the right for the products */}
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-ink/85 via-ink/45 to-transparent lg:from-ink/78 lg:via-ink/28 lg:via-55%" />
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-ink/30 via-transparent to-ink/15" />

      <div className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 gap-8 px-5 pb-4 pt-[clamp(112px,18vh,180px)] sm:px-8 lg:grid-cols-[minmax(420px,0.85fr)_minmax(0,1.15fr)] lg:gap-12 lg:px-12 xl:px-16">
        <div className="relative w-full max-w-[600px] self-start xl:max-w-[660px]">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[13px] font-semibold uppercase leading-[1.5] tracking-[0.2em] text-ink-foreground/75 lg:text-[14px]"
          >
            {t("hero.eyebrow")}
          </motion.p>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            style={{ fontSize: "var(--hero-h1)" }}
            className="mt-6 whitespace-pre-line [--hero-h1:clamp(2.625rem,11vw,3.5rem)] font-bold leading-[0.98] tracking-[-0.045em] text-ink-foreground drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)] lg:[--hero-h1:min(max(3.25rem,4.6vw),7.2vh,4.625rem)]"
          >
            {t("hero.title")}
            {"\n"}
            <span className="text-primary">{t("hero.titleAccent")}</span>
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-[500px] text-base leading-[1.5] text-ink-foreground/85 lg:text-[17px]"
          >
            {t("hero.sub")}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-7 flex flex-wrap items-center gap-3.5"
          >
            <Button asChild className="h-13 rounded-full px-8 text-base">
              <Link to="/products">
                {t("cta.start")}
                <ArrowRight className="size-4 -rotate-45 rtl:rotate-180" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-13 rounded-full border-white/35 bg-white/5 px-8 text-base text-ink-foreground hover:bg-white/12 hover:text-ink-foreground"
            >
              <Link to="/partners">{t("cta.partner")}</Link>
            </Button>
          </motion.div>

          <motion.ul
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-10 grid max-w-[520px] grid-cols-3 gap-x-7 text-[15px] leading-[1.35] text-ink-foreground/85 lg:gap-x-8"
          >
            {benefits.map(({ icon: Icon, key }) => (
              <li key={key} className="flex flex-col items-start gap-3">
                <Icon className="size-8 shrink-0 stroke-[1.25] text-ink-foreground" />
                {t(key)}
              </li>
            ))}
          </motion.ul>
        </div>

        <div
          aria-hidden
          className="pointer-events-none hidden self-start justify-self-end text-[0.65rem] uppercase leading-[1.9] tracking-[0.3em] text-ink-foreground/70 lg:block"
        >
          <span className="mb-3 block h-px w-6 bg-ink-foreground/50" />
          Ideas
          <br />
          People
          <br />
          Brands
          <br />
          In print
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden items-center justify-between px-12 pb-7 text-[0.65rem] uppercase tracking-[0.3em] text-ink-foreground/70 lg:flex xl:px-16">
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
    </section>
  );
}
