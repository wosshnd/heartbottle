import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MOODS, timeAgo } from "../lib/bottle";
import type { Bottle, Mood } from "../lib/bottle";
import { getAiSuggestion } from "../lib/ai";
import {
  GlassBottle,
  MiniBottle,
  IconClose,
  IconHeart,
  IconHeartFilled,
  IconLock,
  IconSend,
  IconSparkle,
  IconWaves,
  IconBottle,
  Spinner,
} from "./decor";

/* ------------------------------ 弹窗外壳 ------------------------------ */

export function ModalShell({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        className="anim-backdrop-in absolute inset-0 cursor-default bg-ink-deep/45 backdrop-blur-[3px]"
        onClick={onClose}
        aria-label="关闭"
      />
      <div className="anim-modal-in relative flex max-h-[88svh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-white/80 bg-[#fbfdff]/95 shadow-[0_30px_90px_-24px_rgba(45,72,140,0.55)] backdrop-blur-md">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-sea-200 bg-white/80 text-ink-soft transition hover:rotate-90 hover:border-sea-400 hover:text-sea-700"
          aria-label="关闭弹窗"
        >
          <IconClose className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------ 抛瓶子弹窗 ------------------------------ */

export function ThrowModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (text: string, mood: Mood | null) => boolean;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState<Mood | null>(null);
  const [shaking, setShaking] = useState(false);
  const MAX = 200;

  const submit = () => {
    if (!text.trim()) return;
    const ok = onSubmit(text.trim(), mood);
    if (!ok) setShaking(true);
  };

  return (
    <ModalShell onClose={onClose}>
      <div
        className={`flex flex-col overflow-hidden ${shaking ? "anim-shake" : ""}`}
        onAnimationEnd={() => setShaking(false)}
      >
        <div className="overflow-y-auto">
          <header className="flex items-center gap-3 px-6 pt-6">
            <MiniBottle className="h-11 w-7 shrink-0" />
            <div>
              <h2 className="font-display text-2xl leading-tight text-ink-deep">把烦恼装进瓶子</h2>
              <p className="mt-0.5 text-xs tracking-wide text-ink-soft">写下来，就已经轻了一半</p>
            </div>
          </header>

          <div className="px-6 pt-4">
            <div className="relative">
              <textarea
                value={text}
                maxLength={MAX}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                autoFocus
                placeholder="此刻压在心上的事是什么？交给大海吧，它会替你保密……"
                className="w-full resize-none rounded-2xl border border-sea-200 bg-paper p-4 text-[15px] leading-7 text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-sea-400 focus:shadow-[0_0_0_4px_rgba(127,169,226,0.18)]"
              />
              <span className="absolute bottom-3 right-4 text-[11px] tabular-nums text-ink-soft/80">
                {text.length} / {MAX}
              </span>
            </div>

            <p className="mt-4 text-xs font-medium tracking-wider text-ink-soft">此刻的心情 · 可不选</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(mood === m ? null : m)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition-all duration-200 ${
                    mood === m
                      ? "-translate-y-0.5 border-sea-600 bg-sea-600 text-white shadow-md shadow-sea-600/30"
                      : "border-sea-200 bg-white/70 text-ink hover:-translate-y-0.5 hover:border-sea-400 hover:text-sea-700"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer className="mt-4 px-6 pb-6">
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="group flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-sea-600 font-display text-lg tracking-widest text-white shadow-lg shadow-sea-600/35 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sea-700 hover:shadow-xl hover:shadow-sea-700/35 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
          >
            <IconWaves className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-12" />
            匿名抛进大海
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink-soft">
            <IconLock className="h-3.5 w-3.5" />
            匿名投放，海面会替你保密
          </p>
        </footer>
      </div>
    </ModalShell>
  );
}

/* ------------------------------ 捞瓶子弹窗 ------------------------------ */

export function CatchModal({
  bottle,
  onClose,
  onNext,
  onReply,
  onLikeReply,
  onHug,
  onAiUsed,
}: {
  bottle: Bottle;
  onClose: () => void;
  onNext: () => void;
  onReply: (text: string) => boolean;
  onLikeReply: (replyId: string) => void;
  onHug: () => void;
  onAiUsed: () => void;
}) {
  const [phase, setPhase] = useState<"rising" | "letter">("rising");
  const [draft, setDraft] = useState("");
  const [aiState, setAiState] = useState<"idle" | "loading" | "typing">("idle");
  const [shaking, setShaking] = useState(false);
  const [hugged, setHugged] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* 切换瓶子时重置状态 */
  useEffect(() => {
    setPhase("rising");
    setDraft("");
    setAiState("idle");
    setHugged(false);
    setLikedIds(new Set());
    stopTyping();
    const t = setTimeout(() => setPhase("letter"), 1050);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bottle.id]);

  useEffect(() => () => stopTyping(), []);

  function stopTyping() {
    if (typingRef.current) {
      clearInterval(typingRef.current);
      typingRef.current = null;
    }
  }

  const sortedReplies = [...bottle.replies].sort(
    (a, b) => b.likes - a.likes || a.timestamp - b.timestamp,
  );

  const handleAi = async () => {
    if (aiState !== "idle") return;
    setAiState("loading");
    try {
      const { empathy_response, gentle_suggestion } = await getAiSuggestion(bottle.content);
      const full = `${empathy_response}\n\n${gentle_suggestion}`;
      setAiState("typing");
      onAiUsed();
      let i = 0;
      stopTyping();
      typingRef.current = setInterval(() => {
        i += 2;
        setDraft(full.slice(0, i));
        if (i >= full.length) {
          stopTyping();
          setAiState("idle");
        }
      }, 24);
    } catch {
      setAiState("idle");
    }
  };

  const onDraftChange = (v: string) => {
    if (aiState === "typing") {
      stopTyping();
      setAiState("idle");
    }
    setDraft(v);
  };

  const submitReply = () => {
    if (!draft.trim()) return;
    const ok = onReply(draft.trim());
    if (ok) {
      stopTyping();
      setDraft("");
      setAiState("idle");
    } else {
      setShaking(true);
    }
  };

  const like = (replyId: string) => {
    onLikeReply(replyId);
    setLikedIds((prev) => new Set(prev).add(replyId));
  };

  const hug = () => {
    if (hugged) return;
    setHugged(true);
    onHug();
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="flex min-h-[480px] flex-col overflow-hidden sm:min-h-[520px]">
        {/* 海面小剧场 */}
        <div
          className={`relative overflow-hidden bg-gradient-to-b from-sea-200 via-sea-100 to-[#fbfdff] transition-all duration-500 ${
            phase === "rising" ? "min-h-[430px] flex-1 sm:min-h-[470px]" : "h-24 shrink-0"
          }`}
        >
          <div className="absolute inset-x-0 bottom-0 h-8 opacity-50">
            <div className="anim-wave flex h-full w-[200%]" style={{ animationDuration: "12s" }}>
              {[0, 1].map((k) => (
                <svg key={k} viewBox="0 0 1440 110" preserveAspectRatio="none" className="h-full w-1/2 shrink-0">
                  <path
                    d="M0 55 C 120 20 240 20 360 55 C 480 90 600 90 720 55 C 840 20 960 20 1080 55 C 1200 90 1320 90 1440 55 L1440 110 L0 110 Z"
                    fill="#9dc0ec"
                  />
                </svg>
              ))}
            </div>
          </div>
          <div className="anim-rise absolute bottom-3 left-1/2 -translate-x-1/2">
            <GlassBottle className="h-20 w-auto drop-shadow-[0_6px_10px_rgba(70,100,170,0.25)]" />
          </div>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="anim-bubble absolute bottom-2 h-2 w-2 rounded-full border border-white bg-white/40"
              style={{ left: `${42 + i * 7}%`, animationDelay: `${i * 0.5}s` }}
            />
          ))}
          <p className="absolute inset-x-0 top-4 text-center text-xs tracking-[0.25em] text-sea-700/80">
            {phase === "rising" ? "海面传来咕噜咕噜的声音…" : "捞到了一个瓶子"}
          </p>
        </div>

        {phase === "letter" && (
          <div className="anim-fade-up flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* 寄件人 */}
              <div className="flex items-center gap-3 px-6 pt-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-sea-200 bg-sea-100">
                  <MiniBottle className="h-6 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-deep">{bottle.penName}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-soft">
                    {timeAgo(bottle.timestamp)}
                    {bottle.mood && (
                      <span className="rounded-full bg-lav-200 px-2 py-0.5 text-[10px] font-medium text-sea-700">
                        {bottle.mood}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={hug}
                  className={`ml-auto flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    hugged
                      ? "anim-pop border-blush-300 bg-blush-100 text-blush-500"
                      : "border-sea-200 bg-white/70 text-ink-soft hover:-translate-y-0.5 hover:border-blush-300 hover:text-blush-500"
                  }`}
                >
                  {hugged ? <IconHeartFilled className="h-3.5 w-3.5" /> : <IconHeart className="h-3.5 w-3.5" />}
                  抱抱 TA · {bottle.likes}
                </button>
              </div>

              {/* 信纸 */}
              <div className="relative mx-6 mt-4 rounded-2xl border border-warm-300/70 bg-paper p-5 shadow-[0_10px_30px_-18px_rgba(200,150,80,0.5)]">
                <span className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 -rotate-3 rounded-sm bg-warm-300/70" />
                <p className="whitespace-pre-wrap text-[15px] leading-7 text-ink">{bottle.content}</p>
              </div>

              {/* 回复列表 */}
              <div className="px-6 pt-5">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg text-ink-deep">来自海面的温暖</h3>
                  <span className="rounded-full bg-sea-200 px-2 py-0.5 text-[11px] font-medium tabular-nums text-sea-700">
                    {sortedReplies.length}
                  </span>
                  <span className="ml-auto text-[10px] tracking-wider text-ink-soft/70">按温暖度排序</span>
                </div>

                {sortedReplies.length === 0 ? (
                  <p className="mt-3 rounded-2xl border border-dashed border-sea-300 bg-sea-100/50 px-4 py-5 text-center text-xs leading-6 text-ink-soft">
                    这个瓶子还在等第一份温暖，
                    <br />
                    也许就是由你来写下。
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2.5">
                    {sortedReplies.map((r) => {
                      const liked = likedIds.has(r.id);
                      return (
                        <li
                          key={r.id}
                          className="rounded-2xl border border-sea-200 bg-white/85 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-sea-300 hover:shadow-[0_10px_24px_-16px_rgba(70,100,170,0.45)]"
                        >
                          <p className="whitespace-pre-wrap text-sm leading-6 text-ink">{r.content}</p>
                          <div className="mt-2.5 flex items-center justify-between">
                            <span className="text-[11px] text-ink-soft">
                              {r.author} · {timeAgo(r.timestamp)}
                            </span>
                            <button
                              onClick={() => like(r.id)}
                              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all duration-200 active:scale-90 ${
                                liked
                                  ? "border-blush-300 bg-blush-100 text-blush-500"
                                  : "border-sea-200 text-ink-soft hover:border-blush-300 hover:text-blush-500"
                              }`}
                            >
                              {liked || r.likes > 0 ? (
                                <IconHeartFilled className={`h-3.5 w-3.5 ${liked ? "anim-pop" : ""}`} />
                              ) : (
                                <IconHeart className="h-3.5 w-3.5" />
                              )}
                              感到温暖
                              <span className="tabular-nums font-medium">{r.likes}</span>
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* 回复输入 */}
              <div className={`px-6 pb-2 pt-5 ${shaking ? "anim-shake" : ""}`} onAnimationEnd={() => setShaking(false)}>
                <div className="flex items-center justify-between gap-2">
                  <label className="font-display text-lg text-ink-deep">写一句温暖的话</label>
                  <button
                    onClick={handleAi}
                    disabled={aiState !== "idle"}
                    className="flex items-center gap-1.5 rounded-full border border-lav-300 bg-lav-100 px-3 py-1.5 text-xs font-medium text-sea-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-lav-200 hover:shadow-md hover:shadow-lav-300/50 disabled:pointer-events-none disabled:opacity-70"
                  >
                    {aiState === "loading" ? (
                      <>
                        <Spinner className="h-3.5 w-3.5" />
                        正在酝酿温暖…
                      </>
                    ) : aiState === "typing" ? (
                      <>
                        <IconSparkle className="h-3.5 w-3.5 text-warm-500" />
                        暖言生成中…
                      </>
                    ) : (
                      <>
                        <IconSparkle className="h-3.5 w-3.5 text-warm-500" />
                        AI 帮我写个温暖回复
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={draft}
                  onChange={(e) => onDraftChange(e.target.value)}
                  rows={3}
                  maxLength={200}
                  placeholder="告诉 TA：这份心情，有人稳稳地接住了…"
                  className="mt-2.5 w-full resize-none rounded-2xl border border-sea-200 bg-paper p-4 text-sm leading-6 text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-blush-400 focus:shadow-[0_0_0_4px_rgba(251,156,177,0.18)]"
                />
                <div className="mt-2.5 flex items-center justify-end gap-2">
                  <button
                    onClick={onNext}
                    className="flex h-11 items-center gap-1.5 rounded-2xl border border-sea-300 bg-white/80 px-4 font-display text-[15px] tracking-wider text-sea-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sea-100 active:translate-y-0"
                  >
                    <IconBottle className="h-4 w-4" />
                    再捞一个
                  </button>
                  <button
                    onClick={submitReply}
                    disabled={!draft.trim()}
                    className="flex h-11 items-center gap-1.5 rounded-2xl bg-blush-500 px-5 font-display text-[15px] tracking-wider text-white shadow-lg shadow-blush-500/35 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e85f82] active:translate-y-0 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
                  >
                    <IconSend className="h-4 w-4" />
                    送出温暖
                  </button>
                </div>
                <p className="pb-5 pt-3 text-center text-[10px] tracking-wider text-ink-soft/70">
                  温暖会匿名送达 · 请温柔对待每一颗心
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
