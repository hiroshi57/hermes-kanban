/**
 * LoginPage.tsx
 * Supabase Auth — Google OAuth ログイン画面
 */
import { useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { savePendingInvite } from '@/lib/sharing';

interface Props {
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function LoginPage({ darkMode, onToggleDark }: Props) {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // URL に ?invite=TOKEN があれば初期化時に保存（lazy initializer でエフェクト不要）
  const [hasInvite] = useState(() => {
    const token = new URLSearchParams(window.location.search).get('invite');
    if (token) savePendingInvite(token);
    return !!token;
  });

  async function handleGoogleSignIn() {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // リダイレクトするのでここには到達しない
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
      setIsLoading(false);
    }
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4">

        {/* ダークモード切替 */}
        <button
          onClick={onToggleDark}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 dark:text-gray-400
                     hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={darkMode ? 'ライトモード' : 'ダークモード'}
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* カード */}
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center space-y-6">

          {/* ロゴ */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-3xl shadow-lg">
              🪄
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hermes Kanban</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                タスクをスマートに管理する日本語カンバン
              </p>
            </div>
          </div>

          {/* 機能リスト */}
          <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 text-left px-2">
            {[
              '📋 複数ボードでプロジェクト管理',
              '☁️  クラウド自動保存（Supabase）',
              '🔄 リアルタイム同期',
              '🌙 ダークモード対応',
            ].map(item => (
              <li key={item} className="flex items-center gap-2">
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* 招待バナー */}
          {hasInvite && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl
                            bg-teal-50 dark:bg-teal-900/20
                            border border-teal-200 dark:border-teal-700 text-left">
              <span className="text-lg leading-none mt-0.5">🎉</span>
              <div>
                <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                  ボードに招待されています
                </p>
                <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">
                  Google でログインすると自動的に参加できます。
                </p>
              </div>
            </div>
          )}

          {/* Google ログインボタン */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl
                       border border-gray-200 dark:border-gray-600
                       bg-white dark:bg-gray-700
                       text-gray-700 dark:text-gray-200
                       font-medium text-sm
                       hover:bg-gray-50 dark:hover:bg-gray-600
                       disabled:opacity-60 disabled:cursor-not-allowed
                       transition-all shadow-sm hover:shadow"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                <span>ログイン中...</span>
              </>
            ) : (
              <>
                {/* Google ロゴ SVG */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google でログイン</span>
              </>
            )}
          </button>

          {/* エラー表示 */}
          {error && (
            <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <p className="text-xs text-gray-400 dark:text-gray-500">
            ログインすることで、データがクラウドに安全に保存されます。
          </p>
        </div>
      </div>
    </div>
  );
}
