import type {
  SoundCloudStreamRequest,
  SoundCloudTrackResponse,
  Track,
} from '../types/track';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readString = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback;

const readNonNegativeNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;

export const parseSoundCloudTags = (tagList: string): string[] => {
  const tokens = tagList.match(/"[^"]+"|\S+/g) ?? [];
  return tokens.map((tag) => tag.replace(/^"|"$/g, '')).filter(Boolean);
};

export const parseSoundCloudTrackResponse = (
  value: unknown
): SoundCloudTrackResponse | null => {
  if (!isRecord(value)) return null;

  const id = value.id;
  const title = readString(value.title).trim();
  const duration = value.duration;

  if (
    typeof id !== 'number' ||
    !Number.isFinite(id) ||
    !title ||
    typeof duration !== 'number' ||
    !Number.isFinite(duration) ||
    duration < 0
  ) {
    return null;
  }

  const user = isRecord(value.user) ? value.user : null;

  return {
    id,
    title,
    duration,
    artwork_url: typeof value.artwork_url === 'string' ? value.artwork_url : null,
    playback_count: readNonNegativeNumber(value.playback_count),
    favoritings_count: readNonNegativeNumber(value.favoritings_count),
    genre: readString(value.genre),
    tag_list: readString(value.tag_list),
    user: {
      username: user ? readString(user.username).trim() : '',
    },
  };
};

export const mapSoundCloudTrack = (value: unknown, audioUrl: string): Track | null => {
  const source = parseSoundCloudTrackResponse(value);
  const normalizedAudioUrl = audioUrl.trim();
  if (!source || !normalizedAudioUrl) return null;

  return {
    id: source.id,
    title: source.title,
    artist: source.user.username,
    artworkUrl: source.artwork_url,
    audioUrl: normalizedAudioUrl,
    durationMs: source.duration,
    playbackCount: source.playback_count,
    favoriteCount: source.favoritings_count,
    genre: source.genre,
    tags: parseSoundCloudTags(source.tag_list),
  };
};

export const getSoundCloudStreamRequest = (
  value: unknown
): SoundCloudStreamRequest | null => {
  if (!isRecord(value)) return null;

  const media = isRecord(value.media) ? value.media : null;
  const transcodings = media && Array.isArray(media.transcodings) ? media.transcodings : [];
  const progressive = transcodings.find((transcoding) => {
    if (!isRecord(transcoding) || !isRecord(transcoding.format)) return false;
    return transcoding.format.protocol === 'progressive';
  });

  const progressiveUrl = isRecord(progressive) ? readString(progressive.url) : '';
  const streamUrl = progressiveUrl || readString(value.stream_url);
  if (!streamUrl) return null;

  try {
    const path = new URL(streamUrl).pathname;
    if (!path.startsWith('/') || path.startsWith('//')) return null;

    return {
      path,
      trackAuthorization: readString(value.track_authorization),
    };
  } catch {
    return null;
  }
};

export const getSoundCloudTrackList = (
  value: unknown,
  key: 'collection' | 'tracks'
): unknown[] => {
  if (!isRecord(value) || !Array.isArray(value[key])) return [];
  return value[key];
};
