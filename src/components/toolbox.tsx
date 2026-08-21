import { useEffect, useRef, useState } from "react";
import { HOTLINES } from "../lib/safety";
import { IconPhone, IconWind } from "./icons";
import { Modal, ModalHeader } from "./ui";

/* --------------------------- 悬浮呼吸按钮 --------------------------- */

export function ToolboxFab({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      aria-label="打开急救工具箱：呼吸引导、白噪音与心理热线"
      className="fixed bottom-24 right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-coral-400 text-white shadow-[0_10px_26px_rgba(229,127,88,0.5)] transition hover:scale-105 hover:bg-coral-500 active:scale-95"
    >
      <span className="anim-pulse-ring absolute inset-0 rounded-full bg-coral-300" aria-hidden="true" />
      <IconWind className="relative h-6 w-6" />
    </button>
  );
}

/* --------------------------- 4-7-8 呼吸引导 --------------------------- */

const PHASES = [
  { label: "用鼻子吸气", sec: 4, scale: 1 },
  { label: "轻轻屏住", sec: 7, scale: 1 },
  { label: "缓缓呼气", sec: 8, scale: 0.55 },
];

function BreathingGuide() {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [left, setLeft] = useState(PHASES[0].sec);
  const [cycles, setCycles] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      setLeft((s) => {
        if (s > 1) return s - 1;
        setPhase((p) => {
          const np = (p + 1) % PHASES.length;
          if (np === 0) {
            setCycles((c) => {
              if (c + 1 >= 4) {
                setRunning(false);
                setDone(true);
              }
              return c + 1;
            });
          }
          setLeft(PHASES[np].sec);
          return np;
        });
        return PHASES[phase].sec;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [running, phase]);

  const reset = () => {
    setRunning(false);
    setPhase(0);
    setLeft(PHASES[0].sec);
    setCycles(0);
    setDone(false);
  };

  return (
    <div className="rounded-[1.4rem] bg-sea-50 p-5 text-center">
      <p className="font-display text-sm text-ink-deep">4-7-8 呼吸练习</p>
      <div className="relative mx-auto mt-4 flex h-36 w-36 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-sea-200/60" aria-hidden="true" />
        <span
          className="absolute inset-3 rounded-full bg-gradient-to-br from-sea-300 to-sea-500 shadow-[0_8px_26px_rgba(79,127,192,0.45)]"
          style={{
            transform: running || done ? `scale(${PHASES[phase].scale})` : "scale(0.8)",
            transition: `transform ${running ? PHASES[phase].sec : 0.6}s ease-in-out`,
          }}
          aria-hidden="true"
        />
        <span className="relative z-10 text-center text-white">
          <span className="block font-display text-lg leading-none">{done ? "做得很好" : running ? PHASES[phase].label : "准备好了吗"}</span>
          <span className="mt-1 block text-2xl font-light">{done ? "🌿" : running ? left : ""}</span>
        </span>
      </div>
      <p className="mt-2 text-[11px] text-ink-soft">
        {done ? "四轮呼吸完成，感受一下此刻的身体" : `第 ${Math.min(cycles + 1, 4)} / 4 轮`}
      </p>
      <div className="mt-3 flex justify-center gap-2">
        {!running && !done && (
          <button
            onClick={() => setRunning(true)}
            className="rounded-full bg-sea-600 px-5 py-2 text-sm font-medium text-white shadow transition hover:bg-sea-700 active:scale-95"
          >
            开始呼吸
          </button>
        )}
        {(running || done) && (
          <button
            onClick={reset}
            className="rounded-full border border-sea-300 bg-white px-5 py-2 text-sm text-sea-600 transition hover:bg-sea-50 active:scale-95"
          >
            {done ? "再来一次" : "停下来"}
          </button>
        )}
      </div>
    </div>
  );
}

/* --------------------------- 白噪音（Web Audio 合成） --------------------------- */

function makeNoiseBuffer(ctx: AudioContext, brown: boolean): AudioBuffer {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    } else {
      data[i] = white;
    }
  }
  return buf;
}

function NoisePlayer() {
  const [playing, setPlaying] = useState<"rain" | "sea" | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ src: AudioBufferSourceNode; lfo?: OscillatorNode } | null>(null);

  const stop = () => {
    try {
      nodesRef.current?.src.stop();
      nodesRef.current?.lfo?.stop();
    } catch {
      /* noop */
    }
    nodesRef.current = null;
    setPlaying(null);
  };

  useEffect(() => () => stop(), []);

  const start = (kind: "rain" | "sea") => {
    if (playing === kind) {
      stop();
      return;
    }
    stop();
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") void ctx.resume();
    const src = ctx.createBufferSource();
    src.buffer = makeNoiseBuffer(ctx, kind === "sea");
    src.loop = true;
    const gain = ctx.createGain();
    let lfo: OscillatorNode | undefined;
    if (kind === "rain") {
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2600;
      bp.Q.value = 0.7;
      gain.gain.value = 0.09;
      src.connect(bp).connect(gain).connect(ctx.destination);
    } else {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 320;
      gain.gain.value = 0.14;
      lfo = ctx.createOscillator();
      lfo.frequency.value = 0.12;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.07;
      lfo.connect(lfoGain).connect(gain.gain);
      lfo.start();
      src.connect(lp).connect(gain).connect(ctx.destination);
    }
    src.start();
    nodesRef.current = { src, lfo };
    setPlaying(kind);
  };

  const btn = (kind: "rain" | "sea", name: string, desc: string) => (
    <button
      onClick={() => start(kind)}
      aria-pressed={playing === kind}
      className={`flex flex-1 flex-col items-start rounded-2xl border px-4 py-3 text-left transition active:scale-95 ${
        playing === kind ? "border-sea-500 bg-sea-600 text-white shadow-md" : "border-line bg-white/80 text-ink hover:border-sea-300"
      }`}
    >
      <span className="text-sm font-medium">{name}</span>
      <span className={`mt-0.5 text-[11px] ${playing === kind ? "text-sea-100" : "text-ink-soft"}`}>{playing === kind ? "正在播放 · 点击停止" : desc}</span>
    </button>
  );

  return (
    <div>
      <div className="flex gap-2.5">
        {btn("rain", "雨声", "淅淅沥沥的小雨")}
        {btn("sea", "海浪", "缓慢起伏的潮汐")}
      </div>
      <p className="mt-1.5 text-[10px] text-ink-faint">声音由浏览器实时合成，无需下载 · 仅在本地播放</p>
    </div>
  );
}

/* ------------------------------ 工具箱弹窗 ------------------------------ */

export function ToolboxModal({ open, onClose, reason }: { open: boolean; onClose: () => void; reason?: string | null }) {
  if (!open) return null;
  return (
    <Modal onClose={onClose} label="急救工具箱">
      <ModalHeader title="急救工具箱" sub="情绪汹涌的时候，先照顾好自己" onClose={onClose} />
      <div className="space-y-4 overflow-y-auto px-5 py-5">
        {reason && (
          <div className="rounded-2xl border border-coral-300 bg-coral-100 px-4 py-3 text-[13px] leading-relaxed text-[#9c5230]">
            <p className="font-medium">我们注意到你写下了很沉重的心事。</p>
            <p className="mt-1">在继续之前，请先看看这些能立刻帮到你的资源——你值得被专业地对待。</p>
          </div>
        )}

        <BreathingGuide />

        <div>
          <p className="mb-2 font-display text-sm text-ink-deep">白噪音 · 让耳朵先静下来</p>
          <NoisePlayer />
        </div>

        <div>
          <p className="mb-2 font-display text-sm text-ink-deep">紧急心理热线 · 一键拨打</p>
          <div className="space-y-2">
            {HOTLINES.map((h) => (
              <a
                key={h.phone}
                href={`tel:${h.phone.replace(/-/g, "")}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-sea-200 bg-white/85 px-4 py-3 transition hover:border-sea-400 hover:shadow-md"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink-deep">{h.name}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-ink-soft">{h.desc}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-sea-500 px-3 py-1.5 text-xs font-medium text-white transition group-hover:bg-sea-600">
                  <IconPhone className="h-3.5 w-3.5" />
                  {h.phone}
                </span>
              </a>
            ))}
          </div>
          <p className="mt-2 text-center text-[11px] text-ink-soft">如果身边有人正处于危险中，请直接拨打 110 / 120</p>
        </div>
      </div>
    </Modal>
  );
}
