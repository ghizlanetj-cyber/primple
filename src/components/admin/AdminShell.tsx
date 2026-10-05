import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Boxes,
  CreditCard,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RefreshCw,
  ShieldCheck,
  Users,
  FileText,
} from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { can, type Capability } from "@/lib/admin-metrics";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "./shared";

export type AdminTab = "overview" | "orders" | "customers" | "inbox" | "quotes" | "catalog" | "reports" | "team" | "crm";
export const NAV: { id: AdminTab; label: string; icon: typeof Inbox; cap: Capability }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard, cap: "read_ops" },
  { id: "orders", label: "Commandes", icon: Package, cap: "read_ops" },
  { id: "customers", label: "Clients", icon: Users, cap: "read_ops" },
  { id: "inbox", label: "Messages", icon: Inbox, cap: "read_ops" },
  { id: "quotes", label: "Devis", icon: FileText, cap: "read_ops" },
  { id: "catalog", label: "Catalogue", icon: Boxes, cap: "read_ops" },
  { id: "reports", label: "Rapports", icon: BarChart3, cap: "read_ops" },
  { id: "team", label: "Équipe", icon: ShieldCheck, cap: "manage_team" },
  { id: "crm", label: "CRM Zoho", icon: RefreshCw, cap: "crm_actions" },
];

export function AdminShell({
  role,
  email,
  tab,
  onTab,
  badges,
  children,
}: {
  role: string;
  email: string | null;
  tab: AdminTab;
  onTab: (t: AdminTab) => void;
  badges?: Partial<Record<AdminTab, number>>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const items = NAV.filter((n) => can(role, n.cap));
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/login", replace: true });
  };
  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Navigation administration">
      {items.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => {
            onTab(n.id);
            setOpen(false);
          }}
          aria-current={tab === n.id ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            tab === n.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <n.icon className="size-4" aria-hidden />
          <span className="flex-1">{n.label}</span>
          {badges?.[n.id] ? (
            <span className={cn("rounded-full px-1.5 text-xs", tab === n.id ? "bg-primary-foreground/20" : "bg-primary/15 text-foreground")}>{badges[n.id]}</span>
          ) : null}
        </button>
      ))}
      {can(role, "payments") ? (
        <Link to="/admin/payments" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
          <CreditCard className="size-4" aria-hidden /> Paiements
        </Link>
      ) : null}
    </nav>
  );
  const footer = (
    <div className="space-y-2 border-t pt-4 text-sm">
      <p className="truncate font-medium" title={email ?? undefined}>{email ?? "Membre"}</p>
      <p className="text-xs text-muted-foreground">{ROLE_LABELS[role] ?? role}</p>
      <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
        <ExternalLink className="size-3.5" aria-hidden /> Voir le site public
      </Link>
      <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
        <LogOut className="size-4" aria-hidden /> Se déconnecter
      </Button>
    </div>
  );
  const current = NAV.find((n) => n.id === tab);
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-6 border-r bg-card p-4 lg:flex">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Équipe</span>
        </div>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        {footer}
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-72 flex-col gap-6 p-4">
          <SheetTitle className="sr-only">Menu administration</SheetTitle>
          <Logo />
          <div className="flex-1 overflow-y-auto">{nav}</div>
          {footer}
        </SheetContent>
      </Sheet>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
            <Menu className="size-5" />
          </Button>
          <h1 className="font-heading text-lg font-semibold">{current?.label ?? "Administration"}</h1>
          <span className="ml-auto hidden text-xs text-muted-foreground sm:block">{email}</span>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
