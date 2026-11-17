import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import type {
  SoundCloudWidgetInstance,
} from '../types/soundcloud-widget.types';
import { mapSoundCloudWidgetTrack } from '../utils/mapSoundCloudWidgetTrack';
import type {
  PlayerTrack,
  PlaySingleTrackOptions,
  TrackSelectionRequest,
} from '../types/player.types';
import { isNonNegativeFiniteNumber } from '../../../utils/numberValidation';
import { useSoundCloudControls } from './useSoundCloudControls';

const isRecord = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const PLAYLIST_LOAD_RETRY_DELAY_MS = 250;
const PLAYLIST_LOAD_MAX_RETRIES = 12;
const WIDGET_LOAD_TIMEOUT_MS = 10_000;
const TRACK_PLAY_CONFIRM_TIMEOUT_MS = 10_000;
type PlaylistStatus = 'loading' | 'ready' | 'empty' | 'error';

const isPlayerTrack = (track: PlayerTrack | null): track is PlayerTrack => track !== null;

export function useSoundCloudWidget(playlistUrl: string) {
  const [iframeElement, setIframeElement] = useState<HTMLIFrameElement | null>(null);
  const iframeRef = useCallback((element: HTMLIFrameElement | null) => {
    setIframeElement(element);
  }, []);

  const widgetRef = useRef<SoundCloudWidgetInstance | null>(null);
  const currentRequestRef = useRef<TrackSelectionRequest | null>(null);

  const pause = useCallback(() => {
    const request = currentRequestRef.current;

    if (request) {
      request.playAfterLoad = false;
    }

    widgetRef.current?.pause();
  }, []);

  const latestRequestVersionRef = useRef(0);
  const pendingTrackIdRef = useRef<PlayerTrack['id'] | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [playlistStatus, setPlaylistStatus] = useState<PlaylistStatus>('loading');
  const [widgetTrack, setWidgetTrack] = useState<PlayerTrack | null>(null);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  const [frameVersion, setFrameVersion] = useState(0);

  const reloadPlaylistFrame = useCallback(() => {
    setFrameVersion((version) => version + 1);
  }, []);

  const setPlaying = usePlayerStore((state) => state.setPlaying);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const setDuration = usePlayerStore((state) => state.setDuration);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setPlaylist = usePlayerStore((state) => state.setPlaylist);
  const setPlaybackMode = usePlayerStore((state) => state.setPlaybackMode);

  const isPlaybackLoading = usePlayerStore((state) => state.isPlaybackLoading);
  const setPlaybackLoading = usePlayerStore((state) => state.setPlaybackLoading);

  const toggle = useCallback(() => {
    if (usePlayerStore.getState().isPlaybackLoading) return;

    widgetRef.current?.toggle();
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
    setPlaybackLoading(false);
    pendingTrackIdRef.current = null;

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
  }, [
    clearLoadTimer,
    clearPlaybackTimer,
    setPlaying,
    setCurrentTrack,
    setCurrentTime,
    setDuration,
    setPlaybackLoading,
  ]);

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

      playbackTimedOutRef.current = false;
      setWidgetError(null);
      retryLoadRef.current = null;

      bookmarkRequestRef.current = null;

      const request: TrackSelectionRequest = {
        kind: 'playlist',
        requestKey: (currentRequestRef.current?.requestKey ?? 0) + 1,
        playlistUrl,
        trackId: selectedTrack.id,
        index,
        playAfterLoad: true,
      }

      currentRequestRef.current = request;

      if (
        playbackMode === 'playlist' &&
        !forceLoad &&
        !usePlayerStore.getState().isPlaybackLoading
      ) {
        latestRequestVersionRef.current += 1;
        pendingTrackIdRef.current = request.trackId;

        clearPlaybackTimer();

        playbackTimerRef.current = window.setTimeout(() => {
          if (
            widgetRef.current !== widget ||
            currentRequestRef.current?.requestKey !== request.requestKey
          ) {
            return;
          }

          playbackTimerRef.current = null;
          playbackTimedOutRef.current = true;

          pendingTrackIdRef.current = null;
          latestRequestVersionRef.current += 1;

          widget.pause();
          setPlaying(false);

          setWidgetError(
            '곡의 재생을 확인하지 못했습니다. 다시 시도해 주세요.'
          );

          retryLoadRef.current = () => selectTrack(request.index, true);
        }, TRACK_PLAY_CONFIRM_TIMEOUT_MS);

        widget.skip(request.index);
        return;
      }

      clearPlaybackTimer();
      setPlaybackLoading(true);
      pendingTrackIdRef.current = null;

      const transitionId = ++transitionIdRef.current;

      setWidgetError(null);
      setPlaylistStatus('loading');
      startLoadTimer(transitionId);

      setPlaybackMode('playlist');
      setWidgetTrack(selectedTrack);
      setCurrentTrack(selectedTrack);
      setPlaying(false);
      setCurrentTime(0);
      setDuration(selectedTrack.durationMs / 1000);

      const loadPlaylist = () => widget.load(request.playlistUrl, {
        auto_play: false,
        start_track: request.index,

        callback: () => {
          if (
            widgetRef.current !== widget ||
            transitionIdRef.current !== transitionId ||
            currentRequestRef.current?.requestKey !== request.requestKey
          ) {
            return;
          }

          widget.getCurrentSound((sound) => {
            if (
              widgetRef.current !== widget ||
              transitionIdRef.current !== transitionId ||
              currentRequestRef.current?.requestKey !== request.requestKey
            ) {
              return;
            }

            const resolvedTrack = mapSoundCloudWidgetTrack(sound);

            if (
              !resolvedTrack ||
              String(resolvedTrack.id) !== String(request.trackId) ||
              resolvedTrack.playbackStatus === 'blocked'
            ) {
              failLoad(transitionId);
              return;
            }

            clearLoadTimer();
            setPlaybackLoading(false);
            retryLoadRef.current = null;

            setWidgetTrack(resolvedTrack);
            setCurrentTrack(resolvedTrack);
            setDuration(resolvedTrack.durationMs / 1000);

            setPlaylistStatus(
              usePlayerStore.getState().tracks.length === 0 ? 'empty' : 'ready'
            );

            if (
              widgetRef.current === widget &&
              transitionIdRef.current === transitionId &&
              currentRequestRef.current?.requestKey === request.requestKey &&
              request.playAfterLoad
            ) {
              widget.play();
            }
          });
        },
      });

      retryLoadRef.current = () => selectTrack(request.index, true);
      loadPlaylist();
    },
    [
      playlistUrl,
      failLoad,
      clearLoadTimer,
      clearPlaybackTimer,
      startLoadTimer,
      setCurrentTime,
      setCurrentTrack,
      setDuration,
      setPlaybackMode,
      setPlaying,
      setPlaybackLoading,
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
          usePlayerStore.getState().isPlaybackLoading ||
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
        if (
          widgetRef.current !== widget ||
          transitionIdRef.current !== id ||
          usePlayerStore.getState().isPlaybackLoading
        ) {
          return;
        }
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
        usePlayerStore.getState().isPlaybackLoading
      ) {
        return;
      }

      widget.getSounds((sounds) => {
        if (widgetRef.current !== widget) return;

        if (transitionIdRef.current !== id || usePlayerStore.getState().isPlaybackLoading) return;

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
      if (widgetRef.current !== widget || usePlayerStore.getState().isPlaybackLoading) return;

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
      if (usePlayerStore.getState().isPlaybackLoading) return;

      const playbackMode = usePlayerStore.getState().playbackMode;

      latestRequestVersionRef.current += 1;
      const isWaitingForTrack = pendingTrackIdRef.current !== null;

      if (!isWaitingForTrack) setPlaying(true);

      updateCurrentTrack(true, playbackMode === 'playlist', true);

      if (!isWaitingForTrack) updateDuration();
    };

    const handlePause = () => {
      if (widgetRef.current !== widget || usePlayerStore.getState().isPlaybackLoading) return;
      latestRequestVersionRef.current += 1;
      setPlaying(false);
    };

    const handleFinish = () => {
      if (
        widgetRef.current !== widget ||
        usePlayerStore.getState().isPlaybackLoading ||
        bookmarkRequestRef.current?.reported
      ) {
        return;
      }

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
        usePlayerStore.getState().isPlaybackLoading
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
      setPlaybackLoading(false);
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
  }, [
    iframeElement,
    clearLoadTimer,
    clearPlaybackTimer,
    failLoad,
    setCurrentTime,
    setCurrentTrack,
    setDuration,
    setPlaying,
    setPlaylist,
    startLoadTimer,
    setPlaybackLoading,
  ]);

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

        clearPlaybackTimer();
        playbackTimedOutRef.current = false;
        pendingTrackIdRef.current = null;
        retryLoadRef.current = loadSingleTrack;
        setPlaybackLoading(true);

        const transitionId = ++transitionIdRef.current;

        const request: TrackSelectionRequest = {
          kind: 'single',
          requestKey: (currentRequestRef.current?.requestKey ?? 0) + 1,
          track,
          options,
          playAfterLoad: true,
        }

        currentRequestRef.current = request;

        bookmarkRequestRef.current = {
          id: transitionId,
          reported: false,
          onFailure: request.options?.onFailure,
        };

        setWidgetError(null);
        startLoadTimer(transitionId);

        setPlaybackMode('single');
        setPlaying(false);
        setCurrentTrack(request.track);
        setCurrentTime(0);
        setDuration(request.track.durationMs / 1000);

        widget.load(permalinkUrl, {
          auto_play: false,

          callback: () => {
            if (
              widgetRef.current !== widget ||
              transitionIdRef.current !== transitionId ||
              currentRequestRef.current?.requestKey !== request.requestKey
            ) return;

            widget.getCurrentSound((sound) => {
              if (
                widgetRef.current !== widget ||
                transitionIdRef.current !== transitionId ||
                currentRequestRef.current?.requestKey !== request.requestKey
              ) {
                return;
              }

              const resolvedTrack = mapSoundCloudWidgetTrack(sound);

              if (
                !resolvedTrack ||
                String(resolvedTrack.id) !== String(request.track.id)
              ) {
                failLoad(transitionId);
                return;
              }

              clearLoadTimer();
              clearPlaybackTimer();
              setPlaybackLoading(false);
              retryLoadRef.current = null;

              setCurrentTrack(resolvedTrack);
              setCurrentTime(0);
              setDuration(resolvedTrack.durationMs / 1000);

              setPlaylistStatus(usePlayerStore.getState().tracks.length === 0 ? 'empty' : 'ready');

              // 최신 상태를 북마크 페이지에 전달
              request.options?.onResolved?.(resolvedTrack);

              if (resolvedTrack.playbackStatus === 'blocked') {
                if (bookmarkRequestRef.current?.id === transitionId) {
                  bookmarkRequestRef.current.reported = true;
                }

                widget.pause();
                setPlaying(false);
                return;
              }

              if (
                widgetRef.current === widget &&
                transitionIdRef.current === transitionId &&
                currentRequestRef.current?.requestKey === request.requestKey &&
                request.playAfterLoad
              ) {
                widget.play();
              }
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
      setCurrentTime,
      setCurrentTrack,
      setDuration,
      setPlaybackMode,
      setPlaying,
      startLoadTimer,
      setPlaybackLoading,
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
  }, [
    iframeElement,
    playlistStatus,
    setPlaybackMode,
    startLoadTimer,
    widgetError
  ]);

  return {
    iframeRef,
    widgetRef,
    isPlaybackLoading,
    isReady,
    playlistStatus,
    isPlaylistLoading: playlistStatus === 'loading',
    widgetError,
    retryLoad,
    ...controls,
    pause,
    toggle,
    playSingleTrack,
    selectTrack,
    widgetTrack,
    frameVersion,
    reloadPlaylistFrame
  };
}
