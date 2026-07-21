import { create } from 'zustand';
import type { PlayerStore } from '../types/player.types';

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  tracks: [],
  currentTrack: null,
  currentIndex: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isMuted: false,

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

  addTrack: (track) => {
    set((state) => ({
      tracks: [...state.tracks, track],
    }));
  },

  selectTrack: (index) => {
    const { tracks } = get();
    if (index < 0 || index >= tracks.length) return;

    set({
      currentIndex: index,
      currentTime: 0,
      duration: 0,
      isPlaying: true,
    });
  },

  setCurrentTrack: (currentTrack) => {
    set({ currentTrack });
  },

  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setMuted: (isMuted) => set({ isMuted }),

  nextTrack: () => {
    const { tracks, currentIndex } = get();
    if (tracks.length === 0) return;

    set({
      currentIndex: (currentIndex + 1) % tracks.length,
      currentTime: 0,
      duration: 0,
      isPlaying: true,
    });
  },

  previousTrack: () => {
    const { tracks, currentIndex } = get();
    if (tracks.length === 0) return;

    set({
      currentIndex: currentIndex === 0 ? tracks.length - 1 : currentIndex - 1,
      currentTime: 0,
      duration: 0,
      isPlaying: true,
    });
  },

  shuffleTracks: () => {
    const { tracks } = get();
    if (tracks.length === 0) return;

    const shuffledTracks = [...tracks];

    for (let index = shuffledTracks.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));

      [shuffledTracks[index], shuffledTracks[randomIndex]] = [
        shuffledTracks[randomIndex],
        shuffledTracks[index],
      ];
    }

    set({
      tracks: shuffledTracks,
      currentIndex: 0,
      currentTime: 0,
      duration: 0,
      isPlaying: true,
    });
  },
}));

export const selectCurrentTrack = (state: PlayerStore) =>
  state.currentTrack;
