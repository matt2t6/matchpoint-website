// MatchPoint TTS Client
// Bridges ElevenLabs-powered backend with front-end audio controls and cue queueing.

import { playCueAudio, fadeVolume } from "./audioManager.js";

const globalConfig = typeof window !== "undefined" ? window.__MP__ || {} : {};
const configuredTtsUrl = globalConfig.TTS_URL;
const TTS_API_URL =
  configuredTtsUrl === false ? null : configuredTtsUrl || "/api/tts";
const CACHE = new Map();
const QUEUE = [];
let processing = false;
const ALLOW_BROWSER_FALLBACK =
  typeof window !== "undefined" ? window.MATCHPOINT_ALLOW_TTS_FALLBACK === true : false;
let ttsAvailable = TTS_API_URL !== null;

function publishAudioError(detail) {
  try {
    window.dispatchEvent(new CustomEvent("matchpoint:audio:error", { detail }));
  } catch {
    // ignore
  }
}

function duckCrowd(target, duration) {
  fadeVolume("crowd", target, duration);
  fadeVolume("assets/audio/ambient/crowd_noise.mp3", target, duration);
}

export function speakCue(text, voice = "default") {
  const line = typeof text === "string" ? text.trim() : "";
  if (!line) return Promise.resolve();

  return new Promise((resolve, reject) => {
    QUEUE.push({ text: line, voice, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (processing) return;
  const next = QUEUE.shift();
  if (!next) return;

  processing = true;

  try {
    await playCueInternal(next.text, next.voice);
    next.resolve();
  } catch (err) {
    next.reject(err);
  } finally {
    processing = false;
    if (QUEUE.length > 0) {
      processQueue();
    }
  }
}

async function playCueInternal(text, voice) {
  duckCrowd(0.15, 600);
  const duration = estimateDuration(text);

  try {
    if (CACHE.has(text)) {
      await playCueAudio(CACHE.get(text));
      await sleep(duration);
      return;
    }

    if (!ttsAvailable) {
      if (ALLOW_BROWSER_FALLBACK) {
        await fallbackSpeak(text);
        await sleep(duration);
      }
      return;
    }

    const response = await fetch(TTS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        ttsAvailable = false;
        if (ALLOW_BROWSER_FALLBACK) {
          await fallbackSpeak(text);
          await sleep(duration);
        }
        return;
      }
      throw new Error(`TTS request failed: ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    CACHE.set(text, url);

    await playCueAudio(url);
    await sleep(duration);
  } catch (err) {
    console.warn("[ttsClient] ElevenLabs path failed, falling back", err);
    publishAudioError({
      source: "tts",
      message: err?.message || String(err),
      text,
    });
    if (ALLOW_BROWSER_FALLBACK) {
      await fallbackSpeak(text);
    }
  } finally {
    duckCrowd(0.35, 800);
  }
}

function fallbackSpeak(text) {
  if (typeof window === "undefined" || typeof window.speechSynthesis === "undefined") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.pitch = 1.0;
      utter.rate = 0.95;
      utter.volume = 0.9;
      const pick = window.speechSynthesis
        .getVoices()
        .find((voice) => voice && /en/i.test(voice.lang));
      if (pick) {
        utter.voice = pick;
      }
      duckCrowd(0.15, 500);
      utter.onend = () => {
        duckCrowd(0.35, 800);
        resolve();
      };
      utter.onerror = () => {
        duckCrowd(0.35, 800);
        resolve();
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (err) {
      console.error("Speech synthesis fallback failed", err);
      publishAudioError({
        source: "tts-fallback",
        message: err?.message || String(err),
        text,
      });
      duckCrowd(0.35, 800);
      resolve();
    }
  });
}

function estimateDuration(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  const approx = words * 320; // ~0.32 seconds per word
  return Math.min(7000, Math.max(2800, approx));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
