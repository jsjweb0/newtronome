import type { PlayerTrack } from '../types/player.types';
import type { SoundCloudWidgetTrack } from '../types/soundcloud-widget.types';

const parseSoundCloudTags = (tagList: string): string[] => {
  const tokens = tagList.match(/"[^"]+"|\S+/g) ?? [];

  return tokens.map((tag) => tag.replace(/^"|"$/g, '')).filter(Boolean);
};

export function mapSoundCloudWidgetTrack(
  track: SoundCloudWidgetTrack | null | undefined
): PlayerTrack | null {
  if (!track || track.id == null || typeof track.title !== 'string' || track.title.trim() === '') {
    return null;
  }

  const artist = track.user?.username?.trim();

  return {
    id: track.id,
    title: track.title.trim(),
    artist: artist || '알 수 없는 아티스트',
    artworkUrl: typeof track.artwork_url === 'string' ? track.artwork_url : null,
    permalinkUrl: typeof track.permalink_url === 'string' ? track.permalink_url : null,
    durationMs:
      typeof track.duration === 'number' && Number.isFinite(track.duration) ? track.duration : 0,
    genre: typeof track.genre === 'string' ? track.genre.trim() : '',
    tags:
      typeof track.tag_list === 'string' ? parseSoundCloudTags(track.tag_list) : [],
  };
}
