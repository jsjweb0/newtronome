import type { FieldValue, Timestamp } from 'firebase/firestore';
import type { PlaybackStatus, PlayerTrack } from '../../player/types/player.types';

export interface SavedTrack extends PlayerTrack {
  savedAt: Timestamp | null;

  playbackStatus?: PlaybackStatus;
  playbackStatusCheckedAt?: Timestamp | null;
}

export type SavedTrackWrite = Omit<
  SavedTrack,
  'savedAt' | 'playbackStatusCheckedAt'
> & {
  savedAt: FieldValue;
  playbackStatusCheckedAt?: FieldValue;
};
