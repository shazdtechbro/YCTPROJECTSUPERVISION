"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import { DEPARTMENTS, ROLE_OPTIONS } from "@/lib/constants";
import { homePathForRole } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [department, setDepartment] = useState<string>("");
  const [pending, setPending] = useState(false);

  const canSubmit =
    name.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 6 &&
    department.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    try {
      const assigned = await signUp({
        displayName: name,
        email,
        password,
        role,
        department,
      });
      toast.success("Account created");
      router.replace(homePathForRole(assigned));
      router.refresh();
    } catch (err) {
      const code = (err as { code?: string }).code;
      toast.error("Could not create account", {
        description:
          code === "auth/email-already-in-use"
            ? "That email is already registered. Sign in instead."
            : code === "auth/weak-password"
              ? "Choose a stronger password (6+ characters)."
              : (err as Error).message,
      });
      setPending(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-[32px] font-extrabold tracking-[-0.03em] sm:text-[36px]">Create your account</h1>
      <p className="mt-2 text-ink-2">Pick your role and department to get started.</p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Okafor"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yabatech.edu.ng"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>

        <div className="space-y-2">
          <Label>Role</Label>
          <div role="radiogroup" aria-label="Role" className="grid grid-cols-3 gap-1 rounded-full bg-cream-2 p-1">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={role === opt.value}
                onClick={() => setRole(opt.value)}
                className={cn(
                  "min-h-[44px] rounded-full px-2 text-sm font-semibold transition",
                  role === opt.value ? "bg-white text-ink shadow-card" : "text-ink-2"
                )}
              >
                {opt.value === "hod" ? "HOD" : opt.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-ink-3">
            {ROLE_OPTIONS.find((o) => o.value === role)?.hint}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Department</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Select your department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={pending}
          disabled={!canSubmit}
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-2">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
