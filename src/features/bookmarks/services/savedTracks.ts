import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type { PlayerTrack } from '../../player/types/player.types';
import type { SavedTrack, SavedTrackWrite } from '../types/saved-track.types';

type SavedTrackStatusCallback = (isSaved: boolean) => void;
type SavedTracksCallback = (tracks: SavedTrack[]) => void;
type SavedTracksErrorCallback = (error: Error) => void;

const getSavedTrackRef = (uid: string, trackId: PlayerTrack['id']) =>
  doc(db, 'users', uid, 'savedTracks', String(trackId));

const isSavedTrack = (value: unknown): value is SavedTrack => {
  if (typeof value !== 'object' || value === null) return false;

  const track = value as Record<string, unknown>;

  return (
    (typeof track.id === 'string' || typeof track.id === 'number') &&
    typeof track.title === 'string' &&
    typeof track.artist === 'string' &&
    (typeof track.artworkUrl === 'string' || track.artworkUrl === null) &&
    (typeof track.permalinkUrl === 'string' || track.permalinkUrl === null) &&
    typeof track.durationMs === 'number' &&
    Number.isFinite(track.durationMs) &&
    typeof track.genre === 'string' &&
    Array.isArray(track.tags) &&
    track.tags.every((tag) => typeof tag === 'string') &&
    (track.savedAt === null || track.savedAt instanceof Timestamp)
  );
};

export async function saveTrack(uid: string, track: PlayerTrack): Promise<void> {
  const trackRef = getSavedTrackRef(uid, track.id);

  const savedTrack: SavedTrackWrite = {
    id: track.id,
    title: track.title,
    artist: track.artist,
    artworkUrl: track.artworkUrl,
    permalinkUrl: track.permalinkUrl,
    durationMs: track.durationMs,
    genre: track.genre,
    tags: track.tags,
    savedAt: serverTimestamp(),
  };

  await setDoc(trackRef, savedTrack);
}

export async function removeSavedTrack(
  uid: string,
  trackId: PlayerTrack['id']
): Promise<void> {
  await deleteDoc(getSavedTrackRef(uid, trackId));
}

export function subscribeToSavedTrack(
  uid: string,
  trackId: PlayerTrack['id'],
  callback: SavedTrackStatusCallback
): Unsubscribe {
  return onSnapshot(getSavedTrackRef(uid, trackId), (snapshot) => {
    callback(snapshot.exists());
  });
}

export function subscribeToSavedTracks(
  uid: string,
  callback: SavedTracksCallback,
  onError: SavedTracksErrorCallback
): Unsubscribe {
  const savedTracksQuery = query(
    collection(db, 'users', uid, 'savedTracks'),
    orderBy('savedAt', 'desc')
  );

  return onSnapshot(
    savedTracksQuery,
    (snapshot) => {
      const tracks: SavedTrack[] = [];

      for (const savedTrackDocument of snapshot.docs) {
        const savedTrack = savedTrackDocument.data();

        if (!isSavedTrack(savedTrack)) {
          onError(new Error('저장된 트랙 데이터 형식이 올바르지 않습니다.'));
          return;
        }

        tracks.push(savedTrack);
      }

      callback(tracks);
    },
    onError
  );
}
