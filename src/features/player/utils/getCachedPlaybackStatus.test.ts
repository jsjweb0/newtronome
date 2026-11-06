import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import {
  getCachedPlaybackStatus,
  PLAYBACK_STATUS_CACHE_TTL_MS,
} from './getCachedPlaybackStatus';

const NOW = Date.UTC(2026, 10, 6);

describe('getCachedPlaybackStatus', () => {
  it('keeps a confirmed status checked less than 30 days ago', () => {
    expect(
      getCachedPlaybackStatus(
        {
          playbackStatus: 'blocked',
          playbackStatusCheckedAt: Timestamp.fromMillis(
            NOW - PLAYBACK_STATUS_CACHE_TTL_MS + 1
          ),
        },
        NOW
      )
    ).toBe('blocked');
  });

  it('treats a status checked exactly 30 days ago as unknown', () => {
    expect(
      getCachedPlaybackStatus(
        {
          playbackStatus: 'blocked',
          playbackStatusCheckedAt: Timestamp.fromMillis(
            NOW - PLAYBACK_STATUS_CACHE_TTL_MS
          ),
        },
        NOW
      )
    ).toBe('unknown');
  });

  it.each([
    { playbackStatus: undefined, playbackStatusCheckedAt: undefined },
    { playbackStatus: 'unknown' as const, playbackStatusCheckedAt: Timestamp.fromMillis(NOW) },
    { playbackStatus: 'allowed' as const, playbackStatusCheckedAt: null },
  ])('does not reuse incomplete or unknown cache data', (track) => {
    expect(getCachedPlaybackStatus(track, NOW)).toBe('unknown');
  });
});
