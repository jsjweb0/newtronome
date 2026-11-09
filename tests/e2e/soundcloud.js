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
  const history = [];
  const deferredMethods = new Set();
  const pendingResponses = new Map();
  let requestId = 0;
  const record = (entry) => history.push({ sequence: history.length + 1, ...entry });
  const respond = (method, callback, value) => {
    const id = ++requestId;
    // Capture the value at request time, not when the delayed response is released.
    const snapshot = structuredClone(value);
    const deliver = () => {
      record({ type: 'response', method, requestId: id, value: snapshot });
      callback(snapshot);
    };
    if (deferredMethods.delete(method)) {
      pendingResponses.set(id, deliver);
      record({ type: 'deferred', method, requestId: id, value: snapshot });
    } else {
      deliver();
    }
  };
  const emit = (name, event) => {
    record({ type: 'event', name, event });
    listeners.get(name)?.(event);
  };
  const widget = {
    bind: (name, listener) => listeners.set(name, listener),
    unbind: (name) => listeners.delete(name),
    getSounds: (callback) => respond('getSounds', callback, sounds),
    getCurrentSound: (callback) => respond('getCurrentSound', callback, sounds[index] ?? null),
    getDuration: (callback) => respond('getDuration', callback, sounds[index]?.duration ?? 0),
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
  for (const [method, implementation] of Object.entries(widget)) {
    widget[method] = (...args) => {
      record({ type: 'call', method, args: args.map(arg => typeof arg === 'function' ? '[callback]' : arg) });
      return implementation(...args);
    };
  }
  const Widget = Object.assign(() => widget, {
    Events: Object.fromEntries(['READY', 'PLAY', 'PAUSE', 'FINISH', 'PLAY_PROGRESS', 'ERROR'].map((name) => [name, name])),
  });
  window.SC = { Widget };
  window.soundCloudTest = {
    emit,
    commands,
    history,
    deferNext: (method) => {
      if (!['getSounds', 'getCurrentSound', 'getDuration'].includes(method)) {
        throw new Error(`Unsupported deferred method: ${method}`);
      }
      deferredMethods.add(method);
    },
    release: (id) => {
      const deliver = pendingResponses.get(id);
      if (!deliver) throw new Error(`No pending response: ${id}`);
      pendingResponses.delete(id);
      deliver();
    },
    isBound: () => listeners.has('READY'),
    empty: () => { sounds = []; index = 0; },
    restore: () => { sounds = tracks; index = 0; },
  };
}
