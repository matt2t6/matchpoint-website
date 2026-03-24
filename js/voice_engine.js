// VoiceEngine: Web Audio based playback with buffering, normalization,
// gentle EQ/compression chain, and smooth crossfades.
// Designed for low-latency demo realism without heavy dependencies.

export class VoiceEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.compressor = null;
    this.dest = null;
    this.unlocked = false;
    this.globalGain = 1.0;
    this.cache = new Map(); // url -> AudioBuffer
    this._ensureContext();
    this._bindUnlock();
  }

  _ensureContext() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = AC ? new AC() : null;
    if (!this.ctx) return;
    // Master chain: source -> eq -> compressor -> master gain -> destination
    this.compressor = this.ctx.createDynamicsCompressor();
    // Gentle broadcast-like compression
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 3;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    this.master = this.ctx.createGain();
    this.master.gain.value = this.globalGain;
    this.compressor.connect(this.master);
    this.dest = this.ctx.destination;
    this.master.connect(this.dest);
  }

  _bindUnlock() {
    const unlock = () => {
      if (!this.ctx || this.unlocked) return;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(()=>{});
      // Minimal oscillator to unlock
      try {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        g.gain.value = 0.00001;
        o.connect(g).connect(this.dest);
        o.start(0); o.stop(this.ctx.currentTime + 0.01);
      } catch {}
      this.unlocked = true;
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
  }

  setGlobalGain(v) {
    this.globalGain = Math.max(0, Math.min(2, v));
    if (this.master) this.master.gain.value = this.globalGain;
  }

  // Persona profile -> EQ nodes
  _buildEqChain(persona) {
    // Nodes: highpass -> de-ess (peaking cut ~5k) -> presence shelf -> lowshelf
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 80; hp.Q.value = 0.707;

    const deEss = this.ctx.createBiquadFilter();
    deEss.type = 'peaking'; deEss.frequency.value = 5500; deEss.Q.value = 3.5; deEss.gain.value = -3.0;

    const presence = this.ctx.createBiquadFilter();
    presence.type = 'highshelf'; presence.frequency.value = 8000; presence.gain.value = 1.5;

    const lowShelf = this.ctx.createBiquadFilter();
    lowShelf.type = 'lowshelf'; lowShelf.frequency.value = 160; lowShelf.gain.value = -1.0;

    // Persona tinting
    switch (persona) {
      case 'TacticalCoach':
        presence.gain.value = 2.0; deEss.gain.value = -2.0; break; // a bit more clarity
      case 'MentalResetAgent':
        presence.gain.value = 1.0; lowShelf.gain.value = 0.5; break; // warmer
      case 'RecoveryCoach':
        presence.gain.value = 0.8; deEss.gain.value = -1.5; lowShelf.gain.value = 0.8; break;
      case 'system_neutral':
      default:
        // neutral
        break;
    }
    hp.connect(deEss); deEss.connect(presence); presence.connect(lowShelf);
    lowShelf.connect(this.compressor);
    return { input: hp, output: lowShelf };
  }

  async _fetchDecode(url) {
    const t0 = performance.now();
    const res = await fetch(url);
    const ab = await res.arrayBuffer();
    const t1 = performance.now();
    const buffer = await this.ctx.decodeAudioData(ab);
    const t2 = performance.now();
    // Compute simple RMS
    const ch = buffer.getChannelData(0);
    let sum = 0; const N = ch.length; for (let i=0;i<N;i++){ const x = ch[i]; sum += x*x; }
    const rms = Math.sqrt(sum/N) || 1e-6;
    return { buffer, rms, timings: { fetchMs: t1 - t0, decodeMs: t2 - t1 } };
  }

  _createSource(buffer, { volume=1.0, fadeInMs=80, fadeOutMs=80, targetRms=0.1 }={}) {
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = this.ctx.createGain();
    // Normalize roughly to targetRms
    // Estimate current RMS from first channel
    const ch = buffer.getChannelData(0);
    let sum=0; for (let i=0;i<Math.min(ch.length, 48000); i++){ const x=ch[i]; sum += x*x; }
    const curRms = Math.sqrt(sum/Math.max(1,Math.min(ch.length,48000))) || 1e-6;
    const norm = Math.min(6.0, targetRms/curRms);
    const base = Math.max(0, Math.min(2.5, volume * norm));
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, base), t + fadeInMs/1000);
    // Note: caller should schedule fade out with stop()
    return { src, gain };
  }

  async playUrl(url, { persona='system_neutral', volume=1.0, fadeInMs=80, fadeOutMs=120 }={}) {
    this._ensureContext(); if (!this.ctx) return null;
    let buffer = this.cache.get(url);
    if (!buffer) {
      const r = await this._fetchDecode(url);
      buffer = r.buffer;
      this.cache.set(url, buffer);
    }
    const eq = this._buildEqChain(persona);
    const chain = this._createSource(buffer, { volume, fadeInMs });
    chain.src.connect(chain.gain).connect(eq.input);
    const tStart = performance.now();
    chain.src.start();
    const handle = { url, persona, buffer, eq, chain, startedAt: tStart, stopped: false };
    handle.stop = () => {
      if (handle.stopped) return;
      const t = this.ctx.currentTime;
      chain.gain.gain.cancelScheduledValues(t);
      chain.gain.gain.setTargetAtTime(0.0001, t, Math.max(0.01, fadeOutMs/1000));
      try { chain.src.stop(t + fadeOutMs/1000 + 0.02); } catch {}
      handle.stopped = true;
    };
    return handle;
  }

  async crossfadeTo(currentHandle, nextUrl, { persona, volume=1.0, fadeMs=220 }={}) {
    if (!currentHandle) return this.playUrl(nextUrl, { persona, volume });
    this._ensureContext(); if (!this.ctx) return null;
    const next = await this.playUrl(nextUrl, { persona, volume, fadeInMs: fadeMs });
    // Fade out current while next fades in
    try { currentHandle.stop(); } catch {}
    return next;
  }

  async preloadUrl(url) {
    this._ensureContext(); if (!this.ctx) return false;
    if (this.cache.has(url)) return true;
    try {
      const r = await this._fetchDecode(url);
      this.cache.set(url, r.buffer);
      return true;
    } catch (_) { return false; }
  }

  async playStream(url, { persona='system_neutral', volume=1.0, fadeInMs=80, fadeOutMs=120 }={}) {
    this._ensureContext(); if (!this.ctx) return null;
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.src = url;
    audio.loop = false;

    const eq = this._buildEqChain(persona);
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), t + fadeInMs/1000);

    const srcNode = this.ctx.createMediaElementSource(audio);
    srcNode.connect(gain).connect(eq.input);

    await new Promise((resolve) => {
      const onReady = () => { audio.removeEventListener('canplay', onReady); resolve(); };
      audio.addEventListener('canplay', onReady);
    });
    audio.play().catch(()=>{});

    const handle = { url, persona, audio, gain, eq, stopped: false };
    handle.stop = () => {
      if (handle.stopped) return;
      const t2 = this.ctx.currentTime;
      gain.gain.setTargetAtTime(0.0001, t2, Math.max(0.01, fadeOutMs/1000));
      setTimeout(() => { try { audio.pause(); audio.src = ''; } catch{} }, fadeOutMs + 80);
      handle.stopped = true;
    };
    return handle;
  }
}
