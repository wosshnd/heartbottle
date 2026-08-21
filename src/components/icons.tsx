import type { ReactNode } from "react";

type IconProps = { className?: string };

function IconBase({ children, className, filled = false }: IconProps & { children: ReactNode; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconHeart = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
  </IconBase>
);

export const IconHeartFilled = ({ className }: IconProps) => (
  <IconBase className={className} filled>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
  </IconBase>
);

export const IconSparkle = ({ className }: IconProps) => (
  <IconBase className={className} filled>
    <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2Z" />
  </IconBase>
);

export const IconSend = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </IconBase>
);

export const IconWaves = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
  </IconBase>
);

export const IconShell = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M12 4c-5 0-8 4.5-8 9 0 3.9 3.6 7 8 7s8-3.1 8-7c0-4.5-3-9-8-9Z" />
    <path d="M12 20V4" />
    <path d="M12 20 5.5 6.5" />
    <path d="M12 20 18.5 6.5" />
  </IconBase>
);

export const IconSail = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M22 18H2a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4Z" />
    <path d="M21 14 10 2 3 14h18Z" />
    <path d="M12 2v16" />
  </IconBase>
);

export const IconStar = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1Z" />
  </IconBase>
);

export const IconSun = ({ className }: IconProps) => (
  <IconBase className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.9 4.9 1.4 1.4" />
    <path d="m17.7 17.7 1.4 1.4" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.3 17.7-1.4 1.4" />
    <path d="m19.1 4.9-1.4 1.4" />
  </IconBase>
);

export const IconBottle = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M10 2h4" />
    <path d="M12 2v4c0 1.5 4 3 4 7v6a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3v-6c0-4 4-5.5 4-7V2Z" />
  </IconBase>
);

export const IconClose = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </IconBase>
);

export const IconAlert = ({ className }: IconProps) => (
  <IconBase className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </IconBase>
);

export const IconShield = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </IconBase>
);

export const IconPhone = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.8.7a2 2 0 0 1 1.7 2Z" />
  </IconBase>
);

export const IconWind = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
    <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
    <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
  </IconBase>
);

export const IconHome = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    <path d="M9 22V12h6v10" />
  </IconBase>
);

export const IconPlus = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </IconBase>
);

export const IconUser = ({ className }: IconProps) => (
  <IconBase className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
  </IconBase>
);

export const IconFlag = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M4 22V4c4-2 8 2 12 0v10c-4 2-8-2-12 0" />
  </IconBase>
);

export const IconClock = ({ className }: IconProps) => (
  <IconBase className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </IconBase>
);

export const IconRefresh = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M21 12a9 9 0 1 1-2.6-6.3" />
    <path d="M21 3v6h-6" />
  </IconBase>
);

export const IconLock = ({ className }: IconProps) => (
  <IconBase className={className}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </IconBase>
);

export const IconGift = ({ className }: IconProps) => (
  <IconBase className={className}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
  </IconBase>
);

export function Spinner({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`anim-spin-soft ${className ?? ""}`} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export const BADGE_ICONS: Record<string, (p: IconProps) => ReactNode> = {
  sail: IconSail,
  shell: IconShell,
  wave: IconWaves,
  star: IconStar,
  heart: IconHeart,
  sun: IconSun,
};
