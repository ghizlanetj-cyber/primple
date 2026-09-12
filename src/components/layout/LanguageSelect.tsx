import { Languages } from "lucide-react";

import { cn } from "@/lib/utils";
import { languageLabels, languages, useI18n, type Lang } from "@/i18n";

type Props = {
  /** Visual placement. Both variants share the exact same language state. */
  variant?: "footer" | "header" | "mobile";
  id?: string;
  className?: string;
};

/**
 * Single shared language control (Français / English / العربية).
 * Header, mobile menu and footer all render this component, so the
 * selection stays synchronised and persisted through the i18n provider.
 */
export function LanguageSelect({ variant = "footer", id, className }: Props) {
  const { t, lang, setLang } = useI18n();
  const selectId = id ?? `language-select-${variant}`;
  const dark = variant !== "mobile";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Languages
        aria-hidden
        className={cn("size-4 shrink-0", dark ? "text-ink-muted" : "text-ink-muted")}
      />
      <label
        htmlFor={selectId}
        className={cn(
          "text-xs",
          variant === "header" ? "sr-only" : "text-ink-muted",
          variant === "mobile" && "text-ink-muted",
        )}
      >
        {t("cta.language")}
      </label>
      <select
        id={selectId}
        value={lang}
        onChange={(event) => setLang(event.target.value as Lang)}
        className={cn(
          "min-h-9 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-ink-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          variant === "header" && "min-h-8 py-1",
        )}
      >
        {languages.map((l) => (
          <option key={l} value={l} className="text-foreground">
            {languageLabels[l]}
          </option>
        ))}
      </select>
    </div>
  );
}
