import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { SiteShell } from "@/components/layout/SiteShell";
import { useI18n } from "@/i18n";
import { getPaymentDiagnostics } from "@/lib/payment-support.functions";
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
