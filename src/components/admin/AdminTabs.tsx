import { ProductionPanel } from "./ProductionPanel";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { internalPackItems, packQuote } from "@/data/packs";
import { fromPriceBasis } from "@/data/products";
import { buildCatalog, sourcePack, sourceProduct, type PricingRow } from "@/data/catalog-config";
import { PricingDialog, fr, type EditTarget } from "./PricingEditor";
import {
  adminCatalogAvailability,
  adminCatalogPricing,
  adminCrm,
  adminGrantMember,
  adminRetryCrmJob,
  adminRevokeMember,
  adminRunCrmWorker,
  adminSetAvailability,
} from "@/lib/admin.functions";
import { Card, Empty, ErrorBox, Loading, Pill, ROLE_LABELS, Stat, errText, fmtDate, mad, useStaff } from "./shared";

/* ---------- catalogue ---------- */

export function CatalogTab({ canManage }: { canManage: boolean }) {
  const qc = useQueryClient();
  const fetchAvail = useServerFn(adminCatalogAvailability);
  const fetchPricing = useServerFn(adminCatalogPricing);
  const setAvail = useServerFn(adminSetAvailability);
  const a = useQuery({ queryKey: ["admin", "catalog"], queryFn: () => fetchAvail() });
  const pr = useQuery({ queryKey: ["admin", "pricing"], queryFn: () => fetchPricing() });
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<EditTarget | null>(null);
  const m = useMutation({
    mutationFn: (v: { kind: "product" | "pack"; slug: string; available: boolean }) => setAvail({ data: v }),
    onSuccess: () => {
      toast.success("Disponibilité mise à jour");
      void qc.invalidateQueries({ queryKey: ["admin", "catalog"] });
      void qc.invalidateQueries({ queryKey: ["catalog-availability"] });
    },
    onError: (e) => toast.error(errText(e)),
  });
  const rows = useMemo(() => (pr.data ?? []) as PricingRow[], [pr.data]);
  const built = useMemo(() => {
    if (!pr.data) return null;
    try {
      return { catalog: buildCatalog(rows), error: null };
    } catch (e) {
      return { catalog: null, error: errText(e) };
    }
  }, [pr.data, rows]);
  const isOn = (kind: string, slug: string) => !(a.data ?? []).some((r) => r.kind === kind && r.slug === slug && !r.available);
  const version = (kind: string, slug: string) => rows.find((r) => r.kind === kind && r.slug === slug)?.version;
  const match = (...t: string[]) => {
    const s = q.trim().toLowerCase();
    return !s || t.some((x) => x.toLowerCase().includes(s));
  };

  const Row = ({ kind, slug, name, sub, price, onEdit }: { kind: "product" | "pack" | "internal"; slug: string; name: string; sub: string; price: string; onEdit: () => void }) => {
    const on = kind === "internal" ? true : isOn(kind, slug);
    const v = version(kind, slug);
    return (
      <li className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
        <div className="min-w-0">
          <p className="font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{sub} · {price}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={v ? "primary" : "muted"}>{v ? `Prix modifiés v${v}` : "Prix du site"}</Pill>
          {kind !== "internal" ? <Pill tone={on ? "good" : "bad"}>{on ? "Disponible" : "Indisponible"}</Pill> : null}
          {canManage ? (
            <>
              <Button size="sm" variant="outline" onClick={onEdit} disabled={!built?.catalog}>Modifier les prix</Button>
              {kind !== "internal" ? (
                <Button size="sm" variant="ghost" disabled={m.isPending} onClick={() => m.mutate({ kind, slug, available: !on })}>
                  {on ? "Désactiver" : "Réactiver"}
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </li>
    );
  };

  const cat = built?.catalog ?? null;
  const productList = (cat?.products ?? []).filter((p) => match(p.name, fr(p.name), p.slug, fr(p.category)));
  const packList = (cat?.packs ?? []).filter((p) => match(p.name, fr(p.name), p.slug));
  const internalList = Object.entries(internalPackItems).filter(([ref, it]) => match(ref, it.label, fr(it.label)));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Modifiez ici les prix, quantités, délais et remises. Les changements s'appliquent au site, au panier et au paiement. Les commandes payées gardent leur montant.
        {canManage ? "" : " Seuls les administrateurs peuvent modifier les prix et la disponibilité."}
      </p>
      <Input aria-label="Rechercher un article" placeholder="Rechercher un produit, un pack ou un article…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
      {a.error || pr.error ? <ErrorBox error={a.error ?? pr.error} /> : !a.data || !built ? <Loading /> : built.error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Configuration de prix illisible : {built.error}. Le paiement est bloqué tant qu'elle n'est pas corrigée.
        </p>
      ) : cat ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card title={`Produits (${productList.length})`}>
            {productList.length ? (
              <ul className="divide-y">
                {productList.map((p) => {
                  const b = fromPriceBasis(p);
                  return (
                    <Row key={p.slug} kind="product" slug={p.slug} name={fr(p.name)} sub={fr(p.category)}
                      price={p.quoteOnly ? "Sur devis" : `dès ${mad(b.amount)} · min. ${p.quantities[0]} · prix auto jusqu'à ${p.quantities[p.quantities.length - 1]}`}
                      onEdit={() => setEdit({ kind: "product", product: sourceProduct(p.slug)! })} />
                  );
                })}
              </ul>
            ) : <Empty text="Aucun produit" />}
          </Card>
          <div className="space-y-5">
            <Card title={`Packs (${packList.length})`}>
              {packList.length ? (
                <ul className="divide-y">
                  {packList.map((p) => {
                    const quote = packQuote(p.lines, cat, p.slug);
                    return (
                      <Row key={p.slug} kind="pack" slug={p.slug} name={fr(p.name)} sub={fr(p.audience)}
                        price={`${mad(quote.packPrice)} · remise ${quote.discountPercent} %`}
                        onEdit={() => setEdit({ kind: "pack", pack: sourcePack(p.slug)! })} />
                    );
                  })}
                </ul>
              ) : <Empty text="Aucun pack" />}
            </Card>
            <Card title={`Articles internes aux packs (${internalList.length})`}>
              {internalList.length ? (
                <ul className="divide-y">
                  {internalList.map(([ref, it]) => (
                    <Row key={ref} kind="internal" slug={ref} name={fr(it.label)} sub="Vendu en pack uniquement"
                      price={`${mad(cat.internalUnitPrice(ref) ?? 0)} / unité`}
                      onEdit={() => setEdit({ kind: "internal", ref })} />
                  ))}
                </ul>
              ) : <Empty text="Aucun article" />}
            </Card>
          </div>
        </div>
      ) : null}
      {cat && canManage ? <PricingDialog target={edit} rows={rows} catalog={cat} onClose={() => setEdit(null)} /> : null}
    </div>
  );
}

/* ---------- équipe ---------- */

export function TeamTab() {
  const qc = useQueryClient();
  const { rows, loading } = useStaff();
  const grant = useServerFn(adminGrantMember);
  const revoke = useServerFn(adminRevokeMember);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"team" | "admin">("team");
  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin", "staff"] });
  const g = useMutation({
    mutationFn: () => grant({ data: { email, name, role } }),
    onSuccess: () => { toast.success("Accès accordé"); setEmail(""); setName(""); refresh(); },
    onError: (e) => toast.error(errText(e)),
  });
  const r = useMutation({
    mutationFn: (v: { userId: string; role: "team" | "admin" }) => revoke({ data: v }),
    onSuccess: () => { toast.success("Accès retiré"); refresh(); },
    onError: (e) => toast.error(errText(e)),
  });
  return (
    <div className="space-y-5">
      <ProductionPanel />
      <Card title="Ajouter un membre">
        <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]" onSubmit={(e) => { e.preventDefault(); g.mutate(); }}>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail du compte (confirmé)" aria-label="E-mail" />
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom affiché (optionnel)" aria-label="Nom affiché" />
          <select className="h-10 rounded-md border bg-background px-2 text-sm" value={role} onChange={(e) => setRole(e.target.value as "team" | "admin")} aria-label="Rôle">
            <option value="team">Équipe</option>
            <option value="admin">Administrateur</option>
          </select>
          <Button type="submit" disabled={g.isPending}>Accorder</Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          La personne doit d'abord créer son compte et confirmer son e-mail. Équipe : commandes, clients, messages, devis et notes. Pas d'accès aux rôles, au catalogue, aux confirmations de paiement ni au CRM.
        </p>
      </Card>
      <Card title="Membres">
        {loading ? <Loading /> : rows.length === 0 ? <Empty>Aucun membre.</Empty> : (
          <ul className="divide-y text-sm">
            {rows.map((m) => (
              <li key={`${m.user_id}-${m.role}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-medium">{m.display_name || m.email}</p>
                  <p className="text-xs text-muted-foreground">{m.email} · depuis le {fmtDate(m.granted_at)}{m.revoked_at ? ` · retiré le ${fmtDate(m.revoked_at)}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone={m.active ? "good" : "muted"}>{ROLE_LABELS[m.role] ?? m.role}{m.active ? "" : " (inactif)"}</Pill>
                  {m.active && (m.role === "team" || m.role === "admin") ? (
                    <Button size="sm" variant="outline" disabled={r.isPending} onClick={() => {
                      if (window.confirm(`Retirer l'accès ${ROLE_LABELS[m.role]} de ${m.email} ?`)) r.mutate({ userId: m.user_id, role: m.role as "team" | "admin" });
                    }}>Retirer</Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ---------- CRM ---------- */

export function CrmTab() {
  const qc = useQueryClient();
  const fetchCrm = useServerFn(adminCrm);
  const retry = useServerFn(adminRetryCrmJob);
  const run = useServerFn(adminRunCrmWorker);
  const d = useQuery({ queryKey: ["admin", "crm"], queryFn: () => fetchCrm() });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin", "crm"] });
  const rt = useMutation({ mutationFn: (id: string) => retry({ data: { id } }), onSuccess: () => { toast.success("Relance programmée"); refresh(); }, onError: (e) => toast.error(errText(e)) });
  const rn = useMutation({ mutationFn: () => run(), onSuccess: () => { toast.success("Lot traité"); refresh(); }, onError: (e) => toast.error(errText(e)) });
  if (d.error) return <ErrorBox error={d.error} />;
  if (!d.data) return <Loading />;
  const c = d.data;
  const ready = (c.readiness as { ready?: boolean }).ready;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Configuration" value={ready ? "Prête" : "Incomplète"} />
        {["pending", "processing", "done", "failed", "dead"].map((s) => <Stat key={s} label={s} value={c.counts[s] ?? 0} />)}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" disabled={!ready || rn.isPending} onClick={() => window.confirm("Envoyer un lot de 10 synchronisations vers Zoho maintenant ?") && rn.mutate()}>Traiter un lot maintenant</Button>
        <p className="text-xs text-muted-foreground">Le traitement normal passe par la file d'attente planifiée. Ce bouton envoie de vraies données à Zoho.</p>
      </div>
      <Card title="Synchronisations en échec">
        {c.problems.length === 0 ? <Empty>Aucun échec.</Empty> : (
          <ul className="divide-y text-sm">
            {c.problems.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{p.entity_type} · {p.source_table} · <Pill tone="bad">{p.status}</Pill> {p.last_error_code ?? ""} <span className="text-xs text-muted-foreground">({p.attempts} essais, {fmtDate(p.updated_at, true)})</span></span>
                <Button size="sm" variant="outline" disabled={rt.isPending} onClick={() => rt.mutate(p.id)}>Relancer</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Derniers essais">
          {c.attempts.length === 0 ? <Empty>Aucun essai.</Empty> : (
            <ul className="space-y-1 text-sm">{c.attempts.map((a) => <li key={a.id}><Pill tone={a.ok ? "good" : "bad"}>{a.ok ? "OK" : a.error_code ?? "Erreur"}</Pill> <span className="text-muted-foreground">{a.http_status ?? ""} {fmtDate(a.at, true)}</span></li>)}</ul>
          )}
        </Card>
        <Card title="Erreurs de mise en file">
          {c.enqueueErrors.length === 0 ? <Empty>Aucune erreur.</Empty> : (
            <ul className="space-y-1 text-sm">{c.enqueueErrors.map((e) => <li key={e.id}>{e.source_table} · {e.error_code} <span className="text-muted-foreground">{fmtDate(e.at, true)}</span></li>)}</ul>
          )}
        </Card>
      </div>
    </div>
  );
}
