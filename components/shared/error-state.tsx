"use client";

import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "We couldn't load this",
  description = "Something went wrong. Check your connection and try again.",
  onRetry, className,
}: { title?: string; description?: string; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn("flex min-h-[220px] flex-col items-center justify-center rounded-[20px] border border-[#F6CFCB] bg-[#FDECEA]/60 p-8 text-center", className)}>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-stalled text-white"><AlertTriangle className="h-5 w-5" /></span>
      <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-2">{description}</p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}><RotateCw /> Try again</Button>
      )}
    </div>
  );
}
