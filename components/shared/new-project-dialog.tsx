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
  const [studentEmail, setStudentEmail] = useState("");
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [defenseDate, setDefenseDate] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit =
    /\S+@\S+\.\S+/.test(studentEmail) &&
    title.trim().length >= 4 &&
    abstract.trim().length >= 20 &&
    !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      await api.createProject({
        studentEmail: studentEmail.trim(),
        title: title.trim(),
        abstract: abstract.trim(),
        defenseDate: defenseDate || null,
      });
      toast.success("Project created", {
        description: `${studentEmail.trim()} has been notified.`,
      });
      setStudentEmail("");
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
        <Button>
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
            <Label htmlFor="p-email">Student email</Label>
            <Input
              id="p-email"
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="student@yabatech.edu.ng"
              autoFocus
            />
            <p className="text-xs text-ink-3">
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
          <div className="grid grid-cols-2 gap-2 pt-1 sm:flex sm:justify-end">
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
