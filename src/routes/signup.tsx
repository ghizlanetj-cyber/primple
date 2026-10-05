import { safeInternalPath } from "@/lib/payment-status";
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { SiteShell } from "@/components/layout/SiteShell";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { authErrorPhrase } from "@/lib/auth-messages";
import { readGuestClaim } from "@/lib/guest-claim";

const title = "Créer votre compte | Primple";
const description =
  "Créez votre compte Primple pour commander vos impressions, suivre la production et gérer vos factures, pour votre entreprise.";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {},
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.ma/signup" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.ma/signup" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { tr } = useI18n();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  // A guest who just paid gets their order email filled in for them.
  const [guestEmail, setGuestEmail] = useState("");
  useEffect(() => {
    setGuestEmail(readGuestClaim()?.email ?? "");
  }, []);

  const destination = safeInternalPath(search.redirect);

  useEffect(() => {
    if (user) navigate({ href: destination });
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
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`,
          data: { full_name: fullName, company, account_type: "business" },
        },
      });
      if (error) throw error;
      if (data.session) {
        toast.success(tr("Welcome to Primple."));
        navigate({ href: destination });
      } else {
        toast.success(tr("Check your inbox to confirm your email address."));
      }
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
      <section className="section-shell grid gap-10 py-16 lg:grid-cols-[1fr_1fr] lg:items-start md:py-24">
        <div>
          <p className="eyebrow text-primary">{tr("Create account")}</p>
          <h1 className="display-xl mt-4 text-4xl sm:text-5xl">{tr("Your printing account, in a minute.")}</h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            {tr("Track every job, keep your invoices in one place and reorder past prints in one click.")}
          </p>
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
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={guestEmail}
                key={guestEmail}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">{tr("Password")}</Label>
              <Input id="password" name="password" type="password" required minLength={6} className="mt-1.5" />
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
