import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/shared/app-shell";
import { AuthProvider } from "@/lib/auth/auth-context";

export default async function HodLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("hod");
  return (
    <AuthProvider>
      <AppShell user={user}>{children}</AppShell>
    </AuthProvider>
  );
}
