import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, FileText, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import {
  ACCEPTED_ARTWORK_EXTENSIONS,
  MAX_ARTWORK_BYTES,
  deleteClientFile,
  formatBytes,
  isAcceptedArtwork,
  uploadClientFile,
  type ClientFile,
} from "@/lib/files-api";

/** A real uploaded file, stored in the private client artwork bucket. */
export type ArtworkState = ClientFile;

const accepted = ACCEPTED_ARTWORK_EXTENSIONS.map((e) => `.${e}`).join(",");

export function ArtworkUpload({
  artwork,
  onChange,
}: {
  artwork: ArtworkState | null;
  onChange: (artwork: ArtworkState | null) => void;
}) {
  const { tr } = useI18n();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleFile = async (file: File) => {
    if (!user) {
      toast.error(tr("Log in to upload your file."));
      return;
    }
    if (!isAcceptedArtwork(file)) {
      toast.error(tr("Accepted formats: PDF, PNG, JPG or SVG."));
      return;
    }
    if (file.size > MAX_ARTWORK_BYTES) {
      toast.error(tr("Your file is larger than 50 MB. Send it to us by WhatsApp instead."));
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadClientFile(user.id, file);
      onChange(uploaded);
      toast.success(tr("File uploaded to your account."));
    } catch {
      toast.error(tr("We couldn't upload your file. Please try again."));
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async () => {
    if (!artwork) return;
    setRemoving(true);
    try {
      await deleteClientFile(artwork);
      onChange(null);
    } catch {
      toast.error(tr("We couldn't remove this file. Please try again."));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accepted}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />

      {!user && (
        <p className="mb-3 rounded-xl bg-secondary/70 p-3 text-sm text-muted-foreground">
          {tr("Log in to upload your file.")}{" "}
          <Link to="/login" className="font-semibold text-foreground hover:underline">
            {tr("Log in")}
          </Link>
        </p>
      )}

      <AnimatePresence mode="wait">
        {!artwork ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              disabled={!user || uploading}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) void handleFile(file);
              }}
              className={cn(
                "flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors disabled:opacity-60",
                dragging
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/40 hover:border-primary/50",
              )}
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-card shadow-soft">
                <UploadCloud className="size-5 text-primary" />
              </span>
              <span className="font-display text-base font-bold">{tr("Upload artwork")}</span>
              <span className="text-sm text-muted-foreground">
                {tr("Drag your file here or browse — PDF, PNG, JPG or SVG")}
              </span>
              <span className="text-xs text-muted-foreground">{tr("Up to 50 MB per file.")}</span>
              {uploading && <Progress className="mt-2 h-1.5 w-48" />}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <FileText className="size-5 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{artwork.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(artwork.sizeBytes)}
                  {artwork.mimeType ? ` · ${artwork.mimeType}` : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={removing}
                aria-label={tr("Remove artwork")}
                onClick={() => void removeFile()}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-success/12 px-3 py-2.5 text-sm font-medium text-success">
              <CheckCircle2 className="size-4 shrink-0" />
              {tr("Saved to your account. You'll find it on your order in your dashboard.")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
