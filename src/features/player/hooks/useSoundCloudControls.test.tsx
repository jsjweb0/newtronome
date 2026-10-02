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
  const trackRequestIdRef: RefObject<number> = { current: 0 };
  const renderedHook = renderHook(() =>
    useSoundCloudControls({ widgetRef, trackRequestIdRef })
  );

  return { ...renderedHook, trackRequestIdRef };
}

describe('useSoundCloudControls', () => {
  beforeEach(() => {
    usePlayerStore.setState({ isMuted: false });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
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
  });

  it('invalidates pending track requests before moving between tracks', () => {
    const widget = createWidgetMock();
    const { result, trackRequestIdRef } = renderControls(widget);

    act(() => {
      result.current.previousTrack();
      result.current.nextTrack();
    });

    expect(trackRequestIdRef.current).toBe(2);
    expect(widget.prev).toHaveBeenCalledOnce();
    expect(widget.next).toHaveBeenCalledOnce();
  });

  it('skips to a random track only when getSounds returns a non-empty array', () => {
    const widget = createWidgetMock();
    const getSounds = vi.mocked(widget.getSounds);
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.6);
    const { result, trackRequestIdRef } = renderControls(widget);

    getSounds
      .mockImplementationOnce((callback) => callback({}))
      .mockImplementationOnce((callback) => callback([]))
      .mockImplementationOnce((callback) => callback([{}, {}, {}]));

    act(() => {
      result.current.playRandomTrack();
      result.current.playRandomTrack();
      result.current.playRandomTrack();
    });

    expect(randomSpy).toHaveBeenCalledOnce();
    expect(widget.skip).toHaveBeenCalledOnce();
    expect(widget.skip).toHaveBeenCalledWith(1);
    expect(trackRequestIdRef.current).toBe(1);
  });

  it('updates both widget volume and the player mute state', () => {
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
