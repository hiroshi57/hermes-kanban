import { describe, it, expect, vi, afterEach } from 'vitest';
import { getTodayStr, isOverdue, formatDate } from '@/utils/date';

describe('getTodayStr', () => {
  afterEach(() => vi.useRealTimers());

  it('YYYY-MM-DD 形式を返す', () => {
    expect(getTodayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('ローカル時刻の日付を返す（UTC ではない）', () => {
    // 2026-05-11 をローカル時刻として固定
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T12:00:00'));
    expect(getTodayStr()).toBe('2026-05-11');
  });

  it('月・日が一桁でも 0 埋めする', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T00:00:00'));
    expect(getTodayStr()).toBe('2026-01-05');
  });
});

describe('isOverdue', () => {
  afterEach(() => vi.useRealTimers());

  it('null は false を返す', () => {
    expect(isOverdue(null)).toBe(false);
  });

  it('今日より前の日付は true', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T10:00:00'));
    expect(isOverdue('2026-05-10')).toBe(true);
  });

  it('今日は false（期限当日は超過とみなさない）', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T10:00:00'));
    expect(isOverdue('2026-05-11')).toBe(false);
  });

  it('未来の日付は false', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T10:00:00'));
    expect(isOverdue('2026-12-31')).toBe(false);
  });
});

describe('formatDate', () => {
  it('YYYY-MM-DD を MM/DD に変換する', () => {
    expect(formatDate('2026-05-11')).toBe('05/11');
  });

  it('0埋め月日をそのまま返す', () => {
    expect(formatDate('2026-01-03')).toBe('01/03');
  });
});
