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

const secondBookmarkTrack: PlayerTrack = {
  ...bookmarkTrack,
  id: 'bookmark-2',
  title: 'Second saved track',
  permalinkUrl: 'https://soundcloud.com/example/second-saved-track',
};

const thirdBookmarkTrack: PlayerTrack = {
  ...bookmarkTrack,
  id: 'bookmark-3',
  title: 'Third saved track',
  permalinkUrl: 'https://soundcloud.com/example/third-saved-track',
};

const toWidgetSound = (track: PlayerTrack) => ({
  id: track.id,
  title: track.title,
  user: { username: track.artist },
  artwork_url: track.artworkUrl,
  permalink_url: track.permalinkUrl,
  duration: track.durationMs,
  genre: track.genre,
  tag_list: track.tags.join(' '),
  policy: 'ALLOW',
  playable: true,
});

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
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isMuted: false,
      isPlaybackLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    delete window.SC;
    vi.restoreAllMocks();
  });

  describe('PR-05 loading interruption and event lifetime', () => {
    function startLoad(mode: 'playlist' | 'single') {
      const mock = createWidgetMock();
      const hook = renderWidgetHook();
      const track = mode === 'single' ? bookmarkTrack : playlistTracks[1];
      vi.mocked(mock.widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(track)));
      if (mode === 'single') {
        act(() => hook.result.current.playSingleTrack(track));
      } else {
        usePlayerStore.setState({ playbackMode: 'single' });
        act(() => hook.result.current.selectTrack(1));
      }
      return { ...mock, ...hook, track };
    }

    it.each(['playlist', 'single'] as const)(
      '%s: public pause keeps the load but prevents playback when it completes', mode => {
        vi.useFakeTimers();
        const { widget, result, track } = startLoad(mode);
        expect(usePlayerStore.getState().isPlaybackLoading).toBe(true);
        expect(result.current.isPlaybackLoading).toBe(true);
        act(() => result.current.pause());
        expect(usePlayerStore.getState().isPlaybackLoading).toBe(true);
        expect(widget.pause).toHaveBeenCalledOnce();
        expect(widget.load).toHaveBeenCalledTimes(1);
        act(() => vi.mocked(widget.load).mock.calls[0][1]?.callback?.());
        expect(usePlayerStore.getState().isPlaybackLoading).toBe(false);
        expect(result.current.isPlaybackLoading).toBe(false);
        expect(widget.getCurrentSound).toHaveBeenCalledOnce();
        expect(usePlayerStore.getState()).toMatchObject({
          currentTrack: { id: track.id }, isPlaying: false, duration: track.durationMs / 1000,
        });
        expect(usePlayerStore.getState().tracks).toEqual(playlistTracks);
        act(() => vi.advanceTimersByTime(10_000));
        expect(result.current.widgetError).toBeNull();
        expect(widget.pause).toHaveBeenCalledOnce();
        expect(widget.play).not.toHaveBeenCalled();
        // The loaded source remains available for an explicit user resume.
        act(() => result.current.play());
        expect(widget.play).toHaveBeenCalledOnce();
        expect(widget.load).toHaveBeenCalledTimes(1);
      }
    );

    it.each(['playlist', 'single'] as const)(
      '%s: pause during the sound lookup also prevents its delayed playback', mode => {
        vi.useFakeTimers();
        const { widget, result, track } = startLoad(mode);
        vi.mocked(widget.getCurrentSound).mockReset();
        act(() => vi.mocked(widget.load).mock.calls[0][1]?.callback?.());
        const reply = vi.mocked(widget.getCurrentSound).mock.calls[0][0];
        act(() => result.current.pause());
        act(() => reply(toWidgetSound(track)));
        expect(usePlayerStore.getState()).toMatchObject({ currentTrack: { id: track.id }, isPlaying: false });
        expect(result.current.playlistStatus).not.toBe('loading');
        act(() => vi.advanceTimersByTime(10_000));
        expect(result.current.widgetError).toBeNull();
        expect(widget.pause).toHaveBeenCalledOnce();
        expect(widget.play).not.toHaveBeenCalled();
      }
    );

    it.each(['playlist', 'single'] as const)(
      '%s: a new selection after pause is allowed to play and the old load stays invalid', mode => {
        const { widget, result } = startLoad(mode);
        act(() => result.current.pause());
        const oldLoaded = vi.mocked(widget.load).mock.calls[0][1]?.callback;
        const onResolved = vi.fn();
        act(() => result.current.playSingleTrack(secondBookmarkTrack, { onResolved }));
        act(() => oldLoaded?.());
        expect(widget.getCurrentSound).not.toHaveBeenCalled();
        expect(widget.play).not.toHaveBeenCalled();
        vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(secondBookmarkTrack)));
        act(() => vi.mocked(widget.load).mock.calls[1][1]?.callback?.());
        expect(widget.play).toHaveBeenCalledOnce();
        expect(onResolved).toHaveBeenCalledOnce();
        expect(usePlayerStore.getState().currentTrack?.id).toBe(secondBookmarkTrack.id);
      }
    );

    it.each(['playlist', 'single'] as const)(
      '%s: an old callback cannot unlock the current loading state', mode => {
        const { widget, result } = startLoad(mode);
        const oldLoaded = vi.mocked(widget.load).mock.calls[0][1]?.callback;
        act(() => result.current.playSingleTrack(secondBookmarkTrack));
        act(() => oldLoaded?.());
        expect(usePlayerStore.getState().isPlaybackLoading).toBe(true);
        expect(result.current.isPlaybackLoading).toBe(true);
        expect(widget.play).not.toHaveBeenCalled();
        vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(secondBookmarkTrack)));
        act(() => vi.mocked(widget.load).mock.calls[1][1]?.callback?.());
        expect(usePlayerStore.getState().isPlaybackLoading).toBe(false);
        expect(result.current.isPlaybackLoading).toBe(false);
      }
    );

    it.each([
      { mode: 'playlist' as const, failure: 'error' },
      { mode: 'single' as const, failure: 'error' },
      { mode: 'playlist' as const, failure: 'timeout' },
      { mode: 'single' as const, failure: 'timeout' },
    ])('$mode: $failure unlocks the loading state without starting playback', ({ mode, failure }) => {
      vi.useFakeTimers();
      const { widget, events, listeners, result } = startLoad(mode);
      expect(result.current.isPlaybackLoading).toBe(true);
      act(() => {
        if (failure === 'error') listeners.get(events.ERROR)?.();
        else vi.advanceTimersByTime(10_000);
      });
      expect(usePlayerStore.getState().isPlaybackLoading).toBe(false);
      expect(result.current.isPlaybackLoading).toBe(false);
      expect(widget.play).not.toHaveBeenCalled();
      expect(widget.pause).toHaveBeenCalledOnce();
    });

    it('does not auto-play when onResolved pauses the current single request', () => {
      const { widget, result } = startLoad('single');
      const onResolved = vi.fn(() => result.current.pause());
      act(() => result.current.playSingleTrack(secondBookmarkTrack, { onResolved }));
      vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(secondBookmarkTrack)));
      act(() => vi.mocked(widget.load).mock.calls[1][1]?.callback?.());
      expect(onResolved).toHaveBeenCalledOnce();
      expect(widget.pause).toHaveBeenCalledOnce();
      expect(widget.play).not.toHaveBeenCalled();
      expect(result.current.playlistStatus).not.toBe('loading');
      expect(usePlayerStore.getState()).toMatchObject({
        currentTrack: { id: secondBookmarkTrack.id }, isPlaying: false,
      });
    });

    it('rechecks request validity if onResolved selects a newer track before play', () => {
      const { widget } = createWidgetMock();
      const { result } = renderWidgetHook();
      const onResolved = vi.fn(() => result.current.playSingleTrack(secondBookmarkTrack));
      act(() => result.current.playSingleTrack(bookmarkTrack, { onResolved }));
      vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(bookmarkTrack)));
      act(() => vi.mocked(widget.load).mock.calls[0][1]?.callback?.());
      expect(onResolved).toHaveBeenCalledOnce();
      expect(widget.load).toHaveBeenCalledTimes(2);
      expect(widget.play).not.toHaveBeenCalled();
      expect(usePlayerStore.getState().currentTrack?.id).toBe(secondBookmarkTrack.id);
      vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(secondBookmarkTrack)));
      act(() => vi.mocked(widget.load).mock.calls[1][1]?.callback?.());
      expect(widget.play).toHaveBeenCalledOnce();
    });

    it.each(['playlist', 'single'] as const)(
      '%s: toggle is blocked during loading while a different track can still be selected', mode => {
        const { widget, result } = startLoad(mode);
        act(() => result.current.toggle());
        expect(widget.toggle).not.toHaveBeenCalled();
        act(() => result.current.playSingleTrack(secondBookmarkTrack));
        expect(widget.load).toHaveBeenCalledTimes(2);
        expect(usePlayerStore.getState().currentTrack?.id).toBe(secondBookmarkTrack.id);
        vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(secondBookmarkTrack)));
        act(() => vi.mocked(widget.load).mock.calls[1][1]?.callback?.());
        act(() => result.current.toggle());
        expect(widget.toggle).toHaveBeenCalledOnce();
      }
    );

    it('ignores FINISH from the previous source while a single track is loading', () => {
      const { widget, result, events, listeners, track } = startLoad('single');
      const beforeFinish = usePlayerStore.getState();
      act(() => listeners.get(events.FINISH)?.());
      expect(widget.seekTo).not.toHaveBeenCalled();
      expect(usePlayerStore.getState()).toBe(beforeFinish);
      act(() => vi.mocked(widget.load).mock.calls[0][1]?.callback?.());
      expect(widget.play).toHaveBeenCalledOnce();
      expect(usePlayerStore.getState().currentTrack?.id).toBe(track.id);
      expect(result.current.widgetError).toBeNull();
    });

    it.each(['error', 'timeout', 'blocked'] as const)(
      'ignores FINISH after a single request is handled as %s', outcome => {
        vi.useFakeTimers();
        const { widget, events, listeners, track } = startLoad('single');
        act(() => {
          if (outcome === 'error') listeners.get(events.ERROR)?.();
          else if (outcome === 'timeout') vi.advanceTimersByTime(10_000);
          else {
            vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply({
              ...toWidgetSound(track), policy: 'BLOCK',
            }));
            vi.mocked(widget.load).mock.calls[0][1]?.callback?.();
          }
        });
        const currentState = usePlayerStore.getState();
        act(() => listeners.get(events.FINISH)?.());
        expect(widget.seekTo).not.toHaveBeenCalled();
        expect(widget.play).not.toHaveBeenCalled();
        expect(usePlayerStore.getState()).toBe(currentState);
      }
    );

    it('does not manually seek or advance a playlist when FINISH arrives', () => {
      const { widget, events, listeners } = createWidgetMock();
      renderWidgetHook();
      usePlayerStore.setState({ playbackMode: 'playlist', isPlaying: true, currentTime: 45 });
      const currentState = usePlayerStore.getState();
      act(() => listeners.get(events.FINISH)?.());
      expect(widget.seekTo).not.toHaveBeenCalled();
      expect(widget.next).not.toHaveBeenCalled();
      expect(widget.skip).not.toHaveBeenCalled();
      expect(widget.load).not.toHaveBeenCalled();
      expect(usePlayerStore.getState()).toBe(currentState);
    });

    it('ignores a retained FINISH listener after its Widget is replaced', () => {
      const old = createWidgetMock();
      const { result } = renderWidgetHook();
      const oldFinish = old.listeners.get(old.events.FINISH);
      expect(oldFinish).toBeTypeOf('function');
      createWidgetMock();
      act(() => result.current.iframeRef(document.createElement('iframe')));
      usePlayerStore.setState({ playbackMode: 'single', currentTrack: bookmarkTrack, currentTime: 45, isPlaying: true });
      const currentState = usePlayerStore.getState();
      act(() => oldFinish?.());
      expect(old.widget.seekTo).not.toHaveBeenCalled();
      expect(usePlayerStore.getState()).toBe(currentState);
    });
  });

  it.each(['playlist', 'single'] as const)(
    '%s 모드에서 일시정지 후 재개해도 같은 곡의 재생 위치를 유지한다',
    (mode) => {
      const { widget, events, listeners } = createWidgetMock();
      const track = mode === 'playlist' ? playlistTracks[0] : bookmarkTrack;
      vi.mocked(widget.getSounds).mockImplementation(reply => reply(playlistTracks.map(toWidgetSound)));
      vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(track)));
      vi.mocked(widget.getDuration).mockImplementation(reply => reply(track.durationMs));
      const { result } = renderWidgetHook();
      act(() => listeners.get(events.READY)?.());

      if (mode === 'single') {
        act(() => result.current.playSingleTrack(track));
        act(() => vi.mocked(widget.load).mock.calls[0][1]?.callback?.());
      } else {
        act(() => result.current.play());
      }
      act(() => {
        listeners.get(events.PLAY)?.();
        listeners.get(events.PLAY_PROGRESS)?.({ currentPosition: 45_000 });
      });
      expect(usePlayerStore.getState()).toMatchObject({
        playbackMode: mode, currentTrack: { id: track.id }, isPlaying: true, currentTime: 45,
      });
      const loadCount = vi.mocked(widget.load).mock.calls.length;
      const playCount = vi.mocked(widget.play).mock.calls.length;

      act(() => result.current.pause());
      expect(widget.pause).toHaveBeenCalledOnce();
      act(() => listeners.get(events.PAUSE)?.());
      expect(usePlayerStore.getState()).toMatchObject({
        currentTrack: { id: track.id }, isPlaying: false, currentTime: 45,
        duration: track.durationMs / 1000,
      });

      act(() => result.current.play());
      expect(widget.play).toHaveBeenCalledTimes(playCount + 1);
      act(() => listeners.get(events.PLAY)?.());
      expect(usePlayerStore.getState()).toMatchObject({
        playbackMode: mode, currentTrack: { id: track.id }, isPlaying: true,
        currentTime: 45, duration: track.durationMs / 1000,
      });
      act(() => listeners.get(events.PLAY_PROGRESS)?.({ currentPosition: 46_000 }));
      expect(usePlayerStore.getState().currentTime).toBe(46);
      expect(widget.load).toHaveBeenCalledTimes(loadCount);
      expect(widget.skip).not.toHaveBeenCalled();
      expect(widget.seekTo).not.toHaveBeenCalled();
    }
  );

  it('keeps a new single request valid after playlist load and skip while ignoring the earlier same-track callback', () => {
    const { widget, events, listeners } = createWidgetMock();
    const { result } = renderWidgetHook();
    const firstResolved = vi.fn();
    const latestResolved = vi.fn();
    const latestFailure = vi.fn();
    vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(bookmarkTrack)));

    act(() => result.current.playSingleTrack(bookmarkTrack, { onResolved: firstResolved }));
    const firstLoaded = vi.mocked(widget.load).mock.calls[0][1]?.callback;
    act(() => firstLoaded?.());
    expect(firstResolved).toHaveBeenCalledOnce();

    act(() => result.current.selectTrack(0));
    vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(playlistTracks[0])));
    act(() => vi.mocked(widget.load).mock.calls[1][1]?.callback?.());
    act(() => result.current.selectTrack(1));
    expect(widget.skip).toHaveBeenLastCalledWith(1);
    vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(playlistTracks[1])));
    act(() => listeners.get(events.PLAY)?.());
    expect(usePlayerStore.getState().currentTrack?.id).toBe(playlistTracks[1].id);

    act(() => result.current.playSingleTrack(bookmarkTrack, {
      onResolved: latestResolved,
      onFailure: latestFailure,
    }));
    const latestLoaded = vi.mocked(widget.load).mock.calls[2][1]?.callback;
    const lookupCount = vi.mocked(widget.getCurrentSound).mock.calls.length;
    const playCount = vi.mocked(widget.play).mock.calls.length;

    act(() => firstLoaded?.());
    expect(widget.getCurrentSound).toHaveBeenCalledTimes(lookupCount);
    expect(widget.play).toHaveBeenCalledTimes(playCount);
    expect(firstResolved).toHaveBeenCalledOnce();
    expect(latestResolved).not.toHaveBeenCalled();

    vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(bookmarkTrack)));
    act(() => latestLoaded?.());
    expect(latestResolved).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: bookmarkTrack.id }));
    expect(latestFailure).not.toHaveBeenCalled();
    expect(widget.play).toHaveBeenCalledTimes(playCount + 1);
    expect(usePlayerStore.getState()).toMatchObject({
      playbackMode: 'single', currentTrack: { id: bookmarkTrack.id }, isPlaying: false,
    });
    act(() => listeners.get(events.PLAY)?.());
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it('loads a saved track and changes to single playback mode', () => {
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();

    act(() => {
      result.current.playSingleTrack(bookmarkTrack);
    });

    expect(widget.load).toHaveBeenCalledWith(
      bookmarkTrack.permalinkUrl,
      expect.objectContaining({ auto_play: false })
    );
    expect(usePlayerStore.getState()).toMatchObject({
      playbackMode: 'single',
      currentTrack: bookmarkTrack,
      isPlaying: false,
      currentTime: 0,
      duration: bookmarkTrack.durationMs / 1000,
    });
  });

  it.each([
    {
      label: 'BLOCK policy',
      soundStatus: { policy: 'BLOCK', playable: true },
    },
    {
      label: 'playable false',
      soundStatus: { policy: 'ALLOW', playable: false },
    },
  ])(
    'stops the playlist and does not play when a bookmark resolves as blocked by $label',
    ({ soundStatus }) => {
      const { widget } = createWidgetMock();
      const { result } = renderWidgetHook();
      const onResolved = vi.fn();
      const onFailure = vi.fn();
      usePlayerStore.setState({ isPlaying: true });

      act(() => {
        result.current.playSingleTrack(bookmarkTrack, {
          onResolved,
          onFailure,
        });
      });

      expect(usePlayerStore.getState()).toMatchObject({
        playbackMode: 'single',
        currentTrack: bookmarkTrack,
        isPlaying: false,
      });

      vi.mocked(widget.getCurrentSound).mockImplementation((callback) => {
        callback({ ...toWidgetSound(bookmarkTrack), ...soundStatus });
      });
      act(() => vi.mocked(widget.load).mock.calls[0][1]?.callback?.());

      expect(onResolved).toHaveBeenCalledOnce();
      expect(onResolved).toHaveBeenCalledWith(
        expect.objectContaining({
          id: bookmarkTrack.id,
          playbackStatus: 'blocked',
        })
      );
      expect(onFailure).not.toHaveBeenCalled();
      expect(widget.pause).toHaveBeenCalledOnce();
      expect(widget.play).not.toHaveBeenCalled();
      expect(usePlayerStore.getState()).toMatchObject({
        playbackMode: 'single',
        isPlaying: false,
        currentTrack: expect.objectContaining({ playbackStatus: 'blocked' }),
      });
    }
  );

  it.each([
    {
      label: 'allowed',
      soundStatus: { policy: 'ALLOW', playable: true },
      expectedStatus: 'allowed',
    },
    {
      label: 'preview',
      soundStatus: { policy: 'SNIP', playable: true },
      expectedStatus: 'preview',
    },
    {
      label: 'unknown',
      soundStatus: { policy: undefined, playable: undefined },
      expectedStatus: 'unknown',
    },
  ])(
    'plays a bookmark after it resolves as $label',
    ({ soundStatus, expectedStatus }) => {
      const { widget } = createWidgetMock();
      const { result } = renderWidgetHook();
      const onResolved = vi.fn();

      act(() => {
        result.current.playSingleTrack(bookmarkTrack, { onResolved });
      });
      expect(widget.play).not.toHaveBeenCalled();

      vi.mocked(widget.getCurrentSound).mockImplementation((callback) => {
        callback({ ...toWidgetSound(bookmarkTrack), ...soundStatus });
      });
      act(() => vi.mocked(widget.load).mock.calls[0][1]?.callback?.());

      expect(onResolved).toHaveBeenCalledWith(
        expect.objectContaining({ playbackStatus: expectedStatus })
      );
      expect(widget.pause).not.toHaveBeenCalled();
      expect(widget.play).toHaveBeenCalledOnce();
    }
  );

  it('stops a saved track instead of continuing when it finishes', () => {
    const { events, listeners, widget } = createWidgetMock();
    renderWidgetHook();

    usePlayerStore.setState({
      playbackMode: 'single',
      isPlaying: true,
      currentTime: 120,
    });

    act(() => {
      listeners.get(events.FINISH)?.();
    });

    expect(widget.seekTo).toHaveBeenCalledWith(0);
    expect(usePlayerStore.getState()).toMatchObject({
      playbackMode: 'single',
      isPlaying: false,
      currentTime: 0,
    });
  });

  it('loads the playlist at the selected track when leaving single mode', () => {
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();

    usePlayerStore.setState({ playbackMode: 'single' });

    act(() => {
      result.current.selectTrack(1);
    });

    expect(widget.load).toHaveBeenCalledWith(
      PLAYLIST_URL,
      expect.objectContaining({
        auto_play: false,
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

  it('다음 곡을 선택해도 위젯에서 재생을 확인한 뒤에 현재 곡을 바꾼다', () => {
    const { widget, events, listeners } = createWidgetMock();
    const { result } = renderWidgetHook();
    const firstTrack = playlistTracks[0];
    const secondTrack = playlistTracks[1];

    // 1. 사용자가 두 번째 곡을 클릭한다.
    act(() => result.current.selectTrack(1));

    // 위젯에 B를 요청했지만, 화면의 현재 곡은 아직 A다.
    expect(widget.skip).toHaveBeenCalledWith(1);
    expect(usePlayerStore.getState().currentTrack?.id).toBe(firstTrack.id);

    // 2. 위젯에 현재 곡을 물으면 B라고 답하도록 준비한다.
    vi.mocked(widget.getCurrentSound).mockImplementation((reply) => {
      reply({ id: secondTrack.id, title: secondTrack.title });
    });

    // 3. 위젯에서 재생 시작 신호가 들어온다.
    act(() => listeners.get(events.PLAY)?.());

    expect(usePlayerStore.getState().currentTrack?.id).toBe(secondTrack.id);
  });

  it('새 곡을 확인할 때까지 일시정지된 곡의 재생 표시와 시간을 유지한다', () => {
    const { widget, events, listeners } = createWidgetMock();
    const { result } = renderWidgetHook();
    const [first, second] = playlistTracks;
    usePlayerStore.setState({ currentTime: 12, duration: first.durationMs / 1000 });
    act(() => result.current.selectTrack(1));

    vi.mocked(widget.getCurrentSound)
      .mockImplementationOnce(reply => reply({ id: first.id, title: first.title }))
      .mockImplementationOnce(reply => reply({ id: second.id, title: second.title, duration: second.durationMs }));
    vi.mocked(widget.getDuration).mockImplementation(reply => reply(second.durationMs));

    act(() => {
      listeners.get(events.PLAY)?.();
      listeners.get(events.PLAY_PROGRESS)?.({ currentPosition: 13_000 });
    });
    expect.soft(usePlayerStore.getState()).toMatchObject({
      currentTrack: { id: first.id }, isPlaying: false, currentTime: 12, duration: first.durationMs / 1000,
    });

    act(() => listeners.get(events.PLAY)?.());
    expect(usePlayerStore.getState()).toMatchObject({
      currentTrack: { id: second.id }, isPlaying: true, currentTime: 0, duration: second.durationMs / 1000,
    });
  });

  it('빠르게 다음을 두 번 누르면 마지막 요청 곡을 확인하고 이전 응답은 무시한다', () => {
    const { widget, events, listeners } = createWidgetMock();
    const { result } = renderWidgetHook();
    const third = { ...playlistTracks[1], id: 3, title: 'Third track' };
    usePlayerStore.setState({ tracks: [...playlistTracks, third] });

    act(() => result.current.nextTrack());
    act(() => listeners.get(events.PLAY)?.());
    const replyForSecond = vi.mocked(widget.getCurrentSound).mock.calls[0][0];
    act(() => result.current.nextTrack());
    expect(vi.mocked(widget.skip).mock.calls).toEqual([[1], [2]]);
    act(() => replyForSecond({ id: 2, title: 'Second track', duration: 210_000 }));
    expect(usePlayerStore.getState()).toMatchObject({
      currentTrack: { id: 1 }, isPlaying: false,
    });

    act(() => listeners.get(events.PLAY)?.());
    act(() => vi.mocked(widget.getCurrentSound).mock.calls[1][0]({
      id: third.id, title: third.title, duration: third.durationMs,
    }));
    expect(usePlayerStore.getState()).toMatchObject({
      currentTrack: { id: 3 }, isPlaying: true, currentTime: 0, duration: 210,
    });
  });

  it('곡 조회 도중 일시정지하면 늦은 응답으로 재생 표시가 켜지지 않는다', () => {
    const { widget, events, listeners } = createWidgetMock();
    const { result } = renderWidgetHook();
    act(() => result.current.selectTrack(1));
    act(() => listeners.get(events.PLAY)?.());
    const reply = vi.mocked(widget.getCurrentSound).mock.calls[0][0];
    act(() => listeners.get(events.PAUSE)?.());
    act(() => reply({ id: 2, title: 'Second track', duration: 210_000 }));
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  describe('request ownership regression boundaries', () => {
    it.each(['play', 'toggle'] as const)(
      'accepts explicit %s after pause while skip confirmation is still pending',
      (command) => {
        const { widget, events, listeners } = createWidgetMock();
        const { result } = renderWidgetHook();
        act(() => result.current.selectTrack(1));
        act(() => listeners.get(events.PLAY)?.());
        const oldReply = vi.mocked(widget.getCurrentSound).mock.calls[0][0];
        act(() => result.current.pause());
        act(() => listeners.get(events.PAUSE)?.());
        act(() => result.current[command]());
        act(() => listeners.get(events.PLAY)?.());
        const replies = vi.mocked(widget.getCurrentSound).mock.calls;
        const resumedReply = replies[replies.length - 1][0];

        act(() => oldReply(toWidgetSound(playlistTracks[1])));
        expect(usePlayerStore.getState().isPlaying).toBe(false);
        act(() => resumedReply(toWidgetSound(playlistTracks[1])));
        expect(usePlayerStore.getState()).toMatchObject({
          currentTrack: { id: playlistTracks[1].id }, isPlaying: true,
        });
        expect(widget.load).not.toHaveBeenCalled();
        expect(widget.seekTo).not.toHaveBeenCalled();
        expect(widget[command]).toHaveBeenCalledOnce();
      }
    );

    it('does not turn playback on from a pending skip lookup after public pause but before the PAUSE event', () => {
      const { widget, events, listeners } = createWidgetMock();
      const { result } = renderWidgetHook();
      act(() => result.current.selectTrack(1));
      act(() => listeners.get(events.PLAY)?.());
      const pendingReply = vi.mocked(widget.getCurrentSound).mock.calls[0][0];

      act(() => result.current.pause());
      expect(widget.pause).toHaveBeenCalledOnce();
      act(() => pendingReply(toWidgetSound(playlistTracks[1])));
      expect(usePlayerStore.getState().isPlaying).toBe(false);
      expect(widget.play).not.toHaveBeenCalled();

      act(() => listeners.get(events.PAUSE)?.());
      expect(usePlayerStore.getState().isPlaying).toBe(false);
      vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(playlistTracks[1])));
      act(() => result.current.play());
      act(() => listeners.get(events.PLAY)?.());
      expect(usePlayerStore.getState().isPlaying).toBe(true);
      expect(widget.load).not.toHaveBeenCalled();
    });

    it('confirms only the final skip in A → B → A, even when the first A lookup arrives last', () => {
      vi.useFakeTimers();
      const { widget, events, listeners } = createWidgetMock();
      const { result } = renderWidgetHook();
      vi.mocked(widget.getSounds).mockImplementation(reply => reply(playlistTracks.map(toWidgetSound)));
      act(() => listeners.get(events.READY)?.());
      vi.mocked(widget.getCurrentSound).mockClear();
      for (const index of [0, 1, 0]) {
        act(() => result.current.selectTrack(index));
        act(() => listeners.get(events.PLAY)?.());
      }
      const replies = vi.mocked(widget.getCurrentSound).mock.calls.map(([reply]) => reply);
      expect(vi.mocked(widget.skip).mock.calls).toEqual([[0], [1], [0]]);
      act(() => replies[2](toWidgetSound(playlistTracks[0])));
      act(() => listeners.get(events.PLAY_PROGRESS)?.({ currentPosition: 5000 }));
      const confirmed = usePlayerStore.getState();
      act(() => {
        replies[1](toWidgetSound(playlistTracks[1]));
        replies[0](toWidgetSound(playlistTracks[0]));
        vi.advanceTimersByTime(10_000);
      });
      expect(usePlayerStore.getState()).toBe(confirmed);
      expect(confirmed).toMatchObject({ currentTrack: { id: 1 }, isPlaying: true, currentTime: 5 });
      expect(widget.pause).not.toHaveBeenCalled();
      expect(widget.load).not.toHaveBeenCalled();
    });

    it('accepts a natural next track after skip confirmation and rejects the previous PLAY lookup', () => {
      const { widget, events, listeners } = createWidgetMock();
      const { result } = renderWidgetHook();
      act(() => result.current.selectTrack(0));
      act(() => listeners.get(events.PLAY)?.());
      act(() => vi.mocked(widget.getCurrentSound).mock.calls[0][0](toWidgetSound(playlistTracks[0])));
      // A later PLAY of A starts a lookup that outlives the natural transition to B.
      act(() => listeners.get(events.PLAY)?.());
      const oldReply = vi.mocked(widget.getCurrentSound).mock.calls[1][0];
      act(() => {
        listeners.get(events.FINISH)?.();
        listeners.get(events.PLAY)?.();
      });
      act(() => vi.mocked(widget.getCurrentSound).mock.calls[2][0](toWidgetSound(playlistTracks[1])));
      const confirmed = usePlayerStore.getState();
      act(() => oldReply(toWidgetSound(playlistTracks[0])));
      expect(usePlayerStore.getState()).toBe(confirmed);
      expect(confirmed).toMatchObject({ currentTrack: { id: 2 }, isPlaying: true });
      expect(result.current.widgetTrack?.id).toBe(2);
      expect(widget.skip).toHaveBeenCalledExactlyOnceWith(0);
      expect(widget.next).not.toHaveBeenCalled();
      expect(widget.load).not.toHaveBeenCalled();
    });

    it('ignores the first PLAY sound and duration replies after PAUSE and a newer PLAY', () => {
      const { widget, events, listeners } = createWidgetMock();
      renderWidgetHook();
      act(() => listeners.get(events.PLAY)?.());
      const oldSound = vi.mocked(widget.getCurrentSound).mock.calls[0][0];
      const oldDuration = vi.mocked(widget.getDuration).mock.calls[0][0];
      act(() => listeners.get(events.PAUSE)?.());
      act(() => listeners.get(events.PLAY)?.());
      act(() => {
        vi.mocked(widget.getCurrentSound).mock.calls[1][0](toWidgetSound(playlistTracks[1]));
        vi.mocked(widget.getDuration).mock.calls[1][0](210_000);
      });
      const confirmed = usePlayerStore.getState();
      act(() => {
        oldSound(toWidgetSound(playlistTracks[0]));
        oldDuration(180_000);
      });
      expect(usePlayerStore.getState()).toBe(confirmed);
      expect(confirmed).toMatchObject({ currentTrack: { id: 2 }, duration: 210, isPlaying: true });
    });

    it('clears an unconfirmed skip on iframe replacement so next uses the confirmed track', () => {
      vi.useFakeTimers();
      const old = createWidgetMock();
      const { result } = renderWidgetHook();
      const third = { ...playlistTracks[1], id: 3 };
      usePlayerStore.setState({ tracks: [...playlistTracks, third] });
      act(() => result.current.nextTrack());
      act(() => old.listeners.get(old.events.PLAY)?.());
      const oldReply = vi.mocked(old.widget.getCurrentSound).mock.calls[0][0];
      const replacement = createWidgetMock();
      act(() => result.current.iframeRef(document.createElement('iframe')));
      act(() => result.current.nextTrack());
      expect(replacement.widget.skip).toHaveBeenCalledExactlyOnceWith(1);
      act(() => oldReply(toWidgetSound(playlistTracks[1])));
      expect(usePlayerStore.getState().currentTrack?.id).toBe(1);
      act(() => replacement.listeners.get(replacement.events.PLAY)?.());
      act(() => vi.mocked(replacement.widget.getCurrentSound).mock.calls[0][0](toWidgetSound(playlistTracks[1])));
      expect(usePlayerStore.getState()).toMatchObject({ currentTrack: { id: 2 }, isPlaying: true });
      expect(old.widget.unbind).toHaveBeenCalledTimes(6);
    });
  });

  describe('플레이리스트 곡의 재생 확인 대기 시간', () => {
    function setupReadyPlaylist() {
      vi.useFakeTimers();
      const mock = createWidgetMock();
      vi.mocked(mock.widget.getSounds).mockImplementation(reply => reply([
        { id: 1, title: 'First track', duration: 180_000 },
        { id: 2, title: 'Second track', duration: 210_000 },
        { id: 3, title: 'Third track', duration: 240_000 },
      ]));
      const hook = renderWidgetHook();
      act(() => mock.listeners.get(mock.events.READY)?.());
      expect(hook.result.current.playlistStatus).toBe('ready');
      return { ...mock, ...hook };
    }

    it.each(['error', 'timeout'] as const)(
      '%s clears the unconfirmed target before next navigation and rejects its late lookup', failure => {
        const { widget, result, events, listeners } = setupReadyPlaylist();
        act(() => result.current.nextTrack());
        act(() => listeners.get(events.PLAY)?.());
        const soundCalls = vi.mocked(widget.getCurrentSound).mock.calls;
        const lateReply = soundCalls[soundCalls.length - 1][0];
        act(() => {
          if (failure === 'error') listeners.get(events.ERROR)?.();
          else vi.advanceTimersByTime(10_000);
        });
        expect(usePlayerStore.getState()).toMatchObject({ currentTrack: { id: 1 }, isPlaying: false });
        act(() => result.current.nextTrack());
        // B was never confirmed. Navigation must start from confirmed A again.
        expect(vi.mocked(widget.skip).mock.calls).toEqual([[1], [1]]);
        const beforeLateReply = usePlayerStore.getState();
        act(() => lateReply(toWidgetSound(playlistTracks[1])));
        expect(usePlayerStore.getState()).toBe(beforeLateReply);
        act(() => listeners.get(events.PLAY)?.());
        const currentCalls = vi.mocked(widget.getCurrentSound).mock.calls;
        act(() => currentCalls[currentCalls.length - 1][0](toWidgetSound(playlistTracks[1])));
        expect(usePlayerStore.getState()).toMatchObject({ currentTrack: { id: 2 }, isPlaying: true });
        const pauses = vi.mocked(widget.pause).mock.calls.length;
        act(() => vi.advanceTimersByTime(10_000));
        expect(widget.pause).toHaveBeenCalledTimes(pauses);
      }
    );

    it('10초 동안 재생 확인이 없으면 실제 위젯을 정지한다', () => {
      const { widget, result } = setupReadyPlaylist();
      usePlayerStore.setState({ isPlaying: true });
      act(() => result.current.selectTrack(1));

      act(() => vi.advanceTimersByTime(9_999));
      expect(widget.pause).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));

      expect(widget.pause).toHaveBeenCalledOnce();
      expect(usePlayerStore.getState().isPlaying).toBe(false);
    });

    it('시간 초과 뒤 늦은 이벤트를 차단하고 같은 곡을 재시도할 수 있다', () => {
      const { widget, result, events, listeners } = setupReadyPlaylist();
      act(() => result.current.selectTrack(1));
      act(() => vi.advanceTimersByTime(10_000));
      const error = result.current.widgetError;
      expect(error).toContain('재생을 확인하지 못했습니다');
      expect(result.current.playlistStatus).toBe('ready');
      act(() => {
        listeners.get(events.PLAY)?.();
        listeners.get(events.PLAY_PROGRESS)?.({ currentPosition: 99_000 });
        listeners.get(events.READY)?.();
        listeners.get(events.ERROR)?.();
      });
      expect(widget.pause).toHaveBeenCalledTimes(2);
      expect(result.current.widgetError).toBe(error);
      expect(usePlayerStore.getState()).toMatchObject({ isPlaying: false, currentTime: 0 });

      act(() => result.current.retryLoad());
      expect(widget.load).toHaveBeenCalledWith(PLAYLIST_URL, expect.objectContaining({
        auto_play: false, start_track: 1,
      }));
      vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply({
        id: 2, title: 'Second track', duration: 210_000,
      }));
      act(() => vi.mocked(widget.load).mock.calls[0][1]?.callback?.());
      act(() => listeners.get(events.PLAY)?.());
      expect(result.current.widgetError).toBeNull();
      expect(usePlayerStore.getState()).toMatchObject({ currentTrack: { id: 2 }, isPlaying: true });
    });

    it('시간 초과 뒤 다른 곡을 선택하면 정상 재생으로 복구한다', () => {
      const { widget, result, events, listeners } = setupReadyPlaylist();
      act(() => result.current.selectTrack(1));
      act(() => vi.advanceTimersByTime(10_000));
      act(() => result.current.selectTrack(2));
      vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply({
        id: 3, title: 'Third track', duration: 240_000,
      }));
      act(() => listeners.get(events.PLAY)?.());
      act(() => vi.advanceTimersByTime(10_000));
      expect(widget.pause).toHaveBeenCalledOnce();
      expect(result.current.widgetError).toBeNull();
      expect(usePlayerStore.getState()).toMatchObject({ currentTrack: { id: 3 }, isPlaying: true });
    });

    it('제한 시간 안에 요청한 곡이 확인되면 재생을 계속한다', () => {
      const { widget, result, events, listeners } = setupReadyPlaylist();
      act(() => result.current.selectTrack(1));
      act(() => vi.advanceTimersByTime(5_000));
      vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply({
        id: 2, title: 'Second track', duration: 210_000,
      }));
      act(() => listeners.get(events.PLAY)?.());
      act(() => vi.advanceTimersByTime(10_000));

      expect(widget.pause).not.toHaveBeenCalled();
      expect(usePlayerStore.getState()).toMatchObject({
        currentTrack: { id: 2 }, isPlaying: true,
      });
    });

    it('새 곡을 선택하면 그 시점부터 10초를 기다린다', () => {
      const { widget, result } = setupReadyPlaylist();
      act(() => result.current.selectTrack(1));
      act(() => vi.advanceTimersByTime(6_000));
      act(() => result.current.selectTrack(2));

      act(() => vi.advanceTimersByTime(4_000));
      expect(widget.pause).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(5_999));
      expect(widget.pause).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));
      expect(widget.pause).toHaveBeenCalledOnce();
      expect(widget.skip).toHaveBeenLastCalledWith(2);
    });
  });

  it('ignores a blocked selection without interrupting the playing track', () => {
    usePlayerStore.setState({
      tracks: [playlistTracks[0], { ...playlistTracks[1], playbackStatus: 'blocked' }],
      isPlaying: true,
      currentTime: 12,
    });
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();

    act(() => result.current.selectTrack(1));

    expect(widget.skip).not.toHaveBeenCalled();
    expect(widget.load).not.toHaveBeenCalled();
    expect(usePlayerStore.getState()).toMatchObject({
      currentTrack: playlistTracks[0],
      isPlaying: true,
      currentTime: 12,
    });
  });

  it('selects a preview at its original playlist index', () => {
    const previewTrack: PlayerTrack = { ...playlistTracks[1], playbackStatus: 'preview' };
    usePlayerStore.setState({
      tracks: [{ ...playlistTracks[0], playbackStatus: 'blocked' }, previewTrack],
    });
    const { widget, events, listeners } = createWidgetMock();
    const { result } = renderWidgetHook();

    act(() => result.current.selectTrack(1));

    expect(widget.skip).toHaveBeenCalledWith(1);
    expect(usePlayerStore.getState().currentTrack?.id).toBe(playlistTracks[0].id);

    vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply({
      id: previewTrack.id, title: previewTrack.title, policy: 'SNIP',
    }));
    act(() => listeners.get(events.PLAY)?.());
    expect(usePlayerStore.getState().currentTrack).toMatchObject({
      id: previewTrack.id, playbackStatus: 'preview',
    });
  });

  it('replaces an unfinished playlist load immediately instead of skipping on the unready source', () => {
    const { widget, events, listeners } = createWidgetMock();
    const { result } = renderWidgetHook();
    usePlayerStore.setState({ playbackMode: 'single' });
    act(() => result.current.selectTrack(0));
    const oldLoaded = vi.mocked(widget.load).mock.calls[0][1]?.callback;
    act(() => result.current.selectTrack(1));
    expect(widget.load).toHaveBeenCalledTimes(2);
    expect(widget.load).toHaveBeenLastCalledWith(PLAYLIST_URL, expect.objectContaining({
      auto_play: false, start_track: 1,
    }));
    expect(widget.skip).not.toHaveBeenCalled();
    act(() => oldLoaded?.());
    expect(widget.getCurrentSound).not.toHaveBeenCalled();
    expect(widget.play).not.toHaveBeenCalled();
    vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(playlistTracks[1])));
    act(() => vi.mocked(widget.load).mock.calls[1][1]?.callback?.());
    expect(widget.play).toHaveBeenCalledOnce();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    act(() => listeners.get(events.PLAY)?.());
    expect(usePlayerStore.getState()).toMatchObject({
      currentTrack: { id: playlistTracks[1].id }, isPlaying: true,
    });
    expect(result.current.widgetError).toBeNull();
  });

  it('two next commands during playlist loading target successive original indices and only confirm the last load', () => {
    const { events, listeners, widget } = createWidgetMock();
    const { result } = renderWidgetHook();
    const thirdTrack: PlayerTrack = { ...playlistTracks[1], id: 3, title: 'Third track' };
    usePlayerStore.setState({ tracks: [...playlistTracks, thirdTrack], playbackMode: 'single' });
    act(() => result.current.selectTrack(0));
    act(() => result.current.nextTrack());
    act(() => result.current.nextTrack());
    expect(widget.load).toHaveBeenCalledTimes(3);
    expect(vi.mocked(widget.load).mock.calls.map(([, options]) => options?.start_track)).toEqual([0, 1, 2]);
    expect(widget.skip).not.toHaveBeenCalled();
    act(() => {
      vi.mocked(widget.load).mock.calls[1][1]?.callback?.();
      vi.mocked(widget.load).mock.calls[0][1]?.callback?.();
    });
    expect(widget.getCurrentSound).not.toHaveBeenCalled();
    expect(widget.play).not.toHaveBeenCalled();
    vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(thirdTrack)));
    vi.mocked(widget.getDuration).mockImplementation(reply => reply(thirdTrack.durationMs));
    act(() => vi.mocked(widget.load).mock.calls[2][1]?.callback?.());
    expect(widget.play).toHaveBeenCalledOnce();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    act(() => listeners.get(events.PLAY)?.());
    expect(usePlayerStore.getState()).toMatchObject({
      currentTrack: { id: 3 }, isPlaying: true, currentTime: 0, duration: thirdTrack.durationMs / 1000,
    });
    expect(result.current.widgetTrack?.id).toBe(3);
  });

  it('confirms the last panel selection after page A and B when playlist PLAY precedes its load callback', () => {
    const { widget, events, listeners } = createWidgetMock();
    let actualTrack = playlistTracks[0];
    vi.mocked(widget.getSounds).mockImplementation(reply => reply(playlistTracks.map(toWidgetSound)));
    vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(actualTrack)));
    vi.mocked(widget.getDuration).mockImplementation(reply => reply(actualTrack.durationMs));
    const { result } = renderWidgetHook();
    act(() => listeners.get(events.READY)?.());
    act(() => result.current.selectTrack(0));
    act(() => listeners.get(events.PLAY)?.());
    expect(usePlayerStore.getState().isPlaying).toBe(true);

    act(() => result.current.playSingleTrack(bookmarkTrack));
    const oldPageLoaded = vi.mocked(widget.load).mock.calls[0][1]?.callback;
    act(() => result.current.playSingleTrack(secondBookmarkTrack));
    act(() => result.current.selectTrack(0));
    expect(widget.load).toHaveBeenCalledTimes(3);
    actualTrack = secondBookmarkTrack;
    act(() => oldPageLoaded?.());
    act(() => vi.mocked(widget.load).mock.calls[1][1]?.callback?.());
    expect(widget.load).toHaveBeenCalledTimes(3);
    expect(widget.load).toHaveBeenLastCalledWith(PLAYLIST_URL, expect.objectContaining({
      auto_play: false, start_track: 0,
    }));

    actualTrack = playlistTracks[0];
    const playCount = vi.mocked(widget.play).mock.calls.length;
    act(() => listeners.get(events.PLAY)?.());
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    act(() => vi.mocked(widget.load).mock.calls[2][1]?.callback?.());
    expect(widget.play).toHaveBeenCalledTimes(playCount + 1);
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    act(() => listeners.get(events.PLAY)?.());
    expect(usePlayerStore.getState()).toMatchObject({
      playbackMode: 'playlist', currentTrack: { id: playlistTracks[0].id }, isPlaying: true,
    });
  });

  describe('playlist load confirmation', () => {
    it.each([false, true])(
      'waits for complete metadata when the selected panel ID has no title (paused=%s)',
      (paused) => {
        vi.useFakeTimers();
        const { widget, events, listeners } = createWidgetMock();
        const { result } = renderWidgetHook();
        usePlayerStore.setState({ playbackMode: 'single' });

        act(() => result.current.selectTrack(1));
        act(() => result.current.playSingleTrack(bookmarkTrack));
        act(() => result.current.selectTrack(1));
        vi.mocked(widget.getCurrentSound).mockImplementation(reply => {
          reply({ id: playlistTracks[1].id });
        });
        act(() => vi.mocked(widget.load).mock.calls[2][1]?.callback?.());

        expect(result.current.widgetError).toBeNull();
        expect(usePlayerStore.getState().isPlaybackLoading).toBe(true);
        expect(widget.play).not.toHaveBeenCalled();
        expect(widget.pause).not.toHaveBeenCalled();

        if (paused) act(() => result.current.pause());
        vi.mocked(widget.getCurrentSound).mockImplementation(reply => {
          reply(toWidgetSound(playlistTracks[1]));
        });
        act(() => vi.advanceTimersByTime(9_999));

        expect(widget.load).toHaveBeenCalledTimes(3);
        expect(result.current.widgetError).toBeNull();
        expect(result.current.playlistStatus).toBe('ready');
        expect(usePlayerStore.getState()).toMatchObject({
          currentTrack: { id: playlistTracks[1].id, title: playlistTracks[1].title },
          duration: playlistTracks[1].durationMs / 1000,
          isPlaybackLoading: false,
          isPlaying: false,
        });
        expect(widget.play).toHaveBeenCalledTimes(paused ? 0 : 1);
        if (!paused) act(() => listeners.get(events.PLAY)?.());
        expect(usePlayerStore.getState().isPlaying).toBe(!paused);
        act(() => vi.advanceTimersByTime(10_000));
        expect(result.current.widgetError).toBeNull();
        expect(widget.play).toHaveBeenCalledTimes(paused ? 0 : 1);
      }
    );

    it('keeps the original deadline when panel metadata remains incomplete and ignores a late full reply', () => {
      vi.useFakeTimers();
      const { widget } = createWidgetMock();
      const { result } = renderWidgetHook();
      usePlayerStore.setState({ playbackMode: 'single' });
      act(() => result.current.selectTrack(1));
      act(() => vi.advanceTimersByTime(6_000));
      vi.mocked(widget.getCurrentSound).mockImplementation(reply => {
        reply({ id: playlistTracks[1].id });
      });
      act(() => vi.mocked(widget.load).mock.calls[0][1]?.callback?.());
      const lateReply = vi.mocked(widget.getCurrentSound).mock.calls[0][0];

      act(() => vi.advanceTimersByTime(3_999));
      expect(result.current.widgetError).toBeNull();
      expect(usePlayerStore.getState().isPlaybackLoading).toBe(true);
      act(() => vi.advanceTimersByTime(1));
      expect(result.current.widgetError).toBe(
        'SoundCloud를 불러오지 못했습니다. 다시 시도해 주세요.'
      );
      expect(usePlayerStore.getState().isPlaybackLoading).toBe(false);
      expect(widget.pause).toHaveBeenCalledOnce();
      expect(widget.play).not.toHaveBeenCalled();

      const lookupCount = vi.mocked(widget.getCurrentSound).mock.calls.length;
      const failedState = usePlayerStore.getState();
      act(() => {
        lateReply(toWidgetSound(playlistTracks[1]));
        vi.advanceTimersByTime(10_000);
      });
      expect(usePlayerStore.getState()).toBe(failedState);
      expect(vi.mocked(widget.getCurrentSound).mock.calls).toHaveLength(lookupCount);
      expect(widget.pause).toHaveBeenCalledOnce();
      expect(widget.play).not.toHaveBeenCalled();
    });

    it.each(['single selection', 'unmount'] as const)(
      'stops pending panel confirmation after %s',
      (interruption) => {
        vi.useFakeTimers();
        const { widget } = createWidgetMock();
        const { result, unmount } = renderWidgetHook();
        usePlayerStore.setState({ playbackMode: 'single' });
        act(() => result.current.selectTrack(1));
        const loaded = vi.mocked(widget.load).mock.calls[0][1]?.callback;
        act(() => loaded?.());
        const oldReply = vi.mocked(widget.getCurrentSound).mock.calls[0][0];

        if (interruption === 'unmount') {
          unmount();
        } else {
          act(() => result.current.playSingleTrack(bookmarkTrack));
        }

        const stateAfterInterruption = usePlayerStore.getState();
        const loadCount = vi.mocked(widget.load).mock.calls.length;
        const pauseCount = vi.mocked(widget.pause).mock.calls.length;
        act(() => {
          loaded?.();
          oldReply(toWidgetSound(playlistTracks[1]));
          vi.advanceTimersByTime(9_999);
        });
        expect(widget.getCurrentSound).toHaveBeenCalledOnce();
        expect(widget.load).toHaveBeenCalledTimes(loadCount);
        expect(widget.pause).toHaveBeenCalledTimes(pauseCount);
        expect(widget.play).not.toHaveBeenCalled();
        expect(usePlayerStore.getState()).toBe(stateAfterInterruption);
      }
    );

    it.each([false, true])(
      'recovers an unanswered panel lookup without reloading and completes once (paused=%s)',
      (paused) => {
        vi.useFakeTimers();
        const { widget, events, listeners } = createWidgetMock();
        const { result } = renderWidgetHook();
        usePlayerStore.setState({ playbackMode: 'single' });

        act(() => result.current.selectTrack(1));
        act(() => result.current.playSingleTrack(bookmarkTrack));
        act(() => result.current.selectTrack(1));
        act(() => vi.mocked(widget.load).mock.calls[2][1]?.callback?.());
        expect(widget.getCurrentSound).toHaveBeenCalledOnce();
        const firstReply = vi.mocked(widget.getCurrentSound).mock.calls[0][0];

        if (paused) act(() => result.current.pause());
        vi.mocked(widget.getCurrentSound).mockImplementation(reply => {
          reply(toWidgetSound(playlistTracks[1]));
        });

        // Recovery must happen within the existing deadline, without another load.
        act(() => vi.advanceTimersByTime(9_999));
        expect(vi.mocked(widget.getCurrentSound).mock.calls.length).toBeGreaterThan(1);
        expect(widget.load).toHaveBeenCalledTimes(3);
        expect(result.current.widgetError).toBeNull();
        expect(result.current.playlistStatus).toBe('ready');
        expect(usePlayerStore.getState()).toMatchObject({
          currentTrack: { id: playlistTracks[1].id },
          isPlaybackLoading: false,
          isPlaying: false,
        });
        expect(widget.play).toHaveBeenCalledTimes(paused ? 0 : 1);

        act(() => firstReply(toWidgetSound(playlistTracks[1])));
        expect(widget.play).toHaveBeenCalledTimes(paused ? 0 : 1);
        if (!paused) act(() => listeners.get(events.PLAY)?.());
        expect(usePlayerStore.getState().isPlaying).toBe(!paused);

        const lookupCount = vi.mocked(widget.getCurrentSound).mock.calls.length;
        act(() => vi.advanceTimersByTime(10_000));
        expect(vi.mocked(widget.getCurrentSound).mock.calls).toHaveLength(lookupCount);
        expect(result.current.widgetError).toBeNull();
      }
    );

    it('times out an unanswered panel lookup after rapid replacements and retries without accepting its late reply', () => {
      vi.useFakeTimers();
      const { widget, events, listeners } = createWidgetMock();
      const { result } = renderWidgetHook();
      usePlayerStore.setState({ playbackMode: 'single' });

      act(() => result.current.selectTrack(1));
      act(() => result.current.playSingleTrack(bookmarkTrack));
      act(() => result.current.selectTrack(1));

      act(() => {
        for (const [, options] of vi.mocked(widget.load).mock.calls) {
          options?.callback?.();
        }
      });
      expect(widget.getCurrentSound).toHaveBeenCalledOnce();
      const unansweredLookup = vi.mocked(widget.getCurrentSound).mock.calls[0][0];
      expect(usePlayerStore.getState().isPlaybackLoading).toBe(true);
      expect(widget.play).not.toHaveBeenCalled();

      // A later READY alone does not complete the pending sound lookup.
      act(() => listeners.get(events.READY)?.());
      expect(widget.getCurrentSound).toHaveBeenCalledOnce();
      act(() => vi.advanceTimersByTime(10_000));
      expect(result.current.widgetError).toBe(
        'SoundCloud를 불러오지 못했습니다. 다시 시도해 주세요.'
      );
      expect(result.current.playlistStatus).toBe('error');
      expect(usePlayerStore.getState()).toMatchObject({
        isPlaying: false, isPlaybackLoading: false,
      });

      act(() => result.current.retryLoad());
      expect(widget.load).toHaveBeenCalledTimes(4);
      expect(widget.load).toHaveBeenLastCalledWith(PLAYLIST_URL, expect.objectContaining({
        auto_play: false, start_track: 1,
      }));
      act(() => unansweredLookup(toWidgetSound(playlistTracks[1])));
      expect(usePlayerStore.getState().isPlaybackLoading).toBe(true);
      expect(widget.play).not.toHaveBeenCalled();

      vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(playlistTracks[1])));
      act(() => vi.mocked(widget.load).mock.calls[3][1]?.callback?.());
      expect(result.current.widgetError).toBeNull();
      expect(result.current.playlistStatus).toBe('ready');
      expect(usePlayerStore.getState().isPlaybackLoading).toBe(false);
      expect(widget.play).toHaveBeenCalledOnce();
      expect(usePlayerStore.getState().isPlaying).toBe(false);
      act(() => listeners.get(events.PLAY)?.());
      expect(usePlayerStore.getState()).toMatchObject({
        currentTrack: { id: playlistTracks[1].id }, isPlaying: true,
      });
    });

    it('only plays the last panel request across rapid single and playlist replacements', () => {
      vi.useFakeTimers();
      const { widget, events, listeners } = createWidgetMock();
      const { result } = renderWidgetHook();
      const onResolved = vi.fn();
      const onFailure = vi.fn();
      act(() => result.current.playSingleTrack(bookmarkTrack, { onResolved, onFailure }));
      act(() => result.current.selectTrack(1));
      act(() => result.current.playSingleTrack(secondBookmarkTrack, { onResolved, onFailure }));
      act(() => vi.advanceTimersByTime(6_000));
      act(() => result.current.selectTrack(0));
      expect(widget.load).toHaveBeenCalledTimes(4);
      expect(vi.mocked(widget.load).mock.calls.map(([url]) => url)).toEqual([
        bookmarkTrack.permalinkUrl, PLAYLIST_URL, secondBookmarkTrack.permalinkUrl, PLAYLIST_URL,
      ]);
      expect(widget.skip).not.toHaveBeenCalled();
      const latestState = usePlayerStore.getState();
      act(() => {
        for (const index of [2, 0, 1]) vi.mocked(widget.load).mock.calls[index][1]?.callback?.();
        vi.advanceTimersByTime(4_000);
      });
      expect(widget.getCurrentSound).not.toHaveBeenCalled();
      expect(widget.play).not.toHaveBeenCalled();
      expect(widget.pause).not.toHaveBeenCalled();
      expect(onResolved).not.toHaveBeenCalled();
      expect(onFailure).not.toHaveBeenCalled();
      expect(usePlayerStore.getState()).toBe(latestState);

      vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(playlistTracks[0])));
      vi.mocked(widget.getDuration).mockImplementation(reply => reply(playlistTracks[0].durationMs));
      act(() => vi.mocked(widget.load).mock.calls[3][1]?.callback?.());
      expect(widget.play).toHaveBeenCalledOnce();
      expect(usePlayerStore.getState().isPlaying).toBe(false);
      act(() => listeners.get(events.PLAY)?.());
      act(() => vi.advanceTimersByTime(10_000));
      expect(widget.pause).not.toHaveBeenCalled();
      expect(result.current.widgetError).toBeNull();
      expect(usePlayerStore.getState()).toMatchObject({
        playbackMode: 'playlist', currentTrack: { id: playlistTracks[0].id }, isPlaying: true,
      });
      expect(usePlayerStore.getState().tracks).toEqual(playlistTracks);
    });

    it.each([
      { label: 'invalid', sound: null },
      { label: 'different track', sound: toWidgetSound(playlistTracks[1]) },
      { label: 'blocked', sound: { ...toWidgetSound(playlistTracks[0]), policy: 'BLOCK' } },
    ])('does not play when the loaded playlist track is $label', ({ sound }) => {
      const { widget } = createWidgetMock();
      const { result } = renderWidgetHook();
      usePlayerStore.setState({ playbackMode: 'single' });
      act(() => result.current.selectTrack(0));
      expect(widget.play).not.toHaveBeenCalled();
      vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(sound));
      act(() => vi.mocked(widget.load).mock.calls[0][1]?.callback?.());
      expect(widget.play).not.toHaveBeenCalled();
      expect(widget.pause).toHaveBeenCalledOnce();
      expect(result.current.playlistStatus).toBe('error');
      expect(result.current.widgetError).not.toBeNull();
      expect(usePlayerStore.getState().isPlaying).toBe(false);
    });

    it('ignores a delayed playlist sound response after a single track replaces the load', () => {
      const { widget } = createWidgetMock();
      const { result } = renderWidgetHook();
      usePlayerStore.setState({ playbackMode: 'single' });
      act(() => result.current.selectTrack(0));
      act(() => vi.mocked(widget.load).mock.calls[0][1]?.callback?.());
      const oldLookup = vi.mocked(widget.getCurrentSound).mock.calls[0][0];

      const onResolved = vi.fn();
      act(() => result.current.playSingleTrack(bookmarkTrack, { onResolved }));
      vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(bookmarkTrack)));
      act(() => vi.mocked(widget.load).mock.calls[1][1]?.callback?.());
      expect(widget.play).toHaveBeenCalledOnce();
      expect(onResolved).toHaveBeenCalledOnce();
      const currentState = usePlayerStore.getState();

      act(() => oldLookup(toWidgetSound(playlistTracks[0])));
      expect(widget.play).toHaveBeenCalledOnce();
      expect(widget.pause).not.toHaveBeenCalled();
      expect(usePlayerStore.getState()).toBe(currentState);
    });
  });

  describe('single-track immediate replacement', () => {
    it.each([
      { label: 'A → B', selections: [bookmarkTrack, secondBookmarkTrack] },
      { label: 'A → B → A', selections: [bookmarkTrack, secondBookmarkTrack, bookmarkTrack] },
      { label: 'A → B → C', selections: [bookmarkTrack, secondBookmarkTrack, thirdBookmarkTrack] },
    ])('$label loads immediately and only resolves the latest request', ({ selections }) => {
      const { widget, events, listeners } = createWidgetMock();
      const { result } = renderWidgetHook();
      const requests = selections.map(track => ({ track, onResolved: vi.fn(), onFailure: vi.fn() }));

      for (const { track, onResolved, onFailure } of requests) {
        act(() => result.current.playSingleTrack(track, { onResolved, onFailure }));
      }

      expect(widget.load).toHaveBeenCalledTimes(requests.length);
      expect(vi.mocked(widget.load).mock.calls.map(([url]) => url))
        .toEqual(selections.map(track => track.permalinkUrl));
      expect(widget.play).not.toHaveBeenCalled();

      const latest = requests[requests.length - 1];
      vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(latest.track)));
      act(() => vi.mocked(widget.load).mock.calls[requests.length - 1][1]?.callback?.());
      expect(latest.onResolved).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: latest.track.id }));
      expect(widget.play).toHaveBeenCalledOnce();
      expect(usePlayerStore.getState()).toMatchObject({
        currentTrack: { id: latest.track.id }, isPlaying: false,
      });

      const lookupCount = vi.mocked(widget.getCurrentSound).mock.calls.length;
      for (let index = requests.length - 2; index >= 0; index -= 1) {
        act(() => vi.mocked(widget.load).mock.calls[index][1]?.callback?.());
        expect(requests[index].onResolved).not.toHaveBeenCalled();
      }
      expect(widget.getCurrentSound).toHaveBeenCalledTimes(lookupCount);
      expect(widget.play).toHaveBeenCalledOnce();
      for (const request of requests) expect(request.onFailure).not.toHaveBeenCalled();

      act(() => listeners.get(events.PLAY)?.());
      expect(usePlayerStore.getState()).toMatchObject({
        currentTrack: { id: latest.track.id }, isPlaying: true,
      });
    });

    it('ignores an earlier single-track lookup delivered after the latest track resolves', () => {
      const { widget } = createWidgetMock();
      const { result } = renderWidgetHook();
      const oldResolved = vi.fn();
      const oldFailure = vi.fn();
      const latestResolved = vi.fn();
      act(() => result.current.playSingleTrack(bookmarkTrack, {
        onResolved: oldResolved, onFailure: oldFailure,
      }));
      act(() => vi.mocked(widget.load).mock.calls[0][1]?.callback?.());
      const oldLookup = vi.mocked(widget.getCurrentSound).mock.calls[0][0];

      act(() => result.current.playSingleTrack(secondBookmarkTrack, { onResolved: latestResolved }));
      expect(widget.load).toHaveBeenCalledTimes(2);
      vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(secondBookmarkTrack)));
      act(() => vi.mocked(widget.load).mock.calls[1][1]?.callback?.());
      act(() => oldLookup(toWidgetSound(bookmarkTrack)));

      expect(oldResolved).not.toHaveBeenCalled();
      expect(oldFailure).not.toHaveBeenCalled();
      expect(latestResolved).toHaveBeenCalledOnce();
      expect(widget.play).toHaveBeenCalledOnce();
      expect(usePlayerStore.getState().currentTrack?.id).toBe(secondBookmarkTrack.id);
    });

    it('starts a fresh load timeout for the replacement and reports its failure only once', () => {
      vi.useFakeTimers();
      const { widget, events, listeners } = createWidgetMock();
      const { result } = renderWidgetHook();
      const oldFailure = vi.fn();
      const latestFailure = vi.fn();
      act(() => result.current.playSingleTrack(bookmarkTrack, { onFailure: oldFailure }));
      act(() => vi.advanceTimersByTime(6_000));
      act(() => result.current.playSingleTrack(secondBookmarkTrack, { onFailure: latestFailure }));
      expect(widget.load).toHaveBeenCalledTimes(2);

      act(() => vi.advanceTimersByTime(4_000));
      expect(oldFailure).not.toHaveBeenCalled();
      expect(latestFailure).not.toHaveBeenCalled();
      expect(widget.pause).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(5_999));
      expect(latestFailure).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));
      expect(latestFailure).toHaveBeenCalledOnce();
      expect(widget.pause).toHaveBeenCalledOnce();

      act(() => {
        vi.mocked(widget.load).mock.calls[0][1]?.callback?.();
        listeners.get(events.ERROR)?.();
        vi.advanceTimersByTime(10_000);
      });
      expect(oldFailure).not.toHaveBeenCalled();
      expect(latestFailure).toHaveBeenCalledOnce();
      expect(widget.play).not.toHaveBeenCalled();
      expect(usePlayerStore.getState()).toMatchObject({ currentTrack: null, isPlaying: false });
    });
  });

  it('loads a panel track immediately during a single load and ignores the single callback', () => {
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();
    const onResolved = vi.fn();
    const onFailure = vi.fn();
    act(() => result.current.playSingleTrack(bookmarkTrack, { onResolved, onFailure }));
    const oldLoaded = vi.mocked(widget.load).mock.calls[0][1]?.callback;
    act(() => result.current.selectTrack(1));
    expect(widget.load).toHaveBeenCalledTimes(2);
    expect(widget.load).toHaveBeenLastCalledWith(PLAYLIST_URL, expect.objectContaining({
      auto_play: false, start_track: 1,
    }));
    act(() => oldLoaded?.());
    expect(widget.getCurrentSound).not.toHaveBeenCalled();
    expect(onResolved).not.toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
    vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(playlistTracks[1])));
    act(() => vi.mocked(widget.load).mock.calls[1][1]?.callback?.());
    expect(widget.play).toHaveBeenCalledOnce();
    expect(usePlayerStore.getState()).toMatchObject({
      playbackMode: 'playlist', currentTrack: { id: playlistTracks[1].id }, isPlaying: false,
    });
  });

  it('replaces an ongoing playlist load with a single track without waiting for its callback', () => {
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();
    usePlayerStore.setState({ playbackMode: 'single' });
    act(() => result.current.selectTrack(0));
    const oldLoaded = vi.mocked(widget.load).mock.calls[0][1]?.callback;
    const onResolved = vi.fn();
    act(() => result.current.playSingleTrack(secondBookmarkTrack, { onResolved }));
    expect(widget.load).toHaveBeenCalledTimes(2);
    expect(widget.load).toHaveBeenLastCalledWith(
      secondBookmarkTrack.permalinkUrl, expect.objectContaining({ auto_play: false })
    );
    act(() => oldLoaded?.());
    expect(widget.getCurrentSound).not.toHaveBeenCalled();
    expect(widget.play).not.toHaveBeenCalled();
    expect(usePlayerStore.getState()).toMatchObject({
      playbackMode: 'single', currentTrack: secondBookmarkTrack, isPlaying: false,
    });
    vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(secondBookmarkTrack)));
    act(() => vi.mocked(widget.load).mock.calls[1][1]?.callback?.());
    expect(onResolved).toHaveBeenCalledOnce();
    expect(widget.play).toHaveBeenCalledOnce();
    expect(usePlayerStore.getState().tracks).toEqual(playlistTracks);
  });

  it('reports an unattributed Widget ERROR for the active single request and ignores both late load callbacks', () => {
    const { events, listeners, widget } = createWidgetMock();
    const { result } = renderWidgetHook();
    const oldFailure = vi.fn();
    const activeFailure = vi.fn();
    act(() => result.current.playSingleTrack(bookmarkTrack, { onFailure: oldFailure }));
    act(() => result.current.playSingleTrack(secondBookmarkTrack, { onFailure: activeFailure }));
    expect(widget.load).toHaveBeenCalledTimes(2);
    act(() => {
      listeners.get(events.ERROR)?.();
      for (const [, options] of vi.mocked(widget.load).mock.calls) options?.callback?.();
      listeners.get(events.ERROR)?.();
    });
    expect(oldFailure).not.toHaveBeenCalled();
    expect(activeFailure).toHaveBeenCalledOnce();
    expect(widget.getCurrentSound).not.toHaveBeenCalled();
    expect(widget.play).not.toHaveBeenCalled();
    expect(widget.pause).toHaveBeenCalledOnce();
    expect(result.current.widgetError).toBeNull();
    expect(usePlayerStore.getState()).toMatchObject({ currentTrack: null, isPlaying: false });
  });

  it('ignores callbacks from both replaced and active single loads after cleanup', () => {
    const { widget } = createWidgetMock();
    const { result, unmount } = renderWidgetHook();
    const onResolved = vi.fn();
    const onFailure = vi.fn();
    act(() => result.current.playSingleTrack(bookmarkTrack, { onResolved, onFailure }));
    act(() => result.current.playSingleTrack(secondBookmarkTrack, { onResolved, onFailure }));
    expect(widget.load).toHaveBeenCalledTimes(2);
    const stateBeforeCleanup = usePlayerStore.getState();
    unmount();
    act(() => {
      for (const [, options] of vi.mocked(widget.load).mock.calls) options?.callback?.();
    });
    expect(widget.getCurrentSound).not.toHaveBeenCalled();
    expect(widget.play).not.toHaveBeenCalled();
    expect(onResolved).not.toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
    expect(usePlayerStore.getState()).toEqual({ ...stateBeforeCleanup, isPlaybackLoading: false });
  });

  it('ignores an earlier track lookup after a source switch', () => {
    const { events, listeners, widget } = createWidgetMock();
    const { result } = renderWidgetHook();

    act(() => listeners.get(events.PLAY)?.());
    const previousLookup = vi.mocked(widget.getCurrentSound).mock.calls[0][0];
    const previousDuration = vi.mocked(widget.getDuration).mock.calls[0][0];

    act(() => result.current.playSingleTrack(bookmarkTrack));
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
      act(() => {
        latestTrack({ id: 2, title: 'Second track', duration: 210_000 });
        vi.mocked(widget.getDuration).mock.calls[1][0](210_000);
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
    usePlayerStore.setState({ playbackMode: 'single' });

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
    usePlayerStore.setState({ playbackMode: 'single' });

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

  it('pauses a failed bookmark once, preserves the playlist and allows the same track to retry', () => {
    const { events, listeners, widget } = createWidgetMock();
    vi.mocked(widget.getSounds).mockImplementation(callback => callback(playlistTracks));
    const { result } = renderWidgetHook();
    const onFailure = vi.fn();
    act(() => listeners.get(events.READY)?.());
    act(() => result.current.playSingleTrack(bookmarkTrack, { onFailure }));
    act(() => vi.mocked(widget.load).mock.calls[0][1]?.callback?.());
    act(() => {
      listeners.get(events.ERROR)?.();
      listeners.get(events.ERROR)?.();
      listeners.get(events.PLAY)?.();
    });

    expect(widget.pause).toHaveBeenCalledOnce();
    expect(onFailure).toHaveBeenCalledOnce();
    expect(result.current.playlistStatus).toBe('ready');
    expect(result.current.widgetError).toBeNull();
    expect(usePlayerStore.getState()).toMatchObject({ currentTrack: null, isPlaying: false });

    act(() => result.current.playSingleTrack(bookmarkTrack, { onFailure }));
    expect(widget.load).toHaveBeenCalledTimes(2);
    expect(usePlayerStore.getState().currentTrack).toEqual(bookmarkTrack);
  });

  it.each(['error-first', 'timeout-first'] as const)(
    '%s: ERROR와 시간 초과는 한 번만 보고하고 재시도 실패는 별도로 보고한다',
    (order) => {
      vi.useFakeTimers();
      const { widget, events, listeners } = createWidgetMock();
      vi.mocked(widget.getSounds).mockImplementation(reply => reply(playlistTracks.map(toWidgetSound)));
      const { result } = renderWidgetHook();
      const onFailure = vi.fn();
      act(() => listeners.get(events.READY)?.());
      act(() => result.current.playSingleTrack(bookmarkTrack, { onFailure }));

      if (order === 'error-first') {
        act(() => vi.advanceTimersByTime(9_999));
        expect(onFailure).not.toHaveBeenCalled();
        act(() => listeners.get(events.ERROR)?.());
        expect(onFailure).toHaveBeenCalledOnce();
        act(() => vi.advanceTimersByTime(1));
      } else {
        act(() => vi.advanceTimersByTime(9_999));
        expect(onFailure).not.toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(1));
        expect(onFailure).toHaveBeenCalledOnce();
        act(() => listeners.get(events.ERROR)?.());
      }
      expect(onFailure).toHaveBeenCalledOnce();
      expect(widget.pause).toHaveBeenCalledOnce();
      expect(result.current.playlistStatus).toBe('ready');
      expect(usePlayerStore.getState()).toMatchObject({ currentTrack: null, isPlaying: false });

      // 같은 콜백을 재사용해도 새 요청의 실패는 다시 보고되어야 한다.
      act(() => result.current.playSingleTrack(bookmarkTrack, { onFailure }));
      expect(widget.load).toHaveBeenCalledTimes(2);
      act(() => vi.advanceTimersByTime(9_999));
      expect(onFailure).toHaveBeenCalledOnce();
      act(() => vi.advanceTimersByTime(1));
      expect(onFailure).toHaveBeenCalledTimes(2);
      act(() => {
        listeners.get(events.ERROR)?.();
        vi.advanceTimersByTime(10_000);
      });
      expect(onFailure).toHaveBeenCalledTimes(2);
      expect(widget.pause).toHaveBeenCalledTimes(2);
      expect(usePlayerStore.getState()).toMatchObject({ currentTrack: null, isPlaying: false });
    }
  );

  it('recovers the initial playlist after a bookmark load times out before READY', () => {
    vi.useFakeTimers();
    usePlayerStore.setState({ tracks: [], currentTrack: null });
    const { events, listeners, widget } = createWidgetMock();
    const { result } = renderWidgetHook();
    const onFailure = vi.fn();
    act(() => result.current.playSingleTrack(bookmarkTrack, { onFailure }));
    act(() => vi.advanceTimersByTime(10_000));
    expect(onFailure).toHaveBeenCalledOnce();
    expect(result.current.playlistStatus).toBe('error');
    expect(result.current.widgetError).toBeNull();

    act(() => result.current.retryLoad());
    expect(result.current.playlistStatus).toBe('loading');
    vi.mocked(widget.getSounds).mockImplementation(callback => callback(playlistTracks));
    act(() => listeners.get(events.READY)?.());
    expect(result.current.playlistStatus).toBe('ready');
    expect(usePlayerStore.getState().tracks).toHaveLength(2);
  });

  it('times out a missing playlist load callback and replaces its retry with a newer selection', () => {
    vi.useFakeTimers();
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();
    usePlayerStore.setState({ playbackMode: 'single' });
    act(() => result.current.selectTrack(0));
    const lateCallback = vi.mocked(widget.load).mock.calls[0][1]?.callback;
    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.widgetError).toBeTruthy();
    expect(widget.pause).toHaveBeenCalledOnce();
    act(() => result.current.retryLoad());
    act(() => result.current.selectTrack(1));
    expect(widget.skip).not.toHaveBeenCalled();
    expect(widget.load).toHaveBeenCalledTimes(3);
    act(() => {
      lateCallback?.();
      vi.mocked(widget.load).mock.calls[1][1]?.callback?.();
    });
    expect(widget.getCurrentSound).not.toHaveBeenCalled();
    expect(widget.play).not.toHaveBeenCalled();
    vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply(toWidgetSound(playlistTracks[1])));
    act(() => vi.mocked(widget.load).mock.calls[2][1]?.callback?.());
    act(() => vi.advanceTimersByTime(10_000));
    expect(widget.play).toHaveBeenCalledOnce();
    expect(widget.pause).toHaveBeenCalledOnce();
    expect(result.current.widgetError).toBeNull();
    expect(usePlayerStore.getState().currentTrack?.id).toBe(playlistTracks[1].id);
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

  it('keeps the bookmarked track when an empty playlist is detected in single mode', () => {
    const { events, listeners } = createWidgetMock();
    usePlayerStore.setState({
      tracks: [],
      playbackMode: 'single',
      currentTrack: bookmarkTrack,
      isPlaying: true,
      currentTime: 42,
      duration: 200,
    });
    const { result } = renderWidgetHook();

    act(() => listeners.get(events.READY)?.());

    expect(result.current.playlistStatus).toBe('empty');
    expect(usePlayerStore.getState()).toMatchObject({
      playbackMode: 'single',
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

  it('reports an error when the SoundCloud SDK is unavailable', () => {
    delete window.SC;

    const { result } = renderWidgetHook();

    expect(result.current.playlistStatus).toBe('error');
    expect(result.current.widgetError).toContain(
      '페이지를 새로고침해 주세요'
    );
  });

  it('does not classify the initial missing iframe as an SDK error', () => {
    createWidgetMock();

    const { result } = renderHook(() =>
      useSoundCloudWidget(PLAYLIST_URL)
    );

    expect(result.current.playlistStatus).toBe('loading');
    expect(result.current.widgetError).toBeNull();
  });
});
