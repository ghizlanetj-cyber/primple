import { useI18n } from "@/i18n";
import { contact } from "@/config/contact";

export function LegalBody({ sections }: { sections: { title: string; body: string }[] }) {
  const { tr } = useI18n();
  const translateLegalText = (text: string) => tr(text).replace("{contactEmail}", contact.email);
  return (
    <section className="section-shell py-16 md:py-24">
      <div className="max-w-3xl space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-xl">{tr(section.title)}</h2>
            <p className="mt-3 text-muted-foreground">{translateLegalText(section.body)}</p>
          </div>
        ))}
        <p className="border-t border-border pt-6 text-sm text-muted-foreground">
          {tr("Last updated")}: {new Date().getFullYear()}
        </p>
      </div>
    </section>
  );
}
