"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export function ProposalDateControl({
  projectId,
  current,
  onSaved,
}: {
  projectId: string;
  current: string | null;
  onSaved?: () => void;
}) {
  const [value, setValue] = useState(current ?? "");
  const [busy, setBusy] = useState(false);
  const dirty = value !== (current ?? "");

  async function save() {
    setBusy(true);
    try {
      const res = await api.updateProject(projectId, {
        proposalDate: value || null,
      });
      toast.success("Proposal date saved", {
        description: `Milestone: ${res.milestone.reason}`,
      });
      onSaved?.();
    } catch (err) {
      toast.error("Couldn't save", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md border bg-surface/50 p-3">
      <Label htmlFor="proposal-date" className="text-2xs uppercase tracking-wide text-muted-foreground">
        Set proposal date
      </Label>
      <div className="mt-1.5 flex gap-2">
        <Input
          id="proposal-date"
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="max-w-[200px]"
        />
        <Button size="sm" onClick={save} loading={busy} disabled={!dirty}>
          Save
        </Button>
      </div>
    </div>
  );
}
