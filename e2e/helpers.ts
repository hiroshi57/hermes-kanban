/**
 * E2E テスト共通ヘルパー
 * - localStorage をクリアして初期状態にリセット
 * - Supabase 通信をブロック（ローカルモードで動作）
 */
import { type Page } from '@playwright/test';

/** localStorage をクリアしてアプリを初期状態で開く */
export async function gotoFresh(page: Page) {
  // Supabase の接続要求を空レスポンスでブロック（テスト時はローカルモード）
  await page.route('**/supabase.co/**', route => route.fulfill({ status: 200, body: '{}' }));
  await page.route('**/realtime/**', route => route.abort());

  await page.goto('/');
  // localStorage を全クリアして初期データにリセット
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  // リロードで初期データを適用
  await page.reload();
  // メインコンテンツが表示されるまで待機（初期ボード名で確認）
  await page.waitForSelector('h1', { timeout: 10_000 });
}

/** カード追加ボタン（ヘッダー）をクリックしてモーダルを開く */
export async function openAddCardModal(page: Page) {
  // header (role="banner") にスコープして「追加 N」ボタンを選ぶ
  // sidebar の「ボードを追加」と区別するため
  await page.getByRole('banner').getByRole('button', { name: /^追加/ }).click();
  await page.waitForSelector('[placeholder="タスクのタイトルを入力"]', { timeout: 8_000 });
}

/** カードモーダルにタイトルを入力して保存 */
export async function saveCard(page: Page, title: string) {
  await page.getByPlaceholder('タスクのタイトルを入力').fill(title);
  // <button> 要素のみを対象にすることで DnD の div[role="button"] との混同を防ぐ
  await page.locator('button').filter({ hasText: /^追加する$/ }).click();
}
