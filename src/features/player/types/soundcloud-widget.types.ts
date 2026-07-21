export interface SoundCloudWidgetTrack {
  id?: number | string;
  title?: string;
  permalink_url?: string;
  artwork_url?: string | null;
  duration?: number;
  genre?: string;
  tag_list?: string;
  user?: {
    username?: string;
  };
}

export interface SoundCloudProgressEvent {
  currentPosition: number;
  relativePosition: number;
  loadProgress: number;
}

export interface SoundCloudWidgetLoadOptions {
  auto_play?: boolean;
  color?: string;
  show_artwork?: boolean;
  show_user?: boolean;
  show_comments?: boolean;
  callback?: () => void;
}

export interface SoundCloudWidgetInstance {
  bind: (eventName: string, listener: (event?: SoundCloudProgressEvent) => void) => void;

  unbind: (eventName: string) => void;

  load: (url: string, options?: SoundCloudWidgetLoadOptions) => void;

  play: () => void;
  pause: () => void;
  toggle: () => void;

  next: () => void;
  prev: () => void;
  skip: (trackIndex: number) => void;

  seekTo: (milliseconds: number) => void;
  setVolume: (volume: number) => void;

  getVolume: (callback: (volume: number) => void) => void;
  getDuration: (callback: (duration: number) => void) => void;
  getPosition: (callback: (position: number) => void) => void;

  getSounds: (callback: (sounds: SoundCloudWidgetTrack[]) => void) => void;

  getCurrentSound: (callback: (sound: SoundCloudWidgetTrack) => void) => void;

  getCurrentSoundIndex: (callback: (trackIndex: number) => void) => void;

  isPaused: (callback: (isPaused: boolean) => void) => void;
}

export interface SoundCloudWidgetFactory {
  (iframe: HTMLIFrameElement | string): SoundCloudWidgetInstance;

  Events: {
    READY: string;
    PLAY: string;
    PAUSE: string;
    FINISH: string;
    SEEK: string;
    LOAD_PROGRESS: string;
    PLAY_PROGRESS: string;
    ERROR: string;
  };
}

export interface SoundCloudGlobal {
  Widget: SoundCloudWidgetFactory;
}

declare global {
  interface Window {
    SC?: SoundCloudGlobal;
  }
}
