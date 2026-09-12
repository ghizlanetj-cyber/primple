import { Reveal } from "@/components/motion/Reveal";
import { motion } from "motion/react";
import { useI18n } from "@/i18n";

const steps = [
  {
    n: "01",
    title: "Choose your product",
    copy: "Business cards, packaging, flyers, banners, labels and more.",
  },
  {
    n: "02",
    title: "Configure & upload",
    copy: "Select size, paper, finish and quantity, then upload your artwork.",
  },
  {
    n: "03",
    title: "Compare & choose",
    copy: "See printing options, prices, production times and printer ratings.",
  },
  {
    n: "04",
    title: "Production",
    copy: "Your printer receives the order and keeps you updated.",
  },
  { n: "05", title: "Delivery", copy: "Track your order until it arrives." },
];

export function HowItWorks() {
  const { tr } = useI18n();
  return (
    <section className="bg-secondary/55 py-24 md:py-32">
      <div className="section-shell">
        <Reveal className="max-w-2xl">
          <p className="eyebrow text-primary">{tr("How it works")}</p>
          <h2 className="display-xl mt-4 text-4xl md:text-6xl">{tr("Printing shouldn't take 15 emails.")}</h2>
          <p className="mt-5 text-lg text-muted-foreground">
            {tr("Choose what you need, upload your artwork, choose your printer and let Primpel handle the rest.")}
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
          <div className="grid gap-8 lg:grid-cols-5">
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
