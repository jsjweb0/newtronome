import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import type { ReactNode } from 'react';
import TrackItem from '../../../components/track/TrackItem';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import {
  removeSavedTrack,
  subscribeToSavedTracks,
  updateSavedTrackPlaybackStatus,
} from '../services/savedTracks';
import type { SavedTrack } from '../types/saved-track.types';
import { selectCurrentTrack, usePlayerStore } from '../../player/stores/usePlayerStore';
import type { PlayerOutletContext } from '../../../layouts/MainLayout';
import type { PlaybackStatus, PlayerTrack } from '../../player/types/player.types';
import RetryErrorState from '../../../components/ui/RetryErrorState';
import { SoundCloudTrackLink, trackActionButtonClass } from '../../../components/track/TrackItemActions';
import { getCachedPlaybackStatus } from '../../player/utils/getCachedPlaybackStatus';

export default function LikedTracksPage() {
  const { user, loading: isAuthLoading } = useAuth();
  const { showToast } = useToast();

  const { onPlaySingleTrack, onToggleTrack } = useOutletContext<PlayerOutletContext>();
  const playbackMode = usePlayerStore((state) => state.playbackMode);
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const playlistTracks = usePlayerStore((state) => state.tracks);

  const [resolvedStatuses, setResolvedStatuses] = useState<
    Record<string, PlaybackStatus>
  >({});
  const persistedPlaylistStatusesRef = useRef(new Set<string>());

  const [tracks, setTracks] = useState<SavedTrack[]>([]);
  const [loadedUserUid, setLoadedUserUid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [removingTrackId, setRemovingTrackId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user?.uid) {
      setTracks([]);
      setLoadedUserUid(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    return subscribeToSavedTracks(
      user.uid,
      (savedTracks) => {
        setTracks(savedTracks);
        setLoadedUserUid(user.uid);
        setErrorMessage('');
        setIsLoading(false);
      },
      () => {
        setLoadedUserUid(user.uid);
        setErrorMessage('저장한 트랙을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        setIsLoading(false);
      }
    );
  }, [isAuthLoading, user?.uid, retryCount]);

  const playlistStatusById = useMemo(() => {
    const statusMap = new Map<string, PlaybackStatus>();

    for (const track of playlistTracks) {
      if (track.playbackStatus) {
        statusMap.set(String(track.id), track.playbackStatus);
      }
    }

    return statusMap;
  }, [playlistTracks]);

  useEffect(() => {
    if (!user?.uid) return;

    for (const track of tracks) {
      const trackId = String(track.id);
      const status = playlistStatusById.get(trackId);

      if (!status || status === 'unknown') continue;
      if (getCachedPlaybackStatus(track) === status) continue;

      const persistenceKey = `${user.uid}:${trackId}:${status}`;

      if (persistedPlaylistStatusesRef.current.has(persistenceKey)) continue;

      persistedPlaylistStatusesRef.current.add(persistenceKey);
      void updateSavedTrackPlaybackStatus(user.uid, track.id, status).catch(
        () => {
          persistedPlaylistStatusesRef.current.delete(persistenceKey);
        }
      );
    }
  }, [playlistStatusById, tracks, user?.uid]);

  const displayedTracks = useMemo(
    () =>
      tracks.map((track) => {
        const trackId = String(track.id);

        return {
          ...track,
          playbackStatus:
            resolvedStatuses[trackId] ??
            playlistStatusById.get(trackId) ??
            getCachedPlaybackStatus(track),
        };
      }),
    [playlistStatusById, resolvedStatuses, tracks]
  );

  const handleTrackClick = (track: PlayerTrack) => {
    if (track.playbackStatus === 'blocked') {
      return;
    }

    const isCurrentSingleTrack =
      playbackMode === 'single' &&
      String(currentTrack?.id) === String(track.id);

    if (isCurrentSingleTrack) {
      onToggleTrack();
      return;
    }

    onPlaySingleTrack(track, {
      onResolved: (resolvedTrack) => {
        const status =
          resolvedTrack.playbackStatus ?? 'unknown';

        setResolvedStatuses((current) => ({
          ...current,
          [String(resolvedTrack.id)]: status,
        }));

        if (
          user?.uid &&
          status !== 'unknown'
        ) {
          void updateSavedTrackPlaybackStatus(
            user.uid,
            resolvedTrack.id,
            status
          ).catch(() => {
            showToast({
              message: '곡 상태를 저장하지 못했습니다.',
              type: 'error',
            });
          });
        }

        if (status === 'blocked') {
          showToast({
            message: '재생할 수 없는 곡입니다.',
            type: 'warning',
          });
        }
      },

      onFailure: () => {
        showToast({
          message: '곡 상태를 확인하지 못했습니다.',
          type: 'error',
        });
      },
    });
  };

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

  const hasLoadedTracks =
    Boolean(user) && !isLoading && loadedUserUid === user?.uid && !errorMessage;

  return (
    <section className="mx-auto w-full px-1 md:px-7 pb-6 lg:pb-10">
      {/* 게시판 · 검색과 같은 페이지 제목 */}
      <header className="flex items-center gap-3 mb-4 md:mb-5">
        <Heart aria-hidden="true" className="shrink-0 size-6.5 text-primary" />
        <div>
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight text-textBase">
            Likes
          </h1>
          <p className="mt-0.5 text-[13px] text-textSub">
            좋아요한 곡
            {hasLoadedTracks && ` · 총 ${displayedTracks.length}개`}
          </p>
        </div>
      </header>

      {!user ? (
        <LikesEmptyState
          title="자, 이제 좋아하는 음악을 모아볼 시간."
          description="로그인하고 마음에 드는 트랙을 저장하세요. 듣고 싶은 순간, 바로 다시 만날 수 있으니까요."
        >
          <Link
            to="/login"
            className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-7 text-[15px] font-extrabold text-onPrimary hover:bg-primary/85 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            로그인하고 시작하기
          </Link>
        </LikesEmptyState>
      ) : isLoading || loadedUserUid !== user.uid ? (
        <div
          className="px-6 py-16 text-center text-[13px] text-textSub"
          role="status"
        >
          저장한 트랙을 불러오고 있습니다.
        </div>
      ) : errorMessage ? (
        <RetryErrorState
          message={errorMessage}
          onRetry={() => {
            setIsLoading(true);
            setRetryCount((count) => count + 1);
          }}
        />
      ) : displayedTracks.length === 0 ? (
        <LikesEmptyState
          title="좋아하는 음악을 위한 자리."
          description="마음에 드는 트랙을 발견했다면, 북마크하고 이곳에서 다시 만나보세요."
        />
      ) : (
        <>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(176px,1fr))] gap-x-3 md:gap-x-5 gap-y-6 md:gap-y-7">
            {displayedTracks.map((track, index) => {
              const trackId = String(track.id);
              const isRemoving = removingTrackId === trackId;

              return (
                <li key={trackId}>
                  <TrackItem
                    idx={index}
                    track={track}
                    interactive={Boolean(track.permalinkUrl)}
                    currentTrack={playbackMode === 'single' ? currentTrack : null}
                    isPlaying={isPlaying}
                    onTrackClick={handleTrackClick}
                    actions={
                      <>
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
                          className={`${trackActionButtonClass} text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-50`}
                        >
                          <Heart aria-hidden="true" className="size-[18px] fill-primary stroke-primary" />
                        </button>
                        {track.permalinkUrl ? (
                          <SoundCloudTrackLink track={track} />
                        ) : (
                          <span className="px-1 text-[11px] text-textSub">원곡 링크 없음</span>
                        )}
                      </>
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

/** 알림 · 검색 빈 화면과 같은 형태의 안내 (로그인 전, 저장한 곡 없음) */
function LikesEmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-6 pt-14 pb-15 text-center">
      <span
        aria-hidden="true"
        className="mb-1 flex size-15 items-center justify-center rounded-full bg-line text-textSub"
      >
        <Heart className="size-6.5" />
      </span>
      <p className="text-[15px] font-bold text-textBase">{title}</p>
      <p className="max-w-sm text-[13px] leading-normal text-textSub break-keep">{description}</p>
      {children}
    </div>
  );
}
