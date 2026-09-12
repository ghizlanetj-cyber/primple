import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPin,
  Package,
  PackageSearch,
  Receipt,
  Repeat,
  Star,
  Truck,
} from "lucide-react";

import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { invoices, orders, orderStages, quotes } from "@/data/orders";
import { mad } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";

const title = "Your printing dashboard | Primpel";
const description =
  "Track every print job, compare quotes, reorder past jobs and download invoices in one place.";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/dashboard" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/dashboard" }],
  }),
  component: DashboardPage,
});

type View = "orders" | "quotes" | "invoices";

function DashboardPage() {
  const { t, tr, number } = useI18n();
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("orders");
  const [activeId, setActiveId] = useState(orders[0]!.id);
  const active = orders.find((o) => o.id === activeId)!;
  const activeStageIndex = orderStages.indexOf(active.stage);
  const inProduction = orders.filter((o) => o.stage !== "Delivered").length;
  const spend = orders.reduce((s, o) => s + o.total, 0);

  const nav: { key: View; label: string; icon: React.ElementType }[] = [
    { key: "orders", label: t("dash.nav.orders"), icon: Package },
    { key: "quotes", label: t("dash.nav.quotes"), icon: PackageSearch },
    { key: "invoices", label: t("dash.nav.invoices"), icon: Receipt },
  ];

  return (
    <SiteShell>
      <div className="band-sand border-b border-border">
        <div className="section-shell py-12 md:py-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-muted-foreground">{t("dash.eyebrow")}</p>
              <h1 className="display-xl mt-4 text-4xl sm:text-5xl">
                {t("dash.title")} <span className="display-accent">{t("dash.titleAccent")}</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                {displayName
                  ? `${tr("Welcome back")}, ${displayName}.`
                  : tr("Welcome back to Primpel.")}
              </p>
              {user?.email && (
                <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                  {user.email}
                </p>
              )}
            </div>
            <Button asChild size="lg" className="rounded-full px-7">
              <Link to="/products">
                {t("dash.new")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              icon={LayoutDashboard}
              label={t("dash.kpi.progress")}
              value={String(inProduction)}
              hint={t("dash.kpi.progressHint")}
            />
            <Kpi
              icon={PackageSearch}
              label={t("dash.kpi.quotes")}
              value={String(quotes.length)}
              hint={t("dash.kpi.quotesHint")}
            />
            <Kpi
              icon={Receipt}
              label={t("dash.kpi.spend")}
              value={mad(spend)}
              hint={t("dash.kpi.spendHint")}
            />
            <Kpi
              icon={Truck}
              label={t("dash.kpi.onTime")}
              value="98%"
              hint={t("dash.kpi.onTimeHint")}
            />
          </div>
        </div>
      </div>

      <section className="section-shell grid gap-8 py-12 lg:grid-cols-[16rem_1fr] lg:items-start md:py-16">
        <aside className="surface-card p-3 lg:sticky lg:top-28">
          <nav className="flex gap-1 lg:flex-col">
            {nav.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                className={cn(
                  "flex flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  view === item.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
                aria-current={view === item.key ? "page" : undefined}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-4 hidden rounded-xl bg-secondary/70 p-4 lg:block">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <LifeBuoy className="size-4 text-primary" />
              {t("dash.support")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{t("dash.supportBody")}</p>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full rounded-full">
              <Link to="/platform">{t("dash.supportCta")}</Link>
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full rounded-full"
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="size-4 rtl:rotate-180" />
            {tr("Log out")}
          </Button>
        </aside>

        <div>
          {view === "orders" && (
            <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr] xl:items-start">
              <div className="space-y-3">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setActiveId(order.id)}
                    className={cn(
                      "w-full rounded-2xl border p-5 text-start transition-all",
                      order.id === activeId
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">{order.id}</p>
                        <p className="mt-1 font-display font-bold">
                           {number(order.quantity)} × {tr(order.product)}
                        </p>
                         <p className="mt-1 text-sm text-muted-foreground">{tr(order.config)}</p>
                      </div>
                      <span
                        className={cn(
                          "whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
                          order.stage === "Delivered"
                            ? "bg-success/15 text-success"
                            : "bg-primary/20 text-foreground",
                        )}
                      >
                         {tr(order.stage)}
                      </span>
                    </div>
                    <Progress value={order.progress} className="mt-4 h-1.5" />
                  </button>
                ))}
              </div>

              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="surface-card p-6 shadow-lift"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{active.id}</p>
                     <h2 className="mt-1 text-xl">{tr(active.product)}</h2>
                     <p className="mt-1 text-sm text-muted-foreground">{tr(active.config)}</p>
                  </div>
                  <p className="font-display text-lg font-extrabold">{mad(active.total)}</p>
                </div>

                <ol className="mt-7 space-y-4">
                  {orderStages.map((stage, i) => {
                    const done = i < activeStageIndex;
                    const current = i === activeStageIndex;
                    return (
                      <li key={stage} className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                            done && "border-success bg-success/15 text-success",
                            current && "border-primary bg-primary text-primary-foreground",
                            !done && !current && "border-border text-muted-foreground",
                          )}
                        >
                          {done ? <CheckCircle2 className="size-3.5" /> : i + 1}
                        </span>
                        <div>
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              !done && !current && "text-muted-foreground",
                            )}
                          >
                             {tr(stage)}
                          </p>
                          {current && (
                            <p className="text-sm text-muted-foreground">
                              {t("dash.happening")} {active.printer}.
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>

                <dl className="mt-7 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
                  <Detail icon={Package} label={t("dash.printer")} value={active.printer} />
                  <Detail icon={MapPin} label={t("dash.city")} value={active.city} />
                   <Detail icon={Truck} label={t("dash.expected")} value={tr(active.expected)} />
                   <Detail icon={FileText} label={t("dash.artwork")} value={tr(active.artwork)} />
                </dl>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild className="rounded-full">
                    <Link to="/products/$slug" params={{ slug: active.productSlug }}>
                      <Repeat className="size-4" />
                      {t("dash.reorder")}
                    </Link>
                  </Button>
                  <Button variant="outline" className="rounded-full">
                    <Download className="size-4" />
                    {t("dash.invoice")}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}

          {view === "quotes" && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {quotes.map((q) => (
                <div key={q.id} className="surface-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{q.id}</p>
                      <h3 className="mt-1 text-base">{q.printer}</h3>
                      <p className="text-sm text-muted-foreground">{q.city}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Star className="size-3.5 fill-primary text-primary" />
                      {q.rating}
                    </span>
                  </div>
                   <p className="mt-4 text-sm">{tr(q.product)}</p>
                  <p className="text-sm text-muted-foreground">
                     {number(q.quantity)} {t("dash.units")} · {t("dash.production")}{" "}
                     {tr(q.production)} · {t("dash.delivery")} {tr(q.delivery)}
                  </p>
                  <p className="mt-4 font-display text-2xl font-extrabold">{mad(q.price)}</p>
                   <p className="mt-2 text-sm text-muted-foreground">{tr(q.notes)}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button size="sm" className="rounded-full">
                      {t("dash.accept")}
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full">
                      {t("dash.message")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === "invoices" && (
            <div className="surface-card overflow-x-auto">
              <table className="w-full min-w-[38rem] text-sm">
                <thead className="bg-secondary/60 text-start">
                  <tr>
                    <th className="p-4 text-start font-semibold">{t("dash.inv.invoice")}</th>
                    <th className="p-4 text-start font-semibold">{t("dash.inv.order")}</th>
                    <th className="p-4 text-start font-semibold">{t("dash.inv.date")}</th>
                    <th className="p-4 text-start font-semibold">{t("dash.inv.amount")}</th>
                    <th className="p-4 text-start font-semibold">{t("dash.inv.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-border">
                      <td className="p-4 font-medium">{inv.id}</td>
                      <td className="p-4 text-muted-foreground">{inv.order}</td>
                       <td className="p-4 text-muted-foreground">{tr(inv.date)}</td>
                      <td className="p-4">{mad(inv.amount)}</td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-semibold",
                            inv.status === "Paid"
                              ? "bg-success/15 text-success"
                              : "bg-primary/20 text-foreground",
                          )}
                        >
                           {tr(inv.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
