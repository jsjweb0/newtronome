import { useEffect, useMemo, useState } from 'react';
import { CircleX, Heart } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import type { ReactNode } from 'react';
import TrackItem from '../../../components/track/TrackItem';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import {
  removeSavedTrack,
  subscribeToSavedTracks,
} from '../services/savedTracks';
import type { SavedTrack } from '../types/saved-track.types';
import { selectCurrentTrack, usePlayerStore } from '../../player/stores/usePlayerStore';
import type { PlayerOutletContext } from '../../../layouts/MainLayout';
import type { PlaybackStatus, PlayerTrack } from '../../player/types/player.types';
import RetryErrorState from '../../../components/ui/RetryErrorState';
import { SoundCloudTrackLink, trackActionButtonClass } from '../../../components/track/TrackItemActions';

export default function LikedTracksPage() {
  const { user, loading: isAuthLoading } = useAuth();
  const { showToast } = useToast();

  const { onPlaySingleTrack, onToggleTrack } = useOutletContext<PlayerOutletContext>();
  const playbackMode = usePlayerStore((state) => state.playbackMode);
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const [resolvedStatuses, setResolvedStatuses] = useState<
    Record<string, PlaybackStatus>
  >({});

  const [tracks, setTracks] = useState<SavedTrack[]>([]);
  const [loadedUserUid, setLoadedUserUid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [removingTrackId, setRemovingTrackId] = useState<string | null>(null);

  const [searchKeyword, setSearchKeyword] = useState('');

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

  const displayedTracks = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return tracks
      .filter((track) => track.title.toLowerCase().includes(keyword))
      .map((track) => ({
        ...track,
        playbackStatus: resolvedStatuses[String(track.id)] ?? 'unknown',
      }));
  }, [resolvedStatuses, tracks, searchKeyword]);

  const handleTrackClick = (track: PlayerTrack) => {
    if (track.playbackStatus === 'blocked') {
      return;
    }

    const isCurrentSingleTrack =
      playbackMode === 'single' && String(currentTrack?.id) === String(track.id);

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
      <header className="flex flex-wrap items-end justify-between gap-3 mb-6 md:mb-8">
        <div className="flex items-center gap-x-2.5">
          <Heart aria-hidden="true" className="shrink-0 size-6.5 text-primary" />
          <div>
            <h1 className="text-[28px] leading-tight font-extrabold tracking-tight text-textBase">
              Likes
            </h1>
            <p className="mt-0.5 text-[13px] text-textSub">
              좋아요한 곡
              {hasLoadedTracks && ` · 총 ${tracks.length}개`}
            </p>
          </div>
        </div>
        <div className="relative">
          <label htmlFor="search-track-input" className="sr-only">좋아요한 곡 검색어</label>
          <input
            type="text"
            id="search-track-input"
            className="block w-full h-11 mb-0 pl-3.5 pr-10 border border-textThr dark:border-none rounded-[10px] bg-background text-sm disabled:opacity-50 disabled:pointer-events-none focus:ring-primary"
            placeholder="Filter"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => setSearchKeyword('')}
              className="inline-flex items-center justify-center absolute top-0 right-0 h-full w-10 text-textSub hover:text-textBase"
              aria-label="검색어 삭제"
            >
              <CircleX className="size-4" aria-hidden="true" />
            </button>
          )}
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
