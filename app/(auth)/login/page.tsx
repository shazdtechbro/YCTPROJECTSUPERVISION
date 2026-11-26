"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth/auth-context";
import { homePathForRole } from "@/lib/routes";
import type { Role } from "@/lib/types";

function mapAuthError(code?: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again in a few minutes.";
    case "auth/popup-closed-by-user":
      return "The Google sign-in window was closed.";
    default:
      return undefined as unknown as string;
  }
}

function LoginForm() {
  const { signInWithPassword, signInWithGoogle } = useAuth();
  const router = useRouter();
  const nextParam = useSearchParams().get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<null | "password" | "google">(null);

  async function run(method: "password" | "google", fn: () => Promise<Role>) {
    setPending(method);
    try {
      const role = await fn();
      const dest =
        nextParam && nextParam.startsWith("/") && !nextParam.startsWith("/login")
          ? nextParam
          : homePathForRole(role);
      router.replace(dest);
      router.refresh();
    } catch (err) {
      const e = err as { code?: string; message?: string };
      toast.error("Sign-in failed", {
        description: mapAuthError(e.code) || e.message || "Please try again.",
      });
      setPending(null);
    }
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-[32px] font-extrabold tracking-[-0.03em] sm:text-[36px]">Welcome back</h1>
      <p className="mt-2 text-ink-2">Sign in to your supervision workspace.</p>

      <form
        className="mt-8 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void run("password", () => signInWithPassword(email.trim(), password));
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={pending === "password"} disabled={pending !== null}>
          Sign in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-sm text-ink-3">or</span>
        <Separator className="flex-1" />
      </div>

      <Button
        variant="outline"
        size="lg"
        className="w-full"
        disabled={pending !== null}
        loading={pending === "google"}
        onClick={() => void run("google", signInWithGoogle)}
      >
        Continue with Google
      </Button>

      <p className="mt-6 text-sm text-ink-2">
        New here?{" "}
        <Link
          href="/signup"
          className="font-semibold text-brand-700 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-72" />}>
      <LoginForm />
    </Suspense>
  );
}
