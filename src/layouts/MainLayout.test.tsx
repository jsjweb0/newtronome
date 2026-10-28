import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MainLayout from './MainLayout';

vi.mock('../features/player/hooks/useSoundCloudWidget', () => ({
  useSoundCloudWidget: () => ({
    selectTrack: vi.fn(),
    toggle: vi.fn(),
    pause: vi.fn(),
    playSingleTrack: vi.fn(),
    retryLoad: vi.fn(),
    playlistStatus: 'ready',
    widgetError: null,
    isReady: true,
  }),
}));

vi.mock('../components/layout/Sidebar', () => ({
  default: () => <nav id="navbar" aria-label="주요 메뉴" />,
}));
vi.mock('../components/layout/PlayerBar', () => ({ default: () => <div /> }));
vi.mock('../components/layout/PlayerBarSkeleton', () => ({ default: () => <div /> }));
vi.mock('../components/player/PlaylistPanel', () => ({ default: () => <aside /> }));
vi.mock('../components/DarkModeToggle', () => ({ default: () => <button type="button">테마</button> }));
vi.mock('../components/ui/Tooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

describe('MainLayout', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('provides the first keyboard link to the main content', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<div>페이지 본문</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const skipLink = screen.getByRole('link', { name: '본문 바로가기' });
    const mainContent = container.querySelector('#main-content');

    expect(container.querySelector('a')).toBe(skipLink);
    expect(skipLink.getAttribute('href')).toBe('#main-content');
    expect(mainContent?.getAttribute('tabindex')).toBe('-1');
    expect(mainContent?.textContent).toContain('페이지 본문');
  });

  it('connects the desktop sidebar toggle to the controlled navigation', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<div>페이지 본문</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const closeButton = screen.getByRole('button', { name: 'Close sidebar' });

    expect(closeButton.getAttribute('aria-controls')).toBe('navbar');
    expect(closeButton.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('navbar')).not.toBeNull();

    fireEvent.click(closeButton);

    const openButton = screen.getByRole('button', { name: 'Open sidebar' });
    expect(openButton.getAttribute('aria-controls')).toBe('navbar');
    expect(openButton.getAttribute('aria-expanded')).toBe('false');
  });

  it.each([
    ['/search', '음악 검색 | NEWTRONOME'],
    ['/board/free', '자유게시판 | NEWTRONOME'],
    ['/board/notice/write', '공지사항 글쓰기 | NEWTRONOME'],
    ['/board/free/post-1', '자유게시판 게시글 상세 | NEWTRONOME'],
  ])('updates the document title for %s', (pathname, expectedTitle) => {
    render(
      <MemoryRouter initialEntries={[pathname]}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route path="*" element={<div>페이지 본문</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(document.title).toBe(expectedTitle);
  });
});
