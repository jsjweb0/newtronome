import { useCallback, useEffect, useState } from 'react';
import { mapSoundCloudWidgetTrack } from '../../player/utils/mapSoundCloudWidgetTrack';
import type { PlayerTrack } from '../../player/types/player.types';

const SOUNDS_RETRY_DELAY_MS = 250;
const SOUNDS_MAX_RETRIES = 12;
const LOAD_TIMEOUT_MS = 15_000;

export type PlaylistTracksStatus = 'loading' | 'ready' | 'empty' | 'error';

const isPlayerTrack = (track: PlayerTrack | null): track is PlayerTrack => track !== null;

export const createPlaylistWidgetUrl = (soundCloudUrl: string) =>
  `https://w.soundcloud.com/player/?url=${encodeURIComponent(soundCloudUrl)}` +
  '&auto_play=false&show_artwork=true&show_comments=false';

/**
 * 플레이리스트 상세에서 곡 목록만 읽어 오는 훅.
 * 재생용 위젯(useSoundCloudWidget)과 Zustand 재생 목록은 건드리지 않고,
 * 페이지 전용 숨김 iframe 하나로 getSounds 결과만 가져온다.
 */
export function usePlaylistTracks(soundCloudUrl: string | null) {
  const [iframeElement, setIframeElement] = useState<HTMLIFrameElement | null>(null);
  const iframeRef = useCallback((element: HTMLIFrameElement | null) => {
    setIframeElement(element);
  }, []);

  const [result, setResult] = useState<{
    key: string;
    status: PlaylistTracksStatus;
    tracks: PlayerTrack[];
  } | null>(null);
  const [attempt, setAttempt] = useState(0);

  // 다른 플레이리스트로 바뀌거나 다시 시도하면 이전 결과는 무시
  const loadKey = `${soundCloudUrl ?? ''}#${attempt}`;
  const current = result?.key === loadKey ? result : null;

  useEffect(() => {
    if (!soundCloudUrl || !iframeElement) return;

    let isActive = true;
    let retryTimer: number | undefined;

    const timeoutTimer = window.setTimeout(() => {
      completeLoad('error');
    }, LOAD_TIMEOUT_MS);

    const completeLoad = (
      status: PlaylistTracksStatus,
      tracks: PlayerTrack[] = []
    ) => {
      if (!isActive) return;

      isActive = false;

      window.clearTimeout(timeoutTimer);
      window.clearTimeout(retryTimer);

      setResult({ key: loadKey, status, tracks })
    }

    const soundCloud = window.SC;
    if (!soundCloud) {
      completeLoad('error');
      return;
    }

    const widget = soundCloud.Widget(iframeElement);
    const { READY, ERROR } = soundCloud.Widget.Events;

    const readSounds = (retryCount = 0) => {
      if (!isActive) return;

      widget.getSounds((sounds) => {
        if (!isActive) return;

        const list = Array.isArray(sounds) ? sounds : null;
        const tracks = list ? list.map(mapSoundCloudWidgetTrack).filter(isPlayerTrack) : [];
        const isComplete = list !== null && list.length > 0 && tracks.length === list.length;

        if (!isComplete && retryCount < SOUNDS_MAX_RETRIES) {
          retryTimer = window.setTimeout(() => readSounds(retryCount + 1), SOUNDS_RETRY_DELAY_MS);
          return;
        }

        if (list === null || tracks.length < list.length) {
          completeLoad('error');
          return;
        }

        completeLoad(tracks.length === 0 ? 'empty' : 'ready', tracks);
      });
    };

    const handleReady = () => readSounds();
    const handleError = () => completeLoad('error');

    widget.bind(READY, handleReady);
    widget.bind(ERROR, handleError);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutTimer);
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);

      try {
        widget.unbind(READY);
        widget.unbind(ERROR);
      } catch {

      }
    };
  }, [iframeElement, loadKey, soundCloudUrl]);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  return {
    iframeRef,
    /** iframe을 다시 만들도록 key로 쓰는 값 */
    frameKey: loadKey,
    widgetUrl: soundCloudUrl ? createPlaylistWidgetUrl(soundCloudUrl) : null,
    status: current?.status ?? 'loading',
    tracks: current?.tracks ?? [],
    retry,
  };
}
