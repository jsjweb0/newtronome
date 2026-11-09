import {
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type { Playlist } from '../data/playlists';

// 곡 북마크(users/{uid}/savedTracks)와 같은 방식으로 플레이리스트를 저장
const getSavedPlaylistRef = (uid: string, playlistId: string) =>
  doc(db, 'users', uid, 'savedPlaylists', playlistId);

export async function savePlaylist(uid: string, playlist: Playlist): Promise<void> {
  await setDoc(getSavedPlaylistRef(uid, playlist.id), {
    id: playlist.id,
    title: playlist.title,
    soundCloudUrl: playlist.soundCloudUrl,
    savedAt: serverTimestamp(),
  });
}

export async function removeSavedPlaylist(uid: string, playlistId: string): Promise<void> {
  await deleteDoc(getSavedPlaylistRef(uid, playlistId));
}

export function subscribeToSavedPlaylist(
  uid: string,
  playlistId: string,
  callback: (isSaved: boolean) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    getSavedPlaylistRef(uid, playlistId),
    (snapshot) => callback(snapshot.exists()),
    onError
  );
}
