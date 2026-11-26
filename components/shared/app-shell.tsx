"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Search, X } from "lucide-react";
import { toast } from "sonner";

import { NAV_BY_ROLE, NAV_GROUPS, type NavItem } from "@/lib/nav";
import type { SessionUser } from "@/lib/auth/session";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Initials } from "@/components/app/stats";
import { PageTransition } from "@/components/app/motion";
import { Crest } from "@/components/app/crest";
import { NotificationBell } from "./notification-bell";
import { CommandMenu } from "./command-menu";


const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

function useSignOut() {
  const { signOutUser } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return {
    busy,
    signOut: async () => {
      setBusy(true);
      try {
        await signOutUser();
        router.replace("/login");
      } catch (err) {
        toast.error("Couldn't sign out", { description: (err as Error).message });
        setBusy(false);
      }
    },
  };
}

function SidebarBody({ user, onNavigate }: { user: SessionUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { signOut, busy } = useSignOut();
  const name = user.name ?? user.email ?? "Account";
  return (
    <div className="flex h-full flex-col p-4">
      <Link href={NAV_BY_ROLE[user.role][0].href} onClick={onNavigate} className="px-2"><Crest /></Link>

      <div className="mt-5 rounded-xl border border-line bg-white px-3 py-2.5">
        <span className="block text-xs text-ink-3">Department</span>
        <span className="block truncate text-[13px] font-semibold">{user.department} · HND</span>
      </div>

      <nav aria-label="Main" className="mt-5 flex-1 space-y-5 overflow-y-auto">
        {NAV_GROUPS[user.role].map((g) => (
          <div key={g.label}>
            <div className="mb-1.5 px-3 text-xs font-semibold text-ink-3">{g.label}</div>
            <div className="space-y-0.5">
              {g.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-colors",
                      active ? "bg-brand-900 text-white" : "text-ink-2 hover:bg-cream-2 hover:text-ink"
                    )}
                  >
                    <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-sun-400")} strokeWidth={1.75} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative overflow-hidden rounded-2xl bg-brand-900 p-4 text-white">
        <span aria-hidden className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-sun-400/20" />
        <div className="text-xs font-semibold text-sun-300">Defence season</div>
        <div className="mt-1 text-[13px] text-white/80">
          {user.role === "student" ? "Keep chapters moving so final approval is never a rush." : "Review early so every student is ready on the day."}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl p-2">
        <Initials name={name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold">{name}</span>
          <span className="block text-xs text-ink-3">{ROLE_LABELS[user.role]}</span>
        </span>
        <button
          onClick={() => void signOut()}
          disabled={busy}
          aria-label="Sign out"
          className="grid h-10 w-10 place-items-center rounded-xl text-ink-3 hover:bg-cream-2 hover:text-ink disabled:opacity-50"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

function crumbFor(pathname: string, items: NavItem[]) {
  const hit = items.find((i) => isActive(pathname, i.href));
  const isDetail = hit && pathname !== hit.href;
  return { section: hit?.label ?? "Dashboard", href: hit?.href, isDetail };
}

/**
 * Authenticated frame. Desktop: 264px grouped sidebar + sticky top bar.
 * Below 1024px: compact top bar, slide-in drawer and a bottom tab bar with the
 * main destinations (most users are on phones).
 */
export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[user.role];
  const [drawer, setDrawer] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const crumb = crumbFor(pathname, items);
  const tabs = items.slice(0, 4);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-[100dvh]">
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 border-r border-line bg-white/70 backdrop-blur lg:block">
        <SidebarBody user={user} />
      </aside>

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="left" className="w-[288px] max-w-[85vw] bg-cream p-0 [&>button:last-child]:hidden">
          <button onClick={() => setDrawer(false)} aria-label="Close menu" className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-xl hover:bg-cream-2">
            <X className="h-5 w-5" />
          </button>
          <SidebarBody user={user} onNavigate={() => setDrawer(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-cream/85 backdrop-blur-md">
          <div className="flex h-16 items-center gap-2 px-3 sm:px-4 md:px-8">
            <button onClick={() => setDrawer(true)} aria-label="Open menu" className="grid h-11 w-11 place-items-center rounded-xl hover:bg-cream-2 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <Link href={items[0].href} className="lg:hidden" aria-label="Home"><Crest compact /></Link>
            <nav aria-label="Breadcrumb" className="ml-1 hidden min-w-0 items-center gap-1.5 truncate text-sm text-ink-3 sm:flex">
              <span>{ROLE_LABELS[user.role]}</span>
              <span aria-hidden>/</span>
              {crumb.isDetail && crumb.href ? (
                <>
                  <Link href={crumb.href} className="hover:text-ink">{crumb.section}</Link>
                  <span aria-hidden>/</span>
                  <span className="font-semibold text-ink">Details</span>
                </>
              ) : (
                <span className="font-semibold text-ink">{crumb.section}</span>
              )}
            </nav>

            <button
              onClick={() => setCmdOpen(true)}
              className="ml-auto hidden h-10 w-[300px] items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm text-ink-3 hover:border-ink-3 md:flex"
            >
              <Search className="h-4 w-4" /> Search pages and actions
              <kbd className="ml-auto rounded border border-line px-1.5 py-0.5 font-mono text-xs">⌘K</kbd>
            </button>
            <button onClick={() => setCmdOpen(true)} aria-label="Search" className="ml-auto grid h-11 w-11 place-items-center rounded-xl hover:bg-cream-2 md:hidden">
              <Search className="h-5 w-5" />
            </button>
            <NotificationBell />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 pb-28 pt-6 md:px-8 md:pt-8 lg:pb-12">
          <PageTransition k={pathname}>{children}</PageTransition>
        </main>
      </div>

      <nav aria-label="Primary" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur lg:hidden">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((t) => {
            const active = isActive(pathname, t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn("flex min-h-[60px] flex-col items-center justify-center gap-1 text-xs font-semibold", active ? "text-brand-700" : "text-ink-3")}
              >
                <span className={cn("grid h-8 w-12 place-items-center rounded-full transition-colors", active && "bg-brand-50")}>
                  <t.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                {t.short ?? t.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} role={user.role} />
    </div>
  );
}
