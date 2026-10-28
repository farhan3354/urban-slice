"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Pizza,
  FolderTree,
  Tags,
  Settings,
  History,
  LogOut,
  Menu as MenuIcon,
  ExternalLink,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminUser } from "./types";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/menu", label: "Menu", icon: Pizza },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/deals", label: "Deals", icon: Tags },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/audit", label: "Audit Log", icon: History },
] as const;

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Main navigation">
      {NAV.map((item) => {
        const isExact = "exact" in item && Boolean((item as any).exact);
        const active = isExact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              active &&
                "bg-sidebar-accent text-sidebar-foreground ring-1 ring-inset ring-sidebar-border",
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                active
                  ? "text-primary"
                  : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground",
              )}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function BrandHeader() {
  return (
    <Link
      href="/admin"
      className="flex items-center gap-2.5 px-3 py-4 text-sidebar-foreground"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Pizza className="size-5" />
      </span>
      <div className="leading-tight">
        <p className="font-display text-sm font-semibold">Urban Slice</p>
        <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
          Admin
        </p>
      </div>
    </Link>
  );
}

function UserCard({
  admin,
  onLogout,
}: {
  admin: AdminUser | null;
  onLogout: () => void;
}) {
  return (
    <div className="mt-auto border-t border-sidebar-border p-3">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-foreground">
          {(admin?.name || "A").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {admin?.name || "Loading…"}
          </p>
          <p className="truncate text-xs text-sidebar-foreground/60">
            {admin?.email || "—"}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onLogout}
          aria-label="Logout"
          title="Logout"
          className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [admin, setAdmin] = React.useState<AdminUser | null>(null);
  const [authed, setAuthed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/auth/me", { cache: "no-store" });
        if (cancelled) return;
        if (res.status === 401) {
          const next = encodeURIComponent(pathname || "/admin");
          window.location.replace(`/admin/login?next=${next}`);
          return;
        }
        const data = await res.json();
        if (!data?.admin) {
          const next = encodeURIComponent(pathname || "/admin");
          window.location.replace(`/admin/login?next=${next}`);
          return;
        }
        setAdmin(data.admin);
        setAuthed(true);
      } catch {
        if (!cancelled) {
          const next = encodeURIComponent(pathname || "/admin");
          window.location.replace(`/admin/login?next=${next}`);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    toast.success("Signed out");
    window.location.href = "/admin/login";
  };

  return (
    <div className="admin-shell bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-foreground",
          "md:flex",
        )}
      >
        <BrandHeader />
        <div className="flex-1 overflow-y-auto px-3 py-2 thin-scroll">
          <NavList pathname={pathname} />
        </div>
        <UserCard admin={authed ? admin : null} onLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex items-center justify-between">
            <BrandHeader />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 thin-scroll">
            <NavList
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
          <UserCard admin={authed ? admin : null} onLogout={handleLogout} />
        </SheetContent>
      </Sheet>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-card px-3 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <MenuIcon className="size-5" />
        </Button>
        <span className="font-display text-sm font-semibold">Urban Slice Admin</span>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          View site <ExternalLink className="size-3" />
        </a>
      </header>

      {/* Content area */}
      <div className="flex min-h-screen flex-col md:pl-64">
        {/* Desktop top bar */}
        <header className="sticky top-0 z-20 hidden h-14 items-center justify-between gap-2 border-b border-border bg-card/80 px-6 backdrop-blur md:flex">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Admin Console</span>
            <span aria-hidden>·</span>
            <span className="truncate">{pathname}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
            >
              View site <ExternalLink className="size-3" />
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground"
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </header>

        <main className="admin-main flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {authed ? (
            children
          ) : (
            <div className="space-y-4 p-6">
              <Skeleton className="h-8 w-48" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
              <Skeleton className="h-72 w-full" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
