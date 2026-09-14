import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/button";
import { getShopOrderStatus } from "@/lib/youcanpay.functions";
import { formatMinorUnits } from "@/lib/youcanpay";
import { useShopifyCart } from "@/store/shopify-cart";
import { useI18n } from "@/i18n";

const title = "Confirmation de commande | Primple";
const description = "Suivez l'état de votre paiement et de votre commande Primple.";

export const Route = createFileRoute("/shop/confirmation")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search['ref'] === "string" ? search['ref'] : "",
  }),
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
  component: ConfirmationPage,
});

type OrderStatus = {
  reference: string;
  status: string;
  amount_cents: number;
  currency: string;
  paid_at: string | null;
};

function ConfirmationPage() {
  const { tr } = useI18n();
  const { ref } = Route.useSearch();
  const readStatus = useServerFn(getShopOrderStatus);
  const clearCart = useShopifyCart((state) => state.clearCart);

  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const cleared = useRef(false);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }
    let active = true;
    let attempts = 0;

    const poll = async () => {
      try {
        const result = (await readStatus({ data: { reference: ref } })) as OrderStatus | null;
        if (!active) return;
        setOrder(result);
        setLoading(false);
        if (result?.status === "paid" && !cleared.current) {
          cleared.current = true;
          clearCart();
        }
        attempts += 1;
        if (result?.status === "pending" && attempts < 10) {
          window.setTimeout(poll, 3000);
        }
      } catch {
        if (active) setLoading(false);
      }
    };

    poll();
    return () => {
      active = false;
    };
  }, [ref, readStatus, clearCart]);

  const status = order?.status ?? "unknown";

  return (
    <SiteShell>
      <div className="section-shell flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground" role="status">
            <Loader2 className="size-5 animate-spin" />
            {tr("Checking your payment…")}
          </div>
        ) : !order ? (
          <>
            <XCircle className="size-10 text-destructive" />
            <h1 className="mt-4 font-display text-3xl font-extrabold">{tr("Order not found")}</h1>
            <p className="mt-2 text-muted-foreground">{tr("We could not find this order.")}</p>
          </>
        ) : (
          <>
            {status === "paid" ? (
              <CheckCircle2 className="size-10 text-primary" />
            ) : status === "failed" ? (
              <XCircle className="size-10 text-destructive" />
            ) : (
              <Clock className="size-10 text-muted-foreground" />
            )}
            <h1 className="mt-4 font-display text-3xl font-extrabold">
              {status === "paid"
                ? tr("Payment confirmed")
                : status === "failed"
                  ? tr("Payment failed")
                  : tr("Payment pending")}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {tr("Order reference")}: <span className="font-medium text-foreground">{order.reference}</span>
            </p>
            <p className="mt-1 text-muted-foreground">
              {formatMinorUnits(order.amount_cents, order.currency)}
            </p>
            {status === "pending" && (
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                {tr("We are waiting for the payment confirmation. This page updates automatically.")}
              </p>
            )}
          </>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link to="/shop">{tr("Back to shop")}</Link>
          </Button>
          {status === "failed" && (
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/shop/checkout">{tr("Try again")}</Link>
            </Button>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
