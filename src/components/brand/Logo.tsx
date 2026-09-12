import { Link } from "@tanstack/react-router";
import logo from "@/assets/primpel-logo.png.asset.json";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

export function Logo({ className, invert = false }: { className?: string; invert?: boolean }) {
  const { tr } = useI18n();
  return (
    <Link to="/" className="inline-flex items-center" aria-label={tr("Primpel home")}>
      <img
        src={logo.url}
        alt="Primpel"
        className={cn("h-6 w-auto md:h-7", invert && "brightness-0 invert", className)}
      />
    </Link>
  );
}
