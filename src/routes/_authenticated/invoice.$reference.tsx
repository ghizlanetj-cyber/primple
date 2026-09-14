import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download } from "lucide-react";

import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/button";
import { mad } from "@/lib/format";
import { listMyOrders } from "@/lib/orders-api";
import { invoiceLabels, invoiceNumber, missingInvoiceFields } from "@/lib/invoice";
import { contact } from "@/config/contact";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/_authenticated/invoice/$reference")({
  head: () => ({
    meta: [
      { title: "Facture | Primple" },
      { name: "description", content: "Facture Primple liée à votre commande d'impression." },
      { property: "og:title", content: "Facture | Primple" },
      {
        property: "og:description",
        content: "Facture Primple liée à votre commande d'impression.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvoicePage,
});

function InvoicePage() {
  const { reference } = Route.useParams();
  const { lang, dir, number, tr } = useI18n();
  const { user } = useAuth();
  const L = invoiceLabels[lang];

  // RLS scopes this query to the signed-in customer, so another
  // customer's invoice can never be resolved here.
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: listMyOrders,
    enabled: Boolean(user),
  });
  const order = orders.find((o) => o.reference === reference) ?? null;

  if (isLoading) {
    return (
      <SiteShell>
        <div className="section-shell py-24 text-center text-muted-foreground">…</div>
      </SiteShell>
    );
  }

  if (!order) {
    return (
      <SiteShell>
        <div className="section-shell py-24 text-center">
          <h1 className="text-3xl">{L.notFound}</h1>
          <Button asChild className="mt-8 rounded-full">
            <Link to="/dashboard">{L.back}</Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  const paid = order.depositPaid ? L.advancePaid : L.pendingPayment;
  const missingFields = missingInvoiceFields(order);
  const created = new Date(order.createdAt).toLocaleDateString(
    lang === "fr" ? "fr-MA" : lang === "ar" ? "ar-MA" : "en-GB",
  );

  if (missingFields.length > 0) {
    return (
      <SiteShell>
        <section className="section-shell py-24 text-center" dir={dir}>
          <h1 className="text-3xl">{L.incomplete}</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {L.missingFields}: <code dir="ltr">{missingFields.join(", ")}</code>
          </p>
          <Button asChild className="mt-8 rounded-full">
            <Link to="/dashboard">{L.back}</Link>
          </Button>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="section-shell py-10 md:py-16" dir={dir}>
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/dashboard">
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {L.back}
            </Link>
          </Button>
          <Button
            className="rounded-full"
            onClick={() => window.print()}
            aria-label={`${L.download} ${invoiceNumber(order)}`}
          >
            <Download className="size-4" />
            {L.download}
          </Button>
        </div>

        <article className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-8 print:border-0 print:p-0 print:shadow-none">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
            <div>
              <p className="font-display text-2xl font-extrabold">Primple</p>
              <p className="mt-1 text-sm text-muted-foreground">{contact.address}</p>
              <p className="text-sm text-muted-foreground" dir="ltr">
                {contact.email} · {contact.phone}
              </p>
            </div>
            <div className="text-start sm:text-end">
              <h1 className="text-2xl">{L.invoice}</h1>
              <p className="mt-1 text-sm">
                {L.invoiceNo}: <span className="font-semibold">{invoiceNumber(order)}</span>
              </p>
              <p className="text-sm">
                {L.order}: <span className="font-semibold">{order.reference}</span>
              </p>
              <p className="text-sm">
                {L.date}: <span className="font-semibold">{created}</span>
              </p>
            </div>
          </header>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {L.billedTo}
              </h2>
              <p className="mt-2 text-sm">{order.customerName ?? L.notProvided}</p>
              {order.company && <p className="text-sm">{order.company}</p>}
              <p className="text-sm" dir="ltr">
                {order.email ?? L.notProvided}
              </p>
              <p className="text-sm" dir="ltr">
                {order.phone ?? L.notProvided}
              </p>
              <p className="text-sm">
                {[order.address, order.postcode, order.city].filter(Boolean).join(", ") ||
                  L.notProvided}
              </p>
            </div>
            <div className="sm:text-end">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {L.orderStatus}
              </h2>
              <p className="mt-2 text-sm">{tr(order.status)}</p>
              <h2 className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {L.paymentStatus}
              </h2>
              <p className="mt-2 text-sm">{paid}</p>
            </div>
          </div>

          <div className="mt-8 -mx-5 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="bg-secondary/60">
                <tr>
                  <th className="p-3 text-start font-semibold">{L.item}</th>
                  <th className="p-3 text-start font-semibold">{L.config}</th>
                  <th className="p-3 text-end font-semibold">{L.qty}</th>
                  <th className="p-3 text-end font-semibold">{L.unit}</th>
                  <th className="p-3 text-end font-semibold">{L.amount}</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={`${item.slug}-${i}`} className="border-t border-border align-top">
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3 text-muted-foreground">{item.config || "—"}</td>
                    <td className="p-3 text-end">{number(item.quantity)}</td>
                    <td className="p-3 text-end">{mad(item.unitPrice)}</td>
                    <td className="p-3 text-end">{mad(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-6 ms-auto grid max-w-sm gap-2 text-sm">
            <Row label={L.subtotal} value={mad(order.subtotal)} />
            <Row label={L.delivery} value={mad(order.delivery)} />
            <Row label={L.total} value={mad(order.total)} strong />
          </dl>

          <p className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
            {L.terms}
          </p>
        </article>
      </section>
    </SiteShell>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={
        strong ? "flex justify-between border-t border-border pt-2 font-semibold" : "flex justify-between"
      }
    >
      <dt className={strong ? "" : "text-muted-foreground"}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
