"use client";

/**
 * Client auth state. This is a convenience mirror for rendering (show the user's
 * name, hide a button) — it is NOT an access-control boundary. Real enforcement
 * is server-side in `requireRole()` and in `firestore.rules` / `storage.rules`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

import { getFirebaseAuth } from "@/lib/firebase";
import { api } from "@/lib/api";
import type { Role } from "@/lib/types";

export interface SignUpInput {
  displayName: string;
  email: string;
  password: string;
  role: Role;
  department: string;
  matricNumber?: string;
}

interface AuthClaimsState {
  role: Role | null;
  department: string | null;
}

interface AuthContextValue {
  user: User | null;
  claims: AuthClaimsState;
  /** `true` until the first auth state resolves — gate UI on this. */
  loading: boolean;
  /** Resolves only AFTER the server session cookie is minted. Returns the role. */
  signInWithPassword: (email: string, password: string) => Promise<Role>;
  signInWithMatric: (matricNumber: string, password: string) => Promise<Role>;
  signInWithGoogle: () => Promise<Role>;
  signUp: (input: SignUpInput) => Promise<Role>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Mint (or clear) the HttpOnly `__session` cookie and WAIT for it. Interactive
 * auth flows must await this before navigating, otherwise the router hits a
 * protected route before the cookie exists and middleware bounces it.
 */
async function syncSessionCookie(
  user: User | null,
  forceRefresh = false
): Promise<Role | null> {
  if (!user) {
    await fetch("/api/session", { method: "DELETE" });
    return null;
  }
  const result = await user.getIdTokenResult(forceRefresh);
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: result.token }),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error || "Could not establish a session.");
  }
  return (result.claims.role as Role | undefined) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<AuthClaimsState>({
    role: null,
    department: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onIdTokenChanged fires on sign-in/out AND on token refresh, so the
    // session cookie and custom claims stay current.
    const unsub = onIdTokenChanged(getFirebaseAuth(), async (nextUser) => {
      setUser(nextUser);
      try {
        if (nextUser) {
          const res = await nextUser.getIdTokenResult();
          setClaims({
            role: (res.claims.role as Role | undefined) ?? null,
            department: (res.claims.department as string | undefined) ?? null,
          });
          await syncSessionCookie(nextUser);
        } else {
          setClaims({ role: null, department: null });
          await syncSessionCookie(null);
        }
      } catch {
        // A network/provisioning error must not leave every route behind the
        // initial-auth loading screen. Interactive flows surface their errors.
        if (nextUser) setClaims({ role: null, department: null });
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<Role> => {
      const cred = await signInWithEmailAndPassword(
        getFirebaseAuth(),
        email,
        password
      );
      try {
        const role = await syncSessionCookie(cred.user);
        if (!role) throw new Error("This account has no role assigned yet. Ask your department to provision it.");
        return role;
      } catch (error) {
        await signOut(getFirebaseAuth());
        throw error;
      }
    },
    []
  );

  const signInWithMatric = useCallback(async (matricNumber: string, password: string): Promise<Role> => {
    const result = await fetch("/api/auth/student-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricNumber, password }),
    });
    const data = await result.json().catch(() => ({})) as { customToken?: string; error?: string };
    if (!result.ok || !data.customToken) throw new Error(data.error || "Matric number or password is incorrect.");
    const credential = await signInWithCustomToken(getFirebaseAuth(), data.customToken);
    try {
      const role = await syncSessionCookie(credential.user, true);
      if (role !== "student") throw new Error("This account is not a student account.");
      return role;
    } catch (error) {
      await signOut(getFirebaseAuth());
      throw error;
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<Role> => {
    const cred = await signInWithPopup(
      getFirebaseAuth(),
      new GoogleAuthProvider()
    );
    try {
      const role = await syncSessionCookie(cred.user);
      if (role) return role;
      await signOut(getFirebaseAuth());
      throw new Error(
        "No authorized account is set up for this Google user yet. Contact your department."
      );
    } catch (error) {
      await signOut(getFirebaseAuth());
      throw error;
    }
  }, []);

  const signUp = useCallback(async (input: SignUpInput): Promise<Role> => {
    const auth = getFirebaseAuth();
    const cred = await createUserWithEmailAndPassword(
      auth,
      input.email.trim(),
      input.password
    );
    await updateProfile(cred.user, { displayName: input.displayName.trim() });
    const idToken = await cred.user.getIdToken();
    await api.provisionAccount({
      idToken,
      role: input.role,
      department: input.department,
      displayName: input.displayName.trim(),
      matricNumber: input.matricNumber,
    });
    // Force-refresh so the new claims land, then mint + await the session cookie.
    const role = await syncSessionCookie(cred.user, true);
    return role ?? input.role;
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(getFirebaseAuth());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      claims,
      loading,
      signInWithPassword,
      signInWithMatric,
      signInWithGoogle,
      signUp,
      signOutUser,
    }),
    [
      user,
      claims,
      loading,
      signInWithPassword,
      signInWithMatric,
      signInWithGoogle,
      signUp,
      signOutUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
