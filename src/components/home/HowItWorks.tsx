import { Reveal } from "@/components/motion/Reveal";
import { motion } from "motion/react";
import { useI18n } from "@/i18n";

const steps = [
  {
    n: "01",
    title: "Describe your project",
    copy: "Tell us what you want to print. We show you the products that fit.",
  },
  {
    n: "02",
    title: "Choose your options",
    copy: "Format, paper, finish, quantity — with the price updated as you go.",
  },
  {
    n: "03",
    title: "Validate your print",
    copy: "Send your file and confirm. You know the price and the timeline before ordering.",
  },
  {
    n: "04",
    title: "Receive your order",
    copy: "Production starts, you follow each stage until delivery.",
  },
];

export function HowItWorks() {
  const { tr } = useI18n();
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="section-shell">
        <Reveal className="max-w-2xl">
          <p className="eyebrow text-primary">{tr("Four steps to your print")}</p>
          <h2 className="display-xl mt-4 text-4xl md:text-6xl">
            {tr("Printing shouldn't become a second project.")}
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            {tr(
              "Choosing the right material, understanding finishes, comparing options, preparing files, waiting for the result. Primple makes each step simple.",
            )}
          </p>
        </Reveal>

        <div className="relative mt-14">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-6 hidden h-px bg-border lg:block"
          />
          <motion.div
            aria-hidden
            className="absolute left-0 top-6 hidden h-px bg-primary lg:block"
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
          />
          <div className="grid gap-8 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div className="relative">
                  <span className="relative z-10 flex size-12 items-center justify-center rounded-full border border-border bg-card font-display text-sm font-bold shadow-soft">
                    {s.n}
                  </span>
                  <h3 className="mt-5 text-lg">{tr(s.title)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{tr(s.copy)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
