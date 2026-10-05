import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { AdminShell, NAV, type AdminTab } from "@/components/admin/AdminShell";
import { CatalogTab, CrmTab, TeamTab } from "@/components/admin/AdminTabs";
import { CustomersTab } from "@/components/admin/CustomersTab";
import { InboxTab } from "@/components/admin/InboxTab";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { OverviewTab, ReportsTab } from "@/components/admin/OverviewTab";
import { Button } from "@/components/ui/button";
import { adminMe, adminQueue } from "@/lib/admin.functions";
import { can } from "@/lib/admin-metrics";

type Search = { tab?: string; order?: string; message?: string };
const TAB_IDS = NAV.map((n) => n.id) as string[];
const LEGACY: Record<string, AdminTab> = { messages: "inbox" };

export const Route = createFileRoute("/_authenticated/admin/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ...(typeof s["tab"] === "string" ? { tab: s["tab"] } : {}),
    ...(typeof s["order"] === "string" ? { order: s["order"] } : {}),
    ...(typeof s["message"] === "string" ? { message: s["message"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Espace équipe | Primple" },
      { name: "description", content: "Espace interne de l'équipe Primple." },
      { property: "og:title", content: "Espace équipe | Primple" },
      { property: "og:description", content: "Espace interne de l'équipe Primple." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/" });
  const fetchMe = useServerFn(adminMe);
  const me = useQuery({ queryKey: ["admin", "me"], queryFn: () => fetchMe(), retry: false, staleTime: 60_000 });
  const role = me.data?.role ?? null;
  const fetchQueue = useServerFn(adminQueue);
  const queue = useQuery({ queryKey: ["admin", "queue"], queryFn: () => fetchQueue(), enabled: can(role, "read_ops"), refetchInterval: 60_000 });

  if (me.isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground" role="status">Vérification de vos accès…</div>;
  }
  if (me.error || !role) {
    return <Denied text={me.error ? "Impossible de vérifier vos accès. Réessayez dans un instant." : "Cet espace est réservé à l'équipe Primple."} />;
  }
  if (!can(role, "read_ops")) {
    // Moderators keep payment-only access.
    return (
      <Denied text="Votre accès est limité aux paiements.">
        <Button asChild><Link to="/admin/payments">Ouvrir les paiements</Link></Button>
      </Denied>
    );
  }

  const requested = search.order ? "orders" : search.message ? "inbox" : (LEGACY[search.tab ?? ""] ?? search.tab ?? "overview");
  const allowed = NAV.find((n) => n.id === requested && can(role, n.cap));
  const tab: AdminTab = allowed ? (requested as AdminTab) : "overview";
  const go = (t: AdminTab, extra: { order?: string; message?: string } = {}) =>
    void navigate({ search: { ...(t !== "overview" ? { tab: t } : {}), ...extra } });
  const canWrite = can(role, "write_ops");
  const badges = queue.data ? { inbox: queue.data.unreadCount, orders: queue.data.awaitingPaymentCount + queue.data.late.length, crm: queue.data.crmProblems } : undefined;

  return (
    <AdminShell role={role} email={me.data?.email ?? null} tab={tab} onTab={(t) => go(t)} badges={badges}>
      {tab === "overview" ? <OverviewTab go={go} /> : null}
      {tab === "orders" ? (
        <OrdersTab focusId={search.order ?? null} onFocus={(id) => go("orders", id ? { order: id } : {})} canWrite={canWrite} canMoney={can(role, "confirm_money")} />
      ) : null}
      {tab === "customers" ? <CustomersTab canWrite={canWrite} onOrder={(id) => go("orders", { order: id })} onMessage={(id) => go("inbox", { message: id })} /> : null}
      {tab === "inbox" || tab === "quotes" ? (
        <InboxTab
          quotes={tab === "quotes"}
          focusId={search.message ?? null}
          onFocus={(id) => go(tab, id ? { message: id } : {})}
          canWrite={canWrite}
        />
      ) : null}
      {tab === "catalog" ? <CatalogTab canManage={can(role, "manage_catalog")} /> : null}
      {tab === "reports" ? <ReportsTab /> : null}
      {tab === "team" ? <TeamTab /> : null}
      {tab === "crm" ? <CrmTab /> : null}
      {TAB_IDS.length === 0 ? null : null}
    </AdminShell>
  );
}

function Denied({ text, children }: { text: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-heading text-2xl font-semibold">Accès réservé</h1>
      <p className="max-w-sm text-muted-foreground">{text}</p>
      <div className="flex gap-2">
        {children}
        <Button asChild variant="outline"><Link to="/">Retour au site</Link></Button>
      </div>
    </div>
  );
}
