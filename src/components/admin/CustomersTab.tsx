import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { adminCustomerDetail, adminCustomers } from "@/lib/admin.functions";
import { CLASS_LABELS } from "@/lib/admin-metrics";
import { Card, Empty, ErrorBox, Loading, NotesPanel, PAYMENT_LABELS, Pager, Pill, Stat, fmtDate, mad, paymentTone } from "./shared";

export function CustomersTab({ canWrite, onOrder, onMessage }: { canWrite: boolean; onOrder: (id: string) => void; onMessage: (id: string) => void }) {
  const [page, setPage] = useState(0);
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => { setQ(input); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [input]);
  const fetchList = useServerFn(adminCustomers);
  const list = useQuery({ queryKey: ["admin", "customers", page, q], queryFn: () => fetchList({ data: { page, q } }), placeholderData: keepPreviousData });
  return (
    <div className="space-y-4">
      <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nom, e-mail, société, téléphone" className="h-9 w-full sm:w-80" aria-label="Rechercher un client" />
      <Card>
        {list.error ? <ErrorBox error={list.error} /> : !list.data ? <Loading /> : list.data.customers.length === 0 ? <Empty>Aucun client.</Empty> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr className="border-b"><th className="py-2 pr-3">Client</th><th className="pr-3">Commandes</th><th className="pr-3 text-right">Valeur</th><th className="pr-3 text-right">Encaissé</th><th className="pr-3 text-right">Reste</th><th className="pr-3">Messages</th><th>Dernière activité</th></tr>
                </thead>
                <tbody>
                  {list.data.customers.map((c) => (
                    <tr key={c.customer_key} className="cursor-pointer border-b last:border-0 hover:bg-muted/50" onClick={() => setOpen(c.customer_key)}>
                      <td className="py-2 pr-3">
                        <span className="font-medium">{c.name || c.email}</span>
                        <div className="text-xs text-muted-foreground">{c.email}{c.company ? ` · ${c.company}` : ""}{c.user_id ? "" : " · invité"}</div>
                      </td>
                      <td className="pr-3">{c.orders}</td>
                      <td className="pr-3 text-right">{mad(c.order_value)}</td>
                      <td className="pr-3 text-right">{mad(c.collected)}</td>
                      <td className="pr-3 text-right">{mad(c.outstanding)}</td>
                      <td className="pr-3">{c.messages}{c.quotes ? ` (${c.quotes} devis)` : ""}</td>
                      <td>{fmtDate(c.last_activity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={list.data.total} pageSize={list.data.pageSize} onPage={setPage} />
          </>
        )}
      </Card>
      <Sheet open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {open ? <CustomerDetail k={open} canWrite={canWrite} onOrder={onOrder} onMessage={onMessage} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CustomerDetail({ k, canWrite, onOrder, onMessage }: { k: string; canWrite: boolean; onOrder: (id: string) => void; onMessage: (id: string) => void }) {
  const fetchDetail = useServerFn(adminCustomerDetail);
  const key = ["admin", "customer", k];
  const d = useQuery({ queryKey: key, queryFn: () => fetchDetail({ data: { key: k } }) });
  if (d.error) return <ErrorBox error={d.error} />;
  if (!d.data) return <Loading />;
  const c = d.data;
  return (
    <div className="space-y-5">
      <SheetHeader>
        <SheetTitle>{c.name ?? c.key}</SheetTitle>
        <p className="text-sm text-muted-foreground">{c.key}{c.company ? ` · ${c.company}` : ""}{c.phone ? ` · ${c.phone}` : ""}</p>
        <p className="text-xs text-muted-foreground">{c.profile ? `Compte créé le ${fmtDate(c.profile.created_at)}` : "Client invité, sans compte"} · Dernière activité {fmtDate(c.lastActivity)}</p>
      </SheetHeader>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Commandes" value={c.totals.orders} />
        <Stat label="Valeur confirmée" value={mad(c.totals.orderValue)} />
        <Stat label="Encaissé" value={mad(c.totals.collected)} hint={c.totals.courierHeld ? `${mad(c.totals.courierHeld)} chez livreur` : undefined} />
        <Stat label="Reste à encaisser" value={mad(c.totals.outstanding)} />
      </div>
      <section>
        <h3 className="text-sm font-semibold">Commandes</h3>
        {c.orders.length === 0 ? <p className="text-sm text-muted-foreground">Aucune commande.</p> : (
          <ul className="mt-2 divide-y text-sm">
            {c.orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 py-1.5">
                <button className="text-primary hover:underline" onClick={() => onOrder(o.id)}>{o.reference}</button>
                <span className="text-muted-foreground">{fmtDate(o.created_at)}</span>
                <Pill tone={paymentTone(o.payment_status)}>{PAYMENT_LABELS[o.payment_status] ?? o.payment_status}</Pill>
                <span>{mad(o.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h3 className="text-sm font-semibold">Messages</h3>
        {c.messages.length === 0 ? <p className="text-sm text-muted-foreground">Aucun message.</p> : (
          <ul className="mt-2 space-y-2 text-sm">
            {c.messages.map((m) => (
              <li key={m.id}>
                <button className="text-left hover:underline" onClick={() => onMessage(m.id)}>
                  <span className="font-medium">{m.topic ?? "Message"}</span> <span className="text-muted-foreground">· {fmtDate(m.created_at)} · {CLASS_LABELS[m.meta?.classification ?? "unclassified"]}</span>
                  <span className="line-clamp-2 block text-muted-foreground">{m.message}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <NotesPanel type="customer" entityKey={c.key} notes={c.notes} canWrite={canWrite} invalidate={key} />
    </div>
  );
}
