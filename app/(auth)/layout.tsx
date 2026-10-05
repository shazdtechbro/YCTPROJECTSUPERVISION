import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-6 pt-10">
        <Link href="/" className="inline-flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 shadow-brutal-sm">
          <img
            src="https://yabatech.edu.ng/img/logss.png"
            alt="Yaba College of Technology"
            className="h-9 w-auto object-contain"
          />
          <span className="border-l-2 border-accent pl-3 text-xs font-black uppercase leading-tight tracking-wide">
            Project<br />Supervision
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
