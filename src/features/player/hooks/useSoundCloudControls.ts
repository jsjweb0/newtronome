import { useCallback, type RefObject } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import type { SoundCloudWidgetInstance } from '../types/soundcloud-widget.types';
import { isNonNegativeFiniteNumber } from '../../../utils/numberValidation';
import type { PlayerTrack } from '../types/player.types';

interface UseSoundCloudControlsParams {
    widgetRef: RefObject<SoundCloudWidgetInstance | null>;
    selectTrack: (index: number) => void;
    pendingTrackIdRef: RefObject<PlayerTrack['id'] | null>;
}

export function useSoundCloudControls({
    widgetRef,
    selectTrack,
    pendingTrackIdRef,
}: UseSoundCloudControlsParams) {
    const isMuted = usePlayerStore(
        (state) => state.isMuted
    );
    const setMuted = usePlayerStore(
        (state) => state.setMuted
    );

    const play = useCallback(() => {
        widgetRef.current?.play();
    }, [widgetRef]);

    const pause = useCallback(() => {
        widgetRef.current?.pause();
    }, [widgetRef]);

    const toggle = useCallback(() => {
        widgetRef.current?.toggle();
    }, [widgetRef]);

    const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);

    const seek = useCallback((seconds: number) => {
        if (!isNonNegativeFiniteNumber(seconds)) return;

        const widget = widgetRef.current;
        if (!widget) return;

        widget.seekTo(seconds * 1000);
        setCurrentTime(seconds);
    }, [setCurrentTime, widgetRef]);

    const rewindToStart = useCallback(() => {
        widgetRef.current?.seekTo(0);
    }, [widgetRef]);

    const toggleMute = useCallback(() => {
        const widget = widgetRef.current;
        if (!widget) return;

        const nextMuted = !isMuted;

        widget.setVolume(nextMuted ? 0 : 100);
        setMuted(nextMuted);
    }, [isMuted, setMuted, widgetRef]);

    const moveTrack = useCallback((direction: 'previous' | 'next' | 'random') => {
        const widget = widgetRef.current;
        const { tracks, currentTrack, playbackMode } = usePlayerStore.getState();

        if (!widget || playbackMode !== 'playlist') return;

        const navigationTrackId = pendingTrackIdRef.current ?? currentTrack?.id;
        const currentIndex = tracks.findIndex(
            (track) => navigationTrackId != null && String(track.id) === String(navigationTrackId)
        );

        const candidates: number[] = [];

        tracks.forEach((track, index) => {
            if (track.playbackStatus === 'blocked' || index === currentIndex) return;

            if (direction === 'previous' && index >= currentIndex) return;
            if (direction === 'next' && index <= currentIndex) return;

            candidates.push(index);
        });

        if (candidates.length === 0) {
            widget.pause();
            return;
        }

        let position = 0;

        if (direction === 'previous') {
            position = candidates.length - 1;
        } else if (direction === 'random') {
            position = Math.floor(Math.random() * candidates.length);
        }

        selectTrack(candidates[position]);
    }, [selectTrack, widgetRef, pendingTrackIdRef]);

    const previousTrack = useCallback(() => moveTrack('previous'), [moveTrack]);
    const nextTrack = useCallback(() => moveTrack('next'), [moveTrack]);
    const playRandomTrack = useCallback(() => moveTrack('random'), [moveTrack]);

    return {
        play,
        pause,
        toggle,
        seek,
        previousTrack,
        nextTrack,
        rewindToStart,
        playRandomTrack,
        toggleMute,
    };
}
