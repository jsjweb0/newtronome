import { useEffect, useState } from 'react';
import { ExternalLink, Heart } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import TrackItem from '../../../components/track/TrackItem';
import { useAuth } from '../../../contexts/useAuth';
import { useToast } from '../../../contexts/useToast';
import {
  removeSavedTrack,
  subscribeToSavedTracks,
} from '../services/savedTracks';
import type { SavedTrack } from '../types/saved-track.types';

export default function LikedTracksPage() {
  const { user, loading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();

  const [tracks, setTracks] = useState<SavedTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [removingTrackId, setRemovingTrackId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user?.uid) {
      setTracks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    return subscribeToSavedTracks(
      user.uid,
      (savedTracks) => {
        setTracks(savedTracks);
        setIsLoading(false);
      },
      () => {
        setErrorMessage('저장한 트랙을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        setIsLoading(false);
      }
    );
  }, [isAuthLoading, user?.uid]);

  const handleRemove = async (track: SavedTrack) => {
    if (!user?.uid || removingTrackId !== null) return;

    const trackId = String(track.id);
    setRemovingTrackId(trackId);

    try {
      await removeSavedTrack(user.uid, track.id);
      showToast({
        message: '북마크를 삭제했습니다.',
        type: 'success',
      });
    } catch {
      showToast({
        message: '북마크 삭제에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setRemovingTrackId(null);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="px-4 py-16 text-center text-sm text-textSub" role="status">
        로그인 상태를 확인하고 있습니다.
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <section className="mx-auto w-full px-4 py-6 lg:px-8 lg:py-10">
      <header className="mb-6 pb-4">
        <div className="flex items-center gap-2">
          <Heart aria-hidden="true" className="size-6 text-primary" />
          <h2 className="text-2xl font-bold text-textBase">Likes</h2>
        </div>
        <p className="mt-2 text-sm text-textSub">
          SoundCloud에서 저장한 트랙을 확인하고 관리할 수 있습니다.
        </p>
      </header>

      {isLoading ? (
        <div
          className="rounded-xl border border-textThr px-4 py-16 text-center text-sm text-textSub"
          role="status"
        >
          저장한 트랙을 불러오고 있습니다.
        </div>
      ) : errorMessage ? (
        <div
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-10 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : tracks.length === 0 ? (
        <div className="rounded-xl border border-textThr px-4 py-16 text-center">
          <Heart aria-hidden="true" className="mx-auto mb-3 size-8 text-textSub" />
          <p className="font-medium text-textBase">저장된 트랙이 없습니다.</p>
          <p className="mt-1 text-sm text-textSub">
            마음에 드는 트랙의 북마크 버튼을 눌러 저장해 보세요.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-textSub">저장된 트랙 {tracks.length}개</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-5 text-center">
            {tracks.map((track, index) => {
              const trackId = String(track.id);
              const isRemoving = removingTrackId === trackId;

              return (
                <li key={trackId}>
                  <TrackItem
                    idx={index}
                    track={track}
                    interactive={false}
                    footerActions={
                      <div className="flex items-center justify-center gap-2">
                        {track.permalinkUrl ? (
                          <a
                            href={track.permalinkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${track.title} 원곡을 SoundCloud에서 열기 (새 창)`}
                            className="inline-flex size-8 items-center justify-center hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          >
                            <ExternalLink aria-hidden="true" className="size-3.5" />
                          </a>
                        ) : (
                          <span className="text-xs text-textSub">원곡 링크 없음</span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemove(track)}
                          disabled={removingTrackId !== null}
                          aria-label={
                            isRemoving
                              ? `${track.title} 저장 해제 중`
                              : `${track.title} 저장 해제`
                          }
                          aria-busy={isRemoving}
                          className="inline-flex size-8 items-center justify-center hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-50"
                        >
                          <Heart aria-hidden="true" className="size-4 fill-primary stroke-primary" />
                        </button>
                      </div>
                    }
                  />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
