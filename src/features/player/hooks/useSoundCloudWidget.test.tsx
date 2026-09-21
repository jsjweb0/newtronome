import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSoundCloudWidget } from './useSoundCloudWidget';
import { usePlayerStore } from '../stores/usePlayerStore';
import type {
  SoundCloudProgressEvent,
  SoundCloudWidgetInstance,
} from '../types/soundcloud-widget.types';
import type { PlayerTrack } from '../types/player.types';

const PLAYLIST_URL = 'https://soundcloud.com/example/sets/playlist';

const playlistTracks: PlayerTrack[] = [
  {
    id: 1,
    title: 'First track',
    artist: 'First artist',
    artworkUrl: null,
    permalinkUrl: 'https://soundcloud.com/example/first',
    durationMs: 180_000,
    genre: 'House',
    tags: [],
  },
  {
    id: 2,
    title: 'Second track',
    artist: 'Second artist',
    artworkUrl: null,
    permalinkUrl: 'https://soundcloud.com/example/second',
    durationMs: 210_000,
    genre: 'Disco',
    tags: [],
  },
];

const bookmarkTrack: PlayerTrack = {
  id: 'bookmark-1',
  title: 'Saved track',
  artist: 'Saved artist',
  artworkUrl: null,
  permalinkUrl: 'https://soundcloud.com/example/saved-track',
  durationMs: 200_000,
  genre: 'Nu Disco',
  tags: [],
};

type WidgetListener = (event?: SoundCloudProgressEvent) => void;

function createWidgetMock() {
  const listeners = new Map<string, WidgetListener>();

  const widget: SoundCloudWidgetInstance = {
    bind: vi.fn((eventName, listener) => {
      listeners.set(eventName, listener);
    }),
    unbind: vi.fn((eventName) => {
      listeners.delete(eventName);
    }),
    load: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    toggle: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    skip: vi.fn(),
    seekTo: vi.fn(),
    setVolume: vi.fn(),
    getVolume: vi.fn(),
    getDuration: vi.fn(),
    getPosition: vi.fn(),
    getSounds: vi.fn(),
    getCurrentSound: vi.fn(),
    getCurrentSoundIndex: vi.fn(),
    isPaused: vi.fn(),
  };

  const events = {
    READY: 'READY',
    PLAY: 'PLAY',
    PAUSE: 'PAUSE',
    FINISH: 'FINISH',
    SEEK: 'SEEK',
    LOAD_PROGRESS: 'LOAD_PROGRESS',
    PLAY_PROGRESS: 'PLAY_PROGRESS',
    ERROR: 'ERROR',
  };

  const widgetFactory = Object.assign(vi.fn(() => widget), { Events: events });

  window.SC = { Widget: widgetFactory };

  return { events, listeners, widget };
}

function renderWidgetHook() {
  const renderedHook = renderHook(() => useSoundCloudWidget(PLAYLIST_URL));

  act(() => {
    renderedHook.result.current.iframeRef(document.createElement('iframe'));
  });

  return renderedHook;
}

describe('useSoundCloudWidget source switching', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      tracks: playlistTracks,
      currentTrack: playlistTracks[0],
      playbackMode: 'playlist',
      currentIndex: 0,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isMuted: false,
    });
  });

  afterEach(() => {
    cleanup();
    delete window.SC;
    vi.restoreAllMocks();
  });

  it('loads a saved track and changes to bookmark playback mode', () => {
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();

    act(() => {
      result.current.playBookmarkTrack(bookmarkTrack);
    });

    expect(widget.load).toHaveBeenCalledWith(
      bookmarkTrack.permalinkUrl,
      expect.objectContaining({ auto_play: true })
    );
    expect(usePlayerStore.getState()).toMatchObject({
      playbackMode: 'bookmark',
      currentTrack: bookmarkTrack,
      isPlaying: false,
      currentTime: 0,
      duration: bookmarkTrack.durationMs / 1000,
    });
  });

  it('stops a saved track instead of continuing when it finishes', () => {
    const { events, listeners, widget } = createWidgetMock();
    renderWidgetHook();

    usePlayerStore.setState({
      playbackMode: 'bookmark',
      isPlaying: true,
      currentTime: 120,
    });

    act(() => {
      listeners.get(events.FINISH)?.();
    });

    expect(widget.seekTo).toHaveBeenCalledWith(0);
    expect(usePlayerStore.getState()).toMatchObject({
      playbackMode: 'bookmark',
      isPlaying: false,
      currentTime: 0,
    });
  });

  it('loads the playlist at the selected track when leaving bookmark mode', () => {
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();

    usePlayerStore.setState({ playbackMode: 'bookmark' });

    act(() => {
      result.current.selectTrack(1);
    });

    expect(widget.load).toHaveBeenCalledWith(
      PLAYLIST_URL,
      expect.objectContaining({
        auto_play: true,
        start_track: 1,
      })
    );
    expect(usePlayerStore.getState()).toMatchObject({
      playbackMode: 'playlist',
      currentTrack: playlistTracks[1],
      isPlaying: false,
      currentTime: 0,
      duration: playlistTracks[1].durationMs / 1000,
    });
  });

  it('uses Widget skip when selecting another track in playlist mode', () => {
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();

    act(() => {
      result.current.selectTrack(1);
    });

    expect(widget.skip).toHaveBeenCalledWith(1);
    expect(widget.load).not.toHaveBeenCalled();
  });

  it('ignores another source change while a playlist load is in progress', () => {
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();

    usePlayerStore.setState({ playbackMode: 'bookmark' });

    act(() => {
      result.current.selectTrack(0);
      result.current.selectTrack(1);
    });

    expect(widget.load).toHaveBeenCalledTimes(1);
    expect(widget.load).toHaveBeenCalledWith(
      PLAYLIST_URL,
      expect.objectContaining({ start_track: 0 })
    );
  });
});
