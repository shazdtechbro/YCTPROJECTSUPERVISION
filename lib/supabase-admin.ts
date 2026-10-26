import "server-only";

/**
 * Server-side Supabase (service-role key). Used from route handlers / server
 * actions to mint short-lived signed URLs for submission files and to enforce
 * access before doing so (the caller must already be verified via
 * `requireSession()` / `requireRole()`).
 *
 * `SUPABASE_SERVICE_ROLE_KEY` is server-only and secret — never `NEXT_PUBLIC_`.
 * Lazily initialised so `next build` doesn't need it.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SUBMISSIONS_BUCKET } from "@/lib/firestore/paths";

let cached: SupabaseClient | undefined;

function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin config incomplete. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server env)."
    );
  }
  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/**
 * One-time signed UPLOAD URL for a submission object. The browser PUTs the file
 * straight to Supabase with this — bytes never pass through the Vercel function
 * (which caps request bodies at ~4.5 MB), and no broad Storage policy is needed
 * because the token authorises the write. Mint it only after verifying the
 * caller owns the project.
 */
export async function createSubmissionUploadUrl(
  storagePath: string
): Promise<{ signedUrl: string; token: string; path: string }> {
  const { data, error } = await getSupabaseAdmin()
    .storage.from(SUBMISSIONS_BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: true });
  if (error || !data) {
    throw new Error(`Failed to sign upload for ${storagePath}: ${error?.message}`);
  }
  return data;
}

/** Signed download URL for a submission object. Default TTL: 5 minutes. */
export async function createSubmissionSignedUrl(
  storagePath: string,
  expiresInSeconds = 300,
  downloadName?: string,
): Promise<string> {
  const { data, error } = await getSupabaseAdmin()
    .storage.from(SUBMISSIONS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds, downloadName ? { download: downloadName } : {});
  if (error || !data) {
    throw new Error(`Failed to sign ${storagePath}: ${error?.message}`);
  }
  return data.signedUrl;
}

/** Remove a submission object (used when a draft is superseded/withdrawn). */
export async function removeSubmissionObject(
  storagePath: string
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .storage.from(SUBMISSIONS_BUCKET)
    .remove([storagePath]);
  if (error) throw new Error(`Failed to remove ${storagePath}: ${error.message}`);
}
