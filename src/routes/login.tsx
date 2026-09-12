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
import { cn } from "@/lib/utils";
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
      { property: "og:url", content: "https://primple.lovable.app/login" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.lovable.app/login" }],
  }),
  component: LoginPage,
});

const roles = [
  { id: "business", label: "I buy printing", copy: "Order, track and reorder for your business." },
  {
    id: "printer",
    label: "I'm a printer",
    copy: "Receive jobs and fill your production capacity.",
  },
  { id: "designer", label: "I'm a designer", copy: "Print client work and earn on every order." },
];

function LoginPage() {
  const { tr } = useI18n();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const { user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState("business");
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
    const fullName = String(form.get("name") ?? "").trim();

    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(tr("Welcome back to Primple."));
        navigate({ to: destination });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`,
            data: { full_name: fullName, account_type: role },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success(tr("Your account is ready."));
          navigate({ to: destination });
        } else {
          toast.success(tr("Check your inbox to confirm your email address."));
        }
      }
    } catch (error) {
      toast.error(tr(authErrorPhrase(error)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteShell>
      <section className="section-shell py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <Logo className="h-9" />
            <h1 className="mt-8 text-4xl md:text-5xl">
              {tr(mode === "login" ? "Welcome back." : "Print like a bigger company.")}
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
            <div className="flex rounded-full bg-secondary p-1">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    mode === m ? "bg-background shadow-soft" : "text-muted-foreground",
                  )}
                >
                  {tr(m === "login" ? "Log in" : "Create account")}
                </button>
              ))}
            </div>

            <div className="mt-7">
              <SocialAuthButtons redirectTo={destination} />
            </div>

            <div className="my-6 flex items-center gap-3 text-xs uppercase text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {tr("or use your email")}
              <span className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              {mode === "signup" && (
                <div>
                  <p className="text-sm font-semibold">{tr("I'm here to…")}</p>
                  <div className="mt-3 grid gap-2">
                    {roles.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={cn(
                          "rounded-xl border p-3.5 text-start transition-all",
                          role === r.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/40",
                        )}
                      >
                        <p className="text-sm font-semibold">{tr(r.label)}</p>
                        <p className="text-xs text-muted-foreground">{tr(r.copy)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === "signup" && (
                <div>
                  <Label htmlFor="name">{tr("Full name")}</Label>
                  <Input id="name" name="name" required className="mt-1.5" />
                </div>
              )}
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
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="mt-1.5"
                />
              </div>

              <Button type="submit" size="lg" disabled={busy} className="w-full rounded-full">
                {busy && <Loader2 className="size-4 animate-spin" />}
                {tr(mode === "login" ? "Log in" : "Create my account")}
                {!busy && <ArrowRight className="size-4 rtl:rotate-180" />}
              </Button>
            </form>

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
