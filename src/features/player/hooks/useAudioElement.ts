import { useCallback, useEffect, useRef } from 'react';
import { selectCurrentTrack, usePlayerStore } from '../stores/usePlayerStore';

interface UseAudioElementOptions {
  onPlaybackError?: (error: unknown) => void;
}

export function useAudioElement({ onPlaybackError }: UseAudioElementOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isMuted = usePlayerStore((state) => state.isMuted);
  const setPlaying = usePlayerStore((state) => state.setPlaying);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const setDuration = usePlayerStore((state) => state.setDuration);
  const setMuted = usePlayerStore((state) => state.setMuted);
  const nextTrack = usePlayerStore((state) => state.nextTrack);

  const handlePlayError = useCallback(
    (error: unknown) => {
      if (error instanceof Error && error.name === 'AbortError') return;

      setPlaying(false);
      onPlaybackError?.(error);
    },
    [onPlaybackError, setPlaying]
  );

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => nextTrack();

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [nextTrack, setCurrentTime, setDuration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack?.audioUrl) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      return;
    }

    audio.src = currentTrack.audioUrl;
    audio.load();
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.audioUrl) return;

    if (isPlaying) {
      void audio.play().catch(handlePlayError);
    } else {
      audio.pause();
    }
  }, [currentTrack, handlePlayError, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = isMuted;
  }, [isMuted]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.audioUrl) return;

    try {
      await audio.play();
      setPlaying(true);
    } catch (error) {
      handlePlayError(error);
    }
  }, [currentTrack, handlePlayError, setPlaying]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, [setPlaying]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
      return;
    }

    void play();
  }, [isPlaying, pause, play]);

  const seek = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(time)) return;

      const nextTime = Math.min(Math.max(time, 0), audio.duration || 0);
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [setCurrentTime]
  );

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextMuted = !audio.muted;
    audio.muted = nextMuted;
    setMuted(nextMuted);
  }, [setMuted]);

  const rewindToStart = useCallback(() => {
    seek(0);
  }, [seek]);

  return {
    audioRef,
    play,
    pause,
    toggle,
    seek,
    toggleMute,
    rewindToStart,
  };
}
