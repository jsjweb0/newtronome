import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, type ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { useSoundCloudWidget } from '../../features/player/hooks/useSoundCloudWidget';
import type { PlayerTrack } from '../../features/player/types/player.types';
import PlaylistPanel from './PlaylistPanel';

vi.mock('../layout/HeaderButtons', () => ({ default: () => null }));
vi.mock('../../features/player/components/SoundCloudWidget', () => ({ default: () => null }));
// 로그아웃 상태를 흉내 내어, 로그인 안내 콜백이 있으면 누를 때 호출하는 버튼만 렌더링
vi.mock('../../features/bookmarks/components/TrackBookmarkButton', () => ({
  default: ({ onLoginRequired }: { onLoginRequired?: () => void }) =>
    onLoginRequired ? (
      <button type="button" onClick={onLoginRequired}>
        북마크 추가
      </button>
    ) : null,
}));

afterEach(() => {
  cleanup();
});

const createPanelProps = (): ComponentProps<typeof PlaylistPanel> => ({
  playlistUrl: 'https://soundcloud.com/example/sets/playlist',
  tracks: [],
  onSelect: vi.fn(),
  collapsed: true,
  isPlaying: false,
  isPlaylistMode: true,
  soundCloudWidget: {
    widgetTrack: null,
    playlistStatus: 'loading',
    widgetError: null,
    retryLoad: vi.fn(),
    toggle: vi.fn(),
  } as unknown as ReturnType<typeof useSoundCloudWidget>,
  isModal: false,
  onClose: vi.fn(),
  toggleButtonRef: createRef<HTMLButtonElement>(),
});

describe('PlaylistPanel loading state', () => {
  it('renders the loading status outside the ordered list with readable text color', () => {
    render(<PlaylistPanel {...createPanelProps()} />);

    const status = screen.getByRole('status', { name: '' });
    expect(status.textContent).toContain('플레이리스트 불러오는 중...');
    expect(status.closest('ol')).toBeNull();
    expect(status.classList.contains('text-textBase')).toBe(true);
  });

  it('keeps loaded tracks and their count visible while playback reloads the playlist', () => {
    const props = createPanelProps();
    props.tracks = [{
      id: 1,
      title: 'Queued Track',
      artist: 'Artist',
      artworkUrl: null,
      permalinkUrl: null,
      durationMs: 1000,
      genre: '',
      tags: [],
    }];
    const { rerender } = render(
      <PlaylistPanel {...props} soundCloudWidget={{ ...props.soundCloudWidget, playlistStatus: 'ready' }} />
    );
    const trackButton = screen.getByRole('button', { name: /Queued Track/ });

    rerender(<PlaylistPanel {...props} />);

    expect(screen.getByRole('button', { name: /Queued Track/ })).toBe(trackButton);
    expect(screen.getByText('1곡')).toBeTruthy();
    expect(screen.queryByText('플레이리스트 불러오는 중...')).toBeNull();
  });
});

describe('PlaylistPanel login notice', () => {
  const track: PlayerTrack = {
    id: 1, title: '테스트 트랙', artist: '아티스트', artworkUrl: null,
    permalinkUrl: null, durationMs: 1000, genre: '', tags: [],
  };
  const soundCloudWidget = {
    widgetTrack: track,
    playlistStatus: 'ready',
    widgetError: null,
    retryLoad: vi.fn(),
    toggle: vi.fn(),
  } as unknown as ReturnType<typeof useSoundCloudWidget>;

  function renderPanel({ isModal, onClose = vi.fn() }: { isModal: boolean; onClose?: () => void }) {
    render(
      <MemoryRouter>
        <PlaylistPanel
          playlistUrl="https://soundcloud.com/example/sets/playlist"
          tracks={[track]}
          onSelect={vi.fn()}
          collapsed={true}
          isPlaying={false}
          isPlaylistMode={true}
          soundCloudWidget={soundCloudWidget}
          isModal={isModal}
          onClose={onClose}
          toggleButtonRef={createRef<HTMLButtonElement>()}
        />
      </MemoryRouter>
    );
  }

  it('모달에서는 로그인 안내와 링크를 포커스가 도는 패널 안에 보여 준다', () => {
    const onClose = vi.fn();
    renderPanel({ isModal: true, onClose });

    const panel = screen.getByRole('dialog');
    const liveRegion = Array.from(panel.querySelectorAll('[role="status"]')).find(
      (element) => element.getAttribute('aria-live') === 'polite'
    );
    expect(liveRegion?.textContent).toBe('');
    // 목록 스크롤 영역 위에 겹치지 않고 아래 별도 행에 있어야 마지막 곡까지 조작할 수 있음
    expect(liveRegion?.closest('.overflow-y-auto')).toBeNull();

    fireEvent.click(screen.getAllByRole('button', { name: '북마크 추가' })[0]);

    expect(liveRegion?.textContent).toContain('로그인 후 북마크할 수 있습니다.');
    const loginLink = screen.getByRole('link', { name: '로그인' });
    expect(panel.contains(loginLink)).toBe(true);
    expect(loginLink.getAttribute('href')).toBe('/login');

    fireEvent.click(loginLink);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('안내를 닫으면 누른 북마크 버튼으로 포커스를 되돌린다', () => {
    renderPanel({ isModal: true });

    const bookmarkButton = screen.getAllByRole('button', { name: '북마크 추가' })[0];
    bookmarkButton.focus();
    fireEvent.click(bookmarkButton);
    fireEvent.click(screen.getByRole('button', { name: '안내 닫기' }));

    expect(screen.queryByRole('link', { name: '로그인' })).toBeNull();
    expect(document.activeElement).toBe(bookmarkButton);
  });

  it('모달이 아니면 패널 안내 대신 기존 토스트를 쓴다', () => {
    renderPanel({ isModal: false });

    expect(screen.queryByRole('button', { name: '북마크 추가' })).toBeNull();
  });
});
