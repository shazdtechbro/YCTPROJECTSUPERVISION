import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-6 pt-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center border-2 border-border bg-foreground text-background shadow-brutal-sm">
            <span className="text-xs font-black">P</span>
          </div>
          <span className="text-sm font-black uppercase tracking-tight">
            Project Supervision
          </span>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="border-2 border-border bg-background p-6 shadow-brutal">
          {children}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-md px-6 pb-10 text-2xs text-muted-foreground">
        YABATECH HND · Digital Project Supervision &amp; Progress Tracking
      </footer>
    </div>
  );
}
