import type { CSSProperties, ReactNode } from "react";

/* ------------------------- 玻璃瓶（主视觉） ------------------------- */

export function GlassBottle({
  className,
  withPaper = true,
}: {
  className?: string;
  withPaper?: boolean;
}) {
  return (
    <svg viewBox="0 0 120 210" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="45%" stopColor="#dcebff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#aecbf5" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="corkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9c79c" />
          <stop offset="100%" stopColor="#cfa377" />
        </linearGradient>
      </defs>

      {/* 瓶身 */}
      <path
        d="M52 30 L68 30 L68 52 C68 62 84 70 84 92 L84 168 C84 188 73 200 60 200 C47 200 36 188 36 168 L36 92 C36 70 52 62 52 52 Z"
        fill="url(#glassGrad)"
        stroke="#7fa2d8"
        strokeOpacity="0.6"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* 瓶内海水 */}
      <path
        d="M36 152 C44 148 54 154 60 151 C68 148 78 150 84 149 L84 168 C84 188 73 200 60 200 C47 200 36 188 36 168 Z"
        fill="#9cc4f0"
        opacity="0.55"
      />
      {/* 信纸 */}
      {withPaper && (
        <g transform="rotate(-8 60 138)">
          <rect
            x="45"
            y="112"
            width="31"
            height="46"
            rx="3"
            fill="#fff6e3"
            stroke="#e5d0a8"
            strokeWidth="1.5"
          />
          <line x1="51" y1="122" x2="70" y2="122" stroke="#d9c39a" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="51" y1="130" x2="66" y2="130" stroke="#d9c39a" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="51" y1="138" x2="70" y2="138" stroke="#d9c39a" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="51" y1="146" x2="62" y2="146" stroke="#d9c39a" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}
      {/* 高光 */}
      <path
        d="M44 80 C42 102 42 148 47 172"
        stroke="#ffffff"
        strokeOpacity="0.6"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M76 88 C78 104 78 122 77 136"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* 闪光 */}
      <path d="M77 70 L80 77 L77 84 L74 77 Z" fill="#ffffff" opacity="0.85" />
      {/* 瓶口与木塞 */}
      <rect x="49" y="22" width="22" height="9" rx="3" fill="#c7dcf7" stroke="#7fa2d8" strokeOpacity="0.5" strokeWidth="1.6" />
      <rect x="47" y="6" width="26" height="18" rx="5" fill="url(#corkGrad)" stroke="#b98d5f" strokeWidth="1.6" />
      <line x1="50" y1="12" x2="70" y2="12" stroke="#b98d5f" strokeWidth="1.2" opacity="0.7" />
      {/* 瓶口麻绳 */}
      <path d="M50 34 Q60 38 70 34" stroke="#c9a06f" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ----------------------------- 迷你漂流瓶 ----------------------------- */

export function MiniBottle({ className, paper = "#ffe9c9" }: { className?: string; paper?: string }) {
  return (
    <svg viewBox="0 0 28 46" className={className} aria-hidden="true">
      <path
        d="M11 9 L17 9 L17 14 C17 17 23 19.5 23 26 L23 36 C23 42 19 44.5 14 44.5 C9 44.5 5 42 5 36 L5 26 C5 19.5 11 17 11 14 Z"
        fill="#ffffff"
        fillOpacity="0.6"
        stroke="#8fb0dd"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <rect x="9.6" y="23" width="9" height="13" rx="2" fill={paper} transform="rotate(-6 14 29)" />
      <rect x="10" y="2.5" width="8" height="7" rx="2" fill="#d9b38c" stroke="#c29a72" strokeWidth="1" />
      <path d="M8.5 16 C8.3 20 8.3 30 9.5 36" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ------------------------------- 海浪 ------------------------------- */

const WAVE_PATH =
  "M0 55 C 120 20 240 20 360 55 C 480 90 600 90 720 55 C 840 20 960 20 1080 55 C 1200 90 1320 90 1440 55 L1440 110 L0 110 Z";

function WaveStrip({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 1440 110" preserveAspectRatio="none" className="h-full w-1/2 shrink-0">
      <path d={WAVE_PATH} fill={fill} />
    </svg>
  );
}

export function Waves() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[26vh] min-h-[150px] md:h-[24vh]" aria-hidden="true">
      {/* 后层 */}
      <div className="absolute inset-x-0 top-0 h-full opacity-70">
        <div className="anim-wave flex h-full w-[200%]" style={{ animationDuration: "26s" }}>
          <WaveStrip fill="#bcd7f4" />
          <WaveStrip fill="#bcd7f4" />
        </div>
      </div>
      {/* 中层 */}
      <div className="absolute inset-x-0 top-[26%] h-full opacity-85">
        <div
          className="anim-wave flex h-full w-[200%]"
          style={{ animationDuration: "17s", animationDirection: "reverse" }}
        >
          <WaveStrip fill="#9dc0ec" />
          <WaveStrip fill="#9dc0ec" />
        </div>
      </div>
      {/* 前层 */}
      <div className="absolute inset-x-0 top-[52%] h-full">
        <div className="anim-wave flex h-full w-[200%]" style={{ animationDuration: "11s" }}>
          <WaveStrip fill="#7fa9e2" />
          <WaveStrip fill="#7fa9e2" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- 云朵 ------------------------------- */

export function Cloud({
  className,
  style,
  scale = 1,
}: {
  className?: string;
  style?: CSSProperties;
  scale?: number;
}) {
  return (
    <div className={`anim-cloud absolute ${className ?? ""}`} style={style} aria-hidden="true">
      <div
        className="relative rounded-full bg-white/70 blur-[6px]"
        style={{ width: 150 * scale, height: 44 * scale }}
      >
        <div
          className="absolute rounded-full bg-white/80"
          style={{ width: 70 * scale, height: 40 * scale, left: 22 * scale, top: -18 * scale, filter: "blur(4px)" }}
        />
        <div
          className="absolute rounded-full bg-white/70"
          style={{ width: 54 * scale, height: 32 * scale, left: 72 * scale, top: -12 * scale, filter: "blur(4px)" }}
        />
      </div>
    </div>
  );
}

/* ------------------------------- 星光 ------------------------------- */

export function SparkleField() {
  const spots: { top: string; left: string; delay: string; size: number }[] = [
    { top: "12%", left: "12%", delay: "0s", size: 10 },
    { top: "20%", left: "78%", delay: "1.2s", size: 12 },
    { top: "34%", left: "6%", delay: "2s", size: 8 },
    { top: "9%", left: "56%", delay: "0.6s", size: 9 },
    { top: "28%", left: "90%", delay: "1.7s", size: 10 },
    { top: "42%", left: "16%", delay: "2.6s", size: 7 },
    { top: "16%", left: "34%", delay: "3.1s", size: 8 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {spots.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="anim-twinkle absolute text-white"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay, filter: "drop-shadow(0 0 4px rgba(255,255,255,0.9))" }}
        >
          <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2Z" fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}

/* ------------------------------ 漂浮爱心 ------------------------------ */

export interface FloatingHeart {
  id: string;
  left: number; // vw
  hue: "rose" | "warm";
}

export function FloatingHearts({ hearts }: { hearts: FloatingHeart[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {hearts.map((h) => (
        <svg
          key={h.id}
          viewBox="0 0 24 24"
          className={`heart-float absolute bottom-[30%] ${h.hue === "rose" ? "text-blush-400" : "text-warm-400"}`}
          style={{ left: `${h.left}%`, width: 22 + Math.random() * 14, filter: "drop-shadow(0 2px 6px rgba(244,120,150,0.35))" }}
        >
          <path
            d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z"
            fill="currentColor"
          />
        </svg>
      ))}
    </div>
  );
}

/* ------------------------------ 水花与涟漪 ------------------------------ */

export function Splash({ className }: { className?: string }) {
  const drops = [
    { dx: -34, dy: -52, delay: 0 },
    { dx: -12, dy: -70, delay: 0.05 },
    { dx: 14, dy: -64, delay: 0.02 },
    { dx: 34, dy: -46, delay: 0.08 },
    { dx: 0, dy: -84, delay: 0.1 },
  ];
  return (
    <div className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      {drops.map((d, i) => (
        <span
          key={i}
          className="anim-splash-drop absolute h-2 w-2 rounded-full bg-sea-200"
          style={{ "--dx": `${d.dx}px`, "--dy": `${d.dy}px`, animationDelay: `${d.delay}s` } as CSSProperties}
        />
      ))}
      <span className="anim-ripple absolute -left-7 -top-3 h-14 w-14 rounded-full border-2 border-white/80" />
      <span
        className="anim-ripple absolute -left-10 -top-5 h-20 w-20 rounded-full border-2 border-white/50"
        style={{ animationDelay: "0.15s" }}
      />
    </div>
  );
}

/* ------------------------------- 图标 ------------------------------- */

function IconBase({
  children,
  className,
  filled = false,
}: {
  children: ReactNode;
  className?: string;
  filled?: boolean;
}) {
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

type IconProps = { className?: string };

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

export const IconLighthouse = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M10 9h4l1.5 12h-7Z" />
    <path d="M9 9l3-5 3 5Z" />
    <path d="M7 21h10" />
    <path d="M6 7 3 5.5" />
    <path d="M18 7l3-1.5" />
    <path d="M12 13v.01" />
  </IconBase>
);

export const IconStar = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1Z" />
  </IconBase>
);

export const IconBottle = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M10 2h4" />
    <path d="M10 2v4c0 1.5 4 3 4 7v6a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3v-6c0-4 4-5.5 4-7V2Z" transform="translate(2 0)" />
  </IconBase>
);

export const IconChevronDown = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="m6 9 6 6 6-6" />
  </IconBase>
);

export const IconClose = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </IconBase>
);

export const IconLock = ({ className }: IconProps) => (
  <IconBase className={className}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
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

export const IconAlert = ({ className }: IconProps) => (
  <IconBase className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
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

/* ----------------------------- 徽章图标映射 ----------------------------- */

export const BADGE_ICONS: Record<string, (p: IconProps) => ReactNode> = {
  shell: IconShell,
  sail: IconSail,
  lighthouse: IconLighthouse,
  heart: IconHeart,
  wave: IconWaves,
  star: IconStar,
};
