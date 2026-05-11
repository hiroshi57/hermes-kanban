import { describe, it, expect } from 'vitest';
import { resolveInitialColumnId, matchesFilter, splitHighlight } from '@/utils/boardUtils';
import type { Card, Column } from '@/types';

// ── テスト用フィクスチャ ───────────────────────────────────────
const columns: Column[] = [
  { id: 'col-todo',       title: '未着手',   color: '#6b7280', cardIds: ['card-1', 'card-2'] },
  { id: 'col-inprogress', title: '進行中',   color: '#3b82f6', cardIds: ['card-3'] },
  { id: 'col-done',       title: '完了',     color: '#10b981', cardIds: [] },
];

const card: Card = {
  id: 'card-1',
  title: 'ログイン画面のUI改善',
  description: 'レスポンシブ対応',
  priority: '高',
  assignee: '田中 太郎',
  dueDate: '2026-05-15',
  tags: [],
  createdAt: '2026-05-01',
};

// ── resolveInitialColumnId ────────────────────────────────────
describe('resolveInitialColumnId', () => {
  it('targetColumnId が指定されていれば、それを返す', () => {
    expect(resolveInitialColumnId('col-done', null, columns)).toBe('col-done');
  });

  it('targetColumnId が null で card がある場合、card の列を返す', () => {
    expect(resolveInitialColumnId(null, card, columns)).toBe('col-todo');
  });

  it('targetColumnId も card も null なら先頭列 ID を返す', () => {
    expect(resolveInitialColumnId(null, null, columns)).toBe('col-todo');
  });

  it('card が列に存在しない場合は先頭列を返す', () => {
    const orphan: Card = { ...card, id: 'card-orphan' };
    expect(resolveInitialColumnId(null, orphan, columns)).toBe('col-todo');
  });

  it('columns が空配列なら空文字を返す', () => {
    expect(resolveInitialColumnId(null, null, [])).toBe('');
  });
});

// ── matchesFilter ─────────────────────────────────────────────
describe('matchesFilter', () => {
  it('フィルターなし（全て）では全カードがマッチする', () => {
    expect(matchesFilter(card, '', '全て', '全て')).toBe(true);
  });

  it('タイトルの部分一致で検索できる', () => {
    expect(matchesFilter(card, 'ログイン', '全て', '全て')).toBe(true);
  });

  it('説明の部分一致で検索できる', () => {
    expect(matchesFilter(card, 'レスポンシブ', '全て', '全て')).toBe(true);
  });

  it('担当者名で検索できる', () => {
    expect(matchesFilter(card, '田中', '全て', '全て')).toBe(true);
  });

  it('大文字小文字を区別しない（英字）', () => {
    const enCard: Card = { ...card, title: 'Login UI' };
    expect(matchesFilter(enCard, 'login', '全て', '全て')).toBe(true);
  });

  it('一致しないキーワードでは false を返す', () => {
    expect(matchesFilter(card, 'バックエンド', '全て', '全て')).toBe(false);
  });

  it('優先度フィルターが一致すれば true', () => {
    expect(matchesFilter(card, '', '高', '全て')).toBe(true);
  });

  it('優先度フィルターが一致しなければ false', () => {
    expect(matchesFilter(card, '', '低', '全て')).toBe(false);
  });

  it('担当者フィルターが一致すれば true', () => {
    expect(matchesFilter(card, '', '全て', '田中 太郎')).toBe(true);
  });

  it('担当者フィルターが一致しなければ false', () => {
    expect(matchesFilter(card, '', '全て', '佐藤 花子')).toBe(false);
  });

  it('検索 + 優先度 + 担当者 の複合フィルター', () => {
    expect(matchesFilter(card, 'ログイン', '高', '田中 太郎')).toBe(true);
    expect(matchesFilter(card, 'ログイン', '低', '田中 太郎')).toBe(false);
  });
});

// ── splitHighlight ────────────────────────────────────────────
describe('splitHighlight', () => {
  it('クエリが空なら 1 要素（ハイライトなし）', () => {
    const result = splitHighlight('Hello World', '');
    expect(result).toEqual([{ text: 'Hello World', highlight: false }]);
  });

  it('一致部分を highlight: true に分割する', () => {
    const result = splitHighlight('Hello World', 'llo');
    expect(result).toEqual([
      { text: 'He',    highlight: false },
      { text: 'llo',   highlight: true  },
      { text: ' World', highlight: false },
    ]);
  });

  it('大文字小文字を区別しない', () => {
    const result = splitHighlight('Hello', 'HELLO');
    expect(result.some(p => p.highlight)).toBe(true);
  });

  it('テキスト全体がマッチする場合', () => {
    const result = splitHighlight('ログイン', 'ログイン');
    expect(result).toEqual([{ text: 'ログイン', highlight: true }]);
  });

  it('正規表現の特殊文字をエスケープする', () => {
    // '(' は正規表現で特殊文字だがエラーにならないこと
    expect(() => splitHighlight('test (foo)', '(foo)')).not.toThrow();
  });
});
