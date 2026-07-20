import type { Track } from '../../../types/track';

export interface PlayerTrack {
  id: number | string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  permalinkUrl: string | null;
  durationMs: number;
}

export interface PlayerState {
  tracks: Track[];
  currentTrack: PlayerTrack | null;
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
}

export interface PlayerActions {
  setPlaylist: (tracks: Track[], startIndex?: number) => void;
  addTrack: (track: Track) => void;
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
