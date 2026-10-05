import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { adminAddNote, adminStaff } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

export const mad = (n: number | null | undefined) =>
  `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 2 }).format(Number(n) || 0)} MAD`;
export const fmtDate = (d: string | null | undefined, time = false) =>
  d
    ? new Intl.DateTimeFormat("fr-MA", time ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "medium" }).format(new Date(d))
    : "—";
export const errText = (e: unknown) => (e instanceof Error ? e.message : "Erreur inattendue");

export const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Non payé",
  awaiting_transfer: "Virement attendu",
  paid: "Payé",
  failed: "Échec",
  refunded: "Remboursé",
};
export const STATUS_LABELS: Record<string, string> = {
  "Order placed": "Commande reçue",
  "Artwork approved": "BAT validé",
  "In production": "En production",
  "Quality check": "Contrôle qualité",
  Shipped: "Expédiée",
  Delivered: "Livrée",
  Cancelled: "Annulée",
};
export const ROLE_LABELS: Record<string, string> = { admin: "Administrateur", team: "Équipe", moderator: "Paiements" };
export const ACTION_LABELS: Record<string, string> = {
  update_order_ops: "Production mise à jour",
  update_message: "Message mis à jour",
  add_note: "Note ajoutée",
  record_balance: "Solde espèces enregistré",
  set_availability: "Disponibilité modifiée",
  grant_member: "Accès accordé",
  revoke_member: "Accès retiré",
  confirm_transfer: "Virement confirmé",
};

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "good" | "warn" | "bad" | "primary" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "good" && "bg-primary/15 text-foreground",
        tone === "primary" && "bg-primary text-primary-foreground",
        tone === "warn" && "bg-accent text-accent-foreground",
        tone === "bad" && "bg-destructive/15 text-destructive",
      )}
    >
      {children}
    </span>
  );
}

export function paymentTone(s: string) {
  return s === "paid" ? "good" : s === "failed" ? "bad" : s === "awaiting_transfer" ? "warn" : "muted";
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: "warn" }) {
  return (
    <div className={cn("rounded-xl border bg-card p-4", tone === "warn" && "border-destructive/40")}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Card({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card p-4 sm:p-5", className)}>
      {title || action ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title ? <h2 className="font-heading text-base font-semibold">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Pager({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {total} résultat{total > 1 ? "s" : ""} · page {page + 1}/{pages}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)}>
          Précédent
        </Button>
        <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>
          Suivant
        </Button>
      </div>
    </div>
  );
}

export function Loading({ label = "Chargement…" }: { label?: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground" role="status">{label}</p>;
}
export function ErrorBox({ error }: { error: unknown }) {
  return <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{errText(error)}</p>;
}
export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

/** Staff directory shared by assignment selects and history labels. */
export function useStaff() {
  const fetchStaff = useServerFn(adminStaff);
  const q = useQuery({ queryKey: ["admin", "staff"], queryFn: () => fetchStaff(), staleTime: 60_000 });
  const rows = q.data ?? [];
  const nameOf = (id: string | null | undefined) => {
    if (!id) return "—";
    const r = rows.find((x) => x.user_id === id);
    return r ? r.display_name || r.email || "Membre" : "Ancien membre";
  };
  const assignable = rows.filter((r) => r.active && (r.role === "team" || r.role === "admin"));
  const unique = assignable.filter((r, i) => assignable.findIndex((x) => x.user_id === r.user_id) === i);
  return { rows, nameOf, assignable: unique, loading: q.isLoading };
}

export function AssigneeSelect({ value, onChange, disabled, id }: { value: string | null; onChange: (v: string | null) => void; disabled?: boolean; id?: string }) {
  const { assignable } = useStaff();
  return (
    <select
      id={id}
      className="h-9 w-full rounded-md border bg-background px-2 text-sm"
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">Non assigné</option>
      {assignable.map((m) => (
        <option key={m.user_id} value={m.user_id}>
          {m.display_name || m.email}
        </option>
      ))}
    </select>
  );
}

export function NotesPanel({
  type,
  entityKey,
  notes,
  canWrite,
  invalidate,
}: {
  type: "order" | "customer" | "message";
  entityKey: string;
  notes: { id: string; body: string; author_id: string; created_at: string }[];
  canWrite: boolean;
  invalidate: unknown[];
}) {
  const [body, setBody] = useState("");
  const qc = useQueryClient();
  const { nameOf } = useStaff();
  const add = useServerFn(adminAddNote);
  const m = useMutation({
    mutationFn: () => add({ data: { type, key: entityKey, body } }),
    onSuccess: () => {
      setBody("");
      toast.success("Note ajoutée");
      void qc.invalidateQueries({ queryKey: invalidate });
    },
    onError: (e) => toast.error(errText(e)),
  });
  return (
    <div>
      <h3 className="text-sm font-semibold">Notes internes</h3>
      {canWrite ? (
        <div className="mt-2 space-y-2">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Visible uniquement par l'équipe" maxLength={4000} rows={2} aria-label="Nouvelle note interne" />
          <Button size="sm" disabled={!body.trim() || m.isPending} onClick={() => m.mutate()}>
            Ajouter la note
          </Button>
        </div>
      ) : null}
      <ul className="mt-3 space-y-2">
        {notes.length === 0 ? <li className="text-sm text-muted-foreground">Aucune note.</li> : null}
        {notes.map((n) => (
          <li key={n.id} className="rounded-lg bg-muted/60 p-2 text-sm">
            <p className="whitespace-pre-wrap">{n.body}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {nameOf(n.author_id)} · {fmtDate(n.created_at, true)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HistoryList({ items }: { items: { id: string; actor_id: string | null; action: string; changes: unknown; at: string }[] }) {
  const { nameOf } = useStaff();
  return (
    <div>
      <h3 className="text-sm font-semibold">Historique</h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.length === 0 ? <li className="text-muted-foreground">Aucune action enregistrée.</li> : null}
        {items.map((h) => (
          <li key={h.id} className="flex flex-wrap gap-x-2 text-muted-foreground">
            <span className="text-foreground">{ACTION_LABELS[h.action] ?? h.action}</span>
            <span>par {nameOf(h.actor_id)}</span>
            <span>· {fmtDate(h.at, true)}</span>
            {describeChanges(h.changes)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function describeChanges(c: unknown) {
  if (!c || typeof c !== "object") return null;
  const keys = Object.keys(c as object).filter((k) => !["body"].includes(k));
  return keys.length ? <span className="w-full text-xs">Champs : {keys.join(", ")}</span> : null;
}
