import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck } from "lucide-react";

import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getYouCanPayConfig, startShopPayment } from "@/lib/youcanpay.functions";
import { formatMinorUnits, loadYouCanPay, type YouCanPayElement, type YouCanPayLocale } from "@/lib/youcanpay";
import { useShopifyCart } from "@/store/shopify-cart";
import { useI18n } from "@/i18n";

const title = "Paiement sécurisé | Primple";
const description = "Réglez votre commande Primple par carte bancaire en dirhams, en toute sécurité.";

export const Route = createFileRoute("/shop/checkout")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ShopCheckoutPage,
});

type Step = "details" | "payment";

function ShopCheckoutPage() {
  const { tr, lang } = useI18n();
  const navigate = useNavigate();
  const items = useShopifyCart((state) => state.items);

  const startPayment = useServerFn(startShopPayment);
  const loadConfig = useServerFn(getYouCanPayConfig);

  const [step, setStep] = useState<Step>("details");
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", address: "" });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const elementRef = useRef<YouCanPayElement | null>(null);

  const totalCents = items.reduce(
    (sum, item) => sum + Math.round(Number(item.price.amount) * 100) * item.quantity,
    0,
  );
  const currency = items[0]?.price.currencyCode ?? "MAD";

  const handleDetails = async (event: React.FormEvent) => {
    event.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const config = await loadConfig({});
      if (!config.configured) throw new Error(tr("Card payment is not available right now."));

      const result = await startPayment({
        data: {
          lines: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
          customer: form,
        },
      });

      setReference(result.reference);
      setStep("payment");

      const yp = await loadYouCanPay();
      const locale: YouCanPayLocale = lang === "ar" ? "ar" : lang === "en" ? "en" : "fr";
      const element = yp(config.publicKey, { locale }).elements({
        token: result.token,
        container: containerRef.current ?? "#youcanpay-form",
      });
      elementRef.current = element;
      await element.mount();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : tr("The payment could not be started."));
      setStep("details");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!elementRef.current || !reference) return;
    setPaying(true);
    setError(null);
    try {
      const result = await elementRef.current.confirm();
      if (result.status === "succeeded") {
        navigate({ to: "/shop/confirmation", search: { ref: reference } });
      } else {
        setError(result.error?.message ?? tr("The payment was declined."));
      }
    } catch {
      setError(tr("The payment was declined."));
    } finally {
      setPaying(false);
    }
  };

  useEffect(() => {
    if (items.length === 0 && step === "details") setError(null);
  }, [items.length, step]);

  return (
    <SiteShell>
      <div className="section-shell py-16">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          {tr("Secure card payment")}
        </h1>

        {items.length === 0 ? (
          <p className="mt-6 text-muted-foreground">{tr("Your cart is empty")}</p>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">
              {step === "details" ? (
                <form onSubmit={handleDetails} className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="name"
                    label={tr("Full name")}
                    value={form.name}
                    onChange={(value) => setForm((f) => ({ ...f, name: value }))}
                    required
                  />
                  <Field
                    id="email"
                    type="email"
                    label={tr("Email")}
                    value={form.email}
                    onChange={(value) => setForm((f) => ({ ...f, email: value }))}
                    required
                  />
                  <Field
                    id="phone"
                    label={tr("Phone")}
                    value={form.phone}
                    onChange={(value) => setForm((f) => ({ ...f, phone: value }))}
                    required
                  />
                  <Field
                    id="city"
                    label={tr("City")}
                    value={form.city}
                    onChange={(value) => setForm((f) => ({ ...f, city: value }))}
                    required
                  />
                  <div className="sm:col-span-2">
                    <Field
                      id="address"
                      label={tr("Delivery address")}
                      value={form.address}
                      onChange={(value) => setForm((f) => ({ ...f, address: value }))}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" size="lg" className="w-full rounded-full" disabled={submitting}>
                      {submitting ? <Loader2 className="size-4 animate-spin" /> : tr("Continue to payment")}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div
                    id="youcanpay-form"
                    ref={containerRef}
                    className="min-h-[280px] rounded-2xl border border-border bg-card p-4"
                  />
                  <Button
                    size="lg"
                    className="w-full rounded-full"
                    onClick={handleConfirm}
                    disabled={paying}
                  >
                    {paying ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      `${tr("Pay")} ${formatMinorUnits(totalCents, currency)}`
                    )}
                  </Button>
                </div>
              )}

              {error && (
                <p className="mt-4 text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </div>

            <aside className="h-fit rounded-2xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">{tr("Order summary")}</h2>
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li key={item.variantId} className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{item.product.node.title}</span>
                      <span className="text-muted-foreground">× {item.quantity}</span>
                    </span>
                    <span className="whitespace-nowrap font-medium">
                      {formatMinorUnits(
                        Math.round(Number(item.price.amount) * 100) * item.quantity,
                        item.price.currencyCode,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="font-semibold">{tr("Total")}</span>
                <span className="text-lg font-bold">{formatMinorUnits(totalCents, currency)}</span>
              </div>
              <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                {tr("Card details are handled by YouCan Pay. Primple never sees or stores your card.")}
              </p>
            </aside>
          </div>
        )}
      </div>
    </SiteShell>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
