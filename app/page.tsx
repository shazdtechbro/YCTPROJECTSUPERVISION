import Link from "next/link";
import {
  Activity, ArrowRight, BarChart3, CalendarClock, Check, FileText, GraduationCap, MessageSquare,
  Plus, ShieldCheck, Ticket, Upload, Users,
} from "lucide-react";

import { getSessionUser, homePathForRole } from "@/lib/auth/session";
import { Crest } from "@/components/app/crest";
import { CountUp, Reveal, Stagger, StaggerItem } from "@/components/app/motion";
import { HeroArt } from "@/components/app/hero-art";
import { DefenseDayIllustration, RoleHod, RoleStudent, RoleSupervisor } from "@/components/illustrations";

const ROLES = [
  { Art: RoleStudent, who: "Students", head: "Always know what is next.", points: ["Live project health and progress", "Upload work and see every version", "Ask questions with tickets"] },
  { Art: RoleSupervisor, who: "Supervisors", head: "Review faster, chase less.", points: ["One queue for everything to review", "Approve or request changes per file", "See who has gone quiet"] },
  { Art: RoleHod, who: "Heads of department", head: "See the whole department.", points: ["Health across every project", "Workload and response per supervisor", "Activity trends over time"] },
];
const STEPS = [
  { Icon: GraduationCap, t: "Register", d: "Sign up with your school email and pick your role." },
  { Icon: Users, t: "Get matched", d: "Your supervisor sets up your project and defence date." },
  { Icon: Upload, t: "Submit work", d: "Upload proposals, chapters and revisions as new versions." },
  { Icon: MessageSquare, t: "Get feedback", d: "Approve or request changes, with comments on each file." },
  { Icon: ShieldCheck, t: "Final approval", d: "Walk into defence with everything signed off." },
];
const FAQ = [
  ["Who can sign up?", "Students, supervisors and HODs at YABATECH sign up with their email and choose their department."],
  ["How is progress shown?", "Every project has a progress bar, a health status and a review journey built from the files you submit."],
  ["What does Behind or Stalled mean?", "It is an early warning based on activity and timing, not a grade. Your supervisor still makes every academic decision."],
  ["Are my files private?", "Yes. Files are stored privately and only your project team, supervisor and HOD can open them."],
  ["Does it work on my phone?", "Yes. Every screen is designed for phones first, with large buttons and a bottom navigation bar."],
];

export default async function LandingPage() {
  const user = await getSessionUser();
  const primaryHref = user ? homePathForRole(user.role) : "/signup";
  const primaryLabel = user ? "Go to dashboard" : "Get started";

  return (
    <div className="overflow-x-hidden">
      <header className="sticky top-0 z-40">
        <div className="mx-auto max-w-[1240px] px-3 pt-3 sm:px-4 sm:pt-4">
          <nav aria-label="Main" className="flex items-center justify-between rounded-full border border-line bg-white/85 py-2 pl-2 pr-2 shadow-card backdrop-blur-md">
            <Link href="/" className="flex items-center"><Crest /></Link>
            <div className="hidden items-center gap-7 text-[14px] font-medium text-ink-2 md:flex">
              <a href="#features" className="hover:text-ink">Features</a>
              <a href="#how" className="hover:text-ink">How it works</a>
              <a href="#roles" className="hover:text-ink">For departments</a>
              <a href="#faq" className="hover:text-ink">FAQ</a>
            </div>
            <div className="flex items-center gap-1">
              {!user && <Link href="/login" className="hidden min-h-[44px] items-center px-4 text-[14px] font-semibold sm:inline-flex">Sign in</Link>}
              <Link href={primaryHref} className="press inline-flex min-h-[44px] items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-semibold text-white">
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-4 pb-10 pt-10 md:pt-20 lg:grid-cols-[1.05fr_1fr]">
        <Reveal>
          <span className="chip border border-brand-100 bg-brand-50 text-brand-800"><span className="h-2 w-2 animate-pulse-dot rounded-full bg-sun-400" />YABATECH HND · Final-year projects</span>
          <h1 className="mt-5 font-display text-[40px] font-extrabold leading-[1] tracking-[-0.035em] sm:text-[60px] lg:text-[72px]">
            Final-year projects, <span className="hl">supervised</span> without the chaos.
          </h1>
          <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-ink-2 md:text-[18px]">
            Students, supervisors and the HOD in one calm workspace. See every submission, every piece of feedback and every project at risk, long before defence day.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={primaryHref} className="press inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-brand-700 px-6 font-semibold text-white shadow-float hover:bg-brand-800">
              {user ? "Go to dashboard" : "Start your project"} <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="#how" className="press inline-flex min-h-[52px] items-center justify-center rounded-full border border-line bg-white px-6 font-semibold hover:border-ink">See how it works</a>
          </div>
          <div className="mt-8 flex items-center gap-3 text-[13px] text-ink-3">
            <div className="flex -space-x-2">
              <span className="h-8 w-8 rounded-full border-2 border-cream bg-sun-300" /><span className="h-8 w-8 rounded-full border-2 border-cream bg-brand-200" /><span className="h-8 w-8 rounded-full border-2 border-cream bg-[#8EC5E8]" />
            </div>
            Built for the YABATECH HND project cycle
          </div>
        </Reveal>
        <HeroArt />
      </section>

      {/* Facts */}
      <section className="mx-auto max-w-[1240px] px-4 py-10">
        <Stagger className="grid grid-cols-2 gap-6 border-y border-line py-8 md:grid-cols-4">
          {[[3, "roles in one workspace"], [3, "health states: on track, behind, stalled"], [5, "submission types tracked"], [100, "% of screens phone-ready"]].map(([n, l]) => (
            <StaggerItem key={l as string}>
              <div className="font-display text-[40px] font-extrabold tracking-tight md:text-[44px]"><CountUp value={n as number} /></div>
              <div className="text-[14px] text-ink-2">{l}</div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Product preview */}
      <section className="mx-auto max-w-[1240px] px-4 py-10">
        <Reveal className="mx-auto max-w-[720px] text-center">
          <h2 className="font-display text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em] md:text-[48px]">Everything about a project, <span className="text-brand-700">on one screen.</span></h2>
          <p className="mt-4 text-[17px] text-ink-2">Submissions, feedback, deadlines and health, so nobody has to ask &ldquo;where are we?&rdquo;</p>
        </Reveal>
        <Reveal className="mt-10">
          <div className="rounded-[28px] bg-brand-900 p-2 shadow-float md:p-5">
            <div className="overflow-hidden rounded-[20px] bg-cream">
              <div className="flex items-center gap-2 border-b border-line bg-white px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-[#F87171]" /><span className="h-3 w-3 rounded-full bg-sun-400" /><span className="h-3 w-3 rounded-full bg-brand-500" />
                <span className="ml-3 truncate font-mono text-xs text-ink-3">project-supervision/student/dashboard</span>
              </div>
              <div className="grid gap-4 p-3 md:grid-cols-[1.4fr_1fr] md:p-5">
                <div className="rounded-2xl border border-line bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><div className="text-xs text-ink-3">Your project</div><div className="mt-1 font-display text-[17px] font-bold md:text-[18px]">AI-based medical diagnostics and appointment booking</div></div>
                    <span className="chip bg-brand-50 text-brand-700"><span className="h-1.5 w-1.5 rounded-full bg-current" />On track</span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {[["Proposal", "Approved", "bg-brand-50 text-brand-700"], ["Chapters", "Approved", "bg-brand-50 text-brand-700"], ["Revisions", "In review", "bg-sun-100 text-behind"], ["Final", "Not started", "bg-cream-2 text-ink-3"], ["Defence", "24 Feb", "bg-cream-2 text-ink-3"]].map(([t, s, c]) => (
                      <div key={t} className={`rounded-xl p-2.5 ${c.split(" ")[0]}`}><div className="text-[13px] font-semibold text-ink">{t}</div><div className={`mt-1 text-xs ${c.split(" ")[1]}`}>{s}</div></div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-sun-400 p-5">
                  <div className="text-xs font-semibold">Your next step</div>
                  <div className="mt-1 font-display text-[18px] font-bold">Your revisions are with your supervisor.</div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/50"><div className="h-full w-[55%] rounded-full bg-ink" /></div>
                  <div className="mt-2 text-xs text-ink/75">55% complete · Defence 24 Feb 2027</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Roles */}
      <section id="roles" className="mx-auto max-w-[1240px] scroll-mt-24 px-4 py-16 md:py-20">
        <Reveal className="max-w-[640px]">
          <span className="chip bg-sun-100 text-[#6B4F00]">Built for every seat in the room</span>
          <h2 className="mt-4 font-display text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em] md:text-[48px]">One workspace, three very different jobs.</h2>
        </Reveal>
        <Stagger className="mt-10 grid gap-5 md:grid-cols-3">
          {ROLES.map(({ Art, who, head, points }) => (
            <StaggerItem key={who}>
              <div className="lift h-full rounded-[24px] border border-line bg-white p-3 shadow-card">
                <div className="overflow-hidden rounded-[18px]"><Art /></div>
                <div className="p-4">
                  <div className="text-[13px] font-semibold text-brand-700">{who}</div>
                  <h3 className="mt-1 font-display text-[22px] font-bold">{head}</h3>
                  <ul className="mt-4 space-y-2.5 text-[14px] text-ink-2">
                    {points.map((b) => <li key={b} className="flex gap-2.5"><Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand-700" />{b}</li>)}
                  </ul>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 bg-brand-900 text-white">
        <div className="mx-auto max-w-[1240px] px-4 py-16 md:py-20">
          <Reveal className="max-w-[640px]">
            <span className="chip bg-white/10 text-sun-300">How it works</span>
            <h2 className="mt-4 font-display text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em] md:text-[48px]">From topic to defence in five clear stages.</h2>
          </Reveal>
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-5">
            {STEPS.map(({ Icon, t, d }, i) => (
              <StaggerItem key={t}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-sun-400 text-ink"><Icon className="h-5 w-5" /></span><span className="font-mono text-xs text-white/50">0{i + 1}</span></div>
                  <h3 className="mt-6 font-display text-[18px] font-bold">{t}</h3>
                  <p className="mt-1 text-[14px] text-white/75">{d}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Bento */}
      <section id="features" className="mx-auto max-w-[1240px] scroll-mt-24 px-4 py-16 md:py-20">
        <Reveal className="max-w-[640px]"><h2 className="font-display text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em] md:text-[48px]">The tools a supervision office actually needs.</h2></Reveal>
        <Stagger className="mt-10 grid gap-4 md:grid-cols-6">
          <StaggerItem className="md:col-span-4">
            <div className="h-full rounded-[24px] border border-line bg-white p-6 shadow-card">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-brand-700"><Activity className="h-5 w-5" />Project health</div>
              <h3 className="mt-2 font-display text-[24px] font-bold">Know who is behind before it becomes a problem.</h3>
              <p className="mt-2 max-w-[520px] text-ink-2">Every project is checked for inactivity, missed work and defence timing, then marked On track, Behind or Stalled with a plain-English reason.</p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-brand-50 p-4"><div className="text-xs font-semibold text-brand-700">On track</div><div className="font-display text-[26px] font-extrabold">Green</div></div>
                <div className="rounded-2xl bg-sun-100 p-4"><div className="text-xs font-semibold text-behind">Behind</div><div className="font-display text-[26px] font-extrabold">Amber</div></div>
                <div className="rounded-2xl bg-[#FDECEA] p-4"><div className="text-xs font-semibold text-stalled">Stalled</div><div className="font-display text-[26px] font-extrabold">Red</div></div>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem className="md:col-span-2">
            <div className="flex h-full flex-col rounded-[24px] bg-sun-400 p-6 shadow-card">
              <FileText className="h-7 w-7" />
              <h3 className="mt-auto pt-10 font-display text-[22px] font-bold">Reviews with version history</h3>
              <p className="mt-2 text-[14px] text-ink/80">Approve or request changes per file, with a comment thread on each submission.</p>
            </div>
          </StaggerItem>
          <StaggerItem className="md:col-span-2"><div className="h-full rounded-[24px] border border-line bg-white p-6 shadow-card"><Ticket className="h-7 w-7 text-brand-700" /><h3 className="mt-6 font-display text-[20px] font-bold">Tickets for every question</h3><p className="mt-2 text-[14px] text-ink-2">Priorities, due dates and status, in both directions.</p></div></StaggerItem>
          <StaggerItem className="md:col-span-2"><div className="h-full rounded-[24px] border border-line bg-white p-6 shadow-card"><CalendarClock className="h-7 w-7 text-brand-700" /><h3 className="mt-6 font-display text-[20px] font-bold">Deadlines that are visible</h3><p className="mt-2 text-[14px] text-ink-2">Defence dates and next deadlines on every dashboard.</p></div></StaggerItem>
          <StaggerItem className="md:col-span-2"><div className="h-full rounded-[24px] bg-ink p-6 text-white shadow-card"><BarChart3 className="h-7 w-7 text-sun-400" /><h3 className="mt-6 font-display text-[20px] font-bold">Department analytics</h3><p className="mt-2 text-[14px] text-white/75">Workload and response time per supervisor, for the HOD.</p></div></StaggerItem>
        </Stagger>
      </section>

      {/* Defence banner */}
      <section className="mx-auto max-w-[1240px] px-4 pb-16 md:pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-sun-400">
            <DefenseDayIllustration className="w-full md:min-h-[340px] md:object-cover" />
            <div className="relative -mt-6 p-4 md:absolute md:bottom-10 md:left-10 md:mt-0 md:p-0">
              <div className="max-w-[460px] rounded-2xl bg-white/95 p-6 shadow-float backdrop-blur">
                <h3 className="font-display text-[24px] font-extrabold leading-tight md:text-[28px]">Walk into defence day already knowing you are ready.</h3>
                <p className="mt-2 text-ink-2">Every submission, approval and comment is on record, so nothing gets missed.</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-[900px] scroll-mt-24 px-4 pb-16 md:pb-20">
        <Reveal><h2 className="font-display text-[32px] font-extrabold tracking-[-0.03em] md:text-[36px]">Questions</h2></Reveal>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold">
                {q}
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line transition group-open:rotate-45"><Plus className="h-4 w-4" /></span>
              </summary>
              <p className="mt-3 max-w-[720px] text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA + footer */}
      <footer className="bg-brand-700 text-white">
        <div className="mx-auto max-w-[1240px] px-4 py-16 text-center md:py-20">
          <Reveal>
            <h2 className="font-display text-[36px] font-extrabold leading-[1.02] tracking-[-0.035em] md:text-[60px]">Start your project the <span className="hl text-ink">right way.</span></h2>
            <p className="mt-4 text-[17px] text-white/85">Create an account with your school email in under a minute.</p>
            <Link href={primaryHref} className="press mt-8 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-sun-400 px-7 font-bold text-ink">
              {primaryLabel} <ArrowRight className="h-5 w-5" />
            </Link>
          </Reveal>
        </div>
        <div className="border-t border-white/15">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-4 py-8 text-[13px] text-white/75 sm:flex-row sm:justify-between">
            <span>© {new Date().getFullYear()} Yaba College of Technology · Digital Project Supervision</span>
            <span className="flex gap-5"><Link href="/login">Sign in</Link><Link href="/signup">Create account</Link><a href="#faq">Help</a></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
