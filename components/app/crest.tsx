/** YABATECH crest + wordmark. Dependency-free so public pages stay light. */
export function Crest({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-700 font-display text-base font-extrabold text-sun-400">Y</span>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-display text-[15px] font-extrabold">YABATECH</span>
          <span className="block text-xs text-ink-3">Project Supervision</span>
        </span>
      )}
    </span>
  );
}
