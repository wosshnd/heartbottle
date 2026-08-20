import { useEffect } from "react";
import { IconHeartFilled, IconShield } from "./icons";

/* ------------------- 温暖守门员 · 风险提醒弹窗 ------------------- */

export function CareAlert({
  tone,
  matched,
  rewrite,
  onClose,
  onUseRewrite,
}: {
  tone: "hard" | "implicit";
  matched: string[];
  rewrite?: string | null;
  onClose: () => void;
  onUseRewrite?: (text: string) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hard = tone === "hard";

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-5">
      <button aria-label="关闭提醒" onClick={onClose} className="anim-backdrop-in absolute inset-0 cursor-default bg-[#16223f]/55 backdrop-blur-sm" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={hard ? "内容被拦截" : "温暖守门员提醒"}
        className={`anim-pop relative w-full max-w-md rounded-[1.75rem] border p-6 shadow-[0_20px_60px_rgba(15,25,50,0.4)] ${
          hard ? "border-rose-400/40 bg-[#fff5f5]" : "border-gold-300/60 bg-[#fff9ef]"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${hard ? "bg-rose-400" : "bg-gold-400"}`}
          >
            {hard ? <IconShield className="h-5 w-5" /> : <IconHeartFilled className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <h4 className="font-display text-base text-ink-deep">{hard ? "这条消息被拦下了" : "温暖守门员 · 轻轻提醒"}</h4>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink">
              {hard
                ? "这句话里含有攻击性语言，可能会伤害到别人，所以不能发送。这片海，只接纳温柔。"
                : "这句话可能会让对方感到被否定哦，要不要试试换一种更接纳的表达方式？"}
            </p>
          </div>
        </div>

        {matched.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-ink-soft">检测到：</span>
            {matched.slice(0, 4).map((m) => (
              <span
                key={m}
                className={`rounded-full px-2 py-0.5 text-[11px] ${hard ? "bg-rose-100 text-rose-500" : "bg-gold-100 text-gold-500"}`}
              >
                “{m}”
              </span>
            ))}
          </div>
        )}

        {!hard && rewrite && (
          <div className="mt-4 rounded-2xl border border-gold-300/50 bg-white/80 p-4">
            <p className="text-[11px] font-medium text-gold-500">试试这样说 👇</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink">{rewrite}</p>
            <button
              onClick={() => onUseRewrite?.(rewrite)}
              className="mt-3 rounded-full bg-gold-400 px-4 py-2 text-xs font-medium text-white shadow transition hover:bg-gold-500 active:scale-95"
            >
              换成这句，继续编辑
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className={`mt-5 w-full rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-md transition active:scale-95 ${
            hard ? "bg-rose-400 hover:bg-rose-500" : "bg-sea-600 hover:bg-sea-700"
          }`}
        >
          好的，我换个说法
        </button>
      </div>
    </div>
  );
}
