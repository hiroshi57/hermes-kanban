import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
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
