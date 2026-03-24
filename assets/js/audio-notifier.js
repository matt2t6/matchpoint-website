// MatchPoint Audio Notifier
// Surfaces audio-loading issues to the operator so demo prep can react quickly.

const CONTAINER_ID = "mp-audio-toast-container";
const ACTIVE_KEYS = new Set();

function ensureContainer() {
  let container = document.getElementById(CONTAINER_ID);
  if (container) return container;

  container = document.createElement("div");
  container.id = CONTAINER_ID;
  container.style.position = "fixed";
  container.style.top = "16px";
  container.style.right = "16px";
  container.style.zIndex = "3500";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "10px";
  container.style.maxWidth = "360px";
  document.body.appendChild(container);
  return container;
}

function createToast(detail) {
  const container = ensureContainer();
  const toast = document.createElement("div");
  toast.className = "mp-audio-toast";
  toast.style.background = "rgba(239, 68, 68, 0.9)";
  toast.style.color = "#fff";
  toast.style.padding = "14px 16px";
  toast.style.borderRadius = "12px";
  toast.style.boxShadow = "0 14px 35px rgba(15, 23, 42, 0.35)";
  toast.style.fontSize = "0.9rem";
  toast.style.lineHeight = "1.45";
  toast.style.display = "flex";
  toast.style.flexDirection = "column";
  toast.style.gap = "6px";
  toast.style.border = "1px solid rgba(255,255,255,0.18)";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(6px)";

  const heading = document.createElement("div");
  heading.style.fontWeight = "700";
  heading.style.fontSize = "0.95rem";
  heading.textContent = "Audio Asset Issue";
  toast.appendChild(heading);

  const body = document.createElement("div");
  body.innerHTML = buildBody(detail);
  toast.appendChild(body);

  const footer = document.createElement("div");
  footer.style.display = "flex";
  footer.style.justifyContent = "space-between";
  footer.style.alignItems = "center";
  footer.style.fontSize = "0.8rem";
  footer.style.opacity = "0.85";

  const hint = document.createElement("span");
  hint.textContent = "Audio muted? Check file path & server logs.";
  footer.appendChild(hint);

  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.textContent = "Dismiss";
  dismiss.style.background = "transparent";
  dismiss.style.border = "none";
  dismiss.style.color = "#fff";
  dismiss.style.fontWeight = "600";
  dismiss.style.cursor = "pointer";
  dismiss.addEventListener("click", () => {
    fadeOutToast(toast, detail.__key);
  });
  footer.appendChild(dismiss);

  toast.appendChild(footer);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transition = "opacity 0.25s ease, transform 0.25s ease";
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  setTimeout(() => fadeOutToast(toast, detail.__key), 8000);
}

function buildBody(detail = {}) {
  const parts = [];
  if (detail.source) {
    parts.push(`<strong>Source:</strong> ${sanitize(detail.source)}`);
  }
  if (detail.clip) {
    parts.push(`<strong>Clip:</strong> ${sanitize(detail.clip)}`);
  }
  if (detail.url) {
    parts.push(`<strong>Path:</strong> <code>${sanitize(detail.url)}</code>`);
  }
  if (detail.text) {
    parts.push(`<strong>Line:</strong> “${sanitize(detail.text)}”`);
  }
  if (detail.message) {
    parts.push(`<strong>Message:</strong> ${sanitize(detail.message)}`);
  }

  return parts.join("<br/>") || "An unknown audio issue occurred.";
}

function sanitize(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fadeOutToast(toast, key) {
  if (!toast) return;
  toast.style.opacity = "0";
  toast.style.transform = "translateY(-6px)";
  setTimeout(() => {
    toast.remove();
  }, 240);
  if (key) {
    ACTIVE_KEYS.delete(key);
  }
}

function makeKey(detail = {}) {
  const source = detail.source || "unknown";
  const clip = detail.clip || detail.url || detail.text || "general";
  const message = detail.message || "error";
  return `${source}::${clip}::${message}`;
}

function handleAudioError(event) {
  const detail = event?.detail || {};
  const key = makeKey(detail);
  if (ACTIVE_KEYS.has(key)) return;
  ACTIVE_KEYS.add(key);
  detail.__key = key;
  createToast(detail);
}

window.addEventListener("matchpoint:audio:error", handleAudioError);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", ensureContainer);
} else {
  ensureContainer();
}
