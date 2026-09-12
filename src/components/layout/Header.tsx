import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Globe2, LogOut, Menu, Moon, ShoppingBag, Sun, X } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";
import { languageLabels, languages, useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
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
        "fixed inset-x-4 top-4 z-50 mx-auto max-w-5xl rounded-full border transition-all duration-500 sm:inset-x-6 lg:top-5",
        scrolled
          ? "border-white/25 bg-ink/35 shadow-lift backdrop-blur-3xl"
          : "border-white/20 bg-ink/15 shadow-lift backdrop-blur-3xl",
      )}
    >
      <div className="pointer-events-none absolute inset-x-7 top-px h-px bg-linear-to-r from-transparent via-white/60 to-transparent" />
      <div className="relative grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:flex sm:justify-between sm:px-6 md:h-[4.5rem] lg:px-8">
        <div className="flex min-w-0 items-center gap-7 xl:gap-9">
          <Logo invert className="h-5 shrink-0 md:h-6" />
          <nav className="hidden items-center gap-1 lg:flex">
            <NavLink to="/services">Solutions</NavLink>
            <NavLink to="/products">Produits</NavLink>
            <NavLink to="/about">Pourquoi Primple</NavLink>
            <NavLink to="/platform">Nos réalisation</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden xl:block">
            <Button
              variant="ghost"
              size="icon"
              aria-label={languageLabels[lang]}
              aria-expanded={languageOpen}
              onClick={() => setLanguageOpen((open) => !open)}
              className="text-ink-muted hover:bg-white/10 hover:text-ink-foreground"
            >
              <Globe2 className="size-4" />
            </Button>
            <AnimatePresence>
              {languageOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-12 min-w-40 overflow-hidden rounded-xl border border-white/20 bg-ink/55 p-1.5 shadow-lift backdrop-blur-3xl"
                >
                  {languages.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => {
                        setLang(l);
                        setLanguageOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-ink-foreground transition-colors hover:bg-white/10"
                    >
                      {languageLabels[l]}
                      {lang === l && <Check className="size-3.5 text-primary" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
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
          ) : null}

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
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -left-3 -top-3 z-50 h-svh w-screen overflow-y-auto bg-ink text-ink-foreground sm:-left-5 lg:hidden"
          >
            <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
              <Logo invert className="h-6" />
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
              <div
                className="mb-4 flex items-center rounded-full border border-white/10 bg-white/5 p-1">
                {languages.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    className={cn(
                      "flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                       lang === l ? "bg-primary text-primary-foreground" : "text-ink-muted",
                    )}
                    aria-pressed={lang === l}
                  >
                    {languageLabels[l]}
                  </button>
                ))}
              </div>
              {[
                { to: "/services", label: "Solutions" },
                { to: "/products", label: "Produits" },
                { to: "/about", label: "Pourquoi Primple" },
                { to: "/platform", label: "Nos réalisation" },
                { to: "/contact", label: "Contact" },
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
                    className="block border-b border-white/10 py-4 font-display text-2xl font-bold text-ink-foreground"
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
                   className="mt-3 border-white/20 bg-transparent text-ink-foreground"
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
      className="rounded-full px-2 py-2 text-xs font-medium text-white/80 transition-colors hover:text-white xl:px-3 xl:text-sm"
      activeProps={{ className: "text-white" }}
    >
      {children}
    </Link>
  );
}
