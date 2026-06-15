import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E テスト設定
 * テスト対象: http://localhost:5173 (Vite dev server)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // localStorage をクリアして毎テスト初期状態から開始
    storageState: undefined,
    // 日本語 UI 対応
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // テスト実行前に Vite dev server を起動
  // --mode test により .env.test が読まれ Supabase が無効化される（ローカルモード）
  webServer: {
    command: 'npm run dev -- --mode test',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 30_000,
    cwd: process.cwd(),
  },
});
