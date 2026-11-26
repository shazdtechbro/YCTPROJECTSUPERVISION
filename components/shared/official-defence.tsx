"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAsyncData } from "@/hooks/use-async-data";
import { defenceInstant, expectedChapterProgress, type DefenceSchedule } from "@/lib/defence-schedule";

const dateFormat = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});

export function OfficialDefence({
  canEdit = false,
  startedAt,
  actualProgress,
}: {
  canEdit?: boolean;
  startedAt?: number;
  actualProgress?: number;
}) {
  const schedule = useAsyncData<DefenceSchedule>(async () => {
    const response = await fetch("/api/department/defence", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load the official defence date.");
    return (await response.json()).schedule;
  }, []);
  const [draft, setDraft] = useState<DefenceSchedule | null>(null);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const retry = schedule.retry;
  useEffect(() => {
    const refresh = () => { setNow(new Date()); retry(); };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [retry]);

  const input = draft ?? schedule.data ?? { date: "", time: "" };
  const scheduled = schedule.data && defenceInstant(schedule.data);
  const remaining = scheduled ? scheduled.getTime() - now.getTime() : 0;
  const expected = scheduled && startedAt !== undefined
    ? expectedChapterProgress(new Date(startedAt), scheduled, now)
    : null;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/department/defence", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Could not save the defence date.");
      toast.success("Official defence saved for your department");
      setDraft(null);
      retry();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the defence date.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Official defence</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        {schedule.phase === "loading" && !scheduled && <p role="status">Loading the official defence date…</p>}
        {schedule.error && <p role="alert">{schedule.error.message} <button type="button" className="underline" onClick={retry}>Try again</button></p>}
        {schedule.phase === "empty" && <p>The HOD has not set the official defence date yet.</p>}
        {scheduled && (
          <>
            <p className="font-semibold"><time dateTime={scheduled.toISOString()}>{dateFormat.format(scheduled)} WAT</time></p>
            {!canEdit && <p>{remaining <= 0 ? "The scheduled defence time has passed." : remaining <= 86400000 ? "Less than 24 hours until defence." : `${Math.ceil(remaining / 86400000)} days until defence.`}</p>}
            {!canEdit && expected !== null && actualProgress !== undefined && (
              <p>Chapter progress is <strong>{actualProgress}%</strong>. The suggested target by today is <strong>{expected}%</strong>, based on when you started and the official defence date.</p>
            )}
          </>
        )}
        {canEdit && (
          <form onSubmit={save} className="space-y-3">
            <p>Set one official date and time for everyone in your department. Students and supervisors will see it on their dashboards.</p>
            <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
              <div className="space-y-1"><Label htmlFor="official-defence-date">Defence date</Label><Input id="official-defence-date" type="date" required value={input.date} onChange={(event) => setDraft({ ...input, date: event.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="official-defence-time">Defence time (WAT)</Label><Input id="official-defence-time" type="time" required value={input.time} onChange={(event) => setDraft({ ...input, time: event.target.value })} /></div>
            </div>
            <Button loading={saving} disabled={saving || schedule.phase === "loading"}>Save official defence</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
