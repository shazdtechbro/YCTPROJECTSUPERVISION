/**
 * Code-drawn illustration set. Pure SVG, no image downloads, so it is sharp at
 * any size and costs almost nothing on mobile data. Every scene is built from
 * the same Person primitive so the cast feels consistent across the product.
 */
import { cn } from "@/lib/utils";

const C = {
  green: "#006600",
  green9: "#08361A",
  green5: "#1F8A4C",
  green2: "#B4DCBF",
  green1: "#D9EEDF",
  sun: "#FDC800",
  sun3: "#FFDB5C",
  sun1: "#FFF4CC",
  cream: "#FBF8F0",
  cream2: "#F4EFE3",
  ink: "#111611",
  line: "#E7E2D5",
  coral: "#F6B8A8",
  sky: "#8EC5E8",
  lilac: "#D6C8F5",
};
const SKIN = ["#8D5524", "#C68642", "#6B3E1F", "#A0673A", "#5A321A"];

type PersonProps = {
  x: number;
  y: number;
  s?: number;
  skin?: number;
  shirt?: string;
  hair?: "short" | "puff" | "wrap" | "bald" | "braids";
  hairColor?: string;
  arm?: "down" | "up" | "point" | "hold";
  flip?: boolean;
  cap?: boolean;
  glasses?: boolean;
};

/** A friendly, simplified human figure. Origin is the top of the head. */
export function Person({
  x, y, s = 1, skin = 0, shirt = C.green, hair = "short", hairColor = C.ink,
  arm = "down", flip, cap, glasses,
}: PersonProps) {
  const sk = SKIN[skin % SKIN.length];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {/* torso */}
      <path d="M-30 66 C-30 46 -18 38 0 38 C18 38 30 46 30 66 L30 120 L-30 120 Z" fill={shirt} />
      <path d="M-8 38 L0 50 L8 38" fill={sk} />
      {/* arms */}
      {arm === "down" && (<>
        <path d="M-28 52 C-40 70 -40 92 -34 106" stroke={shirt} strokeWidth="13" strokeLinecap="round" fill="none" />
        <path d="M28 52 C40 70 40 92 34 106" stroke={shirt} strokeWidth="13" strokeLinecap="round" fill="none" />
        <circle cx="-34" cy="108" r="6.5" fill={sk} /><circle cx="34" cy="108" r="6.5" fill={sk} />
      </>)}
      {arm === "up" && (<>
        <path d="M-28 52 C-40 70 -40 92 -34 106" stroke={shirt} strokeWidth="13" strokeLinecap="round" fill="none" />
        <circle cx="-34" cy="108" r="6.5" fill={sk} />
        <path d="M27 52 C42 40 48 22 46 6" stroke={shirt} strokeWidth="13" strokeLinecap="round" fill="none" />
        <circle cx="46" cy="2" r="7" fill={sk} />
      </>)}
      {arm === "point" && (<>
        <path d="M-28 52 C-40 70 -40 92 -34 106" stroke={shirt} strokeWidth="13" strokeLinecap="round" fill="none" />
        <circle cx="-34" cy="108" r="6.5" fill={sk} />
        <path d="M27 54 C46 56 60 50 70 42" stroke={shirt} strokeWidth="13" strokeLinecap="round" fill="none" />
        <circle cx="73" cy="40" r="6.5" fill={sk} />
      </>)}
      {arm === "hold" && (<>
        <path d="M-27 54 C-30 76 -14 86 4 84" stroke={shirt} strokeWidth="13" strokeLinecap="round" fill="none" />
        <path d="M27 54 C30 76 18 86 8 84" stroke={shirt} strokeWidth="13" strokeLinecap="round" fill="none" />
        <circle cx="6" cy="84" r="6.5" fill={sk} />
      </>)}
      {/* head */}
      <rect x="-6" y="26" width="12" height="14" rx="5" fill={sk} />
      <circle cx="0" cy="14" r="18" fill={sk} />
      {hair === "short" && <path d="M-18 12 C-20 -8 -4 -10 2 -7 C12 -10 22 -2 18 12 C14 2 6 0 -2 1 C-10 2 -15 6 -18 12Z" fill={hairColor} />}
      {hair === "puff" && <><circle cx="0" cy="-4" r="17" fill={hairColor} /><circle cx="-15" cy="4" r="9" fill={hairColor} /><circle cx="15" cy="4" r="9" fill={hairColor} /></>}
      {hair === "wrap" && <><path d="M-20 10 C-24 -14 24 -14 20 10 C14 0 -14 0 -20 10Z" fill={C.sun} /><circle cx="14" cy="-8" r="8" fill={C.sun} /></>}
      {hair === "braids" && <><path d="M-19 14 C-22 -8 22 -8 19 14 C14 2 -14 2 -19 14Z" fill={hairColor} /><path d="M-17 14 L-20 44 M17 14 L20 44" stroke={hairColor} strokeWidth="6" strokeLinecap="round" /></>}
      {/* face */}
      <circle cx="-6" cy="15" r="1.8" fill={C.ink} /><circle cx="6" cy="15" r="1.8" fill={C.ink} />
      <path d="M-5 22 Q0 26 5 22" stroke={C.ink} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {glasses && <g stroke={C.ink} strokeWidth="1.6" fill="none"><circle cx="-6" cy="15" r="5" /><circle cx="6" cy="15" r="5" /><path d="M-1 15 H1" /></g>}
      {cap && <g><path d="M-26 -2 L0 -14 L26 -2 L0 10 Z" fill={C.ink} /><path d="M-12 3 V10 C-6 14 6 14 12 10 V3" fill={C.ink} /><path d="M24 -2 V14" stroke={C.sun} strokeWidth="2.5" /><circle cx="24" cy="15" r="3" fill={C.sun} /></g>}
    </g>
  );
}

function Plant({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 C-20 -20 -24 -44 -8 -60 C-2 -40 4 -24 0 0Z" fill={C.green5} />
      <path d="M0 0 C18 -18 30 -36 22 -58 C10 -42 2 -24 0 0Z" fill={C.green} />
      <path d="M0 0 C-4 -26 4 -46 0 -72 C10 -50 8 -24 0 0Z" fill={C.green2} />
      <path d="M-16 0 H16 L12 26 H-12 Z" fill={C.sun} />
    </g>
  );
}

function Doc({ x, y, r = 0, check, w = 46, tone = "#fff" }: { x: number; y: number; r?: number; check?: boolean; w?: number; tone?: string }) {
  const h = w * 1.28;
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <rect width={w} height={h} rx="6" fill={tone} stroke={C.line} strokeWidth="1.5" />
      <path d={`M8 12 H${w - 8} M8 22 H${w - 14} M8 32 H${w - 10}`} stroke={C.line} strokeWidth="3" strokeLinecap="round" />
      {check && <g><circle cx={w - 6} cy={h - 6} r="11" fill={C.green} /><path d={`M${w - 11} ${h - 6} l4 4 l7 -8`} stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
    </g>
  );
}

function Sparkles({ pts }: { pts: [number, number, number][] }) {
  return <>{pts.map(([x, y, s], i) => <path key={i} transform={`translate(${x} ${y}) scale(${s})`} d="M0 -10 C1 -2 2 -1 10 0 C2 1 1 2 0 10 C-1 2 -2 1 -10 0 C-2 -1 -1 -2 0 -10Z" fill={C.sun} />)}</>;
}

type IllProps = { className?: string; title?: string };
function Frame({ className, title, viewBox, children }: IllProps & { viewBox: string; children: React.ReactNode }) {
  return (
    <svg viewBox={viewBox} className={cn("h-auto w-full", className)} role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

/** Landing hero: a student and supervisor reviewing an approved chapter. */
export function HeroIllustration(p: IllProps) {
  return (
    <Frame {...p} viewBox="0 0 640 480" title={p.title ?? "A student and her supervisor celebrating an approved chapter"}>
      <rect width="640" height="480" rx="32" fill={C.cream2} />
      <circle cx="170" cy="150" r="150" fill={C.sun} />
      <circle cx="560" cy="430" r="140" fill={C.green2} />
      <path d="M0 380 C160 340 420 360 640 330 V480 H0Z" fill={C.green1} />
      {/* desk */}
      <rect x="120" y="318" width="420" height="16" rx="8" fill={C.green9} />
      <path d="M150 334 V440 M510 334 V440" stroke={C.green9} strokeWidth="12" strokeLinecap="round" />
      {/* laptop */}
      <path d="M250 318 L270 236 H400 L382 318Z" fill={C.ink} />
      <rect x="290" y="252" width="88" height="44" rx="4" fill={C.green} />
      <path d="M302 284 L318 270 L334 278 L362 260" stroke={C.sun} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="230" y="314" width="176" height="8" rx="4" fill="#2a312a" />
      <Doc x={430} y={252} r={8} check w={50} />
      <Doc x={404} y={268} r={-4} w={44} />
      <Plant x={160} y={292} s={1.05} />
      <Person x={318} y={170} s={1.15} skin={0} shirt={C.green} hair="puff" arm="hold" />
      <Person x={500} y={120} s={1.3} skin={2} shirt={C.ink} hair="short" arm="up" glasses />
      <Sparkles pts={[[560, 100, 1.2], [585, 140, 0.7], [230, 90, 0.8], [96, 260, 0.6]]} />
    </Frame>
  );
}

export function RoleStudent(p: IllProps) {
  return (
    <Frame {...p} viewBox="0 0 320 240" title={p.title ?? "A student uploading a chapter"}>
      <rect width="320" height="240" fill={C.sun1} />
      <circle cx="250" cy="60" r="70" fill={C.sun} />
      <path d="M0 200 C100 180 220 196 320 176 V240 H0Z" fill={C.green1} />
      <Person x={130} y={70} s={1} skin={1} shirt={C.green} hair="braids" arm="hold" />
      <rect x="100" y="146" width="66" height="44" rx="6" fill={C.ink} />
      <path d="M133 178 V158 M124 166 L133 157 L142 166" stroke={C.sun} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Doc x={210} y={110} r={10} check w={42} />
      <Plant x={46} y={196} s={0.8} />
    </Frame>
  );
}

export function RoleSupervisor(p: IllProps) {
  return (
    <Frame {...p} viewBox="0 0 320 240" title={p.title ?? "A supervisor approving work on a clipboard"}>
      <rect width="320" height="240" fill={C.green1} />
      <circle cx="70" cy="70" r="66" fill={C.green2} />
      <path d="M0 196 C110 176 220 200 320 180 V240 H0Z" fill={C.cream2} />
      <Person x={150} y={62} s={1.05} skin={2} shirt={C.ink} hair="short" arm="hold" glasses />
      <rect x="128" y="126" width="46" height="60" rx="6" fill="#fff" stroke={C.line} strokeWidth="2" />
      <rect x="140" y="120" width="22" height="10" rx="3" fill={C.sun} />
      <path d="M138 150 l6 6 l12 -12 M138 170 H164" stroke={C.green} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(232 70)"><circle r="26" fill={C.sun} /><path d="M-10 0 l7 7 l14 -14" stroke={C.ink} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>
    </Frame>
  );
}

export function RoleHod(p: IllProps) {
  return (
    <Frame {...p} viewBox="0 0 320 240" title={p.title ?? "A head of department reading a department chart"}>
      <rect width="320" height="240" fill={C.cream2} />
      <circle cx="260" cy="190" r="80" fill={C.sun} />
      <rect x="150" y="50" width="140" height="110" rx="12" fill="#fff" stroke={C.line} strokeWidth="2" />
      <rect x="170" y="110" width="18" height="34" rx="4" fill={C.green2} />
      <rect x="198" y="90" width="18" height="54" rx="4" fill={C.green5} />
      <rect x="226" y="72" width="18" height="72" rx="4" fill={C.green} />
      <rect x="254" y="100" width="18" height="44" rx="4" fill={C.sun} />
      <Person x={90} y={72} s={1.05} skin={4} shirt={C.green9} hair="wrap" arm="point" />
    </Frame>
  );
}

/** Sign-in side panel scene. */
export function AuthPanelIllustration(p: IllProps) {
  return (
    <Frame {...p} viewBox="0 0 480 520" title={p.title ?? "Two students high-fiving next to approved chapters"}>
      <rect width="480" height="520" rx="28" fill={C.green9} />
      <circle cx="380" cy="110" r="120" fill={C.green} />
      <circle cx="90" cy="420" r="110" fill="#0B4D24" />
      <circle cx="240" cy="180" r="96" fill={C.sun} />
      <Person x={170} y={170} s={1.35} skin={0} shirt={C.cream} hair="puff" arm="up" />
      <Person x={310} y={170} s={1.35} skin={3} shirt={C.sun3} hair="short" arm="up" flip />
      <Doc x={60} y={240} r={-10} check w={58} />
      <Doc x={370} y={300} r={12} check w={54} />
      <Sparkles pts={[[240, 120, 1.4], [120, 120, 0.8], [400, 230, 0.9], [70, 340, 0.7]]} />
    </Frame>
  );
}

/** Landing defence banner. */
export function DefenseDayIllustration(p: IllProps) {
  return (
    <Frame {...p} viewBox="0 0 900 360" title={p.title ?? "A student presenting at the project defence"}>
      <rect width="900" height="360" fill={C.sun} />
      <circle cx="720" cy="60" r="160" fill={C.sun3} />
      <path d="M0 300 C240 270 600 300 900 260 V360 H0Z" fill={C.green} />
      <rect x="560" y="70" width="230" height="150" rx="14" fill="#fff" />
      <path d="M590 190 L630 150 L670 170 L740 110" stroke={C.green} strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="740" cy="110" r="10" fill={C.sun} stroke={C.green} strokeWidth="4" />
      <Person x={500} y={120} s={1.25} skin={1} shirt={C.green9} hair="short" arm="point" cap />
      <rect x="600" y="250" width="240" height="18" rx="9" fill={C.green9} />
      <Person x={660} y={180} s={0.8} skin={2} shirt={C.ink} glasses />
      <Person x={760} y={180} s={0.8} skin={4} shirt={C.cream} hair="wrap" />
    </Frame>
  );
}

function Spot({ children, tone = C.sun, title }: { children: React.ReactNode; tone?: string; title: string }) {
  return (
    <Frame viewBox="0 0 200 150" title={title} className="mx-auto w-40">
      <ellipse cx="100" cy="132" rx="70" ry="10" fill={C.line} />
      <circle cx="100" cy="72" r="58" fill={tone} opacity=".9" />
      {children}
    </Frame>
  );
}

export const EmptyNoSubmissions = () => (
  <Spot title="An empty folder waiting for a first upload" tone={C.sun1}>
    <path d="M52 62 a8 8 0 0 1 8-8 h26 l10 10 h44 a8 8 0 0 1 8 8 v50 a8 8 0 0 1-8 8 H60 a8 8 0 0 1-8-8z" fill={C.sun} />
    <path d="M52 78 h96 v42 a8 8 0 0 1-8 8 H60 a8 8 0 0 1-8-8z" fill={C.sun3} />
    <path d="M126 30 L162 18 L150 52 L141 41 Z" fill="#fff" stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
    <path d="M100 100 v-16 m-7 7 l7-7 l7 7" stroke={C.ink} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Spot>
);
export const EmptyAllCaughtUp = () => (
  <Spot title="Everything is done" tone={C.green1}>
    <circle cx="100" cy="74" r="34" fill={C.green} />
    <path d="M84 74 l11 11 l22-22" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Sparkles pts={[[150, 40, 0.9], [52, 50, 0.6], [146, 108, 0.5]]} />
  </Spot>
);
export const EmptyNoNotifications = () => (
  <Spot title="A quiet bell with nothing new" tone={C.sun1}>
    <path d="M76 92 c0-30 8-44 24-44 s24 14 24 44 l8 10 H68z" fill={C.sun} stroke={C.ink} strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M92 108 a8 8 0 0 0 16 0" stroke={C.ink} strokeWidth="2.5" fill="none" />
    <text x="128" y="50" fontFamily="sans-serif" fontWeight="800" fontSize="16" fill={C.green}>z</text>
    <text x="140" y="36" fontFamily="sans-serif" fontWeight="800" fontSize="12" fill={C.green}>z</text>
  </Spot>
);
export const EmptySearch = () => (
  <Spot title="A magnifying glass finding nothing" tone={C.green1}>
    <circle cx="92" cy="68" r="26" fill="#fff" stroke={C.green} strokeWidth="8" />
    <path d="M112 88 l22 22" stroke={C.green} strokeWidth="10" strokeLinecap="round" />
    <path d="M84 62 q8-8 16 0" stroke={C.line} strokeWidth="4" fill="none" strokeLinecap="round" />
  </Spot>
);
export const NotFoundIllustration = () => (
  <Frame viewBox="0 0 320 200" title="A student looking at a signpost" className="mx-auto w-72">
    <ellipse cx="160" cy="186" rx="120" ry="10" fill={C.line} />
    <circle cx="200" cy="90" r="80" fill={C.sun} />
    <path d="M220 60 V184" stroke={C.green9} strokeWidth="8" strokeLinecap="round" />
    <path d="M220 66 h56 l14 14 l-14 14 h-56z" fill={C.green} />
    <path d="M220 104 h-52 l-14 14 l14 14 h52z" fill="#fff" stroke={C.line} strokeWidth="2" />
    <Person x={110} y={70} s={0.95} skin={3} shirt={C.green5} hair="puff" arm="point" />
  </Frame>
);
