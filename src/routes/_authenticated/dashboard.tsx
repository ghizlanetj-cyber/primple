import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPin,
  MessagesSquare,
  Package,

  FolderOpen,
  Receipt,
  Repeat,
  Truck,
} from "lucide-react";

import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { orderStages, type OrderStage } from "@/data/orders";
import { listMyOrders, type OrderRecord } from "@/lib/orders-api";
import { artworkFolder, listMyFiles } from "@/lib/files-api";
import { ClientFiles } from "@/components/dashboard/ClientFiles";
import { DesignerChat } from "@/components/dashboard/DesignerChat";

import { invoiceLabels, invoiceNumber } from "@/lib/invoice";
import { mad } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { claimGuestOrder } from "@/lib/orders.functions";
import { clearGuestClaim, readGuestClaim } from "@/lib/guest-claim";

const title = "Votre espace d’impression | Primple";
const description =
  "Suivez chaque impression, consultez vos commandes et téléchargez vos factures au même endroit.";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.lovable.app/dashboard" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://primple.lovable.app/dashboard" }],
  }),
  component: DashboardPage,
});

type View = "orders" | "files" | "chat" | "invoices";

type ViewOrder = {
  id: string;
  product: string;
  productSlug: string;
  config: string;
  quantity: number;
  total: number;
  city: string | null;
  expected: string | null;
  stage: OrderStage;
  progress: number;
};

function DashboardPage() {
  const { t, tr, number, lang } = useI18n();
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("orders");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const L = invoiceLabels[lang];

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: listMyOrders,
    enabled: Boolean(user),
  });

  // An order paid before signing up is attached here, once the email is verified.
  const claimOrder = useServerFn(claimGuestOrder);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!user) return;
    const claim = readGuestClaim();
    if (!claim) return;
    let cancelled = false;
    void claimOrder({ data: { reference: claim.reference, claimToken: claim.claimToken } })
      .then((result) => {
        clearGuestClaim();
        if (!cancelled && result.claimed) {
          void queryClient.invalidateQueries({ queryKey: ["orders", user.id] });
        }
      })
      .catch(() => clearGuestClaim());
    return () => {
      cancelled = true;
    };
  }, [user, claimOrder, queryClient]);

  const {
    data: files = [],
    isLoading: filesLoading,
    isError: filesError,
  } = useQuery({
    queryKey: ["order-files", user?.id],
    queryFn: listMyFiles,
    enabled: Boolean(user),
  });

  const orders = records.map(toViewOrder);
  const activeId = selectedId ?? orders[0]?.id ?? null;
  const active = orders.find((o) => o.id === activeId) ?? null;
  const activeRecord = records.find((r) => r.reference === activeId) ?? null;
  const activeStageIndex = active ? orderStages.indexOf(active.stage) : 0;
  const inProduction = orders.filter((o) => o.stage !== "Delivered").length;
  const delivered = orders.filter((o) => o.stage === "Delivered").length;
  const spend = orders.reduce((s, o) => s + o.total, 0);

  const nav: { key: View; label: string; icon: React.ElementType }[] = [
    { key: "orders", label: t("dash.nav.orders"), icon: Package },
    { key: "files", label: tr("My files"), icon: FolderOpen },
    { key: "chat", label: tr("Designer chat"), icon: MessagesSquare },
    { key: "invoices", label: t("dash.nav.invoices"), icon: Receipt },
  ];


  return (
    <SiteShell>
      <div className="band-sand border-b border-border">
        <div className="section-shell pb-8 pt-24 sm:pb-10 sm:pt-28 md:py-16 md:pt-32 lg:pt-36">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="min-w-0">
              <p className="eyebrow text-muted-foreground">{t("dash.eyebrow")}</p>
              <h1 className="display-xl mt-3 text-3xl sm:mt-4 sm:text-4xl md:text-5xl">
                {t("dash.title")} <span className="display-accent">{t("dash.titleAccent")}</span>
              </h1>
              <p className="mt-4 text-base text-muted-foreground md:text-lg">
                {displayName
                  ? `${tr("Welcome back")}, ${displayName}.`
                  : tr("Welcome back to Primple.")}
              </p>
              {user?.email && (
                <p className="mt-1 break-all text-sm text-muted-foreground" dir="ltr">
                  {user.email}
                </p>
              )}
            </div>
            <Button asChild size="lg" className="w-full rounded-full px-7 sm:w-auto">
              <Link to="/products">
                {t("dash.new")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 md:grid-cols-3">
            <Kpi
              icon={LayoutDashboard}
              label={t("dash.kpi.progress")}
              value={String(inProduction)}
              hint={t("dash.kpi.progressHint")}
            />
            <Kpi
              icon={Truck}
              label={tr("Delivered orders")}
              value={String(delivered)}
              hint={tr("Across your Primple account")}
            />
            <div className="col-span-2 md:col-span-1">
              <Kpi
                icon={Receipt}
                label={t("dash.kpi.spend")}
                value={mad(spend)}
                hint={tr("Across your Primple account")}
              />
            </div>
          </div>
        </div>
      </div>

      <section className="section-shell grid gap-6 py-8 md:gap-8 md:py-12 lg:grid-cols-[16rem_1fr] lg:items-start lg:py-16">
        <aside className="surface-card p-2 sm:p-3 lg:sticky lg:top-28">
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:flex lg:flex-col">
            {nav.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                className={cn(
                  "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-center text-[11px] font-semibold leading-tight transition-colors sm:min-h-11 sm:flex-row sm:gap-2.5 sm:rounded-xl sm:px-3.5 sm:py-2.5 sm:text-sm lg:justify-start lg:text-start",
                  view === item.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
                aria-current={view === item.key ? "page" : undefined}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="w-full truncate sm:w-auto">{item.label}</span>
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
              <Link to="/contact">{t("dash.supportCta")}</Link>
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full rounded-full sm:mt-4"
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="size-4 rtl:rotate-180" />
            {tr("Log out")}
          </Button>
        </aside>

        <div className="min-w-0">
          {isLoading && view !== "files" && view !== "chat" && (
            <div className="surface-card p-10 text-center text-muted-foreground">
              {tr("Loading your orders…")}
            </div>
          )}

          {!isLoading && orders.length === 0 && view !== "files" && view !== "chat" && (

            <div className="surface-card p-8 text-center md:p-10">
              <Package className="mx-auto size-8 text-primary" />
              <h2 className="mt-4 text-xl">{tr("No orders yet")}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {tr("Once you place a print job it appears here with live production tracking.")}
              </p>
              <Button asChild className="mt-6 rounded-full">
                <Link to="/products">{tr("Start a print job")}</Link>
              </Button>
            </div>
          )}

          {!isLoading && orders.length > 0 && view === "orders" && active && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:items-start">
              <div className="space-y-3">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    className={cn(
                      "w-full min-w-0 overflow-hidden rounded-xl border p-4 text-start transition-all sm:rounded-2xl sm:p-5",
                      order.id === activeId
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <div className="grid min-w-0 grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{order.id}</p>
                        <p className="mt-1 font-display font-bold">
                          {number(order.quantity)} × {tr(order.product)}
                        </p>
                        <p className="mt-1 break-words text-sm text-muted-foreground">
                          {tr(order.config)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "max-w-full justify-self-start whitespace-normal rounded-full px-3 py-1 text-start text-xs font-semibold leading-snug sm:justify-self-end",
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
                className="surface-card p-4 shadow-lift sm:p-6"
              >
                 <div className="grid min-w-0 grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{active.id}</p>
                    <h2 className="mt-1 text-xl">{tr(active.product)}</h2>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {tr(active.config)}
                    </p>
                  </div>
                   <p className="break-words font-display text-lg font-extrabold sm:text-end">
                     {mad(active.total)}
                   </p>
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
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            !done && !current && "text-muted-foreground",
                          )}
                        >
                          {tr(stage)}
                        </p>
                      </li>
                    );
                  })}
                </ol>

                <dl className="mt-7 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
                  <Detail
                    icon={MapPin}
                    label={t("dash.city")}
                    value={active.city ?? tr("Not provided")}
                  />
                  <Detail
                    icon={Truck}
                    label={t("dash.expected")}
                    value={active.expected ?? tr("Not provided")}
                  />
                </dl>

                {activeRecord && (
                  <ClientFiles
                    files={files.filter(
                      (f) =>
                        f.orderId === activeRecord.id ||
                        f.orderReference === activeRecord.reference,
                    )}
                    isLoading={filesLoading}
                    isError={filesError}
                    {...(user ? { folder: artworkFolder(user.id, activeRecord.reference) } : {})}
                  />
                )}

                <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
                  <Button asChild className="w-full rounded-full sm:w-auto">
                    <Link to="/products/$slug" params={{ slug: active.productSlug }}>
                      <Repeat className="size-4" />
                      {t("dash.reorder")}
                    </Link>
                  </Button>
                  {activeRecord && (
                    <Button asChild variant="outline" className="w-full rounded-full sm:w-auto">
                      <Link
                        to="/invoice/$reference"
                        params={{ reference: activeRecord.reference }}
                        aria-label={`${L.download} ${invoiceNumber(activeRecord)}`}
                      >
                        <FileText className="size-4" />
                        {L.open}
                      </Link>
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {view === "files" && (
            <div className="surface-card p-4 sm:p-6">
              <h2 className="text-xl">{tr("My files")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {tr("Every file you uploaded, newest first, with the order it belongs to.")}
              </p>
              <ClientFiles
                files={files}
                isLoading={filesLoading}
                isError={filesError}
                heading={false}
                showOrder
                {...(user ? { folder: `${user.id}/` } : {})}
              />
            </div>
          )}

          {view === "chat" && <DesignerChat userId={user?.id} />}



          {!isLoading && orders.length > 0 && view === "invoices" && (
            <>
              <div className="grid gap-3 md:grid-cols-2 lg:hidden">
                {records.map((record) => (
                  <article key={record.id} className="surface-card p-4">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-display font-bold">{invoiceNumber(record)}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{record.reference}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-primary/20 px-2.5 py-1 text-xs font-semibold text-foreground">
                        {record.paymentStatus === "paid" ? L.advancePaid : L.pendingPayment}
                      </span>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">{t("dash.inv.date")}</dt>
                        <dd className="mt-1 font-medium">
                          {new Date(record.createdAt).toLocaleDateString(
                            lang === "fr" ? "fr-MA" : lang === "ar" ? "ar-MA" : "en-GB",
                          )}
                        </dd>
                      </div>
                      <div className="text-end">
                        <dt className="text-xs text-muted-foreground">{t("dash.inv.amount")}</dt>
                        <dd className="mt-1 font-medium">{mad(record.total)}</dd>
                      </div>
                    </dl>
                    <Button asChild variant="outline" className="mt-4 w-full rounded-full">
                      <Link
                        to="/invoice/$reference"
                        params={{ reference: record.reference }}
                        aria-label={`${L.invoice} ${invoiceNumber(record)}`}
                      >
                        <FileText className="size-4" />
                        {L.open}
                      </Link>
                    </Button>
                  </article>
                ))}
              </div>
              <div className="surface-card hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[36rem] text-sm">
                <thead className="bg-secondary/60 text-start">
                  <tr>
                    <th className="p-4 text-start font-semibold">{t("dash.inv.invoice")}</th>
                    <th className="p-4 text-start font-semibold">{t("dash.inv.order")}</th>
                    <th className="p-4 text-start font-semibold">{t("dash.inv.date")}</th>
                    <th className="p-4 text-start font-semibold">{t("dash.inv.amount")}</th>
                    <th className="p-4 text-start font-semibold">{t("dash.inv.status")}</th>
                    <th className="p-4 text-start font-semibold">
                      <span className="sr-only">{L.invoice}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-t border-border">
                      <td className="p-4 font-medium">{invoiceNumber(record)}</td>
                      <td className="p-4 text-muted-foreground">{record.reference}</td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(record.createdAt).toLocaleDateString(
                          lang === "fr" ? "fr-MA" : lang === "ar" ? "ar-MA" : "en-GB",
                        )}
                      </td>
                      <td className="p-4">{mad(record.total)}</td>
                      <td className="p-4">
                        <span className="rounded-full bg-primary/20 px-2.5 py-1 text-xs font-semibold text-foreground">
                          {record.paymentStatus === "paid" ? L.advancePaid : L.pendingPayment}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link
                          to="/invoice/$reference"
                          params={{ reference: record.reference }}
                          className="font-semibold hover:text-primary"
                          aria-label={`${L.invoice} ${invoiceNumber(record)}`}
                        >
                          {L.open}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
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
    <div className="surface-card h-full p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 shrink-0 text-primary" />
      </div>
      <p className="mt-2 break-words font-display text-xl font-extrabold sm:text-3xl">{value}</p>
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
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

const stageProgress: Record<string, number> = {
  "Order placed": 12,
  "Artwork approved": 30,
  "In production": 58,
  "Quality check": 80,
  Shipped: 92,
  Delivered: 100,
};

function toViewOrder(record: OrderRecord): ViewOrder {
  const first = record.items[0];
  const stage = (
    orderStages.includes(record.status) ? record.status : "Order placed"
  ) as OrderStage;
  return {
    id: record.reference,
    product: first?.name ?? "Print job",
    productSlug: first?.slug ?? "business-cards",
    config:
      record.items
        .map((i) => i.config)
        .filter(Boolean)
        .join(" · ") || "Custom configuration",
    quantity: record.items.reduce((sum, i) => sum + i.quantity, 0),
    total: record.total,
    city: record.city,
    expected: record.expectedAt,
    stage,
    progress: stageProgress[stage] ?? 12,
  };
}
