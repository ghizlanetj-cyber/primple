import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { adminFileUrl, adminOrderDetail, adminOrders, adminRecordBalance, adminUpdateOrder } from "@/lib/admin.functions";
import { OPS_LABELS, OPS_STAGES } from "@/lib/admin-metrics";
import {
  AssigneeSelect,
  Card,
  Empty,
  ErrorBox,
  HistoryList,
  Loading,
  NotesPanel,
  PAYMENT_LABELS,
  Pager,
  Pill,
  STATUS_LABELS,
  errText,
  fmtDate,
  mad,
  paymentTone,
  useStaff,
} from "./shared";

type Filters = { q: string; status: string; payment: string; stage: string; assignee: string };
const EMPTY: Filters = { q: "", status: "", payment: "", stage: "", assignee: "" };

export function OrdersTab({ focusId, onFocus, canWrite, canMoney }: { focusId: string | null; onFocus: (id: string | null) => void; canWrite: boolean; canMoney: boolean }) {
  const [page, setPage] = useState(0);
  const [f, setF] = useState<Filters>(EMPTY);
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setF((x) => ({ ...x, q }));
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);
  const fetchOrders = useServerFn(adminOrders);
  const { nameOf } = useStaff();
  const list = useQuery({
    queryKey: ["admin", "orders", page, f],
    queryFn: () => fetchOrders({ data: { page, q: f.q, status: f.status || null, payment: f.payment || null, stage: f.stage || null, assignee: f.assignee || null } }),
    placeholderData: keepPreviousData,
  });
  const set = (k: keyof Filters, v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    setPage(0);
  };
  const sel = "h-9 rounded-md border bg-background px-2 text-sm";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Référence, nom, e-mail, téléphone" className="h-9 w-full sm:w-72" aria-label="Rechercher une commande" />
        <select className={sel} value={f.status} onChange={(e) => set("status", e.target.value)} aria-label="Statut client">
          <option value="">Tous statuts</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className={sel} value={f.payment} onChange={(e) => set("payment", e.target.value)} aria-label="Paiement">
          <option value="">Tous paiements</option>
          {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className={sel} value={f.stage} onChange={(e) => set("stage", e.target.value)} aria-label="Production">
          <option value="">Toute production</option>
          {OPS_STAGES.map((k) => <option key={k} value={k}>{OPS_LABELS[k]}</option>)}
        </select>
        <div className="w-44"><AssigneeSelect value={f.assignee || null} onChange={(v) => set("assignee", v ?? "")} /></div>
      </div>
      <Card>
        {list.error ? <ErrorBox error={list.error} /> : !list.data ? <Loading /> : list.data.orders.length === 0 ? <Empty>Aucune commande.</Empty> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3">Commande</th><th className="pr-3">Client</th><th className="pr-3">Paiement</th><th className="pr-3">Production</th><th className="pr-3">Assignée</th><th className="pr-3 text-right">Total</th><th className="text-right">Reste</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.orders.map((o) => (
                    <tr key={o.id} className="cursor-pointer border-b last:border-0 hover:bg-muted/50" onClick={() => onFocus(o.id)}>
                      <td className="py-2 pr-3">
                        <button className="font-medium text-primary hover:underline" onClick={(e) => { e.stopPropagation(); onFocus(o.id); }}>{o.reference}</button>
                        <div className="text-xs text-muted-foreground">{fmtDate(o.created_at)}{o.files === 0 ? " · sans fichier" : ""}</div>
                      </td>
                      <td className="pr-3">{o.contact_name ?? "—"}<div className="text-xs text-muted-foreground">{o.company ?? o.email ?? o.guest_email}</div></td>
                      <td className="pr-3"><Pill tone={paymentTone(o.payment_status)}>{PAYMENT_LABELS[o.payment_status] ?? o.payment_status}</Pill>{o.deposit_paid && o.payment_status !== "paid" ? <div className="mt-1 text-xs text-muted-foreground">Avance reçue</div> : null}</td>
                      <td className="pr-3">{OPS_LABELS[o.ops?.ops_stage ?? "new"]}</td>
                      <td className="pr-3">{nameOf(o.ops?.assigned_to)}</td>
                      <td className="pr-3 text-right">{mad(o.total)}</td>
                      <td className="text-right">{o.money.courierHeld ? <span title="Chez le livreur">{mad(o.money.courierHeld)}*</span> : mad(o.money.balanceDue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={list.data.total} pageSize={list.data.pageSize} onPage={setPage} />
          </>
        )}
      </Card>
      <Sheet open={Boolean(focusId)} onOpenChange={(o) => !o && onFocus(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {focusId ? <OrderDetail id={focusId} canWrite={canWrite} canMoney={canMoney} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

type Item = { name?: string; slug?: string; quantity?: number; config?: string; subtotal?: number };

function OrderDetail({ id, canWrite, canMoney }: { id: string; canWrite: boolean; canMoney: boolean }) {
  const qc = useQueryClient();
  const fetchDetail = useServerFn(adminOrderDetail);
  const update = useServerFn(adminUpdateOrder);
  const record = useServerFn(adminRecordBalance);
  const fileUrl = useServerFn(adminFileUrl);
  const key = ["admin", "order", id];
  const d = useQuery({ queryKey: key, queryFn: () => fetchDetail({ data: { id } }) });
  const [form, setForm] = useState({ supplier: "", cost_mad: "", production_notes: "", delivery_notes: "" });
  useEffect(() => {
    const ops = d.data?.ops;
    setForm({ supplier: ops?.supplier ?? "", cost_mad: ops?.cost_mad == null ? "" : String(ops.cost_mad), production_notes: ops?.production_notes ?? "", delivery_notes: ops?.delivery_notes ?? "" });
  }, [d.data?.ops]);
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: key });
    void qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    void qc.invalidateQueries({ queryKey: ["admin", "queue"] });
  };
  const save = useMutation({
    mutationFn: (fields: Record<string, unknown>) => update({ data: { orderId: id, version: d.data?.ops?.version ?? null, fields } }),
    onSuccess: () => { toast.success("Enregistré"); refresh(); },
    onError: (e) => { toast.error(errText(e)); refresh(); },
  });
  const bal = useMutation({
    mutationFn: (remitted: boolean) => record({ data: { orderId: id, remitted } }),
    onSuccess: () => { toast.success("Encaissement enregistré"); refresh(); },
    onError: (e) => toast.error(errText(e)),
  });
  if (d.error) return <ErrorBox error={d.error} />;
  if (!d.data) return <Loading />;
  const { order: o, ops, files, balance, money, notes, history, crm } = d.data;
  const items = Array.isArray(o.items) ? (o.items as Item[]) : [];
  const busy = save.isPending || !canWrite;
  return (
    <div className="space-y-5">
      <SheetHeader>
        <SheetTitle>{o.reference}</SheetTitle>
        <p className="text-sm text-muted-foreground">{fmtDate(o.created_at, true)} · {STATUS_LABELS[o.status] ?? o.status}</p>
      </SheetHeader>
      <section className="grid gap-2 text-sm sm:grid-cols-2">
        <div><p className="text-xs text-muted-foreground">Client</p><p>{o.contact_name ?? "—"}</p><p className="text-muted-foreground">{o.company}</p></div>
        <div><p className="text-xs text-muted-foreground">Contact</p><p>{o.email ?? o.guest_email ?? "—"}</p><p>{o.phone ?? ""}</p></div>
        <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Livraison</p><p>{[o.address, o.postcode, o.city].filter(Boolean).join(", ") || "—"}</p><p className="text-muted-foreground">Prévue le {fmtDate(o.expected_at)}</p></div>
      </section>
      <section>
        <h3 className="text-sm font-semibold">Articles</h3>
        <ul className="mt-2 divide-y text-sm">
          {items.map((it, i) => (
            <li key={i} className="flex justify-between gap-3 py-1.5">
              <span>{it.quantity} × {it.name ?? it.slug}{it.config ? <span className="block text-xs text-muted-foreground">{it.config}</span> : null}</span>
              {it.subtotal != null ? <span>{mad(it.subtotal)}</span> : null}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-right text-sm">Livraison {mad(o.delivery)} · <strong>Total {mad(o.total)}</strong></p>
      </section>
      <section className="rounded-lg border p-3 text-sm">
        <h3 className="font-semibold">Paiement</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Pill tone={paymentTone(o.payment_status)}>{PAYMENT_LABELS[o.payment_status] ?? o.payment_status}</Pill>
          <span className="text-muted-foreground">{o.payment_method}</span>
          {o.paid_at ? <span className="text-muted-foreground">le {fmtDate(o.paid_at, true)}</span> : null}
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-1">
          <dt className="text-muted-foreground">Encaissé par Primple</dt><dd className="text-right">{mad(money.collected)}</dd>
          <dt className="text-muted-foreground">Chez le livreur</dt><dd className="text-right">{mad(money.courierHeld)}</dd>
          <dt className="text-muted-foreground">Reste à encaisser</dt><dd className="text-right">{mad(money.balanceDue)}</dd>
        </dl>
        {Number(o.balance_amount) > 0 ? (
          <div className="mt-3 border-t pt-3">
            <p className="text-xs text-muted-foreground">
              Solde espèces {mad(Number(o.balance_amount))}.{" "}
              {balance ? (balance.remitted ? `Reversé (enregistré le ${fmtDate(balance.recorded_at, true)}).` : `Encaissé par le livreur le ${fmtDate(balance.recorded_at, true)}, pas encore reversé.`) : "Aucun encaissement enregistré. « Livrée » ne vaut pas encaissement."}
            </p>
            {canMoney && !balance?.remitted ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {!balance ? <Button size="sm" variant="outline" disabled={bal.isPending} onClick={() => bal.mutate(false)}>Encaissé par le livreur</Button> : null}
                <Button size="sm" disabled={bal.isPending} onClick={() => bal.mutate(true)}>Reversé à Primple</Button>
              </div>
            ) : null}
          </div>
        ) : null}
        {o.payment_status === "awaiting_transfer" ? <p className="mt-2 text-xs text-muted-foreground">Confirmation des virements et Cash Plus : page Paiements (administrateurs).</p> : null}
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Production</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-muted-foreground">Étape
            <select className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm text-foreground" value={ops?.ops_stage ?? "new"} disabled={busy} onChange={(e) => save.mutate({ ops_stage: e.target.value })}>
              {OPS_STAGES.map((s) => <option key={s} value={s}>{OPS_LABELS[s]}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">Assignée à
            <div className="mt-1"><AssigneeSelect value={ops?.assigned_to ?? null} disabled={busy} onChange={(v) => save.mutate({ assigned_to: v })} /></div>
          </label>
          <label className="text-xs text-muted-foreground">Fournisseur
            <Input className="mt-1" value={form.supplier} disabled={!canWrite} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          </label>
          <label className="text-xs text-muted-foreground">Coût (MAD)
            <Input className="mt-1" inputMode="decimal" value={form.cost_mad} disabled={!canWrite} onChange={(e) => setForm({ ...form, cost_mad: e.target.value })} />
          </label>
        </div>
        <label className="block text-xs text-muted-foreground">Notes de production
          <Textarea className="mt-1" rows={2} value={form.production_notes} disabled={!canWrite} onChange={(e) => setForm({ ...form, production_notes: e.target.value })} />
        </label>
        <label className="block text-xs text-muted-foreground">Notes de livraison
          <Textarea className="mt-1" rows={2} value={form.delivery_notes} disabled={!canWrite} onChange={(e) => setForm({ ...form, delivery_notes: e.target.value })} />
        </label>
        {canWrite ? <Button size="sm" disabled={save.isPending} onClick={() => save.mutate(form)}>Enregistrer</Button> : null}
        <p className="text-xs text-muted-foreground">L'étape met à jour le suivi client. Elle ne confirme jamais un paiement.</p>
      </section>
      <section>
        <h3 className="text-sm font-semibold">Fichiers</h3>
        {files.length === 0 ? <p className="mt-1 text-sm text-muted-foreground">Aucun fichier.</p> : (
          <ul className="mt-2 space-y-1 text-sm">
            {files.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{file.file_name} <span className="text-xs text-muted-foreground">{Math.round(Number(file.size_bytes) / 1024)} Ko</span></span>
                <Button size="sm" variant="outline" onClick={async () => {
                  try { const r = await fileUrl({ data: { fileId: file.id } }); window.open(r.url, "_blank", "noopener"); } catch (e) { toast.error(errText(e)); }
                }}>Ouvrir</Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <NotesPanel type="order" entityKey={id} notes={notes} canWrite={canWrite} invalidate={key} />
      <HistoryList items={history} />
      {crm.length ? <p className="text-xs text-muted-foreground">CRM : {crm.map((c) => `${c.entity_type} ${c.status}`).join(", ")}</p> : null}
    </div>
  );
}
