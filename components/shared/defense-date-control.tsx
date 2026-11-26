"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export function DefenseDateControl({
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
        defenseDate: value || null,
      });
      toast.success("Defence date saved", {
        description: res.milestone.reason,
      });
      onSaved?.();
    } catch (err) {
      toast.error("Couldn't save", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[20px] border border-line bg-white p-4 shadow-card md:p-5">
      <Label htmlFor="defense" className="font-display text-lg font-bold">
        Defence date
      </Label>
      <p className="mt-1 text-sm text-ink-2">Students see this on their dashboard straight away.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          id="defense"
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="sm:max-w-[220px]"
        />
        <Button onClick={save} loading={busy} disabled={!dirty}>
          Save
        </Button>
      </div>
    </div>
  );
}
