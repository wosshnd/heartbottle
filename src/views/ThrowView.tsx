import { useMemo, useState } from "react";
import type { MoodTag } from "../lib/types";
import { MOOD_LIST } from "../lib/types";
import { checkRisk, isCrisisText } from "../lib/safety";
import { createBottle } from "../lib/db";
import { futureIso } from "../lib/time";
import { ENERGY_RULES } from "../lib/badges";
import { GlassBottle } from "../components/ocean";
import { CareAlert } from "../components/care";
import { Spinner, IconClock, IconSend, IconWind } from "../components/icons";
import { Switch, useToast } from "../components/ui";

interface CareState {
  tone: "hard" | "implicit";
  matched: string[];
  rewrite: string | null;
}

export function ThrowView({
  onBack,
  onGoCatch,
  onOpenToolbox,
}: {
  onBack: () => void;
  onGoCatch: () => void;
  onOpenToolbox: (reason: string) => void;
}) {
  const { push } = useToast();
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<MoodTag | null>(null);
  const [wantsReply, setWantsReply] = useState(true);
  const [future, setFuture] = useState(false);
  const [capDays, setCapDays] = useState<number | "custom">(7);
  const [customDate, setCustomDate] = useState("");
  const [target, setTarget] = useState<"ocean" | "self">("ocean");
  const [phase, setPhase] = useState<"edit" | "sending" | "done">("edit");
  const [care, setCare] = useState<CareState | null>(null);
  const [shake, setShake] = useState(false);
  const [doneMsg, setDoneMsg] = useState("");

  const danger = useMemo(() => isCrisisText(content), [content]);
  const tomorrow = useMemo(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10), []);

  const doSend = () => {
    setPhase("sending");
    window.setTimeout(() => {
      const sealedUntil = future
        ? capDays === "custom"
          ? customDate
            ? new Date(`${customDate}T08:00:00`).toISOString()
            : null
          : futureIso(capDays)
        : null;
      createBottle({
        content: content.trim(),
        mood: mood ?? "other",
        wantsReply,
        target: future ? target : "ocean",
        sealedUntil,
      });
      setDoneMsg(
        sealedUntil
          ? target === "self"
            ? "这封信被时间好好收着，到了那一天，会在「我的空间」悄悄打开。"
            : "这是一只未来的瓶子，时间到了，它才会漂进海里被别人捞起。"
          : wantsReply
            ? "瓶子已经出发。有人回信时，你会在「我的空间」收到提醒。"
            : "瓶子已经出发，正随着海浪漂向某个需要它的人。"
      );
      setPhase("done");
    }, 900);
  };

  const submit = () => {
    const t = content.trim();
    if (t.length < 4) {
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
      push("warn", "再多写几个字吧，海才能听见你");
      return;
    }
    const risk = checkRisk(t);
    if (risk.level === "crisis") {
      onOpenToolbox("我们注意到瓶子里有很沉重的心事，先照顾一下自己好吗？");
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
    doSend();
  };

  const reset = () => {
    setContent("");
    setMood(null);
    setFuture(false);
    setPhase("edit");
  };

  /* ---------------- 成功页 ---------------- */
  if (phase === "done") {
    return (
      <div className="anim-fade-up mx-auto max-w-xl px-4 py-10 text-center">
        <div className="anim-bob mx-auto w-24">
          <GlassBottle className="w-full drop-shadow-[0_16px_28px_rgba(70,100,170,0.3)]" />
        </div>
        <h2 className="font-display mt-6 text-2xl text-ink-deep">漂流瓶已出发 🌊</h2>
        <p className="mx-auto mt-3 max-w-[340px] text-[14px] leading-relaxed text-ink">{doneMsg}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-4 py-1.5 text-xs font-medium text-gold-500">
          ✨ 获得 {ENERGY_RULES.throw} 点心灵能量
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button onClick={reset} className="w-full rounded-full border border-sea-300 bg-white px-7 py-3 text-sm font-medium text-sea-600 transition hover:bg-sea-50 active:scale-95 sm:w-auto">
            再写一个
          </button>
          <button onClick={onGoCatch} className="w-full rounded-full bg-sea-600 px-7 py-3 text-sm font-medium text-white shadow-md transition hover:bg-sea-700 active:scale-95 sm:w-auto">
            去捞一个瓶子
          </button>
          <button onClick={onBack} className="text-sm text-ink-soft underline-offset-4 hover:underline">
            回首页
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- 编辑页 ---------------- */
  return (
    <div className="anim-fade-up mx-auto max-w-xl px-4 py-6">
      <header className="mb-4">
        <h1 className="font-display text-2xl text-ink-deep">抛一个瓶子</h1>
        <p className="mt-1 text-[13px] text-ink-soft">匿名写下心事，让海替你保管。没有人知道这是谁写的。</p>
      </header>

      <div className="card-soft rounded-[1.6rem] bg-cream p-5">
        {/* 文本框 */}
        <div className={shake ? "anim-shake" : ""}>
          <label htmlFor="throw-content" className="mb-2 block text-xs font-medium text-ink-soft">
            心事内容
          </label>
          <textarea
            id="throw-content"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 300))}
            rows={6}
            placeholder="最近有什么压在心头的事？学习、考试、朋友、家人，或者只是说不出的闷……写下来吧。"
            className="w-full resize-none rounded-2xl border-2 border-line bg-white/80 px-4 py-3 text-[15px] leading-relaxed text-ink outline-none transition placeholder:text-[#b8ad92] focus:border-sea-400 focus:bg-white"
          />
          <div className="mt-1 text-right text-[11px] text-ink-faint">{content.length}/300</div>
        </div>

        {/* 危机信号实时关怀 */}
        {danger && (
          <div className="anim-fade-up mt-2 flex items-start justify-between gap-3 rounded-2xl border border-coral-300 bg-coral-100 px-4 py-3">
            <p className="text-[13px] leading-relaxed text-[#9c5230]">
              <span className="font-medium">这些字看起来真的很重。</span>
              <br />
              写出来是勇敢的一步。如果需要，工具箱里有呼吸练习和 24 小时热线。
            </p>
            <button
              onClick={() => onOpenToolbox("我们注意到你写下了很沉重的心事。")}
              className="flex shrink-0 items-center gap-1 rounded-full bg-coral-400 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-coral-500 active:scale-95"
            >
              <IconWind className="h-3.5 w-3.5" /> 急救工具箱
            </button>
          </div>
        )}

        {/* 情绪标签 */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-ink-soft">情绪标签</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="情绪标签">
            {MOOD_LIST.map(([id, m]) => (
              <button
                key={id}
                aria-pressed={mood === id}
                onClick={() => setMood(mood === id ? null : id)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs transition active:scale-95 ${m.chip} ${
                  mood === id ? "ring-2 ring-sea-400 ring-offset-1 ring-offset-cream" : "opacity-75 hover:opacity-100"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.dot }} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* 回信开关 */}
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-sea-50 px-4 py-3">
          <span>
            <span className="block text-[13px] font-medium text-ink-deep">希望收到回信</span>
            <span className="mt-0.5 block text-[11px] text-ink-soft">有人回复时，你会在「我的空间」收到匿名提醒</span>
          </span>
          <Switch on={wantsReply} onChange={setWantsReply} label="希望收到回信" />
        </div>

        {/* 时间胶囊 */}
        <div className="mt-3 rounded-2xl border border-line bg-white/70 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-dusk-400" />
              <span className="text-[13px] font-medium text-ink-deep">时间胶囊 · 写给未来</span>
            </span>
            <Switch on={future} onChange={setFuture} label="时间胶囊模式" />
          </div>
          {future && (
            <div className="anim-fade-up mt-3 space-y-3">
              <div className="flex flex-wrap gap-2" role="group" aria-label="开启时间">
                {[
                  { v: 7, label: "1 周后" },
                  { v: 30, label: "1 个月后" },
                  { v: 90, label: "下学期" },
                  { v: "custom" as const, label: "自定义" },
                ].map((o) => (
                  <button
                    key={String(o.v)}
                    aria-pressed={capDays === o.v}
                    onClick={() => setCapDays(o.v)}
                    className={`rounded-full px-3.5 py-1.5 text-xs transition active:scale-95 ${
                      capDays === o.v ? "bg-dusk-400 text-white shadow" : "bg-dusk-100 text-dusk-500 hover:bg-dusk-200"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {capDays === "custom" && (
                <input
                  type="date"
                  min={tomorrow}
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  aria-label="自定义开启日期"
                  className="rounded-xl border-2 border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-dusk-300"
                />
              )}
              <div className="flex flex-wrap gap-2" role="group" aria-label="胶囊去向">
                <button
                  aria-pressed={target === "ocean"}
                  onClick={() => setTarget("ocean")}
                  className={`rounded-full px-3.5 py-1.5 text-xs transition active:scale-95 ${
                    target === "ocean" ? "bg-sea-600 text-white shadow" : "bg-sea-50 text-sea-600 hover:bg-sea-100"
                  }`}
                >
                  时间到了，漂给陌生人
                </button>
                <button
                  aria-pressed={target === "self"}
                  onClick={() => setTarget("self")}
                  className={`rounded-full px-3.5 py-1.5 text-xs transition active:scale-95 ${
                    target === "self" ? "bg-sea-600 text-white shadow" : "bg-sea-50 text-sea-600 hover:bg-sea-100"
                  }`}
                >
                  留给未来的自己
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-ink-soft">开启之前，这封信会被时间封存，谁也捞不到——包括你自己。</p>
            </div>
          )}
        </div>

        {/* 提交 */}
        <button
          onClick={submit}
          disabled={phase === "sending"}
          className="group mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sea-500 to-dusk-400 px-6 py-3.5 text-[15px] font-medium text-white shadow-[0_12px_28px_rgba(107,155,216,0.45)] transition hover:shadow-[0_14px_34px_rgba(107,155,216,0.6)] active:scale-[0.98] disabled:opacity-70"
        >
          {phase === "sending" ? (
            <>
              <Spinner className="h-4 w-4" /> 瓶子正在装好信纸…
            </>
          ) : (
            <>
              <IconSend className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              {future ? "封存进时间胶囊" : "匿名抛进大海"}
            </>
          )}
        </button>
        <p className="mt-3 text-center text-[11px] text-ink-faint">发送前会经过温暖守门员检测 · 攻击性语言会被温柔拦下</p>
      </div>

      {care && (
        <CareAlert
          tone={care.tone}
          matched={care.matched}
          rewrite={care.rewrite}
          onClose={() => setCare(null)}
          onUseRewrite={(text) => {
            setContent(text);
            setCare(null);
          }}
        />
      )}
    </div>
  );
}
