import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { NotFoundIllustration } from "@/components/illustrations";

export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-5 py-12 text-center">
      <div className="max-w-md">
        <NotFoundIllustration />
        <p className="mt-6 font-mono text-sm text-ink-3">Error 404</p>
        <h1 className="mt-2 font-display text-[32px] font-extrabold tracking-[-0.03em]">This page took a wrong turn.</h1>
        <p className="mt-2 text-ink-2">The link may be old, or the page has moved. Head back and pick up where you left off.</p>
        <Link href="/" className="press mt-8 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800">
          <ArrowLeft className="h-5 w-5" /> Back to home
        </Link>
      </div>
    </main>
  );
}
