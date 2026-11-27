import { Link, useOutletContext } from 'react-router-dom';
import { selectCurrentTrack, usePlayerStore } from '../features/player/stores/usePlayerStore';
import HomePageSkeleton from './HomePageSkeleton';
import type { PlayerOutletContext } from '../layouts/MainLayout';
import type { PlayerTrack } from '../features/player/types/player.types';
import RetryErrorState from '../components/ui/RetryErrorState';
import PlaylistHero from '../features/playlists/components/PlaylistHero';
import PlaylistTrackList from '../features/playlists/components/PlaylistTrackList';
import { ROUTES } from '../constants/routes';
import clsx from 'clsx';

export default function HomePage() {
  const {
    playlistUrl,
    onSelectTrack,
    onToggleTrack,
    playlistStatus,
    widgetError,
    retryLoad,
  } = useOutletContext<PlayerOutletContext>();

  const playbackMode = usePlayerStore((state) => state.playbackMode);
  const tracks = usePlayerStore((state) => state.tracks);
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const isPlaybackLoading = usePlayerStore(
    (state) => state.isPlaybackLoading
  );

  const handleTrackClick = (track: PlayerTrack) => {
    const isCurrentTrack =
      playbackMode === 'playlist' &&
      String(currentTrack?.id) === String(track.id);

    if (isCurrentTrack) {
      onToggleTrack?.();
      return;
    }

    const trackIndex = tracks.findIndex((item) => String(item.id) === String(track.id));

    if (trackIndex === -1) return;

    onSelectTrack?.(trackIndex);
  };

  if (playlistStatus === 'loading' && tracks.length === 0) {
    return <HomePageSkeleton />;
  }

  if (playlistStatus === 'error') {
    return (
      <div className="flex flex-col items-center">
        <RetryErrorState
          message={widgetError ?? '플레이리스트를 불러오지 못했습니다.'}
          description="다시 시도하거나 다른 플레이리스트를 선택해 주세요."
          onRetry={retryLoad}
        />
        <Link
          to={ROUTES.playlists.path}
          className={clsx(
            'inline-flex items-center gap-2 min-h-11 px-4.5 rounded-full border border-textThr bg-background',
            'text-sm font-bold text-textBase transition-colors',
            'hover:border-primary hover:text-primary',
            'focus-visible:border-primary focus-visible:text-primary',
          )}
        >플레이리스트 둘러보기
        </Link>
      </div>
    );
  }

  if (playlistStatus === 'empty') {
    return <p className="px-3 py-14 text-textSub text-sm">플레이리스트가 비어 있어요</p>;
  }

  return (
    <div className="md:px-3">
      <PlaylistHero
        title="Now Playlist"
        tracks={tracks}
        soundCloudUrl={playlistUrl}
        fallbackArtwork={currentTrack?.artworkUrl ?? null}
      />
      <PlaylistTrackList
        tracks={tracks}
        currentTrack={playbackMode === 'playlist' ? currentTrack : null}
        isPlaying={isPlaying}
        onTrackClick={handleTrackClick}
        isPlaybackLoading={isPlaybackLoading}
      />
    </div>
  );
}
