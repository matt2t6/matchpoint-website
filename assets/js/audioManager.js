// MatchPoint Audio Manager
// Centralized control over ambient tracks, event hits, and coaching cues.

const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
const ctx = AudioContextCtor ? new AudioContextCtor() : null;

const buffers = new Map();
const activeSources = new Map(); // key -> Set<AudioBufferSourceNode>
const gainNodes = new Map(); // key -> GainNode

const DEFAULT_GAIN = {
  crowd: 0.35,
  rally: 0.45,
  serve: 0.6,
  smash: 0.75,
  net: 0.6,
  cue: 0.95,
};

const FILES = {
  crowd: "rally_loop.mp3",
  rally: "ball_hit.mp3",
  serve: "serve_toss.mp3",
  smash: "smash.mp3",
  net: "net.mp3",
};

const AUDIO_ROOT = "/assets/audio/";

function dispatchAudioError(detail) {
  try {
    window.dispatchEvent(new CustomEvent("matchpoint:audio:error", { detail }));
  } catch {
    // ignore
  }
}

function normalizeAssetPath(path) {
  if (!path) return path;
  if (/^(blob:|data:|https?:|\/\/)/i.test(path)) return path;
  if (path.startsWith("/")) return path;
  return `/${path.replace(/^\.\//, "")}`;
}

function ensureContext() {
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

function resolveSoundRef(name) {
  const entry = FILES[name];
  if (entry) {
    const url = entry.startsWith("http") ? entry : `${AUDIO_ROOT}${entry}`;
    return {
      key: name,
      url,
      defaultGain: DEFAULT_GAIN[name] ?? 0.7,
    };
  }

  // Allow null entry (e.g., cue channel) so helpers can manage playback manually.
  if (entry === null) {
    return {
      key: name,
      url: null,
      defaultGain: DEFAULT_GAIN[name] ?? 0.9,
    };
  }

  // Fallback: treat input as explicit URL/path.
  return {
    key: name,
    url: normalizeAssetPath(name),
    defaultGain: DEFAULT_GAIN[name] ?? 0.7,
  };
}

async function loadBuffer(name, url) {
  const cacheKey = `${name}|${url}`;
  if (buffers.has(cacheKey)) {
    return buffers.get(cacheKey);
  }
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    buffers.set(cacheKey, audioBuffer);
    return audioBuffer;
  } catch (err) {
    dispatchAudioError({
      source: "audioManager",
      clip: name,
      url,
      message: err?.message || String(err),
    });
    throw err;
  }
}

function registerSource(key, source, loop) {
  if (!activeSources.has(key)) {
    activeSources.set(key, new Set());
  }
  const bucket = activeSources.get(key);

  if (loop) {
    stopSound(key);
    bucket.clear();
  }

  bucket.add(source);
  source.onended = () => {
    bucket.delete(source);
    if (bucket.size === 0) {
      activeSources.delete(key);
      gainNodes.delete(key);
    }
  };
}

export async function playSound(name, opts = {}) {
  if (!ctx) {
    // Fallback: use HTMLAudioElement if WebAudio is unavailable.
    const audio = new Audio(name);
    audio.loop = !!opts.loop;
    audio.volume = typeof opts.volume === "number" ? opts.volume : 0.8;
    audio.play().catch(() => {});
    return null;
  }

  const { loop = false, volume } = opts;
  const ref = resolveSoundRef(name);
  if (!ref.url) {
    throw new Error(`No audio file mapped for key "${name}"`);
  }

  ensureContext();
  try {
    const buffer = await loadBuffer(ref.key, ref.url);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;

    const gain = ctx.createGain();
    const target = typeof volume === "number" ? volume : ref.defaultGain;
    gain.gain.setValueAtTime(target, ctx.currentTime);

    source.connect(gain).connect(ctx.destination);
    registerSource(ref.key, source, loop);
    gainNodes.set(ref.key, gain);
    source.start();
    return source;
  } catch (err) {
    console.warn("playSound error", name, err);
    dispatchAudioError({
      source: "audioManager",
      clip: ref.key,
      url: ref.url,
      message: err?.message || String(err),
    });
    return null;
  }
}

export function stopSound(name) {
  const ref = resolveSoundRef(name);
  const bucket = activeSources.get(ref.key);
  if (!bucket) return;
  for (const src of bucket) {
    try {
      src.stop();
    } catch {
      // ignore
    }
  }
  activeSources.delete(ref.key);
  gainNodes.delete(ref.key);
}

export function stopAll() {
  for (const key of Array.from(activeSources.keys())) {
    stopSound(key);
  }
  stopResonanceLayer();
}

export function stopAllSounds() {
  stopAll();
}

export function fadeVolume(name, targetGain, duration = 1000) {
  const ref = resolveSoundRef(name);
  const gain = gainNodes.get(ref.key);
  if (!gain || !ctx) return;
  ensureContext();
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.linearRampToValueAtTime(targetGain, now + duration / 1000);
}

export function fadeOut(name, duration = 1500) {
  fadeVolume(name, 0, duration);
  setTimeout(() => stopSound(name), duration + 250);
}

export function setVolume(name, level) {
  const ref = resolveSoundRef(name);
  const gain = gainNodes.get(ref.key);
  if (!gain || !ctx) return;
  ensureContext();
  gain.gain.setValueAtTime(level, ctx.currentTime);
}

export function setMasterVolume(multiplier) {
  if (!ctx) return;
  for (const [key, gain] of gainNodes) {
    const base = DEFAULT_GAIN[key] ?? 0.7;
    gain.gain.setValueAtTime(base * multiplier, ctx.currentTime);
  }
}

export async function playCueAudio(url) {
  if (!ctx) {
    const audio = new Audio(url);
    audio.volume = DEFAULT_GAIN.cue;
    audio.play().catch(() => {});
    return;
  }
  stopSound("cue");
  ensureContext();
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Cue load failed: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(DEFAULT_GAIN.cue, ctx.currentTime);

    source.connect(gain).connect(ctx.destination);
    registerSource("cue", source, false);
    gainNodes.set("cue", gain);
    source.start();
  } catch (err) {
    console.warn("playCueAudio failed", err);
    dispatchAudioError({
      source: "audioManager",
      clip: "cue",
      url,
      message: err?.message || String(err),
    });
  }
}

export { ctx as audioContext };

// === SCHUMANN-COSMIC RESONANCE INTEGRATION ===
// Direct wiring to SchumannCosmicEngine V2 for immersive audio layering

// Resonance layer state
let resonanceLayer = null;
let resonanceGainNode = null;
let resonanceLFO = null;
let resonanceActive = false;

// Initialize resonance layer integration
export function initializeResonanceLayer() {
  if (!ctx) return false;

  try {
    // Create dedicated gain node for resonance
    resonanceGainNode = ctx.createGain();
    resonanceGainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    resonanceGainNode.connect(ctx.destination);

    // Create LFO for amplitude modulation
    resonanceLFO = ctx.createOscillator();
    resonanceLFO.type = 'sine';
    resonanceLFO.frequency.setValueAtTime(7.83, ctx.currentTime); // Schumann fundamental

    // Create resonance oscillator
    resonanceLayer = ctx.createOscillator();
    resonanceLayer.type = 'sine';
    resonanceLayer.frequency.setValueAtTime(432, ctx.currentTime); // Cosmic A432

    // Connect: LFO -> Gain -> Resonance -> Output
    const modulationGain = ctx.createGain();
    modulationGain.gain.setValueAtTime(0.15, ctx.currentTime); // AM depth

    resonanceLFO.connect(modulationGain.gain);
    resonanceLayer.connect(modulationGain);
    modulationGain.connect(resonanceGainNode);

    return true;
  } catch (error) {
    console.warn('[AudioManager] Failed to initialize resonance layer:', error);
    return false;
  }
}

// Set resonance layer parameters from Schumann-Cosmic Engine
export function setResonanceLayer({ frequency, amplitude, gain, phase, composure }) {
  if (!resonanceLayer || !resonanceGainNode || !resonanceLFO) {
    console.warn('[AudioManager] Resonance layer not initialized');
    return;
  }

  const now = ctx.currentTime;

  try {
    // Update modulation frequency (Schumann resonance)
    if (frequency && frequency > 0) {
      resonanceLFO.frequency.exponentialRampToValueAtTime(frequency, now + 0.1);
    }

    // Update amplitude modulation depth
    if (amplitude !== undefined && amplitude >= 0) {
      const modulationGain = resonanceLayer._modulationGain || ctx.createGain();
      modulationGain.gain.exponentialRampToValueAtTime(amplitude, now + 0.1);
    }

    // Update overall gain based on composure and phase
    if (gain !== undefined && gain >= 0) {
      let adjustedGain = gain;

      // Phase-specific adjustments
      switch (phase) {
        case 'crisis':
          adjustedGain *= 1.2; // Boost during crisis
          break;
        case 'recovery':
          adjustedGain *= 0.8; // Soften during recovery
          break;
        case 'warmup':
          adjustedGain *= 0.9; // Gentle during warmup
          break;
      }

      // Composure-based adjustment
      if (composure !== undefined) {
        const composureFactor = Math.max(0.3, composure / 100);
        adjustedGain *= composureFactor;
      }

      resonanceGainNode.gain.exponentialRampToValueAtTime(adjustedGain, now + 0.2);
    }

    // Start if not active
    if (!resonanceActive) {
      resonanceLayer.start(now);
      resonanceLFO.start(now);
      resonanceActive = true;
    }

  } catch (error) {
    console.warn('[AudioManager] Failed to update resonance layer:', error);
  }
}

// Modulate existing audio layers with Schumann rhythm
export function modulateLayer(layerName, { lfoFrequency, amplitude, depth }) {
  const gainNode = gainNodes.get(layerName);
  if (!gainNode || !ctx) return;

  const now = ctx.currentTime;

  try {
    // Create or update LFO for this layer
    const layerKey = `${layerName}_modulation`;
    let layerLFO = gainNode._modulationLFO;

    if (!layerLFO) {
      layerLFO = ctx.createOscillator();
      layerLFO.type = 'sine';
      const modulationGain = ctx.createGain();
      modulationGain.gain.setValueAtTime(depth || 0.1, now);

      layerLFO.connect(modulationGain.gain);
      modulationGain.connect(gainNode.gain);

      gainNode._modulationLFO = layerLFO;
      gainNode._modulationGain = modulationGain;
    }

    // Update parameters
    if (lfoFrequency && lfoFrequency > 0) {
      layerLFO.frequency.exponentialRampToValueAtTime(lfoFrequency, now + 0.1);
    }

    if (depth !== undefined && depth >= 0) {
      gainNode._modulationGain.gain.exponentialRampToValueAtTime(depth, now + 0.1);
    }

    // Start LFO if not active
    if (layerLFO._isActive !== true) {
      layerLFO.start(now);
      layerLFO._isActive = true;
    }

  } catch (error) {
    console.warn(`[AudioManager] Failed to modulate layer ${layerName}:`, error);
  }
}

// Stop resonance layer
export function stopResonanceLayer() {
  if (resonanceLayer && resonanceActive) {
    try {
      const now = ctx.currentTime;
      resonanceGainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      setTimeout(() => {
        try {
          resonanceLayer.stop();
          resonanceLFO.stop();
          resonanceActive = false;
        } catch (e) {
          // Already stopped
        }
      }, 600);
    } catch (error) {
      console.warn('[AudioManager] Failed to stop resonance layer:', error);
    }
  }
}

// Get resonance layer status
export function getResonanceStatus() {
  return {
    initialized: !!(resonanceLayer && resonanceGainNode && resonanceLFO),
    active: resonanceActive,
    audioContextState: ctx?.state || 'none'
  };
}

