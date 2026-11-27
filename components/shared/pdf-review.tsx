"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, Download, Highlighter, Minus, Plus } from "lucide-react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { getDb } from "@/lib/firebase";
import { commentConverter } from "@/lib/firestore/converters";
import { paths } from "@/lib/firestore/paths";
import { isPdfMark, PDF_COLOURS, type PdfColour, type PdfMark } from "@/lib/pdf-mark";
import type { CommentDoc } from "@/lib/types";

const colours: Record<PdfColour, string> = { yellow: "#fde047", green: "#86efac", blue: "#93c5fd", pink: "#f9a8d4" };
type Point = { x: number; y: number };
type Version = { id: string; fileName: string; version: number };

function position(event: PointerEvent<HTMLDivElement>): Point {
  const bounds = event.currentTarget.getBoundingClientRect();
  const normalise = (n: number) => Math.max(0, Math.min(1, n));
  return { x: normalise((event.clientX - bounds.left) / bounds.width), y: normalise((event.clientY - bounds.top) / bounds.height) };
}

function rectangle(a: Point, b: Point, page: number, colour: PdfColour): PdfMark {
  return { page, colour, x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) };
}

function markStyle(mark: PdfMark) {
  if (mark.width === 1 && mark.height === 1) {
    return { right: "2%", top: "2%", width: "28px", height: "28px", backgroundColor: colours[mark.colour] };
  }
  return { left: `${mark.x * 100}%`, top: `${mark.y * 100}%`, width: `${mark.width * 100}%`, height: `${mark.height * 100}%`, backgroundColor: colours[mark.colour] + "75" };
}

export function PdfReview({ projectId, submissionId, userId, fileName, version, versions }: {
  projectId: string; submissionId: string; userId: string; fileName: string; version: number; versions: Version[];
}) {
  const url = `/api/projects/${projectId}/submissions/${submissionId}/file`;
  const canvas = useRef<HTMLCanvasElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const [commentsError, setCommentsError] = useState(false);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [drawing, setDrawing] = useState(false);
  const origin = useRef<Point | null>(null);
  const [mark, setMark] = useState<PdfMark | null>(null);
  const [colour, setColour] = useState<PdfColour>("yellow");
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<CommentDoc[]>([]);

  useEffect(() => {
    let cancelled = false;
    let job: ReturnType<typeof import("pdfjs-dist").getDocument> | undefined;
    void (async () => {
      const pdf = await import("pdfjs-dist");
      if (cancelled) return;
      pdf.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      job = pdf.getDocument({ url: url + "?preview=pdf", disableRange: true });
      const loaded = await job.promise;
      if (!cancelled) setDoc(loaded);
    })().catch(() => { if (!cancelled) setPdfError(true); });
    return () => { cancelled = true; void job?.destroy(); };
  }, [url]);

  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    let task: ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]> | undefined;
    void doc.getPage(page).then((sheet) => {
      const surface = canvas.current;
      if (cancelled || !surface) return;
      const viewport = sheet.getViewport({ scale: Math.min(2, 1400 / sheet.getViewport({ scale: 1 }).width) });
      surface.width = viewport.width;
      surface.height = viewport.height;
      task = sheet.render({ canvas: surface, viewport });
      return task.promise;
    }).catch(() => { if (!cancelled) setPdfError(true); });
    return () => { cancelled = true; task?.cancel(); };
  }, [doc, page]);

  useEffect(() => {
    const source = collection(getDb(), paths.comments(projectId, submissionId)).withConverter(commentConverter);
    return onSnapshot(query(source, orderBy("createdAt", "asc")), (snap) => {
      setItems(snap.docs.map(item => item.data()));
      setCommentsError(false);
    }, () => setCommentsError(true));
  }, [projectId, submissionId]);

  function reset() {
    origin.current = null;
    setDrawing(false);
    setMark(null);
    setBody("");
    setEditing(null);
  }

  function movePage(next: number) {
    setPage(next);
    reset();
    setSelected("");
  }

  function openComment(item: CommentDoc) {
    if (isPdfMark(item.mark)) movePage(item.mark.page);
    setSelected(item.id);
  }

  function beginEdit(item: CommentDoc) {
    const existing = item.mark;
    if (!isPdfMark(existing)) return;
    openComment(item);
    setMark(existing);
    setEditing(item.id);
    setColour(existing.colour);
    setBody(item.body);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim() || busy || !mark || !isPdfMark(mark)) return;
    setBusy(true);
    try {
      if (editing) await api.editPdfComment(projectId, submissionId, editing, body.trim(), colour);
      else await api.postComment(projectId, submissionId, body.trim(), { ...mark, colour });
      toast.success(editing ? "Highlight updated" : "Highlight and comment added");
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the comment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header>
        <h1 className="break-words text-2xl font-bold sm:text-3xl">Review PDF</h1>
        <p className="mt-1 break-all text-sm text-muted-foreground">{fileName} · Version {version}</p>
      </header>
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
        <div className="min-w-0 space-y-1">
          <Label htmlFor="pdf-version">Version history</Label>
          <select id="pdf-version" value={submissionId} onChange={(event) => {
            const next = versions.find(item => item.id === event.target.value);
            if (!next) return;
            const target = /\.pdf$/i.test(next.fileName)
              ? `/documents/${projectId}/${next.id}`
              : `/api/projects/${projectId}/submissions/${next.id}/file?download=1`;
            window.location.assign(target);
          }} className="block max-w-full rounded-md border bg-background px-2 py-2">
            {versions.map(item => <option key={item.id} value={item.id}>Version {item.version} · {item.fileName}</option>)}
          </select>
        </div>
        <Button asChild variant="outline"><a href={url + "?download=1"}><Download /> Download original PDF</a></Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-label="PDF viewer" className="min-w-0 rounded-lg border bg-card">
          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            <Button variant="outline" size="sm" aria-label="Previous page" disabled={page <= 1} onClick={() => movePage(page - 1)}><ChevronLeft /></Button>
            <span className="text-sm">Page {page} of {doc?.numPages ?? "…"}</span>
            <Button variant="outline" size="sm" aria-label="Next page" disabled={!doc || page >= doc.numPages} onClick={() => movePage(page + 1)}><ChevronRight /></Button>
            <Button variant="outline" size="sm" aria-label="Zoom out" disabled={zoom <= 75} onClick={() => setZoom(zoom - 25)}><Minus /></Button>
            <Button variant="outline" size="sm" aria-label="Zoom in" disabled={zoom >= 200} onClick={() => setZoom(zoom + 25)}><Plus /></Button>
            <Button size="sm" disabled={!doc || pdfError} aria-pressed={drawing} onClick={() => { reset(); setDrawing(!drawing); }}><Highlighter /> {drawing ? "Cancel selection" : "Highlight area"}</Button>
            <Button variant="outline" size="sm" disabled={!doc || pdfError} onClick={() => { reset(); setMark({ page, x: 0, y: 0, width: 1, height: 1, colour }); }}>Comment on page</Button>
          </div>
          {drawing && <p role="status" className="border-b p-3 text-sm">Drag across the section you want to highlight, then write your comment.</p>}
          {pdfError ? <p role="alert" className="p-4">The PDF could not be displayed. Try reloading this page or download the original.</p> : !doc && <p role="status" className="p-4">Loading PDF…</p>}
          <div className="overflow-auto bg-cream-2 p-2">
            <div className="relative mx-auto bg-white" style={{ width: `${zoom}%`, touchAction: drawing ? "none" : undefined, cursor: drawing ? "crosshair" : undefined }}
              onPointerDown={(event) => {
                if (!drawing) return;
                const point = position(event);
                origin.current = point;
                event.currentTarget.setPointerCapture(event.pointerId);
                setMark(rectangle(point, point, page, colour));
              }}
              onPointerMove={(event) => {
                if (origin.current) setMark(rectangle(origin.current, position(event), page, colour));
              }}
              onPointerCancel={() => reset()}
              onPointerUp={(event) => {
                if (!origin.current) return;
                const next = rectangle(origin.current, position(event), page, colour);
                origin.current = null;
                setMark(isPdfMark(next) ? next : null);
                setDrawing(false);
              }}>
              <canvas ref={canvas} className="block h-auto w-full" aria-label={`PDF page ${page}`} />
              {items.map(item => isPdfMark(item.mark) && item.mark.page === page && (
                <button key={item.id} type="button" aria-label={`Comment by ${item.authorName || "project member"}`} title={item.body} onClick={() => openComment(item)}
                  className={`absolute border border-black/20 ${selected === item.id ? "ring-2 ring-black" : ""}`}
                  style={{ ...markStyle(item.mark), pointerEvents: drawing ? "none" : undefined }} />
              ))}
              {mark && mark.page === page && <div aria-hidden className="pointer-events-none absolute border-2 border-black/60" style={markStyle({ ...mark, colour })} />}
            </div>
          </div>
        </section>
        <aside className="min-w-0 space-y-4 rounded-lg border bg-card p-4" aria-label="PDF comments">
          <h2 className="font-semibold">Comments on version {version}</h2>
          {commentsError && <p role="alert" className="text-sm">Comments could not load. Reload the page to try again.</p>}
          {mark && !drawing && (
            <form className="space-y-2 rounded-md border p-3" onSubmit={save}>
              <Label htmlFor="mark-colour">Highlight colour</Label>
              <select id="mark-colour" value={colour} className="block w-full rounded border bg-background px-2 py-2" onChange={(event) => setColour(event.target.value as PdfColour)}>
                {PDF_COLOURS.map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
              </select>
              <Label htmlFor="pdf-note">Comment on page {mark.page}</Label>
              <Textarea id="pdf-note" value={body} maxLength={5000} rows={3} onChange={(event) => setBody(event.target.value)} />
              <div className="flex flex-wrap gap-2"><Button loading={busy} disabled={!body.trim() || busy}>{editing ? "Save changes" : "Post comment"}</Button><Button type="button" variant="outline" disabled={busy} onClick={reset}>Cancel</Button></div>
            </form>
          )}
          {items.length === 0 && !commentsError && <p className="text-sm text-muted-foreground">No comments yet. Choose Highlight area or Comment on page to add one.</p>}
          <ul className="space-y-3">
            {items.map(item => (
              <li key={item.id} className={`rounded-md border p-3 text-sm ${selected === item.id ? "ring-2 ring-primary" : ""}`}>
                <p className="font-medium">{item.authorName || "Project member"}</p>
                <p className="my-2 whitespace-pre-wrap break-words">{item.body}</p>
                {isPdfMark(item.mark) && <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => openComment(item)}>Go to page {item.mark.page}</Button>{item.authorId === userId && <Button size="sm" variant="ghost" onClick={() => beginEdit(item)}>Edit comment</Button>}</div>}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
