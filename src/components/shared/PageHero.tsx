import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { useI18n } from "@/i18n";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  const { tr } = useI18n();
  return (
    <div className="band-sand border-b border-border">
      <div className="section-shell py-16 md:py-24">
        <Reveal>
          <p className="eyebrow text-primary">{tr(eyebrow)}</p>
          <h1 className="display-xl mt-4 max-w-3xl text-4xl sm:text-5xl md:text-6xl">
            {tr(title)}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{tr(subtitle)}</p>
          {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
        </Reveal>
      </div>
    </div>
  );
}

export function ContentSection({
  title,
  intro,
  items,
}: {
  title: string;
  intro?: string;
  items: { title: string; body: string }[];
}) {
  const { tr } = useI18n();
  return (
    <section className="section-shell py-16 md:py-24">
      <Reveal>
        <h2 className="text-3xl md:text-4xl">{tr(title)}</h2>
        {intro && <p className="mt-4 max-w-2xl text-muted-foreground">{tr(intro)}</p>}
      </Reveal>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <Reveal key={item.title} delay={i * 0.05}>
            <div className="surface-card h-full p-6">
              <h3 className="text-lg">{tr(item.title)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{tr(item.body)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
