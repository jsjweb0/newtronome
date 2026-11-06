import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import type {
  SoundCloudWidgetInstance,
} from '../types/soundcloud-widget.types';
import { mapSoundCloudWidgetTrack } from '../utils/mapSoundCloudWidgetTrack';
import type { PlayerTrack, PlaySingleTrackOptions } from '../types/player.types';
import { isNonNegativeFiniteNumber } from '../../../utils/numberValidation';
import { useSoundCloudControls } from './useSoundCloudControls';

const isRecord = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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
  const latestRequestVersionRef = useRef(0);
  const pendingTrackIdRef = useRef<PlayerTrack['id'] | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [playlistStatus, setPlaylistStatus] = useState<PlaylistStatus>('loading');
  const [widgetTrack, setWidgetTrack] = useState<PlayerTrack | null>(null);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  const setPlaying = usePlayerStore((state) => state.setPlaying);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const setDuration = usePlayerStore((state) => state.setDuration);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setPlaylist = usePlayerStore((state) => state.setPlaylist);
  const setPlaybackMode = usePlayerStore((state) => state.setPlaybackMode);

  const isSourceSwitchingRef = useRef(false);

  const pendingSelectionRef = useRef<(() => void) | null>(null);
  const runPendingSelection = useCallback(() => {
    const pendingSelection = pendingSelectionRef.current;

    pendingSelectionRef.current = null;

    if (pendingSelection) {
      pendingSelection();
    }
  }, []);

  const transitionIdRef = useRef(0);
  const hasLoadedPlaylistRef = useRef(false);
  const bookmarkRequestRef = useRef<{
    id: number;
    reported: boolean;
    onFailure?: () => void;
  } | null>(null);

  const loadTimerRef = useRef<number | null>(null);
  const retryLoadRef = useRef<(() => void) | null>(null);

  const clearLoadTimer = useCallback(() => {
    if (loadTimerRef.current !== null) window.clearTimeout(loadTimerRef.current);
    loadTimerRef.current = null;
  }, []);

  const playbackTimerRef = useRef<number | null>(null);
  const playbackTimedOutRef = useRef(false);

  const clearPlaybackTimer = useCallback(() => {
    if (playbackTimerRef.current !== null) {
      window.clearTimeout(playbackTimerRef.current);
    }

    playbackTimerRef.current = null;
  }, []);

  const failLoad = useCallback((id: number) => {
    if (transitionIdRef.current !== id) return;

    const bookmark = bookmarkRequestRef.current;
    if (bookmark?.reported) return;

    const failedBookmark = bookmark?.id === id ? bookmark : null;
    if (failedBookmark) failedBookmark.reported = true;

    clearLoadTimer();
    clearPlaybackTimer();
    transitionIdRef.current += 1;
    isSourceSwitchingRef.current = false;
    pendingSelectionRef.current = null; // 나중에 실행하려던 함수를 비움
    pendingTrackIdRef.current = null;   // 확인을 기다리던 곡 ID를 비움

    widgetRef.current?.pause();
    setPlaying(false);

    if (failedBookmark) {
      retryLoadRef.current = null;
      setCurrentTrack(null);
      setCurrentTime(0);
      setDuration(0);
      if (!hasLoadedPlaylistRef.current) setPlaylistStatus('error');
      failedBookmark.onFailure?.();
      return;
    }

    setPlaylistStatus('error');
    setWidgetError('SoundCloud를 불러오지 못했습니다. 다시 시도해 주세요.');
  }, [clearLoadTimer, clearPlaybackTimer, setPlaying, setCurrentTrack, setCurrentTime, setDuration]);

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
      if (!selectedTrack || selectedTrack.playbackStatus === 'blocked') return;

      if (isSourceSwitchingRef.current) {
        pendingSelectionRef.current = () => {
          selectTrack(index, forceLoad)
        };
        return;
      }

      playbackTimedOutRef.current = false;
      setWidgetError(null);
      retryLoadRef.current = null;

      bookmarkRequestRef.current = null;

      if (playbackMode === 'playlist' && !forceLoad) {
        latestRequestVersionRef.current += 1;
        pendingTrackIdRef.current = selectedTrack.id;

        clearPlaybackTimer();

        playbackTimerRef.current = window.setTimeout(() => {
          playbackTimerRef.current = null;
          playbackTimedOutRef.current = true;

          pendingTrackIdRef.current = null;
          latestRequestVersionRef.current += 1;

          widget.pause();
          setPlaying(false);

          setWidgetError(
            '곡의 재생을 확인하지 못했습니다. 다시 시도해 주세요.'
          );

          retryLoadRef.current = () => selectTrack(index, true);
        }, 10_000);

        widget.skip(index);
        return;
      }

      clearPlaybackTimer();
      isSourceSwitchingRef.current = true;
      pendingSelectionRef.current = null;
      pendingTrackIdRef.current = null;

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

          runPendingSelection();
        },
      });
      retryLoadRef.current = () => selectTrack(index, true);
      loadPlaylist();
    },
    [
      playlistUrl,
      clearLoadTimer,
      clearPlaybackTimer,
      startLoadTimer,
      runPendingSelection,
      setCurrentTime,
      setCurrentTrack,
      setDuration,
      setPlaybackMode,
      setPlaying,
    ]
  );

  const controls = useSoundCloudControls({
    widgetRef,
    selectTrack,
    pendingTrackIdRef,
  });

  useEffect(() => {
    hasLoadedPlaylistRef.current = false;
    setIsReady(false);
    setPlaylistStatus('loading');

    const soundCloud = window.SC;

    if (!iframeElement) {
      widgetRef.current = null;
      return;
    }

    if (!soundCloud) {
      widgetRef.current = null;
      setPlaylistStatus('error');
      setWidgetError('SoundCloud 재생 기능을 불러오지 못했습니다. 페이지를 새로고침해 주세요.');
      return;
    }

    const widget = soundCloud.Widget(iframeElement);
    const events = soundCloud.Widget.Events;
    let playlistRetryTimer: number | undefined;
    const initialTransitionId = ++transitionIdRef.current;

    widgetRef.current = widget;
    playbackTimedOutRef.current = false;
    setWidgetError(null);
    startLoadTimer(initialTransitionId);

    const updateDuration = () => {
      if (pendingTrackIdRef.current !== null) return;
      const id = transitionIdRef.current;
      const versionAtRequest = latestRequestVersionRef.current;

      widget.getDuration((durationMs) => {
        if (latestRequestVersionRef.current !== versionAtRequest) return;

        if (
          widgetRef.current !== widget ||
          transitionIdRef.current !== id ||
          isSourceSwitchingRef.current ||
          pendingTrackIdRef.current !== null
        ) return;

        if (!isNonNegativeFiniteNumber(durationMs)) {
          return;
        }

        setDuration(durationMs / 1000);
      });
    };

    const updateCurrentTrack = (
      updateGlobalTrack: boolean,
      updatePlaylistTrack: boolean,
      fromPlayEvent = false
    ) => {
      const id = transitionIdRef.current;
      const versionAtRequest = latestRequestVersionRef.current;

      widget.getCurrentSound((sound) => {
        if (latestRequestVersionRef.current !== versionAtRequest) return;
        if (widgetRef.current !== widget || transitionIdRef.current !== id || isSourceSwitchingRef.current) return;
        const nextTrack = mapSoundCloudWidgetTrack(sound);

        const pendingTrackId = pendingTrackIdRef.current;

        if (pendingTrackId !== null) {
          if (!fromPlayEvent || !nextTrack) return;
          if (String(nextTrack.id) !== String(pendingTrackId)) return;

          clearPlaybackTimer();
          pendingTrackIdRef.current = null;

          setCurrentTime(0);
          setDuration(nextTrack.durationMs / 1000);
          setPlaying(true);
          updateDuration();
        }

        if (updatePlaylistTrack) {
          setWidgetTrack(nextTrack);
        }

        if (updateGlobalTrack) {
          setCurrentTrack(nextTrack);
        }
      });
    };

    const updatePlaylistTracks = (
      retryCount = 0,
      id = transitionIdRef.current
    ) => {
      if (
        widgetRef.current !== widget ||
        transitionIdRef.current !== id ||
        isSourceSwitchingRef.current
      ) {
        return;
      }

      widget.getSounds((sounds) => {
        if (widgetRef.current !== widget) return;

        if (transitionIdRef.current !== id || isSourceSwitchingRef.current) return;

        if (usePlayerStore.getState().playbackMode !== 'playlist') return;

        if (!Array.isArray(sounds)) {
          if (retryCount < PLAYLIST_LOAD_MAX_RETRIES) {
            playlistRetryTimer = window.setTimeout(
              () => updatePlaylistTracks(retryCount + 1, id),
              PLAYLIST_LOAD_RETRY_DELAY_MS
            );
            return;
          }

          failLoad(id);
          return;
        }

        const tracks = sounds.map(mapSoundCloudWidgetTrack).filter(isPlayerTrack);
        const hasPartialTracks = sounds.length === 0 || tracks.length < sounds.length;

        if (hasPartialTracks && retryCount < PLAYLIST_LOAD_MAX_RETRIES) {
          playlistRetryTimer = window.setTimeout(
            () => updatePlaylistTracks(retryCount + 1, id),
            PLAYLIST_LOAD_RETRY_DELAY_MS
          );
          return;
        }

        if (tracks.length < sounds.length) {
          failLoad(id);
          return;
        }

        clearLoadTimer();
        hasLoadedPlaylistRef.current = true;
        setPlaylist(tracks);
        setPlaylistStatus(tracks.length === 0 ? 'empty' : 'ready');
      });
    };

    const handleReady = () => {
      if (playbackTimedOutRef.current) return;

      if (bookmarkRequestRef.current?.reported) return;
      if (widgetRef.current !== widget || isSourceSwitchingRef.current) return;

      setWidgetError(null);

      const playbackMode = usePlayerStore.getState().playbackMode;
      const isPlaylistMode = playbackMode === 'playlist';

      setIsReady(true);
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
      if (widgetRef.current !== widget) return;

      if (playbackTimedOutRef.current) {
        widget.pause();
        return;
      }

      if (bookmarkRequestRef.current?.reported) return;
      if (isSourceSwitchingRef.current) return;

      const playbackMode = usePlayerStore.getState().playbackMode;

      latestRequestVersionRef.current += 1;
      const isWaitingForTrack = pendingTrackIdRef.current !== null;

      if (!isWaitingForTrack) setPlaying(true);

      updateCurrentTrack(true, playbackMode === 'playlist', true);

      if (!isWaitingForTrack) updateDuration();
    };

    const handlePause = () => {
      if (widgetRef.current !== widget || isSourceSwitchingRef.current) return;
      latestRequestVersionRef.current += 1;
      setPlaying(false);
    };

    const handleFinish = () => {
      const playbackMode = usePlayerStore.getState().playbackMode;

      if (playbackMode !== 'single') return;

      widget.seekTo(0);
      setCurrentTime(0);
      setPlaying(false);
    };

    const handlePlayProgress = (event?: unknown) => {
      if (
        playbackTimedOutRef.current ||
        bookmarkRequestRef.current?.reported ||
        pendingTrackIdRef.current !== null ||
        !isRecord(event) ||
        !isNonNegativeFiniteNumber(event.currentPosition) ||
        widgetRef.current !== widget ||
        isSourceSwitchingRef.current
      ) return;

      setCurrentTime(event.currentPosition / 1000);
    };

    const handleError = () => {
      if (playbackTimedOutRef.current) return;

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
      clearPlaybackTimer();
      retryLoadRef.current = null;
      bookmarkRequestRef.current = null;
      isSourceSwitchingRef.current = false;
      pendingSelectionRef.current = null;
      pendingTrackIdRef.current = null;

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
  }, [iframeElement, clearLoadTimer, clearPlaybackTimer, failLoad, setCurrentTime, setCurrentTrack, setDuration, setPlaying, setPlaylist, startLoadTimer]);

  const playSingleTrack = useCallback(
    (
      track: PlayerTrack,
      options: PlaySingleTrackOptions = {}
    ) => {
      const widget = widgetRef.current;
      const permalinkUrl = track.permalinkUrl;

      if (track.playbackStatus === 'blocked') {
        return;
      }

      if (!widget || !permalinkUrl) {
        options.onFailure?.();
        return;
      }

      const loadSingleTrack = () => {
        if (widgetRef.current !== widget) return;

        if (isSourceSwitchingRef.current) {
          pendingSelectionRef.current = loadSingleTrack;
          return;
        }

        clearPlaybackTimer();
        playbackTimedOutRef.current = false;
        pendingSelectionRef.current = null;
        pendingTrackIdRef.current = null;
        retryLoadRef.current = loadSingleTrack;
        isSourceSwitchingRef.current = true;

        const transitionId = ++transitionIdRef.current;

        bookmarkRequestRef.current = {
          id: transitionId,
          reported: false,
          onFailure: options.onFailure,
        };

        setWidgetError(null);
        startLoadTimer(transitionId);

        setPlaybackMode('single');
        setPlaying(false);
        setCurrentTrack(track);
        setCurrentTime(0);
        setDuration(track.durationMs / 1000);

        widget.load(permalinkUrl, {
          // 상태를 확인하기 전에는 재생하지 않음
          auto_play: false,

          callback: () => {
            if (widgetRef.current !== widget || transitionIdRef.current !== transitionId) return;

            widget.getCurrentSound((sound) => {
              if (
                widgetRef.current !== widget ||
                transitionIdRef.current !== transitionId
              ) {
                return;
              }

              const resolvedTrack = mapSoundCloudWidgetTrack(sound);

              if (!resolvedTrack || String(resolvedTrack.id) !== String(track.id)) {
                failLoad(transitionId);
                return;
              }

              clearLoadTimer();
              clearPlaybackTimer();
              isSourceSwitchingRef.current = false;
              retryLoadRef.current = null;

              setCurrentTrack(resolvedTrack);
              setCurrentTime(0);
              setDuration(resolvedTrack.durationMs / 1000);

              setPlaylistStatus(usePlayerStore.getState().tracks.length === 0 ? 'empty' : 'ready');

              // 최신 상태를 북마크 페이지에 전달
              options.onResolved?.(resolvedTrack);

              if (resolvedTrack.playbackStatus === 'blocked') {
                if (bookmarkRequestRef.current?.id === transitionId) {
                  bookmarkRequestRef.current.reported = true;
                }

                widget.pause();
                setPlaying(false);
                runPendingSelection();
                return;
              }

              widget.play();
              runPendingSelection();
            });
          },
        });
      };

      loadSingleTrack();
    },
    [
      clearLoadTimer,
      clearPlaybackTimer,
      failLoad,
      runPendingSelection,
      setCurrentTime,
      setCurrentTrack,
      setDuration,
      setPlaybackMode,
      setPlaying,
      startLoadTimer,
    ]
  );

  const retryLoad = useCallback(() => {
    if (!widgetError && playlistStatus !== 'error') return;

    if (!window.SC) {
      window.location.reload();
      return;
    }

    const retry = retryLoadRef.current;
    setWidgetError(null);

    if (retry) {
      retry();
      return;
    }

    if (!iframeElement) return;

    bookmarkRequestRef.current = null;
    setPlaybackMode('playlist');
    setIsReady(false);
    setPlaylistStatus('loading');
    iframeElement.src = iframeElement.src;
    startLoadTimer(++transitionIdRef.current);
  }, [iframeElement, playlistStatus, setPlaybackMode, startLoadTimer, widgetError]);

  return {
    iframeRef,
    widgetRef,
    isReady,
    playlistStatus,
    isPlaylistLoading: playlistStatus === 'loading',
    widgetError,
    retryLoad,
    ...controls,
    playSingleTrack,
    selectTrack,
    widgetTrack,
  };
}
