import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useDarkMode } from './DarkModeContext';
import { DarkModeProvider } from "./DarkModeProvider";


function ThemeProbe() {
  const { isDarkMode, toggle } = useDarkMode();

  return (
    <button type="button" onClick={toggle}>
      {isDarkMode ? 'dark' : 'light'}
    </button>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
  document.documentElement.classList.remove('dark', 'dart');
});

it('저장소 조회 실패 시 기본 다크 테마로 계속 실행한다', () => {
  vi.spyOn(Storage.prototype, 'getItem')
    .mockImplementation(() => {
      throw new DOMException('Storage blocked', 'SecurityError');
    });

  render(
    <DarkModeProvider>
      <ThemeProbe />
    </DarkModeProvider>
  );

  expect(screen.getByRole('button').textContent).toBe('dark');
  expect(document.documentElement.classList.contains('dark')).toBe(true);
});

it('저장 실패가 테마 변경을 막지 않는다', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('dark');
  vi.spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new DOMException('Storage blocked', 'QuotaExceededError');
    });

  render(
    <DarkModeProvider>
      <ThemeProbe />
    </DarkModeProvider>
  );

  fireEvent.click(screen.getByRole('button'));

  expect(screen.getByRole('button').textContent).toBe('light');
  expect(document.documentElement.classList.contains('dark')).toBe(false);
});
