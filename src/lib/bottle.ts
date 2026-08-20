/* ------------------------------------------------------------------ */
/*  心灵漂流瓶 · 数据层（LocalStorage 模拟，后期可平滑迁移到后端）        */
/* ------------------------------------------------------------------ */

export interface BottleReply {
  id: string;
  content: string;
  timestamp: number;
  likes: number;
  likedByMe: boolean;
  caring?: boolean; // 危机预案下的「关怀寄语」（预设文案，非自由输入）
}

export interface Bottle {
  id: string;
  content: string;
  timestamp: number;
  likes: number; // 抱抱数
  mood?: string;
  replies: BottleReply[];
}

const KEY = "soul-bottle:bottles:v2";
const STATS_KEY = "soul-bottle:stats:v2";

/* ---------------- 安全风控 · 三级内容检测 ---------------- */

export type RiskLevel = "crisis" | "hard" | "implicit" | "safe";

export interface RiskCheck {
  level: RiskLevel;
  matched: string[];
}

/** ③ 危险信号（危机干预）：自伤 / 自杀 / 严重抑郁倾向 */
export const CRISIS_WORDS = [
  "不想活了",
  "活着没意思",
  "结束生命",
  "割腕",
  "跳楼",
  "自杀",
  "自残",
  "不想在这个世界",
  "和世界告别",
  "跳河",
  "上吊",
  "烧炭",
  "了断",
];

/** ① 显性攻击 · 脏话类 */
const PROFANITY = [
  "傻逼",
  "傻x",
  "滚",
  "去死",
  "废物",
  "脑残",
  "智障",
  "贱人",
  "贱货",
  "狗东西",
  "蠢货",
  "畜生",
  "妈的",
  "他妈",
  "狗屎",
  "下头",
  "恶心死了",
];

/** ① 显性攻击 · 威胁类 */
const THREATS = ["打死你", "等着瞧", "弄死你", "要你好看", "揍死你", "给你点颜色", "小心我", "找人收拾你"];

export const HARD_WORDS = [...PROFANITY, ...THREATS];

/** ② 隐性攻击 / 微霸凌（软伤害 · 重点防范，需 AI 二次审核） */
export const IMPLICIT_PHRASES = [
  // 否定感受
  "这有什么好哭的",
  "你想太多了",
  "你就是太闲了",
  "别矫情",
  "矫情",
  "没什么大不了",
  "这有什么大不了",
  "至于吗",
  "太敏感了",
  "小题大做",
  "大惊小怪",
  "这点事",
  "玻璃心",
  "太脆弱",
  "开不起玩笑",
  // 贴标签
  "戏精",
  "怪胎",
  "不合群",
  "装可怜",
  "博同情",
  "爱哭鬼",
  "废物点心",
  // 比较打击
  "别人都没事",
  "就你事多",
  "这点压力都承受不了",
  "别人都可以",
  "别人怎么没",
  "怎么就你这么",
  "这么没用",
  // 反问嘲讽
  "没长脑子",
  "难道只有你觉得",
  "有什么好难过",
  "有什么好伤心",
  "谁没经历过",
  "这点委屈都受不了",
];

/** 需要上下文判断的危机词（避免「释放压力」类误伤） */
function crisisSpecialHits(text: string): string[] {
  const hits: string[] = [];
  if (text.includes("解脱") && !text.includes("释放压力") && !/解脱(压|感)/.test(text)) hits.push("解脱");
  return hits;
}

/**
 * 三级内容检测：危机信号 → 显性攻击 → 隐性攻击 → 安全。
 * 隐性攻击命中后，前端会再调用 aiModeration() 做 AI 二次审核。
 */
export function checkRisk(text: string): RiskCheck {
  const crisis = [
    ...CRISIS_WORDS.filter((w) => text.includes(w)),
    ...crisisSpecialHits(text),
  ];
  if (crisis.length) return { level: "crisis", matched: crisis };

  const hard = HARD_WORDS.filter((w) => text.includes(w));
  if (hard.length) return { level: "hard", matched: hard };

  const implicit = IMPLICIT_PHRASES.filter((p) => text.includes(p));
  if (implicit.length) return { level: "implicit", matched: implicit };

  return { level: "safe", matched: [] };
}

/* ---------------- 危机预案 · 心理援助资源 ---------------- */

export interface Hotline {
  name: string;
  phone: string;
  desc: string;
}

export const HOTLINES: Hotline[] = [
  {
    name: "12355 青少年服务台",
    phone: "12355",
    desc: "共青团中央 · 专为青少年提供心理与法律咨询",
  },
  {
    name: "北京心理危机研究与干预中心",
    phone: "010-82951332",
    desc: "24 小时心理危机干预热线",
  },
  {
    name: "希望 24 热线",
    phone: "400-161-9995",
    desc: "全国生命教育与危机干预热线",
  },
];

/** 危机瓶子下可发送的预设关怀寄语（不允许自由回复，避免二次伤害） */
export const CARING_TEMPLATES = [
  "我认真读完了你的漂流瓶。你正在经历的，绝不是小事，也不需要一个人扛。试着拨一下 12355，电话那头有人真心想听你说。",
  "谢谢你愿意把这些沉重放进瓶子里。你的存在本身就很重要。如果撑不住，请打 010-82951332，一直都有人在。",
  "不知道你经历了怎样的夜晚，但你把瓶子抛进海里，说明你还在期待被听见——我听见了。请给 12355 一个机会，也给自己一个机会，好吗？",
];

/* ---------------- 统计 / 存储 ---------------- */

export interface LifeStats {
  warmIndex: number;
  thrownCount: number;
  receivedLikes: number;
}

const DEFAULT_STATS: LifeStats = { warmIndex: 0, thrownCount: 0, receivedLikes: 0 };

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function loadBottles(): Bottle[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Bottle[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBottles(list: Bottle[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* 存储已满等异常时静默降级 */
  }
}

export function loadStats(): LifeStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    return { ...DEFAULT_STATS, ...(JSON.parse(raw) as Partial<LifeStats>) };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function saveStats(s: LifeStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

/** 温暖指数：由抛瓶、回复与点赞累计而成，上限 100 */
export function computeWarmIndex(s: LifeStats): number {
  return Math.min(100, Math.round(s.thrownCount * 3 + s.receivedLikes * 4));
}

/* ---------------- 随机捞瓶（优先捞回复少的瓶子） ---------------- */

export function pickWeightedBottle(bottles: Bottle[]): Bottle | null {
  if (!bottles.length) return null;
  const weights = bottles.map((b) => 1 / (b.replies.length + 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < bottles.length; i++) {
    r -= weights[i];
    if (r <= 0) return bottles[i];
  }
  return bottles[bottles.length - 1];
}

/* ---------------- 时间文案 ---------------- */

/* ---------------- 心情标签 / 温暖档位 / 勋章 ---------------- */

export interface Mood {
  id: string;
  label: string;
  bg: string;
  dot: string;
}

export const MOODS: Mood[] = [
  { id: "tired", label: "有点疲惫", bg: "bg-[#eef1fb] text-[#5f6db0]", dot: "bg-[#8b9bd8]" },
  { id: "anxious", label: "焦虑中", bg: "bg-[#fdf0e7] text-[#c07b45]", dot: "bg-[#f0a868]" },
  { id: "sad", label: "低落", bg: "bg-[#e9f4f6] text-[#4f8a94]", dot: "bg-[#7fb9c4]" },
  { id: "lost", label: "迷茫", bg: "bg-[#f0ecfa] text-[#7d6bb0]", dot: "bg-[#a895d6]" },
  { id: "ok", label: "只是想说说", bg: "bg-[#e9f6ee] text-[#4f9468]", dot: "bg-[#7fc497]" },
];

export function moodOf(id?: string): Mood | undefined {
  return MOODS.find((m) => m.id === id);
}

export interface WarmLevel {
  min: number;
  label: string;
  desc: string;
}

export const WARM_LEVELS: WarmLevel[] = [
  { min: 0, label: "微风拂面", desc: "海面平静，正等你投下第一份心事" },
  { min: 20, label: "晨光微暖", desc: "第一份温暖已经在海里流动" },
  { min: 40, label: "暖流涌动", desc: "你接住了不少漂流而来的心事" },
  { min: 60, label: "春日海风", desc: "许多人因为你的回复而被治愈" },
  { min: 80, label: "人间骄阳", desc: "你就是这片海最亮的光" },
];

export function warmthLabel(v: number): WarmLevel {
  return [...WARM_LEVELS].reverse().find((l) => v >= l.min) ?? WARM_LEVELS[0];
}

export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  icon: string; // 图标 key，由前端映射为 SVG
  unlocked: (bottles: Bottle[], s: LifeStats) => boolean;
}

export const BADGES: BadgeDef[] = [
  {
    id: "first-throw",
    name: "勇敢的水手",
    desc: "抛出第一个漂流瓶",
    icon: "sail",
    unlocked: (_b, s) => s.thrownCount >= 1,
  },
  {
    id: "replier",
    name: "暖心灯塔",
    desc: "回复 3 个漂流瓶",
    icon: "lighthouse",
    unlocked: (b) => b.filter((x) => x.replies.some((r) => r.likedByMe)).length >= 3,
  },
  {
    id: "warmer",
    name: "点赞小天使",
    desc: "送出 5 次「感到温暖」",
    icon: "heart",
    unlocked: (b) => b.reduce((n, x) => n + x.replies.filter((r) => r.likedByMe).length, 0) >= 5,
  },
  {
    id: "liked",
    name: "被海记住",
    desc: "收获 3 次「感到温暖」",
    icon: "star",
    unlocked: (_b, s) => s.receivedLikes >= 3,
  },
  {
    id: "warm-30",
    name: "暖流使者",
    desc: "温暖指数达到 30",
    icon: "sun",
    unlocked: (_b, s) => computeWarmIndex(s) >= 30,
  },
  {
    id: "caring",
    name: "守望相助",
    desc: "送出 1 条关怀寄语",
    icon: "shield",
    unlocked: (b) => b.some((x) => x.replies.some((r) => r.caring)),
  },
];

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} 天前`;
  return new Date(ts).toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
}
