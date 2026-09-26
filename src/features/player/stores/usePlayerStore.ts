import { create } from 'zustand';
import type { PlayerStore } from '../types/player.types';

export const usePlayerStore = create<PlayerStore>((set) => ({
  tracks: [],
  currentTrack: null,
  playbackMode: 'playlist',
  currentIndex: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isMuted: false,

  setPlaybackMode: (mode) => {
    set({ playbackMode: mode });
  },

  setPlaylist: (tracks, startIndex = 0) => {
    const safeIndex =
      tracks.length === 0 ? 0 : Math.min(Math.max(startIndex, 0), tracks.length - 1);

    set({
      tracks,
      currentIndex: safeIndex,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    });
  },

  setCurrentTrack: (currentTrack) => {
    set({ currentTrack });
  },

  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setMuted: (isMuted) => set({ isMuted }),
}));

export const selectCurrentTrack = (state: PlayerStore) =>
  state.currentTrack;
