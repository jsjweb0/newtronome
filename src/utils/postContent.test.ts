import { describe, expect, it } from 'vitest';
import { normalizeLegacyPostContent } from './postContent';

describe('normalizeLegacyPostContent', () => {
  it('keeps legacy br line breaks when rendering as text', () => {
    expect(normalizeLegacyPostContent('첫 줄<br>둘째 줄<br />셋째 줄<BR/>넷째 줄'))
      .toBe('첫 줄\n둘째 줄\n셋째 줄\n넷째 줄');
  });

  it('does not interpret other HTML as formatting', () => {
    const unsafeContent = '<img src=x onerror=alert(1)><script>alert(1)</script>';
    expect(normalizeLegacyPostContent(unsafeContent)).toBe(unsafeContent);
  });
});
