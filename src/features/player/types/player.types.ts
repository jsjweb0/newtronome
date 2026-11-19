export type PlaybackMode = 'playlist' | 'single';

export type PlaybackStatus =
  | 'allowed'
  | 'preview'
  | 'blocked'
  | 'unknown';

export interface PlayerTrack {
  id: number | string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  permalinkUrl: string | null;
  durationMs: number;
  genre: string;
  tags: string[];
  playbackStatus?: PlaybackStatus;
}

export interface PlayerState {
  tracks: PlayerTrack[];
  currentTrack: PlayerTrack | null;
  playbackMode: PlaybackMode;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  isPlaybackLoading: boolean;
}

export interface PlayerActions {
  setPlaybackMode: (mode: PlaybackMode) => void;
  setPlaylist: (tracks: PlayerTrack[]) => void;
  setCurrentTrack: (track: PlayerTrack | null) => void;
  setPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setMuted: (isMuted: boolean) => void;
  setPlaybackLoading: (loading: boolean) => void;
}

export type PlayerStore = PlayerState & PlayerActions;

export interface PlaySingleTrackOptions {
  onResolved?: (track: PlayerTrack) => void;
  onFailure?: () => void;
}

export type TrackSelectionRequest =
  | {
    kind: 'playlist';
    playlistUrl: string;
    trackId: PlayerTrack['id'];
    index: number;
    playAfterLoad: boolean;
    awaitingPlayConfirmation: boolean;
  }
  | {
    kind: 'single';
    track: PlayerTrack;
    options?: PlaySingleTrackOptions;
    playAfterLoad: boolean;
  };
