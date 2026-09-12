import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Banknote, CheckCircle2, Clock, Lock, Package, Truck } from "lucide-react";
import { toast } from "sonner";

import {
  createOrder,
  splitPayment,
  type DeliveryDetails,
  type OrderRecord,
} from "@/lib/orders-api";

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

const title = "Vérifier et payer votre commande | Primple";
const description =
  "Confirmez votre commande d'impression, vos informations de livraison et votre paiement : 50 % d'acompte, 50 % à la livraison, sans frais surprise.";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://primple.lovable.app/checkout" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://primple.lovable.app/checkout" }],
  }),
  component: CheckoutPage,
});

const steps = ["Order", "Delivery", "Payment", "Confirmation"];

function CheckoutPage() {
  const { tr, number } = useI18n();
  const navigate = useNavigate();
  const { items, clear } = useCart();
  const { user } = useAuth();
  const totals = cartTotals(items);
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState<DeliveryDetails | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<OrderRecord | null>(null);
  const split = splitPayment(placedOrder?.total ?? totals.total);
  const orderId = placedOrder?.reference ?? "";

  const handlePlaceOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !details) return;
    setPlacing(true);
    try {
      const order = await createOrder({ userId: user.id, items, totals, details });
      setPlacedOrder(order);
      setStep(3);
      clear();
      toast.success(tr("Order confirmed. 50% advance received."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tr("We couldn't place your order."));
    } finally {
      setPlacing(false);
    }
  };

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
      <section className="section-shell py-14 md:py-20">
        <h1 className="text-4xl md:text-5xl">
           {tr(step === 3 ? "Your print job is officially underway." : "Review & pay")}
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

        {!user && step < 3 && (
          <div className="mt-8 rounded-2xl border border-border bg-secondary/40 p-6">
            <h2 className="text-lg">{tr("Sign in to finish your order")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {tr("An account is required to confirm and pay for your order.")}{" "}
              {tr("You can review your items now, but you'll need to log in or create an account before the payment step.")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {tr("Your cart, configuration and prices are saved while you log in or create your account.")}
            </p>
            <div className="mt-4 grid gap-3 sm:max-w-md">
              <SocialAuthButtons redirectTo="/checkout" />
              <Button asChild variant="ghost" size="lg" className="rounded-full">
                <Link to="/login" search={{ redirect: "/checkout" }}>
                  {tr("Log in or create an account")}
                </Link>
              </Button>
            </div>
          </div>
        )}

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
                             {i.printer} · {tr("Production")} {i.productionDays} {tr("days")}
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
                <form onSubmit={handlePlaceOrder}>
                   <h2 className="text-xl">{tr("Payment")}</h2>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="size-4" />
                     {tr("Pay 50% now to start production. The remaining 50% is paid in cash on delivery.")}
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-primary bg-primary/10 p-5">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <Lock className="size-4 text-primary" />
                        {tr("Advance now (50%)")}
                      </p>
                      <p className="mt-2 font-display text-2xl font-extrabold">{mad(split.deposit)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {tr("Confirms your order and releases it to the printer.")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-secondary/50 p-5">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <Banknote className="size-4 text-primary" />
                        {tr("Cash on delivery (50%)")}
                      </p>
                      <p className="mt-2 font-display text-2xl font-extrabold">{mad(split.balance)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {tr("Paid to the courier when your order arrives.")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field label="Card number for the 50% advance" name="card" placeholder="4242 4242 4242 4242" />
                    </div>
                    <Field label="Expiry" name="expiry" placeholder="09 / 29" />
                    <Field label="Security code" name="cvc" placeholder="123" />
                    <div className="sm:col-span-2">
                      <Field label="Billing name" name="billing" />
                    </div>
                  </div>

                  {!user && (
                    <p className="mt-4 text-sm text-destructive">
                      {tr("Please sign in above so we can save this order to your dashboard.")}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="mt-6 rounded-full"
                    disabled={placing || !user}
                  >
                     {placing ? tr("Placing your order…") : `${tr("Pay 50% advance")} · ${mad(split.deposit)}`}
                     <ArrowRight className="size-4 rtl:rotate-180" />
                  </Button>
                </form>
              )}

              {step === 3 && (
                <div>
                  <span className="flex size-12 items-center justify-center rounded-full bg-success/15">
                    <CheckCircle2 className="size-6 text-success" />
                  </span>
                   <h2 className="mt-5 text-xl">{tr("Order")} {orderId} {tr("confirmed")}</h2>
                  <p className="mt-2 text-muted-foreground">
                     {tr("Your printer has the job and your artwork. We'll tell you the moment production starts.")}
                  </p>

                  <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                     <Summary icon={Package} label={tr("Printer")} value={placedOrder?.printer ?? tr("Primple partner network")} />
                     <Summary icon={Clock} label={tr("Estimated production")} value={`2–3 ${tr("working days")}`} />
                     <Summary
                       icon={Truck}
                       label={tr("Estimated delivery")}
                       value={placedOrder?.expectedAt ?? tr("Within 5 working days")}
                     />
                     <Summary
                       icon={Lock}
                       label={tr("Advance paid (50%)")}
                       value={mad(split.deposit)}
                     />
                     <Summary
                       icon={Banknote}
                       label={tr("Cash on delivery (50%)")}
                       value={mad(split.balance)}
                     />
                  </dl>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      className="rounded-full"
                      onClick={() => navigate({ to: "/dashboard" })}
                    >
                       {tr("Track my order")}
                       <ArrowRight className="size-4 rtl:rotate-180" />
                    </Button>
                    <Button asChild size="lg" variant="outline" className="rounded-full">
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
                 <dd>{totals.delivery === 0 ? tr("Included") : mad(totals.delivery)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 font-semibold">
                 <dt>{tr("Total")}</dt>
                <dd>{mad(totals.total)}</dd>
              </div>
              <div className="flex justify-between">
                 <dt className="text-muted-foreground">{tr("Advance now (50%)")}</dt>
                <dd>{mad(split.deposit)}</dd>
              </div>
              <div className="flex justify-between">
                 <dt className="text-muted-foreground">{tr("Cash on delivery (50%)")}</dt>
                <dd>{mad(split.balance)}</dd>
              </div>
            </dl>
            <p className="mt-5 text-xs text-muted-foreground">
               {tr("Verified printers · Artwork checked · Tracked delivery")}
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
