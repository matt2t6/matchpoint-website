// MatchPoint Audio Unlocker
// Presents a lightweight overlay so browsers allow WebAudio playback.

import { AudioEngine } from "./audio-engine.js";
import { audioContext } from "./audioManager.js";

const OVERLAY_ID = "mp-audio-unlock-overlay";
const BUTTON_ID = "mp-audio-unlock-btn";
const MESSAGE_ID = "mp-audio-unlock-message";

function isAudioUnlocked() {
  if (typeof window === "undefined") return true;
  if (window.__mpAudioUnlocked) return true;
  if (!audioContext) return true;
  return audioContext.state === "running";
}

function injectStyles() {
  if (document.getElementById("mp-audio-unlock-style")) return;
  const style = document.createElement("style");
  style.id = "mp-audio-unlock-style";
  style.textContent = `
    #${OVERLAY_ID} {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(8, 11, 19, 0.88);
      backdrop-filter: blur(6px);
      z-index: 4000;
      transition: opacity 0.3s ease;
    }

    #${OVERLAY_ID}.is-hidden {
      opacity: 0;
      pointer-events: none;
    }

    #${OVERLAY_ID} .mp-audio-card {
      background: linear-gradient(135deg, rgba(22, 27, 34, 0.95), rgba(13,19,26,0.92));
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 16px;
      padding: 28px 32px;
      max-width: 420px;
      width: calc(100% - 48px);
      text-align: center;
      box-shadow:
        0 24px 48px rgba(2, 6, 12, 0.45),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    #${OVERLAY_ID} .mp-audio-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      color: #38f8ff;
      letter-spacing: 0.03em;
    }

    #${OVERLAY_ID} .mp-audio-body {
      font-size: 0.95rem;
      color: #cbd5f5;
      margin-bottom: 1.5rem;
      line-height: 1.55;
    }

    #${BUTTON_ID} {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #38bdf8, #22d3ee);
      border: none;
      color: #051622;
      font-weight: 700;
      padding: 0.75rem 1.5rem;
      border-radius: 9999px;
      cursor: pointer;
      font-size: 0.95rem;
      box-shadow: 0 12px 25px rgba(34, 211, 238, 0.35);
      transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.15s ease;
    }

    #${BUTTON_ID}:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 16px 30px rgba(34, 211, 238, 0.4);
    }

    #${BUTTON_ID}[disabled] {
      opacity: 0.7;
      cursor: wait;
      filter: grayscale(0.3);
    }

    #${MESSAGE_ID} {
      margin-top: 1rem;
      font-size: 0.85rem;
      color: #fda4af;
      min-height: 1.2em;
    }

    @media (max-width: 640px) {
      #${OVERLAY_ID} .mp-audio-card {
        padding: 24px;
      }
    }
  `;
  document.head.appendChild(style);
}

function createOverlay() {
  if (document.getElementById(OVERLAY_ID)) return;
  injectStyles();

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;

  overlay.innerHTML = `
    <div class="mp-audio-card">
      <div class="mp-audio-title">Enable Demo Audio</div>
      <div class="mp-audio-body">
        Tap below so your browser unlocks sound. We’ll keep the crowd low and make sure coaching cues come through loud and clear.
      </div>
      <button id="${BUTTON_ID}" type="button">
        <span>🎧 Enable Audio</span>
      </button>
      <div id="${MESSAGE_ID}"></div>
    </div>
  `;

  document.body.appendChild(overlay);
  const button = overlay.querySelector(`#${BUTTON_ID}`);
  if (button) {
    button.addEventListener("click", handleUnlockClick, { once: false });
  }
}

function showOverlayIfNeeded() {
  if (isAudioUnlocked()) {
    markUnlocked();
    return;
  }
  createOverlay();
}

function updateMessage(text) {
  const message = document.getElementById(MESSAGE_ID);
  if (message) {
    message.textContent = text || "";
  }
}

async function handleUnlockClick(event) {
  const button = event.currentTarget;
  if (!(button instanceof HTMLButtonElement)) return;

  button.disabled = true;
  updateMessage("Activating audio…");

  try {
    if (audioContext && typeof audioContext.resume === "function") {
      await audioContext.resume();
    }
    try {
      AudioEngine.unlock();
    } catch (err) {
      console.warn("[AudioUnlocker] AudioEngine unlock failed", err);
    }
    markUnlocked();
  } catch (err) {
    console.warn("[AudioUnlocker] Failed to resume AudioContext", err);
    updateMessage("Audio unlock was blocked — please tap again.");
    button.disabled = false;
    return;
  }
}

function markUnlocked() {
  if (typeof window !== "undefined") {
    window.__mpAudioUnlocked = true;
  }
  const overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    overlay.classList.add("is-hidden");
    setTimeout(() => overlay.remove(), 220);
  }
  updateMessage("");
  window.dispatchEvent(new CustomEvent("matchpoint:audio:unlocked"));
}

document.addEventListener("DOMContentLoaded", () => {
  showOverlayIfNeeded();
});

window.addEventListener("matchpoint:demo:start", () => {
  // In case the demo starts without explicit unlock (e.g., programmatic trigger),
  // ensure users still see the overlay.
  if (!isAudioUnlocked()) {
    showOverlayIfNeeded();
  }
});
