import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',          // ユーザーに更新を通知してから適用
      includeAssets: [
        'favicon.svg',
        'pwa-icon.svg',
        'pwa-192.png',
        'pwa-512.png',
        'apple-touch-icon.png',
        'apple-touch-icon.svg',
        'offline.html',
      ],
      manifest: {
        name: 'Hermes Kanban',
        short_name: 'Hermes',
        description: 'ドラッグ&ドロップで操作できる日本語カンバンボード。クラウド保存・ダークモード対応。',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'ja',
        start_url: '/',
        // PNG を先に列挙（iOS/Android Chrome の installability 要件を満たす）
        icons: [
          {
            src: '/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            // モダンブラウザ向け SVG（高 DPI・任意サイズ）
            src: '/pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
        // スクリーンショット（Enhanced install prompt 用）
        screenshots: [
          {
            src: '/pwa-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            form_factor: 'narrow',
            label: 'Hermes Kanban — カンバンボード',
          },
        ],
      },
      workbox: {
        // App Shell + 静的アセット + PNG アイコンをキャッシュ
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // ── オフラインフォールバック ──────────────────────────────
        // ナビゲーションリクエストがオフラインで失敗した場合 offline.html を返す
        navigateFallback: '/offline.html',
        // API / Supabase はフォールバック対象外
        navigateFallbackDenylist: [/^\/api\//, /^https:\/\//],
        runtimeCaching: [
          {
            // Google アバター画像をキャッシュ（メンバー表示用）
            urlPattern: /^https:\/\/lh3\.googleusercontent\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-avatars',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    // チャンク警告しきい値（各 vendor chunk は小さくなるので緩和不要だが一応残す）
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // ── vendor を機能ごとに分割して並列ロード & 長期キャッシュを有効化 ──
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('@hello-pangea/dnd')) {
            return 'vendor-dnd';
          }
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
