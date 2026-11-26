"use client";

import { useCallback, useRef, useState } from "react";
import { File as FileIcon, UploadCloud, X } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  ACCEPT_ATTR,
  validateSubmissionFile,
} from "@/lib/storage/submissions";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Drag-and-drop file zone with a live progress bar. Controlled: the parent owns
 * the selected `file` and drives `progress` (0-100) / `busy` while uploading.
 */
export function FileUpload({
  file,
  progress,
  busy,
  onSelect,
  onClear,
  disabled,
}: {
  file: File | null;
  progress: number;
  busy: boolean;
  onSelect: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = useCallback(
    (f: File | undefined) => {
      if (!f) return;
      const invalid = validateSubmissionFile(f);
      if (invalid) {
        setError(invalid);
        return;
      }
      setError(null);
      onSelect(f);
    },
    [onSelect]
  );

  if (file) {
    return (
      <div className="rounded-2xl border border-line bg-cream p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-muted-foreground">
            <FileIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-2xs text-muted-foreground">
              {formatFileSize(file.size)}
              {busy && ` · ${progress}%`}
            </p>
          </div>
          {!busy && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClear}
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {busy && <Progress value={progress} className="mt-3" />}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-cream px-6 py-8 text-center transition-colors",
          dragging
            ? "border-brand-600 bg-brand-50"
            : "hover:border-foreground/25 hover:bg-secondary/40",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sun-400 text-ink"><UploadCloud className="h-6 w-6" /></span>
        <p className="mt-2 text-sm font-medium">
          Tap to choose a file or drop it here
        </p>
        <p className="text-2xs text-muted-foreground">
          PDF, Word, PNG or JPEG · up to 25 MB
        </p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />
      {error && (
        <p className="mt-1.5 text-2xs text-[hsl(var(--status-stalled))]">
          {error}
        </p>
      )}
    </div>
  );
}
