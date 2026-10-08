"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

export function NewProjectDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [studentMatricNumber, setStudentMatricNumber] = useState("");
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [defenseDate, setDefenseDate] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit =
    /^[FDP]\/(?:ND|HD)\/\d{2}\/\d{7}$/i.test(studentMatricNumber.trim()) &&
    title.trim().length >= 4 &&
    abstract.trim().length >= 20 &&
    !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      await api.createProject({
        studentMatricNumber: studentMatricNumber.trim().toUpperCase(),
        title: title.trim(),
        abstract: abstract.trim(),
        defenseDate: defenseDate || null,
      });
      toast.success("Project created", {
        description: `${studentMatricNumber.trim().toUpperCase()} has been notified.`,
      });
      setStudentMatricNumber("");
      setTitle("");
      setAbstract("");
      setDefenseDate("");
      setOpen(false);
      onCreated?.();
    } catch (err) {
      toast.error("Couldn't create project", {
        description: (err as Error).message,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="p-matric">Student matriculation number</Label>
            <Input
              id="p-matric"
              type="text"
              value={studentMatricNumber}
              onChange={(e) => setStudentMatricNumber(e.target.value)}
              placeholder="F/HD/24/3211001"
              autoFocus
            />
            <p className="text-2xs text-muted-foreground">
              The student must already have an account in your department.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-title">Project title</Label>
            <Input
              id="p-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-abstract">Abstract</Label>
            <Textarea
              id="p-abstract"
              rows={4}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="A short description of the project scope (20+ characters)."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-defense">Defense date (optional)</Label>
            <Input
              id="p-defense"
              type="date"
              value={defenseDate}
              onChange={(e) => setDefenseDate(e.target.value)}
              className="max-w-[200px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={busy} disabled={!canSubmit}>
              Create project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
