/**
 * タイムゾーン非依存のローカル日付文字列を返す（YYYY-MM-DD）
 */
export function getTodayStr(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * ISO 日付文字列が今日より前かどうか（UTC ではなくローカル日付で比較）
 */
export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return dueDate < getTodayStr();
}

/**
 * "YYYY-MM-DD" → "MM/DD" 表示
 */
export function formatDate(iso: string): string {
  return iso.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2/$3');
}
