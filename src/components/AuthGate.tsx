/**
 * AuthGate.tsx
 * 認証状態に応じてログイン画面 or アプリ本体を振り分ける
 *
 * - loading 中      → スピナー
 * - 未ログイン      → LoginPage（Supabase 設定済みの場合のみ）
 * - ログイン済み or 未設定 → children（App 本体）
 */
import { useState, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/useAuth';
import type { ReactNode } from 'react';

// ログイン画面はログイン済みユーザーには不要 → lazy でバンドル分離
const LoginPage = lazy(() => import('@/components/LoginPage'));

interface Props {
  children: ReactNode;
}

/** ローディング中のフルスクリーンスピナー */
function LoadingScreen({ darkMode }: { darkMode: boolean }) {
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
          <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700
                          border-t-brand-500 rounded-full animate-spin" />
          <span className="text-sm">読み込み中...</span>
        </div>
      </div>
    </div>
  );
}

export default function AuthGate({ children }: Props) {
  const { user, loading, isConfigured } = useAuth();
  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  // 初期化中
  if (loading) return <LoadingScreen darkMode={darkMode} />;

  // Supabase 設定済み && 未ログイン → ログイン画面
  if (isConfigured && !user) {
    return (
      <Suspense fallback={<LoadingScreen darkMode={darkMode} />}>
        <LoginPage
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(d => !d)}
        />
      </Suspense>
    );
  }

  // ログイン済み or Supabase 未設定（ローカルモード）→ アプリ本体
  return <>{children}</>;
}
