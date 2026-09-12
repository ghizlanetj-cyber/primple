import { Link } from "@tanstack/react-router";
import { ArrowRight, Languages } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { products } from "@/data/products";
import { toast } from "sonner";
import { languageLabels, languages, useI18n, type Lang } from "@/i18n";
import { contact } from "@/config/contact";

const columns: { titleKey: string; links: { label: string; to: string }[] }[] = [
  {
    titleKey: "footer.products",
    links: products.slice(0, 8).map((p) => ({ label: p.name, to: `/products/${p.slug}` })),
  },
  {
    titleKey: "nav.platform",
    links: [
      { label: "Platform overview", to: "/platform" },
      { label: "Services", to: "/services" },
      { label: "Pricing", to: "/pricing" },
      { label: "Enterprise", to: "/enterprise" },
      { label: "Help Center", to: "/help" },
      { label: "Client dashboard", to: "/dashboard" },
    ],
  },
  {
    titleKey: "footer.company",
    links: [
      { label: "About us", to: "/about" },
      { label: "Blog", to: "/blog" },
      { label: "Contact", to: "/contact" },
      { label: "Become a Print Partner", to: "/partners" },
      { label: "Become a Designer", to: "/designers" },
      { label: "Create an account", to: "/signup" },
    ],
  },
];

const legalLinks = [
  { label: "Terms of Service", to: "/terms" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Security", to: "/security" },
];

export function Footer() {
  const { t, tr, lang, setLang } = useI18n();

  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="section-shell py-20 md:py-28">
        <div className="grid gap-16 lg:grid-cols-[1.15fr_2fr]">
          <div>
            <Logo invert />
            <p className="mt-5 max-w-sm text-sm text-ink-muted">
              {tr(
                "Custom printing for brands, businesses and creatives in Morocco: options explained, price shown before you order, production followed to delivery.",
              )}
            </p>
            <address className="mt-5 space-y-1 text-sm not-italic text-ink-muted">
              <p>{contact.address}</p>
              <p>
                <a href={contact.mailto} className="hover:text-ink-foreground">
                  {contact.email}
                </a>
              </p>
              <p>
                <a href={contact.tel} className="hover:text-ink-foreground" dir="ltr">
                  {contact.phone}
                </a>
              </p>
            </address>
            <form
              className="mt-8 flex max-w-sm gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success(tr("You're on the list. Printing tips, once a month."));
              }}
            >
              <Input
                type="email"
                required
                placeholder={tr("Your work email")}
                aria-label={tr("Email address")}
                className="rounded-full border-white/15 bg-white/5 text-ink-foreground placeholder:text-ink-muted"
              />
              <Button type="submit" size="icon" className="shrink-0 rounded-full">
                <ArrowRight className="size-4 rtl:rotate-180" />
                <span className="sr-only">{tr("Subscribe")}</span>
              </Button>
            </form>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.titleKey}>
                <p className="eyebrow text-primary">{t(col.titleKey)}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-ink-muted transition-colors hover:text-ink-foreground"
                      >
                        {tr(link.label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">
            © {new Date().getFullYear()} Primple. {t("footer.rights")}
          </p>
          <nav className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
            {legalLinks.map((link) => (
              <Link key={link.to} to={link.to} className="hover:text-ink-foreground">
                {tr(link.label)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Languages aria-hidden className="size-4 text-ink-muted" />
            <label htmlFor="footer-language" className="text-xs text-ink-muted">
              {t("cta.language")}
            </label>
            <select
              id="footer-language"
              value={lang}
              onChange={(event) => setLang(event.target.value as Lang)}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-ink-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {languages.map((l) => (
                <option key={l} value={l} className="text-foreground">
                  {languageLabels[l]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}
