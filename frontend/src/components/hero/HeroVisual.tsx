import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type HeroVisualProps = {
  memberName?: string;
  memberId?: string;
  className?: string;
};

type FloatingChipProps = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  className: string;
};

const rings = [
  "w-[54%] border-teal/40",
  "w-[78%] border-teal/25 [animation-delay:-1.5s]",
  "w-[102%] border-teal/15 [animation-delay:-3s]",
  "hidden w-[126%] border-teal/10 [animation-delay:-4.5s] sm:block",
];

const chips: FloatingChipProps[] = [
  {
    title: "Patient Vault",
    subtitle: "Your data, stored securely",
    icon: <ShieldCheck className="size-5" aria-hidden="true" />,
    className: "left-0 top-[3%] sm:left-[2%]",
  },
  {
    title: "NFC tap",
    subtitle: "Identity verified in a moment",
    icon: <NfcIcon />,
    className: "bottom-[3%] right-0 [animation-delay:-2s] sm:right-[-2%]",
  },
  {
    title: "Precision manufacturing",
    subtitle: "Dental technology",
    icon: <ToothIcon />,
    className: "bottom-0 left-0 [animation-delay:-4s] max-sm:hidden",
  },
];

const toothPath =
  "M0 -20 C-12 -26 -22 -18 -20 -4 C-19 6 -14 10 -13 22 C-12 30 -6 30 -5 20 C-4 14 4 14 5 20 C6 30 12 30 13 22 C14 10 19 6 20 -4 C22 -18 12 -26 0 -20 Z";

function NfcIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M8 6c3.5 3.5 3.5 8.5 0 12" />
      <path d="M13 3c5.5 5 5.5 13 0 18" />
    </svg>
  );
}

function ToothIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeLinejoin="round" aria-hidden="true">
      <g transform="translate(12 12.5) scale(0.42)" strokeWidth="4.8">
        <path d={toothPath} />
      </g>
    </svg>
  );
}

function FloatingChip({ title, subtitle, icon, className }: FloatingChipProps) {
  return (
    <div
      className={cn(
        "absolute z-20 flex w-max items-center gap-3 rounded-[18px] bg-white py-2.5 pl-2.5 pr-4 shadow-soft sm:py-3 sm:pl-3 sm:pr-5",
        "motion-safe:animate-chip-float",
        className,
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pale-cyan text-teal sm:size-10">{icon}</span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-bold text-navy">{title}</span>
        <span className="text-xs text-body-text">{subtitle}</span>
      </span>
    </div>
  );
}

function MembershipCard({ name, id }: { name: string; id: string }) {
  return (
    <svg viewBox="0 0 460 290" className="block h-full w-full" role="img" aria-label="MedCard NFC membership card">
      <defs>
        <clipPath id="medcard-card-clip">
          <rect width="460" height="290" rx="28" />
        </clipPath>
      </defs>
      <g clipPath="url(#medcard-card-clip)">
        <rect width="460" height="290" className="fill-mist" />
        <path d="M0 205 C110 165 230 125 350 135 C410 140 440 155 460 165 L460 290 L0 290 Z" className="fill-sky" />
        <path d="M0 240 C130 215 270 175 460 190 L460 290 L0 290 Z" className="fill-mid-blue" />
        <path d="M110 290 C250 230 370 215 460 220 L460 290 Z" className="fill-navy" />
      </g>

      <g transform="translate(25 17) scale(0.52)">
        <g className="stroke-navy" strokeWidth="9" strokeLinecap="round">
          <line x1="50" y1="50" x2="50" y2="14" />
          <line x1="50" y1="50" x2="50" y2="86" />
          <line x1="50" y1="50" x2="14" y2="50" />
          <line x1="50" y1="50" x2="86" y2="50" />
        </g>
        <g className="fill-white stroke-teal" strokeWidth="6">
          <circle cx="50" cy="14" r="9" />
          <circle cx="50" cy="86" r="9" />
          <circle cx="14" cy="50" r="9" />
          <circle cx="86" cy="50" r="9" />
        </g>
        <circle cx="50" cy="50" r="15" className="fill-teal" />
        <path d="M41 50 H46 L48.5 44 L51.5 56 L54 50 H59" fill="none" className="stroke-white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <text x="90" y="53" fontSize="34" fontWeight="700">
        <tspan className="fill-navy">Med</tspan>
        <tspan className="fill-teal">Card</tspan>
      </text>
      <text x="91" y="75" fontSize="12" letterSpacing="2.4" className="fill-strong-text">
        Technology Solutions
      </text>

      <rect x="25" y="103" width="46" height="36" rx="6" className="fill-chip-gold stroke-gold-dark" strokeWidth="1.5" />
      <line x1="25" y1="121" x2="71" y2="121" className="stroke-gold-dark" strokeWidth="1.2" />
      <line x1="48" y1="103" x2="48" y2="139" className="stroke-gold-dark" strokeWidth="1.2" />

      <text x="25" y="167" fontSize="18" fontWeight="700" className="fill-navy">
        {name}
      </text>
      <text x="25" y="189" fontSize="14" letterSpacing="1.5" className="fill-strong-text">
        {id}
      </text>

      <g fill="none" className="stroke-white" strokeWidth="4.5" strokeLinecap="round">
        <path d="M388 229 C393 237 393 247 388 255" />
        <path d="M397 221 C405 235 405 249 397 263" />
        <path d="M406 213 C417 232 417 252 406 271" />
      </g>
    </svg>
  );
}

export function HeroVisual({ memberName = "Amani Uwase", memberId = "MC-RW-0000000", className }: HeroVisualProps) {
  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-[420px] sm:max-w-[520px] lg:max-w-[560px]", className)}>
      <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
        {rings.map((ring) => (
          <div key={ring} className={cn("col-start-1 row-start-1 aspect-square rounded-full border-2 motion-safe:animate-ring-pulse", ring)} />
        ))}
      </div>

      <div className="absolute inset-0 z-10 grid place-items-center">
        <div className="aspect-[460/290] w-[82%] -rotate-[4deg] rounded-[28px] bg-white shadow-card sm:-rotate-[8deg] motion-safe:animate-card-float">
          <div className="h-full w-full overflow-hidden rounded-[28px]">
            <MembershipCard name={memberName} id={memberId} />
          </div>
        </div>
      </div>

      {chips.map((chip) => (
        <FloatingChip key={chip.title} {...chip} />
      ))}
    </div>
  );
}
