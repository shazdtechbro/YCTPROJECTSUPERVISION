"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

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

  const [loginRole, setLoginRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const [pending, setPending] = useState<null | "password" | "google">(null);

  async function run(method: "password" | "google", fn: () => Promise<Role>) {
    setPending(method);
    try {
      const role = await fn();
      window.location.replace(homePathForRole(role));
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

      <Button type="button" variant="link" className="mt-2 px-0" onClick={() => {
        setResetOpen((open) => !open);
        setResetEmail(loginRole === "student" ? "" : email);
      }} aria-expanded={resetOpen}>
        Forgot password?
      </Button>
      {resetOpen && (loginRole === "student" ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Contact your department office to verify your identity and recover your matriculation account.
        </p>
      ) : (
        <form className="mt-2 space-y-2 rounded-md border p-3" onSubmit={async (event) => {
          event.preventDefault();
          setSendingReset(true);
          try {
            await sendPasswordResetEmail(getFirebaseAuth(), resetEmail.trim());
            toast.success("If this email has a password account, a reset link will arrive shortly.");
          } catch (error) {
            const code = (error as { code?: string }).code;
            if (code === "auth/user-not-found") {
              toast.success("If this email has a password account, a reset link will arrive shortly.");
            } else {
              toast.error("Could not send a reset link. Try again shortly.");
            }
          } finally {
            setSendingReset(false);
          }
        }}>
          <Label htmlFor="reset-email">Account email</Label>
          <Input id="reset-email" required type="email" autoComplete="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} />
          <Button type="submit" loading={sendingReset}>Send password reset link</Button>
        </form>
      ))}

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
