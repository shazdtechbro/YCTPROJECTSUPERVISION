import { requireRole } from "@/lib/auth/session";
import { AppShell } from "@/components/shared/app-shell";
import { AuthProvider } from "@/lib/auth/auth-context";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("student");
  return (
    <AuthProvider>
      <AppShell user={user}>{children}</AppShell>
    </AuthProvider>
  );
}
