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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type { TicketPriority } from "@/lib/types";

export function NewTicketDialog({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  const titleError =
    title.length > 0 && title.trim().length < 4 ? "At least 4 characters" : null;
  const bodyError =
    body.length > 0 && body.trim().length < 10 ? "At least 10 characters" : null;
  const canSubmit =
    title.trim().length >= 4 && body.trim().length >= 10 && !busy;

  function reset() {
    setTitle("");
    setBody("");
    setPriority("medium");
    setDueDate("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      await api.createTicket(projectId, {
        title: title.trim(),
        body: body.trim(),
        priority,
        dueDate: dueDate || null,
      });
      toast.success("Task added");
      reset();
      setOpen(false);
      onCreated?.();
    } catch (err) {
      toast.error("Couldn't add task", {
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
          Add task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add task</DialogTitle>
          <p className="text-sm text-muted-foreground">Describe work the project team needs to do. Add a due date if there is one.</p>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Task name</Label>
            <Input
              id="t-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Example: Update Chapter Two"
              autoFocus
            />
            {titleError && (
              <p className="text-xs text-stalled">
                {titleError}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-body">What needs to be done?</Label>
            <Textarea
              id="t-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Example: Add three recent studies to the literature review."
            />
            {bodyError && (
              <p className="text-xs text-stalled">
                {bodyError}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TicketPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-due">Due date</Label>
              <Input
                id="t-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 sm:flex sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={busy} disabled={!canSubmit}>
              Save task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
