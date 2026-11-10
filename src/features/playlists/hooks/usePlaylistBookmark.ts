import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import type { Playlist } from '../data/playlists';
import {
  removeSavedPlaylist,
  savePlaylist,
  subscribeToSavedPlaylist,
} from '../services/savedPlaylists';

export function usePlaylistBookmark(playlist: Playlist) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const uid = user?.uid ?? null;

  const [state, setState] = useState<{
    key: string;
    isSaved: boolean;
    error: string | null;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [retryCount, setRetryCount] = useState(0);

  // 사용자나 플레이리스트가 바뀌면 이전 결과는 쓰지 않음
  const stateKey = `${uid ?? ''}/${playlist.id}/${retryCount}`;
  const current = state?.key === stateKey ? state : null;

  useEffect(() => {
    if (!uid) return;

    return subscribeToSavedPlaylist(
      uid,
      playlist.id,
      (isSaved) => setState({ key: stateKey, isSaved, error: null }),
      () =>
        setState({
          key: stateKey,
          isSaved: false,
          error: '저장 상태를 확인하지 못했습니다.',
        })
    );
  }, [uid, playlist.id, stateKey]);

  const isLoading = uid !== null && current === null;
  const isSaved = uid !== null && (current?.isSaved ?? false);
  const error = uid !== null ? current?.error ?? null : null;

  const retrySubscription = () => {
    showToast({
      message: '플레이리스트 상태를 확인하지 못해 다시 조회합니다.',
      type: 'error',
    });

    setRetryCount((previousCount) => previousCount + 1);
  };

  const toggleSaved = async () => {
    if (!uid) {
      showToast({
        message: '로그인 후 이용해 주세요!',
        type: 'info',
        action: { label: '로그인', to: '/login' },
      });
      return;
    }

    if (isLoading || isSaving || error !== null) return;

    setIsSaving(true);

    try {
      if (isSaved) {
        await removeSavedPlaylist(uid, playlist.id);
        showToast({ message: '플레이리스트 저장을 취소했습니다.', type: 'success' });
      } else {
        await savePlaylist(uid, playlist);
        showToast({ message: '플레이리스트를 저장했습니다.', type: 'success' });
      }
    } catch {
      showToast({ message: '플레이리스트 저장에 실패했습니다.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return { isSaved, isLoading, isSaving, error, retrySubscription, toggleSaved };
}
