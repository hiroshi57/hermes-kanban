/**
 * E2E: 検索・フィルター
 * - テキスト検索でカードが絞り込まれる
 * - 優先度フィルターで絞り込める
 * - クリアで全件に戻る
 */
import { test, expect } from '@playwright/test';
import { gotoFresh } from './helpers';

test.describe('カード検索', () => {
  test('検索入力でカードが絞り込まれる', async ({ page }) => {
    await gotoFresh(page);

    const searchInput = page.getByPlaceholder('検索… (/)');
    await searchInput.fill('APIレート');

    // マッチするカードが表示される
    await expect(page.getByText('APIレート制限の実装')).toBeVisible();

    // マッチしないカードは非表示になる
    await expect(page.getByText('ログイン画面のUI改善')).not.toBeVisible();
  });

  test('検索クリアで全カードに戻る', async ({ page }) => {
    await gotoFresh(page);

    const searchInput = page.getByPlaceholder('検索… (/)');
    await searchInput.fill('APIレート');

    // X ボタンでクリア
    await page.locator('button').filter({ hasText: '' }).last().click();
    // 検索フィールドをクリア（直接）
    await searchInput.clear();

    // 全カードが表示される
    await expect(page.getByText('ログイン画面のUI改善')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('APIレート制限の実装')).toBeVisible({ timeout: 5_000 });
  });

  test('/ ショートカットで検索フォーカスが当たる', async ({ page }) => {
    await gotoFresh(page);

    // キーボードショートカット "/" でフォーカス
    await page.keyboard.press('/');
    const searchInput = page.getByPlaceholder('検索… (/)');
    await expect(searchInput).toBeFocused();
  });
});

test.describe('優先度フィルター', () => {
  test('優先度「高」で絞り込むと高優先度カードのみ表示', async ({ page }) => {
    await gotoFresh(page);

    // ヘッダー内の優先度フィルター「高」ボタン（DnD カードと区別するため banner にスコープ）
    await page.getByRole('banner').getByRole('button', { name: '高', exact: true }).click();

    // 「高」優先度の初期カードが表示される
    await expect(page.getByText('ログイン画面のUI改善')).toBeVisible();
    await expect(page.getByText('APIレート制限の実装')).toBeVisible();

    // 「中」優先度カードは非表示（初期データに「中」が存在）
    await expect(page.getByText('ダッシュボードのパフォーマンス最適化')).not.toBeVisible();
  });

  test('「全て」で全カードが再表示される', async ({ page }) => {
    await gotoFresh(page);

    // 「高」でフィルター後「全て」に戻す（banner にスコープして DnD カードと区別）
    await page.getByRole('banner').getByRole('button', { name: '高', exact: true }).click();
    await page.getByRole('banner').getByRole('button', { name: '全て', exact: true }).click();

    await expect(page.getByText('ダッシュボードのパフォーマンス最適化')).toBeVisible({ timeout: 5_000 });
  });
});
