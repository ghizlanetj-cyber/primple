import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { adminShopOrders, adminShopOrderDetail, adminUpdateShopOrder } from "@/lib/admin.functions";
import { OPS_LABELS } from "@/lib/admin-metrics";
import {
  AssigneeSelect,
  Card,
  Empty,
  ErrorBox,
  HistoryList,
  Loading,
  NotesPanel,
  Pager,
  Pill,
  errText,
  fmtDate,
  useStaff,
} from "./shared";

const STATES: Record<string, string> = {
  pending: "En attente",
  paid: "Payé",
  failed: "Échec",
  cancelled: "Annulé",
  refunded: "Remboursé",
};
const STAGES = ["new", "in_production", "ready", "shipped", "delivered", "cancelled"];
export const shopAmount = (cents: number, currency: string) =>
  `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 2 }).format(Number(cents) / 100)} ${currency}`;

export function ShopOrdersTab({ canWrite }: { canWrite: boolean }) {
  const [page, setPage] = useState(0);
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [focus, setFocus] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(input);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [input]);
  const fetch = useServerFn(adminShopOrders);
  const list = useQuery({
    queryKey: ["admin", "shop-orders", page, q, status],
    queryFn: () => fetch({ data: { page, q, status } }),
    placeholderData: keepPreviousData,
  });
  const { nameOf } = useStaff();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="sm:max-w-80"
          placeholder="Référence, client, e-mail, téléphone"
          aria-label="Rechercher une commande boutique"
        />
        <select
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
          aria-label="Paiement boutique"
        >
          <option value="">Tous paiements</option>
          {Object.entries(STATES).map(([k, v]) => (
            <option value={k} key={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-muted-foreground">
        Les paiements boutique sont confirmés par le prestataire. Les étapes de livraison et notes
        sont internes.
      </p>
      <Card>
        {list.error ? (
          <ErrorBox error={list.error} />
        ) : !list.data ? (
          <Loading />
        ) : list.data.orders.length === 0 ? (
          <Empty>Aucune commande boutique.</Empty>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[700px] w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-3">Commande</th>
                    <th>Client</th>
                    <th>Paiement</th>
                    <th>Livraison</th>
                    <th>Assignée</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.orders.map((o) => (
                    <tr className="border-b hover:bg-muted/50" key={o.id}>
                      <td className="py-3">
                        <button
                          className="font-medium text-primary hover:underline"
                          onClick={() => setFocus(o.id)}
                        >
                          {o.reference}
                        </button>
                        <p className="text-xs text-muted-foreground">{fmtDate(o.created_at)}</p>
                      </td>
                      <td>
                        {o.customer_name}
                        <p className="text-xs text-muted-foreground">{o.customer_email}</p>
                      </td>
                      <td>
                        <Pill
                          tone={
                            o.status === "paid" ? "good" : o.status === "failed" ? "bad" : "muted"
                          }
                        >
                          {STATES[o.status] ?? o.status}
                        </Pill>
                      </td>
                      <td>{OPS_LABELS[o.ops?.ops_stage ?? "new"]}</td>
                      <td>{nameOf(o.ops?.assigned_to)}</td>
                      <td className="text-right">{shopAmount(o.amount_cents, o.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager
              page={page}
              total={list.data.total}
              pageSize={list.data.pageSize}
              onPage={setPage}
            />
          </>
        )}
      </Card>
      <Sheet open={Boolean(focus)} onOpenChange={(o) => !o && setFocus(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {focus && <ShopOrderDetail id={focus} canWrite={canWrite} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function ShopOrderDetail({ id, canWrite }: { id: string; canWrite: boolean }) {
  const fetch = useServerFn(adminShopOrderDetail);
  const update = useServerFn(adminUpdateShopOrder);
  const qc = useQueryClient();
  const key = ["admin", "shop-order", id];
  const d = useQuery({ queryKey: key, queryFn: () => fetch({ data: { id } }) });
  const [notes, setNotes] = useState("");
  const [expected, setExpected] = useState("");
  useEffect(() => {
    setNotes(d.data?.ops?.delivery_notes ?? "");
    setExpected(d.data?.ops?.expected_at ?? "");
  }, [d.data?.ops]);
  const save = useMutation({
    mutationFn: (fields: Record<string, unknown>) =>
      update({ data: { id, version: d.data?.ops?.version ?? null, fields } }),
    onSuccess: () => {
      toast.success("Enregistré");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => {
      toast.error(errText(e));
      void qc.invalidateQueries({ queryKey: key });
    },
  });
  if (d.error) return <ErrorBox error={d.error} />;
  if (!d.data) return <Loading />;
  const { order: o, ops, history, notes: internalNotes } = d.data;
  const items = Array.isArray(o.items)
    ? (o.items as { title?: string; name?: string; quantity?: number; variant?: string }[])
    : [];
  const busy = !canWrite || save.isPending;
  return (
    <div className="space-y-5">
      <SheetHeader>
        <SheetTitle>{o.reference}</SheetTitle>
        <p className="text-sm text-muted-foreground">Boutique · {fmtDate(o.created_at, true)}</p>
      </SheetHeader>
      <Card>
        <p className="font-medium">{o.customer_name}</p>
        <p>{o.customer_email}</p>
        <p>{o.customer_phone}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {[o.customer_address, o.customer_city].filter(Boolean).join(", ")}
        </p>
      </Card>
      <section>
        <h3 className="font-semibold">Articles</h3>
        <ul className="divide-y text-sm">
          {items.map((it, i) => (
            <li className="py-2" key={i}>
              {it.quantity} × {it.title ?? it.name ?? "Article"}
              {it.variant && <span className="text-muted-foreground"> · {it.variant}</span>}
            </li>
          ))}
        </ul>
      </section>
      <Card>
        <p className="font-semibold">{shopAmount(o.amount_cents, o.currency)}</p>
        <p className="text-sm">Paiement : {STATES[o.status] ?? o.status}</p>
        {o.paid_at && (
          <p className="text-xs text-muted-foreground">Confirmé le {fmtDate(o.paid_at, true)}</p>
        )}
      </Card>
      <section className="space-y-3">
        <h3 className="font-semibold">Suivi de livraison</h3>
        <label className="block text-sm">
          Étape
          <select
            className="mt-1 h-9 w-full rounded-md border bg-background px-2"
            value={ops?.ops_stage ?? "new"}
            disabled={busy}
            onChange={(e) => save.mutate({ ops_stage: e.target.value })}
          >
            {STAGES.map((s) => (
              <option value={s} key={s}>
                {OPS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Assignée à
          <AssigneeSelect
            value={ops?.assigned_to ?? null}
            disabled={busy}
            onChange={(v) => save.mutate({ assigned_to: v })}
          />
        </label>
        <label className="block text-sm">
          Date prévue
          <Input
            type="date"
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            disabled={busy}
          />
        </label>
        <label className="block text-sm">
          Instructions de livraison
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={busy}
            maxLength={4000}
          />
        </label>
        {canWrite && (
          <Button
            disabled={busy}
            onClick={() => save.mutate({ delivery_notes: notes, expected_at: expected || null })}
          >
            Enregistrer la livraison
          </Button>
        )}
      </section>
      <NotesPanel
        type="shop_order"
        entityKey={id}
        notes={internalNotes}
        canWrite={canWrite}
        invalidate={key}
      />
      <HistoryList items={history} />
    </div>
  );
}
