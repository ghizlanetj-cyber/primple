import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { authErrorPhrase } from "@/lib/auth-messages";
import { useI18n } from "@/i18n";

const AUTH_DESTINATION_KEY = "primple-auth-destination";

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.99v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.11-1.18.29-1.72V4.95H.99A9 9 0 0 0 0 9c0 1.45.35 2.83.99 4.05l2.98-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .99 4.95l2.98 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
      <path d="M16.36 12.72c.02 2.6 2.28 3.46 2.3 3.47-.02.05-.36 1.24-1.2 2.46-.72 1.05-1.47 2.1-2.66 2.12-1.16.02-1.54-.69-2.87-.69-1.33 0-1.74.67-2.85.71-1.14.04-2-1.13-2.73-2.18-1.58-2.29-2.79-6.47-1.17-9.29.81-1.4 2.25-2.29 3.81-2.31 1.12-.02 2.18.75 2.87.75.68 0 1.97-.93 3.32-.79.57.02 2.16.21 3.18 1.56-.08.05-1.9 1.11-1.88 3.31M14.2 3.9c.61-.74 1.02-1.77.91-2.79-.88.04-1.95.59-2.58 1.32-.57.65-1.06 1.7-.93 2.7.98.08 1.99-.5 2.6-1.23" />
    </svg>
  );
}

export function SocialAuthButtons({ redirectTo }: { redirectTo?: string }) {
  const { tr } = useI18n();
  const [pending, setPending] = useState<"google" | "apple" | null>(null);

  const start = async (provider: "google" | "apple") => {
    setPending(provider);
    try {
      const destination =
        redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
          ? redirectTo
          : "/dashboard";
      window.sessionStorage.setItem(AUTH_DESTINATION_KEY, destination);
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", destination);
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: callback.toString(),
      });
      if (result.error) {
        toast.error(tr(authErrorPhrase(result.error)));
        setPending(null);
        return;
      }
      if (result.redirected) return;
      window.location.assign(callback.toString());
    } catch (error) {
      toast.error(tr(authErrorPhrase(error)));
      setPending(null);
    }
  };

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full rounded-full"
        disabled={pending !== null}
        onClick={() => start("google")}
      >
        <GoogleMark />
        {tr("Continue with Google")}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full rounded-full"
        disabled={pending !== null}
        onClick={() => start("apple")}
      >
        <AppleMark />
        {tr("Continue with Apple")}
      </Button>
    </div>
  );
}
