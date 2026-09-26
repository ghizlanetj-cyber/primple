import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { confirmBankTransfer, listPendingTransfers } from "@/lib/bank-transfer.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { SiteShell } from "@/components/layout/SiteShell";
import { useI18n } from "@/i18n";
import { getPaymentDiagnostics, getPaymentSetupChecklist } from "@/lib/payment-support.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  head: () => ({
    meta: [
      { title: "Diagnostic des paiements | Primple" },
      { name: "description", content: "Suivi interne des paiements YouCan Pay de Primple." },
      { property: "og:title", content: "Diagnostic des paiements | Primple" },
      { property: "og:description", content: "Suivi interne des paiements YouCan Pay de Primple." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PaymentDiagnostics,
});

function PaymentDiagnostics() {
  const { tr } = useI18n();
  const fetchDiagnostics = useServerFn(getPaymentDiagnostics);
  const { data, isLoading, error } = useQuery({
    queryKey: ["payment-diagnostics"],
    queryFn: () => fetchDiagnostics(),
    refetchInterval: 15000,
  });

  return (
    <SiteShell>
      <div className="section-shell py-12">
        <h1 className="text-2xl font-bold">{tr("Payment diagnostics")}</h1>
        <SetupChecklist />
        <PendingTransfers />
        {isLoading ? (
          <p className="mt-6 text-muted-foreground">…</p>
        ) : error ? (
          <p className="mt-6 text-destructive">{tr("Diagnostics could not be loaded.")}</p>
        ) : !data?.allowed ? (
          <p className="mt-6 text-muted-foreground">{tr("This page is reserved for the Primple team.")}</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase">
                <tr>
                  {["Date", "Order", "Step", "Environment", "Result", "Token ID", "Transaction ID", "HTTP", "Detail"].map((h) => (
                    <th key={h} className="px-3 py-2">{tr(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.events.map((e) => (
                  <tr key={e.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap px-3 py-2">{new Date(e.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2">{e.reference ?? "—"}</td>
                    <td className="px-3 py-2">{e.event}</td>
                    <td className="px-3 py-2">{e.environment}</td>
                    <td className={cn("px-3 py-2 font-medium", e.ok ? "text-primary" : "text-destructive")}>
                      {e.ok ? "OK" : tr("Failed")}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{e.youcanpay_token_id ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{e.youcanpay_transaction_id ?? "—"}</td>
                    <td className="px-3 py-2">{e.http_status ?? "—"}</td>
                    <td className="px-3 py-2">{e.detail ?? "—"}</td>
                  </tr>
                ))}
                {data.events.length === 0 && (
                  <tr><td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">{tr("No payment activity yet.")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SiteShell>
  );
}

function PendingTransfers() {
  const { tr } = useI18n();
  const fetchPending = useServerFn(listPendingTransfers);
  const confirm = useServerFn(confirmBankTransfer);
  const [busy, setBusy] = useState<string | null>(null);
  const { data, refetch } = useQuery({ queryKey: ["pending-transfers"], queryFn: () => fetchPending() });
  if (!data?.allowed) return null;
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-semibold">{tr("Bank transfers to verify")}</h2>
      {data.orders.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">—</p>
      ) : (
        <ul className="mt-3 divide-y divide-border text-sm">
          {data.orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span>
                <span className="font-medium">{o.reference}</span> · {o.contact_name ?? "—"} · {tr("Total")}{" "}
                {Number(o.total).toFixed(2)} MAD · {tr("Advance by bank transfer")} {Number(o.deposit_amount).toFixed(2)} MAD
              </span>
              <button
                className="rounded-full bg-primary px-4 py-1.5 text-primary-foreground disabled:opacity-50"
                disabled={busy === o.id}
                onClick={async () => {
                  if (!window.confirm(`${tr("Confirm payment")} — ${o.reference} ?`)) return;
                  setBusy(o.id);
                  try {
                    await confirm({ data: { orderId: o.id } });
                  } finally {
                    setBusy(null);
                    refetch();
                  }
                }}
              >
                {tr("Confirm payment")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SetupChecklist() {
  const { tr } = useI18n();
  const fetchChecklist = useServerFn(getPaymentSetupChecklist);
  const { data, refetch, isFetching } = useQuery({ queryKey: ["payment-checklist"], queryFn: () => fetchChecklist() });
  if (!data?.allowed) return null;
  const ready = data.checks.every((c) => c.status === "ok");
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{tr("Before publishing")}</h2>
        <button className="text-sm text-primary underline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "…" : tr("Re-check")}
        </button>
      </div>
      <p className={cn("mt-1 text-sm", ready ? "text-primary" : "text-muted-foreground")}>
        {ready ? tr("Everything is ready for payments.") : tr("Fix the items below before publishing.")}
      </p>
      <ul className="mt-4 space-y-2">
        {data.checks.map((c) => (
          <li key={c.id} className="flex gap-3 text-sm">
            <span className={cn("font-bold", c.status === "ok" ? "text-primary" : c.status === "fail" ? "text-destructive" : "text-muted-foreground")}>
              {c.status === "ok" ? "✓" : c.status === "fail" ? "✗" : "?"}
            </span>
            <span>
              <span className="font-medium">{tr(c.label)}</span>
              <span className="block break-all text-muted-foreground">{c.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
