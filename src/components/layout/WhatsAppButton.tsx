import { MessageCircle } from "lucide-react";
import { contact } from "@/config/contact";
import { useI18n } from "@/i18n";

export function WhatsAppButton() {
  const { tr } = useI18n();
  return (
    <a href={contact.whatsapp} target="_blank" rel="noreferrer" aria-label={tr("Contact us on WhatsApp")} title={tr("Contact us on WhatsApp")} className="fixed bottom-5 end-5 z-50 flex size-12 items-center justify-center rounded-full bg-success text-success-foreground shadow-lift transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <MessageCircle className="size-6" aria-hidden="true" />
    </a>
  );
}
