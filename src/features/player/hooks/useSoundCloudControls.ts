import { useCallback, type RefObject } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import type { SoundCloudWidgetInstance } from '../types/soundcloud-widget.types';
import { isNonNegativeFiniteNumber } from '../../../utils/numberValidation';

interface UseSoundCloudControlsParams {
    widgetRef: RefObject<
        SoundCloudWidgetInstance | null
    >;
    trackRequestIdRef: RefObject<number>;
}

export function useSoundCloudControls({
    widgetRef,
    trackRequestIdRef,
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

    const seek = useCallback((seconds: number) => {
        if (!isNonNegativeFiniteNumber(seconds)) {
            return;
        }

        widgetRef.current?.seekTo(seconds * 1000);
    }, [widgetRef]);

    const previousTrack = useCallback(() => {
        trackRequestIdRef.current += 1;
        widgetRef.current?.prev();
    }, [trackRequestIdRef, widgetRef]);

    const nextTrack = useCallback(() => {
        trackRequestIdRef.current += 1;
        widgetRef.current?.next();
    }, [trackRequestIdRef, widgetRef]);

    const rewindToStart = useCallback(() => {
        widgetRef.current?.seekTo(0);
    }, [widgetRef]);

    const playRandomTrack = useCallback(() => {
        const widget = widgetRef.current;
        if (!widget) return;

        widget.getSounds((sounds) => {
            if (!Array.isArray(sounds) || sounds.length === 0) {
                return;
            }

            const randomIndex = Math.floor(Math.random() * sounds.length);

            trackRequestIdRef.current += 1;
            widget.skip(randomIndex);
        });
    }, [trackRequestIdRef, widgetRef]);

    const toggleMute = useCallback(() => {
        const widget = widgetRef.current;
        if (!widget) return;

        const nextMuted = !isMuted;

        widget.setVolume(nextMuted ? 0 : 100);
        setMuted(nextMuted);
    }, [isMuted, setMuted, widgetRef]);

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
