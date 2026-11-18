import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ComponentProps } from 'react';
import MainLayout from './MainLayout';
import SoundCloudWidget from '../features/player/components/SoundCloudWidget';
import type PlaylistPanel from '../components/player/PlaylistPanel';
import PlaylistDetailPage from '../features/playlists/pages/PlaylistDetailPage';
import LikedTracksPage from '../features/bookmarks/pages/LikedTracksPage';
import { usePlayerStore } from '../features/player/stores/usePlayerStore';
import type { SavedTrack } from '../features/bookmarks/types/saved-track.types';
import type { SoundCloudWidgetInstance } from '../features/player/types/soundcloud-widget.types';

const saved = vi.hoisted(() => ({ receive: undefined as ((tracks: SavedTrack[]) => void) | undefined }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'user-1' }, loading: false }) }));
vi.mock('../contexts/ToastContext', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../features/bookmarks/services/savedTracks', () => ({
  subscribeToSavedTracks: vi.fn((_uid, onSuccess) => { saved.receive = onSuccess; return vi.fn(); }),
  removeSavedTrack: vi.fn(),
}));
vi.mock('../components/ui/Slider', () => ({ default: () => null }));
vi.mock('../components/track/TrackItemActions', () => ({ default: () => null, SoundCloudTrackLink: () => null, trackActionButtonClass: '' }));
vi.mock('../features/playlists/components/PlaylistActions', () => ({ default: () => null }));
vi.mock('../components/layout/Sidebar', () => ({ default: () => null }));
vi.mock('../components/layout/PlayerBar', () => ({ default: () => null }));
vi.mock('../components/layout/PlayerBarSkeleton', () => ({ default: () => null }));
vi.mock('../components/DarkModeToggle', () => ({ default: () => null }));
vi.mock('../components/ui/Tooltip', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('../components/player/PlaylistPanel', () => ({
  default: (props: ComponentProps<typeof PlaylistPanel>) => <>
    <output data-testid="panel-selection">{props.soundCloudWidget.widgetTrack?.id}</output>
    <button onClick={() => props.onSelect(1)}>Panel second</button>
    <SoundCloudWidget playlistUrl={props.playlistUrl} controller={props.soundCloudWidget} />
  </>,
}));

const sound = (id: number) => ({ id, title: `Song ${id}`, user: { username: 'Artist' },
  duration: 180000, permalink_url: `https://soundcloud.com/example/${id}`, playable: true, policy: 'ALLOW' });
const savedTrack: SavedTrack = { id: 3, title: 'Song 3', artist: 'Artist', artworkUrl: null,
  durationMs: 180000, permalinkUrl: 'https://soundcloud.com/example/3', genre: '', tags: [], savedAt: null };

function makeWidget(frame: HTMLIFrameElement | string) {
  const isMain = typeof frame !== 'string' && frame.title === 'SoundCloud 플레이리스트';
  const listeners = new Map<string, (event?: unknown) => void>();
  const widget: SoundCloudWidgetInstance = {
    bind: vi.fn((name, listener) => { listeners.set(name, listener); }),
    unbind: vi.fn(name => { listeners.delete(name); }),
    load: vi.fn(), play: vi.fn(), pause: vi.fn(), toggle: vi.fn(), next: vi.fn(), prev: vi.fn(),
    skip: vi.fn(), seekTo: vi.fn(), setVolume: vi.fn(), getVolume: vi.fn(), getPosition: vi.fn(),
    getSounds: vi.fn(reply => reply(isMain ? [sound(1), sound(2)] : [sound(3), sound(4)])),
    getCurrentSound: vi.fn(reply => reply(sound(1))), getDuration: vi.fn(reply => reply(180000)),
    getCurrentSoundIndex: vi.fn(reply => reply(0)), isPaused: vi.fn(reply => reply(true)),
  };
  return { isMain, widget, emit: (name: string) => act(() => listeners.get(name)?.()) };
}
let instances: ReturnType<typeof makeWidget>[];
beforeEach(() => {
  instances = [];
  saved.receive = undefined;
  vi.spyOn(Math, 'random').mockReturnValue(0);
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  const events = { READY: 'READY', PLAY: 'PLAY', PAUSE: 'PAUSE', FINISH: 'FINISH', SEEK: 'SEEK',
    LOAD_PROGRESS: 'LOAD_PROGRESS', PLAY_PROGRESS: 'PLAY_PROGRESS', ERROR: 'ERROR' };
  window.SC = { Widget: Object.assign(vi.fn((frame: HTMLIFrameElement | string) => {
    const instance = makeWidget(frame); instances.push(instance); return instance.widget;
  }), { Events: events }) };
  usePlayerStore.setState({ tracks: [], currentTrack: null, playbackMode: 'playlist',
    isPlaying: false, isPlaybackLoading: false, currentTime: 0, duration: 0, isMuted: false });
});
afterEach(() => { cleanup(); delete window.SC; vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it.each(['detail', 'likes'] as const)('%s single playback keeps panel selection, stops on FINISH and explicitly reloads a panel song from the start', async page => {
  render(<MemoryRouter initialEntries={[page === 'detail' ? '/playlists/2024-spring' : '/likes']}>
    <Routes><Route element={<MainLayout />}>
      <Route path="/playlists/:playlistId" element={<><Link to="/away">Leave page</Link><PlaylistDetailPage /></>} />
      <Route path="/likes" element={<><Link to="/away">Leave page</Link><LikedTracksPage /></>} />
      <Route path="/away" element={<p>Other content</p>} />
    </Route></Routes>
  </MemoryRouter>);
  const main = instances.find(instance => instance.isMain)!;
  main.emit('READY');
  for (const instance of instances.filter(instance => !instance.isMain)) instance.emit('READY');
  if (page === 'likes') act(() => saved.receive?.([savedTrack]));
  fireEvent.click(screen.getByText('Panel second'));
  vi.mocked(main.widget.getCurrentSound).mockImplementation(reply => reply(sound(2)));
  main.emit('PLAY');
  expect(screen.getByTestId('panel-selection').textContent).toBe('2');
  const panelTracks = usePlayerStore.getState().tracks;
  fireEvent.click(await screen.findByRole('button', { name: /Song 3.*재생/ }));
  expect(main.widget.load).toHaveBeenCalledExactlyOnceWith(savedTrack.permalinkUrl,
    expect.objectContaining({ auto_play: false }));
  vi.mocked(main.widget.getCurrentSound).mockImplementation(reply => reply(sound(3)));
  act(() => vi.mocked(main.widget.load).mock.calls[0][1]?.callback?.());
  expect(usePlayerStore.getState().isPlaying).toBe(false);
  main.emit('PLAY');
  expect(usePlayerStore.getState().currentTrack?.id).toBe(3);
  expect(screen.getByTestId('panel-selection').textContent).toBe('2');
  expect(usePlayerStore.getState().tracks).toBe(panelTracks);
  const loadCount = vi.mocked(main.widget.load).mock.calls.length;
  const playCount = vi.mocked(main.widget.play).mock.calls.length;
  main.emit('FINISH');
  expect(usePlayerStore.getState()).toMatchObject({ playbackMode: 'single', isPlaying: false, currentTime: 0 });
  expect(main.widget.seekTo).toHaveBeenCalledExactlyOnceWith(0);
  expect(main.widget.load).toHaveBeenCalledTimes(loadCount);
  expect(main.widget.play).toHaveBeenCalledTimes(playCount);
  expect(main.widget.next).not.toHaveBeenCalled();
  expect(main.widget.skip).toHaveBeenCalledExactlyOnceWith(1);
  fireEvent.click(screen.getByText('Leave page'));
  expect(usePlayerStore.getState().tracks).toBe(panelTracks);
  expect(screen.getByTestId('panel-selection').textContent).toBe('2');
  expect(main.widget.play).toHaveBeenCalledTimes(playCount);
  fireEvent.click(screen.getByText('Panel second'));
  expect(main.widget.load).toHaveBeenLastCalledWith(expect.any(String),
    expect.objectContaining({ start_track: 1, auto_play: false }));
  expect(usePlayerStore.getState()).toMatchObject({ playbackMode: 'playlist', currentTime: 0, isPlaybackLoading: true });
  vi.mocked(main.widget.getCurrentSound).mockImplementation(reply => reply(sound(2)));
  act(() => vi.mocked(main.widget.load).mock.calls[1][1]?.callback?.());
  expect(main.widget.seekTo).toHaveBeenCalledTimes(1);
  main.emit('PLAY');
  expect(usePlayerStore.getState()).toMatchObject({ playbackMode: 'playlist', currentTrack: { id: 2 }, isPlaying: true });
});
