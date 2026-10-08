import type { Role } from "@/lib/types";

type SessionIdentity = {
  uid: string;
  getIdTokenResult: (forceRefresh?: boolean) => Promise<{ token: string; claims: Record<string, unknown> }>;
};

/** Serialize cookie writes so an earlier token refresh cannot undo logout. */
export function createSessionSynchronizer(
  request: typeof fetch,
  currentUid: () => string | null,
) {
  let generation = 0;
  let signedOut = false;
  let pending: Promise<unknown> = Promise.resolve();

  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = pending.then(operation, operation);
    pending = result.catch(() => undefined);
    return result;
  }

  async function clearCookie() {
    const response = await request("/api/session", {
      method: "DELETE",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Could not complete sign-out. Please try again.");
    return null;
  }

  return {
    beginSignIn() { generation += 1; signedOut = false; },
    invalidate() { generation += 1; signedOut = true; },
    clear: () => enqueue(clearCookie),
    sync(identity: SessionIdentity | null, forceRefresh = false): Promise<Role | null> {
      const revision = generation;
      return enqueue(async () => {
        if (revision !== generation) return null;
        if (!identity) return currentUid() ? null : clearCookie();
        if (signedOut || currentUid() !== identity.uid) return null;
        const result = await identity.getIdTokenResult(forceRefresh);
        if (revision !== generation || signedOut || currentUid() !== identity.uid) return null;
        const response = await request("/api/session", {
          method: "POST", credentials: "same-origin", cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: result.token }),
        });
        if (!response.ok) {
          const { error } = await response.json().catch(() => ({}));
          throw new Error(error || "Could not establish a session.");
        }
        return (result.claims.role as Role | undefined) ?? null;
      });
    },
  };
}
