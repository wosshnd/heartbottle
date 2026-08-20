import { useEffect, useMemo, useRef, useState } from "react";
import {
  BADGES,
  computeWarmIndex,
  loadBottles,
  loadStats,
  saveBottles,
  saveStats,
  uid,
  warmthLabel,
  type Bottle,
  type LifeStats,
} from "./lib/bottle";
import { PickModal, ThrowModal } from "./components/modals";
import {
  BADGE_ICONS,
  Cloud,
  GlassBottle,
  IconHeart,
  IconHeartFilled,
  IconLighthouse,
  IconLock,
  IconSail,
  IconSparkle,
  IconWaves,
  MiniBottle,
  SparkleField,
  Splash,
  Waves,
} from "./components/decor";

type ModalKind = "throw" | "pick" | null;
type ThrowAnim = "idle" | "flying" | "splash";

interface Toast {
  id: number;
  kind: "success" | "info" | "warm";
  msg: string;
}

function Seagull({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 40 16"
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      fill="none"
      stroke="#5a6c96"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M2 12 C8 4 14 4 20 10 C26 4 32 4 38 12" opacity="0.75" />
    </svg>
  );
}

function WarmRing({ value }: { value: number }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1100;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={R} fill="none" stroke="#e3e9f6" strokeWidth="11" />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - display / 100)}
          style={{ transition: "stroke-dashoffset 0.2s linear" }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7fa9e2" />
            <stop offset="60%" stopColor="#fbb98a" />
            <stop offset="100%" stopColor="#fb9cb1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {value === 0 ? (
          <>
            <IconWaves className="h-6 w-6 text-sea-400" />
            <span className="mt-1 text-[11px] font-medium text-ink-soft">等待第一份温暖</span>
          </>
        ) : (
          <>
            <span className="font-display text-3xl text-ink-deep">{display}</span>
            <span className="text-[11px] text-ink-soft">温暖指数</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [bottles, setBottles] = useState<Bottle[]>(() => loadBottles());
  const [stats, setStats] = useState<LifeStats>(() => loadStats());
  const [modalOpen, setModalOpen] = useState<ModalKind>(null);
  const [throwAnim, setThrowAnim] = useState<ThrowAnim>("idle");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  useEffect(() => saveBottles(bottles), [bottles]);
  useEffect(() => saveStats(stats), [stats]);

  /* 滚动显现 */
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const warmIndex = useMemo(() => computeWarmIndex(stats), [stats]);
  const level = warmthLabel(warmIndex);
  const totalReplies = useMemo(() => bottles.reduce((n, b) => n + b.replies.length, 0), [bottles]);
  const totalWarmLikes = useMemo(
    () => bottles.reduce((n, b) => n + b.replies.reduce((m, r) => m + r.likes, 0), 0),
    [bottles]
  );

  const showToast = (kind: Toast["kind"], msg: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, kind, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  };

  /* ---------------- 业务动作 ---------------- */

  const handleSend = (content: string, mood?: string) => {
    const bottle: Bottle = {
      id: uid(),
      content,
      mood,
      timestamp: Date.now(),
      likes: 0,
      replies: [],
    };
    setBottles((prev) => [bottle, ...prev]);
    setStats((s) => ({ ...s, thrownCount: s.thrownCount + 1 }));
    setModalOpen(null);
    setThrowAnim("flying");
  };

  const handleSendReply = (bottleId: string, content: string, caring = false) => {
    setBottles((prev) =>
      prev.map((b) =>
        b.id === bottleId
          ? {
              ...b,
              replies: [
                ...b.replies,
                { id: uid(), content, timestamp: Date.now(), likes: 0, likedByMe: false, caring },
              ],
            }
          : b
      )
    );
    showToast("warm", caring ? "关怀寄语已随海浪送达 💙" : "你的温暖已送达 💛");
  };

  const handleLikeReply = (bottleId: string, replyId: string) => {
    let delta = 0;
    setBottles((prev) =>
      prev.map((b) =>
        b.id === bottleId
          ? {
              ...b,
              replies: b.replies.map((r) => {
                if (r.id !== replyId) return r;
                delta = r.likedByMe ? -1 : 1;
                return { ...r, likedByMe: !r.likedByMe, likes: Math.max(0, r.likes + (r.likedByMe ? -1 : 1)) };
              }),
            }
          : b
      )
    );
    setTimeout(() => {
      if (delta !== 0) setStats((s) => ({ ...s, receivedLikes: Math.max(0, s.receivedLikes + delta) }));
    }, 0);
  };

  const handleHug = (bottleId: string) => {
    setBottles((prev) => prev.map((b) => (b.id === bottleId ? { ...b, likes: b.likes + 1 } : b)));
  };

  const switchToThrow = () => {
    setModalOpen(null);
    setTimeout(() => setModalOpen("throw"), 260);
  };

  const seaMini = bottles.slice(0, 3);
  const badgeStates = BADGES.map((b) => ({ ...b, on: b.unlocked(bottles, stats) }));
  const unlockedCount = badgeStates.filter((b) => b.on).length;

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* ============ 天光氛围层 ============ */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#e7f1fe] via-[#e2eafc] to-[#ece9f9]" />
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#ffe9c9]/70 blur-3xl" />
        <div className="absolute -right-20 top-40 h-80 w-80 rounded-full bg-[#e4dcfb]/80 blur-3xl" />
        <div className="absolute left-1/3 top-[55%] h-72 w-72 rounded-full bg-[#d7ecff]/70 blur-3xl" />
        <SparkleField />
      </div>

      {/* ============ 顶部 ============ */}
      <header className="relative z-10 px-5 pt-10 text-center md:pt-14">
        <p className="anim-fade-up mx-auto flex w-fit items-center gap-2 rounded-full border border-sea-200/80 bg-white/60 px-4 py-1.5 text-xs text-sea-600 backdrop-blur">
          <IconWaves className="h-3.5 w-3.5" />
          {bottles.length === 0 ? "海面安静 · 等待第一个漂流瓶" : `海面上正漂着 ${bottles.length} 个心事`}
        </p>
        <h1 className="font-display anim-fade-up mt-5 text-4xl tracking-wide text-ink-deep md:text-5xl" style={{ animationDelay: "0.08s" }}>
          心灵漂流瓶
        </h1>
        <p className="anim-fade-up mt-3 text-[15px] text-ink-soft" style={{ animationDelay: "0.16s" }}>
          在这里，你的情绪被温柔接住
        </p>
      </header>

      {/* ============ 海面剧场 ============ */}
      <section className="relative z-10 mx-auto mt-6 h-[300px] w-full max-w-3xl md:mt-8 md:h-[340px]">
        {/* 云与海鸥 */}
        <div className="anim-cloud absolute left-0 top-4 w-36 opacity-80" style={{ animationDuration: "75s" }}>
          <Cloud className="w-full" />
        </div>
        <div className="anim-cloud absolute left-0 top-16 w-24 opacity-60" style={{ animationDuration: "105s", animationDelay: "-40s" }}>
          <Cloud className="w-full" />
        </div>
        <div className="anim-drift-r absolute top-14 z-[5]" style={{ animationDuration: "48s" }}>
          <div className="anim-mini-bob"><Seagull className="w-10" /></div>
        </div>
        <div className="anim-drift-l absolute top-24 z-[5]" style={{ animationDuration: "62s", animationDelay: "-20s" }}>
          <div className="anim-mini-bob" style={{ animationDelay: "-1.2s" }}><Seagull className="w-7" flip /></div>
        </div>

        {/* 主玻璃瓶 */}
        <div className="absolute inset-x-0 bottom-[96px] flex justify-center md:bottom-[110px]">
          <div className="relative">
            <button
              onClick={() => setModalOpen("pick")}
              aria-label="点击瓶子，捞一个漂流瓶"
              className="group relative block cursor-pointer outline-none"
            >
              <span className="anim-hint absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/85 px-3 py-1 text-[11px] text-sea-600 shadow-sm backdrop-blur">
                点我捞一瓶 →
              </span>
              <div
                className="transition-transform duration-300 group-hover:scale-[1.04]"
                onAnimationEnd={(e) => {
                  if (throwAnim === "flying" && e.animationName === "throwArc") setThrowAnim("splash");
                }}
              >
                <GlassBottle
                  className={`w-32 drop-shadow-[0_18px_28px_rgba(70,100,170,0.28)] md:w-40 ${
                    throwAnim === "flying" ? "anim-throw" : "anim-bob"
                  }`}
                  withPaper
                />
              </div>
              {throwAnim === "splash" && <Splash className="bottom-2 left-1/2 -translate-x-1/2" />}
              <div className="anim-shadow mx-auto mt-1 h-3 w-24 rounded-[100%] bg-[#4a6aa8]/30 blur-[2px]" />
            </button>
          </div>
        </div>

        {/* 海面上的真实漂流瓶（与数据联动，最多 3 个） */}
        {seaMini.map((b, i) => (
          <button
            key={b.id}
            onClick={() => setModalOpen("pick")}
            aria-label="捞起海面上的漂流瓶"
            className="anim-drift-r absolute bottom-[34px] z-[12] cursor-pointer"
            style={{ animationDuration: `${58 + i * 16}s`, animationDelay: `-${i * 19}s` }}
          >
            <div className="anim-mini-bob" style={{ animationDelay: `${-i * 1.1}s` }}>
              <MiniBottle className="h-9 w-auto opacity-85 drop-shadow-[0_6px_10px_rgba(30,60,120,0.3)] transition hover:opacity-100" />
            </div>
          </button>
        ))}

        <div className="absolute inset-x-0 bottom-0">
          <Waves />
        </div>
      </section>

      {/* ============ 两大核心按钮 ============ */}
      <section className="relative z-10 mx-auto -mt-4 flex w-full max-w-xl flex-col gap-4 px-6 sm:flex-row md:-mt-6">
        <button
          onClick={() => setModalOpen("throw")}
          className="group relative flex-1 overflow-hidden rounded-[1.6rem] border border-white/70 bg-gradient-to-br from-sea-500 to-[#6a7fd0] px-6 py-5 text-left text-white shadow-[0_14px_34px_rgba(95,138,208,0.38)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(95,138,208,0.5)] active:scale-[0.98]"
        >
          <span className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/15 transition group-hover:scale-125" />
          <span className="flex items-center gap-3">
            <GlassBottle className="h-10 w-auto -rotate-12 drop-shadow transition group-hover:-rotate-45" withPaper />
            <span>
              <span className="font-display block text-xl">抛瓶子</span>
              <span className="mt-0.5 block text-xs text-white/85">把烦恼写下来，交给大海</span>
            </span>
          </span>
        </button>
        <button
          onClick={() => setModalOpen("pick")}
          className="group relative flex-1 overflow-hidden rounded-[1.6rem] border border-white/70 bg-white/85 px-6 py-5 text-left shadow-[0_14px_34px_rgba(120,130,190,0.18)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(120,130,190,0.28)] active:scale-[0.98]"
        >
          <span className="pointer-events-none absolute -bottom-8 -right-4 h-24 w-24 rounded-full bg-sea-100 transition group-hover:scale-125" />
          <span className="relative flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sea-100 text-sea-600 transition group-hover:bg-sea-200">
              <IconWaves className="h-5 w-5" />
            </span>
            <span>
              <span className="font-display block text-xl text-ink-deep">捞瓶子</span>
              <span className="mt-0.5 block text-xs text-ink-soft">
                {bottles.length === 0 ? "海面还空着，先去抛一个吧" : "接住别人的心事，回一句温暖"}
              </span>
            </span>
          </span>
        </button>
      </section>

      {/* ============ 今日海况 · 温暖指数 ============ */}
      <section className="reveal relative z-10 mx-auto mt-14 w-full max-w-3xl px-5">
        <div className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_18px_44px_rgba(100,115,175,0.14)] backdrop-blur md:p-8">
          <div className="flex items-center gap-2">
            <IconSparkle className="h-4 w-4 text-warm-400" />
            <h2 className="font-display text-xl text-ink-deep">今日海况</h2>
            <span className="ml-auto rounded-full bg-lav-200 px-3 py-1 text-xs text-[#6f66a8]">{level.label}</span>
          </div>

          <div className="mt-6 flex flex-col items-center gap-7 md:flex-row md:gap-10">
            <WarmRing value={warmIndex} />
            <div className="flex-1 text-center md:text-left">
              <p className="text-sm leading-relaxed text-ink">
                {warmIndex === 0
                  ? "大海正在等待第一份温暖。抛出一个瓶子，或捞起一份心事，温暖指数就会开始涨潮。"
                  : level.desc}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {[
                  { n: bottles.length, label: "海中的瓶子" },
                  { n: totalReplies, label: "温暖回复" },
                  { n: totalWarmLikes, label: "感到温暖" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl bg-[#f4f7fe] px-2 py-3 text-center">
                    <p className="font-display text-2xl text-ink-deep">{s.n}</p>
                    <p className="mt-0.5 text-[11px] text-ink-soft">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 勋章墙 */}
          <div className="mt-8 border-t border-[#ece4d4] pt-6">
            <div className="flex items-center gap-2">
              <IconLighthouse className="h-4 w-4 text-sea-500" />
              <h3 className="font-display text-base text-ink-deep">航海勋章</h3>
              <span className="ml-auto text-xs text-ink-soft">
                已点亮 {unlockedCount} / {badgeStates.length}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {badgeStates.map((b) => {
                const Icon = BADGE_ICONS[b.icon] ?? IconSail;
                return (
                  <div
                    key={b.id}
                    title={b.desc}
                    className={`group flex flex-col items-center rounded-2xl border px-2 py-4 text-center transition ${
                      b.on
                        ? "border-warm-300 bg-gradient-to-b from-warm-100 to-white shadow-sm"
                        : "border-[#e9e4d8] bg-[#f7f4ec] opacity-70"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition group-hover:scale-110 ${
                        b.on ? "bg-warm-400 text-white shadow-md" : "bg-[#e8e3d6] text-[#b6ad97]"
                      }`}
                    >
                      {b.on ? <Icon className="h-5 w-5" /> : <IconLock className="h-4 w-4" />}
                    </span>
                    <p className={`mt-2 text-[11px] font-medium ${b.on ? "text-ink-deep" : "text-[#a89f88]"}`}>{b.name}</p>
                    <p className="mt-0.5 hidden text-[10px] leading-snug text-ink-soft sm:block">{b.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============ 页脚 ============ */}
      <footer className="relative z-10 mx-auto mt-12 max-w-3xl px-6 pb-10 text-center">
        <div className="flex items-center justify-center gap-2 text-ink-soft">
          <IconHeartFilled className="h-3.5 w-3.5 text-blush-400" />
          <p className="text-xs">心灵漂流瓶 · 匿名而温柔的海上互助</p>
          <IconHeartFilled className="h-3.5 w-3.5 text-blush-400" />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[#a5aecb]">
          这里是同伴互助的温暖角落，不能替代专业心理帮助。
          <br />
          如果你或身边的人正处于危机中，请拨打 12355 青少年服务台，或 110 / 120。
        </p>
      </footer>

      {/* ============ 弹层 ============ */}
      <ThrowModal open={modalOpen === "throw"} onClose={() => setModalOpen(null)} onSend={handleSend} />
      <PickModal
        open={modalOpen === "pick"}
        onClose={() => setModalOpen(null)}
        bottles={bottles}
        onSendReply={handleSendReply}
        onLikeReply={handleLikeReply}
        onHug={handleHug}
        onSwitchToThrow={switchToThrow}
      />

      {/* ============ Toast ============ */}
      <div className="pointer-events-none fixed inset-x-0 top-5 z-[90] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`anim-pop flex items-center gap-2 rounded-full px-5 py-2.5 text-sm shadow-lg backdrop-blur ${
              t.kind === "warm"
                ? "bg-warm-100/95 text-[#a05f24]"
                : t.kind === "info"
                  ? "bg-white/90 text-ink"
                  : "bg-sea-500/95 text-white"
            }`}
          >
            {t.kind === "warm" ? <IconHeartFilled className="h-4 w-4" /> : <IconWaves className="h-4 w-4" />}
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
