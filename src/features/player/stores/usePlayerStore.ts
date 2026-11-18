import { create } from 'zustand';
import type { PlayerStore } from '../types/player.types';

export const usePlayerStore = create<PlayerStore>((set) => ({
  tracks: [],
  currentTrack: null,
  playbackMode: 'playlist',
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isMuted: false,
  isPlaybackLoading: false,

  setPlaybackMode: (mode) => {
    set({ playbackMode: mode });
  },

  setPlaylist: (tracks) => {
    set((state) => ({
      tracks,
      currentTrack:
        tracks.length === 0 && state.playbackMode === 'playlist'
          ? null
          : state.currentTrack,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    }));
  },

  setCurrentTrack: (currentTrack) => {
    set({ currentTrack });
  },

  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setMuted: (isMuted) => set({ isMuted }),
  setPlaybackLoading: (isPlaybackLoading) => set({ isPlaybackLoading }),
}));

export const selectCurrentTrack = (state: PlayerStore) =>
  state.currentTrack;
