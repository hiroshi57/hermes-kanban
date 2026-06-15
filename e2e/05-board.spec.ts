/**
 * E2E: ボード管理
 * - 新しいボードを作成できる
 * - ボードを切り替えられる
 * - 新規ボードは空の列から始まる
 */
import { test, expect } from '@playwright/test';
import { gotoFresh } from './helpers';

test.describe('ボード作成・切り替え', () => {
  test('新しいボードを作成するとヘッダー名が変わる', async ({ page }) => {
    await gotoFresh(page);

    // サイドバーの「+」ボタン（ボード追加）
    // BoardSidebar の onAdd が setBoardModalOpen(true) を呼ぶ
    await page.getByTitle(/ボード/).first().click().catch(() => {});

    // 追加ボタンが aria-label や title になければ役割で探す
    // サイドバー内の Plus ボタン
    const sidebarAddBtn = page.locator('aside').getByRole('button').last();
    await sidebarAddBtn.click();

    // BoardModal が開く
    await page.waitForSelector('[placeholder="例: フロントエンド開発"]', { timeout: 5_000 });

    // ボード名を入力
    await page.getByPlaceholder('例: フロントエンド開発').fill('テスト用ボード');
    await page.getByRole('button', { name: '作成する' }).click();

    // ヘッダーに新しいボード名が表示される
    await expect(page.locator('h1')).toContainText('テスト用ボード', { timeout: 5_000 });
  });

  test('新規ボードは空の列（未着手・進行中・レビュー中・完了）から始まる', async ({ page }) => {
    await gotoFresh(page);

    // サイドバーの最後のボタン（追加ボタン）
    const sidebarAddBtn = page.locator('aside').getByRole('button').last();
    await sidebarAddBtn.click();

    await page.waitForSelector('[placeholder="例: フロントエンド開発"]', { timeout: 5_000 });
    await page.getByPlaceholder('例: フロントエンド開発').fill('空ボード');
    await page.getByRole('button', { name: '作成する' }).click();

    // 列が正しく生成されている
    for (const col of ['未着手', '進行中', 'レビュー中', '完了']) {
      await expect(page.getByText(col).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('既存ボードをクリックして切り替えられる', async ({ page }) => {
    await gotoFresh(page);

    // ボード 2 つ作成してから切り替えテスト
    const sidebarAddBtn = page.locator('aside').getByRole('button').last();

    // ボード A 作成
    await sidebarAddBtn.click();
    await page.waitForSelector('[placeholder="例: フロントエンド開発"]');
    await page.getByPlaceholder('例: フロントエンド開発').fill('ボードA');
    await page.getByRole('button', { name: '作成する' }).click();
    await expect(page.locator('h1')).toContainText('ボードA');

    // ボード B 作成
    await sidebarAddBtn.click();
    await page.waitForSelector('[placeholder="例: フロントエンド開発"]');
    await page.getByPlaceholder('例: フロントエンド開発').fill('ボードB');
    await page.getByRole('button', { name: '作成する' }).click();
    await expect(page.locator('h1')).toContainText('ボードB');

    // サイドバーで「ボードA」をクリックして切り替え
    await page.locator('aside').getByText('ボードA').click();
    await expect(page.locator('h1')).toContainText('ボードA', { timeout: 5_000 });
  });
});
