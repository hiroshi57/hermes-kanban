# modules/ — 独立機能モジュール

各モジュールは独自のコンテキストで動作し、メインセッションをクリーンに保ちます。

---

## 利用可能なモジュール

### `code-review`
差分のみを確認するコードレビューモジュール。

**起動方法（Claude Code）:**
```
コードレビューをお願いします。
対象: src/components/CardModal.tsx
観点: 型安全性、パフォーマンス、アクセシビリティ
```

**チェック項目:**
- TypeScript 型の適切さ
- useCallback / useMemo の適切な使用
- アクセシビリティ（aria-*, role, tabIndex）
- Tailwind クラスの一貫性
- SPEC.md の命名規則への準拠

---

### `test-runner`
特定のファイルに対してテストを生成・実行するモジュール。

**起動方法:**
```bash
npm test -- --reporter=verbose src/test/boardUtils.test.ts
```

**テスト生成の指示例（Claude Code へ）:**
```
src/utils/boardUtils.ts の sortCards 関数のテストを追加してください。
パターン: patterns/hook.md を参考に
```

---

### `supabase-sync`
localStorage ↔ Supabase の同期モジュール（実装予定: Phase 3.2）。

**担当ファイル:**
- `src/lib/storage.ts`
- `src/lib/supabase.ts`
- `supabase/schema.sql`

**実装タスク:**
1. `loadAppState()` を Supabase から取得するよう更新
2. `saveAppState()` を Supabase に保存するよう更新
3. Realtime チャンネルで変更を受信

---

### `deploy`
Vercel へのデプロイを管理するモジュール。

**チェックリスト（デプロイ前）:**
```bash
bash validators/check-env.sh    # 環境変数確認
bash validators/pre-commit.sh   # 全チェック
npm run build                   # ビルド確認
```

**デプロイコマンド:**
```bash
vercel --prod   # 本番デプロイ（要: Vercel CLI インストール済み）
```
