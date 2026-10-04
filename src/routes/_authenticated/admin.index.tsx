import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  adminCustomers,
  adminFileUrl,
  adminMessages,
  adminOrders,
  adminOverview,
  adminRetryCrmJob,
  adminRecordBalance,
  adminRunCrmWorker,
  adminUpdateMessage,
  adminUpdateOrderOps,
} from "@/lib/admin.functions";
import { OPS_STAGES } from "@/lib/admin-metrics";
import { cn } from "@/lib/utils";

type Search = { tab?: string; order?: string; message?: string };
type AdminOrder = Awaited<ReturnType<typeof adminOrders>>["orders"][number];
type AdminMessage = Awaited<ReturnType<typeof adminMessages>>["messages"][number];
type CrmProblem = Awaited<ReturnType<typeof adminOverview>>["crm"]["problems"][number];
type OrderItem = { quantity?: number; name?: string; config?: string; subtotal?: number };
const orderItems = (items: unknown): OrderItem[] =>
  Array.isArray(items) ? (items as OrderItem[]) : [];

export const Route = createFileRoute("/_authenticated/admin/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ...(typeof s["tab"] === "string" ? { tab: s["tab"] } : {}),
    ...(typeof s["order"] === "string" ? { order: s["order"] } : {}),
    ...(typeof s["message"] === "string" ? { message: s["message"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Administration | Primple" },
      {
        name: "description",
        content: "Tableau de bord interne Primple : commandes, clients, messages et CRM.",
      },
      { property: "og:title", content: "Administration | Primple" },
      { property: "og:description", content: "Tableau de bord interne Primple." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const mad = (n: number) =>
  `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 2 }).format(n)} MAD`;
const TABS = [
  ["overview", "Vue d'ensemble"],
  ["orders", "Commandes"],
  ["customers", "Clients"],
  ["messages", "Messages"],
  ["crm", "CRM Zoho"],
] as const;

function AdminPage() {
  const search = Route.useSearch();
  const initial = search.order
    ? "orders"
    : search.message
      ? "messages"
      : (search.tab ?? "overview");
  const [tab, setTab] = useState(initial);
  const fetchOverview = useServerFn(adminOverview);
  const overview = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => fetchOverview(),
    retry: false,
  });

  if (overview.error) {
    return (
      <SiteShell>
        <div className="section-shell py-16">
          <h1 className="text-2xl">Administration</h1>
          <p className="mt-4 text-muted-foreground">Cette page est réservée à l'équipe Primple.</p>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="section-shell py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Administration</h1>
          <Link to="/admin/payments" className="text-sm text-primary hover:underline">
            Diagnostic des paiements →
          </Link>
        </div>
        <nav className="mt-6 flex flex-wrap gap-2">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm",
                tab === id ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
            >
              {label}
            </button>
          ))}
        </nav>
        {!overview.data ? (
          <p className="mt-8 text-muted-foreground">Chargement…</p>
        ) : tab === "overview" ? (
          <Overview data={overview.data} />
        ) : tab === "orders" ? (
          <Orders focusId={search.order ?? null} />
        ) : tab === "customers" ? (
          <Customers />
        ) : tab === "messages" ? (
          <Messages />
        ) : (
          <Crm data={overview.data} />
        )}
      </div>
    </SiteShell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="surface-card p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Overview({ data }: { data: Awaited<ReturnType<typeof adminOverview>> }) {
  const s = data.summary;
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        label="Valeur des commandes confirmées"
        value={mad(s.orderValue)}
        hint={`${s.confirmed} commandes`}
      />
      <Stat label="Encaissé" value={mad(s.collected)} hint="Carte, virement, Cash Plus confirmés" />
      <Stat label="Solde à encaisser à la livraison" value={mad(s.balanceDue)} />
      <Stat label="En attente de paiement" value={s.pendingPayment} />
      <Stat label="En production" value={s.inProduction} />
      <Stat label="Expédiées / livrées" value={s.completed} />
      <Stat label="Messages non lus" value={s.unreadMessages} />
      <Stat label="Devis ouverts" value={s.openQuotes} />
    </div>
  );
}

function Orders({ focusId }: { focusId: string | null }) {
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(focusId);
  const fetchOrders = useServerFn(adminOrders);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", page, q, focusId],
    queryFn: () =>
      fetchOrders({ data: { page, q, ...(focusId && !q ? { orderId: focusId } : {}) } }),
  });
  return (
    <div className="mt-8">
      <Input
        placeholder="Rechercher (référence, email, nom)"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(0);
        }}
        className="max-w-sm"
      />
      {isLoading || !data ? (
        <p className="mt-6 text-muted-foreground">Chargement…</p>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {data.orders.map((o) => (
              <div key={o.id} className="surface-card p-4">
                <button
                  className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
                  onClick={() => setOpenId(openId === o.id ? null : o.id)}
                >
                  <span className="font-semibold">{o.reference}</span>
                  <span className="text-sm text-muted-foreground">
                    {o.contact_name ?? "—"} · {o.email ?? o.guest_email ?? "—"}
                  </span>
                  <span className="text-sm">{mad(Number(o.total))}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {o.payment_status} · {o.payment_method}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {o.ops?.ops_stage ?? "new"} / {o.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("fr-MA")}
                  </span>
                </button>
                {openId === o.id ? <OrderDetail order={o} /> : null}
              </div>
            ))}
          </div>
          <Pager page={page} setPage={setPage} total={data.total} size={data.pageSize} />
        </>
      )}
    </div>
  );
}

function OrderDetail({ order }: { order: AdminOrder }) {
  const qc = useQueryClient();
  const save = useServerFn(adminUpdateOrderOps);
  const sign = useServerFn(adminFileUrl);
  const recordBalance = useServerFn(adminRecordBalance);
  const balanceMutation = useMutation({
    mutationFn: (remitted: boolean) => recordBalance({ data: { orderId: order.id, remitted } }),
    onSuccess: () => {
      toast.success("Encaissement enregistré");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Échec"),
  });
  const [form, setForm] = useState({
    ops_stage: order.ops?.ops_stage ?? "new",
    internal_notes: order.ops?.internal_notes ?? "",
    supplier: order.ops?.supplier ?? "",
    cost_mad: order.ops?.cost_mad ?? "",
    delivery_notes: order.ops?.delivery_notes ?? "",
    production_notes: order.ops?.production_notes ?? "",
  });
  const mutation = useMutation({
    mutationFn: () => save({ data: { orderId: order.id, ...form } }),
    onSuccess: () => {
      toast.success("Enregistré");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Échec de l'enregistrement"),
  });
  return (
    <div className="mt-4 grid gap-6 border-t border-border pt-4 lg:grid-cols-2">
      <div className="space-y-3 text-sm">
        <p>
          <b>Client :</b> {order.contact_name} {order.company ? `(${order.company})` : ""} ·{" "}
          {order.phone}
        </p>
        <p>
          <b>Adresse :</b> {[order.address, order.postcode, order.city].filter(Boolean).join(", ")}
        </p>
        <p>
          <b>Paiement :</b> total {mad(Number(order.total))} · dû en ligne{" "}
          {mad(Number(order.deposit_amount))} · solde {mad(Number(order.balance_amount))} ·{" "}
          {order.payment_status}
          {order.paid_at ? ` le ${new Date(order.paid_at).toLocaleString("fr-MA")}` : ""}
        </p>
        {Number(order.balance_amount) > 0 && order.deposit_paid && (
          <div className="rounded-lg border border-border p-3">
            <p>
              <b>Solde espèces :</b>{" "}
              {order.balance
                ? `${mad(Number(order.balance.amount))} encaissé le ${new Date(order.balance.recorded_at).toLocaleDateString("fr-MA")} · ${order.balance.remitted ? "reversé par le livreur" : "pas encore reversé par le livreur"}`
                : "non encaissé (« Livré » ne signifie pas que l'argent a été reversé)"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {!order.balance && (
                <Button size="sm" variant="outline" disabled={balanceMutation.isPending} onClick={() => balanceMutation.mutate(false)}>
                  Solde encaissé par le livreur
                </Button>
              )}
              {!order.balance?.remitted && (
                <Button size="sm" disabled={balanceMutation.isPending} onClick={() => balanceMutation.mutate(true)}>
                  Solde reversé à Primple
                </Button>
              )}
            </div>
          </div>
        )}
        <ul className="list-disc ps-5">
          {orderItems(order.items).map((i, idx) => (
            <li key={idx}>
              {i.quantity} × {i.name} — {i.config} ({mad(Number(i.subtotal ?? 0))})
            </li>
          ))}
        </ul>
        <div>
          <b>Fichiers :</b>
          {order.files.length === 0 ? (
            " aucun"
          ) : (
            <ul className="mt-1 space-y-1">
              {order.files.map((f) => (
                <li key={f.id}>
                  <button
                    className="text-primary hover:underline"
                    onClick={async () => {
                      try {
                        const r = await sign({ data: { fileId: f.id } });
                        window.open(r.url, "_blank", "noopener");
                      } catch {
                        toast.error("Lien indisponible");
                      }
                    }}
                  >
                    {f.file_name}
                  </button>{" "}
                  <span className="text-xs text-muted-foreground">
                    {Math.round(f.size_bytes / 1024)} Ko · {f.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          CRM :{" "}
          {order.crm.length
            ? order.crm
                .map(
                  (c) =>
                    `${c.entity_type} ${c.status}${c.last_error_code ? ` (${c.last_error_code})` : ""}`,
                )
                .join(" · ")
            : "aucune synchronisation"}
        </p>
      </div>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <label className="block text-xs uppercase text-muted-foreground">
          Étape de production (interne)
        </label>
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={form.ops_stage}
          onChange={(e) => setForm({ ...form, ops_stage: e.target.value })}
        >
          {OPS_STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Input
          placeholder="Fournisseur"
          value={form.supplier}
          onChange={(e) => setForm({ ...form, supplier: e.target.value })}
        />
        <Input
          placeholder="Coût (MAD)"
          inputMode="decimal"
          value={form.cost_mad}
          onChange={(e) => setForm({ ...form, cost_mad: e.target.value })}
        />
        <Textarea
          placeholder="Notes internes (jamais visibles par le client)"
          value={form.internal_notes}
          onChange={(e) => setForm({ ...form, internal_notes: e.target.value })}
        />
        <Textarea
          placeholder="Notes de production"
          value={form.production_notes}
          onChange={(e) => setForm({ ...form, production_notes: e.target.value })}
        />
        <Textarea
          placeholder="Notes de livraison"
          value={form.delivery_notes}
          onChange={(e) => setForm({ ...form, delivery_notes: e.target.value })}
        />
        <Button type="submit" disabled={mutation.isPending} className="rounded-full">
          Enregistrer
        </Button>
      </form>
    </div>
  );
}

function Pager({
  page,
  setPage,
  total,
  size,
}: {
  page: number;
  setPage: (n: number) => void;
  total: number;
  size: number;
}) {
  const last = Math.max(0, Math.ceil(total / size) - 1);
  return (
    <div className="mt-4 flex items-center gap-3 text-sm">
      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
        Précédent
      </Button>
      <span>
        {page + 1} / {last + 1} · {total}
      </span>
      <Button variant="outline" size="sm" disabled={page >= last} onClick={() => setPage(page + 1)}>
        Suivant
      </Button>
    </div>
  );
}

function Customers() {
  const fetchCustomers = useServerFn(adminCustomers);
  const { data } = useQuery({ queryKey: ["admin", "customers"], queryFn: () => fetchCustomers() });
  if (!data) return <p className="mt-6 text-muted-foreground">Chargement…</p>;
  return (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-xs uppercase">
          <tr>
            {[
              "Client",
              "Email",
              "Compte",
              "Commandes",
              "Valeur confirmée",
              "Encaissé",
              "Messages",
              "Dernière activité",
            ].map((h) => (
              <th key={h} className="px-3 py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.key} className="border-t border-border">
              <td className="px-3 py-2">{c.name ?? "—"}</td>
              <td className="px-3 py-2">{c.email ?? "—"}</td>
              <td className="px-3 py-2">{c.userIds.length ? "Inscrit" : "Invité"}</td>
              <td className="px-3 py-2">{c.orders}</td>
              <td className="px-3 py-2">{mad(c.value)}</td>
              <td className="px-3 py-2">{mad(c.collected)}</td>
              <td className="px-3 py-2">{c.messages}</td>
              <td className="px-3 py-2">{new Date(c.last).toLocaleDateString("fr-MA")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Messages() {
  const [page, setPage] = useState(0);
  const qc = useQueryClient();
  const fetchMessages = useServerFn(adminMessages);
  const update = useServerFn(adminUpdateMessage);
  const { data } = useQuery({
    queryKey: ["admin", "messages", page],
    queryFn: () => fetchMessages({ data: { page } }),
  });
  const patch = async (id: string, fields: Record<string, unknown>) => {
    try {
      await update({ data: { id, ...fields } });
      qc.invalidateQueries({ queryKey: ["admin"] });
    } catch {
      toast.error("Échec");
    }
  };
  if (!data) return <p className="mt-6 text-muted-foreground">Chargement…</p>;
  return (
    <div className="mt-8 space-y-3">
      {data.messages.map((m: AdminMessage) => (
        <div key={m.id} className={cn("surface-card p-4", !m.meta?.is_read && "border-primary")}>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold">
              {m.name} · {m.email}
              {m.company ? ` · ${m.company}` : ""}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(m.created_at).toLocaleString("fr-MA")}
            </span>
          </div>
          {m.topic ? (
            <p className="mt-1 text-sm">
              <b>Sujet :</b> {m.topic}
            </p>
          ) : null}
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{m.message}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <select
              className="rounded-md border border-border bg-background px-2 py-1"
              value={m.meta?.classification ?? "unclassified"}
              onChange={(e) => patch(m.id, { classification: e.target.value })}
            >
              {["unclassified", "quote", "sales", "support", "spam"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {m.meta?.classification === "quote" || m.meta?.classification === "sales" ? (
              <select
                className="rounded-md border border-border bg-background px-2 py-1"
                value={m.meta?.quote_stage ?? "new"}
                onChange={(e) => patch(m.id, { quote_stage: e.target.value })}
              >
                {["new", "qualified", "proposal", "negotiation", "won", "lost"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              onClick={() => patch(m.id, { is_read: !m.meta?.is_read })}
            >
              {m.meta?.is_read ? "Marquer non lu" : "Marquer lu"}
            </Button>
          </div>
        </div>
      ))}
      <Pager page={page} setPage={setPage} total={data.total} size={data.pageSize} />
    </div>
  );
}

function Crm({ data }: { data: Awaited<ReturnType<typeof adminOverview>> }) {
  const qc = useQueryClient();
  const retry = useServerFn(adminRetryCrmJob);
  const run = useServerFn(adminRunCrmWorker);
  const ready = data.crm.readiness
    .filter((r) => r.name.startsWith("ZOHO_"))
    .every((r) => r.present);
  return (
    <div className="mt-8 space-y-6">
      <div className="surface-card p-5">
        <h2 className="text-lg">État de la configuration</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready
            ? "Identifiants Zoho présents."
            : "Synchronisation en attente de configuration : les événements sont mis en file mais rien n'est envoyé à Zoho."}
        </p>
        <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
          {data.crm.readiness.map((r) => (
            <li key={r.name}>
              {r.present ? "✓" : "✗"} {r.name}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          File :{" "}
          {Object.entries(data.crm.counts)
            .map(([k, v]) => `${k} ${v}`)
            .join(" · ") || "vide"}
        </p>
        <Button
          className="mt-3 rounded-full"
          size="sm"
          disabled={!ready}
          onClick={async () => {
            try {
              const r = await run();
              toast.success(`Lot traité : ${r.processed}`);
              qc.invalidateQueries({ queryKey: ["admin"] });
            } catch {
              toast.error("Échec");
            }
          }}
        >
          Lancer un lot maintenant
        </Button>
      </div>
      <div className="surface-card p-5">
        <h2 className="text-lg">Synchronisations en échec ou bloquées</h2>
        {data.crm.problems.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aucune.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {data.crm.problems.map((p: CrmProblem) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{p.status}</span>
                <span>
                  {p.entity_type} · {p.source_table}
                </span>
                <span className="text-muted-foreground">
                  {p.last_error_code}: {p.last_error}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await retry({ data: { id: p.id } });
                      qc.invalidateQueries({ queryKey: ["admin"] });
                    } catch {
                      toast.error("Échec");
                    }
                  }}
                >
                  Réessayer
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
