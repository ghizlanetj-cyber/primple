import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { SiteShell } from "@/components/layout/SiteShell";
import { Logo } from "@/components/brand/Logo";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { authErrorPhrase } from "@/lib/auth-messages";

const title = "Connexion ou création de compte | Primple";
const description =
  "Accédez à votre espace d’impression, suivez vos commandes et gérez vos devis, que vous soyez une entreprise, un imprimeur ou un designer.";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {},
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.ma/login" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.ma/login" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { tr } = useI18n();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  const destination = redirect && redirect.startsWith("/") ? redirect : "/dashboard";

  useEffect(() => {
    if (user) navigate({ to: destination });
  }, [user, destination, navigate]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success(tr("Welcome back to Primple."));
      navigate({ to: destination });
    } catch (error) {
      toast.error(tr(authErrorPhrase(error)));
    } finally {
      setBusy(false);
    }
  };

  if (loading || user) {
    return (
      <SiteShell>
        <div className="section-shell flex min-h-[60vh] items-center justify-center" role="status">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="sr-only">{tr("Checking your account…")}</span>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="section-shell py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <Logo className="h-9" />
            <h1 className="mt-8 text-4xl md:text-5xl">
              {tr("Welcome back.")}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {tr(
                "One account for ordering, tracking, quotes and invoices — plus every printer we've verified.",
              )}
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Live production and delivery tracking",
                "Saved configurations for instant reorders",
                "Quotes from verified printers in hours",
                "Invoices and spend in one place",
              ].map((b) => (
                <li key={b} className="flex gap-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {tr(b)}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-border bg-card p-7 shadow-lift md:p-8">
            <h2 className="text-xl">{tr("Log in")}</h2>
            <div className="mt-6">
              <SocialAuthButtons redirectTo={destination} />
            </div>

            <div className="my-6 flex items-center gap-3 text-xs uppercase text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {tr("or use your email")}
              <span className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <Label htmlFor="email">{tr("Work email")}</Label>
                <Input id="email" name="email" type="email" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="password">{tr("Password")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="current-password"
                  className="mt-1.5"
                />
              </div>

              <Button type="submit" size="lg" disabled={busy} className="w-full rounded-full">
                {busy && <Loader2 className="size-4 animate-spin" />}
                {tr("Log in")}
                {!busy && <ArrowRight className="size-4 rtl:rotate-180" />}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              {tr("New to Primple?")} {" "}
              <Link
                to="/signup"
                search={redirect ? { redirect } : {}}
                className="font-semibold text-foreground hover:text-primary"
              >
                {tr("Create account")}
              </Link>
            </p>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              {tr("By continuing you agree to our terms. Prefer to look around first?")}{" "}
              <Link to="/products" className="font-semibold text-foreground hover:text-primary">
                {tr("Browse products")}
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
