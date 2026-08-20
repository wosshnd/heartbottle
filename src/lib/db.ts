import type { Bottle, LifetimeStats, MoodTag, Notice, Reply, ReplyStyle, UserProfile, WeeklyStats } from "./types";
import { MOODS } from "./types";
import { calcStreak, dayKey, inLastDays, isToday, nowIso, weekStart } from "./time";
import { ENERGY_RULES } from "./badges";

/* ------------------------------------------------------------------ */
/*  数据仓库 · 以 localStorage 模拟四张表（users / bottles / replies /  */
/*  notices）。每个函数都对应未来的 Supabase 调用，迁移时只需替换实现。  */
/* ------------------------------------------------------------------ */

const KEY = "xlpb.db.v1";

interface DbShape {
  users: UserProfile[];
  bottles: Bottle[];
  replies: Reply[];
  notices: Notice[];
}

let cache: DbShape | null = null;

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function fresh(): DbShape {
  return { users: [], bottles: [], replies: [], notices: [] };
}

function load(): DbShape {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as DbShape) : fresh();
  } catch {
    cache = fresh();
  }
  return cache!;
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(load()));
  } catch {
    /* 存储不可用时静默降级为内存模式 */
  }
}

/* ------------------------------ users ------------------------------ */

const NAME_A = ["北海的", "雾岛", "晚风", "拾星的", "南屿的", "慢吞吞的", "半山", "萤火", "浅海的", "云边的"];
const NAME_B = ["鲸", "信", "信使", "人", "灯塔", "云", "听雨", "值班员", "邮差", "月亮"];

function makeUser(): UserProfile {
  return {
    id: uid(),
    nickname: NAME_A[Math.floor(Math.random() * NAME_A.length)] + NAME_B[Math.floor(Math.random() * NAME_B.length)],
    avatarHue: ["#8cb8e6", "#a996d6", "#f09f7d", "#63a695", "#ea9cb2"][Math.floor(Math.random() * 5)],
    skin: "skin-default",
    frame: "frame-none",
    theme: "dawn",
    energy: 0,
    unlocked: [],
    activeDays: [],
    createdAt: nowIso(),
  };
}

/** 启动：确保当前匿名用户存在，并扫描到期的时间胶囊 */
export function boot(): UserProfile {
  const db = load();
  let me = db.users[0];
  if (!me) {
    me = makeUser();
    db.users.push(me);
  }
  const today = dayKey();
  if (!me.activeDays.includes(today)) {
    me.activeDays.push(today);
    persist();
  }
  /* 时间胶囊到期提醒 */
  for (const b of db.bottles) {
    if (b.sealedUntil && new Date(b.sealedUntil).getTime() <= Date.now() && !b.openedNoticeSent) {
      b.openedNoticeSent = true;
      if (b.target === "self") {
        db.notices.push({ id: uid(), userId: b.authorId, bottleId: b.id, kind: "opened", read: false, createdAt: nowIso() });
      }
    }
  }
  persist();
  return me;
}

export function me(): UserProfile {
  return load().users[0];
}

export function updateMe(patch: Partial<UserProfile>): UserProfile {
  const u = me();
  Object.assign(u, patch);
  persist();
  return u;
}

export function rerollName(): UserProfile {
  return updateMe({
    nickname: NAME_A[Math.floor(Math.random() * NAME_A.length)] + NAME_B[Math.floor(Math.random() * NAME_B.length)],
    avatarHue: ["#8cb8e6", "#a996d6", "#f09f7d", "#63a695", "#ea9cb2"][Math.floor(Math.random() * 5)],
  });
}

/** 获得能量并记录活跃日 */
export function addEnergy(n: number): UserProfile {
  const u = me();
  u.energy = Math.max(0, u.energy + n);
  const today = dayKey();
  if (!u.activeDays.includes(today)) u.activeDays.push(today);
  persist();
  return u;
}

export function spendEnergy(cost: number): boolean {
  const u = me();
  if (u.energy < cost) return false;
  u.energy -= cost;
  persist();
  return true;
}

/* ----------------------------- bottles ----------------------------- */

/** 判断瓶子此刻是否可见（时间胶囊是否已开启） */
export const isUnsealed = (b: Bottle) => !b.sealedUntil || new Date(b.sealedUntil).getTime() <= Date.now();

export function listDrifting(): Bottle[] {
  return load()
    .bottles.filter((b) => b.target === "ocean" && isUnsealed(b))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listMine(): Bottle[] {
  const id = me().id;
  return load()
    .bottles.filter((b) => b.authorId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getBottle(id: string): Bottle | undefined {
  return load().bottles.find((b) => b.id === id);
}

/** 随机捞瓶：排除自己写的与刚看过的 */
export function catchRandom(excludeId?: string): Bottle | null {
  const id = me().id;
  const pool = listDrifting().filter((b) => b.authorId !== id && b.id !== excludeId);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** 插入一条瓶子 —— 未来：supabase.from('bottles').insert(...) */
export function createBottle(input: {
  content: string;
  mood: MoodTag;
  wantsReply: boolean;
  target: "ocean" | "self";
  sealedUntil: string | null;
}): Bottle {
  const u = me();
  const bottle: Bottle = {
    id: uid(),
    authorId: u.id,
    content: input.content,
    mood: input.mood,
    skin: u.skin,
    hugs: 0,
    huggedBy: [],
    wantsReply: input.wantsReply,
    target: input.target,
    sealedUntil: input.sealedUntil,
    openedNoticeSent: !input.sealedUntil,
    createdAt: nowIso(),
  };
  load().bottles.push(bottle);
  addEnergy(ENERGY_RULES.throw);
  return bottle;
}

export function toggleHug(bottleId: string): { bottle: Bottle; hugged: boolean } {
  const b = getBottle(bottleId)!;
  const id = me().id;
  const idx = b.huggedBy.indexOf(id);
  if (idx >= 0) {
    b.huggedBy.splice(idx, 1);
    b.hugs = Math.max(0, b.hugs - 1);
    persist();
    return { bottle: b, hugged: false };
  }
  b.huggedBy.push(id);
  b.hugs += 1;
  addEnergy(ENERGY_RULES.hug);
  persist();
  return { bottle: b, hugged: true };
}

/* ----------------------------- replies ----------------------------- */

/** 某瓶子的回复，按点赞降序（同赞按时间升序） */
export function listReplies(bottleId: string): Reply[] {
  return load()
    .replies.filter((r) => r.bottleId === bottleId)
    .sort((a, b) => b.likes - a.likes || a.createdAt.localeCompare(b.createdAt));
}

export function addReply(bottleId: string, content: string, style: ReplyStyle | null): Reply {
  const u = me();
  const reply: Reply = {
    id: uid(),
    bottleId,
    authorId: u.id,
    content,
    style,
    likes: 0,
    likedBy: [],
    reports: 0,
    reportedBy: [],
    createdAt: nowIso(),
  };
  load().replies.push(reply);
  addEnergy(ENERGY_RULES.reply);
  /* 「希望收到回信」→ 通知瓶主 */
  const bottle = getBottle(bottleId);
  if (bottle && bottle.wantsReply && bottle.authorId !== u.id) {
    load().notices.push({ id: uid(), userId: bottle.authorId, bottleId, kind: "reply", read: false, createdAt: nowIso() });
  }
  persist();
  return reply;
}

export function toggleReplyLike(replyId: string): { reply: Reply; liked: boolean } {
  const r = load().replies.find((x) => x.id === replyId)!;
  const id = me().id;
  const idx = r.likedBy.indexOf(id);
  if (idx >= 0) {
    r.likedBy.splice(idx, 1);
    r.likes = Math.max(0, r.likes - 1);
    persist();
    return { reply: r, liked: false };
  }
  r.likedBy.push(id);
  r.likes += 1;
  addEnergy(ENERGY_RULES.like);
  if (r.authorId !== id) {
    load().notices.push({ id: uid(), userId: r.authorId, bottleId: r.bottleId, kind: "like", read: false, createdAt: nowIso() });
  }
  persist();
  return { reply: r, liked: true };
}

export function reportReply(replyId: string): Reply {
  const r = load().replies.find((x) => x.id === replyId)!;
  const id = me().id;
  if (!r.reportedBy.includes(id)) {
    r.reportedBy.push(id);
    r.reports += 1;
    persist();
  }
  return r;
}

export function listMyReplies(): Reply[] {
  const id = me().id;
  return load()
    .replies.filter((r) => r.authorId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ----------------------------- notices ----------------------------- */

export function listNotices(): Notice[] {
  const id = me().id;
  return load()
    .notices.filter((n) => n.userId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const unreadCount = () => listNotices().filter((n) => !n.read).length;

export function markAllRead(): void {
  const id = me().id;
  for (const n of load().notices) if (n.userId === id) n.read = true;
  persist();
}

/* ------------------------------ 统计 ------------------------------ */

/** 回复是否为该瓶「温暖回复」（点赞最高且 > 0） */
export function isWarmReply(reply: Reply): boolean {
  const list = listReplies(reply.bottleId);
  return list.length > 0 && list[0].id === reply.id && reply.likes > 0;
}

export function weeklyStats(): WeeklyStats {
  const u = me();
  const db = load();
  const ws = weekStart();
  const thrown = db.bottles.filter((b) => b.authorId === u.id && new Date(b.createdAt) >= ws);
  const mine = db.replies.filter((r) => r.authorId === u.id && new Date(r.createdAt) >= ws);
  const moodCounts: Partial<Record<MoodTag, number>> = {};
  for (const b of thrown) moodCounts[b.mood] = (moodCounts[b.mood] ?? 0) + 1;
  let likesGiven = 0;
  for (const r of db.replies) if (r.likedBy.includes(u.id) && new Date(r.createdAt) >= ws) likesGiven++;
  return {
    thrown: thrown.length,
    replied: mine.length,
    warmLabels: mine.filter((r) => isWarmReply(r)).length,
    likesGiven,
    hugs: thrown.reduce((a, b) => a + b.hugs, 0),
    moodCounts,
    daysActive: u.activeDays.filter((d) => new Date(`${d}T00:00:00`) >= ws).length,
  };
}

export function lifetimeStats(): LifetimeStats {
  const u = me();
  const db = load();
  const myReplies = db.replies.filter((r) => r.authorId === u.id);
  return {
    thrown: db.bottles.filter((b) => b.authorId === u.id).length,
    replied: myReplies.length,
    reportsAgainst: myReplies.reduce((a, r) => a + r.reports, 0),
    warmLabels: myReplies.filter((r) => isWarmReply(r)).length,
    likesGiven: db.replies.reduce((a, r) => a + (r.likedBy.includes(u.id) ? 1 : 0), 0),
    streak: calcStreak(u.activeDays),
  };
}

/* ------------------------- 首页 · 情绪海洋 ------------------------- */

export function todayOcean() {
  const db = load();
  const bottlesToday = db.bottles.filter((b) => isToday(b.createdAt) && b.target === "ocean");
  const repliesToday = db.replies.filter((r) => isToday(r.createdAt));
  const moodCounts: Partial<Record<MoodTag, number>> = {};
  for (const b of bottlesToday) moodCounts[b.mood] = (moodCounts[b.mood] ?? 0) + 1;
  let dominant: MoodTag | null = null;
  let max = 0;
  for (const [k, v] of Object.entries(moodCounts)) {
    if ((v ?? 0) > max) {
      max = v ?? 0;
      dominant = k as MoodTag;
    }
  }
  const sea = dominant ? MOODS[dominant].sea : (["#a6c1e2", "#6d8fbe"] as [string, string]);
  return {
    bottlesToday: bottlesToday.length,
    repliesToday: repliesToday.length,
    dominantMood: dominant,
    sea,
    drifting: listDrifting().filter((b) => b.authorId !== me().id),
  };
}
