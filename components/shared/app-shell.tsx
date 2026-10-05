"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { NAV_BY_ROLE } from "@/lib/nav";
import type { SessionUser } from "@/lib/auth/session";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <img
        src="https://yabatech.edu.ng/img/logss.png"
        alt="Yaba College of Technology"
        className="h-8 w-auto shrink-0 object-contain"
      />
      <span className="max-w-[7rem] border-l-2 border-accent pl-2.5 text-xs font-black uppercase leading-tight tracking-wide">
        Project Supervision
      </span>
    </div>
  );
}

/**
 * Authenticated frame: fixed 240px sidebar (role-aware nav) + sticky top bar
 * with the live notification bell and the account menu. Content is `children`;
 * the shell's own dimensions are fixed so page skeletons never shift it.
 */
export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const nav = NAV_BY_ROLE[user.role];
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r-2 border-border bg-surface md:flex">
        <div className="flex h-14 items-center px-4">
          <Brand />
        </div>
        <SidebarNav items={nav} />
        <div className="mt-auto px-4 py-3 text-2xs text-muted-foreground">
          YABATECH HND · {user.department}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b-2 border-border bg-background px-3 md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-14 items-center px-4">
                <Brand />
              </div>
              <SidebarNav
                items={nav}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <Link href={nav[0]?.href ?? "/"} className="md:hidden">
            <Brand />
          </Link>

          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <UserMenu name={user.name} email={user.email} role={user.role} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
