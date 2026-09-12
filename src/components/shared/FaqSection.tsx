import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/motion/Reveal";
import { useI18n } from "@/i18n";

export function FaqSection({
  items,
  eyebrow,
  title,
}: {
  items: { q: string; a: string }[];
  eyebrow?: string;
  title?: string;
}) {
  const { tr } = useI18n();
  return (
    <section className="section-shell py-24 md:py-32">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <p className="eyebrow text-primary">{tr(eyebrow ?? "FAQ")}</p>
          <h2 className="display-xl mt-4 text-4xl md:text-6xl">
            {tr(title ?? "Questions before you print.")}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Accordion type="single" collapsible className="w-full">
            {items.map((item, i) => (
              <AccordionItem key={item.q} value={`item-${i}`}>
                <AccordionTrigger className="text-start font-display text-base font-bold">
                  {tr(item.q)}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  {tr(item.a)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
