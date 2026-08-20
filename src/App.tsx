import { useState } from "react";
import type { ReactNode } from "react";
import type { Bottle, UserProfile } from "./lib/types";
import { boot, me } from "./lib/db";
import { unreadCount } from "./lib/db";
import { ToastProvider } from "./components/ui";
import { ToolboxFab, ToolboxModal } from "./components/toolbox";
import { IconBottle, IconHome, IconPlus, IconUser } from "./components/icons";
import { HomeView } from "./views/HomeView";
import { ThrowView } from "./views/ThrowView";
import { CatchView } from "./views/CatchView";
import { SpaceView } from "./views/SpaceView";

type View = "home" | "throw" | "catch" | "space";

const NAV: { id: View; label: string; icon: (p: { className?: string }) => ReactNode }[] = [
  { id: "home", label: "首页", icon: IconHome },
  { id: "throw", label: "抛瓶", icon: IconPlus },
  { id: "catch", label: "捞瓶", icon: IconBottle },
  { id: "space", label: "我的", icon: IconUser },
];

export default function App() {
  const [user, setUser] = useState<UserProfile>(() => boot());
  const [view, setView] = useState<View>("home");
  const [catchKey, setCatchKey] = useState(0);
  const [catchInitial, setCatchInitial] = useState<string | null>(null);
  const [toolbox, setToolbox] = useState<{ open: boolean; reason: string | null }>({ open: false, reason: null });

  const refreshUser = () => setUser({ ...me() });

  const go = (v: View) => {
    if (v === "catch") {
      setCatchInitial(null);
      setCatchKey((k) => k + 1);
    }
    setView(v);
    window.scrollTo({ top: 0 });
  };

  const openBottle = (id: string) => {
    setCatchInitial(id);
    setCatchKey((k) => k + 1);
    setView("catch");
    window.scrollTo({ top: 0 });
  };

  const openToolbox = (reason?: string) => setToolbox({ open: true, reason: reason ?? null });

  const unread = unreadCount();

  return (
    <ToastProvider>
      <div
        className={`theme-${user.theme} min-h-screen`}
        style={{ background: "linear-gradient(180deg, var(--sky3) 0%, #ebe6d8 360px, #ebe6d8 100%)" }}
      >
        <main className="pb-28">
          {view === "home" && (
            <HomeView user={user} onThrow={() => go("throw")} onCatch={() => go("catch")} onSpace={() => go("space")} onOpenBottle={(b: Bottle) => openBottle(b.id)} />
          )}
          {view === "throw" && <ThrowView onBack={() => go("home")} onGoCatch={() => go("catch")} onOpenToolbox={openToolbox} />}
          {view === "catch" && (
            <CatchView key={catchKey} initialBottleId={catchInitial} onGoThrow={() => go("throw")} onOpenToolbox={openToolbox} />
          )}
          {view === "space" && <SpaceView user={user} onUserChange={refreshUser} onGoThrow={() => go("throw")} onOpenBottle={openBottle} />}

          <footer className="mx-auto max-w-2xl px-4 pt-8 text-center">
            <p className="text-[11px] leading-relaxed text-ink-faint">
              心灵漂流瓶 · 匿名同伴互助演示版
              <br />
              所有数据只保存在你的浏览器本地 · 数据结构已为接入 Supabase 做好准备
              <br />
              若你或身边的人正处于危机中，请拨打 12355 或当地心理援助热线
            </p>
          </footer>
        </main>

        <ToolboxFab onOpen={() => openToolbox()} />

        {/* 底部导航 */}
        <nav
          aria-label="主导航"
          className="fixed inset-x-0 bottom-0 z-[80] border-t border-[#ded6c2] bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
        >
          <div className="mx-auto flex max-w-md items-stretch justify-around">
            {NAV.map((n) => {
              const active = view === n.id;
              const Icon = n.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => go(n.id)}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition active:scale-95 ${
                    active ? "text-sea-600" : "text-ink-faint hover:text-ink-soft"
                  }`}
                >
                  <span className={`rounded-full px-3 py-1 transition ${active ? "bg-sea-100" : ""}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  {n.label}
                  {n.id === "space" && unread > 0 && (
                    <span className="absolute right-1/4 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blush-400 px-1 text-[9px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <ToolboxModal open={toolbox.open} reason={toolbox.reason} onClose={() => setToolbox({ open: false, reason: null })} />
      </div>
    </ToastProvider>
  );
}
