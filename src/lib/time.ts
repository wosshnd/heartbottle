export const nowIso = () => new Date().toISOString();

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return fmtDate(iso);
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysAgoKey(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dayKey(d);
}

export function weekStart(): Date {
  const d = new Date();
  const day = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function inLastDays(iso: string, days: number): boolean {
  return Date.now() - new Date(iso).getTime() < days * 86400000;
}

export function futureIso(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

export function countdownLabel(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "已开启";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  if (d > 0) return `还有 ${d} 天开启`;
  if (h > 0) return `还有 ${h} 小时开启`;
  return "马上开启";
}

/** 连续活跃天数（从最近一次活跃往回数） */
export function calcStreak(activeDays: string[]): number {
  const set = new Set(activeDays);
  let streak = 0;
  for (let i = set.has(dayKey()) ? 0 : 1; ; i++) {
    if (set.has(daysAgoKey(i))) streak++;
    else break;
    if (i > 366) break;
  }
  return streak;
}
