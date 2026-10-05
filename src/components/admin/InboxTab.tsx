import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { adminMessageDetail, adminMessages, adminUpdateMessage } from "@/lib/admin.functions";
import { CLASS_LABELS, CLASSIFICATIONS, QUOTE_LABELS, QUOTE_STAGES } from "@/lib/admin-metrics";
import { cn } from "@/lib/utils";
import { AssigneeSelect, Card, Empty, ErrorBox, HistoryList, Loading, NotesPanel, Pager, Pill, errText, fmtDate, useStaff } from "./shared";

export function InboxTab({ quotes, focusId, onFocus, canWrite }: { quotes: boolean; focusId: string | null; onFocus: (id: string | null) => void; canWrite: boolean }) {
  const [page, setPage] = useState(0);
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("");
  const [stage, setStage] = useState("");
  const [unread, setUnread] = useState(false);
  const [assignee, setAssignee] = useState<string | null>(null);
  const { nameOf } = useStaff();
  useEffect(() => {
    const t = setTimeout(() => { setQ(input); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [input]);
  useEffect(() => { setPage(0); setStage(""); setCls(""); }, [quotes]);
  const fetchList = useServerFn(adminMessages);
  const list = useQuery({
    queryKey: ["admin", "messages", quotes, page, q, cls, stage, unread, assignee],
    queryFn: () => fetchList({ data: { page, q, quotes, classification: cls || null, stage: stage || null, unread, assignee } }),
    placeholderData: keepPreviousData,
  });
  const sel = "h-9 rounded-md border bg-background px-2 text-sm";
  return (
    <div className="space-y-4">
      {quotes && list.data?.stageCounts ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {QUOTE_STAGES.map((s) => (
            <button key={s} onClick={() => { setStage(stage === s ? "" : s); setPage(0); }}
              className={cn("rounded-xl border bg-card p-3 text-left", stage === s && "border-primary ring-1 ring-primary")}>
              <p className="text-xs text-muted-foreground">{QUOTE_LABELS[s]}</p>
              <p className="font-heading text-lg font-semibold">{list.data?.stageCounts?.[s] ?? 0}</p>
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nom, e-mail, sujet, contenu" className="h-9 w-full sm:w-72" aria-label="Rechercher un message" />
        {!quotes ? (
          <select className={sel} value={cls} onChange={(e) => { setCls(e.target.value); setPage(0); }} aria-label="Classification">
            <option value="">Toutes classifications</option>
            {CLASSIFICATIONS.map((c) => <option key={c} value={c}>{CLASS_LABELS[c]}</option>)}
          </select>
        ) : null}
        <div className="w-44"><AssigneeSelect value={assignee} onChange={(v) => { setAssignee(v); setPage(0); }} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={unread} onChange={(e) => { setUnread(e.target.checked); setPage(0); }} /> Non lus</label>
      </div>
      <Card>
        {list.error ? <ErrorBox error={list.error} /> : !list.data ? <Loading /> : list.data.messages.length === 0 ? <Empty>Aucun message.</Empty> : (
          <>
            <ul className="divide-y">
              {list.data.messages.map((m) => (
                <li key={m.id}>
                  <button className="flex w-full flex-col gap-1 py-3 text-left hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-4" onClick={() => onFocus(m.id)}>
                    <span className={cn("w-48 shrink-0 truncate text-sm", !m.meta?.is_read && "font-semibold")}>{!m.meta?.is_read ? "● " : ""}{m.name}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{m.topic ? `${m.topic} · ` : ""}{m.message}</span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      <Pill>{quotes ? QUOTE_LABELS[m.meta?.quote_stage ?? "new"] : CLASS_LABELS[m.meta?.classification ?? "unclassified"]}</Pill>
                      {m.meta?.assigned_to ? nameOf(m.meta.assigned_to) : null}
                      {fmtDate(m.created_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <Pager page={page} total={list.data.total} pageSize={list.data.pageSize} onPage={setPage} />
          </>
        )}
      </Card>
      <Sheet open={Boolean(focusId)} onOpenChange={(o) => !o && onFocus(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {focusId ? <MessageDetail id={focusId} canWrite={canWrite} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MessageDetail({ id, canWrite }: { id: string; canWrite: boolean }) {
  const qc = useQueryClient();
  const fetchDetail = useServerFn(adminMessageDetail);
  const update = useServerFn(adminUpdateMessage);
  const key = ["admin", "message", id];
  const d = useQuery({ queryKey: key, queryFn: () => fetchDetail({ data: { id } }) });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: key });
    void qc.invalidateQueries({ queryKey: ["admin", "messages"] });
    void qc.invalidateQueries({ queryKey: ["admin", "queue"] });
  };
  const save = useMutation({
    mutationFn: (fields: Record<string, unknown>) => update({ data: { id, version: d.data?.meta?.version ?? null, fields } }),
    onSuccess: refresh,
    onError: (e) => { toast.error(errText(e)); refresh(); },
  });
  // Opening a message marks it read once.
  const meta = d.data?.meta;
  useEffect(() => {
    if (canWrite && d.data && !meta?.is_read && !save.isPending) save.mutate({ is_read: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.data?.message.id]);
  if (d.error) return <ErrorBox error={d.error} />;
  if (!d.data) return <Loading />;
  const m = d.data.message;
  const busy = !canWrite || save.isPending;
  return (
    <div className="space-y-5">
      <SheetHeader>
        <SheetTitle>{m.topic ?? "Message"}</SheetTitle>
        <p className="text-sm text-muted-foreground">{m.name} · <a className="text-primary hover:underline" href={`mailto:${m.email}`}>{m.email}</a>{m.company ? ` · ${m.company}` : ""}</p>
        <p className="text-xs text-muted-foreground">{fmtDate(m.created_at, true)}</p>
      </SheetHeader>
      <p className="whitespace-pre-wrap rounded-lg bg-muted/60 p-3 text-sm">{m.message}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted-foreground">Classification
          <select className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm text-foreground" value={meta?.classification ?? "unclassified"} disabled={busy} onChange={(e) => save.mutate({ classification: e.target.value })}>
            {CLASSIFICATIONS.map((c) => <option key={c} value={c}>{CLASS_LABELS[c]}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">Étape du devis
          <select className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm text-foreground" value={meta?.quote_stage ?? "new"} disabled={busy} onChange={(e) => save.mutate({ quote_stage: e.target.value })}>
            {QUOTE_STAGES.map((s) => <option key={s} value={s}>{QUOTE_LABELS[s]}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">Assigné à
          <div className="mt-1"><AssigneeSelect value={meta?.assigned_to ?? null} disabled={busy} onChange={(v) => save.mutate({ assigned_to: v })} /></div>
        </label>
        <div className="flex items-end">
          {canWrite ? <Button size="sm" variant="outline" disabled={busy} onClick={() => save.mutate({ is_read: !meta?.is_read })}>{meta?.is_read ? "Marquer non lu" : "Marquer lu"}</Button> : null}
        </div>
      </div>
      <NotesPanel type="message" entityKey={id} notes={d.data.notes} canWrite={canWrite} invalidate={key} />
      <HistoryList items={d.data.history} />
    </div>
  );
}
