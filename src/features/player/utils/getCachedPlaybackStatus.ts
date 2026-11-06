import type { Timestamp } from 'firebase/firestore';
import type { PlaybackStatus } from '../../player/types/player.types';

export const PLAYBACK_STATUS_CACHE_TTL_MS =
    30 * 24 * 60 * 60 * 1000;

type CachedPlaybackStatus = {
    playbackStatus?: PlaybackStatus;
    playbackStatusCheckedAt?: Timestamp | null;
};

export function getCachedPlaybackStatus(
    track: CachedPlaybackStatus,
    now = Date.now()
): PlaybackStatus {
    const { playbackStatus, playbackStatusCheckedAt } = track;

    if (!playbackStatus || playbackStatus === 'unknown') {
        return 'unknown';
    }

    if (!playbackStatusCheckedAt) {
        return 'unknown';
    }

    const elapsed = now - playbackStatusCheckedAt.toMillis();

    return elapsed < PLAYBACK_STATUS_CACHE_TTL_MS
        ? playbackStatus
        : 'unknown';
}