"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, FileText, MessageSquare, Ticket as TicketIcon, CheckCircle2, FolderPlus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyNoNotifications } from "@/components/illustrations";
import {
  subscribeNotifications,
  markNotificationsRead,
} from "@/lib/firestore/notifications";
import { useAuth } from "@/lib/auth/auth-context";
import { formatRelativeTime } from "@/lib/format";
import type { NotificationDoc, NotificationKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICON: Record<NotificationKind, React.ElementType> = {
  ticket: TicketIcon,
  submission: FileText,
  comment: MessageSquare,
  review: CheckCircle2,
  project: FolderPlus,
};

export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationDoc[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeNotifications(user.uid, {
      next: setItems,
      error: () => setItems([]),
    });
    return () => unsub();
  }, [user]);

  const unread = useMemo(() => items.filter((i) => !i.read), [items]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && unread.length && user) {
      void markNotificationsRead(
        user.uid,
        unread.map((i) => i.id)
      );
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative grid h-11 w-11 place-items-center rounded-xl border border-line bg-card hover:border-ink-3 md:h-10 md:w-10"
          aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ""}`}
        >
          <Bell className="h-5 w-5" strokeWidth={1.75} />
          {unread.length > 0 && (
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-stalled ring-2 ring-white" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="font-display text-base font-bold">Notifications</span>
          {unread.length > 0 && (
            <span className="chip bg-sun-100 text-ink">
              {unread.length} new
            </span>
          )}
        </div>
        {items.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <EmptyNoNotifications />
            <p className="mt-2 font-semibold">You are all caught up</p>
            <p className="text-sm text-ink-3">
              Tickets, submissions and comments on your projects land here.
            </p>
          </div>
        ) : (
          <ul className="max-h-[24rem] divide-y divide-line overflow-y-auto scrollbar-thin">
            {items.map((n) => {
              const Icon = ICON[n.kind] ?? Bell;
              return (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex min-h-[56px] gap-3 px-4 py-3 text-sm hover:bg-cream",
                      !n.read && "bg-brand-50/60"
                    )}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cream-2"><Icon className="h-4 w-4 text-ink-2" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{n.title}</span>
                      <span className="text-xs text-ink-3">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </span>
                    {!n.read && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stalled" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
