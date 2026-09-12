import { Link } from "@tanstack/react-router";
import logo from "@/assets/primple-logo-dark-purple.png.asset.json";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

export function Logo({ className, invert = false }: { className?: string; invert?: boolean }) {
  const { tr } = useI18n();
  return (
    <Link to="/" className="inline-flex items-center" aria-label={tr("Primple home")}>
      <img
        src={logo.url}
        alt="Primple"
        className={cn("h-7 w-auto md:h-8", invert && "brightness-0 invert", className)}
      />
    </Link>
  );
}
