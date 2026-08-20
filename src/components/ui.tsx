import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { WarmthResult } from "../lib/safety";

/* ------------------------------- Toast ------------------------------- */

interface ToastItem {
  id: number;
  type: "ok" | "warn" | "err";
  msg: string;
}

const ToastCtx = createContext<{ push: (type: ToastItem["type"], msg: string) => void }>({ push: () => {} });

export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  const push = useCallback((type: ToastItem["type"], msg: string) => {
    const id = idRef.current++;
    setItems((xs) => [...xs.slice(-2), { id, type, msg }]);
    window.setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 2800);
  }, []);

  const tone = { ok: "bg-sea-600", warn: "bg-gold-500", err: "bg-coral-500" };

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed left-1/2 top-4 z-[100] flex -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`anim-pop rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-lg ${tone[t.type]}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ------------------------------- Modal ------------------------------- */

export function Modal({
  onClose,
  children,
  label,
  wide = false,
}: {
  onClose: () => void;
  children: ReactNode;
  label: string;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button aria-label="关闭弹窗" onClick={onClose} className="anim-backdrop-in absolute inset-0 cursor-default bg-[#1c2a4a]/55 backdrop-blur-[3px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`anim-modal-in relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[1.8rem] bg-cream shadow-[0_24px_70px_rgba(28,42,74,0.4)] sm:rounded-[1.8rem] ${
          wide ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, sub, onClose }: { title: string; sub?: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h3 className="font-display text-lg text-ink-deep">{title}</h3>
        {sub && <p className="mt-0.5 text-xs text-ink-soft">{sub}</p>}
      </div>
      <button
        onClick={onClose}
        aria-label="关闭"
        className="rounded-full bg-cream-deep p-2 text-ink-soft transition hover:rotate-90 hover:bg-line hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}

/* ----------------------------- EmptyState ----------------------------- */

export function EmptyState({ icon, title, desc, children }: { icon: ReactNode; title: string; desc?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[1.4rem] border border-dashed border-[#d6cbb2] bg-cream/70 px-6 py-10 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-sea-100 text-sea-500">{icon}</div>
      <p className="font-display text-base text-ink-deep">{title}</p>
      {desc && <p className="mt-1.5 max-w-[280px] text-[13px] leading-relaxed text-ink-soft">{desc}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

/* ----------------------------- 语气温度计 ----------------------------- */

export function WarmthMeter({ w }: { w: WarmthResult }) {
  const color = w.tone === "cool" ? "#8cb8e6" : w.tone === "mid" ? "#eebb62" : "#f09f7d";
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-[11px] text-ink-soft">语气温度</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream-deep">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${w.score}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
      <span className="w-36 shrink-0 text-right text-[11px] font-medium" style={{ color }}>
        {w.label}
      </span>
    </div>
  );
}

/* ------------------------------ 小开关 ------------------------------ */

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-sea-500" : "bg-[#d9d2c0]"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}
