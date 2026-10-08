"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
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
import { FileUpload } from "./file-upload";
import { api } from "@/lib/api";
import { uploadSubmissionFile } from "@/lib/storage/submissions";
import type { SubmissionKind } from "@/lib/types";

const KINDS: { value: SubmissionKind; label: string }[] = [
  { value: "proposal", label: "Proposal" },
  { value: "chapter", label: "Chapter draft" },
  { value: "revision", label: "Revision" },
  { value: "final", label: "Final" },
  { value: "other", label: "Other" },
];

export function UploadSubmissionDialog({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<SubmissionKind>("chapter");
  const [chapterNumber, setChapterNumber] = useState("1");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  const canSubmit = title.trim().length >= 3 && !!file && !busy;

  function reset() {
    setTitle("");
    setKind("chapter");
    setChapterNumber("1");
    setFile(null);
    setProgress(0);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !file) return;
    setBusy(true);
    setProgress(0);
    try {
      // 1. reserve an id so the storage path matches the doc
      const submissionId = crypto.randomUUID();
      // 2. upload straight to Supabase with progress
      const uploaded = await uploadSubmissionFile({
        projectId,
        submissionId,
        file,
        onProgress: setProgress,
      });
      // 3. record the submission (batches stats + milestone server-side)
      await api.createSubmission(projectId, {
        title: title.trim(),
        kind,
        storagePath: uploaded.storagePath,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
        ...(kind === "chapter" || kind === "revision" ? { chapterNumber: Number(chapterNumber) } : {}),
      });
      toast.success("Submission uploaded");
      reset();
      setOpen(false);
      onCreated?.();
    } catch (err) {
      toast.error("Upload failed", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) setOpen(v);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload submission</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="s-title">Title</Label>
            <Input
              id="s-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 3 — Methodology"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={kind}
              onValueChange={(v) => setKind(v as SubmissionKind)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(kind === "chapter" || kind === "revision") && <div className="space-y-1.5">
            <Label htmlFor="s-chapter">Chapter stage</Label>
            <Select value={chapterNumber} onValueChange={setChapterNumber}>
              <SelectTrigger id="s-chapter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Chapter One: Introduction</SelectItem>
                <SelectItem value="2">Chapter Two: Literature Review</SelectItem>
                <SelectItem value="3">Chapter Three: Methodology</SelectItem>
                <SelectItem value="4">Chapter Four: System Design and Implementation</SelectItem>
                <SelectItem value="5">Chapter Five: Summary and Conclusion</SelectItem>
              </SelectContent>
            </Select>
          </div>}
          <div className="space-y-1.5">
            <Label>File</Label>
            <FileUpload
              file={file}
              progress={progress}
              busy={busy}
              onSelect={setFile}
              onClear={() => setFile(null)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={busy} disabled={!canSubmit}>
              {busy ? `Uploading ${progress}%` : "Upload submission"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
