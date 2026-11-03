import { act, cleanup, renderHook } from '@testing-library/react';
import type { RefObject } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlayerStore } from '../stores/usePlayerStore';
import type { SoundCloudWidgetInstance } from '../types/soundcloud-widget.types';
import { useSoundCloudControls } from './useSoundCloudControls';

function createWidgetMock(): SoundCloudWidgetInstance {
  return {
    bind: vi.fn(),
    unbind: vi.fn(),
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
}

function renderControls(widget: SoundCloudWidgetInstance) {
  const widgetRef: RefObject<SoundCloudWidgetInstance | null> = {
    current: widget,
  };
  const selectTrack = vi.fn();
  const renderedHook = renderHook(() =>
    useSoundCloudControls({ widgetRef, selectTrack })
  );

  return { ...renderedHook, selectTrack };
}

describe('useSoundCloudControls', () => {
  beforeEach(() => {
    const firstTrack = {
      id: 1, title: 'A', artist: 'Artist', artworkUrl: null,
      permalinkUrl: null, durationMs: 60_000, genre: '', tags: [],
    };

    usePlayerStore.setState({
      isMuted: false,
      currentTime: 0,
      playbackMode: 'playlist',
      currentTrack: firstTrack,
      tracks: [
        firstTrack,
        { ...firstTrack, id: 2, title: 'B', playbackStatus: 'blocked' },
        { ...firstTrack, id: 3, title: 'C', playbackStatus: 'preview' },
      ],
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('다음 버튼은 차단 곡을 건너뛰고 미리듣기 곡의 원래 인덱스를 선택한다', () => {
    const { result, selectTrack } = renderControls(createWidgetMock());

    act(() => result.current.nextTrack());

    expect(selectTrack).toHaveBeenCalledWith(2);
  });

  it('forwards basic playback commands to the widget', () => {
    const widget = createWidgetMock();
    const { result } = renderControls(widget);

    act(() => {
      result.current.play();
      result.current.pause();
      result.current.toggle();
      result.current.rewindToStart();
    });

    expect(widget.play).toHaveBeenCalledOnce();
    expect(widget.pause).toHaveBeenCalledOnce();
    expect(widget.toggle).toHaveBeenCalledOnce();
    expect(widget.seekTo).toHaveBeenCalledWith(0);
  });

  it('converts valid seek seconds to milliseconds and ignores invalid values', () => {
    const widget = createWidgetMock();
    const { result } = renderControls(widget);

    act(() => {
      result.current.seek(12.5);
      result.current.seek(-1);
      result.current.seek(Number.NaN);
      result.current.seek(Infinity);
    });

    expect(widget.seekTo).toHaveBeenCalledOnce();
    expect(widget.seekTo).toHaveBeenCalledWith(12_500);
    expect(usePlayerStore.getState().currentTime).toBe(12.5);
  });

  it('이전 버튼은 차단 곡을 건너뛰고 앞 곡의 원래 인덱스를 선택한다', () => {
    const { tracks } = usePlayerStore.getState();
    usePlayerStore.setState({ currentTrack: tracks[2] });
    const { result, selectTrack } = renderControls(createWidgetMock());

    act(() => result.current.previousTrack());

    expect(selectTrack.mock.calls).toEqual([[0]]);
  });

  it('랜덤 재생 후보에서 현재 곡과 차단 곡을 제외한다', () => {
    const { result, selectTrack } = renderControls(createWidgetMock());
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.99);

    act(() => {
      result.current.playRandomTrack();
      result.current.playRandomTrack();
    });

    expect(selectTrack.mock.calls).toEqual([[2], [2]]);
  });

  it('다른 곡이 모두 차단되면 랜덤 재생을 멈춘다', () => {
    const { tracks } = usePlayerStore.getState();
    usePlayerStore.setState({ tracks: tracks.slice(0, 2) });
    const widget = createWidgetMock();
    const { result, selectTrack } = renderControls(widget);

    act(() => result.current.playRandomTrack());

    expect(widget.pause).toHaveBeenCalledOnce();
    expect(selectTrack).not.toHaveBeenCalled();
  });

  it('위젯 볼륨과 플레이어 음소거 상태를 모두 업데이트합니다.', () => {
    const widget = createWidgetMock();
    const { result } = renderControls(widget);

    act(() => {
      result.current.toggleMute();
    });

    expect(widget.setVolume).toHaveBeenLastCalledWith(0);
    expect(usePlayerStore.getState().isMuted).toBe(true);

    act(() => {
      result.current.toggleMute();
    });

    expect(widget.setVolume).toHaveBeenLastCalledWith(100);
    expect(usePlayerStore.getState().isMuted).toBe(false);
  });
});
