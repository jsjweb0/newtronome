import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from './format';

const NOW = new Date(2026, 10, 11, 18, 0, 0).getTime();
const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;

describe('formatRelativeTime', () => {
  it('1분 미만은 "방금 전"', () => {
    expect(formatRelativeTime(NOW, NOW)).toBe('방금 전');
    expect(formatRelativeTime(NOW - 59 * SEC, NOW)).toBe('방금 전');
  });

  it('기준 시각보다 늦은 시각도 "방금 전"', () => {
    expect(formatRelativeTime(NOW + 5 * SEC, NOW)).toBe('방금 전');
  });

  it('1분부터 1시간 미만은 "N분 전"', () => {
    expect(formatRelativeTime(NOW - MIN, NOW)).toBe('1분 전');
    expect(formatRelativeTime(NOW - 59 * MIN, NOW)).toBe('59분 전');
  });

  it('1시간부터 하루 미만은 "N시간 전"', () => {
    expect(formatRelativeTime(NOW - HOUR, NOW)).toBe('1시간 전');
    expect(formatRelativeTime(NOW - 24 * HOUR + SEC, NOW)).toBe('23시간 전');
  });

  it('하루 이상은 "M월 D일"', () => {
    expect(formatRelativeTime(NOW - 24 * HOUR, NOW)).toBe('11월 10일');
  });
});
