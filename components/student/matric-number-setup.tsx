"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { getUser } from "@/lib/firestore";
import { useAsyncData } from "@/hooks/use-async-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isMatricNumber } from "@/lib/matric";
export function MatricNumberSetup() {
  const { user } = useAuth();
  const profile = useAsyncData(
    () => (user ? getUser(user.uid) : Promise.resolve(null)),
    [user?.uid],
  );
  const [matric, setMatric] = useState("");
  const [busy, setBusy] = useState(false);
  if (!profile.data || profile.data.matricNumber) return null;
  return (
    <form
      className="mb-6 space-y-3 rounded-lg border bg-card p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const res = await fetch("/api/auth/matric", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matricNumber: matric }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          toast.success("Matric number saved. You can now use it to sign in.");
          profile.retry();
        } catch (error) {
          toast.error("Could not save matric number", {
            description: (error as Error).message,
          });
        } finally {
          setBusy(false);
        }
      }}
    >
      <Label htmlFor="existing-matric">Register your matric number</Label>
      <p className="text-sm text-muted-foreground">
        Add your matric number to enable matric login and project partner
        invitations.
      </p>
      <Input
        id="existing-matric"
        required
        value={matric}
        onChange={(e) => setMatric(e.target.value)}
        placeholder="F/HD/24/3211001"
      />
      <Button loading={busy} disabled={!isMatricNumber(matric)}>
        Save matric number
      </Button>
    </form>
  );
}
