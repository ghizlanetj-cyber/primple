import { Download, Eye, FileText, FolderOpen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { formatBytes, signedFileUrl, type ClientFile } from "@/lib/files-api";

const statusLabels: Record<string, { en: string; fr: string; ar: string }> = {
  uploaded: { en: "Uploaded", fr: "Importé", ar: "تم الرفع" },
  attached: { en: "Attached to order", fr: "Joint à la commande", ar: "مرفق بالطلب" },
};

export function ClientFiles({
  files,
  isLoading,
  isError,
  folder,
  showOrder = false,
  heading = true,
}: {
  files: ClientFile[];
  isLoading: boolean;
  isError: boolean;
  /** Storage folder the files live in, shown so the client knows where they are. */
  folder?: string;
  showOrder?: boolean;
  heading?: boolean;
}) {
  const { tr, lang } = useI18n();

  const open = async (file: ClientFile, download: boolean) => {
    try {
      const url = await signedFileUrl(file.path, download);
      window.open(url, "_blank", "noopener");
    } catch {
      toast.error(tr("We couldn't open this file. Please try again."));
    }
  };

  return (
    <section className={heading ? "mt-7 border-t border-border pt-6" : "mt-2"}>
      {heading && (
        <h3 className="flex items-center gap-2 font-display text-base font-bold">
          <FolderOpen className="size-4 text-primary" />
          {tr("Client files")}
        </h3>
      )}

      {isLoading && <p className="mt-3 text-sm text-muted-foreground">{tr("Loading files…")}</p>}

      {isError && !isLoading && (
        <p className="mt-3 text-sm text-muted-foreground">
          {tr("We couldn't load your files. Please refresh the page.")}
        </p>
      )}

      {!isLoading && !isError && files.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          {tr("No file uploaded for this order yet.")}
        </p>
      )}

      {!isLoading && files.length > 0 && (
        <ul className="mt-4 space-y-3">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <FileText className="size-4 text-muted-foreground" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[
                      file.mimeType ?? file.name.split(".").pop()?.toUpperCase(),
                      formatBytes(file.sizeBytes),
                      new Date(file.createdAt).toLocaleDateString(
                        lang === "fr" ? "fr-MA" : lang === "ar" ? "ar-MA" : "en-GB",
                      ),
                      (statusLabels[file.status] ?? statusLabels["uploaded"]!)[lang],
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {showOrder && file.orderReference && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{file.orderReference}</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => void open(file, false)}
                >
                  <Eye className="size-4" />
                  {tr("Preview")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => void open(file, true)}
                >
                  <Download className="size-4" />
                  {tr("Download")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {folder && (
        <p className="mt-4 break-all text-xs text-muted-foreground" dir="ltr">
          <span dir="auto">{tr("Stored privately in your Primple account at:")} </span>
          client-artwork/{folder}
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        {tr("Only you and the Primple team can open these files. Links expire after a few minutes.")}
      </p>
    </section>
  );
}
