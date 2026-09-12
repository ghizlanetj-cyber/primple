import type { ReactNode } from "react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { useI18n } from "@/i18n";

export function SiteShell({ children }: { children: ReactNode }) {
  const { tr } = useI18n();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#contenu-principal"
        className="fixed start-4 top-4 z-[60] -translate-y-24 rounded-md bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-lift transition-transform focus:translate-y-0"
      >
        {tr("Skip to main content")}
      </a>
      <Header />
      <main id="contenu-principal" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
