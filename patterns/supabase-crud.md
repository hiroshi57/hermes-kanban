# Pattern: Supabase CRUD

## 使用場面
Supabase テーブルに対して読み書きするとき

## インポート

```ts
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
```

## SELECT（取得）

```ts
async function fetchBoards() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[supabase] fetch error:', error.message);
    return null;
  }
  return data;
}
```

## INSERT（作成）

```ts
async function createBoard(board: { name: string; emoji: string }) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('boards')
    .insert(board)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

## UPDATE（更新）

```ts
async function updateCard(id: string, patch: Partial<CardRow>) {
  if (!supabase) return;

  const { error } = await supabase
    .from('cards')
    .update(patch)
    .eq('id', id);

  if (error) console.error('[supabase] update error:', error.message);
}
```

## DELETE（削除）

```ts
async function deleteCard(id: string) {
  if (!supabase) return;

  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id);

  if (error) console.error('[supabase] delete error:', error.message);
}
```

## Realtime（リアルタイム同期）

```ts
const channel = supabase
  ?.channel('board-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'cards' },
    (payload) => {
      console.log('Change received!', payload);
      // 状態を更新する処理
    }
  )
  .subscribe();

// クリーンアップ
return () => { supabase?.removeChannel(channel!); };
```

## ルール
- 必ず `isSupabaseConfigured` または `supabase` の null チェックを入れる
- エラーは `console.error` でログを残す（握り潰さない）
- localStorage へのフォールバックは `storage.ts` に実装済み
