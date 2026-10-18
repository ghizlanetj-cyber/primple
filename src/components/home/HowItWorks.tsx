import { Reveal } from "@/components/motion/Reveal";
import { motion } from "motion/react";
import { useI18n } from "@/i18n";

const steps = [
  {
    n: "01",
    title: "Choose your print",
    copy: "Find the product or pack that fits your business.",
  },
  {
    n: "02",
    title: "Make it yours",
    copy: "Choose your format, finish and quantity. See your total before confirming.",
  },
  {
    n: "03",
    title: "Add your file or get design help",
    copy: "Upload your artwork, or ask our team to help with the design.",
  },
  {
    n: "04",
    title: "Receive your printed materials",
    copy: "We handle printing and delivery. Follow your order from your account.",
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
            {tr("From your idea to your doorstep.")}
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            {tr(
              "One online order. Your printing taken care of, without the trips.",
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
