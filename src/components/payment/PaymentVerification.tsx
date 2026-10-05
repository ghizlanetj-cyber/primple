import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { contact } from "@/config/contact";
import { useI18n, type Lang } from "@/i18n";
import { mad } from "@/lib/format";
import { dashboardOrderPath, pollDelay, verifyView, type VerifyView } from "@/lib/payment-status";
import { getPrintPaymentStatus } from "@/lib/youcanpay.functions";

export type VerifiedOrder = NonNullable<Awaited<ReturnType<typeof getPrintPaymentStatus>>>;

const FR = {
    verifying: "Vérification du paiement…",
    verifyingBody: "Nous attendons la confirmation de YouCan Pay. Gardez cette page ouverte et ne relancez pas le paiement.",
    delayed: "La confirmation prend plus de temps que prévu",
    delayedBody:
      "Votre commande est enregistrée. Ne payez pas une seconde fois : nous continuons à vérifier et cette page se mettra à jour toute seule. Besoin d'aide ? Contactez-nous avec votre référence.",
    confirmed: "Paiement confirmé",
    reference: "Référence",
    paid: "Montant payé",
    balance: "Solde en espèces à la livraison",
    track: "Suivre ma commande",
    guestNote:
      "Pour suivre cette commande, connectez-vous ou créez un compte avec l'adresse e-mail de la commande. Elle sera rattachée après vérification de votre e-mail.",
    signup: "Créer un compte",
    failed: "Le paiement n'a pas abouti",
    failedBody: "Aucun paiement n'a été confirmé pour cette commande. Elle reste enregistrée.",
    retry: "Réessayer le paiement",
    notFound: "Commande introuvable sur cet appareil",
    notFoundBody: "Connectez-vous avec le compte de la commande, ou contactez-nous avec votre référence.",
    signin: "Se connecter",
    redirecting: "Redirection vers votre espace…",
};
type Copy = Record<keyof typeof FR, string>;
const COPY: Record<Lang, Copy> = {
  fr: FR,
  en: {
    verifying: "Verifying your payment…",
    verifyingBody: "We are waiting for YouCan Pay to confirm. Keep this page open and do not pay again.",
    delayed: "Confirmation is taking longer than usual",
    delayedBody:
      "Your order is saved. Do not pay a second time: we keep checking and this page updates on its own. Need help? Contact us with your reference.",
    confirmed: "Payment confirmed",
    reference: "Reference",
    paid: "Amount paid",
    balance: "Cash balance at delivery",
    track: "Track my order",
    guestNote:
      "To track this order, sign in or create an account with the order email. It is attached once your email is verified.",
    signup: "Create an account",
    failed: "The payment did not go through",
    failedBody: "No payment was confirmed for this order. It stays saved.",
    retry: "Retry payment",
    notFound: "Order not found on this device",
    notFoundBody: "Sign in with the order's account, or contact us with your reference.",
    signin: "Sign in",
    redirecting: "Taking you to your dashboard…",
  },
  ar: {
    verifying: "جارٍ التحقق من الدفع…",
    verifyingBody: "ننتظر تأكيد YouCan Pay. أبقِ هذه الصفحة مفتوحة ولا تُعِد الدفع.",
    delayed: "التأكيد يستغرق وقتًا أطول من المعتاد",
    delayedBody:
      "طلبك محفوظ. لا تدفع مرة ثانية: نواصل التحقق وستتحدث هذه الصفحة تلقائيًا. تحتاج مساعدة؟ تواصل معنا مع مرجع الطلب.",
    confirmed: "تم تأكيد الدفع",
    reference: "المرجع",
    paid: "المبلغ المدفوع",
    balance: "الباقي نقدًا عند التسليم",
    track: "تتبع طلبي",
    guestNote: "لتتبع هذا الطلب، سجّل الدخول أو أنشئ حسابًا ببريد الطلب. يُربط الطلب بعد التحقق من بريدك.",
    signup: "إنشاء حساب",
    failed: "لم يتم الدفع",
    failedBody: "لم يُؤكَّد أي دفع لهذا الطلب. يبقى الطلب محفوظًا.",
    retry: "إعادة محاولة الدفع",
    notFound: "الطلب غير موجود على هذا الجهاز",
    notFoundBody: "سجّل الدخول بحساب الطلب، أو تواصل معنا مع المرجع.",
    signin: "تسجيل الدخول",
    redirecting: "جارٍ نقلك إلى مساحتك…",
  },
};

/**
 * Polls the server for a print order's payment status after the card step.
 * Never offers a new payment while the status is pending.
 */
export function PaymentVerification({
  reference,
  claimToken,
  signedIn,
  onConfirmed,
  onDelayed,
}: {
  reference: string;
  claimToken: string;
  signedIn: boolean;
  onConfirmed: (order: VerifiedOrder) => void;
  /** Called once if the status is still pending after the timeout. */
  onDelayed?: () => void;
}) {
  const { lang } = useI18n();
  const c = COPY[lang];
  const check = useServerFn(getPrintPaymentStatus);
  const [view, setView] = useState<VerifyView>("verifying");
  const [order, setOrder] = useState<VerifiedOrder | null>(null);
  const [missing, setMissing] = useState(false);
  const confirmedRef = useRef(false);
  const onConfirmedRef = useRef(onConfirmed);
  onConfirmedRef.current = onConfirmed;

  useEffect(() => {
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let misses = 0;

    const tick = async () => {
      let status: string | null = null;
      try {
        const result = await check({ data: { reference, claimToken } });
        if (stopped) return;
        if (!result) {
          misses += 1;
          // A just-signed-in session can lag one call; give up after a few tries.
          if (misses >= 3) {
            setMissing(true);
            return;
          }
        } else {
          setOrder(result);
          status = result.paymentStatus;
        }
      } catch {
        /* network blip: keep polling */
      }
      const next = verifyView(status, Date.now() - started);
      setView(next);
      if (next === "confirmed" && !confirmedRef.current) {
        confirmedRef.current = true;
        return;
      }
      const delay = pollDelay(next);
      if (delay !== null) timer = setTimeout(tick, delay);
    };
    void tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [reference, claimToken, check]);

  useEffect(() => {
    if (view === "confirmed" && order) onConfirmedRef.current(order);
  }, [view, order]);
  const onDelayedRef = useRef(onDelayed);
  onDelayedRef.current = onDelayed;
  const delayedFired = useRef(false);
  useEffect(() => {
    if (view === "delayed" && !delayedFired.current) {
      delayedFired.current = true;
      onDelayedRef.current?.();
    }
  }, [view]);

  if (missing) {
    return (
      <div className="text-center" role="status">
        <AlertTriangle className="mx-auto size-10 text-destructive" />
        <h2 className="mt-3 text-2xl font-bold">{c.notFound}</h2>
        <p className="mt-2 text-muted-foreground">{c.notFoundBody}</p>
        <p className="mt-2 font-semibold" dir="ltr">{reference}</p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/login" search={{ redirect: dashboardOrderPath(reference, false) }}>{c.signin}</Link>
        </Button>
      </div>
    );
  }

  if (view === "confirmed" && order) {
    const dest = dashboardOrderPath(order.reference);
    return (
      <div role="status">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/15">
          <CheckCircle2 className="size-6 text-primary" />
        </span>
        <h2 className="mt-5 text-2xl font-bold">{c.confirmed}</h2>
        <dl className="mt-5 space-y-2 rounded-xl bg-secondary/50 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{c.reference}</dt>
            <dd className="font-semibold" dir="ltr">{order.reference}</dd>
          </div>
          <div className="flex justify-between gap-4 font-semibold">
            <dt>{c.paid}</dt>
            <dd>{mad(order.amountPaid)}</dd>
          </div>
          {order.balance > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{c.balance}</dt>
              <dd>{mad(order.balance)}</dd>
            </div>
          )}
        </dl>
        {signedIn ? (
          <div className="mt-6 flex items-center gap-3">
            <Button asChild size="lg" className="rounded-full">
              <a href={dest}>{c.track}</a>
            </Button>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> {c.redirecting}
            </span>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground">{c.guestNote}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/login" search={{ redirect: dest }}>{c.track}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/signup" search={{ redirect: dest }}>{c.signup}</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === "failed") {
    return (
      <div role="alert">
        <AlertTriangle className="size-10 text-destructive" />
        <h2 className="mt-3 text-2xl font-bold">{c.failed}</h2>
        <p className="mt-2 text-muted-foreground">{c.failedBody}</p>
        <p className="mt-2 font-semibold" dir="ltr">{reference}</p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/payment/retry" search={{ ref: reference }}>{c.retry}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/15">
        {view === "delayed" ? <Clock className="size-6 text-primary" /> : <Loader2 className="size-6 animate-spin text-primary" />}
      </span>
      <h2 className="mt-5 text-2xl font-bold">{view === "delayed" ? c.delayed : c.verifying}</h2>
      <p className="mt-2 text-muted-foreground">{view === "delayed" ? c.delayedBody : c.verifyingBody}</p>
      <p className="mt-3 text-sm">
        <span className="text-muted-foreground">{c.reference} : </span>
        <span className="font-semibold" dir="ltr">{reference}</span>
      </p>
      {view === "delayed" && (
        <p className="mt-3 text-sm">
          <a href={contact.whatsapp} className="underline">WhatsApp {contact.phone}</a>
          {" · "}
          <a href={contact.mailto} className="underline">{contact.email}</a>
        </p>
      )}
    </div>
  );
}
