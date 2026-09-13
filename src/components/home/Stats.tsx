import { CircleDollarSign, ListChecks, PackageCheck, SlidersHorizontal } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { useI18n } from "@/i18n";

const benefits = [
  { icon: CircleDollarSign, title: "Transparent prices", body: "See the product price and delivery fee before confirming." },
  { icon: SlidersHorizontal, title: "Options explained", body: "Understand papers, formats and finishes while you choose." },
  { icon: ListChecks, title: "Order tracking", body: "Follow artwork approval, production and delivery from your account." },
  { icon: PackageCheck, title: "Delivery organized in Morocco", body: "A clear delivery window and one fixed 30 DH standard fee." },
];

export function Stats() {
  const { tr } = useI18n();
  return (
    <section className="band-sand border-y border-border py-16 md:py-24">
      <div className="section-shell">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-primary">{tr("Why Primple")}</p>
          <h2 className="mt-4 text-3xl md:text-5xl">{tr("Why brands choose Primple")}</h2>
          <p className="mt-4 text-muted-foreground">{tr("Clear choices, visible costs and a process that stays easy to follow.")}</p>
        </Reveal>
        <div className="mt-10 grid border-y border-border sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map(({ icon: Icon, title, body }, i) => (
          <Reveal
            key={title}
            delay={i * 0.08}
            className="border-b border-border px-1 py-8 sm:px-6 lg:border-b-0 lg:border-e first:sm:ps-0 last:lg:border-e-0"
          >
            <Icon className="size-6 text-primary" />
            <h3 className="mt-5 text-lg">{tr(title)}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{tr(body)}</p>
          </Reveal>
        ))}
        </div>
      </div>
    </section>
  );
}
