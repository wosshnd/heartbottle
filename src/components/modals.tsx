import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AI_CONFIG, aiModeration, getAiSuggestion } from "../lib/ai";
import {
  CARING_TEMPLATES,
  HOTLINES,
  MOODS,
  checkRisk,
  moodOf,
  pickWeightedBottle,
  timeAgo,
  type Bottle,
  type Hotline,
} from "../lib/bottle";
import {
  GlassBottle,
  IconClose,
  IconHeart,
  IconHeartFilled,
  IconPhone,
  IconSend,
  IconShield,
  IconSparkle,
  IconWaves,
  Spinner,
} from "./decor";

/* ================= 通用弹层骨架 ================= */

function ModalShell({
  children,
  onClose,
  tone = "paper",
}: {
  children: ReactNode;
  onClose: () => void;
  tone?: "paper" | "sea";
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        aria-label="关闭"
        onClick={onClose}
        className="anim-backdrop-in absolute inset-0 cursor-default bg-[#1d2b4d]/50 backdrop-blur-[3px]"
      />
      <div
        className={`anim-modal-in relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] shadow-[0_24px_70px_rgba(29,43,77,0.35)] sm:rounded-[2rem] ${
          tone === "sea" ? "bg-[#fbfdff]" : "bg-[#fffaf2]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, sub, onClose }: { title: string; sub?: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#eee3d0] px-5 py-4">
      <div>
        <h3 className="font-display text-lg text-ink-deep">{title}</h3>
        {sub && <p className="mt-0.5 text-xs text-ink-soft">{sub}</p>}
      </div>
      <button
        onClick={onClose}
        aria-label="关闭弹窗"
        className="rounded-full bg-[#f3ecdd] p-2 text-ink-soft transition hover:rotate-90 hover:bg-[#eadfc8] hover:text-ink"
      >
        <IconClose className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ================= 心理援助热线 ================= */

function HotlineCard({ h, compact = false }: { h: Hotline; compact?: boolean }) {
  return (
    <a
      href={`tel:${h.phone.replace(/-/g, "")}`}
      className={`group flex items-center justify-between gap-3 rounded-2xl border border-sea-200 bg-white/80 px-4 py-3 transition hover:border-sea-400 hover:shadow-md ${
        compact ? "" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink-deep">{h.name}</p>
        <p className="mt-0.5 truncate text-[11px] text-ink-soft">{h.desc}</p>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-sea-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition group-hover:bg-sea-600">
        <IconPhone className="h-3.5 w-3.5" />
        {h.phone}
      </span>
    </a>
  );
}

export function HotlineList() {
  return (
    <div className="space-y-2">
      {HOTLINES.map((h) => (
        <HotlineCard key={h.phone} h={h} />
      ))}
    </div>
  );
}

/* ================= 风险提醒弹窗（三级） ================= */

export type CareTone = "hard" | "implicit" | "crisis";

interface CareState {
  tone: CareTone;
  matched: string[];
}

const CARE_COPY: Record<CareTone, { title: string; body: string }> = {
  hard: {
    title: "这条消息被拦下了",
    body: "这句话里含有攻击性语言，可能会伤害到别人，所以不能发送。漂流瓶的海，只接纳温柔。",
  },
  implicit: {
    title: "让我们换一种更温暖的说法",
    body: "这句话可能会让对方感到被否定，建议换一种更接纳的表达方式。",
  },
  crisis: {
    title: "你并不孤单",
    body: "我们注意到这段文字里有很重的情绪。在把它说出口之前，请记得这些号码——总有人愿意听你说。",
  },
};

function CareAlert({
  care,
  onClose,
  secondaryLabel,
  onSecondary,
}: {
  care: CareState;
  onClose: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const copy = CARE_COPY[care.tone];
  const tone = care.tone;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-5">
      <button
        aria-label="关闭提醒"
        onClick={onClose}
        className="anim-backdrop-in absolute inset-0 cursor-default bg-[#16223f]/55 backdrop-blur-sm"
      />
      <div
        className={`anim-pop relative w-full max-w-md rounded-[1.75rem] border p-6 shadow-[0_20px_60px_rgba(15,25,50,0.4)] ${
          tone === "hard"
            ? "border-rose-200 bg-[#fff5f5]"
            : tone === "implicit"
              ? "border-[#ffe0c2] bg-[#fff8ef]"
              : "border-sea-200 bg-[#f2f8ff]"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${
              tone === "hard" ? "bg-rose-400" : tone === "implicit" ? "bg-warm-400" : "bg-sea-500"
            }`}
          >
            {tone === "hard" ? (
              <IconShield className="h-5 w-5" />
            ) : tone === "implicit" ? (
              <IconHeartFilled className="h-5 w-5" />
            ) : (
              <IconWaves className="h-5 w-5" />
            )}
          </span>
          <div className="min-w-0">
            <h4 className="font-display text-base text-ink-deep">{copy.title}</h4>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink">{copy.body}</p>
          </div>
        </div>

        {care.matched.length > 0 && tone !== "crisis" && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-ink-soft">检测到的表达：</span>
            {care.matched.slice(0, 4).map((m) => (
              <span
                key={m}
                className={`rounded-full px-2 py-0.5 text-[11px] ${
                  tone === "hard" ? "bg-rose-100 text-rose-600" : "bg-[#fdeed9] text-[#b06f2f]"
                }`}
              >
                “{m}”
              </span>
            ))}
          </div>
        )}

        {tone === "implicit" && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#b0862f]">
            <IconSparkle className="h-3.5 w-3.5" />
            AI 二次审核 · 隐性攻击（微霸凌）防护已开启
          </p>
        )}

        {tone === "crisis" && (
          <div className="mt-4">
            <HotlineList />
            <p className="mt-2.5 text-center text-[11px] text-ink-soft">
              如果身边有人正处于危险中，请直接拨打 110 / 120
            </p>
          </div>
        )}

        <div className="mt-5 flex gap-2.5">
          {secondaryLabel && onSecondary && (
            <button
              onClick={onSecondary}
              className="flex-1 rounded-full border border-[#d8dde9] bg-white px-4 py-2.5 text-sm text-ink-soft transition hover:border-sea-300 hover:text-ink"
            >
              {secondaryLabel}
            </button>
          )}
          <button
            onClick={onClose}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-md transition active:scale-95 ${
              tone === "hard" ? "bg-rose-400 hover:bg-rose-500" : tone === "implicit" ? "bg-warm-400 hover:bg-warm-500" : "bg-sea-500 hover:bg-sea-600"
            }`}
          >
            {tone === "crisis" ? "我知道了，去改写" : "好的，我换个说法"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= 抛瓶子 ================= */

export function ThrowModal({
  open,
  onClose,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  onSend: (content: string, mood?: string) => void;
}) {
  const [text, setText] = useState("");
  const [moodId, setMoodId] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [care, setCare] = useState<CareState | null>(null);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    if (!open) {
      setCare(null);
      setReviewing(false);
    }
  }, [open]);

  if (!open) return null;

  const doSend = () => {
    onSend(text.trim(), moodId ?? undefined);
    setText("");
    setMoodId(null);
  };

  const submit = async () => {
    const t = text.trim();
    if (t.length < 2) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    const risk = checkRisk(t);
    if (risk.level === "crisis") {
      setCare({ tone: "crisis", matched: risk.matched });
      return;
    }
    if (risk.level === "hard") {
      setCare({ tone: "hard", matched: risk.matched });
      return;
    }
    if (risk.level === "implicit") {
      if (AI_CONFIG.apiKey) {
        setReviewing(true);
        const r = await aiModeration(t);
        setReviewing(false);
        if (r.risky) {
          setCare({ tone: "implicit", matched: risk.matched });
          return;
        }
      } else {
        setCare({ tone: "implicit", matched: risk.matched });
        return;
      }
    }
    doSend();
  };

  return (
    <>
      <ModalShell onClose={onClose}>
        <ModalHeader title="写下心事，抛进海里" sub="匿名投放 · 会被某位温柔的人捞起" onClose={onClose} />
        <div className="space-y-4 overflow-y-auto px-5 py-5">
          <div className={`relative ${shake ? "anim-shake" : ""}`}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 200))}
              placeholder="把烦恼、心事、委屈写在这里……海会替你保管。"
              rows={5}
              className="w-full resize-none rounded-2xl border-2 border-[#eee3d0] bg-white/70 px-4 py-3 text-[15px] leading-relaxed text-ink outline-none transition placeholder:text-[#c3bba6] focus:border-sea-400 focus:bg-white"
            />
            <span className="absolute bottom-2.5 right-3.5 text-[11px] text-[#c3bba6]">{text.length}/200</span>
          </div>

          <div>
            <p className="mb-2 text-xs text-ink-soft">此刻的心情（可选）</p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMoodId(moodId === m.id ? null : m.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${m.bg} ${
                    moodId === m.id ? "ring-2 ring-sea-400 ring-offset-1" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-soft">
            <IconShield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            发送前会经过温暖检测：攻击性语言会被拦截，危机信号会得到专业的关怀与帮助。
          </p>

          <button
            onClick={submit}
            disabled={reviewing}
            className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sea-500 to-[#7c8fd8] px-6 py-3.5 text-[15px] font-medium text-white shadow-[0_10px_26px_rgba(95,138,208,0.4)] transition hover:shadow-[0_12px_30px_rgba(95,138,208,0.55)] active:scale-[0.98] disabled:opacity-70"
          >
            {reviewing ? (
              <>
                <Spinner className="h-4 w-4" /> AI 正在审核语气…
              </>
            ) : (
              <>
                <GlassBottle className="h-6 w-auto -rotate-12 transition group-hover:-rotate-45" withPaper />
                匿名抛进大海
              </>
            )}
          </button>
        </div>
      </ModalShell>

      {care && (
        <CareAlert
          care={care}
          onClose={() => setCare(null)}
          secondaryLabel={care.tone === "crisis" ? "我没事，仍要送出" : undefined}
          onSecondary={care.tone === "crisis" ? () => { setCare(null); doSend(); } : undefined}
        />
      )}
    </>
  );
}

/* ================= 捞瓶子 ================= */

type PickPhase = "rising" | "empty" | "letter";

interface LocalHeart {
  id: number;
  x: number;
  delay: number;
  size: number;
  hue: "rose" | "warm";
}

export function PickModal({
  open,
  onClose,
  bottles,
  onSendReply,
  onLikeReply,
  onHug,
  onSwitchToThrow,
}: {
  open: boolean;
  onClose: () => void;
  bottles: Bottle[];
  onSendReply: (bottleId: string, content: string, caring?: boolean) => void;
  onLikeReply: (bottleId: string, replyId: string) => void;
  onHug: (bottleId: string) => void;
  onSwitchToThrow: () => void;
}) {
  const [phase, setPhase] = useState<PickPhase>("rising");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [shake, setShake] = useState(false);
  const [care, setCare] = useState<CareState | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [hearts, setHearts] = useState<Record<string, LocalHeart[]>>({});
  const [sentCaring, setSentCaring] = useState<Set<number>>(new Set());
  const aiTypeRef = useRef<number | null>(null);

  const current = bottles.find((b) => b.id === currentId) ?? null;
  const currentRisk = current ? checkRisk(current.content) : null;
  const isCrisis = currentRisk?.level === "crisis";

  useEffect(() => {
    if (!open) return;
    setCare(null);
    setHearts({});
    setSentCaring(new Set());
    setReply("");
    if (bottles.length === 0) {
      setCurrentId(null);
      setPhase("empty");
      return;
    }
    const picked = pickWeightedBottle(bottles);
    setCurrentId(picked?.id ?? null);
    setPhase("rising");
    const t = window.setTimeout(() => setPhase("letter"), 1150);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(
    () => () => {
      if (aiTypeRef.current) window.clearInterval(aiTypeRef.current);
    },
    []
  );

  if (!open) return null;

  const sendReply = async (content: string, caring = false) => {
    const t = content.trim();
    if (!current) return;
    if (!caring) {
      if (t.length < 2) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      const risk = checkRisk(t);
      if (risk.level === "crisis") {
        setCare({ tone: "crisis", matched: risk.matched });
        return;
      }
      if (risk.level === "hard") {
        setCare({ tone: "hard", matched: risk.matched });
        return;
      }
      if (risk.level === "implicit") {
        if (AI_CONFIG.apiKey) {
          setReviewing(true);
          const r = await aiModeration(t);
          setReviewing(false);
          if (r.risky) {
            setCare({ tone: "implicit", matched: risk.matched });
            return;
          }
        } else {
          setCare({ tone: "implicit", matched: risk.matched });
          return;
        }
      }
    }
    onSendReply(current.id, t, caring);
    setReply("");
  };

  const suggest = async () => {
    if (!current || aiLoading) return;
    setAiLoading(true);
    const s = await getAiSuggestion(current.content);
    const full = `${s.empathy_response}\n${s.gentle_suggestion}`;
    if (aiTypeRef.current) window.clearInterval(aiTypeRef.current);
    let i = 0;
    setReply("");
    aiTypeRef.current = window.setInterval(() => {
      i += 1;
      setReply(full.slice(0, i));
      if (i >= full.length) {
        if (aiTypeRef.current) window.clearInterval(aiTypeRef.current);
        aiTypeRef.current = null;
        setAiLoading(false);
      }
    }, 26);
  };

  const like = (replyId: string) => {
    if (!current) return;
    onLikeReply(current.id, replyId);
    const batch: LocalHeart[] = Array.from({ length: 6 }, (_, k) => ({
      id: Date.now() + k + Math.floor(Math.random() * 999),
      x: Math.random() * 44 - 22,
      delay: Math.random() * 0.35,
      size: 12 + Math.random() * 10,
      hue: Math.random() > 0.5 ? "rose" : "warm",
    }));
    setHearts((h) => ({ ...h, [replyId]: [...(h[replyId] ?? []), ...batch] }));
    window.setTimeout(() => {
      setHearts((h) => ({
        ...h,
        [replyId]: (h[replyId] ?? []).filter((x) => !batch.some((b) => b.id === x.id)),
      }));
    }, 2000);
  };

  const sortedReplies = current
    ? [...current.replies].sort((a, b) => b.likes - a.likes || a.timestamp - b.timestamp)
    : [];

  return (
    <>
      <ModalShell onClose={onClose} tone="sea">
        {phase === "rising" && (
          <div className="relative flex min-h-[340px] flex-1 flex-col items-center justify-end overflow-hidden bg-gradient-to-b from-sea-300 via-sea-500 to-sea-700">
            <div className="absolute left-1/2 top-6 -translate-x-1/2 text-center">
              <p className="font-display text-lg text-white drop-shadow">捞起一个漂流瓶…</p>
              <p className="mt-1 text-xs text-white/80">海浪正把它送到你手边</p>
            </div>
            <div className="anim-rise relative z-10 mb-2 w-24">
              <GlassBottle className="w-full drop-shadow-[0_16px_30px_rgba(15,40,90,0.35)]" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0e2a5c]/60 to-transparent" />
          </div>
        )}

        {phase === "empty" && (
          <div className="relative flex min-h-[420px] flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-sea-300 via-sea-500 to-sea-700 px-8 text-center">
            <div className="anim-bob w-20 opacity-90">
              <GlassBottle className="w-full drop-shadow-[0_16px_30px_rgba(15,40,90,0.35)]" withPaper={false} />
            </div>
            <h3 className="font-display mt-6 text-xl text-white drop-shadow">海面还很安静</h3>
            <p className="mt-2 max-w-[260px] text-[13px] leading-relaxed text-white/85">
              还没有任何漂流瓶漂进来。
              <br />
              不如由你，把第一份心事抛进海里？
            </p>
            <div className="mt-6 flex flex-col items-center gap-2.5">
              <button
                onClick={onSwitchToThrow}
                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-sea-600 shadow-[0_10px_26px_rgba(10,30,70,0.3)] transition hover:shadow-[0_12px_32px_rgba(10,30,70,0.45)] active:scale-95"
              >
                <GlassBottle className="h-5 w-auto -rotate-12" withPaper />
                抛第一个漂流瓶
              </button>
              <button onClick={onClose} className="text-xs text-white/75 underline-offset-4 hover:underline">
                再听一会儿海浪
              </button>
            </div>
          </div>
        )}

        {phase === "letter" && current && (
          <>
            <ModalHeader
              title="捞到一个漂流瓶"
              sub={isCrisis ? "这个瓶子承载着很沉重的心情" : "来自一位匿名的心事主人"}
              onClose={onClose}
            />
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {/* 信纸 */}
              <div className="relative rounded-[1.25rem] border border-[#efe4cd] bg-[#fff8ea] p-5 shadow-inner">
                <span className="absolute -top-2.5 left-6 h-5 w-16 rotate-[-4deg] rounded-sm bg-[#ffe2b8]/80" />
                <div className="flex flex-wrap items-center gap-2">
                  {current.mood && moodOf(current.mood) && (
                    <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${moodOf(current.mood)?.bg}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${moodOf(current.mood)?.dot}`} />
                      {moodOf(current.mood)?.label}
                    </span>
                  )}
                  <span className="text-[11px] text-[#c3b48d]">{timeAgo(current.timestamp)}</span>
                  {isCrisis && (
                    <span className="flex items-center gap-1 rounded-full bg-sea-100 px-2.5 py-1 text-[11px] text-sea-600">
                      <IconWaves className="h-3 w-3" /> 需要关怀
                    </span>
                  )}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{current.content}</p>

                {!isCrisis && (
                  <button
                    onClick={() => onHug(current.id)}
                    className="mt-4 flex items-center gap-1.5 rounded-full border border-blush-300 bg-blush-100 px-3.5 py-1.5 text-xs text-blush-500 transition hover:bg-blush-300/40 active:scale-95"
                  >
                    <IconHeartFilled className="h-3.5 w-3.5" />
                    抱抱 TA · {current.likes}
                  </button>
                )}
              </div>

              {/* 回复区：危机瓶 → 关怀预案；普通瓶 → 自由回复 */}
              {isCrisis ? (
                <div className="space-y-3 rounded-[1.25rem] border border-sea-200 bg-[#f2f8ff] p-4">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sea-500 text-white shadow">
                      <IconShield className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink-deep">危机关怀预案已开启</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
                        为避免无意中的二次伤害，这个瓶子暂不接受自由回复。请先和 TA 分享专业资源，或送上一段写好的关怀寄语。
                      </p>
                    </div>
                  </div>
                  <HotlineList />
                  <div className="flex items-center gap-3 pt-1">
                    <span className="h-px flex-1 bg-sea-200" />
                    <span className="text-[11px] text-ink-soft">或送出一段关怀寄语</span>
                    <span className="h-px flex-1 bg-sea-200" />
                  </div>
                  <div className="space-y-2">
                    {CARING_TEMPLATES.map((tpl, i) => (
                      <button
                        key={i}
                        disabled={sentCaring.has(i)}
                        onClick={() => {
                          sendReply(tpl, true);
                          setSentCaring((s) => new Set(s).add(i));
                        }}
                        className="w-full rounded-2xl border border-sea-200 bg-white/85 px-4 py-3 text-left text-[13px] leading-relaxed text-ink transition hover:border-sea-400 hover:shadow-md disabled:cursor-default disabled:opacity-60"
                      >
                        {tpl}
                        <span className="mt-1.5 block text-[11px] font-medium text-sea-500">
                          {sentCaring.has(i) ? "✓ 已送达" : "点我送出这段关怀"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.25rem] border border-[#eee3d0] bg-white/70 p-4">
                  <button
                    onClick={suggest}
                    disabled={aiLoading}
                    className="mb-3 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#8ea6e8] to-[#b79ae0] px-3.5 py-1.5 text-xs font-medium text-white shadow transition hover:brightness-110 active:scale-95 disabled:opacity-70"
                  >
                    {aiLoading ? <Spinner className="h-3.5 w-3.5" /> : <IconSparkle className="h-3.5 w-3.5" />}
                    {aiLoading ? "AI 正在酝酿温暖…" : "AI 帮我写个温暖回复"}
                  </button>
                  <div className={`relative ${shake ? "anim-shake" : ""}`}>
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value.slice(0, 200))}
                      placeholder="写一句温暖的话给 TA……"
                      rows={3}
                      className="w-full resize-none rounded-2xl border-2 border-[#eee3d0] bg-white px-4 py-3 text-sm leading-relaxed text-ink outline-none transition placeholder:text-[#c3bba6] focus:border-sea-400"
                    />
                    <span className="absolute bottom-2.5 right-3.5 text-[11px] text-[#c3bba6]">{reply.length}/200</span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => sendReply(reply)}
                      disabled={reviewing}
                      className="flex items-center gap-2 rounded-full bg-sea-500 px-5 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-sea-600 active:scale-95 disabled:opacity-70"
                    >
                      {reviewing ? (
                        <>
                          <Spinner className="h-4 w-4" /> 审核中…
                        </>
                      ) : (
                        <>
                          <IconSend className="h-4 w-4" /> 温暖送达
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 回复列表（按温暖度排序） */}
              {sortedReplies.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] text-ink-soft">
                    <IconHeartFilled className="h-3 w-3 text-blush-400" />
                    {sortedReplies.length} 条温暖回复 · 按点赞数从高到低
                  </p>
                  <div className="space-y-2.5">
                    {sortedReplies.map((r) => (
                      <div key={r.id} className="rounded-2xl border border-[#eee3d0] bg-white/75 p-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{r.content}</p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-[11px] text-ink-soft">
                            <span className="font-medium">匿名温暖的人</span>
                            {r.caring && (
                              <span className="rounded-full bg-sea-100 px-2 py-0.5 text-[10px] text-sea-600">关怀寄语</span>
                            )}
                            <span>{timeAgo(r.timestamp)}</span>
                          </div>
                          <div className="relative">
                            {(hearts[r.id] ?? []).map((h) => (
                              <svg
                                key={h.id}
                                viewBox="0 0 24 24"
                                className={`heart-float pointer-events-none absolute bottom-full left-1/2 ${
                                  h.hue === "rose" ? "text-blush-400" : "text-warm-400"
                                }`}
                                style={{ marginLeft: h.x, width: h.size, animationDelay: `${h.delay}s` }}
                              >
                                <path
                                  d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z"
                                  fill="currentColor"
                                />
                              </svg>
                            ))}
                            <button
                              onClick={() => like(r.id)}
                              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition active:scale-90 ${
                                r.likedByMe
                                  ? "border-blush-400 bg-blush-100 text-blush-500"
                                  : "border-[#eee3d0] bg-white text-ink-soft hover:border-blush-300 hover:text-blush-500"
                              }`}
                            >
                              {r.likedByMe ? <IconHeartFilled className="h-3.5 w-3.5" /> : <IconHeart className="h-3.5 w-3.5" />}
                              感到温暖 · {r.likes}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isCrisis && (
                <div className="flex justify-center pb-1">
                  <button
                    onClick={() => {
                      setHearts({});
                      setSentCaring(new Set());
                      setReply("");
                      const picked = pickWeightedBottle(bottles);
                      setCurrentId(picked?.id ?? null);
                      setPhase("rising");
                      window.setTimeout(() => setPhase("letter"), 1150);
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-sea-200 bg-white px-4 py-2 text-xs text-sea-600 transition hover:border-sea-400 active:scale-95"
                  >
                    <IconWaves className="h-3.5 w-3.5" /> 再捞一个
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </ModalShell>

      {care && <CareAlert care={care} onClose={() => setCare(null)} />}
    </>
  );
}
