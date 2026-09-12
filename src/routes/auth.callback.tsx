import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";

const AUTH_DESTINATION_KEY = "primple-auth-destination";

function safeDestination(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>): { next?: string } =>
    typeof search["next"] === "string" ? { next: search["next"] } : {},
  head: () => ({
    meta: [
      { title: "Connexion sécurisée | Primple" },
      {
        name: "description",
        content: "Finalisation sécurisée de votre connexion à votre compte Primple.",
      },
      { property: "og:title", content: "Connexion sécurisée | Primple" },
      {
        property: "og:description",
        content: "Finalisation sécurisée de votre connexion à votre compte Primple.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const { tr } = useI18n();
  const { next } = Route.useSearch();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const stored = window.sessionStorage.getItem(AUTH_DESTINATION_KEY);
    const destination = safeDestination(next ?? stored);

    const finish = () => {
      window.sessionStorage.removeItem(AUTH_DESTINATION_KEY);
      window.location.replace(destination);
    };

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        finish();
        return;
      }

      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) finish();
      });
      timeout = setTimeout(() => {
        listener.subscription.unsubscribe();
        if (active) setFailed(true);
      }, 10_000);
    };

    void checkSession();
    return () => {
      active = false;
      if (timeout) clearTimeout(timeout);
    };
  }, [next]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lift">
        <Logo className="mx-auto h-9" />
        {failed ? (
          <>
            <h1 className="mt-8 text-2xl">{tr("We couldn't finish signing you in.")}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {tr("Return to sign in and try again.")}
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/login">{tr("Back to sign in")}</Link>
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mt-8 size-7 animate-spin text-primary" aria-hidden="true" />
            <h1 className="mt-4 text-2xl">{tr("Signing you in to Primple…")}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {tr("Your secure connection is being completed.")}
            </p>
          </>
        )}
      </section>
    </main>
  );
}