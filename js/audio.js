// Simple AudioManager: preload, queueing, and playback with global volume
export class AudioManager {
  constructor() {
    this.cache = new Map(); // url -> { audio, ready, error, promise }
    this.queue = Promise.resolve();
    this.unlocked = false;
    this.globalVolume = 1.0;
    this._bindUnlock();
  }

  _bindUnlock() {
    const unlock = () => {
      if (this.unlocked) return;
      try {
        const a = new Audio();
        a.muted = true;
        a.play().catch(() => {});
        a.pause();
        this.unlocked = true;
      } catch (_) {}
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
  }

  setVolume(v) {
    this.globalVolume = Math.max(0, Math.min(1, v));
  }

  has(url) { return this.cache.has(url); }
  get(url) { return this.cache.get(url)?.audio || null; }

  async preload(url, { volume = 1.0 } = {}) {
    if (!url) return null;
    if (this.cache.has(url)) {
      const entry = this.cache.get(url);
      return entry.ready ? entry.audio : entry.promise;
    }
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.volume = Math.max(0, Math.min(1, volume)) * this.globalVolume;
    let resolveReady, rejectReady;
    const readyPromise = new Promise((res, rej) => { resolveReady = res; rejectReady = rej; });
    const onCanPlay = () => { cleanup(); entry.ready = true; entry.readyAt = (typeof performance !== 'undefined' ? performance.now() : Date.now()); resolveReady(audio); };
    const onError = (e) => { cleanup(); entry.error = e; rejectReady(e); };
    const cleanup = () => {
      audio.removeEventListener('canplaythrough', onCanPlay);
      audio.removeEventListener('error', onError);
    };
    audio.addEventListener('canplaythrough', onCanPlay, { once: true });
    audio.addEventListener('error', onError, { once: true });
    const entry = { audio, ready: false, error: null, promise: readyPromise };
    this.cache.set(url, entry);
    try { audio.load(); } catch (_) {}
    return readyPromise;
  }

  play(url, { volume = 1.0, concurrency = 'queue', seek = 0 } = {}) {
    if (!url) return Promise.resolve();
    const task = async () => {
      const audio = await this.preload(url, { volume });
      try { audio.currentTime = seek; } catch (_) {}
      audio.volume = Math.max(0, Math.min(1, volume)) * this.globalVolume;
      try { await audio.play(); } catch (_) {}
    };
    if (concurrency === 'overlap') return task();
    this.queue = this.queue.then(task).catch(() => {}).then(() => {});
    return this.queue;
  }

  prefetchAll(urls = [], opts) {
    return Promise.all(urls.map(u => this.preload(u, opts).catch(() => null)));
  }

  isReady(url) {
    const e = this.cache.get(url);
    return !!(e && e.ready);
  }

  async playWithTelemetry(url, { volume = 1.0, concurrency = 'queue', seek = 0 } = {}) {
    const tCue = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const entry = this.cache.get(url);
    const preReadyKnown = entry?.ready ? (entry.readyAt || tCue) : null;
    const doPlay = async () => {
      const audio = await this.preload(url, { volume });
      const tReady = this.cache.get(url)?.readyAt || (typeof performance !== 'undefined' ? performance.now() : Date.now());
      try { audio.currentTime = seek; } catch (_) {}
      audio.volume = Math.max(0, Math.min(1, volume)) * this.globalVolume;
      await audio.play().catch(() => {});
      const tPlay = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      return {
        url,
        tCue,
        tReady,
        tPlay,
        cue_to_voice_ms: Math.max(0, tPlay - tCue)
      };
    };
    if (concurrency === 'overlap') return doPlay();
    this.queue = this.queue.then(doPlay).catch(() => ({}));
    return this.queue;
  }
}
