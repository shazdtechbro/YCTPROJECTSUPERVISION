"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth/auth-context";
import { homePathForRole } from "@/lib/routes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_OPTIONS } from "@/lib/constants";
import type { Role } from "@/lib/types";

function mapAuthError(code?: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Login details or password are incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again in a few minutes.";
    case "auth/popup-closed-by-user":
      return "The Google sign-in window was closed.";
    default:
      return undefined as unknown as string;
  }
}

function LoginForm() {
  const { signInWithPassword, signInWithMatric, signInWithGoogle } = useAuth();
  const router = useRouter();
  const nextParam = useSearchParams().get("next");

  const [loginRole, setLoginRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<null | "password" | "google">(null);

  async function run(method: "password" | "google", fn: () => Promise<Role>) {
    setPending(method);
    try {
      const role = await fn();
      const dest =
        nextParam &&
        nextParam.startsWith("/") &&
        !nextParam.startsWith("/login") &&
        !nextParam.startsWith("//")
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
      <h1 className="text-xl font-black tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Continue to your supervision workspace.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const credential = email.trim();

          void run("password", () =>
            loginRole === "student"
              ? signInWithMatric(credential, password)
              : signInWithPassword(credential, password),
          );
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="login-role">Role</Label>
          <Select value={loginRole} onValueChange={(value) => { setLoginRole(value as Role); setEmail(""); }}>
            <SelectTrigger id="login-role"><SelectValue /></SelectTrigger>
            <SelectContent>{ROLE_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{loginRole === "student" ? "Matriculation number" : "Email"}</Label>
          <Input
            id="email"
            type={loginRole === "student" ? "text" : "email"}
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={loginRole === "student" ? "F/HD/24/3211001" : "name@example.com"}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          loading={pending === "password"}
        >
          Sign in
        </Button>
      </form>

      {loginRole !== "student" && <>
      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
          or
        </span>
        <Separator className="flex-1" />
      </div>

      <Button
        variant="outline"
        className="w-full"
        loading={pending === "google"}
        onClick={() => void run("google", signInWithGoogle)}
      >
        Continue with Google
      </Button>
      </>}

      <p className="mt-6 text-sm text-muted-foreground">
        You don’t have an account?{" "}
        <Link
          href="/signup"
          className="font-bold text-foreground underline underline-offset-4"
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
