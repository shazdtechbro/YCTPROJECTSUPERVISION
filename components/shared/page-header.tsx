import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface Crumb { label: string; href?: string }

export function PageHeader({
  title, description, crumbs, actions, eyebrow, className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 animate-fade-in md:mb-8", className)}>
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3 flex min-w-0 items-center gap-1 text-sm text-ink-3">
          {crumbs.map((c, i) => (
            <span key={i} className="flex min-w-0 items-center gap-1">
              {i > 0 && <ChevronRight className="h-4 w-4 shrink-0" />}
              {c.href ? (
                <Link href={c.href} className="shrink-0 hover:text-ink">{c.label}</Link>
              ) : (
                <span className="truncate font-medium text-ink">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <div className="mb-3 flex flex-wrap gap-2">{eyebrow}</div>}
          <h1 className="font-display text-[26px] font-extrabold leading-tight tracking-[-0.03em] md:text-[34px]">{title}</h1>
          {description && <p className="mt-1.5 text-[15px] text-ink-2 md:text-base">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
      </div>
    </div>
  );
}
