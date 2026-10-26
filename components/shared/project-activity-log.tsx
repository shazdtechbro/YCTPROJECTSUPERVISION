"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
export function ProjectActivityLog({ projectId, refreshKey }: { projectId: string; refreshKey?: unknown }) {
  const [activityError, setActivityError] = useState("");
  const [activityNonce, setActivityNonce] = useState(0);
  const [events, setEvents] = useState<
    {
      id: string;
      title: string;
      actorName: string;
      note: string;
      createdAt: string | null;
    }[]
  >([]);
  useEffect(() => {
    let active = true;
    setActivityError("");
    fetch(`/api/projects/${projectId}/activity`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Could not load activity");
        return data;
      })
      .then((data) => {
        if (active && Array.isArray(data.events)) setEvents(data.events);
      })
      .catch((error) => {
        if (active) setActivityError(error.message);
      });
    return () => {
      active = false;
    };
  }, [projectId, refreshKey, activityNonce]);
  return (      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">Project activity log</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Topic decisions, submissions, reviews and deadline requests.
        </p>
        {activityError && (
          <div role="alert" className="mt-3">
            <p className="text-sm">{activityError}</p>
            <Button
              variant="outline"
              onClick={() => setActivityNonce((n) => n + 1)}
            >
              Retry activity
            </Button>
          </div>
        )}
        {events.length ? (
          <ol className="mt-4 space-y-3">
            {events.map((event) => (
              <li key={event.id} className="border-l-2 border-primary/30 pl-3">
                <p className="text-sm font-medium">{event.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {event.actorName}
                  {event.createdAt
                    ? ` · ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.createdAt))}`
                    : ""}
                </p>
                {event.note && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {event.note}
                  </p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Activity will appear here as your project moves through supervision.
          </p>
        )}
      </section>);
}
