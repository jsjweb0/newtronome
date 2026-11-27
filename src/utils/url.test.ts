import { describe, expect, it } from 'vitest';
import { toHttpsUrl } from './url';

describe('toHttpsUrl', () => {
  it('HTTPS URL을 정리하고 경로·쿼리·해시를 유지한다', () => {
    expect(toHttpsUrl(' HTTPS://EXAMPLE.COM/music?q=1#track ')).toBe('https://example.com/music?q=1#track');
  });
  it.each([null, undefined, 123, '', ' ', 'not-a-url', '/relative', '//example.com', 'http://example.com', 'javascript:alert(1)', 'data:text/html,test', 'https://name:pass@example.com'])('%s를 사용할 수 없으면 null을 반환한다', (value) => {
    expect(toHttpsUrl(value)).toBeNull();
  });
});
