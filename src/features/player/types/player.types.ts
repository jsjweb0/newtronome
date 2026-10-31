export type PlaybackMode = 'playlist' | 'single';

export interface PlayerTrack {
  id: number | string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  permalinkUrl: string | null;
  durationMs: number;
  genre: string;
  tags: string[];
}

export interface PlayerState {
  tracks: PlayerTrack[];
  currentTrack: PlayerTrack | null;
  playbackMode: PlaybackMode;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
}

export interface PlayerActions {
  setPlaybackMode: (mode: PlaybackMode) => void;
  setPlaylist: (tracks: PlayerTrack[]) => void;
  setCurrentTrack: (track: PlayerTrack | null) => void;
  setPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setMuted: (isMuted: boolean) => void;
}

export type PlayerStore = PlayerState & PlayerActions;
