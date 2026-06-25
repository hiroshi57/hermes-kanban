import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',          // ユーザーに更新を通知してから適用
      includeAssets: ['favicon.svg', 'pwa-icon.svg', 'apple-touch-icon.svg'],
      manifest: {
        name: 'TaskZen',
        short_name: 'TaskZen',
        description: 'ドラッグ&ドロップで操作できる日本語AIカンバンボード。クラウド保存・ダークモード対応。',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'ja',
        start_url: '/',
        icons: [
          {
            src: '/pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App Shell と静的アセットをキャッシュ
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2}'],
        // Supabase API はキャッシュしない（リアルタイムデータ）
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
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
