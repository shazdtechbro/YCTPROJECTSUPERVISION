"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useAsyncData } from "@/hooks/use-async-data";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isMatricNumber, normalizeMatricNumber } from "@/lib/matric";
export function ProjectRequestForm({ onCreated }: { onCreated: () => void }) {
  const supervisors = useAsyncData(async () => {
    const res = await fetch("/api/supervisors");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load supervisors");
    return data.supervisors as { id: string; displayName: string }[];
  }, []);
  const [supervisorId, setSupervisorId] = useState("");
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [partners, setPartners] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (partners.some((p) => !isMatricNumber(p)))
        throw new Error("Enter a valid matric number for every partner.");
      await api.createProject({
        supervisorId,
        title,
        abstract,
        partnerMatricNumbers: partners.map(normalizeMatricNumber),
      });
      toast.success(
        "Topic submitted. Your supervisor and project partners have been notified.",
      );
      onCreated();
    } catch (error) {
      toast.error("Could not submit topic", {
        description: (error as Error).message,
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-lg border bg-card p-4 sm:p-6"
    >
      <div>
        <h2 className="text-lg font-semibold">Start your project</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a supervisor in your department, propose your topic and add
          registered project partners.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-supervisor">Supervisor</Label>
        <select
          id="project-supervisor"
          required
          value={supervisorId}
          onChange={(e) => setSupervisorId(e.target.value)}
          className="h-11 w-full rounded-md border bg-background px-3"
          disabled={supervisors.phase === "loading" || busy}
        >
          <option value="">
            {supervisors.phase === "loading"
              ? "Loading supervisors…"
              : "Choose your supervisor"}
          </option>
          {supervisors.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.displayName}
            </option>
          ))}
        </select>
        {supervisors.error && (
          <div role="alert">
            <p>{supervisors.error.message}</p>
            <Button type="button" variant="outline" onClick={supervisors.retry}>
              Retry
            </Button>
          </div>
        )}
        {supervisors.data?.length === 0 && (
          <p className="text-sm">
            No supervisors are registered in your department yet.
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-topic">Project topic</Label>
        <Input
          id="project-topic"
          required
          minLength={8}
          maxLength={300}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-abstract">Brief description (optional)</Label>
        <Textarea
          id="project-abstract"
          maxLength={5000}
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
          rows={4}
        />
      </div>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">
          Project partners (up to four)
        </legend>
        {partners.map((p, i) => (
          <div key={i} className="flex flex-wrap gap-2">
            <Label className="sr-only" htmlFor={`partner-${i}`}>
              Partner {i + 1} matric number
            </Label>
            <Input
              id={`partner-${i}`}
              className="min-w-0 flex-1"
              required
              placeholder="F/HD/24/3211001"
              value={p}
              onChange={(e) =>
                setPartners(
                  partners.map((v, j) => (j === i ? e.target.value : v)),
                )
              }
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setPartners(partners.filter((_, j) => i !== j))}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          disabled={partners.length >= 4 || busy}
          onClick={() => setPartners([...partners, ""])}
        >
          Add project partner
        </Button>
      </fieldset>
      <Button
        type="submit"
        loading={busy}
        disabled={!supervisorId || title.trim().length < 8 || busy}
      >
        Submit topic for review
      </Button>
    </form>
  );
}
