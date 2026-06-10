/**
 * PwaPrompt.tsx
 * PWA インストール促進バナー + SW 更新通知
 *
 * - インストールバナー: beforeinstallprompt をキャプチャして表示
 * - 更新バナー: vite-plugin-pwa の useRegisterSW フックで新 SW 検出時に表示
 */
import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, RefreshCw, X } from 'lucide-react';

// ── 型 ────────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ── インストールバナー ─────────────────────────────────────────────
function InstallBanner({ onDismiss }: { onDismiss: () => void }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') onDismiss();
    setDeferredPrompt(null);
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50
                    flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl
                    bg-white dark:bg-slate-800
                    border border-slate-200 dark:border-slate-700
                    animate-in slide-in-from-bottom-4 duration-300"
         style={{ maxWidth: 'calc(100vw - 2rem)' }}>
      <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0">
        <span className="text-lg">🪄</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-800 dark:text-white">
          ホーム画面に追加
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
          オフラインでも使えるようになります
        </p>
      </div>
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                   bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-semibold
                   transition-colors shrink-0"
      >
        <Download size={12} /> インストール
      </button>
      <button
        onClick={onDismiss}
        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        title="閉じる"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ── SW 更新バナー ──────────────────────────────────────────────────
function UpdateBanner({
  onUpdate,
  onDismiss,
}: {
  onUpdate: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50
                    flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl
                    bg-white dark:bg-slate-800
                    border border-slate-200 dark:border-slate-700
                    animate-in slide-in-from-top-4 duration-300"
         style={{ maxWidth: 'calc(100vw - 2rem)' }}>
      <RefreshCw size={18} className="text-indigo-500 shrink-0" />
      <p className="text-[13px] text-slate-700 dark:text-slate-200 flex-1 min-w-0">
        新しいバージョンがあります
      </p>
      <button
        onClick={onUpdate}
        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700
                   text-white text-[12px] font-semibold transition-colors shrink-0"
      >
        更新する
      </button>
      <button
        onClick={onDismiss}
        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        title="後で"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ── メインエクスポート ─────────────────────────────────────────────
export default function PwaPrompt() {
  const [installDismissed, setInstallDismissed] = useState(false);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      // 1 時間ごとに SW 更新チェック
      if (r) setInterval(() => r.update(), 60 * 60 * 1000);
    },
  });

  return (
    <>
      {!installDismissed && (
        <InstallBanner onDismiss={() => setInstallDismissed(true)} />
      )}
      {needRefresh && !updateDismissed && (
        <UpdateBanner
          onUpdate={() => updateServiceWorker(true)}
          onDismiss={() => setUpdateDismissed(true)}
        />
      )}
    </>
  );
}
