import { useEffect, useMemo, useState } from "react";
import type { Bottle, UserProfile } from "../lib/types";
import { MOODS } from "../lib/types";
import { todayOcean } from "../lib/db";
import { energyTitle } from "../lib/badges";
import { OceanScene } from "../components/ocean";
import { IconBottle, IconPlus, IconSparkle, IconWaves } from "../components/icons";

const SEA_QUOTES = [
  "把心事写下来，它就轻了一半。",
  "每一颗星星，都是一句没说出口的『我懂你』。",
  "海浪不会评判任何一滴水。",
  "你不需要时刻坚强，海面也有起雾的时候。",
  "被捞起的瓶子，都在等一句温柔的回音。",
];

const MOOD_WEATHER: Record<string, string> = {
  study: "今天的学习压力像一片低云，海的色调沉了一些。别担心，云会散的。",
  exam: "考试焦虑让海面泛起深蓝。深呼吸，浪再高也会退。",
  social: "人际关系的薄雾飘过海面，紫色是心事，也是温柔。",
  family: "家的牵挂让海面染上暮色。慢慢来，港湾一直在。",
  self: "自我怀疑像退潮，露出的沙地上其实写满了你走过的路。",
  other: "今天的海面很平静，正适合把心事轻轻放下。",
};

export function HomeView({
  user,
  onThrow,
  onCatch,
  onSpace,
  onOpenBottle,
}: {
  user: UserProfile;
  onThrow: () => void;
  onCatch: () => void;
  onSpace: () => void;
  onOpenBottle: (b: Bottle) => void;
}) {
  const ocean = useMemo(() => todayOcean(), []);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setQuoteIdx((i) => (i + 1) % SEA_QUOTES.length), 6000);
    return () => window.clearInterval(t);
  }, []);

  const night = user.theme === "night";
  const total = ocean.drifting.length;

  return (
    <div className="anim-fade-up">
      {/* ------- 情绪海洋 ------- */}
      <OceanScene
        theme={user.theme}
        sea={ocean.sea}
        bottles={ocean.drifting}
        bottleCountToday={ocean.bottlesToday}
        repliesToday={ocean.repliesToday}
        onBottleClick={onOpenBottle}
        className="h-[62vh] min-h-[420px] rounded-b-[2rem] md:h-[64vh]"
      >
        <div className="flex h-full flex-col justify-between p-5 md:p-8">
          {/* 标题区：左对齐，避免居中式模板 */}
          <div className="max-w-[85%]">
            <p className={`flex items-center gap-1.5 text-xs font-medium tracking-wide ${night ? "text-sea-200" : "text-sea-600"}`}>
              <IconWaves className="h-3.5 w-3.5" /> 匿名心理互助 · 面向学生
            </p>
            <h1 className={`font-display mt-2 text-4xl leading-tight md:text-5xl ${night ? "text-white" : "text-ink-deep"}`}>
              心灵漂流瓶
            </h1>
            <p className={`font-letter mt-2 text-base md:text-lg ${night ? "text-sea-100" : "text-ink-soft"}`}>
              把心事放进瓶子，让温暖漂到你身边
            </p>
          </div>

          {/* 数据图例：浪高 = 瓶子，星光 = 回复 */}
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm ${night ? "bg-white/15 text-white" : "bg-white/70 text-ink"}`}>
              🌊 今日 {ocean.bottlesToday} 个漂流瓶 · 海浪因心事起伏
            </span>
            <span className={`rounded-full px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm ${night ? "bg-white/15 text-white" : "bg-white/70 text-ink"}`}>
              ✨ 今日 {ocean.repliesToday} 条温暖回复 · 化作星光升起
            </span>
            {ocean.dominantMood && (
              <span className={`rounded-full px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm ${night ? "bg-white/15 text-white" : "bg-white/70 text-ink"}`}>
                🎨 今日海面情绪 · {MOODS[ocean.dominantMood].label}
              </span>
            )}
          </div>

          {/* 双主按钮 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <button
              onClick={onThrow}
              className="group flex items-center justify-center gap-2.5 rounded-full bg-coral-400 px-8 py-4 text-lg font-medium text-white shadow-[0_14px_32px_rgba(229,127,88,0.5)] transition hover:-translate-y-1 hover:bg-coral-500 hover:shadow-[0_18px_40px_rgba(229,127,88,0.6)] active:scale-95"
            >
              <IconPlus className="h-5 w-5 transition group-hover:rotate-90" />
              抛一个瓶子
            </button>
            <button
              onClick={onCatch}
              className="group flex items-center justify-center gap-2.5 rounded-full bg-sea-600 px-8 py-4 text-lg font-medium text-white shadow-[0_14px_32px_rgba(61,101,158,0.5)] transition hover:-translate-y-1 hover:bg-sea-700 hover:shadow-[0_18px_40px_rgba(61,101,158,0.6)] active:scale-95"
            >
              <IconBottle className="h-5 w-5 transition group-hover:-rotate-12" />
              捞一个瓶子
              {total > 0 && <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">{total}</span>}
            </button>
          </div>
        </div>
      </OceanScene>

      {/* ------- 海面之下 ------- */}
      <div className="mx-auto -mt-5 max-w-3xl space-y-4 px-4 pb-6">
        {/* 今日心情天气 */}
        <div className="card-soft rounded-[1.4rem] bg-cream p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base text-ink-deep">今日心情天气</h2>
            <span className="text-[11px] text-ink-faint">数据只存在你的浏览器里</span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-ink">
            {ocean.dominantMood ? MOOD_WEATHER[ocean.dominantMood] : "海面还很安静，大家都在等第一个勇敢的人。不如由你开始？"}
          </p>
        </div>

        {/* 海边的话 */}
        <div className="card-soft relative overflow-hidden rounded-[1.4rem] bg-dusk-100 p-5">
          <span className="absolute -right-6 -top-8 text-[110px] leading-none text-dusk-300/50 select-none" aria-hidden="true">
            ”
          </span>
          <p className="font-letter text-lg leading-relaxed text-ink-deep" key={quoteIdx}>
            <span className="anim-fade-up inline-block">{SEA_QUOTES[quoteIdx]}</span>
          </p>
          <p className="mt-2 text-[11px] text-ink-soft">—— 海边的话 · 每 6 秒换一句</p>
        </div>

        {/* 能量速览 */}
        <button
          onClick={onSpace}
          className="card-soft flex w-full items-center justify-between rounded-[1.4rem] bg-cream p-5 text-left transition hover:-translate-y-0.5"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-100 text-gold-500">
              <IconSparkle className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-medium text-ink-deep">
                {user.nickname} · {energyTitle(user.energy)}
              </span>
              <span className="mt-0.5 block text-[11px] text-ink-soft">心灵能量 {user.energy} · 去「我的空间」看勋章与周报</span>
            </span>
          </span>
          <span className="text-sea-500">›</span>
        </button>
      </div>
    </div>
  );
}
