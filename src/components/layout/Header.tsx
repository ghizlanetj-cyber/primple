import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, ShoppingBag } from "lucide-react";

import { LanguageSelect } from "@/components/layout/LanguageSelect";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import originalLogo from "@/assets/primple-logo-new.png.asset.json";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, t, tr } = useI18n();
  const items = useCart((s) => s.items);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-2 z-50 lg:top-3">
      <div dir="ltr" className="relative mx-auto flex w-[calc(100%-1.5rem)] max-w-[1390px] items-center gap-3 sm:w-[calc(100%-2.5rem)] lg:w-[calc(100%-4rem)]">
        <div className="flex h-14 shrink-0 items-center lg:h-[60px]">
          <Link to="/" className="inline-flex items-center" aria-label={tr("Primple home")}>
            <img src={originalLogo.url} alt="Primple" className="h-6 w-auto lg:h-7" />
          </Link>
        </div>
        <nav dir={lang === "ar" ? "rtl" : "ltr"} className="absolute left-1/2 z-10 hidden -translate-x-1/2 items-center gap-x-5 md:flex" aria-label={tr("Primary navigation")}>
          <NavLink to="/products">{t("nav.products")}</NavLink>
          <NavLink to="/packs">{t("nav.packs")}</NavLink>
          <NavLink to="/contact">{t("nav.contact")}</NavLink>
        </nav>
      <div className="primple-glass ms-auto grid h-14 min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-full border px-3 transition-opacity duration-300 sm:px-4 lg:h-[60px] lg:px-5">
        <div aria-hidden="true" />

        <div dir={lang === "ar" ? "rtl" : "ltr"} className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <LanguageSelect variant="header" id="header-language" className="hidden lg:flex" />
          <HeaderSearch />
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="relative size-9 text-ink-foreground hover:text-ink-foreground"
          >
            <Link to="/cart" aria-label={t("cta.cart")}>
              <ShoppingBag className="size-4" />
              {items.length > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {items.length}
                </span>
              )}
            </Link>
          </Button>

          {!loading && user ? (
            <>
              <Button
                variant="ghost"
                asChild
                className="hidden h-9 px-3 text-ink-foreground hover:text-ink-foreground md:inline-flex"
              >
                <Link to="/dashboard">{t("nav.dashboard")}</Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={tr("Log out")}
                title={tr("Log out")}
                className="hidden size-9 rounded-full text-ink-foreground md:inline-flex"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="size-4 rtl:rotate-180" />
              </Button>
            </>
          ) : !loading ? (
            <div className="hidden items-center gap-1 md:flex">
              <Button variant="ghost" asChild className="h-9 px-3 text-ink-foreground hover:text-ink-foreground">
                <Link to="/login">{t("nav.login")}</Link>
              </Button>
            </div>
          ) : null}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11 text-ink-foreground md:hidden"
                aria-label={t("cta.menu")}
                aria-expanded={mobileOpen}
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side={lang === "ar" ? "left" : "right"}
              closeLabel={t("cta.close")}
              className="w-[min(92vw,24rem)] overflow-y-auto border-white/10 bg-ink p-0 text-ink-foreground"
            >
              <SheetHeader className="flex-row items-center justify-between space-y-0 border-b border-white/10 px-6 py-4 text-start">
                <Link to="/" className="inline-flex items-center" aria-label={tr("Primple home")}>
                  <img src={originalLogo.url} alt="Primple" className="h-5 w-auto" />
                </Link>
                <SheetTitle className="sr-only">{t("cta.menu")}</SheetTitle>
                <SheetDescription className="sr-only">
                  {tr("Primary navigation and account actions")}
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col px-6 pb-8 pt-4" aria-label={tr("Primary navigation")}>
                {[
                  { to: "/products", label: t("nav.products") },
                  { to: "/packs", label: t("nav.packs") },
                  { to: "/contact", label: t("nav.contact") },
                ].map((link) => (
                  <SheetClose asChild key={link.to}>
                    <Link
                      to={link.to}
                      className="border-b border-white/10 py-4 font-display text-2xl font-bold text-ink-foreground"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}

                {!loading && user ? (
                  <>
                    <SheetClose asChild>
                      <Link
                        to="/dashboard"
                        className="border-b border-white/10 py-4 font-display text-2xl font-bold text-ink-foreground"
                      >
                        {t("nav.dashboard")}
                      </Link>
                    </SheetClose>
                    <Button
                      variant="outline"
                      size="lg"
                      className="mt-5 border-white/20 bg-transparent text-ink-foreground"
                      onClick={async () => {
                        setMobileOpen(false);
                        await signOut();
                        navigate({ to: "/" });
                      }}
                    >
                      <LogOut className="size-4 rtl:rotate-180" />
                      {tr("Log out")}
                    </Button>
                  </>
                ) : !loading ? (
                  <div className="mt-5 grid gap-3">
                    <SheetClose asChild>
                      <Button asChild variant="outline" size="lg" className="border-white/20 bg-transparent text-ink-foreground">
                        <Link to="/login">{t("nav.login")}</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild size="lg">
                        <Link to="/signup">{tr("Create account")}</Link>
                      </Button>
                    </SheetClose>
                  </div>
                ) : null}

                <LanguageSelect variant="mobile" id="mobile-language" className="mt-6" />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-full py-1.5 text-[14px] font-medium text-white/85 transition-colors hover:text-white xl:text-[15px]"
      activeProps={{ className: "text-white" }}
    >
      {children}
    </Link>
  );
}
