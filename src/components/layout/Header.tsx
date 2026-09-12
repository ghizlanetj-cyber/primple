import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronDown, LogOut, Menu, Moon, ShoppingBag, Sun, X } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { products } from "@/data/products";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";
import { languageLabels, languages, useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const { lang, setLang, t, tr } = useI18n();
  const items = useCart((s) => s.items);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);


  return (
    <header
      className={cn(
        "fixed inset-x-3 top-3 z-50 mx-auto max-w-[86rem] rounded-full border transition-all duration-500 sm:inset-x-5 lg:top-5",
        scrolled
          ? "border-white/15 bg-ink/92 shadow-lift backdrop-blur-2xl"
          : "border-white/12 bg-ink/72 shadow-soft backdrop-blur-xl",
      )}
      onMouseLeave={() => setMegaOpen(false)}
    >
      <div className="grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:flex sm:justify-between sm:px-6 md:h-[4.5rem] lg:px-8">
        <div className="flex min-w-0 items-center gap-7 xl:gap-9">
          <Logo invert className="h-5 shrink-0 md:h-6" />
          <nav className="hidden items-center gap-1 lg:flex">
            <button
              type="button"
              onMouseEnter={() => setMegaOpen(true)}
              onClick={() => setMegaOpen((v) => !v)}
               className="flex items-center gap-1 rounded-full px-2 py-2 text-xs font-medium text-ink-muted transition-colors hover:text-ink-foreground xl:px-3 xl:text-sm"
              aria-expanded={megaOpen}
            >
              {t("nav.products")}
              <ChevronDown
                className={cn("size-4 transition-transform", megaOpen && "rotate-180")}
              />
            </button>
            <NavLink to="/services">{tr("Services")}</NavLink>
            <NavLink to="/platform">{t("nav.platform")}</NavLink>
            <NavLink to="/pricing">{t("nav.pricing")}</NavLink>
            <NavLink to="/partners">{t("nav.partners")}</NavLink>
            <NavLink to="/contact">{tr("Contact")}</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2">
           <div className="hidden items-center rounded-full border border-white/10 bg-white/5 p-0.5 xl:flex">
            {languages.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                  lang === l
                    ? "bg-primary text-primary-foreground"
                     : "text-ink-muted hover:text-ink-foreground",
                )}
                aria-pressed={lang === l}
              >
                {languageLabels[l]}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label={t("cta.theme")}
            onClick={() => setDark((v) => !v)}
             className="hidden text-ink-muted hover:text-ink-foreground md:inline-flex"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

           <Button variant="ghost" size="icon" asChild className="relative text-ink-muted hover:text-ink-foreground">
            <Link to="/cart" aria-label={t("cta.cart")}>
              <ShoppingBag className="size-4" />
              {items.length > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {items.length}
                </span>
              )}
            </Link>
          </Button>

          {user ? (
            <>
             <Button variant="ghost" asChild className="hidden text-ink-muted hover:text-ink-foreground xl:inline-flex">
                <Link to="/dashboard">{t("nav.dashboard")}</Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={tr("Log out")}
                title={tr("Log out")}
                className="hidden rounded-full md:inline-flex"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="size-4 rtl:rotate-180" />
              </Button>
            </>
          ) : (
             <Button variant="ghost" asChild className="hidden text-ink-muted hover:text-ink-foreground xl:inline-flex">
              <Link to="/login">{t("nav.login")}</Link>
            </Button>
          )}

           <Button asChild className="hidden md:inline-flex">
             <Link to="/products">{t("cta.start")} <ArrowRight className="size-4 rtl:rotate-180" /></Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
             className="text-ink-foreground lg:hidden"
            aria-label={t("cta.menu")}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {megaOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="hidden overflow-hidden rounded-b-3xl border-t border-white/10 bg-ink/95 text-ink-foreground backdrop-blur-2xl lg:block"
          >
             <div className="grid grid-cols-4 gap-2 px-8 py-7">
              {products.map((p) => (
                <Link
                  key={p.slug}
                  to="/products/$slug"
                  params={{ slug: p.slug }}
                  onClick={() => setMegaOpen(false)}
                   className="group rounded-lg px-3 py-2.5 transition-colors hover:bg-white/8"
                >
                   <p className="text-sm font-semibold">{tr(p.name)}</p>
                    <p className="text-xs text-ink-muted">{tr(p.benefit)}</p>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background lg:hidden"
          >
            <div className="section-shell flex h-16 items-center justify-between">
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("cta.close")}
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="section-shell flex flex-col gap-1 pb-8 pt-4">
              <div className="mb-4 flex items-center rounded-full border border-border bg-card/60 p-1">
                {languages.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    className={cn(
                      "flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                      lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                    )}
                    aria-pressed={lang === l}
                  >
                    {languageLabels[l]}
                  </button>
                ))}
              </div>
              {[
                { to: "/products", label: t("nav.products") },
                { to: "/services", label: tr("Services") },
                { to: "/platform", label: t("nav.platform") },
                { to: "/pricing", label: t("nav.pricing") },
                { to: "/partners", label: t("nav.partners") },
                { to: "/designers", label: tr("For designers") },
                { to: "/about", label: tr("About") },
                { to: "/contact", label: tr("Contact") },
                { to: "/dashboard", label: t("nav.dashboard") },
                ...(user ? [] : [{ to: "/login", label: t("nav.login") }]),
              ].map((link, i) => (
                <motion.div
                  key={link.to}
                   initial={{ opacity: 0, x: lang === "ar" ? 12 : -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <Link
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className="block border-b border-border py-4 font-display text-2xl font-bold"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <Button asChild size="lg" className="mt-6 rounded-full">
                <Link to="/products" onClick={() => setMobileOpen(false)}>
                  {t("cta.start")}
                </Link>
              </Button>
              {user && (
                <Button
                  variant="outline"
                  size="lg"
                  className="mt-3 rounded-full"
                  onClick={async () => {
                    setMobileOpen(false);
                    await signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="size-4 rtl:rotate-180" />
                  {tr("Log out")}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-full px-2 py-2 text-xs font-medium text-ink-muted transition-colors hover:text-ink-foreground xl:px-3 xl:text-sm"
      activeProps={{ className: "text-ink-foreground" }}
    >
      {children}
    </Link>
  );
}
