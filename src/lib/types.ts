/* ------------------------------------------------------------------ */
/*  心灵漂流瓶 · 数据模型                                               */
/*  所有集合按「一张 Supabase 表」的形态设计：                           */
/*  users / bottles / replies / notices，时间一律使用 ISO 字符串，      */
/*  id 使用 UUID —— 未来可无痛迁移到 supabase.from('bottles')…          */
/* ------------------------------------------------------------------ */

export type MoodTag = "study" | "exam" | "social" | "family" | "self" | "other";

export interface MoodMeta {
  label: string;
  chip: string;
  dot: string;
  sea: [string, string];
}

export const MOODS: Record<MoodTag, MoodMeta> = {
  study: { label: "学习压力", chip: "bg-[#eaf1fc] text-[#46688f]", dot: "#6b8cc7", sea: ["#a3c2e8", "#6b8fbe"] },
  exam: { label: "考试焦虑", chip: "bg-[#e5ecf8] text-[#3d5e9e]", dot: "#4f74b8", sea: ["#7fa3d4", "#47689f"] },
  social: { label: "人际关系", chip: "bg-[#efeafb] text-[#665a9e]", dot: "#9b8ad0", sea: ["#a8a6dd", "#7377b8"] },
  family: { label: "家庭烦恼", chip: "bg-[#f9ecf2] text-[#9a5f7c]", dot: "#d98ba6", sea: ["#b4a4d8", "#7e74b4"] },
  self: { label: "自我怀疑", chip: "bg-[#e6f3ef] text-[#3f7d6e]", dot: "#63a695", sea: ["#8fc3c0", "#537f96"] },
  other: { label: "其他", chip: "bg-[#f0f2f5] text-[#5c6a85]", dot: "#8fa0bd", sea: ["#a6c1e2", "#6d8fbe"] },
};

export const MOOD_LIST = Object.entries(MOODS) as [MoodTag, MoodMeta][];

export type ReplyStyle = "gentle" | "encourage" | "practical";

export const REPLY_STYLES: Record<ReplyStyle, { label: string; chip: string }> = {
  gentle: { label: "温柔陪伴", chip: "bg-blush-100 text-blush-500" },
  encourage: { label: "鼓励支持", chip: "bg-gold-100 text-gold-500" },
  practical: { label: "实用建议", chip: "bg-mint-100 text-mint-500" },
};

/** users 表 */
export interface UserProfile {
  id: string;
  nickname: string;
  avatarHue: string;
  skin: string;
  frame: string;
  theme: "dawn" | "dusk" | "night";
  energy: number;
  unlocked: string[];
  activeDays: string[];
  createdAt: string;
}

/** bottles 表 */
export interface Bottle {
  id: string;
  authorId: string;
  content: string;
  mood: MoodTag;
  skin: string;
  hugs: number;
  huggedBy: string[];
  wantsReply: boolean;
  target: "ocean" | "self";
  sealedUntil: string | null;
  openedNoticeSent: boolean;
  createdAt: string;
}

/** replies 表 */
export interface Reply {
  id: string;
  bottleId: string;
  authorId: string;
  content: string;
  style: ReplyStyle | null;
  likes: number;
  likedBy: string[];
  reports: number;
  reportedBy: string[];
  createdAt: string;
}

/** notices 表 */
export interface Notice {
  id: string;
  userId: string;
  bottleId: string;
  kind: "reply" | "like" | "opened";
  read: boolean;
  createdAt: string;
}

export interface WeeklyStats {
  thrown: number;
  replied: number;
  warmLabels: number;
  likesGiven: number;
  hugs: number;
  moodCounts: Partial<Record<MoodTag, number>>;
  daysActive: number;
}

export interface LifetimeStats {
  thrown: number;
  replied: number;
  reportsAgainst: number;
  warmLabels: number;
  likesGiven: number;
  streak: number;
}
