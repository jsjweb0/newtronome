import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Sidebar from './Sidebar';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    logout: vi.fn(),
    avatarUrl: '',
    nicknameUrl: '',
  }),
}));

vi.mock('../DarkModeToggle', () => ({
  default: () => null,
}));

vi.mock('../ui/Tooltip', () => ({
  default: ({ children }: PropsWithChildren) => children,
}));

vi.mock('../ui/NotificationDropdown', () => ({
  default: () => null,
}));

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Sidebar mobile menu accessibility', () => {
  it('updates the accessible name and expanded state when toggled', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const openButton = screen.getByRole('button', { name: '전체 메뉴 열기' });

    expect(openButton.getAttribute('aria-expanded')).toBe('false');
    expect(openButton.getAttribute('aria-controls')).toBe('mobile-navigation');

    fireEvent.click(openButton);

    const closeButton = screen.getByRole('button', { name: '전체 메뉴 닫기' });
    expect(closeButton.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(closeButton);

    expect(screen.getByRole('button', { name: '전체 메뉴 열기' }).getAttribute('aria-expanded'))
      .toBe('false');
  });
});
