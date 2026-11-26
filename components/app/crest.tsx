import Image from "next/image";

export function Crest({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <Image src="/yabatech-logo.png" alt="YABATECH Project Supervision" width={168} height={50} unoptimized className="h-7 w-auto shrink-0 rounded-sm object-contain sm:h-8" />
      {!compact && (
        <span aria-hidden="true" className="hidden leading-tight sm:block">
          <span className="block font-display text-[15px] font-extrabold">YABATECH</span>
          <span className="block text-xs text-ink-3">Project Supervision</span>
        </span>
      )}
    </span>
  );
}

