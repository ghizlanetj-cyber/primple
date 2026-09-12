import { Counter } from "@/components/motion/Counter";
import { Reveal } from "@/components/motion/Reveal";
import { useI18n } from "@/i18n";

const stats = [
  { to: 300, suffix: "+", label: "Businesses printing with Primpel" },
  { to: 15, suffix: "+", label: "Verified print partners" },
  { to: 3000, suffix: "+", label: "Orders produced and delivered" },
  { to: 98, suffix: "%", label: "Customer satisfaction" },
];

export function Stats() {
  const { tr } = useI18n();
  return (
    <section className="section-shell py-16 md:py-20">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08}>
            <p className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              <Counter to={s.to} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{tr(s.label)}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
