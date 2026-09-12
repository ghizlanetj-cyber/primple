import { MessageCircle } from "lucide-react";
import { contact } from "@/config/contact";
import { useI18n } from "@/i18n";

export function WhatsAppButton() {
  const { tr } = useI18n();
  return (
    <a
      href={contact.whatsapp}
      target="_blank"
      rel="noreferrer"
      aria-label={tr("Contact us on WhatsApp")}
      title={tr("Contact us on WhatsApp")}
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] end-3 z-40 flex size-11 items-center justify-center rounded-full bg-success text-success-foreground opacity-90 shadow-lift transition-transform hover:scale-105 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:bottom-5 sm:end-5 sm:size-12 sm:opacity-100"
    >
      <MessageCircle className="size-5 sm:size-6" aria-hidden="true" />
    </a>
  );
}
