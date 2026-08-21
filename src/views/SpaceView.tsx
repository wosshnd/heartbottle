import { useEffect, useMemo, useState } from "react";
import type { UserProfile, WeeklyStats } from "../lib/types";
import { MOODS, MOOD_LIST } from "../lib/types";
import { isUnsealed, lifetimeStats, listMine, listMyReplies, isWarmReply, listNotices, listReplies, markAllRead, me, rerollName, spendEnergy, updateMe, weeklyStats } from "../lib/db";
import { BADGES, UNLOCKS, energyTitle } from "../lib/badges";
import { weeklyQuote } from "../lib/ai";
import { countdownLabel, fmtDate, timeAgo, nowIso } from "../lib/time";
import { GlassBottle, MiniBottle } from "../components/ocean";
import { BADGE_ICONS, IconClock, IconGift, IconHeartFilled, IconLock, IconRefresh, IconSparkle, IconStar, Spinner } from "../components/icons";
import { EmptyState, Modal, ModalHeader, useToast } from "../components/ui";

type Tab = "bottles" | "replies" | "growth";

const FRAME_CLASS: Record<string, string> = {
  "frame-none": "ring-2 ring-white",
  "frame-sea": "ring-4 ring-sea-400",
  "frame-gold": "ring-4 ring-gold-400",
};

export function SpaceView({
  user,
  onUserChange,
  onGoThrow,
  onOpenBottle,
}: {
  user: UserProfile;
  onUserChange: (u: UserProfile) => void;
  onGoThrow: () => void;
  onOpenBottle: (id: string) => void;
}) {
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>("bottles");
  const [weekOpen, setWeekOpen] = useState(false);
  const [, force] = useState(0);
  const refresh = () => force((x) => x + 1);

  const stats = useMemo(() => lifetimeStats(), [user.energy, tab]);
  const myBottles = useMemo(() => listMine(), [user.energy, tab]);
  const myReplies = useMemo(() => listMyReplies(), [user.energy, tab]);
  const notices = useMemo(() => listNotices(), [user.energy, tab]);
  const unread = notices.filter((n) => !n.read).length;

  const unlock = (id: string, cost: number) => {
    if (spendEnergy(cost)) {
      onUserChange(updateMe({ unlocked: [...me().unlocked, id] }));
      push("ok", "解锁成功 ✨ 去看看你的新装扮");
      refresh();
    } else {
      push("warn", "心灵能量不够啦，去多送点温暖吧");
    }
  };

  const equip = (type: "skin" | "frame" | "theme", id: string) => {
    if (type === "theme") {
      onUserChange(updateMe({ theme: id.replace("theme-", "") as UserProfile["theme"] }));
      push("ok", "主题已更换，听听海浪的新颜色");
    } else {
      onUserChange(updateMe({ [type]: id } as Partial<UserProfile>));
      push("ok", "装扮已穿上");
    }
    refresh();
  };

  const noticeText = (kind: string) =>
    kind === "reply" ? "有人回信了你的漂流瓶 💌" : kind === "like" ? "你的回复被人点亮了 ❤️" : "你的时间胶囊开启了 ⏳";

  return (
    <div className="anim-fade-up mx-auto max-w-2xl px-4 py-6">
      {/* 身份卡 */}
      <div className="card-soft relative overflow-hidden rounded-[1.6rem] bg-cream p-5">
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-sea-100" aria-hidden="true" />
        <div className="relative flex items-center gap-4">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-medium text-white shadow-md ${FRAME_CLASS[user.frame]}`} style={{ background: user.avatarHue }}>
            {user.nickname.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display truncate text-xl text-ink-deep">{user.nickname}</h1>
              <button onClick={() => { onUserChange(rerollName()); push("ok", "换了个新身份，海还是那片海"); }} aria-label="换一个匿名身份" className="rounded-full bg-cream-deep p-1.5 text-ink-soft transition hover:text-sea-600 active:scale-90">
                <IconRefresh className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-0.5 text-[12px] text-ink-soft">
              匿名身份 · {energyTitle(user.energy)} · 连续 {stats.streak} 天看海
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-1 text-[11px] font-medium text-gold-500">
                <IconSparkle className="h-3 w-3" /> 心灵能量 {user.energy}
              </span>
              <button onClick={() => setWeekOpen(true)} className="flex items-center gap-1 rounded-full bg-dusk-100 px-2.5 py-1 text-[11px] font-medium text-dusk-500 transition hover:bg-dusk-200 active:scale-95">
                <IconGift className="h-3 w-3" /> 心灵周报
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 回信提醒 */}
      {unread > 0 && (
        <div className="card-soft mt-4 rounded-[1.4rem] border border-blush-300 bg-blush-100/70 p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-[13px] font-medium text-blush-500">
              <span className="relative flex h-2.5 w-2.5">
                <span className="anim-pulse-ring absolute inline-flex h-full w-full rounded-full bg-blush-400" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blush-400" />
              </span>
              有 {unread} 条新的回音
            </p>
            <button onClick={() => { markAllRead(); refresh(); }} className="text-[11px] text-ink-soft underline-offset-2 hover:underline">
              全部已读
            </button>
          </div>
          <div className="mt-2 space-y-1.5">
            {notices.filter((n) => !n.read).slice(0, 3).map((n) => (
              <button key={n.id} onClick={() => onOpenBottle(n.bottleId)} className="flex w-full items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-left text-[12px] text-ink transition hover:bg-white">
                <span>{noticeText(n.kind)}</span>
                <span className="text-[10px] text-ink-faint">{timeAgo(n.createdAt)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 标签页 */}
      <div className="mt-5 flex gap-2" role="tablist" aria-label="我的空间">
        {(
          [
            { id: "bottles", label: `我的瓶子 ${myBottles.length}` },
            { id: "replies", label: `我的回复 ${myReplies.length}` },
            { id: "growth", label: "成长与解锁" },
          ] as { id: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-[13px] font-medium transition active:scale-95 ${
              tab === t.id ? "bg-ink-deep text-white shadow" : "bg-white/70 text-ink-soft hover:bg-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {/* 我的瓶子 */}
        {tab === "bottles" &&
          (myBottles.length === 0 ? (
            <EmptyState icon={<GlassBottle className="h-8 w-auto" />} title="还没有抛出过瓶子" desc="把第一份心事交给海吧，也许某个晚上，它就会被人温柔地捞起。">
              <button onClick={onGoThrow} className="rounded-full bg-coral-400 px-6 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-coral-500 active:scale-95">
                去抛一个瓶子
              </button>
            </EmptyState>
          ) : (
            <div className="space-y-2.5">
              {myBottles.map((b) => {
                const sealed = !isUnsealed(b);
                const replyCount = listReplies(b.id).length;
                return (
                  <div key={b.id} className="card-soft rounded-[1.25rem] bg-cream p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <MiniBottle className="w-5" skin={b.skin} />
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${MOODS[b.mood].chip}`}>{MOODS[b.mood].label}</span>
                      {sealed && (
                        <span className="flex items-center gap-1 rounded-full bg-dusk-100 px-2 py-0.5 text-[10px] text-dusk-500">
                          <IconClock className="h-2.5 w-2.5" /> {countdownLabel(b.sealedUntil!)} · {b.target === "self" ? "给未来的自己" : "时间胶囊"}
                        </span>
                      )}
                      {b.wantsReply && replyCount > 0 && !sealed && (
                        <span className="rounded-full bg-blush-100 px-2 py-0.5 text-[10px] text-blush-500">有 {replyCount} 封回信 💌</span>
                      )}
                      <span className="ml-auto text-[10px] text-ink-faint">{timeAgo(b.createdAt)}</span>
                    </div>
                    <p className="font-letter mt-2.5 line-clamp-2 text-[15px] leading-relaxed text-ink">{b.content}</p>
                    <p className="mt-2 text-[11px] text-ink-soft">
                      🤗 {b.hugs} 个拥抱 · 💬 {replyCount} 条回复
                    </p>
                  </div>
                );
              })}
            </div>
          ))}

        {/* 我的回复 */}
        {tab === "replies" &&
          (myReplies.length === 0 ? (
            <EmptyState icon={<IconHeartFilled className="h-6 w-6" />} title="还没有送出过温暖" desc="去捞一个瓶子，写下第一句安慰的话。被标记为「温暖回复」的话，会获得勋章进度哦。" />
          ) : (
            <div className="space-y-2.5">
              {myReplies.map((r) => (
                <div key={r.id} className="card-soft rounded-[1.25rem] bg-cream p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {isWarmReply(r) && (
                      <span className="flex items-center gap-1 rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-medium text-white">
                        <IconStar className="h-2.5 w-2.5" /> 温暖回复
                      </span>
                    )}
                    <span className="rounded-full bg-sea-50 px-2 py-0.5 text-[10px] text-sea-600">❤️ 被点亮 {r.likes} 次</span>
                    <span className="ml-auto text-[10px] text-ink-faint">{timeAgo(r.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink">{r.content}</p>
                </div>
              ))}
            </div>
          ))}

        {/* 成长与解锁 */}
        {tab === "growth" && (
          <div className="space-y-5">
            {/* 勋章 */}
            <div>
              <h2 className="font-display mb-2.5 text-base text-ink-deep">心灵守护者勋章</h2>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {BADGES.map((bd) => {
                  const got = bd.earned(stats);
                  const Icon = BADGE_ICONS[bd.icon];
                  return (
                    <div key={bd.id} className={`card-soft relative rounded-[1.25rem] p-4 text-center ${got ? "bg-cream" : "bg-[#eeeae0]/80"}`}>
                      <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${got ? "bg-gradient-to-br from-gold-300 to-coral-400 text-white shadow" : "bg-[#ddd7c8] text-[#a8a192]"}`}>
                        {got ? <Icon className="h-5 w-5" /> : <IconLock className="h-5 w-5" />}
                      </div>
                      <p className={`font-display mt-2 text-[13px] ${got ? "text-ink-deep" : "text-ink-faint"}`}>{bd.name}</p>
                      <p className="mt-0.5 text-[10px] leading-snug text-ink-soft">{bd.desc}</p>
                      {got && <span className="absolute right-2 top-2 text-[10px]">🏅</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 能量商店 */}
            <div>
              <h2 className="font-display mb-1 text-base text-ink-deep">能量兑换所</h2>
              <p className="mb-2.5 text-[11px] text-ink-soft">每次抛瓶、捞瓶、回复、点赞都会积攒心灵能量，用来解锁瓶子皮肤、头像框和海面主题。</p>
              <div className="space-y-2">
                {UNLOCKS.map((u) => {
                  const owned = user.unlocked.includes(u.id);
                  const equipped = (u.type === "skin" && user.skin === u.id) || (u.type === "frame" && user.frame === u.id) || (u.type === "theme" && `theme-${user.theme}` === u.id);
                  return (
                    <div key={u.id} className="card-soft flex items-center justify-between gap-3 rounded-[1.25rem] bg-cream px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-ink-deep">
                          {u.name}
                          <span className="ml-2 rounded-full bg-sea-50 px-1.5 py-0.5 text-[10px] text-sea-600">{u.type === "skin" ? "瓶子皮肤" : u.type === "frame" ? "头像框" : "海面主题"}</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-soft">{u.desc}</p>
                      </div>
                      {equipped ? (
                        <span className="shrink-0 rounded-full bg-mint-100 px-3 py-1.5 text-xs font-medium text-mint-500">使用中</span>
                      ) : owned ? (
                        <button onClick={() => equip(u.type, u.id)} className="shrink-0 rounded-full bg-sea-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-sea-700 active:scale-95">
                          穿上
                        </button>
                      ) : (
                        <button onClick={() => unlock(u.id, u.cost)} className="flex shrink-0 items-center gap-1 rounded-full border border-gold-300 bg-gold-100 px-3.5 py-1.5 text-xs font-medium text-gold-500 transition hover:bg-gold-300/40 active:scale-95">
                          <IconSparkle className="h-3 w-3" /> {u.cost} 能量
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {weekOpen && <WeeklyModal onClose={() => setWeekOpen(false)} />}
    </div>
  );
}

/* ------------------------------ 心灵周报 ------------------------------ */

function WeeklyModal({ onClose }: { onClose: () => void }) {
  const [ready, setReady] = useState(false);
  const [stats] = useState<WeeklyStats>(() => weeklyStats());
  const quote = useMemo(() => weeklyQuote(stats), [stats]);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 1100);
    return () => window.clearTimeout(t);
  }, []);

  const moodEntries = MOOD_LIST.filter(([id]) => (stats.moodCounts[id] ?? 0) > 0);
  const maxCount = Math.max(1, ...moodEntries.map(([, ]) => 0), ...moodEntries.map(([id]) => stats.moodCounts[id] ?? 0));

  return (
    <Modal onClose={onClose} label="每周心灵周报" wide>
      <ModalHeader title="每周心灵周报" sub={`回顾 · ${fmtDate(nowIso())} 这一周`} onClose={onClose} />
      {!ready ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16">
          <Spinner className="h-8 w-8 text-sea-500" />
          <p className="text-[13px] text-ink-soft">正在把这一周的心事折成信纸…</p>
        </div>
      ) : (
        <div className="overflow-y-auto px-5 py-5">
          <div className="anim-fade-up relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-sea-600 via-sea-500 to-dusk-400 p-6 text-white">
            <span className="absolute right-4 top-4 text-4xl opacity-30" aria-hidden="true">🌊</span>
            <p className="font-letter text-sm opacity-90">这一周的你 ——</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { n: stats.thrown, label: "抛出的瓶子" },
                { n: stats.replied, label: "送出的回复" },
                { n: stats.warmLabels, label: "温暖回复标签" },
                { n: stats.likesGiven, label: "点亮的温暖" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/15 px-3 py-3 text-center backdrop-blur-sm">
                  <p className="font-display text-2xl leading-none">{s.n}</p>
                  <p className="mt-1.5 text-[10px] opacity-85">{s.label}</p>
                </div>
              ))}
            </div>

            {moodEntries.length > 0 && (
              <div className="mt-5">
                <p className="text-[11px] opacity-85">情绪标签的足迹</p>
                <div className="mt-2 space-y-1.5">
                  {moodEntries.map(([id]) => {
                    const c = stats.moodCounts[id] ?? 0;
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <span className="w-14 shrink-0 text-[11px]">{MOODS[id].label}</span>
                        <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/20">
                          <span className="block h-full rounded-full bg-gold-300" style={{ width: `${(c / maxCount) * 100}%` }} />
                        </span>
                        <span className="w-5 text-right text-[11px]">{c}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-5 rounded-2xl bg-white/95 p-4 text-ink">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-dusk-500">
                <IconSparkle className="h-3 w-3" /> AI 为你写的一句话
              </p>
              <p className="font-letter mt-1.5 text-[15px] leading-relaxed">{quote}</p>
            </div>
            <p className="mt-4 text-center text-[10px] opacity-75">心灵漂流瓶 · 给正在变好的你 · 活跃 {stats.daysActive} 天</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
