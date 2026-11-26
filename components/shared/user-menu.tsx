"use client";

import { useState } from "react";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({
  name,
  email,
  role,
}: {
  name: string | null;
  email: string | null;
  role: Role;
}) {
  const { user, signOutUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await signOutUser();
      // A full navigation drops cached authenticated Next.js page payloads.
      window.location.replace("/");
    } catch (err) {
      toast.error("Couldn't sign out", { description: (err as Error).message });
      setBusy(false);
    }
  }

  const themes: [string, React.ElementType][] = [
    ["light", Sun],
    ["dark", Moon],
    ["system", Monitor],
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={user?.photoURL ?? undefined} alt="" />
            <AvatarFallback className="text-2xs font-medium">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="truncate text-sm font-medium">{name ?? "Account"}</span>
          <span className="truncate text-xs text-muted-foreground">{email}</span>
          <span className="mt-1 w-fit rounded bg-secondary px-1.5 py-0.5 text-2xs font-medium text-muted-foreground">
            {ROLE_LABELS[role]}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex items-center gap-1 p-1">
          {themes.map(([t, Icon]) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                "flex flex-1 items-center justify-center rounded-sm py-1.5 text-muted-foreground hover:bg-accent",
                theme === t && "bg-secondary text-foreground"
              )}
              aria-label={t}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={busy}
          onSelect={(e) => {
            e.preventDefault();
            void signOut();
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
