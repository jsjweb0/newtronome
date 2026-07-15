export interface Track {
  id: number;
  title: string;
  artist: string;
  artworkUrl: string | null;
  audioUrl: string;
  durationMs: number;
  playbackCount: number;
  favoriteCount: number;
  genre: string;
  tags: string[];
}

export interface SoundCloudTrackResponse {
  id: number;
  title: string;
  duration: number;
  artwork_url: string | null;
  playback_count: number;
  favoritings_count: number;
  genre: string;
  tag_list: string;
  user: {
    username: string;
  };
}

export interface SoundCloudStreamRequest {
  path: string;
  trackAuthorization: string;
}
