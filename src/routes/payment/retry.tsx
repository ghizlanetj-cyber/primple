import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Loader2, Lock } from "lucide-react";

import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/button";
import { PaymentHelpAssistant } from "@/components/payment/PaymentHelpAssistant";
import { useI18n } from "@/i18n";
import { mad } from "@/lib/format";
import { readGuestClaim } from "@/lib/guest-claim";
import { getRetryableOrder } from "@/lib/payment-support.functions";
import { getYouCanPayConfig, startPrintPayment } from "@/lib/youcanpay.functions";
import { loadYouCanPay, type YouCanPayElement, type YouCanPayLocale } from "@/lib/youcanpay";
import { useCart } from "@/store/cart";

const title = "Reprendre votre paiement | Primple";
const description = "Votre commande Primple est conservée : réessayez le paiement par carte en toute sécurité.";

export const Route = createFileRoute("/payment/retry")({
  validateSearch: (search: Record<string, unknown>) => ({ ref: typeof search.ref === "string" ? search.ref : "" }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RetryPage,
});

type RetryOrder = NonNullable<Awaited<ReturnType<typeof getRetryableOrder>>>;

function RetryPage() {
  const { ref } = Route.useSearch();
  const { tr, lang } = useI18n();
  const { clear } = useCart();
  const loadOrder = useServerFn(getRetryableOrder);
  const loadConfig = useServerFn(getYouCanPayConfig);
  const startPayment = useServerFn(startPrintPayment);

  const [order, setOrder] = useState<RetryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<YouCanPayElement | null>(null);
  const claimToken = useRef<string>("");

  useEffect(() => {
    const claim = readGuestClaim();
    claimToken.current = claim?.reference === ref ? claim.claimToken : "";
    loadOrder({ data: { reference: ref, claimToken: claimToken.current } })
      .then((result) => {
        setOrder(result);
        if (result?.paymentStatus === "paid") setPaid(true);
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [ref, loadOrder]);

  const retry = async () => {
    if (!order) return;
    setBusy(true);
    setError(null);
    try {
      const config = await loadConfig();
      if (!config.configured) throw new Error(tr("Card payment is not available right now."));
      const payment = await startPayment({
        data: claimToken.current ? { orderId: order.id, claimToken: claimToken.current } : { orderId: order.id },
      });
      const yp = await loadYouCanPay();
      const locale: YouCanPayLocale = lang === "ar" ? "ar" : lang === "en" ? "en" : "fr";
      const element = yp(config.publicKey, { locale, sandbox: config.sandbox }).elements({
        token: payment.token,
        container: containerRef.current ?? "#youcanpay-retry-form",
      });
      elementRef.current = element;
      await element.mount();
      setCardReady(true);
    } catch (caught) {
      setError(caught instanceof Error ? tr(caught.message) : tr("The payment could not be started."));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!elementRef.current) return;
    setBusy(true);
    setError(null);
    try {
      const result = await elementRef.current.confirm();
      if (result.status === "succeeded") {
        setPaid(true);
        clear();
      } else setError(result.error?.message ?? tr("The payment was declined."));
    } catch {
      setError(tr("The payment was declined."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteShell>
      <div className="section-shell max-w-2xl space-y-6 py-16">
        {loading ? (
          <Loader2 className="mx-auto size-6 animate-spin" />
        ) : !order ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold">{tr("Order not found")}</h1>
            <p className="mt-2 text-muted-foreground">
              {tr("Sign in with the account used for this order, or contact us with your order number.")}
            </p>
            <Button asChild className="mt-6">
              <Link to="/login">{tr("Sign in")}</Link>
            </Button>
          </div>
        ) : paid ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-10 text-primary" />
            <h1 className="mt-3 text-2xl font-bold">{tr("Payment received. Your order is confirmed.")}</h1>
            <p className="mt-2 text-muted-foreground">{order.reference}</p>
          </div>
        ) : (
          <>
            <div className="flex gap-3 rounded-2xl border border-border bg-card p-5">
              <AlertTriangle className="size-6 shrink-0 text-destructive" />
              <div>
                <h1 className="text-xl font-bold">{tr("Your payment did not go through")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tr("Your order is saved and you have not been charged. You can retry safely.")}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 text-sm">
              <div className="font-semibold">{order.reference}</div>
              <ul className="mt-3 space-y-1">
                {order.items.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{tr(item.name)}</span>
                    <span>× {item.quantity}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-1 border-t border-border pt-3">
                <div className="flex justify-between"><dt>{tr("Subtotal")}</dt><dd>{mad(order.subtotal)}</dd></div>
                <div className="flex justify-between"><dt>{tr("Delivery")}</dt><dd>{mad(order.delivery)}</dd></div>
                <div className="flex justify-between font-semibold"><dt>{tr("Total")}</dt><dd>{mad(order.total)}</dd></div>
                <div className="flex justify-between"><dt>{tr("Amount to pay now")}</dt><dd>{mad(order.deposit)}</dd></div>
                {order.balance > 0 && (
                  <div className="flex justify-between"><dt>{tr("Balance")}</dt><dd>{mad(order.balance)}</dd></div>
                )}
              </dl>
            </div>

            <div id="youcanpay-retry-form" ref={containerRef} />
            {!cardReady ? (
              <Button className="w-full" onClick={retry} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                {tr("Retry payment")}
              </Button>
            ) : (
              <Button className="w-full" onClick={confirm} disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                {tr("Pay")} {mad(order.deposit)}
              </Button>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <PaymentHelpAssistant />
          </>
        )}
      </div>
    </SiteShell>
  );
}
