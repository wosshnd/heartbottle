import type { ReactNode } from "react";
import type { Bottle } from "../lib/types";
import { SKIN_COLORS } from "../lib/badges";

/* ------------------------------ 瓶子图形 ------------------------------ */

export function GlassBottle({ className, withPaper = true }: { className?: string; withPaper?: boolean }) {
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
      <path
        d="M52 30 L68 30 L68 52 C68 62 84 70 84 92 L84 168 C84 188 73 200 60 200 C47 200 36 188 36 168 L36 92 C36 70 52 62 52 52 Z"
        fill="url(#glassGrad)"
        stroke="#7fa2d8"
        strokeOpacity="0.6"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M36 152 C44 148 54 154 60 151 C68 148 78 150 84 149 L84 168 C84 188 73 200 60 200 C47 200 36 188 36 168 Z"
        fill="#9cc4f0"
        opacity="0.55"
      />
      {withPaper && (
        <g transform="rotate(-8 60 138)">
          <rect x="45" y="112" width="31" height="46" rx="3" fill="#fff6e3" stroke="#e5d0a8" strokeWidth="1.5" />
          <line x1="51" y1="122" x2="70" y2="122" stroke="#d9c39a" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="51" y1="130" x2="66" y2="130" stroke="#d9c39a" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="51" y1="138" x2="70" y2="138" stroke="#d9c39a" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="51" y1="146" x2="62" y2="146" stroke="#d9c39a" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}
      <rect x="50" y="12" width="20" height="16" rx="3" fill="url(#corkGrad)" />
      <ellipse cx="60" cy="13" rx="10" ry="3" fill="#d9b386" />
      <path d="M45 78 C44 100 44 130 46 158" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function MiniBottle({ className, skin = "skin-default" }: { className?: string; skin?: string }) {
  const c = SKIN_COLORS[skin] ?? SKIN_COLORS["skin-default"];
  return (
    <svg viewBox="0 0 64 96" className={className} aria-hidden="true">
      {c.glow && <ellipse cx="32" cy="52" rx="26" ry="34" fill={c.glow} opacity="0.35" />}
      <path
        d="M27 16 L37 16 L37 27 C37 32 46 36 46 47 L46 78 C46 88 40 93 32 93 C24 93 18 88 18 78 L18 47 C18 36 27 32 27 27 Z"
        fill="#dcebff"
        fillOpacity="0.55"
        stroke="#8fb0dc"
        strokeWidth="2"
      />
      <path d="M18 68 C24 65 30 69 32 67 C36 65 42 66 46 65 L46 78 C46 88 40 93 32 93 C24 93 18 88 18 78 Z" fill="#9cc4f0" opacity="0.5" />
      <g transform="rotate(-10 32 58)">
        <rect x="25" y="48" width="15" height="22" rx="2" fill={c.paper} stroke="#e0c69b" strokeWidth="1" />
        <line x1="28" y1="54" x2="37" y2="54" stroke="#d3b98d" strokeWidth="1" strokeLinecap="round" />
        <line x1="28" y1="59" x2="35" y2="59" stroke="#d3b98d" strokeWidth="1" strokeLinecap="round" />
        <line x1="28" y1="64" x2="37" y2="64" stroke="#d3b98d" strokeWidth="1" strokeLinecap="round" />
      </g>
      <rect x="26" y="7" width="12" height="8" rx="2" fill="#d9b386" />
      <path d="M23 40 C22.5 52 22.5 64 23.5 74" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ------------------------------ 海浪层 ------------------------------ */

function WaveLayer({ dur, h, color, opacity, reverse }: { dur: number; h: number; color: string; opacity: number; reverse?: boolean }) {
  return (
    <div className="absolute inset-x-0 bottom-0" style={{ height: h, opacity }} aria-hidden="true">
      <div className="anim-wave flex h-full w-[200%]" style={{ animationDuration: `${dur}s`, animationDirection: reverse ? "reverse" : undefined }}>
        {[0, 1].map((k) => (
          <svg key={k} viewBox="0 0 1200 120" preserveAspectRatio="none" className="h-full w-1/2 shrink-0">
            <path d="M0,60 C200,105 400,15 600,60 C800,105 1000,15 1200,60 L1200,120 L0,120 Z" fill={color} />
          </svg>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ 星光 ------------------------------ */

const STARS = Array.from({ length: 64 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  top: (i * 23 + 7) % 52,
  delay: (i % 7) * 0.55,
  dur: 2.4 + (i % 5) * 0.5,
  size: 2 + (i % 3),
}));

/* ------------------------------ 海洋场景 ------------------------------ */

export function OceanScene({
  theme,
  sea,
  bottles,
  bottleCountToday,
  repliesToday,
  onBottleClick,
  children,
  className,
}: {
  theme: string;
  sea: [string, string];
  bottles: Bottle[];
  bottleCountToday: number;
  repliesToday: number;
  onBottleClick?: (b: Bottle) => void;
  children?: ReactNode;
  className?: string;
}) {
  const night = theme === "night";
  const amp = Math.min(1, bottleCountToday / 12);
  const starCount = Math.min(14 + repliesToday * 3, 64);

  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{ background: "linear-gradient(180deg, var(--sky1) 0%, var(--sky2) 52%, var(--sky3) 100%)" }}
    >
      {/* 星与月 */}
      <div className="absolute inset-0" style={{ opacity: "var(--star-op)" }} aria-hidden="true">
        {STARS.slice(0, starCount).map((s, i) => (
          <span
            key={i}
            className="anim-twinkle absolute rounded-full bg-white"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
              boxShadow: "0 0 6px 1px rgba(255,255,255,0.7)",
            }}
          />
        ))}
      </div>

      {/* 日 / 月 */}
      <div
        className="anim-sun absolute right-[12%] top-[12%] h-16 w-16 rounded-full md:h-20 md:w-20"
        style={{
          background: night ? "radial-gradient(circle at 38% 35%, #f4f6ff, #c9d4f2 70%)" : "radial-gradient(circle at 38% 35%, #fff3d9, #ffd98f 75%)",
          boxShadow: `0 0 60px 18px var(--glow)`,
        }}
        aria-hidden="true"
      >
        {night && <span className="absolute left-3 top-4 h-3 w-3 rounded-full bg-[#aab8e0] opacity-70" />}
      </div>

      {/* 云 */}
      {!night && (
        <div className="absolute inset-0" aria-hidden="true">
          <div className="anim-cloud absolute top-[16%] h-8 w-40 rounded-full bg-white/70 blur-[6px]" style={{ animationDuration: "75s" }} />
          <div className="anim-cloud absolute top-[30%] h-6 w-28 rounded-full bg-white/55 blur-[5px]" style={{ animationDuration: "95s", animationDelay: "-30s" }} />
          <div className="anim-cloud absolute top-[8%] h-7 w-32 rounded-full bg-white/60 blur-[6px]" style={{ animationDuration: "110s", animationDelay: "-60s" }} />
        </div>
      )}

      {/* 海鸥 */}
      {!night && (
        <svg viewBox="0 0 40 14" className="anim-gull absolute top-[24%] h-3.5 w-10 text-ink-soft" style={{ animationDuration: "34s" }} aria-hidden="true">
          <path d="M2 10 Q10 2 20 9 Q30 2 38 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </svg>
      )}

      {/* 气泡 */}
      <div className="absolute inset-x-0 bottom-10" aria-hidden="true">
        {[18, 46, 74].map((x, i) => (
          <span
            key={i}
            className="anim-bubble absolute h-2.5 w-2.5 rounded-full border border-white/70 bg-white/20"
            style={{ left: `${x}%`, animationDelay: `${i * 1.6}s` }}
          />
        ))}
      </div>

      {/* 漂浮的漂流瓶（与真实数据联动，可点击打捞） */}
      {bottles.slice(0, 5).map((b, i) => (
        <button
          key={b.id}
          onClick={() => onBottleClick?.(b)}
          aria-label="打捞这个漂流瓶"
          className="anim-mini-bob absolute z-10 w-9 cursor-pointer transition-transform hover:scale-110 md:w-11"
          style={{
            left: `${10 + ((i * 19) % 68)}%`,
            bottom: `${86 + (i % 3) * 26}px`,
            animationDelay: `${i * 0.8}s`,
          }}
        >
          <MiniBottle className="w-full drop-shadow-[0_8px_14px_rgba(30,60,110,0.35)]" skin={b.skin} />
        </button>
      ))}

      {/* 三层海浪：高度随今日瓶子数起伏 */}
      <WaveLayer dur={17} h={72 + amp * 22} color={sea[0]} opacity={0.45} />
      <WaveLayer dur={12} h={92 + amp * 26} color={sea[0]} opacity={0.75} reverse />
      <WaveLayer dur={8.5} h={110 + amp * 30} color={sea[1]} opacity={1} />

      {/* 前景泡沫线 */}
      <div className="absolute inset-x-0 bottom-0 h-2 bg-white/15" aria-hidden="true" />

      {/* 覆盖层内容 */}
      {children && <div className="absolute inset-0 z-20">{children}</div>}
    </div>
  );
}
