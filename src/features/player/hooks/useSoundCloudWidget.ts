import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import type {
  SoundCloudProgressEvent,
  SoundCloudWidgetInstance,
} from '../types/soundcloud-widget.types';
import { mapSoundCloudWidgetTrack } from '../utils/mapSoundCloudWidgetTrack';
import type { PlayerTrack } from '../types/player.types';

const PLAYLIST_LOAD_RETRY_DELAY_MS = 250;
const PLAYLIST_LOAD_MAX_RETRIES = 12;
const WIDGET_LOAD_TIMEOUT_MS = 10_000;
type PlaylistStatus = 'loading' | 'ready' | 'empty' | 'error';

const isPlayerTrack = (track: PlayerTrack | null): track is PlayerTrack => track !== null;

export function useSoundCloudWidget(playlistUrl: string) {
  const [iframeElement, setIframeElement] = useState<HTMLIFrameElement | null>(null);

  const iframeRef = useCallback((element: HTMLIFrameElement | null) => {
    setIframeElement(element);
  }, []);

  const widgetRef = useRef<SoundCloudWidgetInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [playlistStatus, setPlaylistStatus] = useState<PlaylistStatus>('loading');
  const [widgetTrack, setWidgetTrack] = useState<PlayerTrack | null>(null);
  const [widgetIsPlaying, setWidgetIsPlaying] = useState(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  const isMuted = usePlayerStore((state) => state.isMuted);

  const setPlaying = usePlayerStore((state) => state.setPlaying);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const setDuration = usePlayerStore((state) => state.setDuration);
  const setMuted = usePlayerStore((state) => state.setMuted);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setPlaylist = usePlayerStore((state) => state.setPlaylist);
  const setPlaybackMode = usePlayerStore((state) => state.setPlaybackMode);

  const isSourceSwitchingRef = useRef(false);
  const pendingTrackIndexRef = useRef<number | null>(null);
  const transitionIdRef = useRef(0);
  const loadTimerRef = useRef<number | null>(null);
  const retryLoadRef = useRef<(() => void) | null>(null);

  const clearLoadTimer = useCallback(() => {
    if (loadTimerRef.current !== null) window.clearTimeout(loadTimerRef.current);
    loadTimerRef.current = null;
  }, []);

  const failLoad = useCallback((id: number) => {
    if (transitionIdRef.current !== id) return;
    clearLoadTimer();
    transitionIdRef.current += 1;
    isSourceSwitchingRef.current = false;
    pendingTrackIndexRef.current = null;
    setPlaying(false);
    setWidgetIsPlaying(false);
    setPlaylistStatus('error');
    setWidgetError('SoundCloud를 불러오지 못했습니다. 다시 시도해 주세요.');
  }, [clearLoadTimer, setPlaying]);

  const startLoadTimer = useCallback((id: number) => {
    clearLoadTimer();
    loadTimerRef.current = window.setTimeout(() => failLoad(id), WIDGET_LOAD_TIMEOUT_MS);
  }, [clearLoadTimer, failLoad]);

  const selectTrack = useCallback(
    (index: number, forceLoad = false) => {
      const widget = widgetRef.current;
      if (!widget) return;

      const { playbackMode, tracks } = usePlayerStore.getState();

      if (index < 0 || index >= tracks.length) return;

      const selectedTrack = tracks[index];

      if (isSourceSwitchingRef.current) {
        pendingTrackIndexRef.current = index;
        return;
      }

      if (playbackMode === 'playlist' && !forceLoad) {
        widget.skip(index);
        return;
      }

      isSourceSwitchingRef.current = true;
      pendingTrackIndexRef.current = null;
      const transitionId = ++transitionIdRef.current;
      setWidgetError(null);
      setPlaylistStatus('loading');
      startLoadTimer(transitionId);

      // 선택한 일반 플레이리스트 곡으로 UI를 즉시 갱신
      setPlaybackMode('playlist');
      setWidgetTrack(selectedTrack);
      setCurrentTrack(selectedTrack);
      setPlaying(false);
      setCurrentTime(0);
      setDuration(selectedTrack.durationMs / 1000);

      const loadPlaylist = () => widget.load(playlistUrl, {
        auto_play: true,
        start_track: index,
        callback: () => {
          if (widgetRef.current !== widget || transitionIdRef.current !== transitionId) return;

          clearLoadTimer();
          isSourceSwitchingRef.current = false;
          retryLoadRef.current = null;
          setPlaylistStatus(usePlayerStore.getState().tracks.length === 0 ? 'empty' : 'ready');

          const pendingIndex = pendingTrackIndexRef.current;
          pendingTrackIndexRef.current = null;
          if (pendingIndex === null || pendingIndex === index) return;

          const latestTrack = usePlayerStore.getState().tracks[pendingIndex];
          if (!latestTrack) return;

          widget.skip(pendingIndex);
          setWidgetTrack(latestTrack);
          setCurrentTrack(latestTrack);
          setPlaying(false);
          setCurrentTime(0);
          setDuration(latestTrack.durationMs / 1000);
        },
      });
      retryLoadRef.current = () => selectTrack(index, true);
      loadPlaylist();
    },
    [
      playlistUrl,
      clearLoadTimer,
      startLoadTimer,
      setCurrentTime,
      setCurrentTrack,
      setDuration,
      setPlaybackMode,
      setPlaying,
    ]
  );

  useEffect(() => {
    setIsReady(false);
    setPlaylistStatus('loading');

    const soundCloud = window.SC;

    if (!iframeElement || !soundCloud) {
      widgetRef.current = null;
      return;
    }

    const widget = soundCloud.Widget(iframeElement);
    const events = soundCloud.Widget.Events;
    let playlistRetryTimer: number | undefined;
    const initialTransitionId = ++transitionIdRef.current;

    widgetRef.current = widget;
    setWidgetError(null);
    startLoadTimer(initialTransitionId);

    const updateDuration = () => {
      const id = transitionIdRef.current;
      widget.getDuration((durationMs) => {
        if (widgetRef.current !== widget || transitionIdRef.current !== id || isSourceSwitchingRef.current) return;
        setDuration(durationMs / 1000);
      });
    };

    const updateCurrentTrack = (
      updateGlobalTrack: boolean,
      updatePlaylistTrack: boolean
    ) => {
      const id = transitionIdRef.current;
      widget.getCurrentSound((sound) => {
        if (widgetRef.current !== widget || transitionIdRef.current !== id || isSourceSwitchingRef.current) return;
        const nextTrack = mapSoundCloudWidgetTrack(sound);

        if (updatePlaylistTrack) {
          setWidgetTrack(nextTrack);
        }

        if (updateGlobalTrack) {
          setCurrentTrack(nextTrack);
        }
      });
    };

    const updatePlaylistTracks = (retryCount = 0) => {
      const id = transitionIdRef.current;
      widget.getSounds((sounds) => {
        if (widgetRef.current !== widget) return;
        if (transitionIdRef.current !== id || isSourceSwitchingRef.current) return;
        if (usePlayerStore.getState().playbackMode !== 'playlist') return;

        const tracks = sounds.map(mapSoundCloudWidgetTrack).filter(isPlayerTrack);
        const hasPartialTracks = sounds.length === 0 || tracks.length < sounds.length;

        if (hasPartialTracks && retryCount < PLAYLIST_LOAD_MAX_RETRIES) {
          playlistRetryTimer = window.setTimeout(
            () => updatePlaylistTracks(retryCount + 1),
            PLAYLIST_LOAD_RETRY_DELAY_MS
          );
          return;
        }

        if (tracks.length < sounds.length) {
          failLoad(id);
          return;
        }

        clearLoadTimer();
        setPlaylist(tracks, 0);
        setPlaylistStatus(tracks.length === 0 ? 'empty' : 'ready');
      });
    };

    const handleReady = () => {
      if (widgetRef.current !== widget || isSourceSwitchingRef.current) return;

      setWidgetError(null);

      const playbackMode = usePlayerStore.getState().playbackMode;
      const isPlaylistMode = playbackMode === 'playlist';

      setIsReady(true);
      setWidgetIsPlaying(false);
      updateCurrentTrack(true, isPlaylistMode);
      updateDuration();

      if (isPlaylistMode) {
        updatePlaylistTracks();
      } else {
        clearLoadTimer();
        setPlaylistStatus(
          usePlayerStore.getState().tracks.length === 0 ? 'empty' : 'ready'
        );
      }
    };

    const handlePlay = () => {
      if (widgetRef.current !== widget || isSourceSwitchingRef.current) return;
      const playbackMode = usePlayerStore.getState().playbackMode;

      setWidgetIsPlaying(true);
      setPlaying(true);
      updateCurrentTrack(true, playbackMode === 'playlist');
      updateDuration();
    };

    const handlePause = () => {
      if (widgetRef.current !== widget || isSourceSwitchingRef.current) return;
      setWidgetIsPlaying(false);
      setPlaying(false);
    };

    const handleFinish = () => {
      const playbackMode = usePlayerStore.getState().playbackMode;

      if (playbackMode !== 'bookmark') return;

      widget.seekTo(0);
      setCurrentTime(0);
      setWidgetIsPlaying(false);
      setPlaying(false);
    };

    const handlePlayProgress = (event?: SoundCloudProgressEvent) => {
      if (!event || widgetRef.current !== widget || isSourceSwitchingRef.current) return;

      setCurrentTime(event.currentPosition / 1000);
    };

    const handleError = () => {
      if (widgetRef.current !== widget) return;
      failLoad(transitionIdRef.current);
    };

    widget.bind(events.READY, handleReady);
    widget.bind(events.PLAY, handlePlay);
    widget.bind(events.PAUSE, handlePause);
    widget.bind(events.FINISH, handleFinish);
    widget.bind(events.PLAY_PROGRESS, handlePlayProgress);
    widget.bind(events.ERROR, handleError);

    const safelyUnbind = (eventName: string) => {
      try {
        widget.unbind(eventName);
      } catch (error) {
        // iframe이 이미 제거된 경우 발생하는 SoundCloud Widget 오류
        if (iframeElement.contentWindow) {
          throw error;
        }
      }
    };

    return () => {
      transitionIdRef.current += 1;
      clearLoadTimer();
      retryLoadRef.current = null;
      isSourceSwitchingRef.current = false;
      pendingTrackIndexRef.current = null;
      if (playlistRetryTimer !== undefined) {
        window.clearTimeout(playlistRetryTimer);
      }

      safelyUnbind(events.READY);
      safelyUnbind(events.PLAY);
      safelyUnbind(events.PAUSE);
      safelyUnbind(events.FINISH);
      safelyUnbind(events.PLAY_PROGRESS);
      safelyUnbind(events.ERROR);

      if (widgetRef.current === widget) {
        widgetRef.current = null;
      }
    };
  }, [iframeElement, clearLoadTimer, failLoad, setCurrentTime, setCurrentTrack, setDuration, setPlaying, setPlaylist, startLoadTimer]);

  const play = useCallback(() => {
    widgetRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    widgetRef.current?.pause();
  }, []);

  const playBookmarkTrack = useCallback(
    (track: PlayerTrack) => {
      const widget = widgetRef.current;
      const permalinkUrl = track.permalinkUrl;

      if (!widget || !permalinkUrl) return;

      const loadBookmarkTrack = () => {
        if (widgetRef.current !== widget) return;
        if (isSourceSwitchingRef.current) return;

        isSourceSwitchingRef.current = true;
        const transitionId = ++transitionIdRef.current;
        setWidgetError(null);
        startLoadTimer(transitionId);

        setPlaybackMode('bookmark');
        setPlaying(false);
        setCurrentTrack(track);
        setCurrentTime(0);
        setDuration(track.durationMs / 1000);

        widget.load(permalinkUrl, {
          auto_play: true,
          callback: () => {
            if (widgetRef.current !== widget || transitionIdRef.current !== transitionId) return;
            clearLoadTimer();
            isSourceSwitchingRef.current = false;
            retryLoadRef.current = null;
            setPlaylistStatus(usePlayerStore.getState().tracks.length === 0 ? 'empty' : 'ready');
          },
        });
      };

      retryLoadRef.current = loadBookmarkTrack;
      loadBookmarkTrack();
    },
    [
      clearLoadTimer,
      startLoadTimer,
      setCurrentTime,
      setCurrentTrack,
      setDuration,
      setPlaybackMode,
      setPlaying,
    ]
  );

  const retryLoad = useCallback(() => {
    if (!widgetError) return;
    const retry = retryLoadRef.current;
    setWidgetError(null);
    if (retry) {
      retry();
      return;
    }
    if (!iframeElement) return;
    setIsReady(false);
    setPlaylistStatus('loading');
    iframeElement.src = iframeElement.src;
    startLoadTimer(++transitionIdRef.current);
  }, [iframeElement, startLoadTimer, widgetError]);

  const seek = useCallback((seconds: number) => {
    if (!Number.isFinite(seconds)) return;

    widgetRef.current?.seekTo(seconds * 1000);
  }, []);

  const toggle = useCallback(() => {
    widgetRef.current?.toggle();
  }, []);

  const previousTrack = useCallback(() => {
    widgetRef.current?.prev();
  }, []);

  const nextTrack = useCallback(() => {
    widgetRef.current?.next();
  }, []);

  const rewindToStart = useCallback(() => {
    widgetRef.current?.seekTo(0);
  }, []);

  const playRandomTrack = useCallback(() => {
    const widget = widgetRef.current;
    if (!widget) return;

    widget.getSounds((sounds) => {
      if (sounds.length === 0) return;

      const randomIndex = Math.floor(Math.random() * sounds.length);

      widget.skip(randomIndex);
    });
  }, []);

  const toggleMute = useCallback(() => {
    const widget = widgetRef.current;
    if (!widget) return;

    const nextMuted = !isMuted;

    widget.setVolume(nextMuted ? 0 : 100);
    setMuted(nextMuted);
  }, [isMuted, setMuted]);

  return {
    iframeRef,
    widgetRef,
    isReady,
    playlistStatus,
    isPlaylistLoading: playlistStatus === 'loading',
    widgetError,
    retryLoad,
    play,
    pause,
    playBookmarkTrack,
    toggle,
    seek,
    previousTrack,
    nextTrack,
    rewindToStart,
    playRandomTrack,
    toggleMute,
    selectTrack,
    widgetTrack,
    widgetIsPlaying,
  };
}
