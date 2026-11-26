"use client";

import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { ArrowRight, LogOut, Search } from "lucide-react";

import { NAV_GROUPS } from "@/lib/nav";
import { useAuth } from "@/lib/auth/auth-context";
import type { Role } from "@/lib/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmptySearch } from "@/components/illustrations";

/** ⌘K palette: jump between this role's pages, or sign out. */
export function CommandMenu({ open, onOpenChange, role }: { open: boolean; onOpenChange: (o: boolean) => void; role: Role }) {
  const router = useRouter();
  const { signOutUser } = useAuth();
  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">Search pages and actions</DialogTitle>
        <Command label="Command menu" className="flex flex-col">
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="h-5 w-5 text-ink-3" />
            <Command.Input autoFocus placeholder="Where do you want to go?" className="h-14 flex-1 bg-transparent outline-none placeholder:text-ink-3" />
          </div>
          <Command.List className="max-h-[60dvh] overflow-y-auto p-2">
            <Command.Empty>
              <div className="py-6 text-center">
                <EmptySearch />
                <p className="mt-2 text-sm text-ink-2">No matching page. Try another word.</p>
              </div>
            </Command.Empty>
            {NAV_GROUPS[role].map((g) => (
              <Command.Group key={g.label} heading={g.label} className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-ink-3">
                {g.items.map((item) => (
                  <Command.Item
                    key={item.href}
                    value={`${item.label} ${g.label}`}
                    onSelect={() => go(item.href)}
                    className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl px-3 text-[15px] data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-800"
                  >
                    <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    {item.label}
                    <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
            <Command.Group heading="Account" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-ink-3">
              <Command.Item
                value="Sign out log out"
                onSelect={async () => {
                  onOpenChange(false);
                  await signOutUser();
                  router.replace("/login");
                }}
                className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl px-3 text-[15px] data-[selected=true]:bg-[#FDECEA] data-[selected=true]:text-stalled"
              >
                <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} /> Sign out
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
