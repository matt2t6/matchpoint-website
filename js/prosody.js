// Prosody mapping: map drift/confidence/composure to small voice_settings deltas
// Returns deltas bounded to [-0.15, 0.15] with simple hysteresis to avoid wobble.

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

let last = { stability_delta: 0, similarity_delta: 0, style_delta: 0 };

export function computeProsodyAdjust({ conf = 0.5, comp = 0.5 } = {}, opts = {}) {
  const scale = opts.scale || 0.3; // overall sensitivity
  // Map composure -> stability (more composed, more stability)
  let stability_delta = clamp((comp - 0.5) * scale, -0.15, 0.15);
  // Map confidence -> similarity (more confident, slightly more similarity)
  let similarity_delta = clamp((conf - 0.5) * (scale * 0.8), -0.15, 0.15);
  // Map arousal (low when comp high) -> style (lower style when composed)
  let style_delta = clamp(((0.5 - comp) + (conf - 0.5) * 0.2) * (scale * 0.6), -0.15, 0.15);

  // Hysteresis: only update if change > epsilon
  const eps = 0.03;
  const applyHyst = (prev, next) => (Math.abs(next - prev) > eps ? next : prev);
  stability_delta = applyHyst(last.stability_delta, stability_delta);
  similarity_delta = applyHyst(last.similarity_delta, similarity_delta);
  style_delta = applyHyst(last.style_delta, style_delta);
  last = { stability_delta, similarity_delta, style_delta };

  return { stability_delta, similarity_delta, style_delta };
}

