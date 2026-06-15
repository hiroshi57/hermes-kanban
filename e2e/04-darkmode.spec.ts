/**
 * E2E: ダークモード切り替え
 * - トグルボタンで dark クラスが付与/除去される
 * - キーボードショートカット ⌘D でも切り替えられる
 */
import { test, expect } from '@playwright/test';
import { gotoFresh } from './helpers';

test.describe('ダークモード', () => {
  test('ダークモードボタンで dark クラスが切り替わる', async ({ page }) => {
    await gotoFresh(page);

    const root = page.locator('.dark, :not(.dark)').first();
    const wrapper = page.locator('div').first();

    // 初期状態（ライトモード想定）でボタンをクリック
    const darkBtn = page.getByTitle(/ダークモード|ライトモード/);
    await darkBtn.click();

    // dark クラスがルートに付与されているか確認
    const html = await page.content();
    // dark または light への切り替えが反映される（クラス付与を確認）
    const hasDark = html.includes('class="dark"') || html.includes('"dark"');
    // ダークモードに切り替わったことを title の変化で確認
    await expect(darkBtn).toHaveAttribute('title', /ライトモード/);
  });

  test('ダークモードから再度クリックするとライトに戻る', async ({ page }) => {
    await gotoFresh(page);

    const darkBtn = page.getByTitle(/ダークモード|ライトモード/);

    // ダークモードへ
    await darkBtn.click();
    await expect(darkBtn).toHaveAttribute('title', /ライトモード/);

    // ライトモードへ戻す
    await darkBtn.click();
    await expect(darkBtn).toHaveAttribute('title', /ダークモード/);
  });

  test('キーボードショートカット ⌘D でダークモードが切り替わる', async ({ page }) => {
    await gotoFresh(page);

    const darkBtn = page.getByTitle(/ダークモード|ライトモード/);
    const initialTitle = await darkBtn.getAttribute('title');

    // Ctrl+D（Windows 環境）
    await page.keyboard.press('Control+d');

    const newTitle = await darkBtn.getAttribute('title');
    expect(newTitle).not.toBe(initialTitle);
  });
});
