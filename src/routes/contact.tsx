import { useServerFn } from "@tanstack/react-start";
import { submitContactMessage } from "@/lib/contact.functions";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/shared/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contact } from "@/config/contact";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";

const title = "Contact | Parlez de votre projet d'impression avec Primple";
const description =
  "Une impression à préparer, un devis à obtenir ou un projet sur mesure ? Écrivez à l'équipe Primple à Casablanca, réponse sous un jour ouvré.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.ma/contact" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.ma/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { tr } = useI18n();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submitContact = useServerFn(submitContactMessage);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await submitContact({
        data: {
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          company: String(form.get("company") ?? ""),
          topic: String(form.get("topic") ?? "other"),
          message: String(form.get("message") ?? ""),
          website: String(form.get("website") ?? ""),
        },
      });
      setSent(true);
      toast.success(tr("Message sent. We reply within one working day."));
    } catch {
      toast.error(tr("We couldn't send your message. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteShell>
      <PageHero
        eyebrow="Contact"
        title="Tell us what you need printed."
        subtitle="Quotes, artwork questions, large orders or partnerships — we answer within one working day."
      />

      <section className="section-shell grid gap-10 py-16 lg:grid-cols-[1.2fr_1fr] md:py-24">
        <div className="surface-card p-6 md:p-8">
          {sent ? (
            <div className="py-10 text-center">
              <h2 className="text-2xl">{tr("Thanks — your message is in.")}</h2>
              <p className="mt-3 text-muted-foreground">
                {tr("Our team will get back to you within one working day.")}
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">{tr("Full name")}</Label>
                <Input id="name" name="name" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="email">{tr("Email")}</Label>
                <Input id="email" name="email" type="email" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="company">{tr("Company")}</Label>
                <Input id="company" name="company" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="topic">{tr("What is it about?")}</Label>
                <select
                  id="topic"
                  name="topic"
                  defaultValue="quote"
                  className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="quote">{tr("Quote request")}</option>
                  <option value="order">{tr("Existing order")}</option>
                  <option value="artwork">{tr("Artwork question")}</option>
                  <option value="partnership">{tr("Partnership")}</option>
                  <option value="other">{tr("Other")}</option>
                </select>
                <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="message">{tr("Message")}</Label>
                <Textarea id="message" name="message" required rows={6} className="mt-1.5" />
              </div>
              <Button type="submit" size="lg" disabled={busy} className="rounded-full sm:w-fit">
                {busy ? tr("Sending…") : tr("Send message")}
              </Button>
            </form>
          )}
        </div>

        <aside className="surface-card h-fit p-6 md:p-8">
          <h2 className="text-xl">{tr("Reach us directly")}</h2>
          <ul className="mt-6 space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 size-4 text-primary" />
              <a href={contact.mailto} className="hover:underline">
                {contact.email}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 size-4 text-primary" />
              <a href={contact.tel} dir="ltr" className="hover:underline">
                {contact.phone}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 text-primary" />
              <span>{contact.address}</span>
            </li>
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            {tr("Monday to Friday, 9:00–18:00. Urgent jobs? Message us on WhatsApp.")}
          </p>
        </aside>
      </section>
    </SiteShell>
  );
}
