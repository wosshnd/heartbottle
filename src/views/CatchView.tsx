import { useCallback, useEffect, useRef, useState } from "react";
import type { Bottle, Reply, ReplyStyle } from "../lib/types";
import { MOODS, REPLY_STYLES } from "../lib/types";
import { addReply, addEnergy, catchRandom, getBottle, isWarmReply, listReplies, me, reportReply, toggleHug, toggleReplyLike } from "../lib/db";
import { checkRisk, warmthScore } from "../lib/safety";
import { suggestReplies, type AiReplies } from "../lib/ai";
import { timeAgo } from "../lib/time";
import { ENERGY_RULES } from "../lib/badges";
import { GlassBottle, MiniBottle } from "../components/ocean";
import { CareAlert } from "../components/care";
import { EmptyState, Modal, WarmthMeter, useToast } from "../components/ui";
import { IconBottle, IconFlag, IconHeart, IconHeartFilled, IconRefresh, IconSend, IconSparkle, Spinner } from "../components/icons";

interface CareState {
  tone: "hard" | "implicit";
  matched: string[];
  rewrite: string | null;
}

interface LocalHeart {
  id: number;
  x: number;
  delay: number;
  size: number;
  hue: "rose" | "warm";
}

export function CatchView({
  initialBottleId,
  onGoThrow,
  onOpenToolbox,
}: {
  initialBottleId: string | null;
  onGoThrow: () => void;
  onOpenToolbox: (reason: string) => void;
}) {
  const { push } = useToast();
  const [phase, setPhase] = useState<"fetching" | "empty" | "letter">("fetching");
  const [bottle, setBottle] = useState<Bottle | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [composer, setComposer] = useState("");
  const [chosenStyle, setChosenStyle] = useState<ReplyStyle | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReplies, setAiReplies] = useState<AiReplies | null>(null);
  const [sending, setSending] = useState(false);
  const [care, setCare] = useState<CareState | null>(null);
  const [reportTarget, setReportTarget] = useState<Reply | null>(null);
  const [hearts, setHearts] = useState<Record<string, LocalHeart[]>>({});
  const [shake, setShake] = useState(false);
  const usedInitial = useRef(false);

  const fetchOne = useCallback(
    (excludeId?: string) => {
      setPhase("fetching");
      setComposer("");
      setChosenStyle(null);
      setAiOpen(false);
      setAiReplies(null);
      window.setTimeout(() => {
        const b = !usedInitial.current && initialBottleId ? (getBottle(initialBottleId) ?? null) : catchRandom(excludeId);
        usedInitial.current = true;
        if (!b) {
          setBottle(null);
          setPhase("empty");
          return;
        }
        addEnergy(ENERGY_RULES.catch);
        setBottle(b);
        setReplies(listReplies(b.id));
        setPhase("letter");
      }, 850);
    },
    [initialBottleId]
  );

  useEffect(() => {
    fetchOne();
  }, [fetchOne]);

  const warmth = warmthScore(composer);

  const submitReply = () => {
    if (!bottle) return;
    const t = composer.trim();
    if (t.length < 2) {
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
      push("warn", "写一句想对 TA 说的话吧");
      return;
    }
    const risk = checkRisk(t);
    if (risk.level === "crisis") {
      onOpenToolbox("回复里出现了很沉重的词，先照顾一下自己好吗？");
      return;
    }
    if (risk.level === "hard") {
      setCare({ tone: "hard", matched: risk.matched, rewrite: null });
      return;
    }
    if (risk.level === "implicit") {
      setCare({ tone: "implicit", matched: risk.matched, rewrite: risk.rewrite });
      return;
    }
    setSending(true);
    window.setTimeout(() => {
      addReply(bottle.id, t, chosenStyle);
      setReplies(listReplies(bottle.id));
      setComposer("");
      setChosenStyle(null);
      setSending(false);
      push("ok", `温暖已送达 · +${ENERGY_RULES.reply} 能量 ✨`);
    }, 650);
  };

  const openAi = async () => {
    if (!bottle) return;
    setAiOpen(true);
    if (aiReplies) return;
    setAiLoading(true);
    const r = await suggestReplies(bottle.content, bottle.mood);
    setAiReplies(r);
    setAiLoading(false);
  };

  const like = (r: Reply) => {
    if (!bottle) return;
    const { liked } = toggleReplyLike(r.id);
    setReplies(listReplies(bottle.id));
    if (liked) {
      const batch: LocalHeart[] = Array.from({ length: 6 }, (_, k) => ({
        id: Date.now() + k + Math.floor(Math.random() * 999),
        x: Math.random() * 44 - 22,
        delay: Math.random() * 0.35,
        size: 12 + Math.random() * 10,
        hue: Math.random() > 0.5 ? "rose" : "warm",
      }));
      setHearts((h) => ({ ...h, [r.id]: [...(h[r.id] ?? []), ...batch] }));
      window.setTimeout(() => {
        setHearts((h) => ({ ...h, [r.id]: (h[r.id] ?? []).filter((x) => !batch.some((b) => b.id === x.id)) }));
      }, 1900);
    }
  };

  const hug = () => {
    if (!bottle) return;
    const { hugged } = toggleHug(bottle.id);
    setBottle({ ...bottle });
    push("ok", hugged ? "已给 TA 一个拥抱 🤗" : "收回了一个拥抱");
  };

  const confirmReport = () => {
    if (!reportTarget || !bottle) return;
    reportReply(reportTarget.id);
    setReplies(listReplies(bottle.id));
    setReportTarget(null);
    push("warn", "已收到举报，谢谢你守护这片海");
  };

  /* ---------------- 打捞中 ---------------- */
  if (phase === "fetching") {
    return (
      <div className="anim-fade-up mx-auto max-w-xl px-4 py-16 text-center">
        <div className="relative mx-auto flex h-56 w-40 items-end justify-center overflow-hidden rounded-[1.6rem] bg-gradient-to-b from-sea-300 via-sea-500 to-sea-700">
          <div className="anim-rise mb-3 w-20">
            <GlassBottle className="w-full drop-shadow-[0_16px_30px_rgba(15,40,90,0.35)]" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#0e2a5c]/60 to-transparent" />
        </div>
        <p className="font-display mt-6 text-lg text-ink-deep">正在打捞漂流瓶…</p>
        <p className="mt-1 flex items-center justify-center gap-2 text-[13px] text-ink-soft">
          <Spinner className="h-4 w-4 text-sea-500" /> 海浪正把它送到你手边
        </p>
      </div>
    );
  }

  /* ---------------- 空海 ---------------- */
  if (phase === "empty" || !bottle) {
    return (
      <div className="anim-fade-up mx-auto max-w-xl px-4 py-8">
        <EmptyState
          icon={<IconBottle className="h-7 w-7" />}
          title="海面还很安静"
          desc="现在海里还没有可以打捞的漂流瓶。不如由你写下第一份心事，让这片海醒过来？"
        >
          <button onClick={onGoThrow} className="rounded-full bg-coral-400 px-6 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-coral-500 active:scale-95">
            去抛第一个瓶子
          </button>
        </EmptyState>
      </div>
    );
  }

  const mood = MOODS[bottle.mood];
  const isMine = bottle.authorId === me().id;
  const hugged = bottle.huggedBy.includes(me().id);

  return (
    <div className="anim-fade-up mx-auto max-w-xl px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-deep">捞到一个瓶子</h1>
          <p className="mt-1 text-[13px] text-ink-soft">来自一位匿名的心事主人 · {timeAgo(bottle.createdAt)}</p>
        </div>
        <button
          onClick={() => fetchOne(bottle.id)}
          className="flex items-center gap-1.5 rounded-full border border-sea-300 bg-white px-4 py-2 text-xs font-medium text-sea-600 transition hover:bg-sea-50 active:scale-95"
        >
          <IconRefresh className="h-3.5 w-3.5" /> 换一个
        </button>
      </header>

      {/* 瓶子卡片 */}
      <div className="card-soft relative overflow-hidden rounded-[1.6rem] bg-cream">
        <div className="flex items-center justify-between border-b border-line bg-sea-50/70 px-5 py-3">
          <span className="flex items-center gap-2.5">
            <MiniBottle className="w-6" skin={bottle.skin} />
            <span className="text-xs font-medium text-ink-soft">匿名漂流者</span>
          </span>
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${mood.chip}`}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: mood.dot }} />
            {mood.label}
          </span>
        </div>
        <div className="px-5 py-5">
          <p className="font-letter whitespace-pre-wrap text-[17px] leading-relaxed text-ink">{bottle.content}</p>
          {!isMine && (
            <button
              onClick={hug}
              aria-pressed={hugged}
              className={`mt-4 flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition active:scale-95 ${
                hugged ? "border-blush-400 bg-blush-100 text-blush-500" : "border-line bg-white text-ink-soft hover:border-blush-300 hover:text-blush-500"
              }`}
            >
              <IconHeartFilled className="h-3.5 w-3.5" />
              抱抱 TA · {bottle.hugs}
            </button>
          )}
        </div>
      </div>

      {/* 回复输入 */}
      <div className="card-soft mt-4 rounded-[1.6rem] bg-cream p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-ink-soft">写一句温暖的话给 TA</p>
          <button
            onClick={openAi}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-dusk-400 to-blush-400 px-3.5 py-1.5 text-xs font-medium text-white shadow transition hover:brightness-110 active:scale-95"
          >
            <IconSparkle className="h-3.5 w-3.5" /> AI 推荐安慰话术
          </button>
        </div>

        {/* AI 三风格卡片 */}
        {aiOpen && (
          <div className="anim-fade-up mt-3 space-y-2">
            {aiLoading
              ? [0, 1, 2].map((i) => <div key={i} className="shimmer h-16 rounded-2xl" aria-hidden="true" />)
              : aiReplies &&
                (Object.keys(REPLY_STYLES) as ReplyStyle[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setComposer(aiReplies[s]);
                      setChosenStyle(s);
                      push("ok", `已选择「${REPLY_STYLES[s].label}」风格，可以修改后再发送`);
                    }}
                    className={`w-full rounded-2xl border p-3.5 text-left transition hover:shadow-md active:scale-[0.99] ${
                      chosenStyle === s ? "border-sea-400 bg-sea-50" : "border-line bg-white/80"
                    }`}
                  >
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${REPLY_STYLES[s].chip}`}>{REPLY_STYLES[s].label}</span>
                    <span className="mt-1.5 block text-[13px] leading-relaxed text-ink">{aiReplies[s]}</span>
                  </button>
                ))}
            <p className="text-[10px] text-ink-faint">AI 话术仅供参考，避免说教、指责与过度承诺 · 点选后可编辑</p>
          </div>
        )}

        <div className={`mt-3 ${shake ? "anim-shake" : ""}`}>
          <textarea
            id="reply-content"
            value={composer}
            onChange={(e) => setComposer(e.target.value.slice(0, 200))}
            rows={3}
            aria-label="回复内容"
            placeholder={chosenStyle ? `已选择「${REPLY_STYLES[chosenStyle].label}」，改成你自己的语气吧…` : "比如：我看到你了，慢慢来，我在。"}
            className="w-full resize-none rounded-2xl border-2 border-line bg-white/80 px-4 py-3 text-sm leading-relaxed text-ink outline-none transition placeholder:text-[#b8ad92] focus:border-sea-400 focus:bg-white"
          />
          <div className="mt-1 flex items-center justify-between">
            <WarmthMeter w={warmth} />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-ink-faint">发送前由温暖守门员守护语气</span>
          <button
            onClick={submitReply}
            disabled={sending}
            className="flex items-center gap-2 rounded-full bg-sea-600 px-5 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-sea-700 active:scale-95 disabled:opacity-70"
          >
            {sending ? <Spinner className="h-4 w-4" /> : <IconSend className="h-4 w-4" />}
            送出温暖
          </button>
        </div>
      </div>

      {/* 回复列表 */}
      {replies.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] text-ink-soft">
            <IconHeartFilled className="h-3 w-3 text-blush-400" />
            {replies.length} 条回复 · 点赞最高的将被标记为「温暖回复」
          </p>
          <div className="space-y-2.5">
            {replies.map((r, idx) => {
              const warm = isWarmReply(r);
              const folded = r.reports >= 3;
              const liked = r.likedBy.includes(me().id);
              const reported = r.reportedBy.includes(me().id);
              return (
                <div key={r.id} className={`card-soft relative rounded-[1.25rem] bg-cream p-4 ${warm ? "border border-gold-300" : ""}`}>
                  {warm && (
                    <span className="absolute -top-2.5 left-4 flex items-center gap-1 rounded-full bg-gold-400 px-2.5 py-0.5 text-[10px] font-medium text-white shadow">
                      <IconSparkle className="h-2.5 w-2.5" /> 温暖回复
                    </span>
                  )}
                  {folded ? (
                    <p className="py-1 text-[12px] text-ink-faint">该回复因多次举报已被折叠 🍂</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        {r.style && <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${REPLY_STYLES[r.style].chip}`}>{REPLY_STYLES[r.style].label}</span>}
                        <span className="text-[11px] text-ink-faint">匿名温暖的人 · {timeAgo(r.createdAt)}</span>
                        {idx === 0 && r.likes > 0 && <span className="text-[10px] text-gold-500">🏆 最暖</span>}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-ink">{r.content}</p>
                    </>
                  )}
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      onClick={() => !reported && !folded && setReportTarget(r)}
                      disabled={reported || folded}
                      aria-label="举报这条回复"
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] transition active:scale-95 ${
                        reported ? "text-ink-faint" : "text-ink-faint hover:bg-rose-100 hover:text-rose-500"
                      }`}
                    >
                      <IconFlag className="h-3 w-3" /> {reported ? "已举报" : "举报"}
                    </button>
                    <div className="relative">
                      {(hearts[r.id] ?? []).map((h) => (
                        <svg
                          key={h.id}
                          viewBox="0 0 24 24"
                          className="heart-float pointer-events-none absolute bottom-full left-1/2"
                          style={{ marginLeft: h.x, width: h.size, animationDelay: `${h.delay}s`, color: h.hue === "rose" ? "#ea9cb2" : "#f09f7d" }}
                          aria-hidden="true"
                        >
                          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" fill="currentColor" />
                        </svg>
                      ))}
                      <button
                        onClick={() => !folded && like(r)}
                        disabled={folded}
                        aria-pressed={liked}
                        aria-label="感到温暖，点赞"
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition active:scale-90 ${
                          liked ? "border-blush-400 bg-blush-100 text-blush-500" : "border-line bg-white text-ink-soft hover:border-blush-300 hover:text-blush-500"
                        }`}
                      >
                        {liked ? <IconHeartFilled className="h-3.5 w-3.5" /> : <IconHeart className="h-3.5 w-3.5" />}
                        感到温暖 · {r.likes}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 守门员弹窗 */}
      {care && (
        <CareAlert
          tone={care.tone}
          matched={care.matched}
          rewrite={care.rewrite}
          onClose={() => setCare(null)}
          onUseRewrite={(text) => {
            setComposer(text);
            setCare(null);
          }}
        />
      )}

      {/* 举报确认 */}
      {reportTarget && (
        <Modal onClose={() => setReportTarget(null)} label="确认举报">
          <div className="p-6">
            <h3 className="font-display text-lg text-ink-deep">举报这条回复？</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              如果这条回复包含攻击、嘲讽或让人不适的内容，请告诉我们。累计 3 次举报后，它会被折叠，不再展示给其他人。
            </p>
            <div className="mt-5 flex gap-2.5">
              <button onClick={() => setReportTarget(null)} className="flex-1 rounded-full border border-line bg-white px-4 py-2.5 text-sm text-ink-soft transition hover:bg-cream-deep">
                再想想
              </button>
              <button onClick={confirmReport} className="flex-1 rounded-full bg-rose-400 px-4 py-2.5 text-sm font-medium text-white shadow transition hover:bg-rose-500 active:scale-95">
                确认举报
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
