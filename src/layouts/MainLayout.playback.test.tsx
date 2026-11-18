import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Link, MemoryRouter, Route, Routes, useOutletContext } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from '../pages/HomePage';
import ITunesSearchPage from '../features/itunes/pages/ITunesSearchPage';
import type { ComponentProps } from 'react';
import MainLayout, { type PlayerOutletContext } from './MainLayout';
import SoundCloudWidget from '../features/player/components/SoundCloudWidget';
import type PlaylistPanel from '../components/player/PlaylistPanel';
import { usePlayerStore } from '../features/player/stores/usePlayerStore';
import type { PlayerTrack } from '../features/player/types/player.types';
import type { SoundCloudWidgetInstance } from '../features/player/types/soundcloud-widget.types';

vi.mock('../components/ui/Slider', () => ({ default: () => null }));
vi.mock('../components/track/TrackItemActions', () => ({ default: () => null }));
vi.mock('../contexts/ToastContext', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../features/itunes/services/searchITunesTracks', () => ({ searchITunesTracks: vi.fn(async () => [{ artistId: 1, trackId: 10, trackName: 'Preview song', artistName: 'Artist', previewUrl: 'https://example.com/preview.m4a' }]) }));

vi.mock('../components/layout/Sidebar', () => ({ default: () => null }));
vi.mock('../components/layout/PlayerBar', () => ({ default: () => null }));
vi.mock('../components/layout/PlayerBarSkeleton', () => ({ default: () => null }));
vi.mock('../components/DarkModeToggle', () => ({ default: () => null }));
vi.mock('../components/ui/Tooltip', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('../components/player/PlaylistPanel', () => ({
  default: (props: ComponentProps<typeof PlaylistPanel>) => (
    <SoundCloudWidget playlistUrl={props.playlistUrl} controller={props.soundCloudWidget} />
  ),
}));

const sounds = [1, 2].map(id => ({ id, title: `Song ${id}`, user: { username: 'Artist' },
  duration: 180000, permalink_url: `https://soundcloud.com/example/${id}`, policy: 'ALLOW', playable: true }));
const single: PlayerTrack = { id: 3, title: 'Single', artist: 'Artist', durationMs: 180000,
  artworkUrl: null, permalinkUrl: 'https://soundcloud.com/example/3', genre: '', tags: [] };
const singleSound = { ...sounds[0], id: 3, title: 'Single', permalink_url: single.permalinkUrl };

// Commands do not emit success events: each test controls responses and events separately.
function createWidgetMock() {
  const listeners = new Map<string, (event?: unknown) => void>();
  const widget: SoundCloudWidgetInstance = {
    bind: vi.fn((name, listener) => { listeners.set(name, listener); }),
    unbind: vi.fn(name => { listeners.delete(name); }),
    load: vi.fn(), play: vi.fn(), pause: vi.fn(), toggle: vi.fn(), next: vi.fn(), prev: vi.fn(),
    skip: vi.fn(), seekTo: vi.fn(), setVolume: vi.fn(), getVolume: vi.fn(), getPosition: vi.fn(),
    getSounds: vi.fn(reply => reply(sounds)),
    getCurrentSound: vi.fn(reply => reply(sounds[0])),
    getDuration: vi.fn(reply => reply(180000)), getCurrentSoundIndex: vi.fn(reply => reply(0)),
    isPaused: vi.fn(reply => reply(true)),
  };
  return { widget, listeners, emit: (name: string) => act(() => listeners.get(name)?.()) };
}
let queryClient: QueryClient;
let instances: ReturnType<typeof createWidgetMock>[];

function Actions() {
  const context = useOutletContext<PlayerOutletContext>();
  return <>
    <button onClick={() => context.onPlaySingleTrack({ ...single, id: 4, title: "Latest", permalinkUrl: "https://soundcloud.com/example/4" })}>Latest single</button>
    <button onClick={() => context.onSelectTrack(1)}>Panel song</button>
    <button onClick={() => context.onPlayPlaylist('autumn-disco')}>Whole playlist</button>
    <button onClick={() => context.onPlaySingleTrack(single)}>Single</button>
    <button onClick={context.onPauseSoundCloud}>Preview pause</button>
    <Link to="/other">Other page</Link>
  </>;
}
function mount(page: 'actions' | 'home' | 'itunes' = 'actions') {
  return render(<QueryClientProvider client={queryClient}><MemoryRouter><Routes><Route element={<MainLayout />}>
    <Route path="/" element={page === 'home' ? <HomePage /> : page === 'itunes' ? <><Link to="/other">Leave search</Link><Actions /><ITunesSearchPage /></> : <Actions />} /><Route path="/other" element={<Actions />} />
  </Route></Routes></MemoryRouter></QueryClientProvider>);
}

beforeEach(() => {
  instances = [];
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  localStorage.clear();
  vi.spyOn(Math, 'random').mockReturnValue(0);
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  const events = { READY: 'READY', PLAY: 'PLAY', PAUSE: 'PAUSE', FINISH: 'FINISH', SEEK: 'SEEK',
    LOAD_PROGRESS: 'LOAD_PROGRESS', PLAY_PROGRESS: 'PLAY_PROGRESS', ERROR: 'ERROR' };
  window.SC = { Widget: Object.assign(vi.fn(() => {
    const instance = createWidgetMock(); instances.push(instance); return instance.widget;
  }), { Events: events }) };
  usePlayerStore.setState({ tracks: [], currentTrack: null, playbackMode: 'playlist',
    isPlaying: false, isPlaybackLoading: false, currentTime: 0, duration: 0, isMuted: false });
});
afterEach(() => { cleanup(); vi.useRealTimers(); queryClient.clear(); delete window.SC; vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('initial READY populates the playlist without issuing playback', () => {
  mount(); const current = instances[0]; current.emit('READY');
  expect(usePlayerStore.getState().tracks.map(track => track.id)).toEqual([1, 2]);
  expect(current.widget.play).not.toHaveBeenCalled();
  expect(current.widget.skip).not.toHaveBeenCalled();
  expect(usePlayerStore.getState().isPlaying).toBe(false);
});

it('whole playlist waits for the replacement iframe and toggles the same prepared playlist', () => {
  mount(); instances[0].emit('READY');
  fireEvent.click(screen.getByText('Whole playlist'));
  expect(instances).toHaveLength(2);
  const current = instances[1];
  expect(current.widget.skip).not.toHaveBeenCalled();
  current.emit('READY');
  expect(current.widget.skip).toHaveBeenCalledExactlyOnceWith(0);
  expect(usePlayerStore.getState().isPlaying).toBe(false);
  current.emit('PLAY');
  expect(usePlayerStore.getState().isPlaying).toBe(true);
  fireEvent.click(screen.getByText('Whole playlist'));
  expect(current.widget.toggle).toHaveBeenCalledOnce();
  expect(instances).toHaveLength(2);
});

it('public preview pause allows a single load to finish without playing or clearing the panel list', () => {
  mount(); const current = instances[0]; current.emit('READY');
  const playlist = usePlayerStore.getState().tracks;
  fireEvent.click(screen.getByText('Single'));
  expect(usePlayerStore.getState().isPlaybackLoading).toBe(true);
  fireEvent.click(screen.getByText('Preview pause'));
  vi.mocked(current.widget.getCurrentSound).mockImplementation(reply => reply(singleSound));
  act(() => vi.mocked(current.widget.load).mock.calls[0][1]?.callback?.());
  expect(current.widget.play).not.toHaveBeenCalled();
  expect(usePlayerStore.getState()).toMatchObject({ isPlaybackLoading: false, isPlaying: false, playbackMode: 'single' });
  expect(usePlayerStore.getState().tracks).toBe(playlist);
});

it('single FINISH stops at the beginning and route navigation does not remount the player', () => {
  mount(); const current = instances[0]; current.emit('READY');
  fireEvent.click(screen.getByText('Single'));
  vi.mocked(current.widget.getCurrentSound).mockImplementation(reply => reply(singleSound));
  act(() => vi.mocked(current.widget.load).mock.calls[0][1]?.callback?.());
  current.emit('PLAY'); current.emit('FINISH');
  expect(usePlayerStore.getState()).toMatchObject({ isPlaying: false, currentTime: 0, playbackMode: 'single' });
  expect(current.widget.seekTo).toHaveBeenCalledExactlyOnceWith(0);
  const plays = vi.mocked(current.widget.play).mock.calls.length;
  fireEvent.click(screen.getByText('Other page'));
  expect(instances).toHaveLength(1);
  expect(current.widget.play).toHaveBeenCalledTimes(plays);
  expect(usePlayerStore.getState().tracks.map(track => track.id)).toEqual([1, 2]);
});

it('preview pause cancels Layout playback waiting for a new iframe', () => {
  mount(); instances[0].emit('READY');
  fireEvent.click(screen.getByText('Whole playlist'));
  fireEvent.click(screen.getByText('Single'));
  fireEvent.click(screen.getByText('Preview pause'));
  const current = instances[1]; current.emit('READY');
  expect(current.widget.load).not.toHaveBeenCalled();
  expect(current.widget.skip).not.toHaveBeenCalled();
  expect(current.widget.play).not.toHaveBeenCalled();
});

it('executes only the latest single selection after the replacement iframe becomes ready', () => {
  mount(); instances[0].emit('READY');
  fireEvent.click(screen.getByText('Whole playlist'));
  fireEvent.click(screen.getByText('Single'));
  fireEvent.click(screen.getByText('Latest single'));
  const current = instances[1];
  expect(current.widget.load).not.toHaveBeenCalled();
  current.emit('READY');
  expect(current.widget.load).toHaveBeenCalledExactlyOnceWith(
    'https://soundcloud.com/example/4', expect.objectContaining({ auto_play: false }));
  expect(current.widget.skip).not.toHaveBeenCalled();
  expect(usePlayerStore.getState().currentTrack?.id).toBe(4);
});

it('returns from single playback to a panel selection by reloading it without restoring the single position', () => {
  mount(); const current = instances[0]; current.emit('READY');
  fireEvent.click(screen.getByText('Single'));
  vi.mocked(current.widget.getCurrentSound).mockImplementation(reply => reply(singleSound));
  act(() => vi.mocked(current.widget.load).mock.calls[0][1]?.callback?.());
  current.emit('PLAY');
  fireEvent.click(screen.getByText('Panel song'));
  expect(current.widget.load).toHaveBeenLastCalledWith(expect.any(String),
    expect.objectContaining({ start_track: 1, auto_play: false }));
  expect(usePlayerStore.getState()).toMatchObject({ playbackMode: 'playlist', currentTime: 0, isPlaybackLoading: true });
  vi.mocked(current.widget.getCurrentSound).mockImplementation(reply => reply(sounds[1]));
  act(() => vi.mocked(current.widget.load).mock.calls[1][1]?.callback?.());
  expect(usePlayerStore.getState().currentTrack?.id).toBe(2);
  expect(current.widget.seekTo).not.toHaveBeenCalled();
  expect(usePlayerStore.getState().isPlaying).toBe(false);
  current.emit('PLAY');
  expect(usePlayerStore.getState().isPlaying).toBe(true);
});

it('unbinds the old instance on Layout unmount and ignores its retained callback after remount', () => {
  const first = mount(); const old = instances[0]; old.emit('READY');
  fireEvent.click(screen.getByText('Single'));
  const callback = vi.mocked(old.widget.load).mock.calls[0][1]?.callback;
  first.unmount();
  expect(old.listeners.size).toBe(0);
  mount(); const current = instances[1]; current.emit('READY');
  const state = usePlayerStore.getState();
  act(() => callback?.());
  expect(usePlayerStore.getState()).toBe(state);
  expect(old.widget.play).not.toHaveBeenCalled();
  expect(current.widget.play).not.toHaveBeenCalled();
});

it('a real Home track click uses playlist skip and the confirmed track then toggles', () => {
  mount('home'); const current = instances[0]; current.emit('READY');
  const button = screen.getByRole('button', { name: /Song 2.*재생/ });
  fireEvent.click(button);
  expect(current.widget.skip).toHaveBeenCalledExactlyOnceWith(1);
  expect(current.widget.load).not.toHaveBeenCalled();
  vi.mocked(current.widget.getCurrentSound).mockImplementation(reply => reply(sounds[1]));
  current.emit('PLAY');
  expect(usePlayerStore.getState()).toMatchObject({ playbackMode: 'playlist', isPlaying: true, currentTrack: { id: 2 } });
  fireEvent.click(screen.getByRole('button', { name: /Song 2.*일시정지/ }));
  expect(current.widget.toggle).toHaveBeenCalledOnce();
});

it('whole playlist skips a blocked first track through the real hook', () => {
  mount(); instances[0].emit('READY');
  fireEvent.click(screen.getByText('Whole playlist'));
  const current = instances[1];
  vi.mocked(current.widget.getSounds).mockImplementation(reply => reply([{ ...sounds[0], policy: 'BLOCK', playable: false }, sounds[1]]));
  current.emit('READY');
  expect(current.widget.skip).toHaveBeenCalledExactlyOnceWith(1);
});

it.each(['ended', 'leave'] as const)('real iTunes preview cancels single load playback and does not resume SoundCloud on %s', async (outcome) => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  mount('itunes'); const current = instances[0]; current.emit('READY');
  fireEvent.click(screen.getByText('Single'));
  fireEvent.change(screen.getByRole('combobox', { name: '검색어' }), { target: { value: 'test' } });
  fireEvent.submit(screen.getByRole('combobox', { name: '검색어' }).closest('form')!);
  fireEvent.click(await screen.findByRole('button', { name: 'Preview song 30초 미리듣기' }));
  await screen.findByRole('button', { name: 'Preview song 미리듣기 정지' });
  expect(current.widget.pause).toHaveBeenCalledOnce();
  if (outcome === 'ended') fireEvent.ended(document.querySelector('audio')!);
  else fireEvent.click(screen.getByText('Leave search'));
  vi.mocked(current.widget.getCurrentSound).mockImplementation(reply => reply(singleSound));
  act(() => vi.mocked(current.widget.load).mock.calls[0][1]?.callback?.());
  expect(usePlayerStore.getState()).toMatchObject({ isPlaybackLoading: false, isPlaying: false, playbackMode: 'single' });
  expect(current.widget.play).not.toHaveBeenCalled();
  expect(instances).toHaveLength(1);
});

it('a new SoundCloud selection after preview cancellation can play and stops the real iTunes audio', async () => {
  const pauseAudio = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  mount('itunes'); const current = instances[0]; current.emit('READY');
  fireEvent.click(screen.getByText('Single'));
  fireEvent.change(screen.getByRole('combobox', { name: '검색어' }), { target: { value: 'test' } });
  fireEvent.submit(screen.getByRole('combobox', { name: '검색어' }).closest('form')!);
  fireEvent.click(await screen.findByRole('button', { name: 'Preview song 30초 미리듣기' }));
  await screen.findByRole('button', { name: 'Preview song 미리듣기 정지' });
  fireEvent.click(screen.getByText('Latest single'));
  vi.mocked(current.widget.getCurrentSound).mockImplementation(reply => reply({ ...singleSound, id: 4 }));
  act(() => vi.mocked(current.widget.load).mock.calls[1][1]?.callback?.());
  expect(current.widget.play).toHaveBeenCalledOnce();
  const pauses = pauseAudio.mock.calls.length;
  current.emit('PLAY');
  expect(pauseAudio).toHaveBeenCalledTimes(pauses + 1);
  expect(document.querySelector('audio')?.hasAttribute('src')).toBe(false);
  expect(screen.getByRole('button', { name: 'Preview song 30초 미리듣기' })).toBeTruthy();
  expect(usePlayerStore.getState()).toMatchObject({ isPlaying: true, currentTrack: { id: 4 } });
});

it.each(['empty', 'blocked'] as const)('whole playlist does not play when its loaded tracks are %s', (kind) => {
  vi.useFakeTimers();
  mount(); instances[0].emit('READY');
  fireEvent.click(screen.getByText('Whole playlist'));
  const current = instances[1];
  vi.mocked(current.widget.getSounds).mockImplementation(reply => reply(
    kind === 'empty' ? [] : sounds.map(sound => ({ ...sound, policy: 'BLOCK', playable: false }))));
  current.emit('READY');
  act(() => vi.advanceTimersByTime(3000));
  expect(current.widget.skip).not.toHaveBeenCalled();
  expect(current.widget.load).not.toHaveBeenCalled();
  expect(current.widget.play).not.toHaveBeenCalled();
  expect(usePlayerStore.getState().isPlaying).toBe(false);
  expect(usePlayerStore.getState().tracks).toHaveLength(kind === 'empty' ? 0 : 2);
});
