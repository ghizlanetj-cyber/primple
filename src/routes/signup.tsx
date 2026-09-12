import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { SiteShell } from "@/components/layout/SiteShell";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { authErrorPhrase } from "@/lib/auth-messages";

const title = "Créer votre compte | Primple";
const description =
  "Créez votre compte Primple pour commander vos impressions, suivre la production et gérer vos factures, comme entreprise, imprimeur ou designer.";

const roles = [
  { id: "business", label: "I buy printing", copy: "Order, track and reorder for your business." },
  {
    id: "printer",
    label: "I'm a printer",
    copy: "Receive jobs and fill your production capacity.",
  },
  { id: "designer", label: "I'm a designer", copy: "Print client work and earn on every order." },
];

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): { role?: string; redirect?: string } => ({
    ...(typeof search["role"] === "string" ? { role: search["role"] } : {}),
    ...(typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {}),
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.lovable.app/signup" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.lovable.app/signup" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { tr } = useI18n();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user } = useAuth();
  const [role, setRole] = useState(
    roles.some((r) => r.id === search.role) ? (search.role as string) : "business",
  );
  const [busy, setBusy] = useState(false);

  const destination = search.redirect?.startsWith("/") ? search.redirect : "/dashboard";

  useEffect(() => {
    if (user) navigate({ to: destination });
  }, [user, destination, navigate]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("name") ?? "").trim();
    const company = String(form.get("company") ?? "").trim();

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: fullName, company, account_type: role },
        },
      });
      if (error) throw error;
      if (data.session) {
        toast.success(tr("Welcome to Primple."));
        navigate({ to: destination });
      } else {
        toast.success(tr("Check your inbox to confirm your email address."));
      }
    } catch (error) {
      toast.error(tr(authErrorPhrase(error)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteShell>
      <section className="section-shell grid gap-10 py-16 lg:grid-cols-[1fr_1fr] lg:items-start md:py-24">
        <div>
          <p className="eyebrow text-primary">{tr("Create account")}</p>
          <h1 className="display-xl mt-4 text-4xl sm:text-5xl">
            {tr("Your printing account, in a minute.")}
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            {tr(
              "Track every job, keep your invoices in one place and reorder past prints in one click.",
            )}
          </p>

          <div className="mt-8 grid gap-3">
            {roles.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setRole(option.id)}
                className={cn(
                  "rounded-2xl border p-4 text-start transition-colors",
                  role === option.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40",
                )}
                aria-pressed={role === option.id}
              >
                <p className="font-semibold">{tr(option.label)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{tr(option.copy)}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="surface-card p-6 md:p-8">
          <SocialAuthButtons redirectTo={destination} />

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {tr("or sign up with email")}
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="grid gap-4">
            <div>
              <Label htmlFor="name">{tr("Full name")}</Label>
              <Input id="name" name="name" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="company">{tr("Company")}</Label>
              <Input id="company" name="company" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email">{tr("Email")}</Label>
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
                className="mt-1.5"
              />
            </div>
            <Button type="submit" size="lg" disabled={busy} className="mt-2 rounded-full">
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {tr("Create my account")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            {tr("Already have an account?")}{" "}
            <Link to="/login" className="font-semibold text-foreground hover:underline">
              {tr("Log in")}
            </Link>
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {tr("By creating an account you agree to our")}{" "}
            <Link to="/terms" className="underline">
              {tr("Terms")}
            </Link>{" "}
            {tr("and")}{" "}
            <Link to="/privacy" className="underline">
              {tr("Privacy Policy")}
            </Link>
            .
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
