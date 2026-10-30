import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Globe, Megaphone, Search } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { adminTraffic } from "@/lib/admin.functions";
import { toCsv } from "@/lib/admin-metrics";
import { CHANNEL_LABELS, metricsFor, type TrafficChannel, type TrafficReport, type TrafficRow } from "@/lib/traffic-report";
import { ErrorBox, Loading, Stat } from "./shared";

export function AnalyticsTab() {
  const fetchTraffic = useServerFn(adminTraffic);
  const query = useQuery({ queryKey: ["admin", "traffic"], queryFn: () => fetchTraffic(), staleTime: 300_000, retry: false });
  if (query.error) return <ErrorBox error={query.error} />;
  if (!query.data) return <Loading />;
  return <AnalyticsReport report={query.data} />;
}

const number = (value: number) => new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 2 }).format(value);
const day = (value: string) => value.split("-").reverse().join("/");

export function AnalyticsReport({ report }: { report: TrafficReport }) {
  const [channel, setChannel] = useState<TrafficChannel>("all");
  const [metric, setMetric] = useState<"visits" | "pageviews">("visits");
  const metrics = metricsFor(report, channel);
  const exportReport = () => {
    const csv = toCsv([
      ["Source", "Du", "Au", "Capture UTC", "Canal", "Visites", "Pages vues", "Pages par visite", "Rebond %", "Durée moyenne secondes"],
      ...Object.keys(CHANNEL_LABELS).map((key) => {
        const c = key as TrafficChannel;
        const m = metricsFor(report, c);
        return [report.source, report.from, report.to, report.capturedAt, CHANNEL_LABELS[c], m?.visits ?? "Indisponible", m?.pageviews ?? "Indisponible", m?.pagesPerVisit ?? "Indisponible", m?.bounceRate ?? "Indisponible", m?.durationSeconds ?? "Indisponible"];
      }),
    ]);
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `primple-trafic-${report.from}-${report.to}.csv`; link.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-heading text-xl font-semibold">Audience et acquisition</h2>
          <p className="mt-1 text-sm text-muted-foreground">{day(report.from)} au {day(report.to)} · {report.source}</p>
          <p className="mt-1 text-xs text-muted-foreground">Instantané du {new Date(report.capturedAt).toLocaleString("fr-FR", { timeZone: "UTC" })} UTC. Journée du {day(report.to)} partielle. Aucune actualisation automatique.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportReport}><Download className="size-4" aria-hidden />Exporter CSV</Button>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Canal d'acquisition">
        {Object.entries(CHANNEL_LABELS).map(([key, label]) => <Button key={key} variant={channel === key ? "default" : "outline"} size="sm" aria-pressed={channel === key} onClick={() => setChannel(key as TrafficChannel)}>{label}</Button>)}
      </div>
      {metrics ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Visites" value={number(metrics.visits)} hint="Sessions, pas personnes uniques" />
        <Stat label="Pages vues" value={number(metrics.pageviews)} />
        <Stat label="Pages / visite" value={number(metrics.pagesPerVisit)} />
        <Stat label="Taux de rebond" value={`${number(metrics.bounceRate)} %`} />
        <Stat label="Durée moyenne" value={`${number(metrics.durationSeconds)} s`} />
      </div> : <p className="text-sm text-muted-foreground">Données indisponibles pour ce canal.</p>}
      <p className="text-xs text-muted-foreground">{report.includesInternalTraffic ? "Le trafic inclut les pages internes et les connexions. " : ""}Les canaux et référents utilisent des classifications différentes. Direct signifie qu'aucun référent n'a été enregistré.</p>
      <section className="border-t pt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="font-heading font-semibold">Trafic quotidien, tous canaux</h3>
          <div className="flex gap-1" role="group" aria-label="Mesure du graphique">
            <Button size="sm" variant={metric === "visits" ? "default" : "outline"} onClick={() => setMetric("visits")} aria-pressed={metric === "visits"}>Visites</Button>
            <Button size="sm" variant={metric === "pageviews" ? "default" : "outline"} onClick={() => setMetric("pageviews")} aria-pressed={metric === "pageviews"}>Pages vues</Button>
          </div>
        </div>
        <div className="h-64 w-full min-w-0"><ResponsiveContainer width="100%" height="100%"><LineChart data={report.daily} margin={{ right: 12 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} stroke="var(--muted-foreground)" fontSize={11} />
          <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={11} width={36} />
          <Tooltip labelFormatter={(d: string) => day(d)} />
          <Line dataKey={metric} name={metric === "visits" ? "Visites" : "Pages vues"} stroke="var(--primary)" strokeWidth={2} dot />
        </LineChart></ResponsiveContainer></div>
        <p className="text-xs text-muted-foreground">Les séries quotidiennes par canal ne sont pas disponibles. La méthode de mesure a changé le 26/10/2026.</p>
      </section>
      <div className="grid gap-6 border-t pt-5 lg:grid-cols-2"><Ranking title="Pages les plus visitées" rows={report.pages} hint="Sessions ayant visité chaque page. Une session peut visiter plusieurs pages." /><Ranking title="Référents" rows={report.sources} hint="Principaux référents enregistrés, liste partielle." /></div>
      <div className="grid gap-6 border-t pt-5 sm:grid-cols-2"><Ranking title="Appareils" rows={report.devices} hint="Les catégories manquantes restent inconnues." /><Ranking title="Pays" rows={report.countries} hint="Pays renseignés par la mesure d'audience." /></div>
      <div className="grid gap-5 border-t pt-5 lg:grid-cols-3">
        <Coverage icon={Search} title="SEO" text={`${report.channels.search ? number(report.channels.search.visits) + " visites classées Recherche sur cette période." : "Trafic Recherche indisponible."} Mots-clés, impressions Google et positions : indisponibles sans Search Console.`} />
        <Coverage icon={Megaphone} title="Publicités" text={`${report.channels.ads ? number(report.channels.ads.visits) + " visites classées Publicités." : "Trafic Publicités indisponible."} Dépenses, campagnes et retour publicitaire : indisponibles sans comptes publicitaires connectés.`} />
        <Coverage icon={Globe} title="Actualisation" text="Les rapports Google Analytics ne sont pas connectés. Cet instantané n'ajoute aucun suivi publicitaire et ne mesure pas les conversions de commande." />
      </div>
    </div>
  );
}

function Ranking({ title, rows, hint }: { title: string; rows: TrafficRow[]; hint: string }) {
  return <section className="min-w-0"><h3 className="font-heading font-semibold">{title}</h3><p className="mt-1 text-xs text-muted-foreground">{hint}</p><ul className="mt-3 divide-y text-sm">{rows.map((row) => <li key={row.label} className="flex min-w-0 items-start justify-between gap-3 py-2"><span className="min-w-0 break-all">{row.label}</span><span className="shrink-0 font-medium tabular-nums">{number(row.value)}</span></li>)}</ul></section>;
}

function Coverage({ icon: Icon, title, text }: { icon: typeof Globe; title: string; text: string }) {
  return <section><h3 className="flex items-center gap-2 font-heading font-semibold"><Icon className="size-4 text-primary" aria-hidden />{title}</h3><p className="mt-2 text-sm text-muted-foreground">{text}</p></section>;
}