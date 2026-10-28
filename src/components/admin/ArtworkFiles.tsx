import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, Eye, FileText, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminFileUrl, adminUnlinkedUploads } from "@/lib/admin.functions";
import { contactLinks, type ResolvedContact } from "@/lib/uploader-contact";
import { formatBytes } from "@/lib/files-api";
import { Card, Empty, ErrorBox, Loading, Pager, errText, fmtDate } from "./shared";

export function CustomerContact({ contact }: { contact: ResolvedContact }) {
  const links = contactLinks(contact.email, contact.phone);
  return (
    <div className="min-w-0 space-y-1 text-sm">
      {contact.name && <p className="font-medium break-words">{contact.name}</p>}
      {contact.source === "none" ? (
        <p className="text-amber-700 dark:text-amber-300">Coordonnées non recueillies</p>
      ) : (
        <>
          {contact.email && <p className="break-all">{contact.email}</p>}
          {contact.phone && <p dir="ltr">{contact.phone}</p>}
          {contact.source === "guest_form" && (
            <p className="text-xs text-muted-foreground">
              Coordonnées fournies lors de l'envoi · non vérifiées
            </p>
          )}
          {contact.source === "account" && (
            <p className="text-xs text-muted-foreground">Coordonnées du compte</p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {links.mailto && (
              <Button asChild size="sm" variant="outline">
                <a href={links.mailto}>
                  <Mail className="size-3.5" />
                  E-mail
                </a>
              </Button>
            )}
            {links.tel && (
              <Button asChild size="sm" variant="outline">
                <a href={links.tel}>
                  <Phone className="size-3.5" />
                  Appeler
                </a>
              </Button>
            )}
            {links.whatsapp && (
              <Button asChild size="sm" variant="outline">
                <a href={links.whatsapp} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

type FileRow = { id: string; file_name: string; size_bytes: number | string; created_at?: string };
export function ArtworkFile({ file }: { file: FileRow }) {
  const getUrl = useServerFn(adminFileUrl);
  const [busy, setBusy] = useState(false);
  async function open(download: boolean) {
    // Open synchronously so a slow signed-URL request is not blocked as a popup.
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    setBusy(true);
    try {
      const { url } = await getUrl({ data: { fileId: file.id, download } });
      if (tab) tab.location.replace(url);
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      tab?.close();
      toast.error(errText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 gap-2">
        <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="break-words text-sm font-medium">{file.file_name}</p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(Number(file.size_bytes))}
            {file.created_at ? " · " + fmtDate(file.created_at, true) : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void open(false)}>
          <Eye className="size-3.5" />
          Ouvrir
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void open(true)}>
          <Download className="size-3.5" />
          Télécharger
        </Button>
      </div>
    </div>
  );
}

export function UnlinkedUploads() {
  const [page, setPage] = useState(0);
  const fetchUploads = useServerFn(adminUnlinkedUploads);
  const list = useQuery({
    queryKey: ["admin", "unlinked-uploads", page],
    queryFn: () => fetchUploads({ data: { page } }),
    refetchInterval: 30000,
  });
  return (
    <Card>
      <h2 className="font-display text-base font-semibold">
        Fichiers sans commande{list.data ? " (" + list.data.total + ")" : ""}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Fichiers envoyés avant de terminer une commande. Les anciens envois anonymes peuvent ne
        contenir aucune coordonnée.
      </p>
      {list.error ? (
        <ErrorBox error={list.error} />
      ) : !list.data ? (
        <Loading />
      ) : !list.data.uploads.length ? (
        <Empty>Aucun fichier sans commande.</Empty>
      ) : (
        <>
          <ul className="mt-4 divide-y">
            {list.data.uploads.map((file) => (
              <li
                key={file.id}
                className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]"
              >
                <ArtworkFile file={file} />
                <CustomerContact contact={file.contact} />
              </li>
            ))}
          </ul>
          <Pager
            page={page}
            total={list.data.total}
            pageSize={list.data.pageSize}
            onPage={setPage}
          />
        </>
      )}
    </Card>
  );
}

