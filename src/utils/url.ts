/** 외부 데이터의 선택적 URL. 사용할 수 없으면 링크·이미지 대신 대체 UI를 표시한다. */
export function toHttpsUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}
