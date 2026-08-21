import type { LifetimeStats } from "./types";

/* ------------------------- 心灵守护者 · 勋章 ------------------------- */

export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  icon: "sail" | "shell" | "wave" | "star" | "heart" | "sun";
  earned: (s: LifetimeStats) => boolean;
}

export const BADGES: BadgeDef[] = [
  { id: "voyage", name: "初次远航", desc: "抛出第一个漂流瓶", icon: "sail", earned: (s) => s.thrown >= 1 },
  { id: "shell", name: "拾贝人", desc: "送出第一条温暖回复", icon: "shell", earned: (s) => s.replied >= 1 },
  { id: "listener", name: "倾听者", desc: "累计回复 50 条且从未被举报", icon: "wave", earned: (s) => s.replied >= 50 && s.reportsAgainst === 0 },
  { id: "glimmer", name: "微光", desc: "连续 7 天来到海边", icon: "star", earned: (s) => s.streak >= 7 },
  { id: "empath", name: "共情大师", desc: "获得 10 次「温暖回复」标签", icon: "heart", earned: (s) => s.warmLabels >= 10 },
  { id: "lamplighter", name: "点灯人", desc: "为别人点亮 25 次温暖", icon: "sun", earned: (s) => s.likesGiven >= 25 },
];

/* ----------------------- 能量解锁 · 皮肤与主题 ----------------------- */

export type UnlockType = "skin" | "frame" | "theme";

export interface UnlockDef {
  id: string;
  type: UnlockType;
  name: string;
  desc: string;
  cost: number;
}

export const UNLOCKS: UnlockDef[] = [
  { id: "skin-amber", type: "skin", name: "琥珀瓶", desc: "暖暖的琥珀色玻璃瓶", cost: 30 },
  { id: "frame-sea", type: "frame", name: "海浪头像框", desc: "让头像被一圈海浪环绕", cost: 50 },
  { id: "skin-star", type: "skin", name: "星光瓶", desc: "装着星屑的紫色瓶子", cost: 80 },
  { id: "theme-dusk", type: "theme", name: "暮色海岸", desc: "淡紫色的黄昏海面主题", cost: 100 },
  { id: "frame-gold", type: "frame", name: "鎏金头像框", desc: "一圈温柔的金色光晕", cost: 120 },
  { id: "theme-night", type: "theme", name: "星夜海面", desc: "深蓝夜色与漫天星光", cost: 200 },
];

/** 皮肤 → 瓶中色调 */
export const SKIN_COLORS: Record<string, { paper: string; glow?: string }> = {
  "skin-default": { paper: "#ffe9c9" },
  "skin-amber": { paper: "#ffd9a8" },
  "skin-star": { paper: "#e6dcff", glow: "#b9a5f2" },
};

/** 能量规则 */
export const ENERGY_RULES = {
  throw: 5,
  catch: 2,
  reply: 8,
  like: 1,
  receiveLike: 2,
  hug: 1,
};

export const ENERGY_LABELS: [number, string][] = [
  [0, "刚醒来的小浪花"],
  [40, "会发光的贝壳"],
  [100, "温柔的信风"],
  [200, "海面上的灯塔"],
  [400, "整片暖流"],
];

export function energyTitle(energy: number): string {
  let title = ENERGY_LABELS[0][1];
  for (const [n, label] of ENERGY_LABELS) if (energy >= n) title = label;
  return title;
}
