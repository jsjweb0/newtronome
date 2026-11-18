import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useOutletContext } from 'react-router-dom';
import MainLayout, { type PlayerOutletContext } from './MainLayout';
import HomePage from '../pages/HomePage';
import { usePlayerStore } from '../features/player/stores/usePlayerStore';
import type { SoundCloudWidgetInstance } from '../features/player/types/soundcloud-widget.types';

vi.mock('../components/layout/Sidebar', () => ({ default: () => null }));
vi.mock('../components/layout/PlayerBar', () => ({ default: () => null }));
vi.mock('../components/layout/PlayerBarSkeleton', () => ({ default: () => null }));
vi.mock('../components/layout/HeaderButtons', () => ({ default: () => null }));
vi.mock('../components/DarkModeToggle', () => ({ default: () => null }));
vi.mock('../components/ui/Tooltip', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('../components/ui/Slider', () => ({ default: () => null }));
vi.mock('../components/track/TrackItemActions', () => ({ default: () => null }));
vi.mock('../features/bookmarks/components/TrackBookmarkButton', () => ({ default: () => null }));

const sounds = [1, 2].map(id => ({ id, title: `Song ${id}`, user: { username: 'Artist' },
  duration: 180000, permalink_url: `https://soundcloud.com/example/${id}`, policy: 'ALLOW', playable: true }));
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

let instances: ReturnType<typeof createWidgetMock>[];
function HomeWithSingleAction() {
  const { onPlaySingleTrack } = useOutletContext<PlayerOutletContext>();
  return <><button onClick={() => onPlaySingleTrack({ id: 3, title: 'Single', artist: 'Artist',
    durationMs: 180000, artworkUrl: null, permalinkUrl: 'https://soundcloud.com/example/3', genre: '', tags: [] })}>Start single</button><HomePage /></>;
}
function mount() {
  render(<MemoryRouter><Routes><Route element={<MainLayout />}>
    <Route path="/" element={<HomeWithSingleAction />} />
  </Route></Routes></MemoryRouter>);
  instances[0].emit('READY');
}
function home() { return within(screen.getByRole('main')); }
function panel() { return within(screen.getByRole('complementary')); }
function button(scope: ReturnType<typeof within>, id: number) {
  const element = scope.getByRole('button', { name: new RegExp(`Song ${id}.*(?:재생|일시정지)`) });
  if (!(element instanceof HTMLButtonElement)) throw new Error('Expected a track button');
  return element;
}
beforeEach(() => {
  instances = [];
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
afterEach(() => { cleanup(); delete window.SC; vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it.each(['home', 'panel'] as const)('a %s selection synchronizes the real Home and panel only after Widget PLAY', source => {
  mount(); const current = instances[0];
  fireEvent.click(button(source === 'home' ? home() : panel(), 2));
  expect(current.widget.skip).toHaveBeenCalledExactlyOnceWith(1);
  expect(current.widget.load).not.toHaveBeenCalled();
  expect(usePlayerStore.getState().isPlaying).toBe(false);
  expect(button(home(), 2).textContent).not.toContain('일시정지');
  vi.mocked(current.widget.getCurrentSound).mockImplementation(reply => reply(sounds[1]));
  current.emit('PLAY');
  expect(usePlayerStore.getState()).toMatchObject({ playbackMode: 'playlist', isPlaying: true, currentTrack: { id: 2 } });
  expect(button(home(), 2).textContent).toContain('일시정지');
  expect(button(panel(), 2).textContent).toContain('일시정지');
  expect(button(panel(), 2).getAttribute('aria-current')).toBe('true');
  fireEvent.click(button(source === 'home' ? panel() : home(), 2));
  expect(current.widget.toggle).toHaveBeenCalledOnce();
  expect(current.widget.load).not.toHaveBeenCalled();
  expect(current.widget.skip).toHaveBeenCalledTimes(1);
});

it('the real panel keeps loaded tracks selectable during source loading and synchronizes Home after the latest load', () => {
  mount(); const current = instances[0];
  fireEvent.click(screen.getByText('Start single'));
  fireEvent.click(button(panel(), 2));
  expect(current.widget.load).toHaveBeenCalledTimes(2);
  expect(button(panel(), 2).disabled).toBe(true);
  expect(button(panel(), 1).disabled).toBe(false);
  fireEvent.click(button(panel(), 1));
  expect(current.widget.load).toHaveBeenCalledTimes(3);
  expect(vi.mocked(current.widget.load).mock.calls[2][1]?.start_track).toBe(0);
  act(() => vi.mocked(current.widget.load).mock.calls[1][1]?.callback?.());
  expect(usePlayerStore.getState().isPlaybackLoading).toBe(true);
  expect(current.widget.play).not.toHaveBeenCalled();
  vi.mocked(current.widget.getCurrentSound).mockImplementation(reply => reply(sounds[0]));
  act(() => vi.mocked(current.widget.load).mock.calls[2][1]?.callback?.());
  expect(button(home(), 1).disabled).toBe(false);
  expect(button(panel(), 1).disabled).toBe(false);
  expect(current.widget.play).toHaveBeenCalledOnce();
  current.emit('PLAY');
  expect(button(home(), 1).textContent).toContain('일시정지');
  expect(button(panel(), 1).textContent).toContain('일시정지');
});

it('keeps the loaded Home list selectable while a panel source reload is pending', () => {
  mount();
  fireEvent.click(screen.getByText('Start single'));
  fireEvent.click(button(panel(), 2));
  expect(usePlayerStore.getState().isPlaybackLoading).toBe(true);
  expect(usePlayerStore.getState().tracks.map(track => track.id)).toEqual([1, 2]);
  const otherHomeTrack = home().queryByRole<HTMLButtonElement>('button', { name: /Song 1.*재생/ });
  expect(otherHomeTrack, 'the loaded Home track remains available for replacing the pending selection').not.toBeNull();
  expect(otherHomeTrack?.disabled).toBe(false);
  if (otherHomeTrack) fireEvent.click(otherHomeTrack);
  const calls = vi.mocked(instances[0].widget.load).mock.calls;
  expect(calls[calls.length - 1]?.[1]?.start_track).toBe(0);
});
