import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { EmptyNoSubmissions } from "@/components/illustrations";

/** Designed empty state: illustration, a human title, and what happens next. */
export function EmptyState({
  icon: Icon, art, title, description, action, className,
}: {
  icon?: LucideIcon;
  art?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-[220px] flex-col items-center justify-center rounded-[20px] border border-dashed border-line bg-card/60 p-6 text-center md:p-10", className)}>
      {art ?? (Icon ? (
        <span className="mb-1 grid h-14 w-14 place-items-center rounded-2xl bg-sun-100 text-ink"><Icon className="h-6 w-6" strokeWidth={1.75} /></span>
      ) : <EmptyNoSubmissions />)}
      <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-2">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
