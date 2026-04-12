// Simple WebAudio helper. Requires a user gesture: call AudioEngine.unlock() once.
function dispatchAudioError(detail) {
  try {
    window.dispatchEvent(new CustomEvent("matchpoint:audio:error", { detail }));
  } catch {
    // ignore
  }
}

function buildValidatedUrl(baseUrl) {
  try {
    // Minimal path validation
    if (baseUrl.includes('/../') || /\/%2e%2e\//i.test(baseUrl)) {
      throw new Error('Invalid path');
    }
    
    const url = new URL(baseUrl);
    
    // Protocol + host checks
    const allowedDomains = ['example.com']; // add your allowed domains here
    if (!allowedDomains.includes(url.hostname)) {
      throw new Error('Invalid host');
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }
    
    return url.href;
  } catch {
    throw new Error('Invalid URL');
  }
}

export const AudioEngine = (() => {
  let ctx, unlocked = false, buffers = new Map();

  async function load(name, url) {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (buffers.has(name)) return;
    try {
      const validatedUrl = buildValidatedUrl(url);
      const res = await fetch(validatedUrl);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const arr = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr);
      buffers.set(name, buf);
    } catch (err) {
      dispatchAudioError({
        source: "manifest",
        clip: name,
        url,
        message: err?.message || String(err),
      });
      throw err;
    }
  }

  async function preloadManifest(manifest) {
    // manifest: { key: url, ... }
    return Promise.all(Object.entries(manifest).map(([k, u]) => load(k, u)));
  }

  function unlock() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    unlocked = true;
  }

  function play(name, {gain=0.9, loop=false} = {}) {
    if (!unlocked) return; // needs one user tap first
    const buf = buffers.get(name);
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = loop;

    const g = ctx.createGain();
    g.gain.value = gain;

    src.connect(g).connect(ctx.destination);
    src.start();
    return { stop: () => src.stop(), node: src, gain: g };
  }

  return { preloadManifest, unlock, play };
})();
