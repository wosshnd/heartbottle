import { useEffect, useMemo, useRef, useState } from "react";
import {
  BADGES,
  checkContent,
  computeWarmth,
  loadBottles,
  loadStats,
  pickBottle,
  randomPenName,
  saveBottles,
  saveStats,
  uid,
  warmthLabel,
} from "./lib/bottle";
import type { Bottle, Mood, UserStats } from "./lib/bottle";
import {
  Cloud,
  FloatingHearts,
  GlassBottle,
  IconAlert,
  IconChevronDown,
  IconHeartFilled,
  IconLock,
  IconSun,
  IconWaves,
  MiniBottle,
  SparkleField,
  Splash,
  Waves,
  BADGE_ICONS,
} from "./components/decor";
import type { FloatingHeart } from "./components/decor";
import { CatchModal, ThrowModal } from "./components/modals";

/* ------------------------------ Toast ------------------------------ */

type ToastKind = "success" | "warn" | "care" | "info";
interface Toast {
  id: string;
  kind: ToastKind;
  text: string;
}

const TOAST_STYLE: Record<ToastKind, { border: string; icon: string }> = {
  success: { border: "border-blush-300", icon: "text-blush-500" },
  warn: { border: "border-warm-400", icon: "text-warm-500" },
  care: { border: "border-sea-300", icon: "text-sea-600" },
  info: { border: "border-sea-200", icon: "text-sea-600" },
};

function ToastIcon({ kind, className }: { kind: ToastKind; className?: string }) {
  if (kind === "success") return <IconHeartFilled className={className} />;
  if (kind === "warn") return <IconAlert className={className} />;
  if (kind === "care") return <IconSun className={className} />;
  return <IconWaves className={className} />;
}

/* ------------------------------ 应用 ------------------------------ */

export default function App() {
  const [bottles, setBottles] = useState<Bottle[]>(() => loadBottles());
  const [stats, setStats] = useState<UserStats>(() => loadStats());
  const [modal, setModal] = useState<"throw" | "catch" | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [throwAnim, setThrowAnim] = useState<"idle" | "flying" | "splash">("idle");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const lastPulledRef = useRef<string | null>(null);
  const [ringOn, setRingOn] = useState(false);

  /* 持久化 */
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
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    const t = setTimeout(() => setRingOn(true), 500);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);

  const { warmth, totalReplies, totalLikes } = useMemo(() => computeWarmth(bottles), [bottles]);
  const unlockedCount = useMemo(
    () => BADGES.filter((b) => b.unlocked(stats)).length,
    [stats],
  );
  const currentBottle = currentId ? (bottles.find((b) => b.id === currentId) ?? null) : null;

  /* 抛瓶动画：飞行结束 → 落水水花 → 复位 */
  useEffect(() => {
    if (throwAnim === "splash") {
      const t = setTimeout(() => setThrowAnim("idle"), 1200);
      return () => clearTimeout(t);
    }
  }, [throwAnim]);

  /* ------------------------------ 交互 ------------------------------ */

  const showToast = (kind: ToastKind, text: string) => {
    const id = uid();
    setToasts((prev) => [...prev.slice(-2), { id, kind, text }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      kind === "care" ? 6500 : 3800,
    );
  };

  const spawnHearts = (n: number) => {
    const batch: FloatingHeart[] = Array.from({ length: n }, () => ({
      id: uid(),
      left: 18 + Math.random() * 64,
      hue: Math.random() > 0.5 ? "rose" : "warm",
    }));
    setHearts((prev) => [...prev, ...batch]);
    setTimeout(
      () => setHearts((prev) => prev.filter((h) => !batch.some((b) => b.id === h.id))),
      1700,
    );
  };

  const openCatch = () => {
    if (bottles.length === 0) {
      showToast("info", "海面静悄悄的，先抛一个瓶子吧");
      return;
    }
    const b = pickBottle(bottles, lastPulledRef.current);
    if (!b) return;
    lastPulledRef.current = b.id;
    setCurrentId(b.id);
    setModal("catch");
  };

  const handleThrowSubmit = (text: string, mood: Mood | null): boolean => {
    const check = checkContent(text);
    if (!check.ok) {
      if (check.kind === "crisis") {
        showToast(
          "care",
          "这些文字背后可能藏着很深的痛苦。请记得拨打心理援助热线 010-82951332（24 小时），或告诉身边信任的人，你值得被好好守护。",
        );
      } else {
        showToast("warn", "这句话可能会伤害到别人，请换一种更温暖的表达方式哦~");
      }
      return false;
    }
    const bottle: Bottle = {
      id: uid(),
      content: text,
      timestamp: Date.now(),
      likes: 0,
      mood,
      penName: randomPenName(),
      mine: true,
      replies: [],
    };
    setBottles((prev) => [bottle, ...prev]);
    setStats((s) => ({ ...s, thrown: s.thrown + 1 }));
    setModal(null);
    setThrowAnim("flying");
    showToast("success", "漂流瓶已出发，正随海浪漂向珍惜它的人");
    return true;
  };

  const handleReply = (text: string): boolean => {
    const check = checkContent(text);
    if (!check.ok) {
      showToast(
        check.kind === "crisis" ? "care" : "warn",
        check.kind === "crisis"
          ? "这些文字背后可能藏着很深的痛苦，请记得拨打 010-82951332（24 小时心理援助热线），或告诉身边信任的人。"
          : "这句话可能会伤害到别人，请换一种更温暖的表达方式哦~",
      );
      return false;
    }
    if (!currentId) return false;
    setBottles((prev) =>
      prev.map((b) =>
        b.id === currentId
          ? {
              ...b,
              replies: [
                ...b.replies,
                { id: uid(), content: text, timestamp: Date.now(), likes: 0, author: "温柔的你" },
              ],
            }
          : b,
      ),
    );
    setStats((s) => ({ ...s, replied: s.replied + 1 }));
    showToast("success", "你的温暖已送达，海面泛起小小的涟漪");
    return true;
  };

  const handleLikeReply = (replyId: string) => {
    if (!currentId) return;
    setBottles((prev) =>
      prev.map((b) =>
        b.id === currentId
          ? {
              ...b,
              replies: b.replies.map((r) => (r.id === replyId ? { ...r, likes: r.likes + 1 } : r)),
            }
          : b,
      ),
    );
    setStats((s) => ({ ...s, likesGiven: s.likesGiven + 1 }));
    spawnHearts(5);
  };

  const handleHug = () => {
    if (!currentId) return;
    setBottles((prev) => prev.map((b) => (b.id === currentId ? { ...b, likes: b.likes + 1 } : b)));
    setStats((s) => ({ ...s, likesGiven: s.likesGiven + 1 }));
    spawnHearts(4);
  };

  const C = 2 * Math.PI * 56;

  /* ------------------------------ 渲染 ------------------------------ */

  return (
    <div className="min-h-svh font-body">
      {/* ======================= 海洋主场景 ======================= */}
      <main className="relative min-h-[100svh] overflow-hidden bg-[linear-gradient(180deg,#d8eafb_0%,#dce5fa_42%,#e4e1f7_72%,#bcd7f4_100%)]">
        {/* 天光 */}
        <div
          className="pointer-events-none absolute -top-24 right-[-8%] h-80 w-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,240,209,0.95) 0%, rgba(255,240,209,0) 68%)" }}
        />
        <div
          className="pointer-events-none absolute left-[-12%] top-1/4 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(211,207,241,0.75) 0%, rgba(211,207,241,0) 70%)" }}
        />
        <SparkleField />
        <Cloud className="top-[9%]" scale={1} style={{ animationDuration: "75s", animationDelay: "-20s" }} />
        <Cloud className="top-[22%]" scale={0.65} style={{ animationDuration: "95s", animationDelay: "-60s" }} />
        <Cloud className="top-[4%]" scale={1.25} style={{ animationDuration: "120s", animationDelay: "-45s" }} />

        {/* 标题区 */}
        <header className="anim-fade-up relative z-10 px-4 pt-10 text-center md:pt-14">
          <div className="flex items-center justify-center gap-3 md:gap-4">
            <MiniBottle className="h-8 w-5 -rotate-12 md:h-10 md:w-7" />
            <h1 className="font-display text-[42px] leading-none tracking-wide text-ink-deep drop-shadow-[0_2px_0_rgba(255,255,255,0.6)] md:text-6xl">
              心灵漂流瓶
            </h1>
            <MiniBottle className="h-8 w-5 rotate-12 md:h-10 md:w-7" />
          </div>
          <p className="mt-3 pl-[0.35em] text-[13px] tracking-[0.35em] text-ink-soft md:mt-4 md:text-base">
            在这里，你的情绪被温柔接住
          </p>
        </header>

        {/* 中央舞台 */}
        <section className="relative z-10 flex flex-col items-center px-4 pb-[30vh] pt-6 md:pt-9">
          {/* 玻璃瓶 */}
          <button
            onClick={openCatch}
            className="group relative cursor-pointer select-none outline-none"
            aria-label="点瓶子捞一个漂流瓶"
            title="点一点瓶子，捞一个上来"
          >
            <span className="anim-hint absolute -right-4 top-6 hidden rotate-6 rounded-full border border-white bg-white/85 px-3 py-1 text-[11px] font-medium text-sea-700 shadow-md backdrop-blur transition group-hover:opacity-0 sm:block md:-right-10">
              点我捞一瓶
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
            {/* 影子与涟漪 */}
            <span className="anim-shadow absolute -bottom-2 left-1/2 h-4 w-24 -translate-x-1/2 rounded-[50%] bg-sea-700/30 blur-[4px]" />
            <span
              className="absolute -bottom-1 left-1/2 h-4 w-20 -translate-x-1/2 rounded-[50%] border-2 border-white/70"
              style={{ animation: "ripple 2.8s ease-out infinite" }}
            />
            {throwAnim === "splash" && <Splash className="left-[calc(50%+110px)] top-[68%] md:left-[calc(50%+150px)]" />}
          </button>

          {/* 两个主按钮 */}
          <div
            className="anim-fade-up mt-7 flex w-full max-w-md gap-3 md:mt-9 md:gap-4"
            style={{ animationDelay: "0.15s" }}
          >
            <button
              onClick={() => setModal("throw")}
              className="group relative h-[68px] flex-1 overflow-hidden rounded-[22px] bg-sea-600 text-white shadow-xl shadow-sea-600/40 transition-all duration-200 hover:-translate-y-1 hover:bg-sea-700 hover:shadow-2xl hover:shadow-sea-700/40 active:translate-y-0 active:scale-[0.97] md:h-[76px]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex flex-col items-center justify-center gap-0.5">
                <span className="flex items-center gap-2 font-display text-xl tracking-[0.18em] md:text-2xl">
                  <IconWaves className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-12" />
                  抛瓶子
                </span>
                <span className="text-[10px] tracking-[0.3em] opacity-80 md:text-xs">写下烦恼</span>
              </span>
            </button>
            <button
              onClick={openCatch}
              className="group relative h-[68px] flex-1 overflow-hidden rounded-[22px] border border-white/90 bg-white/70 text-sea-700 shadow-xl shadow-sea-500/25 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:bg-white/95 hover:shadow-2xl active:translate-y-0 active:scale-[0.97] md:h-[76px]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-sea-200/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex flex-col items-center justify-center gap-0.5">
                <span className="flex items-center gap-2 font-display text-xl tracking-[0.18em] md:text-2xl">
                  <MiniBottle className="h-6 w-4 transition-transform duration-300 group-hover:rotate-12" />
                  捞瓶子
                </span>
                <span className="text-[10px] tracking-[0.3em] text-ink-soft md:text-xs">回复他人</span>
              </span>
            </button>
          </div>

          {/* 海面速览 */}
          <div
            className="anim-fade-up mt-6 flex flex-wrap items-center justify-center gap-2 md:mt-7"
            style={{ animationDelay: "0.3s" }}
          >
            <span className="flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-2 text-xs text-ink backdrop-blur-md">
              <IconSun className="h-4 w-4 text-warm-500" />
              今日温暖指数
              <span className="font-display text-base leading-none text-warm-500">{warmth}°</span>
            </span>
            <span className="flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-2 text-xs text-ink backdrop-blur-md">
              <MiniBottle className="h-5 w-3" />
              海上的瓶子
              <span className="font-display text-base leading-none text-sea-700">{bottles.length}</span>
            </span>
            <span className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-2 text-xs text-ink backdrop-blur-md sm:flex">
              <IconHeartFilled className="h-3.5 w-3.5 text-blush-400" />
              累计温暖
              <span className="font-display text-base leading-none text-blush-500">{totalLikes + totalReplies}</span>
            </span>
          </div>
        </section>

        {/* 漂浮的小瓶子 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[9vh] z-[5] h-24" aria-hidden="true">
          <div className="anim-drift-r absolute left-0 top-1" style={{ animationDuration: "46s", animationDelay: "-8s" }}>
            <div className="anim-mini-bob">
              <MiniBottle className="h-9 w-6 opacity-90" />
            </div>
          </div>
          <div className="anim-drift-l absolute left-0 top-10" style={{ animationDuration: "58s", animationDelay: "-30s" }}>
            <div className="anim-mini-bob" style={{ animationDelay: "-1.2s" }}>
              <MiniBottle className="h-7 w-5 opacity-80" paper="#d9e8ff" />
            </div>
          </div>
          <div className="anim-drift-r absolute left-0 top-16" style={{ animationDuration: "38s", animationDelay: "-22s" }}>
            <div className="anim-mini-bob" style={{ animationDelay: "-2s" }}>
              <MiniBottle className="h-8 w-5 opacity-85" paper="#ffe1e8" />
            </div>
          </div>
          {[15, 45, 72].map((l, i) => (
            <span
              key={l}
              className="anim-bubble absolute bottom-0 h-2.5 w-2.5 rounded-full border border-white/80 bg-white/30"
              style={{ left: `${l}%`, animationDelay: `${i * 1.4}s` }}
            />
          ))}
        </div>

        {/* 海浪 */}
        <Waves />

        {/* 下滑提示 */}
        <div className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-0.5 text-sea-700/80">
          <span className="text-[10px] tracking-[0.3em]">海的回音</span>
          <IconChevronDown className="anim-hint h-4 w-4" />
        </div>
      </main>

      {/* ======================= 海的回音（温暖指数 + 勋章） ======================= */}
      <div className="relative bg-[#eef3fb]">
        <svg viewBox="0 0 1440 110" preserveAspectRatio="none" className="block h-12 w-full text-[#7fa9e2] md:h-16">
          <path
            d="M0 55 C 120 20 240 20 360 55 C 480 90 600 90 720 55 C 840 20 960 20 1080 55 C 1200 90 1320 90 1440 55 L1440 110 L0 110 Z"
            fill="currentColor"
            transform="rotate(180 720 55)"
          />
        </svg>

        <section className="mx-auto max-w-4xl px-4 pb-14 pt-5 md:pt-8">
          <div className="reveal mb-6 flex items-end justify-between md:mb-8">
            <div>
              <p className="text-[11px] font-medium tracking-[0.42em] text-sea-600">ECHO OF THE SEA</p>
              <h2 className="mt-1.5 font-display text-3xl text-ink-deep md:text-4xl">今日海况</h2>
            </div>
            <p className="hidden max-w-[230px] text-right text-xs leading-5 text-ink-soft md:block">
              每一次抛瓶、每一条回复、每一颗爱心，
              <br />
              都被大海记作一度温暖。
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-5">
            {/* 温暖指数 */}
            <div className="reveal rounded-[26px] border border-white bg-white/75 p-6 shadow-[0_18px_50px_-30px_rgba(60,90,160,0.5)] backdrop-blur md:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg text-ink-deep">今日温暖指数</h3>
                <span className="rounded-full bg-warm-100 px-2.5 py-1 text-[11px] font-medium text-warm-500">
                  {warmthLabel(warmth)}
                </span>
              </div>
              <div className="relative mx-auto mt-4 h-40 w-40">
                <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
                  <defs>
                    <linearGradient id="warmGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fbb98a" />
                      <stop offset="100%" stopColor="#f47896" />
                    </linearGradient>
                  </defs>
                  <circle cx="70" cy="70" r="56" fill="none" stroke="#e7eef9" strokeWidth="13" />
                  <circle
                    cx="70"
                    cy="70"
                    r="56"
                    fill="none"
                    stroke="url(#warmGrad)"
                    strokeWidth="13"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={ringOn ? C * (1 - warmth / 100) : C}
                    style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.3,0.8,0.3,1)" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-[44px] leading-none text-ink-deep">
                    {warmth}
                    <span className="text-xl text-warm-500">°</span>
                  </span>
                  <span className="mt-1 text-[10px] tracking-[0.3em] text-ink-soft">WARMTH</span>
                </div>
              </div>
              <ul className="mt-5 space-y-2.5 border-t border-dashed border-sea-200 pt-4 text-sm">
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-ink-soft">
                    <span className="h-2 w-2 rounded-full bg-sea-500" />
                    海上的漂流瓶
                  </span>
                  <span className="font-display text-base text-ink-deep">{bottles.length} 个</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-ink-soft">
                    <span className="h-2 w-2 rounded-full bg-warm-400" />
                    温暖的回复
                  </span>
                  <span className="font-display text-base text-ink-deep">{totalReplies} 条</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-ink-soft">
                    <span className="h-2 w-2 rounded-full bg-blush-400" />
                    爱心与拥抱
                  </span>
                  <span className="font-display text-base text-ink-deep">{totalLikes} 颗</span>
                </li>
              </ul>
            </div>

            {/* 勋章墙 */}
            <div
              className="reveal rounded-[26px] border border-white bg-white/75 p-6 shadow-[0_18px_50px_-30px_rgba(60,90,160,0.5)] backdrop-blur md:col-span-3"
              style={{ transitionDelay: "0.12s" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg text-ink-deep">我的勋章墙</h3>
                <span className="rounded-full bg-lav-200 px-2.5 py-1 text-[11px] font-medium tabular-nums text-sea-700">
                  已点亮 {unlockedCount} / {BADGES.length}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {BADGES.map((b) => {
                  const unlocked = b.unlocked(stats);
                  const Icon = BADGE_ICONS[b.icon];
                  return (
                    <div
                      key={b.id}
                      className={`group relative rounded-2xl border p-4 text-center transition-all duration-300 ${
                        unlocked
                          ? "border-warm-300/70 bg-gradient-to-b from-white to-warm-100 shadow-[0_10px_26px_-18px_rgba(240,160,90,0.7)] hover:-translate-y-1"
                          : "border-dashed border-sea-200 bg-sea-100/40 opacity-75"
                      }`}
                      title={b.desc}
                    >
                      {!unlocked && (
                        <span className="absolute right-2.5 top-2.5 text-ink-soft/50">
                          <IconLock className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <span
                        className={`mx-auto grid h-12 w-12 place-items-center rounded-full border transition-transform duration-300 group-hover:scale-110 ${
                          unlocked
                            ? "border-warm-300 bg-white text-warm-500 shadow-inner"
                            : "border-sea-200 bg-white/70 text-ink-soft/50 grayscale"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                      <p className={`mt-2.5 font-display text-[15px] ${unlocked ? "text-ink-deep" : "text-ink-soft"}`}>
                        {b.name}
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-ink-soft">{b.desc}</p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-ink-soft">
                <IconSparkleSmall />
                多抛瓶、多回复、多送温暖，就能点亮更多勋章
              </p>
            </div>
          </div>

          {/* 页脚 */}
          <footer className="mt-12 text-center md:mt-16">
            <IconWaves className="mx-auto h-5 w-5 text-sea-300" />
            <p className="mt-3 font-display text-lg tracking-wider text-ink-soft">
              心灵漂流瓶 · 愿意倾听的心，是温柔的开端
            </p>
            <p className="mx-auto mt-3 max-w-md text-[11px] leading-5 text-ink-soft/80">
              如果此刻的你正承受很大的痛苦，请记得不必独自面对：可拨打 24 小时心理援助热线
              <span className="font-medium text-sea-700"> 010-82951332</span>
              ，或告诉身边信任的人。世界和你，都值得被温柔相待。
            </p>
            <p className="mt-4 text-[10px] tracking-[0.25em] text-ink-soft/60">
              DRIFT WITH LOVE · 数据仅保存在你的浏览器中
            </p>
          </footer>
        </section>
      </div>

      {/* ======================= 弹层 ======================= */}
      {modal === "throw" && <ThrowModal onSubmit={handleThrowSubmit} onClose={() => setModal(null)} />}
      {modal === "catch" && currentBottle && (
        <CatchModal
          bottle={currentBottle}
          onClose={() => setModal(null)}
          onNext={openCatch}
          onReply={handleReply}
          onLikeReply={handleLikeReply}
          onHug={handleHug}
          onAiUsed={() => setStats((s) => ({ ...s, aiUsed: s.aiUsed + 1 }))}
        />
      )}

      {/* Toast */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`anim-pop pointer-events-auto flex w-auto max-w-[92vw] items-center gap-2.5 rounded-2xl border ${TOAST_STYLE[t.kind].border} bg-white/95 px-4 py-3 text-sm text-ink shadow-[0_14px_40px_-16px_rgba(50,80,150,0.5)] backdrop-blur`}
          >
            <ToastIcon kind={t.kind} className={`h-4.5 w-4.5 shrink-0 ${TOAST_STYLE[t.kind].icon}`} />
            <span className="leading-5">{t.text}</span>
          </div>
        ))}
      </div>

      <FloatingHearts hearts={hearts} />
    </div>
  );
}

function IconSparkleSmall() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-warm-400" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2Z" />
    </svg>
  );
}
