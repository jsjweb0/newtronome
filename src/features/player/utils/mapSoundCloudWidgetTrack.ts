import type { PlayerTrack } from '../types/player.types';

const parseSoundCloudTags = (tagList: string): string[] => {
  const tokens = tagList.match(/"[^"]+"|\S+/g) ?? [];

  return tokens.map((tag) => tag.replace(/^"|"$/g, '')).filter(Boolean);
};

const isRecord = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value);

const isTrackId = (
  value: unknown
): value is number | string =>
  (typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value > 0) ||
  (typeof value === 'string' &&
    value.trim() !== '');

export function mapSoundCloudWidgetTrack(
  value: unknown
): PlayerTrack | null {
  if (!isRecord(value)) {
    return null;
  }

  if (!isTrackId(value.id) || typeof value.title !== 'string' || value.title.trim() === '') {
    return null;
  }

  const id = typeof value.id === 'string' ? value.id.trim() : value.id;

  const artist = isRecord(value.user) && typeof value.user.username === 'string'
    ? value.user.username.trim()
    : '';

  return {
    id,
    title: value.title.trim(),
    artist: artist || '알 수 없는 아티스트',
    artworkUrl: typeof value.artwork_url === 'string' ? value.artwork_url : null,
    permalinkUrl: typeof value.permalink_url === 'string' ? value.permalink_url : null,
    durationMs:
      typeof value.duration === 'number' &&
        Number.isFinite(value.duration) &&
        value.duration >= 0
        ? value.duration
        : 0,
    genre: typeof value.genre === 'string' ? value.genre.trim() : '',
    tags:
      typeof value.tag_list === 'string' ? parseSoundCloudTags(value.tag_list) : [],
  };
}
