import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSoundCloudWidget } from './useSoundCloudWidget';
import { usePlayerStore } from '../stores/usePlayerStore';
import type {
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

type WidgetListener = (event?: unknown) => void;

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
    vi.useRealTimers();
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

  it('waits for playlist loading before applying a later track selection', () => {
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();

    usePlayerStore.setState({ playbackMode: 'bookmark' });

    act(() => {
      result.current.selectTrack(0);
    });

    const onPlaylistLoaded = vi.mocked(widget.load).mock.calls[0][1]?.callback;
    expect(onPlaylistLoaded).toBeTypeOf('function');

    act(() => {
      result.current.selectTrack(1);
    });

    expect(widget.load).toHaveBeenCalledTimes(1);
    expect(widget.skip).not.toHaveBeenCalled();

    act(() => {
      onPlaylistLoaded?.();
    });

    expect(widget.skip).toHaveBeenCalledTimes(1);
    expect(widget.skip).toHaveBeenCalledWith(1);
    expect(usePlayerStore.getState().currentTrack).toEqual(playlistTracks[1]);
  });

  it('applies only the latest selection when several tracks are chosen during loading', () => {
    const { events, listeners, widget } = createWidgetMock();
    const { result } = renderWidgetHook();
    const thirdTrack: PlayerTrack = {
      ...playlistTracks[1],
      id: 3,
      title: 'Third track',
      permalinkUrl: 'https://soundcloud.com/example/third',
    };

    usePlayerStore.setState({
      tracks: [...playlistTracks, thirdTrack],
      playbackMode: 'bookmark',
    });

    act(() => {
      result.current.selectTrack(0);
    });

    const onPlaylistLoaded = vi.mocked(widget.load).mock.calls[0][1]?.callback;
    expect(onPlaylistLoaded).toBeTypeOf('function');

    act(() => {
      result.current.selectTrack(1);
      result.current.selectTrack(2);
    });

    expect(widget.load).toHaveBeenCalledTimes(1);
    expect(widget.skip).not.toHaveBeenCalled();

    act(() => {
      onPlaylistLoaded?.();
    });

    expect(widget.skip).toHaveBeenCalledTimes(1);
    expect(widget.skip).toHaveBeenCalledWith(2);
    expect(usePlayerStore.getState().currentTrack).toEqual(thirdTrack);
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    vi.mocked(widget.getCurrentSound).mockImplementation((callback) => callback({
      id: 3, title: thirdTrack.title, duration: thirdTrack.durationMs,
    }));
    vi.mocked(widget.getDuration).mockImplementation((callback) => callback(thirdTrack.durationMs));
    act(() => listeners.get(events.PLAY)?.());
    expect(usePlayerStore.getState()).toMatchObject({
      currentTrack: { id: 3 }, isPlaying: true, currentTime: 0, duration: 210,
    });
    expect(result.current.widgetTrack?.id).toBe(3);
    expect(result.current.widgetIsPlaying).toBe(true);
  });

  it('ignores an earlier track lookup after a source switch', () => {
    const { events, listeners, widget } = createWidgetMock();
    const { result } = renderWidgetHook();

    act(() => listeners.get(events.PLAY)?.());
    const previousLookup = vi.mocked(widget.getCurrentSound).mock.calls[0][0];
    const previousDuration = vi.mocked(widget.getDuration).mock.calls[0][0];

    act(() => result.current.playBookmarkTrack(bookmarkTrack));
    act(() => {
      previousLookup({ id: 1, title: 'Old track' });
      previousDuration(99_000);
      listeners.get(events.PLAY_PROGRESS)?.({ currentPosition: 99_000, relativePosition: 0.5, loadProgress: 1 });
    });

    expect(usePlayerStore.getState()).toMatchObject({
      currentTrack: bookmarkTrack, currentTime: 0, duration: 200,
    });
  });

  it('ignores invalid duration, progress, and seek values', () => {
    const { events, listeners, widget } = createWidgetMock();
    const { result } = renderWidgetHook();
    usePlayerStore.setState({ currentTime: 7, duration: 180 });

    act(() => listeners.get(events.PLAY)?.());
    const durationLookup = vi.mocked(widget.getDuration).mock.calls[0][0];

    act(() => {
      durationLookup(-1);
      listeners.get(events.PLAY_PROGRESS)?.({ currentPosition: Number.NaN });
      result.current.seek(-1);
    });

    expect(usePlayerStore.getState()).toMatchObject({
      currentTime: 7,
      duration: 180,
    });
    expect(widget.seekTo).not.toHaveBeenCalled();
  });

  it('ignores callbacks retained by a replaced Widget instance', () => {
    const { events, listeners, widget } = createWidgetMock();
    const { result } = renderWidgetHook();
    act(() => listeners.get(events.PLAY)?.());
    const oldTrack = vi.mocked(widget.getCurrentSound).mock.calls[0][0];
    const oldDuration = vi.mocked(widget.getDuration).mock.calls[0][0];
    const oldProgress = listeners.get(events.PLAY_PROGRESS);

    createWidgetMock();
    act(() => result.current.iframeRef(document.createElement('iframe')));
    act(() => usePlayerStore.setState({ currentTrack: playlistTracks[1], currentTime: 7, duration: 210 }));
    act(() => {
      oldTrack({ id: 1, title: 'Old track' });
      oldDuration(99_000);
      oldProgress?.({ currentPosition: 99_000, relativePosition: 0.5, loadProgress: 1 });
    });
    expect(usePlayerStore.getState()).toMatchObject({
      currentTrack: playlistTracks[1], currentTime: 7, duration: 210,
    });
  });

  it.each(['select', 'previous', 'next', 'random', 'automatic'] as const)(
    'ignores earlier track and duration lookups after %s playback', (action) => {
      const { events, listeners, widget } = createWidgetMock();
      vi.mocked(widget.getSounds).mockImplementation((callback) => callback([
        { id: 1, title: 'First track' }, { id: 2, title: 'Second track' },
      ]));
      const { result } = renderWidgetHook();

      act(() => listeners.get(events.PLAY)?.());
      const oldTrack = vi.mocked(widget.getCurrentSound).mock.calls[0][0];
      const oldDuration = vi.mocked(widget.getDuration).mock.calls[0][0];

      act(() => {
        if (action === 'select') result.current.selectTrack(1);
        if (action === 'previous') result.current.previousTrack();
        if (action === 'next') result.current.nextTrack();
        if (action === 'random') result.current.playRandomTrack();
      });
      act(() => listeners.get(events.PLAY)?.());
      const latestTrack = vi.mocked(widget.getCurrentSound).mock.calls[1][0];
      const latestDuration = vi.mocked(widget.getDuration).mock.calls[1][0];
      act(() => {
        latestTrack({ id: 2, title: 'Second track', duration: 210_000 });
        latestDuration(210_000);
        listeners.get(events.PLAY_PROGRESS)?.({ currentPosition: 5_000, relativePosition: 0.02, loadProgress: 1 });
      });
      act(() => {
        oldTrack({ id: 1, title: 'First track' });
        oldDuration(180_000);
      });

      expect(usePlayerStore.getState()).toMatchObject({
        currentTrack: { id: 2, title: 'Second track' },
        isPlaying: true,
        currentTime: 5,
        duration: 210,
      });
      expect(result.current.widgetTrack?.id).toBe(2);
    });

  it('does not let READY or PLAY finish an ongoing source switch', () => {
    const { events, listeners, widget } = createWidgetMock();
    const { result } = renderWidgetHook();
    usePlayerStore.setState({ playbackMode: 'bookmark' });

    act(() => result.current.selectTrack(0));
    act(() => {
      listeners.get(events.READY)?.();
      listeners.get(events.PLAY)?.();
      result.current.selectTrack(1);
    });

    expect(widget.skip).not.toHaveBeenCalled();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    expect(widget.getCurrentSound).not.toHaveBeenCalled();
  });

  it('unlocks playback after an ERROR and retries the failed source', () => {
    const { events, listeners, widget } = createWidgetMock();
    const { result } = renderWidgetHook();
    usePlayerStore.setState({ playbackMode: 'bookmark' });

    act(() => result.current.selectTrack(0));
    const failedCallback = vi.mocked(widget.load).mock.calls[0][1]?.callback;
    act(() => listeners.get(events.ERROR)?.());

    expect(result.current.widgetError).toBeTruthy();
    act(() => result.current.retryLoad());
    expect(widget.load).toHaveBeenCalledTimes(2);

    act(() => failedCallback?.());
    expect(result.current.widgetError).toBeNull();
    act(() => result.current.selectTrack(1));
    expect(widget.skip).not.toHaveBeenCalled();
  });

  it('reports a saved track playback failure separately from its bookmark status', () => {
    const { events, listeners, widget } = createWidgetMock();
    const { result } = renderWidgetHook();

    act(() => result.current.playBookmarkTrack(bookmarkTrack));
    expect(widget.load).toHaveBeenCalledWith(
      bookmarkTrack.permalinkUrl,
      expect.objectContaining({ auto_play: true })
    );

    act(() => listeners.get(events.ERROR)?.());

    expect(result.current.playlistStatus).toBe('error');
    expect(result.current.widgetError).toBeTruthy();
    expect(usePlayerStore.getState()).toMatchObject({
      playbackMode: 'bookmark',
      currentTrack: bookmarkTrack,
      isPlaying: false,
    });

    act(() => result.current.retryLoad());
    expect(widget.load).toHaveBeenCalledTimes(2);
  });

  it('times out a missing load callback and ignores its late response', () => {
    vi.useFakeTimers();
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();
    usePlayerStore.setState({ playbackMode: 'bookmark' });

    act(() => result.current.selectTrack(0));
    const lateCallback = vi.mocked(widget.load).mock.calls[0][1]?.callback;
    act(() => vi.advanceTimersByTime(10_000));

    expect(result.current.widgetError).toBeTruthy();
    act(() => result.current.retryLoad());
    act(() => result.current.selectTrack(1));
    act(() => lateCallback?.());

    expect(widget.skip).not.toHaveBeenCalled();
    expect(widget.load).toHaveBeenCalledTimes(2);
  });

  it('moves from loading to ready when valid playlist tracks arrive', () => {
    const { events, listeners, widget } = createWidgetMock();
    vi.mocked(widget.getSounds).mockImplementation((callback) => callback([
      { id: 1, title: 'First track', permalink_url: playlistTracks[0].permalinkUrl ?? undefined },
    ]));
    const { result } = renderWidgetHook();

    expect(result.current.playlistStatus).toBe('loading');
    act(() => listeners.get(events.READY)?.());

    expect(result.current.playlistStatus).toBe('ready');
    expect(usePlayerStore.getState().tracks).toHaveLength(1);
  });

  it('treats a consistently empty playlist as empty rather than error', () => {
    vi.useFakeTimers();
    const { events, listeners, widget } = createWidgetMock();
    vi.mocked(widget.getSounds).mockImplementation((callback) => callback([]));
    const { result } = renderWidgetHook();

    act(() => listeners.get(events.READY)?.());
    expect(result.current.playlistStatus).toBe('loading');
    act(() => vi.advanceTimersByTime(3_000));

    expect(result.current.playlistStatus).toBe('empty');
    expect(result.current.widgetError).toBeNull();
    expect(usePlayerStore.getState().tracks).toEqual([]);
  });

  it('does not let an old empty lookup replace an ERROR state', () => {
    vi.useFakeTimers();
    const { events, listeners, widget } = createWidgetMock();
    let pendingSounds: Parameters<SoundCloudWidgetInstance['getSounds']>[0] | undefined;
    vi.mocked(widget.getSounds).mockImplementation((callback) => {
      pendingSounds = callback;
    });
    const { result } = renderWidgetHook();

    act(() => listeners.get(events.READY)?.());
    act(() => listeners.get(events.ERROR)?.());
    expect(result.current.playlistStatus).toBe('error');

    act(() => pendingSounds?.([]));
    act(() => vi.advanceTimersByTime(3_000));

    expect(result.current.playlistStatus).toBe('error');
    expect(result.current.widgetError).toBeTruthy();
  });

  it('reports an error if READY fires but the playlist lookup never responds', () => {
    vi.useFakeTimers();
    const { events, listeners } = createWidgetMock();
    const { result } = renderWidgetHook();

    act(() => listeners.get(events.READY)?.());
    expect(result.current.playlistStatus).toBe('loading');
    act(() => vi.advanceTimersByTime(10_000));

    expect(result.current.playlistStatus).toBe('error');
    expect(result.current.widgetError).toBeTruthy();
  });

  it('currently classifies repeated empty responses after retry as empty', () => {
    vi.useFakeTimers();
    const { events, listeners, widget } = createWidgetMock();
    const { result } = renderWidgetHook();

    act(() => listeners.get(events.ERROR)?.());
    expect(result.current.playlistStatus).toBe('error');

    vi.mocked(widget.getSounds).mockImplementation((callback) => callback([]));
    act(() => result.current.retryLoad());
    act(() => listeners.get(events.READY)?.());
    act(() => vi.advanceTimersByTime(3_000));

    expect(result.current.playlistStatus).toBe('empty');
    expect(result.current.widgetError).toBeNull();
  });

  it('clears the previous playlist track and playback time when the playlist is confirmed empty', () => {
    vi.useFakeTimers();
    const { events, listeners, widget } = createWidgetMock();
    vi.mocked(widget.getSounds).mockImplementation((callback) => callback([]));
    usePlayerStore.setState({
      currentTrack: playlistTracks[0],
      isPlaying: true,
      currentTime: 42,
      duration: 180,
    });
    const { result } = renderWidgetHook();

    act(() => listeners.get(events.READY)?.());
    act(() => vi.advanceTimersByTime(3_000));

    expect(result.current.playlistStatus).toBe('empty');
    expect(usePlayerStore.getState()).toMatchObject({
      tracks: [],
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    });
  });

  it('keeps the bookmarked track when an empty playlist is detected in bookmark mode', () => {
    const { events, listeners } = createWidgetMock();
    usePlayerStore.setState({
      tracks: [],
      playbackMode: 'bookmark',
      currentTrack: bookmarkTrack,
      isPlaying: true,
      currentTime: 42,
      duration: 200,
    });
    const { result } = renderWidgetHook();

    act(() => listeners.get(events.READY)?.());

    expect(result.current.playlistStatus).toBe('empty');
    expect(usePlayerStore.getState()).toMatchObject({
      playbackMode: 'bookmark',
      currentTrack: bookmarkTrack,
      isPlaying: true,
      currentTime: 42,
      duration: 200,
    });
  });

  it('reports invalid playlist data as error and recovers on retry', () => {
    vi.useFakeTimers();
    const { events, listeners, widget } = createWidgetMock();
    vi.mocked(widget.getSounds).mockImplementation((callback) => callback([
      { title: 'Missing ID' },
    ]));
    const { result } = renderWidgetHook();

    act(() => listeners.get(events.READY)?.());
    act(() => vi.advanceTimersByTime(3_000));
    expect(result.current.playlistStatus).toBe('error');

    vi.mocked(widget.getSounds).mockImplementation((callback) => callback([
      { id: 2, title: 'Recovered track', permalink_url: playlistTracks[1].permalinkUrl ?? undefined },
    ]));
    act(() => result.current.retryLoad());
    expect(result.current.playlistStatus).toBe('loading');
    act(() => listeners.get(events.READY)?.());

    expect(result.current.playlistStatus).toBe('ready');
    expect(result.current.widgetError).toBeNull();
  });

  it('reports a non-array playlist response as an error after retrying', () => {
    vi.useFakeTimers();
    const { events, listeners, widget } = createWidgetMock();
    vi.mocked(widget.getSounds).mockImplementation((callback) => callback({}));
    const { result } = renderWidgetHook();

    act(() => listeners.get(events.READY)?.());
    act(() => vi.advanceTimersByTime(3_000));

    expect(result.current.playlistStatus).toBe('error');
    expect(result.current.widgetError).toBeTruthy();
  });

  it('does not let a stale playlist retry replace an error state', () => {
    vi.useFakeTimers();
    const { events, listeners, widget } = createWidgetMock();
    vi.mocked(widget.getSounds).mockImplementation((callback) => callback({}));
    const { result } = renderWidgetHook();

    act(() => listeners.get(events.READY)?.());
    act(() => listeners.get(events.ERROR)?.());
    act(() => vi.advanceTimersByTime(250));

    expect(result.current.playlistStatus).toBe('error');
    expect(result.current.widgetError).toBeTruthy();
    expect(widget.getSounds).toHaveBeenCalledTimes(1);
  });
});
