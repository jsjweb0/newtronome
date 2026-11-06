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
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    delete window.SC;
    vi.restoreAllMocks();
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
        auto_play: true, start_track: 1,
      }));
      act(() => vi.mocked(widget.load).mock.calls[0][1]?.callback?.());
      vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply({
        id: 2, title: 'Second track', duration: 210_000,
      }));
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

  it('waits for playlist loading before applying a later track selection', () => {
    const { widget, events, listeners } = createWidgetMock();
    const { result } = renderWidgetHook();

    usePlayerStore.setState({ playbackMode: 'single' });

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
    expect(usePlayerStore.getState().currentTrack?.id).toBe(playlistTracks[0].id);

    vi.mocked(widget.getCurrentSound).mockImplementation(reply => reply({
      id: playlistTracks[1].id, title: playlistTracks[1].title,
    }));
    act(() => listeners.get(events.PLAY)?.());
    expect(usePlayerStore.getState().currentTrack?.id).toBe(playlistTracks[1].id);
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
      playbackMode: 'single',
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
    expect(usePlayerStore.getState().currentTrack?.id).toBe(playlistTracks[0].id);
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    vi.mocked(widget.getCurrentSound).mockImplementationOnce(reply => reply({
      id: playlistTracks[1].id, title: playlistTracks[1].title,
    }));
    act(() => listeners.get(events.PLAY)?.());
    expect(usePlayerStore.getState().currentTrack?.id).toBe(playlistTracks[0].id);

    vi.mocked(widget.getCurrentSound).mockImplementation((callback) => callback({
      id: 3, title: thirdTrack.title, duration: thirdTrack.durationMs,
    }));
    vi.mocked(widget.getDuration).mockImplementation((callback) => callback(thirdTrack.durationMs));
    act(() => listeners.get(events.PLAY)?.());
    expect(usePlayerStore.getState()).toMatchObject({
      currentTrack: { id: 3 }, isPlaying: true, currentTime: 0, duration: 210,
    });
    expect(result.current.widgetTrack?.id).toBe(3);
  });

  it('loads a later single track after the first single track finishes loading', () => {
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();

    act(() => result.current.playSingleTrack(bookmarkTrack));
    const onFirstLoaded = vi.mocked(widget.load).mock.calls[0][1]?.callback;
    expect(onFirstLoaded).toBeTypeOf('function');

    act(() => result.current.playSingleTrack(secondBookmarkTrack));
    expect(widget.load).toHaveBeenCalledTimes(1);

    vi.mocked(widget.getCurrentSound).mockImplementationOnce((callback) => {
      callback(toWidgetSound(bookmarkTrack));
    });
    act(() => onFirstLoaded?.());

    expect(widget.load).toHaveBeenCalledTimes(2);
    expect(widget.load).toHaveBeenLastCalledWith(
      secondBookmarkTrack.permalinkUrl,
      expect.objectContaining({ auto_play: false })
    );
    expect(usePlayerStore.getState().currentTrack).toEqual(secondBookmarkTrack);
  });

  it('loads only the latest single track selected during another single-track load', () => {
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();

    act(() => result.current.playSingleTrack(bookmarkTrack));
    const onFirstLoaded = vi.mocked(widget.load).mock.calls[0][1]?.callback;
    expect(onFirstLoaded).toBeTypeOf('function');

    act(() => {
      result.current.playSingleTrack(secondBookmarkTrack);
      result.current.playSingleTrack(thirdBookmarkTrack);
    });
    expect(widget.load).toHaveBeenCalledTimes(1);

    vi.mocked(widget.getCurrentSound).mockImplementationOnce((callback) => {
      callback(toWidgetSound(bookmarkTrack));
    });
    act(() => onFirstLoaded?.());

    expect(widget.load).toHaveBeenCalledTimes(2);
    expect(widget.load).toHaveBeenLastCalledWith(
      thirdBookmarkTrack.permalinkUrl,
      expect.objectContaining({ auto_play: false })
    );
    expect(usePlayerStore.getState().currentTrack).toEqual(thirdBookmarkTrack);
  });

  it('loads the selected playlist track after a single track finishes loading', () => {
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();

    act(() => result.current.playSingleTrack(bookmarkTrack));
    const onSingleTrackLoaded = vi.mocked(widget.load).mock.calls[0][1]?.callback;
    expect(onSingleTrackLoaded).toBeTypeOf('function');

    act(() => result.current.selectTrack(1));
    expect(widget.load).toHaveBeenCalledTimes(1);

    vi.mocked(widget.getCurrentSound).mockImplementationOnce((callback) => {
      callback(toWidgetSound(bookmarkTrack));
    });
    act(() => onSingleTrackLoaded?.());

    expect(widget.load).toHaveBeenCalledTimes(2);
    expect(widget.load).toHaveBeenLastCalledWith(
      PLAYLIST_URL,
      expect.objectContaining({ auto_play: true, start_track: 1 })
    );
    expect(usePlayerStore.getState()).toMatchObject({
      playbackMode: 'playlist',
      currentTrack: playlistTracks[1],
    });
  });

  it('loads a single track after the playlist finishes loading', () => {
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();
    usePlayerStore.setState({ playbackMode: 'single' });

    act(() => result.current.selectTrack(0));
    const onPlaylistLoaded = vi.mocked(widget.load).mock.calls[0][1]?.callback;
    expect(onPlaylistLoaded).toBeTypeOf('function');

    act(() => result.current.playSingleTrack(secondBookmarkTrack));
    expect(widget.load).toHaveBeenCalledTimes(1);

    act(() => onPlaylistLoaded?.());

    expect(widget.load).toHaveBeenCalledTimes(2);
    expect(widget.load).toHaveBeenLastCalledWith(
      secondBookmarkTrack.permalinkUrl,
      expect.objectContaining({ auto_play: false })
    );
    expect(usePlayerStore.getState()).toMatchObject({
      playbackMode: 'single',
      currentTrack: secondBookmarkTrack,
    });
  });

  it('discards a pending selection when the active load fails', () => {
    const { events, listeners, widget } = createWidgetMock();
    const { result } = renderWidgetHook();

    act(() => result.current.playSingleTrack(bookmarkTrack));
    const onFailedLoad = vi.mocked(widget.load).mock.calls[0][1]?.callback;
    expect(onFailedLoad).toBeTypeOf('function');
    act(() => result.current.playSingleTrack(secondBookmarkTrack));

    act(() => listeners.get(events.ERROR)?.());
    act(() => onFailedLoad?.());

    expect(result.current.widgetError).toBeNull();
    expect(widget.load).toHaveBeenCalledTimes(1);
    expect(usePlayerStore.getState().currentTrack).toBeNull();
  });

  it('discards a pending selection when the hook is cleaned up', () => {
    const { widget } = createWidgetMock();
    const { result, unmount } = renderWidgetHook();

    act(() => result.current.playSingleTrack(bookmarkTrack));
    const onFirstLoaded = vi.mocked(widget.load).mock.calls[0][1]?.callback;
    expect(onFirstLoaded).toBeTypeOf('function');
    act(() => result.current.playSingleTrack(secondBookmarkTrack));

    unmount();
    act(() => onFirstLoaded?.());

    expect(widget.load).toHaveBeenCalledTimes(1);
    expect(usePlayerStore.getState().currentTrack).toEqual(bookmarkTrack);
  });

  it('ignores an earlier load callback after a newer selection starts loading', () => {
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();

    act(() => result.current.playSingleTrack(bookmarkTrack));
    const onFirstLoaded = vi.mocked(widget.load).mock.calls[0][1]?.callback;
    expect(onFirstLoaded).toBeTypeOf('function');
    act(() => result.current.playSingleTrack(secondBookmarkTrack));
    vi.mocked(widget.getCurrentSound).mockImplementationOnce((callback) => {
      callback(toWidgetSound(bookmarkTrack));
    });
    act(() => onFirstLoaded?.());
    const onSecondLoaded = vi.mocked(widget.load).mock.calls[1][1]?.callback;
    expect(onSecondLoaded).toBeTypeOf('function');

    act(() => result.current.playSingleTrack(thirdBookmarkTrack));
    act(() => onFirstLoaded?.());

    expect(widget.load).toHaveBeenCalledTimes(2);
    expect(usePlayerStore.getState().currentTrack).toEqual(secondBookmarkTrack);

    vi.mocked(widget.getCurrentSound).mockImplementationOnce((callback) => {
      callback(toWidgetSound(secondBookmarkTrack));
    });
    act(() => onSecondLoaded?.());

    expect(widget.load).toHaveBeenCalledTimes(3);
    expect(widget.load).toHaveBeenLastCalledWith(
      thirdBookmarkTrack.permalinkUrl,
      expect.objectContaining({ auto_play: false })
    );
    expect(usePlayerStore.getState().currentTrack).toEqual(thirdBookmarkTrack);
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

  it('times out a missing load callback and ignores its late response', () => {
    vi.useFakeTimers();
    const { widget } = createWidgetMock();
    const { result } = renderWidgetHook();
    usePlayerStore.setState({ playbackMode: 'single' });

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
