import type { Track } from '../../../types/track';

export interface PlayerState {
  tracks: Track[];
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

  setPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setMuted: (isMuted: boolean) => void;

  nextTrack: () => void;
  previousTrack: () => void;
  shuffleTracks: () => void;
}

export type PlayerStore = PlayerState & PlayerActions;
