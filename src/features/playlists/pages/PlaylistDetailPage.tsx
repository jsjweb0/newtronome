import { useState } from 'react';
import { Link, useLocation, useOutletContext, useParams } from 'react-router-dom';
import { ChevronLeft, ListMusic } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import RetryErrorState from '../../../components/ui/RetryErrorState';
import HomePageSkeleton from '../../../pages/HomePageSkeleton';
import type { PlayerOutletContext } from '../../../layouts/MainLayout';
import { selectCurrentTrack, usePlayerStore } from '../../player/stores/usePlayerStore';
import type { PlaybackStatus, PlayerTrack } from '../../player/types/player.types';
import PlaylistActions from '../components/PlaylistActions';
import PlaylistCoverArt from '../components/PlaylistCoverArt';
import PlaylistCuration from '../components/PlaylistCuration';
import PlaylistHero from '../components/PlaylistHero';
import PlaylistTrackList from '../components/PlaylistTrackList';
import { findPlaylistById } from '../data/playlists';
import { usePlaylistTracks } from '../hooks/usePlaylistTracks';
import { useToast } from '../../../contexts/ToastContext';

const focusRingClass =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const WIDGET_PRELOAD_HEIGHT = 3000;

function BackToListLink() {
  const { state } = useLocation();
  const listSearch =
    typeof state?.playlistListSearch === 'string'
      ? state.playlistListSearch
      : '';

  return (
    <Link
      to={{ pathname: ROUTES.playlists.path, search: listSearch }}
      className={`inline-flex items-center gap-0.5 min-h-11 pr-3 pl-1.5 rounded-full text-sm text-textSub hover:text-primary transition-colors ${focusRingClass}`}
    >
      <ChevronLeft aria-hidden="true" className="size-5" />
      목록으로
    </Link>
  );
}

export default function PlaylistDetailPage() {
  const { showToast } = useToast();

  const { playlistId } = useParams<{ playlistId: string }>();
  const playlist = findPlaylistById(playlistId);

  const {
    currentPlaylistId,
    onPlayPlaylist,
    onPlaySingleTrack,
    onToggleTrack,
  } = useOutletContext<PlayerOutletContext>();
  // 재생 목록(tracks)은 읽지 않고, 재생 중인 곡 · 상태만 표시에 사용
  const playbackMode = usePlayerStore((state) => state.playbackMode);
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const [resolvedStatuses, setResolvedStatuses] = useState<
    Record<string, PlaybackStatus>
  >({});

  const { iframeRef, frameKey, widgetUrl, status, tracks, retry } = usePlaylistTracks(
    playlist?.soundCloudUrl ?? null
  );

  if (!playlist) {
    return (
      <section className="mx-auto w-full px-1 md:px-7 pb-6 lg:pb-10">
        <div className="flex flex-col items-center gap-2.5 px-4 pt-14 pb-10 text-center">
          <ListMusic aria-hidden="true" className="size-10 text-textSub" />
          <h1 className="text-lg md:text-[22px] font-bold text-textBase">
            플레이리스트를 찾을 수 없습니다
          </h1>
          <p className="text-sm text-textSub">주소가 바뀌었거나 없는 플레이리스트예요.</p>
          <Link
            to={ROUTES.playlists.path}
            className={`mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-7 text-[15px] font-extrabold text-onPrimary hover:bg-primary/85 transition-colors ${focusRingClass}`}
          >
            플레이리스트 목록 보기
          </Link>
        </div>
      </section>
    );
  }

  // 재생 플레이리스트를 바꾸지 않도록 한 곡 재생(좋아요 페이지와 같은 방식)으로 들음
  const handleTrackClick = (track: PlayerTrack) => {
    if (track.playbackStatus === 'blocked') return;

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

  const isThisPlaylistPlaying =
    currentPlaylistId === playlist.id && playbackMode === 'playlist' && isPlaying;

  const hasTrackArtwork = tracks.some((track) => Boolean(track.artworkUrl));

  const displayedTracks = tracks.map((track) => ({
    ...track,
    playbackStatus: resolvedStatuses[String(track.id)] ?? track.playbackStatus,
  }));

  let content;

  if (status === 'loading') {
    content = <HomePageSkeleton />;
  } else if (status === 'error') {
    content = (
      <RetryErrorState
        message="플레이리스트 곡 목록을 불러오지 못했습니다."
        onRetry={retry}
      />
    );
  } else {
    content = (
      <>
        <PlaylistHero
          title={playlist.title}
          titleAs="h1"
          tracks={tracks}
          cover={
            hasTrackArtwork ? undefined : (
              <div className="relative mx-auto w-full max-w-sm aspect-square overflow-hidden rounded-xl">
                <PlaylistCoverArt playlist={playlist} titleClassName="text-xl md:text-3xl" />
              </div>
            )
          }
          curation={<PlaylistCuration updatedAt={playlist.updatedAt} />}
          actions={
            <PlaylistActions
              playlist={playlist}
              isPlaying={isThisPlaylistPlaying}
              onPlay={() => onPlayPlaylist(playlist.id)}
            />
          }
        />
        {status === 'empty' ? (
          <p className="px-3 py-14 text-textSub text-sm">플레이리스트가 비어 있어요</p>
        ) : (
          <PlaylistTrackList
            tracks={displayedTracks}
            currentTrack={playbackMode === 'single' ? currentTrack : null}
            isPlaying={isPlaying}
            onTrackClick={handleTrackClick}
            headingAs="h2"
          />
        )}
      </>
    );
  }

  return (
    <div className="md:px-3">
      <div className="relative z-1 lg:-mt-6 mb-2 lg:mb-4">
        <BackToListLink />
      </div>

      {content}

      {/* 곡 목록만 읽어 오는 숨김 위젯 (재생용 위젯과 별개) */}
      <div className="relative overflow-hidden">
        {widgetUrl && (
          <div
            aria-hidden="true"
            className="absolute -left-2500 top-0 w-75 h-750 overflow-hidden opacity-0 pointer-events-none"
          >
            <iframe
              key={frameKey}
              ref={iframeRef}
              title={`${playlist.title} 곡 목록 불러오기`}
              tabIndex={-1}
              src={widgetUrl}
              width="100%"
              height={WIDGET_PRELOAD_HEIGHT}
              allow="encrypted-media"
              className="block w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
