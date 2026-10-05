import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CheckCircle2, Clock, CreditCard, Loader2, Lock, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";

import { createOrder, type DeliveryDetails, type OrderRecord } from "@/lib/orders-api";
import { createGuestOrder } from "@/lib/orders.functions";
import { readGuestClaim, saveGuestClaim } from "@/lib/guest-claim";
import { PaymentVerification } from "@/components/payment/PaymentVerification";
import { dashboardOrderPath, PRINT_REFERENCE } from "@/lib/payment-status";
import { useQueryClient } from "@tanstack/react-query";
import { attachFilesToOrder } from "@/lib/files-api";
import { invoiceLabels } from "@/lib/invoice";
import { getYouCanPayConfig, startPrintPayment } from "@/lib/youcanpay.functions";
import { loadYouCanPay, type YouCanPayElement, type YouCanPayLocale } from "@/lib/youcanpay";
import {
  BANK_ADVANCE_METHOD,
  BANK_FULL_METHOD,
  CARD_METHOD,
  CASHPLUS_ADVANCE_METHOD,
  CASHPLUS_FULL_METHOD,
  DEPOSIT_METHOD,
  isCashPlusMethod,
  isHalfMethod,
  isManualMethod,
  splitAmounts,
  type PrintPaymentMethod,
} from "@/lib/deposit";

type PayChoice = "card" | "bank" | "cashplus" | "cod";
type AdvanceChoice = "card" | "bank" | "cashplus";
function resolveMethod(choice: PayChoice, advance: AdvanceChoice): PrintPaymentMethod {
  if (choice === "card") return CARD_METHOD;
  if (choice === "bank") return BANK_FULL_METHOD;
  if (choice === "cashplus") return CASHPLUS_FULL_METHOD;
  return advance === "card" ? DEPOSIT_METHOD : advance === "bank" ? BANK_ADVANCE_METHOD : CASHPLUS_ADVANCE_METHOD;
}
import { requestBankTransfer } from "@/lib/bank-transfer.functions";
import { contact } from "@/config/contact";

import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mad } from "@/lib/format";
import { cartTotals, useCart } from "@/store/cart";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";

const title = "Payer votre commande par carte | Primple";
const description =
  "Réglez votre commande d'impression Primple en ligne par carte bancaire, en dirhams, avec YouCan Pay.";

const PENDING_KEY = "primple-pending-checkout";
type PendingCheckout = { order: OrderRecord; claimToken?: string | undefined; method: string; cart: string };
function readPending(): PendingCheckout | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingCheckout) : null;
  } catch {
    return null;
  }
}
function writePending(value: PendingCheckout | null) {
  try {
    if (value) window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(value));
    else window.sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* storage unavailable */
  }
}

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): { ref?: string } =>
    typeof search["ref"] === "string" && PRINT_REFERENCE.test(search["ref"]) ? { ref: search["ref"] } : {},
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://primple.ma/checkout" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://primple.ma/checkout" }],
  }),
  component: CheckoutPage,
});

const steps = ["Order", "Delivery", "Payment", "Confirmation"];

function CheckoutPage() {
  const { tr, number, lang } = useI18n();
  const navigate = useNavigate();
  const { items, clear } = useCart();
  const removedNotice = useCart((s) => s.removedNotice);
  useEffect(() => {
    if (removedNotice) void navigate({ to: "/cart" });
  }, [removedNotice, navigate]);
  const { user } = useAuth();
  const totals = cartTotals(items);
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  // Set once the card step reports success, or when returning from YouCan Pay / refreshing.
  const [verify, setVerify] = useState<{ reference: string; claimToken: string } | null>(null);
  useEffect(() => {
    if (!search.ref) return;
    const claim = readGuestClaim();
    setVerify({ reference: search.ref, claimToken: claim?.reference === search.ref ? claim.claimToken : "" });
  }, [search.ref]);
  const cartSignature = JSON.stringify(items.map((i) => [i.slug, i.quantity, i.selection]));

  const startPayment = useServerFn(startPrintPayment);
  const requestTransfer = useServerFn(requestBankTransfer);
  const loadConfig = useServerFn(getYouCanPayConfig);
  const placeGuestOrder = useServerFn(createGuestOrder);

  const [step, setStep] = useState(0);
  const [details, setDetails] = useState<DeliveryDetails | null>(null);
  const [placing, setPlacing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<OrderRecord | null>(null);
  const [choice, setChoice] = useState<PayChoice>("card");
  const [advance, setAdvance] = useState<AdvanceChoice>("card");
  const method = resolveMethod(choice, advance);
  const [dueNow, setDueNow] = useState<number | null>(null);
  const orderId = placedOrder?.reference ?? "";
  const isDeposit = isHalfMethod(method);
  const isBank = isManualMethod(method);
  const isCashPlus = isCashPlusMethod(method);
  const manualLabel = isCashPlus ? "Cash Plus" : tr("Bank transfer");
  const split = splitAmounts(placedOrder?.total ?? totals.total, method);
  const payable = dueNow ?? split.dueNow;

  // WhatsApp follow-up CTA: shown only once a real order reference exists (step 3),
  // for manual payments and COD advances. Never for full card-only checkout.
  const placedTotal = placedOrder?.total ?? 0;
  const placedBalance = Math.round((placedTotal - payable) * 100) / 100;
  const methodLabel =
    choice === "cod"
      ? `${tr("Cash on delivery — 50% deposit")} · ${advance === "card" ? tr("Card") : advance === "bank" ? tr("Bank transfer") : "Cash Plus"}`
      : choice === "card"
        ? tr("Card")
        : manualLabel;
  const waLines = [
    `Commande ${orderId}`,
    `Mode de paiement : ${methodLabel}`,
    `Total : ${mad(placedTotal)}`,
    `${isDeposit ? "Avance à régler" : "Montant à régler"} : ${mad(payable)}`,
    ...(isDeposit ? [`Solde en espèces à la livraison : ${mad(placedBalance)}`] : []),
    "Merci de m'indiquer la suite.",
  ];
  const waHref = `${contact.whatsapp}?text=${encodeURIComponent(waLines.join("\n"))}`;
  const showWhatsAppCta = step === 3 && Boolean(placedOrder) && (isBank || isDeposit) && choice !== "card";

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inFlight = useRef(false);
  const placedRef = useRef<{ order: OrderRecord; claimToken: string | undefined; method: string } | null>(null);
  const elementRef = useRef<YouCanPayElement | null>(null);

  const handleStartPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!details) {
      toast.error(tr("Please complete your delivery details before paying."));
      setStep(1);
      return;
    }
    // Double-click guard: only one order attempt at a time.
    if (inFlight.current) return;
    inFlight.current = true;
    setPlacing(true);
    setError(null);
    const snapshotItems = items;
    try {
      const config = isBank ? null : await loadConfig({});
      if (config && !config.configured) throw new Error(tr("Card payment is not available right now."));

      let order: OrderRecord;
      let claimToken: string | undefined;
      const stored = placedRef.current ? null : readPending();
      const reuse =
        placedRef.current ?? (stored && stored.cart === cartSignature ? { order: stored.order, claimToken: stored.claimToken, method: stored.method } : null);
      if (reuse && reuse.method === method) {
        // Retry after a failed payment step: reuse the unpaid order, never duplicate it.
        order = reuse.order;
        claimToken = reuse.claimToken;
      } else if (user) {
        order = await createOrder({ userId: user.id, items, totals, details, paymentMethod: method });
      } else {
        // Guests order too: the server prices every line and hands back a
        // one-time token so the order can be attached to a new account later.
        const guest = await placeGuestOrder({
          data: {
            lines: items.map((i) => ({
              slug: i.slug,
              quantity: i.quantity,
              selection: i.selection,
              ...(i.artworkPath ? { artworkPath: i.artworkPath } : {}),
              ...(i.artworkGuestToken ? { artworkGuestToken: i.artworkGuestToken } : {}),
            })),
            details,
            paymentMethod: method,
          },
        });
        claimToken = guest.claimToken;
        order = {
          id: guest.id,
          reference: guest.reference,
          total: guest.total,
          expectedAt: guest.expectedAt ?? "",
        } as OrderRecord;
        saveGuestClaim({
          reference: guest.reference,
          claimToken: guest.claimToken,
          email: details.email,
        });
      }
      const isNewOrder = placedRef.current?.order.id !== order.id;
      placedRef.current = { order, claimToken, method };
      // Survives a refresh so the same unpaid order is reused, never duplicated.
      writePending({ order, claimToken, method, cart: cartSignature });
      setPlacedOrder(order);

      const artworkPaths = snapshotItems
        .map((i) => i.artworkPath)
        .filter((p): p is string => Boolean(p));
      if (user && isNewOrder) {
        try {
          await attachFilesToOrder(artworkPaths, order.id, order.reference);
        } catch {
          // The order is placed; file linking is retried by staff if it fails.
        }
      }

      if (isBank || !config) {
        // No automatic payment: the order waits until staff verify the transfer.
        const transfer = await requestTransfer({
          data: claimToken ? { orderId: order.id, claimToken } : { orderId: order.id },
        });
        setDueNow(transfer.advance);
        setPlacedOrder({ ...order, total: transfer.total });
        clear();
        writePending(null);
        setStep(3);
        return;
      }

      const payment = await startPayment({
        data: claimToken ? { orderId: order.id, claimToken } : { orderId: order.id },
      });
      setDueNow(payment.amountCents / 100);

      const yp = await loadYouCanPay();
      const locale: YouCanPayLocale = lang === "ar" ? "ar" : lang === "en" ? "en" : "fr";
      const element = yp(config.publicKey, { locale, sandbox: config.sandbox }).elements({
        token: payment.token,
        container: containerRef.current ?? "#youcanpay-print-form",
      });
      elementRef.current = element;
      await element.mount();
      setCardReady(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : tr("The payment could not be started."));
    } finally {
      inFlight.current = false;
      setPlacing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!elementRef.current) return;
    setPaying(true);
    setError(null);
    try {
      const result = await elementRef.current.confirm();
      if (result.status === "succeeded" && placedRef.current) {
        // The widget result is not proof of payment: wait for the server status.
        const reference = placedRef.current.order.reference;
        setVerify({ reference, claimToken: placedRef.current.claimToken ?? "" });
        void navigate({ to: "/checkout", search: { ref: reference }, replace: true });
      } else {
        setError(result.error?.message ?? tr("The payment was declined."));
      }
    } catch {
      setError(tr("The payment was declined."));
    } finally {
      setPaying(false);
    }
  };

  if (verify) {
    return (
      <SiteShell>
        <section className="section-shell max-w-2xl pb-14 pt-28 md:pb-20 md:pt-36">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <PaymentVerification
              reference={verify.reference}
              claimToken={verify.claimToken}
              signedIn={Boolean(user)}
              onConfirmed={(order) => {
                // Only now is the purchase final: clear the cart and the pending order.
                clear();
                writePending(null);
                placedRef.current = null;
                if (user) {
                  void queryClient.invalidateQueries({ queryKey: ["orders", user.id] });
                  setTimeout(() => void navigate({ href: dashboardOrderPath(order.reference), replace: true }), 1200);
                }
              }}
            />
          </div>
        </section>
      </SiteShell>
    );
  }

  if (items.length === 0 && step < 3) {
    return (
      <SiteShell>
        <div className="section-shell py-32 text-center">
          <h1 className="text-4xl">{tr("Nothing to pay for yet.")}</h1>
          <p className="mt-4 text-muted-foreground">{tr("Add a print job and come back here.")}</p>
          <Button asChild size="lg" className="mt-8 rounded-full px-7">
            <Link to="/products">{tr("Start Printing")}</Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="section-shell pb-14 pt-24 md:py-20">
        <h1 className="text-4xl md:text-5xl">
          {tr(step === 3 ? "Your order is confirmed." : "Review and pay for your order")}
        </h1>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  i <= step
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {i < step ? <CheckCircle2 className="size-4 text-success" /> : <span>{i + 1}</span>}
                {tr(s)}
              </span>
              {i < steps.length - 1 && <span className="h-px w-6 bg-border" />}
            </div>
          ))}
        </div>


        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.28 }}
              className="rounded-2xl border border-border bg-card p-6 md:p-8"
            >
              {step === 0 && (
                <div>
                  <h2 className="text-xl">{tr("Your print jobs")}</h2>
                  <ul className="mt-5 divide-y divide-border">
                    {items.map((i) => (
                      <li key={i.id} className="flex items-start justify-between gap-4 py-4">
                        <div>
                          <p className="font-semibold">
                            {number(i.quantity)} × {tr(i.name)}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {i.labels.map((l) => tr(l.value)).join(" · ")}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {tr("Production")} {i.productionDays} {tr("days")}
                          </p>
                        </div>
                        <p className="whitespace-nowrap font-semibold">{mad(i.subtotal)}</p>
                      </li>
                    ))}
                  </ul>
                  <Button size="lg" className="mt-6 rounded-full" onClick={() => setStep(1)}>
                    {tr("Continue to delivery")}
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </Button>
                </div>
              )}

              {step === 1 && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    setDetails({
                      name: String(form.get("name") ?? ""),
                      company: String(form.get("company") ?? ""),
                      email: String(form.get("email") ?? ""),
                      phone: String(form.get("phone") ?? ""),
                      address: String(form.get("address") ?? ""),
                      city: String(form.get("city") ?? ""),
                      postcode: String(form.get("postcode") ?? ""),
                    });
                    setStep(2);
                  }}
                >
                  <h2 className="text-xl">{tr("Where should we deliver?")}</h2>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" name="name" />
                    <Field label="Company" name="company" required={false} />
                    <Field label="Email" name="email" type="email" />
                    <Field label="Phone" name="phone" type="tel" />
                    <div className="sm:col-span-2">
                      <Field label="Delivery address" name="address" />
                    </div>
                    <Field label="City" name="city" />
                    <Field label="Postcode" name="postcode" />
                  </div>
                  <Button type="submit" size="lg" className="mt-6 rounded-full">
                    {tr("Continue to payment")}
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </Button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleStartPayment}>
                  <h2 className="text-xl">{tr("Secure card payment")}</h2>
                  <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                    {tr("Card details are handled by YouCan Pay. Primple never sees or stores your card.")}
                  </p>

                  <fieldset className="mt-5 grid gap-2 border-0 p-0" disabled={placing || cardReady}>
                    <legend className="sr-only">{tr("Payment method")}</legend>
                    {(["card", "bank", "cashplus", "cod"] as const).map((c) => (
                      <RadioCard key={c} name="payment-method" checked={choice === c} onChange={() => setChoice(c)}>
                        {c === "card"
                          ? tr("Card")
                          : c === "bank"
                            ? tr("Bank transfer")
                            : c === "cashplus"
                              ? "Cash Plus"
                              : tr("Cash on delivery — 50% deposit")}
                      </RadioCard>
                    ))}
                    {choice === "cod" && (
                      <div className="ms-6 mt-1 grid gap-2">
                        <p className="text-sm font-semibold">{tr("How will you pay your advance?")}</p>
                        {(["card", "bank", "cashplus"] as const).map((a) => (
                          <RadioCard key={a} name="advance-method" checked={advance === a} onChange={() => setAdvance(a)}>
                            {a === "card" ? tr("Card") : a === "bank" ? tr("Bank transfer") : "Cash Plus"}
                          </RadioCard>
                        ))}
                      </div>
                    )}
                  </fieldset>

                  {(isDeposit || isBank) && (
                    <dl className="mt-4 space-y-2 rounded-xl bg-secondary/50 p-4 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">{tr("Total")}</dt>
                        <dd>{mad(placedOrder?.total ?? totals.total)}</dd>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <dt>{isBank ? `${tr(isDeposit ? "Advance by" : "To pay by")} ${manualLabel}` : tr("Due now by card")}</dt>
                        <dd>{mad(payable)}</dd>
                      </div>
                      {isDeposit && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">{tr("Balance in cash at delivery")}</dt>
                          <dd>{mad(Math.round(((placedOrder?.total ?? totals.total) - payable) * 100) / 100)}</dd>
                        </div>
                      )}
                      <p className="pt-1 text-xs text-muted-foreground">
                        {tr(
                          isBank
                            ? "Production starts only after our team confirms your payment."
                            : "Production starts only once the deposit is confirmed.",
                        )}
                      </p>
                    </dl>
                  )}

                  <div
                    id="youcanpay-print-form"
                    ref={containerRef}
                    className={cn(
                      "mt-6 rounded-2xl border border-border bg-background p-4",
                      cardReady ? "min-h-[280px]" : "hidden",
                    )}
                  />

                  {!user && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      {tr(
                        "No account needed to pay. You can create one right after payment to track this order.",
                      )}
                    </p>
                  )}

                  {!cardReady ? (
                    <Button type="submit" size="lg" className="mt-6 rounded-full" disabled={placing}>
                      {placing ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : isBank ? (
                        tr("Confirm my order")
                      ) : (
                        <>
                          <CreditCard className="size-4" />
                          {`${tr("Pay by card")} · ${mad(payable)}`}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="lg"
                      className="mt-6 rounded-full"
                      onClick={handleConfirmPayment}
                      disabled={paying}
                    >
                      {paying ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        `${tr("Pay")} ${mad(payable)}`
                      )}
                    </Button>
                  )}

                  {error && (
                    <p className="mt-4 text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  )}
                </form>
              )}

              {step === 3 && isBank && (
                <div>
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary/15">
                    <Clock className="size-6 text-primary" />
                  </span>
                  <h2 className="mt-5 text-xl">
                    {tr("Order")} {orderId} · {tr("Awaiting payment confirmation")}
                  </h2>
                  <dl className="mt-5 space-y-2 rounded-xl bg-secondary/50 p-4 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{tr("Total")}</dt>
                      <dd>{mad(placedOrder?.total ?? 0)}</dd>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <dt>{`${tr(isDeposit ? "Advance by" : "To pay by")} ${manualLabel}`}</dt>
                      <dd>{mad(payable)}</dd>
                    </div>
                    {isDeposit && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">{tr("Balance in cash at delivery")}</dt>
                        <dd>{mad(Math.round(((placedOrder?.total ?? 0) - payable) * 100) / 100)}</dd>
                      </div>
                    )}
                  </dl>
                  <p className="mt-4 text-sm font-medium">
                    {tr("Production starts only after our team confirms your payment.")}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {tr(isCashPlus ? "Cash Plus instructions are sent after order confirmation." : "Bank transfer details are sent after order confirmation.")}{" "}
                    <a href={contact.whatsapp} className="underline">WhatsApp {contact.phone}</a>
                    {" · "}
                    <a href={contact.mailto} className="underline">{contact.email}</a>
                  </p>
                  {showWhatsAppCta && (
                    <Button asChild size="lg" className="mt-6 rounded-full">
                      <a href={waHref} target="_blank" rel="noopener noreferrer">
                        {tr("Finalize on WhatsApp")}
                      </a>
                    </Button>
                  )}
                  <Button asChild size="lg" variant="ghost" className="mt-6 rounded-full">
                    <Link to="/products">{tr("Continue shopping")}</Link>
                  </Button>
                </div>
              )}

              {step === 3 && !isBank && (
                <div>
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary/15">
                    <CheckCircle2 className="size-6 text-primary" />
                  </span>
                  <h2 className="mt-5 text-xl">
                    {tr("Order")} {orderId} · {tr(isDeposit ? "Deposit paid" : "Paid")}
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    {tr(
                      "Your card payment went through. We start production and keep you posted on your dashboard.",
                    )}
                  </p>

                  <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Summary
                      icon={Clock}
                      label={tr("Estimated production")}
                      value={`2–3 ${tr("working days")}`}
                    />
                    <Summary
                      icon={Truck}
                      label={tr("Estimated delivery")}
                      value={placedOrder?.expectedAt ?? tr("Within 5 working days")}
                    />
                    <Summary icon={Lock} label={tr("Amount paid")} value={mad(payable)} />
                    {isDeposit ? (
                      <Summary
                        icon={CreditCard}
                        label={tr("Balance in cash at delivery")}
                        value={mad(Math.round(((placedOrder?.total ?? totals.total) - payable) * 100) / 100)}
                      />
                    ) : (
                      <Summary icon={CreditCard} label={tr("Payment method")} value={tr("Card · YouCan Pay")} />
                    )}
                  </dl>

                  {showWhatsAppCta && (
                    <Button asChild size="lg" className="mt-6 rounded-full">
                      <a href={waHref} target="_blank" rel="noopener noreferrer">
                        {tr("Finalize on WhatsApp")}
                      </a>
                    </Button>
                  )}

                  {!user && (
                    <div className="mt-8 rounded-2xl border border-border bg-secondary/40 p-6">
                      <h3 className="text-lg">{tr("Create your account")}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {tr("We'll attach this order to your account once your email is confirmed.")}
                      </p>
                      <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
                        <li>• {tr("Follow this order until it is delivered")}</li>
                        <li>• {tr("Keep your files for your next orders")}</li>
                        <li>• {tr("Find all your invoices in one place")}</li>
                        <li>• {tr("Reorder in a couple of clicks")}</li>
                      </ul>
                      <p className="mt-4 text-sm">
                        <span className="text-muted-foreground">{tr("Email")}: </span>
                        <span className="font-semibold">{details?.email}</span>
                      </p>
                      <div className="mt-4 grid gap-3 sm:max-w-md">
                        <SocialAuthButtons redirectTo="/dashboard" />
                        <Button asChild size="lg" className="rounded-full">
                          <Link to="/signup">{tr("Create your account")}</Link>
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex flex-wrap gap-3">
                    {user && (
                      <Button
                        size="lg"
                        className="rounded-full"
                        onClick={() => navigate({ to: "/dashboard" })}
                      >
                        {tr("Track my order")}
                      </Button>
                    )}
                    {user && placedOrder && (
                      <Button asChild size="lg" variant="outline" className="rounded-full">
                        <Link
                          to="/invoice/$reference"
                          params={{ reference: placedOrder.reference }}
                        >
                          {invoiceLabels[lang].download}
                        </Link>
                      </Button>
                    )}
                    <Button asChild size="lg" variant="ghost" className="rounded-full">
                      <Link to="/products">{tr("Continue shopping")}</Link>
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <aside className="rounded-2xl border border-border bg-secondary/40 p-6 lg:sticky lg:top-28">
            <h2 className="text-lg">{tr("Summary")}</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{tr("Items")}</dt>
                <dd>{items.length || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{tr("Subtotal")}</dt>
                <dd>{mad(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{tr("Delivery")}</dt>
                <dd>{mad(totals.delivery)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 font-semibold">
                <dt>{tr("Total")}</dt>
                <dd>{mad(placedOrder?.total ?? totals.total)}</dd>
              </div>
            </dl>
            <p className="mt-5 text-xs text-muted-foreground">
              {tr("Artwork checked · Tracked delivery")}
            </p>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const { tr } = useI18n();
  return (
    <div>
      <Label htmlFor={name} className="text-sm">
        {tr(label)}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1.5"
      />
    </div>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <dt className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}

function RadioCard({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-medium",
        checked ? "border-primary bg-primary/10" : "border-border",
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="accent-primary" />
      {children}
    </label>
  );
}
