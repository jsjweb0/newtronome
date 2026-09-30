// The real app runs unchanged. Only the external Widget API is replaced.
export function installSoundCloudMock() {
  const tracks = [
    { id: 1, title: 'E2E First', user: { username: 'Artist One' }, duration: 180000, permalink_url: 'https://soundcloud.com/test/first' },
    { id: 2, title: 'E2E Second', user: { username: 'Artist Two' }, duration: 210000, permalink_url: 'https://soundcloud.com/test/second' },
  ];
  const listeners = new Map();
  let sounds = tracks;
  let index = 0;
  let playing = false;
  const commands = [];
  const emit = (name, event) => listeners.get(name)?.(event);
  const widget = {
    bind: (name, listener) => listeners.set(name, listener),
    unbind: (name) => listeners.delete(name),
    getSounds: (callback) => callback(sounds),
    getCurrentSound: (callback) => callback(sounds[index] ?? null),
    getDuration: (callback) => callback(sounds[index]?.duration ?? 0),
    play: () => { commands.push('play'); playing = true; emit('PLAY'); },
    pause: () => { commands.push('pause'); playing = false; emit('PAUSE'); },
    toggle: () => playing ? widget.pause() : widget.play(),
    skip: (nextIndex) => { commands.push('skip'); index = nextIndex; widget.play(); },
    prev: () => { commands.push('prev'); },
    next: () => { commands.push('next'); },
    seekTo: (position) => emit('PLAY_PROGRESS', { currentPosition: position }),
    setVolume: () => {},
    load: (_url, options) => { index = options?.start_track ?? 0; options?.callback?.(); },
  };
  const Widget = Object.assign(() => widget, {
    Events: Object.fromEntries(['READY', 'PLAY', 'PAUSE', 'FINISH', 'PLAY_PROGRESS', 'ERROR'].map((name) => [name, name])),
  });
  window.SC = { Widget };
  window.soundCloudTest = {
    emit,
    commands,
    isBound: () => listeners.has('READY'),
    empty: () => { sounds = []; index = 0; },
    restore: () => { sounds = tracks; index = 0; },
  };
}
