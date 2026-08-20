/* ------------------------------------------------------------------ */
/*  心灵漂流瓶 · 数据层：类型 / LocalStorage / 种子数据 / 安全过滤      */
/* ------------------------------------------------------------------ */

export type Mood = "焦虑" | "难过" | "迷茫" | "孤独" | "疲惫" | "委屈";

export const MOODS: Mood[] = ["焦虑", "难过", "迷茫", "孤独", "疲惫", "委屈"];

export interface Reply {
  id: string;
  content: string;
  timestamp: number;
  likes: number; // 「感到温暖」次数
  author: string; // 匿名笔名
}

export interface Bottle {
  id: string;
  content: string;
  timestamp: number;
  likes: number; // 「抱抱 TA」次数
  mood: Mood | null;
  penName: string;
  mine?: boolean; // 是否为当前用户所抛（仅本地标记）
  replies: Reply[];
}

export interface UserStats {
  thrown: number;
  replied: number;
  likesGiven: number;
  aiUsed: number;
}

const BOTTLES_KEY = "xlpb:bottles:v1";
const STATS_KEY = "xlpb:stats:v1";

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export const PEN_NAMES = [
  "远方的海龟",
  "打盹的鲸鱼",
  "迷路的信天翁",
  "看星星的水母",
  "晒太阳的海豹",
  "安静的珊瑚",
  "路过的海豚",
  "拾贝的小孩",
  "慢吞吞的寄居蟹",
  "数浪花的海獭",
];

export function randomPenName(): string {
  return PEN_NAMES[Math.floor(Math.random() * PEN_NAMES.length)];
}

/* ------------------------- 种子数据 ------------------------- */

const h = 3600_000;
const d = 24 * h;

function seedBottles(): Bottle[] {
  const now = Date.now();
  return [
    {
      id: uid(),
      content:
        "连续加班第三周了，今晚走出公司大门，突然特别想哭。感觉自己像一台不能停的机器，可是我也会有撑不住的时候啊。",
      timestamp: now - 5 * h,
      likes: 12,
      mood: "疲惫",
      penName: "晒太阳的海豹",
      replies: [
        {
          id: uid(),
          content:
            "连轴转了三周，你已经撑了很久很久。今晚允许自己什么都不做，早点回家，洗个热水澡，好吗？",
          timestamp: now - 4 * h,
          likes: 9,
          author: "路过的海豚",
        },
        {
          id: uid(),
          content: "想哭就哭一会儿吧，眼泪不是软弱，是身体在帮你减压。你已经做得很棒了。",
          timestamp: now - 3 * h,
          likes: 5,
          author: "看星星的水母",
        },
      ],
    },
    {
      id: uid(),
      content:
        "来到这座城市八个月了，通讯录里有三百个人，却找不到一个可以打电话的人。周末的傍晚最难熬，窗外越热闹，屋里越安静。",
      timestamp: now - 26 * h,
      likes: 18,
      mood: "孤独",
      penName: "迷路的信天翁",
      replies: [
        {
          id: uid(),
          content:
            "一个人在大城市里漂着，真的会辛苦。下次傍晚难过的时候，来海边看看日落吧，晚霞会陪你的。",
          timestamp: now - 20 * h,
          likes: 14,
          author: "安静的珊瑚",
        },
        {
          id: uid(),
          content: "抱抱你。你愿意把心事写进瓶子，本身就是一种勇敢的联结呀。",
          timestamp: now - 18 * h,
          likes: 7,
          author: "拾贝的小孩",
        },
      ],
    },
    {
      id: uid(),
      content:
        "考研成绩还有一周就出了，越临近越睡不着。一边怕辜负爸妈，一边又怕面对结果，我是不是太没用了？",
      timestamp: now - 8 * h,
      likes: 8,
      mood: "焦虑",
      penName: "慢吞吞的寄居蟹",
      replies: [
        {
          id: uid(),
          content:
            "备考这段路又长又黑，你已经一步一步走到这里了，这本身就了不起。结果如何，都不影响你这一年的努力发光。",
          timestamp: now - 6 * h,
          likes: 6,
          author: "数浪花的海獭",
        },
      ],
    },
    {
      id: uid(),
      content:
        "分手第 43 天。路过那家我们常去的面馆，还是没忍住点了两碗。明明说好了要向前走，怎么回忆总是先一步拦住我。",
      timestamp: now - 2 * d,
      likes: 15,
      mood: "难过",
      penName: "看星星的水母",
      replies: [
        {
          id: uid(),
          content: "想念不是退步，是认真爱过的证明。两碗面吃完，记得替未来的自己留一点胃口。",
          timestamp: now - 40 * h,
          likes: 11,
          author: "远方的海龟",
        },
        {
          id: uid(),
          content: "43 天了，你一直在努力向前走，偶尔回头看看也没关系的。",
          timestamp: now - 36 * h,
          likes: 4,
          author: "打盹的鲸鱼",
        },
      ],
    },
    {
      id: uid(),
      content:
        "32 岁，没房没车没对象，同学聚会不太想去了。别人都在晒娃晒旅行，我好像把日子过成了别人眼里的反面教材。",
      timestamp: now - 3 * d,
      likes: 10,
      mood: "迷茫",
      penName: "路过的海豚",
      replies: [
        {
          id: uid(),
          content:
            "人生不是统一交卷的考试，每个人的时区都不一样。你把日子过成了自己的样子，这就够了。",
          timestamp: now - 2 * d,
          likes: 8,
          author: "安静的珊瑚",
        },
      ],
    },
    {
      id: uid(),
      content:
        "妈妈今天又在电话里催婚，我挂了电话在楼道里站了好久。不是不想结婚，只是还没等到那个让我安心的人。",
      timestamp: now - 4 * d,
      likes: 6,
      mood: "委屈",
      penName: "拾贝的小孩",
      replies: [],
    },
    {
      id: uid(),
      content:
        "失眠第七天。凌晨三点盯着天花板，脑子里全是白天没说出口的话。原来安静的时候，心事的声音这么大。",
      timestamp: now - 50 * h,
      likes: 4,
      mood: "疲惫",
      penName: "数浪花的海獭",
      replies: [],
    },
  ];
}

/* ----------------------- 读取 / 持久化 ----------------------- */

export function loadBottles(): Bottle[] {
  try {
    const raw = localStorage.getItem(BOTTLES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Bottle[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* 忽略损坏数据 */
  }
  const seeds = seedBottles();
  saveBottles(seeds);
  return seeds;
}

export function saveBottles(bottles: Bottle[]): void {
  try {
    localStorage.setItem(BOTTLES_KEY, JSON.stringify(bottles));
  } catch {
    /* 存储已满等异常时静默 */
  }
}

export function loadStats(): UserStats {
  const base: UserStats = { thrown: 0, replied: 0, likesGiven: 0, aiUsed: 0 };
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return { ...base, ...(JSON.parse(raw) as Partial<UserStats>) };
  } catch {
    /* ignore */
  }
  return base;
}

export function saveStats(stats: UserStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* ignore */
  }
}

/* ------------------------- 捞瓶逻辑 ------------------------- */

/** 随机捞一个瓶子：回复越少的瓶子越容易被捞起，避免重复捞同一个 */
export function pickBottle(bottles: Bottle[], excludeId?: string | null): Bottle | null {
  const pool = bottles.filter((b) => b.id !== excludeId);
  if (pool.length === 0) return null;
  const weighted: Bottle[] = [];
  for (const b of pool) {
    const w = 3 - Math.min(b.replies.length, 2); // 0 回复→3，1 回复→2，≥2→1
    for (let i = 0; i < w; i++) weighted.push(b);
  }
  return weighted[Math.floor(Math.random() * weighted.length)];
}

/* ------------------------- 安全过滤 ------------------------- */

const AGGRESSIVE_WORDS = [
  "傻逼",
  "贱人",
  "废物",
  "白痴",
  "蠢货",
  "去死",
  "该死",
  "找死",
  "弄死",
  "滚蛋",
  "贱货",
  "狗东西",
  "恶心死",
  "脑残",
  "弱智",
];

const CRISIS_WORDS = [
  "自杀",
  "自残",
  "割腕",
  "跳楼",
  "不想活",
  "活着没意思",
  "结束生命",
  "轻生",
  "消失算了",
  "一了百了",
  "安乐死",
];

export type FilterResult =
  | { ok: true }
  | { ok: false; kind: "aggressive" | "crisis" };

export function checkContent(text: string): FilterResult {
  const t = text.toLowerCase();
  if (CRISIS_WORDS.some((w) => t.includes(w))) return { ok: false, kind: "crisis" };
  if (AGGRESSIVE_WORDS.some((w) => t.includes(w))) return { ok: false, kind: "aggressive" };
  return { ok: true };
}

/* ------------------------- 温暖指数 ------------------------- */

export function computeWarmth(bottles: Bottle[]): {
  warmth: number;
  totalReplies: number;
  totalLikes: number;
} {
  const totalReplies = bottles.reduce((s, b) => s + b.replies.length, 0);
  const totalLikes = bottles.reduce(
    (s, b) => s + b.likes + b.replies.reduce((r, x) => r + x.likes, 0),
    0,
  );
  const warmth = Math.min(100, 42 + bottles.length * 3 + totalReplies * 2 + totalLikes);
  return { warmth, totalReplies, totalLikes };
}

export function warmthLabel(w: number): string {
  if (w >= 90) return "暖意融融";
  if (w >= 75) return "温和回暖";
  if (w >= 60) return "微温";
  return "微凉";
}

/* --------------------------- 勋章 --------------------------- */

export type BadgeIconKey = "shell" | "sail" | "lighthouse" | "heart" | "wave" | "star";

export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  icon: BadgeIconKey;
  unlocked: (s: UserStats) => boolean;
}

export const BADGES: BadgeDef[] = [
  {
    id: "first-visit",
    name: "初来乍到",
    desc: "推开海边的门",
    icon: "shell",
    unlocked: () => true,
  },
  {
    id: "sailor",
    name: "勇敢的水手",
    desc: "抛出第 1 个漂流瓶",
    icon: "sail",
    unlocked: (s) => s.thrown >= 1,
  },
  {
    id: "lighthouse",
    name: "暖心灯塔",
    desc: "写下第 1 条温暖回复",
    icon: "lighthouse",
    unlocked: (s) => s.replied >= 1,
  },
  {
    id: "angel",
    name: "点赞小天使",
    desc: "送出 5 次「感到温暖」",
    icon: "heart",
    unlocked: (s) => s.likesGiven >= 5,
  },
  {
    id: "guardian",
    name: "海洋守护者",
    desc: "抛瓶与回复累计 5 次",
    icon: "wave",
    unlocked: (s) => s.thrown + s.replied >= 5,
  },
  {
    id: "catcher",
    name: "心灵捕手",
    desc: "使用 AI 暖言 3 次",
    icon: "star",
    unlocked: (s) => s.aiUsed >= 3,
  },
];

/* --------------------------- 工具 --------------------------- */

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "刚刚";
  if (diff < h) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < d) return `${Math.floor(diff / h)} 小时前`;
  return `${Math.floor(diff / d)} 天前`;
}
