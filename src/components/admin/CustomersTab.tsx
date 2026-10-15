import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { ShopOrderDetail, shopAmount } from "./ShopOrdersTab";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { adminCustomerDetail, adminCustomers } from "@/lib/admin.functions";
import { CLASS_LABELS } from "@/lib/admin-metrics";
import {
  Card,
  Empty,
  ErrorBox,
  Loading,
  NotesPanel,
  PAYMENT_LABELS,
  Pager,
  Pill,
  Stat,
  fmtDate,
  mad,
  paymentTone,
} from "./shared";

export function CustomersTab({
  canWrite,
  onOrder,
  onMessage,
}: {
  canWrite: boolean;
  onOrder: (id: string) => void;
  onMessage: (id: string) => void;
}) {
  const [page, setPage] = useState(0);
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(input);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [input]);
  const fetchList = useServerFn(adminCustomers);
  const list = useQuery({
    queryKey: ["admin", "customers", page, q],
    queryFn: () => fetchList({ data: { page, q } }),
    placeholderData: keepPreviousData,
  });
  return (
    <div className="space-y-4">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Nom, e-mail, société, téléphone"
        className="h-9 w-full sm:w-80"
        aria-label="Rechercher un client"
      />
      <Card>
        {list.error ? (
          <ErrorBox error={list.error} />
        ) : !list.data ? (
          <Loading />
        ) : list.data.customers.length === 0 ? (
          <Empty>Aucun client.</Empty>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3">Client</th>
                    <th className="pr-3">Commandes</th>
                    <th className="pr-3 text-right">Valeur</th>
                    <th className="pr-3 text-right">Encaissé</th>
                    <th className="pr-3 text-right">Reste</th>
                    <th className="pr-3">Messages</th>
                    <th>Dernière activité</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.customers.map((c) => (
                    <tr
                      key={c.customer_key}
                      className="cursor-pointer border-b last:border-0 hover:bg-muted/50"
                      onClick={() => setOpen(c.customer_key)}
                    >
                      <td className="py-2 pr-3">
                        <span className="font-medium">{c.name || c.email}</span>
                        <div className="text-xs text-muted-foreground">
                          {c.email}
                          {c.company ? ` · ${c.company}` : ""}
                          {c.user_id ? "" : " · invité"}
                        </div>
                      </td>
                      <td className="pr-3">
                        {c.orders} impression{c.shop_orders ? ` · ${c.shop_orders} boutique` : ""}
                      </td>
                      <td className="pr-3 text-right">{mad(c.order_value)}</td>
                      <td className="pr-3 text-right">{mad(c.collected)}</td>
                      <td className="pr-3 text-right">{mad(c.outstanding)}</td>
                      <td className="pr-3">
                        {c.messages}
                        {c.quotes ? ` (${c.quotes} devis)` : ""}
                      </td>
                      <td>{fmtDate(c.last_activity)}</td>
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
      <Sheet open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {open ? (
            <CustomerDetail k={open} canWrite={canWrite} onOrder={onOrder} onMessage={onMessage} />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CustomerDetail({
  k,
  canWrite,
  onOrder,
  onMessage,
}: {
  k: string;
  canWrite: boolean;
  onOrder: (id: string) => void;
  onMessage: (id: string) => void;
}) {
  const fetchDetail = useServerFn(adminCustomerDetail);
  const [page, setPage] = useState(0),
    [messagePage, setMessagePage] = useState(0),
    [notePage, setNotePage] = useState(0);
  const [shop, setShop] = useState<string | null>(null);
  const key = ["admin", "customer", k];
  const d = useQuery({
    queryKey: [...key, page, messagePage, notePage],
    queryFn: () => fetchDetail({ data: { key: k, page, messagePage, notePage } }),
  });
  if (d.error) return <ErrorBox error={d.error} />;
  if (!d.data) return <Loading />;
  if (shop)
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setShop(null)}>
          Retour au client
        </Button>
        <div className="mt-4">
          <ShopOrderDetail id={shop} canWrite={canWrite} />
        </div>
      </>
    );
  const c = d.data,
    s = c.summary;
  return (
    <div className="space-y-5">
      <SheetHeader>
        <SheetTitle>{s.name ?? c.key}</SheetTitle>
        <p className="text-sm text-muted-foreground">
          {c.key}
          {s.company ? ` · ${s.company}` : ""}
          {s.phone ? ` · ${s.phone}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {c.profile
            ? `Compte créé le ${fmtDate(c.profile.created_at)}`
            : "Client invité, sans compte"}{" "}
          · Dernière activité {fmtDate(s.last_activity)}
        </p>
      </SheetHeader>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Commandes impression" value={s.orders} />
        <Stat label="Valeur impression confirmée" value={mad(s.order_value)} />
        <Stat label="Encaissé impression" value={mad(s.collected)} />
        <Stat label="Reste à encaisser" value={mad(s.outstanding)} />
        <Stat label="Commandes boutique" value={s.shop_orders} />
        <Stat label="Boutique payée (MAD)" value={mad(s.shop_value)} />
      </div>
      <section>
        <h3 className="text-sm font-semibold">Historique des commandes</h3>
        {!c.orders.length ? (
          <p className="text-sm text-muted-foreground">Aucune commande.</p>
        ) : (
          <ul className="mt-2 divide-y text-sm">
            {c.orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <button
                  className="text-primary hover:underline"
                  onClick={() => (o.kind === "shop" ? setShop(o.id) : onOrder(o.id))}
                >
                  {o.reference}
                </button>
                <span className="text-xs text-muted-foreground">
                  {o.kind === "shop" ? "Boutique" : "Impression"} · {fmtDate(o.created_at)}
                </span>
                <Pill tone={paymentTone(o.payment_status)}>
                  {PAYMENT_LABELS[o.payment_status] ?? o.payment_status}
                </Pill>
                <span>{shopAmount(Number(o.total) * 100, o.currency)}</span>
              </li>
            ))}
          </ul>
        )}
        <Pager page={page} total={c.orderTotal} pageSize={c.pageSize} onPage={setPage} />
      </section>
      <section>
        <h3 className="text-sm font-semibold">Messages et devis</h3>
        {!c.messages.length ? (
          <p className="text-sm text-muted-foreground">Aucun message.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {c.messages.map((m) => (
              <li key={m.id}>
                <button className="text-left hover:underline" onClick={() => onMessage(m.id)}>
                  <span className="font-medium">{m.topic ?? "Message"}</span>
                  <span className="text-muted-foreground"> · {fmtDate(m.created_at)}</span>
                  <span className="line-clamp-2 block text-muted-foreground">{m.message}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Pager
          page={messagePage}
          total={c.messageTotal}
          pageSize={c.pageSize}
          onPage={setMessagePage}
        />
      </section>
      <NotesPanel
        type="customer"
        entityKey={c.key}
        notes={c.notes}
        canWrite={canWrite}
        invalidate={key}
      />
      <Pager page={notePage} total={c.noteTotal} pageSize={c.pageSize} onPage={setNotePage} />
    </div>
  );
}
