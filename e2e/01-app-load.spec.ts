/**
 * E2E: アプリ初期表示
 * - ページタイトルが表示される
 * - カンバン列が 4 本表示される
 * - 初期カードが最低 1 枚表示される
 */
import { test, expect } from '@playwright/test';
import { gotoFresh } from './helpers';

test.describe('アプリ初期表示', () => {
  test('ボード名とカンバン列が表示される', async ({ page }) => {
    await gotoFresh(page);

    // ヘッダーにボード名が表示される
    await expect(page.locator('h1')).toContainText('メインプロジェクト');

    // 4 列が表示される
    const columnTitles = ['未着手', '進行中', 'レビュー中', '完了'];
    for (const title of columnTitles) {
      await expect(page.getByText(title).first()).toBeVisible();
    }
  });

  test('初期カードが表示される', async ({ page }) => {
    await gotoFresh(page);

    // 初期データの代表カードが見える
    await expect(page.getByText('ログイン画面のUI改善')).toBeVisible();
    await expect(page.getByText('APIレート制限の実装')).toBeVisible();
  });

  test('追加ボタンとダークモードボタンが存在する', async ({ page }) => {
    await gotoFresh(page);

    await expect(page.getByRole('button', { name: /追加/ }).first()).toBeVisible();
    // ダークモードトグル（Moon アイコン）
    await expect(page.getByTitle(/ダークモード|ライトモード/)).toBeVisible();
  });
});
