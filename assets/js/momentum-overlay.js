// ⚡ Momentum Pulse Overlay API
let overlayEl = null;
let auraEl = null;
let wavesEl = null;
let serveFlashEl = null;

function ensureElements() {
  if (!overlayEl) overlayEl = document.getElementById("momentum-overlay");
  if (overlayEl && !auraEl) auraEl = overlayEl.querySelector(".pulse-aura");
  if (overlayEl && !wavesEl) wavesEl = overlayEl.querySelector(".pulse-waves");
  if (!serveFlashEl) serveFlashEl = document.getElementById("serve-speed-flash");
}

/**
 * Set the overlay color theme.
 * @param {{glow?: string, ring?: string, flashA?: string, flashB?: string}} theme
 */
export function setMomentumTheme(theme = {}) {
  const root = document.documentElement.style;
  if (theme.glow) root.setProperty("--mp-glow", theme.glow);
  if (theme.ring) root.setProperty("--mp-ring", theme.ring);
  if (theme.flashA) root.setProperty("--mp-flash-a", theme.flashA);
  if (theme.flashB) root.setProperty("--mp-flash-b", theme.flashB);
}

/**
 * Breathe aura based on momentum (0..1).
 */
export function setMomentumLevel(level = 0.5) {
  ensureElements();
  if (!auraEl) return;
  const clamped = Math.max(0, Math.min(1, level));
  const targetOpacity = 0.15 + clamped * 0.55;
  const targetScale = 0.94 + clamped * 0.12;
  auraEl.style.opacity = String(targetOpacity);
  auraEl.style.transform = `scale(${targetScale})`;
}

/**
 * Emit 1–3 expanding rings for “big moments”.
 * @param {number} strength 1..3 (how many rings)
 * @param {number} spreadMs time between rings
 */
export function pulseMoment(strength = 2, spreadMs = 140) {
  ensureElements();
  if (!wavesEl) return;
  const count = Math.max(1, Math.min(3, Math.floor(strength)));
  for (let i = 0; i < count; i += 1) {
    setTimeout(() => {
      const ring = document.createElement("div");
      ring.className = "momentum-ring";
      wavesEl.appendChild(ring);
      ring.addEventListener("animationend", () => ring.remove());
    }, i * spreadMs);
  }
}

/**
 * Quick bar flash used on serve speed update.
 */
export function serveSpeedFlash() {
  ensureElements();
  if (!serveFlashEl) return;
  serveFlashEl.style.animation = "none";
  void serveFlashEl.offsetWidth;
  serveFlashEl.style.animation = "serveFlash 900ms ease-out";
}

// Sensible defaults
setMomentumTheme({
  glow: "#4df5ff",
  ring: "rgba(77,245,255,0.65)",
  flashA: "#4df",
  flashB: "#7ff",
});
setMomentumLevel(0.35);
