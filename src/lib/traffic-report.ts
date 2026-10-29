export type TrafficChannel = "all" | "search" | "ads" | "social" | "direct" | "referral" | "ai";
export type TrafficRow = { label: string; value: number };
export type TrafficMetrics = { visits: number; pageviews: number; pagesPerVisit: number; bounceRate: number; durationSeconds: number };
export type TrafficReport = {
  source: string;
  from: string;
  to: string;
  capturedAt: string;
  includesInternalTraffic: boolean;
  daily: { day: string; visits: number; pageviews: number }[];
  metrics: TrafficMetrics;
  channels: Partial<Record<Exclude<TrafficChannel, "all">, TrafficMetrics>>;
  pages: TrafficRow[];
  sources: TrafficRow[];
  devices: TrafficRow[];
  countries: TrafficRow[];
};

export const CHANNEL_LABELS: Record<TrafficChannel, string> = {
  all: "Tout le trafic", search: "Recherche", ads: "Publicités", social: "Réseaux sociaux",
  direct: "Direct", referral: "Sites référents", ai: "Assistants IA",
};

export function metricsFor(report: TrafficReport, channel: TrafficChannel): TrafficMetrics | null {
  return channel === "all" ? report.metrics : report.channels[channel] ?? null;
}

export function reportTotals(days: TrafficReport["daily"]) {
  const visits = days.reduce((sum, day) => sum + day.visits, 0);
  const pageviews = days.reduce((sum, day) => sum + day.pageviews, 0);
  return { visits, pageviews, pagesPerVisit: visits ? Math.round(pageviews / visits * 100) / 100 : 0 };
}