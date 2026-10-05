import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminOrders, adminQueue, adminReport, adminRecentActivity, type Report } from "@/lib/admin.functions";
import { OPS_LABELS, QUOTE_LABELS, toCsv } from "@/lib/admin-metrics";
import type { AdminTab } from "./AdminShell";
import { ACTION_LABELS, Card, Empty, ErrorBox, Loading, PAYMENT_LABELS, Stat, STATUS_LABELS, fmtDate, mad, useStaff } from "./shared";

const iso = (d: Date) => d.toISOString().slice(0, 10);
function useRange(days = 30) {
  const [from, setFrom] = useState(() => iso(new Date(Date.now() - days * 86400000)));
  const [to, setTo] = useState(() => iso(new Date()));
  return { from, to, setFrom, setTo };
}

function RangePicker({ r }: { r: ReturnType<typeof useRange> }) {
  const preset = (d: number) => {
    r.setFrom(iso(new Date(Date.now() - d * 86400000)));
    r.setTo(iso(new Date()));
  };
  return (
    <div className="flex flex-wrap items-end gap-2">
      {[7, 30, 90, 365].map((d) => (
        <Button key={d} variant="outline" size="sm" onClick={() => preset(d)}>
          {d === 365 ? "12 mois" : `${d} j`}
        </Button>
      ))}
      <label className="text-xs text-muted-foreground">
        Du
        <Input type="date" value={r.from} max={r.to} onChange={(e) => e.target.value && r.setFrom(e.target.value)} className="h-9 w-36" />
      </label>
      <label className="text-xs text-muted-foreground">
        Au
        <Input type="date" value={r.to} min={r.from} onChange={(e) => e.target.value && r.setTo(e.target.value)} className="h-9 w-36" />
      </label>
    </div>
  );
}

function useReport(from: string, to: string) {
  const fetchReport = useServerFn(adminReport);
  return useQuery({ queryKey: ["admin", "report", from, to], queryFn: () => fetchReport({ data: { from, to } }) });
}

function MoneyStats({ r }: { r: Report }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Valeur commandes confirmées" value={mad(r.orderValue)} hint={`${r.confirmed} / ${r.orders} commandes`} />
      <Stat label="Encaissé par Primple" value={mad(r.collected)} hint="En ligne + espèces reversées" />
      <Stat label="Chez les livreurs" value={mad(r.courierHeld)} hint="Encaissé, pas encore reversé" />
      <Stat label="Reste à encaisser" value={mad(r.outstanding)} hint="Soldes à la livraison sans encaissement enregistré" />
    </div>
  );
}

export function OverviewTab({ go }: { go: (t: AdminTab, extra?: { order?: string; message?: string }) => void }) {
  const range = useRange(30);
  const report = useReport(range.from, range.to);
  const fetchQueue = useServerFn(adminQueue);
  const fetchActivity = useServerFn(adminRecentActivity);
  const queue = useQuery({ queryKey: ["admin", "queue"], queryFn: () => fetchQueue(), refetchInterval: 60_000 });
  const activity = useQuery({ queryKey: ["admin", "activity"], queryFn: () => fetchActivity() });
  const { nameOf } = useStaff();
  const q = queue.data;
  return (
    <div className="space-y-5">
      <RangePicker r={range} />
      {report.error ? <ErrorBox error={report.error} /> : !report.data ? <Loading /> : (
        <>
          <MoneyStats r={report.data.report} />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Commandes" value={report.data.report.orders} />
            <Stat label="En production" value={(report.data.report.byProduction["in_production"] ?? 0) + (report.data.report.byProduction["finishing"] ?? 0)} />
            <Stat label="En retard" value={report.data.report.late} tone={report.data.report.late ? "warn" : undefined} hint="Date prévue dépassée" />
            <Stat label="Demandes de devis" value={report.data.report.quotes} />
          </div>
          <Card title="Activité sur la période">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.data.report.daily}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} fontSize={11} stroke="var(--muted-foreground)" />
                  <YAxis fontSize={11} stroke="var(--muted-foreground)" />
                  <Tooltip formatter={(v: number) => mad(v)} labelFormatter={(d: string) => fmtDate(d)} />
                  <Line type="monotone" dataKey="orderValue" name="Valeur confirmée" stroke="var(--primary)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="collected" name="Encaissé" stroke="var(--foreground)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="À traiter">
          {queue.error ? <ErrorBox error={queue.error} /> : !q ? <Loading /> : (
            <ul className="divide-y text-sm">
              <QueueRow label="Messages non lus" n={q.unreadCount} onClick={() => go("inbox")} />
              <QueueRow label="Paiements manuels en attente" n={q.awaitingPaymentCount} onClick={() => go("orders")} />
              <QueueRow label="Commandes en retard" n={q.late.length} onClick={() => go("orders")} />
              <QueueRow label="Commandes payées sans fichier" n={q.missingFiles.length} onClick={() => go("orders")} />
              <QueueRow label="Devis sans suivi depuis 3 jours" n={q.staleQuotes.length} onClick={() => go("quotes")} />
              <QueueRow label="Espèces chez les livreurs" n={q.courierCash.length} onClick={() => go("orders")} />
              {q.crmProblems ? <QueueRow label="Synchronisations CRM en échec" n={q.crmProblems} onClick={() => go("crm")} /> : null}
              {[...q.late.slice(0, 3).map((o) => ({ id: o.id, t: `${o.reference} prévue le ${fmtDate(o.expected_at)}` })), ...q.missingFiles.slice(0, 3).map((o) => ({ id: o.id, t: `${o.reference} : fichier manquant` }))].map((x) => (
                <li key={x.t} className="py-2">
                  <button className="text-left text-primary hover:underline" onClick={() => go("orders", { order: x.id })}>{x.t}</button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Activité récente de l'équipe">
          {activity.error ? <ErrorBox error={activity.error} /> : !activity.data ? <Loading /> : activity.data.audit.length === 0 ? <Empty>Aucune action pour l'instant.</Empty> : (
            <ul className="space-y-2 text-sm">
              {activity.data.audit.map((a) => (
                <li key={a.id} className="flex flex-wrap gap-x-2">
                  <span>{ACTION_LABELS[a.action] ?? a.action}</span>
                  <span className="text-muted-foreground">par {nameOf(a.actor_id)} · {fmtDate(a.at, true)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function QueueRow({ label, n, onClick }: { label: string; n: number; onClick: () => void }) {
  return (
    <li className="flex items-center justify-between py-2">
      <button onClick={onClick} className="text-left hover:underline">{label}</button>
      <span className={n ? "font-semibold" : "text-muted-foreground"}>{n}</span>
    </li>
  );
}

function download(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Breakdown({ title, data, labels }: { title: string; data: Record<string, number>; labels: Record<string, string> }) {
  const rows = Object.entries(data).map(([k, v]) => ({ name: labels[k] ?? k, v }));
  return (
    <Card title={title}>
      {rows.length === 0 ? <Empty>Aucune donnée.</Empty> : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" allowDecimals={false} fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis type="category" dataKey="name" width={130} fontSize={11} stroke="var(--muted-foreground)" />
              <Tooltip />
              <Bar dataKey="v" name="Nombre" fill="var(--primary)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

const METHOD_LABELS: Record<string, string> = {
  card_full: "Carte 100 %",
  bank_transfer_full: "Virement 100 %",
  cashplus_full: "Cash Plus 100 %",
  cod_card_advance: "Livraison, avance carte",
  cod_transfer_advance: "Livraison, avance virement",
  cod_cashplus_advance: "Livraison, avance Cash Plus",
};

export function ReportsTab() {
  const range = useRange(90);
  const report = useReport(range.from, range.to);
  const fetchOrders = useServerFn(adminOrders);
  const [exporting, setExporting] = useState(false);
  const exportOrders = async () => {
    setExporting(true);
    try {
      const rows: unknown[][] = [["Référence", "Date", "Client", "Statut", "Paiement", "Total MAD", "Encaissé MAD", "Chez livreur MAD", "Reste MAD"]];
      for (let page = 0; page < 400; page++) {
        const r = await fetchOrders({ data: { page, from: range.from, to: range.to } });
        for (const o of r.orders)
          rows.push([o.reference, o.created_at.slice(0, 10), o.contact_name ?? o.company ?? "", STATUS_LABELS[o.status] ?? o.status, PAYMENT_LABELS[o.payment_status] ?? o.payment_status, o.total, o.money.collected, o.money.courierHeld, o.money.balanceDue]);
        if ((page + 1) * r.pageSize >= r.total) break;
      }
      download(`primple-commandes-${range.from}-${range.to}.csv`, toCsv(rows));
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <RangePicker r={range} />
        <Button variant="outline" onClick={exportOrders} disabled={exporting}>
          <Download className="size-4" aria-hidden /> {exporting ? "Export…" : "Exporter les commandes (CSV)"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Les montants viennent des paiements confirmés et des encaissements espèces enregistrés. Le statut « Livrée » ne compte jamais comme argent encaissé.
      </p>
      {report.error ? <ErrorBox error={report.error} /> : !report.data ? <Loading /> : (
        <>
          <MoneyStats r={report.data.report} />
          <div className="grid gap-5 lg:grid-cols-2">
            <Breakdown title="Statut client" data={report.data.report.byStatus} labels={STATUS_LABELS} />
            <Breakdown title="Étape de production" data={report.data.report.byProduction} labels={OPS_LABELS} />
            <Breakdown title="Paiement" data={report.data.report.byPayment} labels={PAYMENT_LABELS} />
            <Breakdown title="Mode de paiement" data={report.data.report.byMethod} labels={METHOD_LABELS} />
            <Breakdown title="Pipeline devis" data={report.data.report.byQuoteStage} labels={QUOTE_LABELS} />
          </div>
        </>
      )}
    </div>
  );
}
