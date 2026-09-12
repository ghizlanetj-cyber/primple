import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle2, FileText, Trash2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

export type ArtworkState = {
  name: string;
  size: string;
  ready: boolean;
  checks: { label: string; ok: boolean; detail: string }[];
};

const accepted = ".pdf,.png,.jpg,.jpeg,.svg";

export function ArtworkUpload({
  artwork,
  onChange,
}: {
  artwork: ArtworkState | null;
  onChange: (artwork: ArtworkState | null) => void;
}) {
  const { tr } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleFile = (file: File) => {
    setUploading(true);
    setProgress(0);
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    const step = () => {
      setProgress((p) => {
        if (p >= 100) return 100;
        const next = Math.min(100, p + 14);
        if (next < 100) setTimeout(step, 110);
        else {
          setUploading(false);
          onChange({
            name: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
            ready: isPdf,
            checks: [
              {
                label: tr("Resolution"),
                ok: true,
                detail: tr("Sharp enough at final print size"),
              },
              {
                label: tr("Bleed"),
                ok: isPdf,
                detail: tr(
                  isPdf ? "3 mm bleed found" : "We'll add bleed for you — confirm the edges",
                ),
              },
              {
                label: tr("Colours"),
                ok: true,
                detail: tr("Converted to print colours automatically"),
              },
            ],
          });
        }
        return next;
      });
    };
    setTimeout(step, 120);
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
          if (file) handleFile(file);
        }}
      />

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
                if (file) handleFile(file);
              }}
              className={cn(
                "flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
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
              {uploading && <Progress value={progress} className="mt-2 h-1.5 w-48" />}
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
                <p className="text-xs text-muted-foreground">{artwork.size}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={tr("Remove artwork")}
                onClick={() => onChange(null)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div
              className={cn(
                "mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium",
                artwork.ready
                  ? "bg-success/12 text-success"
                  : "bg-warning/15 text-warning-foreground",
              )}
            >
              {artwork.ready ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <AlertTriangle className="size-4" />
              )}
              {artwork.ready
                ? tr("Your artwork looks ready to print.")
                : tr("One thing to check before printing.")}
            </div>

            <ul className="mt-4 space-y-2">
              {artwork.checks.map((c) => (
                <li key={c.label} className="flex items-start gap-2 text-sm">
                  {c.ok ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : (
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                  )}
                  <span>
                    <span className="font-medium">{c.label}</span>
                    <span className="block text-xs text-muted-foreground">{c.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
