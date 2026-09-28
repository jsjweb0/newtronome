const LEGACY_LINE_BREAK_PATTERN = /<br\s*\/?>/gi;

export function normalizeLegacyPostContent(content: string): string {
  return content.replace(LEGACY_LINE_BREAK_PATTERN, '\n');
}
