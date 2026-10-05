import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  FileCheck2,
  GaugeCircle,
  GraduationCap,
  LineChart,
  MessagesSquare,
  ShieldCheck,
  Ticket,
} from "lucide-react";

import { getSessionUser, homePathForRole } from "@/lib/auth/session";

export default async function LandingPage() {
  const user = await getSessionUser();
  const primaryHref = user ? homePathForRole(user.role) : "/signup";
  const primaryLabel = user ? "Go to dashboard" : "Get started";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-border px-5 py-4">
        <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <img
            src="https://yabatech.edu.ng/img/logss.png"
            alt="Yaba College of Technology"
            className="h-10 w-auto object-contain"
          />
          <span className="border-l-2 border-accent pl-3 text-xs font-black uppercase leading-tight tracking-wide">
            Project<br />Supervision
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          {!user && (
            <Link
              href="/login"
              className="press hidden h-9 items-center rounded-md border-2 border-transparent px-3 text-sm font-semibold hover:border-border sm:inline-flex"
            >
              Sign in
            </Link>
          )}
          <Link
            href={primaryHref}
            className="press inline-flex h-9 items-center gap-1.5 rounded-md border-2 border-border bg-primary px-3 text-sm font-bold text-primary-foreground shadow-brutal-sm"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-5 pb-8 pt-10 sm:pt-20">
        <span className="inline-block -rotate-1 border-2 border-border bg-accent px-2 py-0.5 text-2xs font-black uppercase tracking-wide text-accent-foreground shadow-brutal-sm">
          YABATECH HND · Final-year projects
        </span>
        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
          Supervise projects without the
          <span className="mx-2 inline-block rotate-1 border-2 border-border bg-foreground px-2 text-background">
            chaos
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          One place for students, supervisors and the HOD. Track milestones,
          review submissions, raise tickets, and see who&apos;s behind — before
          it&apos;s a problem at the defense.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={primaryHref}
            className="press inline-flex h-11 items-center gap-2 rounded-md border-2 border-border bg-primary px-5 text-sm font-bold text-primary-foreground shadow-brutal"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          {!user && (
            <Link
              href="/login"
              className="press inline-flex h-11 items-center rounded-md border-2 border-border bg-background px-5 text-sm font-bold shadow-brutal"
            >
              I have an account
            </Link>
          )}
        </div>
      </section>

      {/* marquee strip */}
      <div className="overflow-hidden border-y-2 border-border bg-foreground text-background">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap py-2.5 text-sm font-black uppercase tracking-wide">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k} className="flex gap-8">
              <span>Milestone tracking</span>
              <span>·</span>
              <span>File review</span>
              <span>·</span>
              <span>Ticketing</span>
              <span>·</span>
              <span>Live notifications</span>
              <span>·</span>
              <span>Responsiveness metrics</span>
              <span>·</span>
              <span>Department analytics</span>
              <span>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* role cards */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
          Built for every seat in the room
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: GraduationCap,
              title: "Students",
              points: [
                "One project view with live milestone health",
                "Upload chapters with a real progress bar",
                "Raise tickets, follow feedback threads",
              ],
            },
            {
              icon: ShieldCheck,
              title: "Supervisors",
              points: [
                "Roster of students with status at a glance",
                "Review submissions, comment per file",
                "Dashboard rollup — no fishing through projects",
              ],
            },
            {
              icon: LineChart,
              title: "HOD",
              points: [
                "Department-wide table / card views",
                "Supervisor responsiveness, computed from timestamps",
                "Activity-over-time charts",
              ],
            },
          ].map((r) => (
            <div
              key={r.title}
              className="border-2 border-border bg-card p-5 shadow-brutal"
            >
              <div className="flex h-10 w-10 items-center justify-center border-2 border-border bg-foreground text-background">
                <r.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-black">{r.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {r.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-[3px] h-2 w-2 shrink-0 bg-foreground" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* feature grid */}
      <section className="border-y-2 border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
          {[
            [GaugeCircle, "Milestone engine", "On track / behind / stalled, from defense date, submission cadence and ticket activity. Nightly cron + on-the-fly."],
            [FileCheck2, "Submission review", "Versioned uploads to private storage, signed-URL downloads, approve / request changes."],
            [Ticket, "Ticketing", "Priority, due dates, status — students and supervisors, both directions."],
            [MessagesSquare, "Per-file feedback", "Comment threads scoped to a single submission. Live."],
            [BellRing, "Live notifications", "Real-time bell on the events that touch your projects."],
            [CalendarClock, "Responsiveness", "Average time from a student's submission to the supervisor's first reply."],
          ].map(([Icon, title, body]) => {
            const I = Icon as typeof GaugeCircle;
            return (
              <div key={title as string} className="bg-background p-6">
                <I className="h-5 w-5" />
                <h3 className="mt-3 text-sm font-black uppercase tracking-wide">
                  {title as string}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {body as string}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
          Start with your role.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Create an account, pick student / supervisor / HOD, and you&apos;re in.
        </p>
        <Link
          href={primaryHref}
          className="press mt-7 inline-flex h-12 items-center gap-2 border-2 border-border bg-primary px-6 text-sm font-black uppercase tracking-wide text-primary-foreground shadow-brutal-lg"
        >
          {primaryLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <footer className="border-t-2 border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-5 py-6 text-2xs text-muted-foreground sm:flex-row sm:items-center">
          <span>
            Digital Project Supervision &amp; Progress Tracking System · YABATECH
            HND
          </span>
          <span className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              Create account
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
