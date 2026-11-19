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

  const getPendingTrackId = useCallback((): PlayerTrack['id'] | null => {
    const request = currentRequestRef.current;

    if (
      request?.kind === 'playlist' &&
      request.awaitingPlayConfirmation
    ) {
      return request.trackId;
    }

    return null;
  }, []);

  const pause = useCallback(() => {
    const request = currentRequestRef.current;

    if (request) {
      request.playAfterLoad = false;
    }

    widgetRef.current?.pause();
  }, []);

  const playbackLookupVersionRef = useRef(0);

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
    const state = usePlayerStore.getState();
    if (state.isPlaybackLoading) return;

    const request = currentRequestRef.current;
    if (request) request.playAfterLoad = !state.isPlaying;

    widgetRef.current?.toggle();
  }, []);

  const widgetLoadVersionRef = useRef(0);
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
    if (widgetLoadVersionRef.current !== id) return;

    const bookmark = bookmarkRequestRef.current;
    if (bookmark?.reported) return;

    const failedBookmark = bookmark?.id === id ? bookmark : null;
    if (failedBookmark) failedBookmark.reported = true;

    clearLoadTimer();
    clearPlaybackTimer();
    widgetLoadVersionRef.current += 1;
    setPlaybackLoading(false);

    const request = currentRequestRef.current;

    if (request?.kind === 'playlist') {
      request.awaitingPlayConfirmation = false;
    }

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
        playlistUrl,
        trackId: selectedTrack.id,
        index,
        playAfterLoad: true,
        awaitingPlayConfirmation: false,
      }

      currentRequestRef.current = request;

      if (
        playbackMode === 'playlist' &&
        !forceLoad &&
        !usePlayerStore.getState().isPlaybackLoading
      ) {
        playbackLookupVersionRef.current += 1;
        request.awaitingPlayConfirmation = true;

        clearPlaybackTimer();

        playbackTimerRef.current = window.setTimeout(() => {
          if (
            widgetRef.current !== widget ||
            currentRequestRef.current !== request
          ) {
            return;
          }

          playbackTimerRef.current = null;
          playbackTimedOutRef.current = true;

          request.awaitingPlayConfirmation = false;
          playbackLookupVersionRef.current += 1;

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

      const loadVersion = ++widgetLoadVersionRef.current;

      setWidgetError(null);
      setPlaylistStatus('loading');
      startLoadTimer(loadVersion);

      setPlaybackMode('playlist');
      setWidgetTrack(selectedTrack);
      setCurrentTrack(selectedTrack);
      setPlaying(false);
      setCurrentTime(0);
      setDuration(selectedTrack.durationMs / 1000);

      const confirmLoadedTrack = () => {
        if (
          widgetRef.current !== widget ||
          widgetLoadVersionRef.current !== loadVersion ||
          currentRequestRef.current !== request ||
          !usePlayerStore.getState().isPlaybackLoading
        ) {
          return;
        }

        clearPlaybackTimer();
        playbackTimerRef.current = window.setTimeout(
          confirmLoadedTrack,
          PLAYLIST_LOAD_RETRY_DELAY_MS
        );

        widget.getCurrentSound((sound) => {
          if (
            widgetRef.current !== widget ||
            widgetLoadVersionRef.current !== loadVersion ||
            currentRequestRef.current !== request ||
            !usePlayerStore.getState().isPlaybackLoading
          ) {
            return;
          }

          if (
            !isRecord(sound) ||
            String(sound.id) !== String(request.trackId) ||
            sound.policy === 'BLOCK' ||
            sound.playable === false
          ) {
            failLoad(loadVersion);
            return;
          }

          const resolvedTrack = mapSoundCloudWidgetTrack(sound);

          // 같은 곡의 필수 정보가 아직 없으면 다음 조회를 기다린다.
          if (!resolvedTrack) return;

          clearLoadTimer();
          clearPlaybackTimer();
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
            widgetLoadVersionRef.current === loadVersion &&
            currentRequestRef.current === request &&
            request.playAfterLoad
          ) {
            widget.play();
          }
        });
      };

      const loadPlaylist = () => widget.load(request.playlistUrl, {
        auto_play: false,
        start_track: request.index,
        callback: confirmLoadedTrack,
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

  const getNavigationTrackId = useCallback(() => {
    return (
      getPendingTrackId() ??
      usePlayerStore.getState().currentTrack?.id ??
      null
    );
  }, [getPendingTrackId]);

  const controls = useSoundCloudControls({
    widgetRef,
    selectTrack,
    getNavigationTrackId,
  });
  const { play: playWidget } = controls;

  const play = useCallback(() => {
    const request = currentRequestRef.current;
    if (request) request.playAfterLoad = true;

    playWidget();
  }, [playWidget]);

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
    const initialLoadVersion = ++widgetLoadVersionRef.current;

    widgetRef.current = widget;
    playbackTimedOutRef.current = false;
    setWidgetError(null);
    startLoadTimer(initialLoadVersion);

    const updateDuration = () => {
      if (getPendingTrackId() !== null) return;
      const id = widgetLoadVersionRef.current;
      const versionAtRequest = playbackLookupVersionRef.current;

      widget.getDuration((durationMs) => {
        if (playbackLookupVersionRef.current !== versionAtRequest) return;

        if (
          widgetRef.current !== widget ||
          widgetLoadVersionRef.current !== id ||
          usePlayerStore.getState().isPlaybackLoading ||
          getPendingTrackId() !== null
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
      const id = widgetLoadVersionRef.current;
      const versionAtRequest = playbackLookupVersionRef.current;

      widget.getCurrentSound((sound) => {
        if (playbackLookupVersionRef.current !== versionAtRequest) return;
        if (
          widgetRef.current !== widget ||
          widgetLoadVersionRef.current !== id ||
          usePlayerStore.getState().isPlaybackLoading
        ) {
          return;
        }
        const nextTrack = mapSoundCloudWidgetTrack(sound);

        const request = currentRequestRef.current;

        if (
          request?.kind === 'playlist' &&
          request.awaitingPlayConfirmation
        ) {
          if (!fromPlayEvent || !nextTrack) return;
          if (String(nextTrack.id) !== String(request.trackId)) return;

          clearPlaybackTimer();
          request.awaitingPlayConfirmation = false;

          setCurrentTime(0);
          setDuration(nextTrack.durationMs / 1000);
          if (request.playAfterLoad) {
            setPlaying(true);
          }
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
      id = widgetLoadVersionRef.current
    ) => {
      if (
        widgetRef.current !== widget ||
        widgetLoadVersionRef.current !== id ||
        usePlayerStore.getState().isPlaybackLoading
      ) {
        return;
      }

      widget.getSounds((sounds) => {
        if (widgetRef.current !== widget) return;

        if (widgetLoadVersionRef.current !== id || usePlayerStore.getState().isPlaybackLoading) return;

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

      playbackLookupVersionRef.current += 1;
      const isWaitingForTrack = getPendingTrackId() !== null;

      if (!isWaitingForTrack) setPlaying(true);

      updateCurrentTrack(true, playbackMode === 'playlist', true);

      if (!isWaitingForTrack) updateDuration();
    };

    const handlePause = () => {
      if (widgetRef.current !== widget || usePlayerStore.getState().isPlaybackLoading) return;
      playbackLookupVersionRef.current += 1;
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
        getPendingTrackId() !== null ||
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

      failLoad(widgetLoadVersionRef.current);
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
      widgetLoadVersionRef.current += 1;
      clearLoadTimer();
      clearPlaybackTimer();
      retryLoadRef.current = null;
      bookmarkRequestRef.current = null;
      setPlaybackLoading(false);
      currentRequestRef.current = null;

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
    getPendingTrackId,
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
        retryLoadRef.current = loadSingleTrack;
        setPlaybackLoading(true);

        const loadVersion = ++widgetLoadVersionRef.current;

        const request: TrackSelectionRequest = {
          kind: 'single',
          track,
          options,
          playAfterLoad: true,
        }

        currentRequestRef.current = request;

        bookmarkRequestRef.current = {
          id: loadVersion,
          reported: false,
          onFailure: request.options?.onFailure,
        };

        setWidgetError(null);
        startLoadTimer(loadVersion);

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
              widgetLoadVersionRef.current !== loadVersion ||
              currentRequestRef.current !== request
            ) return;

            widget.getCurrentSound((sound) => {
              if (
                widgetRef.current !== widget ||
                widgetLoadVersionRef.current !== loadVersion ||
                currentRequestRef.current !== request
              ) {
                return;
              }

              const resolvedTrack = mapSoundCloudWidgetTrack(sound);

              if (
                !resolvedTrack ||
                String(resolvedTrack.id) !== String(request.track.id)
              ) {
                failLoad(loadVersion);
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
                if (bookmarkRequestRef.current?.id === loadVersion) {
                  bookmarkRequestRef.current.reported = true;
                }

                widget.pause();
                setPlaying(false);
                return;
              }

              if (
                widgetRef.current === widget &&
                widgetLoadVersionRef.current === loadVersion &&
                currentRequestRef.current === request &&
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
    startLoadTimer(++widgetLoadVersionRef.current);
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
    play,
    pause,
    toggle,
    playSingleTrack,
    selectTrack,
    widgetTrack,
    frameVersion,
    reloadPlaylistFrame
  };
}
