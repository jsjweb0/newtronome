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

const isPlayerTrack = (track: PlayerTrack | null): track is PlayerTrack => track !== null;

export function useSoundCloudWidget(playlistUrl: string) {
  const [iframeElement, setIframeElement] = useState<HTMLIFrameElement | null>(null);

  const iframeRef = useCallback((element: HTMLIFrameElement | null) => {
    setIframeElement(element);
  }, []);

  const widgetRef = useRef<SoundCloudWidgetInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(true);
  const [widgetTrack, setWidgetTrack] = useState<PlayerTrack | null>(null);
  const [widgetIsPlaying, setWidgetIsPlaying] = useState(false);

  const isMuted = usePlayerStore((state) => state.isMuted);

  const setPlaying = usePlayerStore((state) => state.setPlaying);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const setDuration = usePlayerStore((state) => state.setDuration);
  const setMuted = usePlayerStore((state) => state.setMuted);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setPlaylist = usePlayerStore((state) => state.setPlaylist);
  const setPlaybackMode = usePlayerStore((state) => state.setPlaybackMode);

  const isSourceSwitchingRef = useRef(false);

  const selectTrack = useCallback(
    (index: number) => {
      const widget = widgetRef.current;
      if (!widget) return;

      const { playbackMode, tracks } = usePlayerStore.getState();

      if (index < 0 || index >= tracks.length) return;

      const selectedTrack = tracks[index];

      if (playbackMode === 'playlist') {
        widget.skip(index);
        return;
      }

      if (isSourceSwitchingRef.current) return;

      isSourceSwitchingRef.current = true;

      // 선택한 일반 플레이리스트 곡으로 UI를 즉시 갱신
      setPlaybackMode('playlist');
      setWidgetTrack(selectedTrack);
      setCurrentTrack(selectedTrack);
      setPlaying(false);
      setCurrentTime(0);
      setDuration(selectedTrack.durationMs / 1000);

      widget.load(playlistUrl, {
        auto_play: true,
        start_track: index,
        callback: () => {
          isSourceSwitchingRef.current = false;
        },
      });
    },
    [
      playlistUrl,
      setCurrentTime,
      setCurrentTrack,
      setDuration,
      setPlaybackMode,
      setPlaying,
    ]
  );

  useEffect(() => {
    setIsReady(false);
    setIsPlaylistLoading(true);

    const soundCloud = window.SC;

    if (!iframeElement || !soundCloud) {
      widgetRef.current = null;
      return;
    }

    const widget = soundCloud.Widget(iframeElement);
    const events = soundCloud.Widget.Events;
    let playlistRetryTimer: number | undefined;

    widgetRef.current = widget;

    const updateDuration = () => {
      widget.getDuration((durationMs) => {
        setDuration(durationMs / 1000);
      });
    };

    const updateCurrentTrack = (
      updateGlobalTrack: boolean,
      updatePlaylistTrack: boolean
    ) => {
      widget.getCurrentSound((sound) => {
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
      widget.getSounds((sounds) => {
        if (widgetRef.current !== widget) return;
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

        setPlaylist(tracks, 0);
        setIsPlaylistLoading(false);
      });
    };

    const handleReady = () => {
      isSourceSwitchingRef.current = false;

      const playbackMode = usePlayerStore.getState().playbackMode;
      const isPlaylistMode = playbackMode === 'playlist';

      setIsReady(true);
      setWidgetIsPlaying(false);
      updateCurrentTrack(true, isPlaylistMode);
      updateDuration();

      if (isPlaylistMode) {
        updatePlaylistTracks();
      } else {
        setIsPlaylistLoading(false);
      }
    };

    const handlePlay = () => {
      const playbackMode = usePlayerStore.getState().playbackMode;

      setWidgetIsPlaying(true);
      setPlaying(true);
      updateCurrentTrack(true, playbackMode === 'playlist');
      updateDuration();
    };

    const handlePause = () => {
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
      if (!event) return;

      setCurrentTime(event.currentPosition / 1000);
    };

    widget.bind(events.READY, handleReady);
    widget.bind(events.PLAY, handlePlay);
    widget.bind(events.PAUSE, handlePause);
    widget.bind(events.FINISH, handleFinish);
    widget.bind(events.PLAY_PROGRESS, handlePlayProgress);

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
      if (playlistRetryTimer !== undefined) {
        window.clearTimeout(playlistRetryTimer);
      }

      safelyUnbind(events.READY);
      safelyUnbind(events.PLAY);
      safelyUnbind(events.PAUSE);
      safelyUnbind(events.FINISH);
      safelyUnbind(events.PLAY_PROGRESS);

      if (widgetRef.current === widget) {
        widgetRef.current = null;
      }
    };
  }, [iframeElement, setCurrentTime, setCurrentTrack, setDuration, setPlaying, setPlaylist]);

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

        setPlaybackMode('bookmark');
        setPlaying(false);
        setCurrentTrack(track);
        setCurrentTime(0);
        setDuration(track.durationMs / 1000);

        widget.load(permalinkUrl, {
          auto_play: true,
          callback: () => {
            isSourceSwitchingRef.current = false;
          },
        });
      };

      loadBookmarkTrack();
    },
    [
      setCurrentTime,
      setCurrentTrack,
      setDuration,
      setPlaybackMode,
      setPlaying,
    ]
  );

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
    isPlaylistLoading,
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
