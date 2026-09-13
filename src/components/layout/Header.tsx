import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LogOut, Menu, ShoppingBag } from "lucide-react";

import { LanguageSelect } from "@/components/layout/LanguageSelect";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { Logo } from "@/components/brand/Logo";
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
    <header
      className={cn(
        "fixed left-1/2 top-2 z-50 w-[calc(100%-1.5rem)] max-w-[1390px] -translate-x-1/2 rounded-full border transition-opacity duration-300 sm:w-[calc(100%-2.5rem)] lg:top-3 lg:w-[calc(100%-4rem)]",
      )}
      style={{
        backgroundColor: "rgba(80, 112, 122, 0.20)",
        borderColor: "rgba(220, 240, 245, 0.16)",
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 8px 28px rgba(0, 0, 0, 0.12)",
        backdropFilter: "blur(18px) saturate(125%)",
      }}
    >
      <div className="relative grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:px-4 lg:h-[60px] lg:px-5">
        <div className="flex min-w-0 items-center gap-4 xl:gap-6">
          <Logo invert className="h-[18px] shrink-0 lg:h-5" />
          <nav className="hidden min-w-0 items-center gap-x-4 xl:flex 2xl:gap-x-5" aria-label={tr("Primary navigation")}>
            <NavLink to="/products">{t("nav.products")}</NavLink>
            <NavLink to="/services">{t("nav.solutions")}</NavLink>
            <NavLink to="/platform">{tr("How it works")}</NavLink>
            <NavLink to="/pricing">{t("nav.pricing")}</NavLink>
            <NavLink to="/help">{tr("Help")}</NavLink>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
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
              <Button asChild className="h-9 rounded-full px-3 text-xs lg:px-4">
                <Link to="/signup">
                  {t("cta.start")} <ArrowRight className="size-3.5 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          ) : null}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11 text-ink-foreground xl:hidden"
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
              <SheetHeader className="border-b border-white/10 px-6 py-5 text-start">
                <Logo invert className="h-5" />
                <SheetTitle className="sr-only">{t("cta.menu")}</SheetTitle>
                <SheetDescription className="sr-only">
                  {tr("Primary navigation and account actions")}
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col px-6 pb-8 pt-4" aria-label={tr("Primary navigation")}>
                {[
                  { to: "/products", label: t("nav.products") },
                  { to: "/services", label: t("nav.solutions") },
                  { to: "/platform", label: tr("How it works") },
                  { to: "/pricing", label: t("nav.pricing") },
                  { to: "/help", label: tr("Help") },
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

                <div className="mt-6 border-t border-white/10 pt-6">
                  <HeaderSearch mobile onRequestClose={() => setMobileOpen(false)} />
                </div>
                <LanguageSelect variant="mobile" id="mobile-language" className="mt-6" />
              </nav>
            </SheetContent>
          </Sheet>
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
