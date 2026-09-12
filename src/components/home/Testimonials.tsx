import { Star } from "lucide-react";

import { Reveal } from "@/components/motion/Reveal";
import { useI18n } from "@/i18n";

const testimonials = [
  {
    quote:
      "What used to take three supplier calls now takes us a few minutes. I configure the job, pick the printer and get back to work.",
    name: "Nadia B.",
    role: "Operations Manager, retail group",
  },
  {
    quote:
      "We reorder our menus every season. Two clicks, same setup, new prices — nothing gets lost between us and the printer.",
    name: "Yassine E.",
    role: "Owner, restaurant group",
  },
  {
    quote:
      "The price on screen is the price on the invoice. That alone made the switch worth it for our finance team.",
    name: "Sofia L.",
    role: "Marketing Lead, hotel chain",
  },
];

export function Testimonials() {
  const { tr } = useI18n();
  return (
    <section className="bg-secondary/40 py-20 md:py-28">
      <div className="section-shell">
        <Reveal className="max-w-2xl">
          <p className="eyebrow text-primary">{tr("Customers")}</p>
          <h2 className="mt-4 text-4xl md:text-5xl">{tr("Less back-and-forth. Fewer surprises.")}</h2>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="size-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-base leading-relaxed">
                   “{tr(t.quote)}”
                </blockquote>
                <figcaption className="mt-6 border-t border-border pt-4 text-sm">
                  <span className="font-semibold">{t.name}</span>
                   <span className="block text-muted-foreground">{tr(t.role)}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
