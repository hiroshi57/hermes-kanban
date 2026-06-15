/**
 * E2E: カード CRUD
 * - カード作成（追加ボタン + モーダル入力）
 * - カード編集（タイトル変更）
 * - カードアーカイブ
 */
import { test, expect } from '@playwright/test';
import { gotoFresh, openAddCardModal, saveCard } from './helpers';

test.describe('カード作成', () => {
  test('追加ボタンからカードを作成できる', async ({ page }) => {
    await gotoFresh(page);

    const title = 'E2Eテスト用カード';
    await openAddCardModal(page);
    await saveCard(page, title);

    // 新しいカードがボードに表示される
    await expect(page.getByText(title)).toBeVisible({ timeout: 5_000 });
  });

  test('タイトル未入力では追加ボタンが無効になる', async ({ page }) => {
    await gotoFresh(page);
    await openAddCardModal(page);

    // タイトル未入力の状態では「追加する」ボタンが disabled
    // <button> 要素に絞ることで DnD div[role="button"] との strict mode 違反を回避
    const saveBtn = page.locator('button').filter({ hasText: /^追加する$/ });
    // タイトル入力欄が空の場合はボタンが無効
    await expect(saveBtn).toBeDisabled();
  });

  test('Escape キーでモーダルを閉じられる', async ({ page }) => {
    await gotoFresh(page);
    await openAddCardModal(page);

    await page.keyboard.press('Escape');
    // モーダルが閉じる
    await expect(page.getByPlaceholder('タスクのタイトルを入力')).not.toBeVisible({ timeout: 3_000 });
  });
});

test.describe('カード編集', () => {
  test('既存カードをクリックしてタイトルを変更できる', async ({ page }) => {
    await gotoFresh(page);

    // 既存カードをクリックして編集モーダルを開く
    await page.getByText('APIレート制限の実装').click();
    await page.waitForSelector('[placeholder="タスクのタイトルを入力"]', { timeout: 5_000 });

    // タイトルを変更
    const titleInput = page.getByPlaceholder('タスクのタイトルを入力');
    await titleInput.clear();
    await titleInput.fill('APIレート制限の実装（修正済み）');

    await page.getByRole('button', { name: '保存する' }).click();

    // 変更後のタイトルが表示される
    await expect(page.getByText('APIレート制限の実装（修正済み）')).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('カードアーカイブ', () => {
  test('カードをアーカイブするとボードから消える', async ({ page }) => {
    await gotoFresh(page);

    const cardTitle = 'ログイン画面のUI改善';

    // カードにホバーして Archive ボタンを表示させてクリック
    const card = page.getByText(cardTitle).first();
    await card.hover();

    // Archive ボタン（title 属性 or aria-label が「アーカイブ」）
    await page.locator('[title*="アーカイブ"]').first().click();

    // アクティブビューからカードが消える
    await expect(page.getByText(cardTitle)).not.toBeVisible({ timeout: 5_000 });
  });
});
