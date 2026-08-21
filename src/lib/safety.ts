/* ------------------------------------------------------------------ */
/*  温暖守门员 · 内容安全与语气温度                                      */
/*  三级风控：显性攻击（拦截）→ 隐性微霸凌（AI 二次审核）→ 危机信号（预案） */
/* ------------------------------------------------------------------ */

export type RiskLevel = "ok" | "hard" | "implicit" | "crisis";

export interface RiskResult {
  level: RiskLevel;
  matched: string[];
  rewrite: string | null;
}

const HARD_WORDS = [
  "傻逼", "废物", "脑残", "智障", "贱人", "蠢货", "白痴", "去死", "找死", "滚蛋",
  "打死你", "弄死你", "等着瞧", "要你好看", "恶心死了", "垃圾人",
];

const CRISIS_WORDS = [
  "不想活", "活不下去", "结束生命", "了结自己", "自杀", "自残", "割腕", "跳楼", "跳下去",
  "活着没意思", "没有我会更好", "消失算了", "再见了世界", "遗书", "安眠药", "解脱",
];

interface ImplicitRule {
  re: RegExp;
  label: string;
  rewrite: string;
}

const IMPLICIT_RULES: ImplicitRule[] = [
  { re: /想太多|想多了/, label: "否定感受", rewrite: "你在意的这件事，值得被认真对待，不是想太多。" },
  { re: /没什么大不了|不至于|多大点事|有什么好(哭|难过|伤心|伤心)/, label: "轻视感受", rewrite: "这件事让你这么难受，一定有它的原因，我听到了。" },
  { re: /矫情|玻璃心|戏精|太脆弱/, label: "贴标签", rewrite: "愿意把心事说出来，本身就是一种勇敢。" },
  { re: /别人都|怎么就你|大家都没|就你事多/, label: "比较打击", rewrite: "每个人的节奏不同，你不需要和任何人比较。" },
  { re: /你应该|你必须|你得学会|教你做人/, label: "说教口吻", rewrite: "如果愿意的话，也许可以试试一点点小改变，按你自己的节奏来。" },
  { re: /至于吗|难道只有你|没长脑子/, label: "反问嘲讽", rewrite: "有这样的感受很正常，很多人都会在某个时刻和你一样。" },
  { re: /这点(压力|事)|承受不了|这点困难/, label: "贬低压力", rewrite: "压在你身上的，对你来说就是真实的重量。" },
  { re: /别抱怨|别丧了|快点好起来/, label: "催促情绪", rewrite: "情绪需要时间，慢慢来也没关系，我会在这里陪你。" },
];

/** 风险检测：crisis 优先级最高，其次 hard，再次 implicit */
export function checkRisk(text: string): RiskResult {
  const t = text.trim();
  const crisis = CRISIS_WORDS.filter((w) => t.includes(w));
  if (crisis.length) return { level: "crisis", matched: crisis, rewrite: null };
  const hard = HARD_WORDS.filter((w) => t.includes(w));
  if (hard.length) return { level: "hard", matched: hard, rewrite: null };
  for (const rule of IMPLICIT_RULES) {
    if (rule.re.test(t)) return { level: "implicit", matched: [rule.label], rewrite: rule.rewrite };
  }
  return { level: "ok", matched: [], rewrite: null };
}

export const isCrisisText = (text: string) => CRISIS_WORDS.some((w) => text.includes(w));

/* ----------------------- 语气温度计（实时） ----------------------- */

const WARM_WORDS = [
  "理解", "感受", "辛苦", "抱抱", "陪你", "陪伴", "慢慢", "没关系", "已经在", "很棒",
  "听见", "心疼", "支持你", "不是你的错", "愿意", "累了", "休息", "别怕", "我在", "照顾",
];

const COOL_WORDS = [
  "应该", "必须", "想多", "大不了", "矫情", "别人都", "至于吗", "别想", "快点好",
  "有什么好", "这点", "别抱怨", "脆弱", "玻璃心",
];

export interface WarmthResult {
  score: number;
  label: string;
  tone: "cool" | "mid" | "warm";
}

export function warmthScore(text: string): WarmthResult {
  const t = text.trim();
  if (!t) return { score: 0, label: "写点什么吧", tone: "cool" };
  let score = 50;
  for (const w of WARM_WORDS) if (t.includes(w)) score += 7;
  for (const w of COOL_WORDS) if (t.includes(w)) score -= 13;
  if (t.length > 30) score += 5;
  score = Math.max(6, Math.min(98, score));
  if (score < 40) return { score, label: "有点凉，加一点温度吧", tone: "cool" };
  if (score < 62) return { score, label: "微温 · 再多一点关心", tone: "mid" };
  if (score < 82) return { score, label: "温暖 · 像一杯温水", tone: "warm" };
  return { score, label: "很暖 · 像一杯热可可", tone: "warm" };
}

/* -------------------------- 心理援助热线 -------------------------- */

export interface Hotline {
  name: string;
  phone: string;
  desc: string;
}

export const HOTLINES: Hotline[] = [
  { name: "12355 青少年服务台", phone: "12355", desc: "共青团中央 · 青少年心理与法律帮助" },
  { name: "北京心理危机研究与干预中心", phone: "010-82951332", desc: "24 小时心理危机干预热线" },
  { name: "希望 24 热线", phone: "400-161-9995", desc: "全国生命危机干预热线" },
];
