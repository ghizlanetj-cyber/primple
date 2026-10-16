import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import {
  getBrowserMetaTracker,
  isPublicMarketingPage,
  MARKETING_CONSENT_KEY,
  parseMarketingConsent,
  type MarketingConsent as Consent,
} from "@/lib/meta-pixel";

const copy = {
  fr: {
    title: "Votre choix pour les cookies publicitaires",
    body: "Avec votre accord, le Pixel Meta mesure les visites des pages publiques pour évaluer nos publicités Facebook et Instagram. Vous pouvez refuser et continuer à utiliser Primple.",
    accept: "Accepter", reject: "Refuser", preferences: "Choix des cookies",
    privacy: "Confidentialité", close: "Fermer", saved: "Votre choix est enregistré. Vous pouvez le modifier ici à tout moment.",
  },
  en: {
    title: "Your advertising cookie choice",
    body: "With your permission, the Meta Pixel measures visits to public pages to evaluate our Facebook and Instagram ads. You can decline and keep using Primple.",
    accept: "Accept", reject: "Decline", preferences: "Cookie choices",
    privacy: "Privacy", close: "Close", saved: "Your choice is saved. You can change it here at any time.",
  },
  ar: {
    title: "اختيارك لملفات تعريف الارتباط الإعلانية",
    body: "بموافقتك، يقيس Meta Pixel زيارات الصفحات العامة لتقييم إعلاناتنا على فيسبوك وإنستغرام. يمكنك الرفض ومواصلة استخدام Primple.",
    accept: "قبول", reject: "رفض", preferences: "خيارات ملفات الارتباط",
    privacy: "الخصوصية", close: "إغلاق", saved: "تم حفظ اختيارك. يمكنك تغييره هنا في أي وقت.",
  },
};

export function MarketingConsent() {
  const { lang } = useI18n();
  const text = copy[lang];
  const location = useLocation();
  const [choice, setChoice] = useState<Consent>(null);
  const [ready, setReady] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { setChoice(parseMarketingConsent(window.localStorage.getItem(MARKETING_CONSENT_KEY))); }
    catch { /* Storage can be blocked; the choice still works for this visit. */ }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key === MARKETING_CONSENT_KEY || event.key === null) setChoice(parseMarketingConsent(event.newValue));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!ready) return;
    setEligible(isPublicMarketingPage(window.location.href));
    getBrowserMetaTracker().update(choice === "granted");
  }, [ready, choice, location.href]);

  const choose = (value: Exclude<Consent, null>) => {
    // Revoke immediately; navigation or a late SDK load cannot send another view.
    getBrowserMetaTracker().update(value === "granted");
    setChoice(value);
    setOpen(false);
    try { window.localStorage.setItem(MARKETING_CONSENT_KEY, value); }
    catch { /* Keep the in-memory choice when persistent storage is unavailable. */ }
  };

  if (!ready || !eligible) return null;
  if (!open && choice !== null) return (
    <button type="button" onClick={() => setOpen(true)} className="fixed bottom-4 start-4 z-40 rounded-full border border-border bg-background px-3 py-2 text-xs text-foreground shadow-soft hover:bg-secondary">
      {text.preferences}
    </button>
  );

  return (
    <section aria-label={text.preferences} className="fixed bottom-20 start-4 end-4 z-50 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl border border-border bg-background p-5 text-foreground shadow-lift sm:end-auto sm:w-[30rem]">
      <h2 className="text-base font-semibold">{text.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text.body}</p>
      {choice !== null && <p className="mt-2 text-xs text-muted-foreground">{text.saved}</p>}
      <div className="mt-4 flex gap-3">
        <Button type="button" variant="outline" className="flex-1 rounded-full" onClick={() => choose("denied")}>{text.reject}</Button>
        <Button type="button" variant="outline" className="flex-1 rounded-full" onClick={() => choose("granted")}>{text.accept}</Button>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <Link to="/privacy" className="underline underline-offset-4">{text.privacy}</Link>
        {choice !== null && <button type="button" className="underline underline-offset-4" onClick={() => setOpen(false)}>{text.close}</button>}
      </div>
    </section>
  );
}
