import { useOutletContext } from 'react-router-dom';
import { selectCurrentTrack, usePlayerStore } from '../features/player/stores/usePlayerStore';
import HomePageSkeleton from './HomePageSkeleton';
import type { PlayerOutletContext } from '../layouts/MainLayout';
import type { PlayerTrack } from '../features/player/types/player.types';
import RetryErrorState from '../components/ui/RetryErrorState';
import PlaylistHero from '../features/playlists/components/PlaylistHero';
import PlaylistTrackList from '../features/playlists/components/PlaylistTrackList';

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

  if (playlistStatus === 'loading') return <HomePageSkeleton />;

  if (playlistStatus === 'error') {
    return (
      <RetryErrorState
        message={
          widgetError ??
          '플레이리스트를 불러오지 못했습니다.'
        }
        onRetry={retryLoad}
      />
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
      />
    </div>
  );
}
