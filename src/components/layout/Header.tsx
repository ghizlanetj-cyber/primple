import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LogOut, Menu, ShoppingBag } from "lucide-react";

import { LanguageSelect } from "@/components/layout/LanguageSelect";
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
        "fixed left-1/2 top-3 z-50 w-[calc(100%-2rem)] max-w-[1390px] -translate-x-1/2 rounded-full border border-white/[0.16] shadow-[0_10px_32px_rgba(0,0,0,0.10)] backdrop-blur-[20px] backdrop-saturate-[1.15] transition-colors duration-500 sm:w-[calc(100%-3rem)] lg:top-4 lg:w-[calc(100%-96px)]",
        scrolled ? "bg-[rgba(35,33,42,0.52)]" : "bg-[rgba(35,33,42,0.38)]",
      )}
    >
      <div className="relative grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:flex sm:justify-between sm:px-6 md:h-16 lg:h-[68px] lg:px-8">
        <div className="flex min-w-0 items-center gap-5 xl:gap-7">
          <Logo invert className="h-5 shrink-0 md:h-[22px] lg:w-[102px]" />
          <nav className="hidden items-center gap-x-6 xl:flex xl:gap-x-7">
            <NavLink to="/services">{t("nav.solutions")}</NavLink>
            <NavLink to="/products">{t("nav.products")}</NavLink>

            <NavLink to="/about">{t("nav.why")}</NavLink>
            <NavLink to="/platform">{t("nav.work")}</NavLink>
            <NavLink to="/contact">{t("nav.contact")}</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSelect variant="header" id="header-language" className="hidden sm:flex" />
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="relative size-8 text-ink-muted hover:text-ink-foreground"
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
                className="hidden text-ink-muted hover:text-ink-foreground xl:inline-flex"
              >
                <Link to="/dashboard">{t("nav.dashboard")}</Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={tr("Log out")}
                title={tr("Log out")}
                className="hidden size-8 rounded-full md:inline-flex"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="size-4 rtl:rotate-180" />
              </Button>
            </>
          ) : !loading ? (
            <div className="hidden items-center gap-1.5 md:flex">
              <Button variant="ghost" asChild className="text-ink-muted hover:text-ink-foreground">
                <Link to="/login">{t("nav.login")}</Link>
              </Button>
              <Button asChild className="h-9 rounded-full px-4 text-sm lg:px-5">
                <Link to="/signup">
                  {tr("Create account")} <ArrowRight className="size-3.5 rtl:rotate-180" />
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
                  { to: "/services", label: t("nav.solutions") },
                  { to: "/products", label: t("nav.products") },
                  { to: "/about", label: t("nav.why") },
                  { to: "/platform", label: t("nav.work") },
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
