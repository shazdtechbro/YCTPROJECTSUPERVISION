import Link from "next/link";

import Image from "next/image";
import authPanel from "@/public/redesign/auth-panel.webp";
import { Crest } from "@/components/app/crest";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      <div className="flex flex-col px-5 py-6 sm:px-12 sm:py-8">
        <Link href="/" className="w-fit"><Crest /></Link>
        <main className="mx-auto my-auto w-full max-w-[420px] py-10">{children}</main>
        <p className="text-xs text-ink-3">Yaba College of Technology · HND Digital Project Supervision</p>
      </div>
      <div className="relative hidden overflow-hidden bg-brand-900 p-8 lg:flex lg:flex-col">
        <Image src={authPanel} alt="" unoptimized className="mx-auto max-h-[62vh] w-full rounded-[28px] object-contain" />
        <div className="relative mt-auto max-w-[440px] rounded-2xl bg-card/95 p-6 shadow-float">
          <div className="text-[13px] font-bold text-behind">Why students like it</div>
          <p className="mt-2 font-display text-[22px] font-bold leading-snug">Always know which chapter is next and exactly what your supervisor wants changed.</p>
          <p className="mt-3 text-[13px] text-ink-3">Feedback, deadlines and approvals in one place, on any phone.</p>
        </div>
      </div>
    </div>
  );
}
