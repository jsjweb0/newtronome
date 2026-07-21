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
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
}

export interface PlayerActions {
  setPlaylist: (tracks: PlayerTrack[], startIndex?: number) => void;
  addTrack: (track: PlayerTrack) => void;
  selectTrack: (index: number) => void;

  setCurrentTrack: (track: PlayerTrack | null) => void;
  setPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setMuted: (isMuted: boolean) => void;

  nextTrack: () => void;
  previousTrack: () => void;
  shuffleTracks: () => void;
}

export type PlayerStore = PlayerState & PlayerActions;
