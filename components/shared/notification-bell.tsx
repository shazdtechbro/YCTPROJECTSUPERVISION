"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  FileText,
  MessageSquare,
  Ticket as TicketIcon,
  CheckCircle2,
  FolderPlus,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
        unread.map((i) => i.id),
      );
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[22rem] max-w-[calc(100vw-1rem)] p-0"
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Notifications</span>
          {unread.length > 0 && (
            <span className="text-2xs text-muted-foreground">
              {unread.length} new
            </span>
          )}
        </div>
        {items.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <Bell className="mx-auto h-5 w-5 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Nothing new right now</p>
            <p className="text-xs text-muted-foreground">
              Tickets, submissions and comments on your projects land here.
            </p>
          </div>
        ) : (
          <ul className="max-h-[24rem] divide-y overflow-y-auto scrollbar-thin">
            {items.map((n) => {
              const Icon = ICON[n.kind] ?? Bell;
              return (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex gap-2.5 px-3 py-2.5 text-sm hover:bg-accent",
                      !n.read && "bg-primary/[0.03]",
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{n.title}</span>
                      <span className="text-2xs text-muted-foreground">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </span>
                    {!n.read && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
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
