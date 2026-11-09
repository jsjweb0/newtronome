import type { FieldValue, Timestamp } from 'firebase/firestore';
import type { PlayerTrack } from '../../player/types/player.types';

export interface SavedTrack extends Omit<PlayerTrack, 'playbackStatus'> {
  savedAt: Timestamp | null;
}

export type SavedTrackWrite = Omit<SavedTrack, 'savedAt'> & {
  savedAt: FieldValue;
};
