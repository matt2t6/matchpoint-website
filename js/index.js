import Chart from 'chart.js/auto';
import { AudioManager } from './modules/audio.js';
import { VoiceEngine } from './modules/voice_engine.js';
import { computeProsodyAdjust } from './modules/prosody.js';
import { createCueScheduler } from './modules/cue_scheduler.js';
import personas from '/assets/personas.json';
import personaVoices from '/assets/persona_voices.json';
import { initializeKalmanChart, initializePersonaHeatmap, initializeEmotionalTrajectory, updateDriftChart, updateHistoryPanel } from './modules/charts.js';
import { setupScrollEffects, setupParallaxEffects, toggleCoachPanel, toggleSloganDropdown, showCueExplanation, closeCueModal } from './modules/ui.js';
window.Chart = Chart;
const audioMgr = new AudioManager();
const voiceEngine = new VoiceEngine();
const cueScheduler = createCueScheduler({ voiceEngine });
      // Initialize page
      document.addEventListener("DOMContentLoaded", function () {
        // Preload common demo/coach audio so it's ready when cues arrive
        audioMgr.setVolume(1.0);
        // Telemetry bucket
        window.__telemetry = { cues: [] };
        // Persona-based prefetch (low risk): warm common clips for each primary persona
        const personaClips = (name, n=3) => (personas?.[name]?.clips || []).slice(0, n);
        audioMgr.prefetchAll(personaClips('TacticalCoach'));
        audioMgr.prefetchAll(personaClips('MentalResetAgent'));
        audioMgr.prefetchAll(personaClips('RecoveryCoach'));
        audioMgr.prefetchAll(personaClips('system_neutral'));
        // Also warm frequent demo cues
        audioMgr.prefetchAll([
          "/assets/audio/reset_01.mp3",
          "/assets/audio/recovery_01.mp3",
          "/assets/audio/tactical_01.mp3",
          "/assets/audio/coach_s_calibration.mp3"
        ], { volume: 0.4 });

        // Setup voice indicator helpers
        const voiceInd = document.getElementById('voice-ready-indicator');
        const setVoiceState = (state) => {
          if (!voiceInd) return;
          if (state === 'ready') {
            voiceInd.textContent = 'Voice: ready';
            voiceInd.className = 'text-sm px-3 py-1 rounded-md border border-emerald-600 bg-emerald-900/40 text-emerald-300';
          } else if (state === 'warming') {
            voiceInd.textContent = 'Voice: warming up';
            voiceInd.className = 'text-sm px-3 py-1 rounded-md border border-yellow-600 bg-yellow-900/30 text-yellow-300';
          } else {
            voiceInd.textContent = 'Voice: not ready';
            voiceInd.className = 'text-sm px-3 py-1 rounded-md border border-gray-700 bg-gray-800/60 text-gray-300';
          }
        };
        const setVoiceTooltip = (ms) => {
          if (!voiceInd) return;
          if (typeof ms === 'number' && isFinite(ms)) {
            voiceInd.title = `Last cue latency: ${Math.round(ms)} ms`;
          }
        };
        window.__voiceIndicator = { setVoiceState, setVoiceTooltip };

        // Persona voices UI (local-only writes)
        const pvPanel = document.getElementById('persona-voices-panel');
        const pvToggle = document.getElementById('persona-voices-toggle');
        const pvStatus = document.getElementById('persona-voices-status');
        function renderPV(mapping) {
          const get = (p, k) => (mapping?.[p]?.[k] || '');
          const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
          setVal('pv-TacticalCoach-voice', get('TacticalCoach','voice_id'));
          setVal('pv-TacticalCoach-model', get('TacticalCoach','model_id') || 'eleven_multilingual_v2');
          const tcvs = mapping?.TacticalCoach?.voice_settings || {};
          setVal('pv-TacticalCoach-stability', tcvs.stability);
          setVal('pv-TacticalCoach-similarity', tcvs.similarity_boost);
          setVal('pv-TacticalCoach-style', tcvs.style);
          const tcBoost = document.getElementById('pv-TacticalCoach-boost'); if (tcBoost) tcBoost.checked = !!tcvs.use_speaker_boost;
          setVal('pv-MentalResetAgent-voice', get('MentalResetAgent','voice_id'));
          setVal('pv-MentalResetAgent-model', get('MentalResetAgent','model_id') || 'eleven_multilingual_v2');
          const mrvs = mapping?.MentalResetAgent?.voice_settings || {};
          setVal('pv-MentalResetAgent-stability', mrvs.stability);
          setVal('pv-MentalResetAgent-similarity', mrvs.similarity_boost);
          setVal('pv-MentalResetAgent-style', mrvs.style);
          const mrBoost = document.getElementById('pv-MentalResetAgent-boost'); if (mrBoost) mrBoost.checked = !!mrvs.use_speaker_boost;
          setVal('pv-RecoveryCoach-voice', get('RecoveryCoach','voice_id'));
          setVal('pv-RecoveryCoach-model', get('RecoveryCoach','model_id') || 'eleven_multilingual_v2');
          const rcvs = mapping?.RecoveryCoach?.voice_settings || {};
          setVal('pv-RecoveryCoach-stability', rcvs.stability);
          setVal('pv-RecoveryCoach-similarity', rcvs.similarity_boost);
          setVal('pv-RecoveryCoach-style', rcvs.style);
          const rcBoost = document.getElementById('pv-RecoveryCoach-boost'); if (rcBoost) rcBoost.checked = !!rcvs.use_speaker_boost;
          setVal('pv-system_neutral-voice', get('system_neutral','voice_id'));
          setVal('pv-system_neutral-model', get('system_neutral','model_id') || 'eleven_multilingual_v2');
          const snvs = mapping?.system_neutral?.voice_settings || {};
          setVal('pv-system_neutral-stability', snvs.stability);
          setVal('pv-system_neutral-similarity', snvs.similarity_boost);
          setVal('pv-system_neutral-style', snvs.style);
          const snBoost = document.getElementById('pv-system_neutral-boost'); if (snBoost) snBoost.checked = !!snvs.use_speaker_boost;
        }
        function collectPV() {
          const val = id => (document.getElementById(id)?.value || '').trim();
          const num = id => { const s = val(id); if (s === '') return undefined; const n = Number(s); return isNaN(n) ? undefined : Math.min(1, Math.max(0, n)); };
          const chk = id => !!(document.getElementById(id)?.checked);
          const vs = (p) => {
            const o = {
              stability: num(`pv-${p}-stability`),
              similarity_boost: num(`pv-${p}-similarity`),
              style: num(`pv-${p}-style`),
              use_speaker_boost: chk(`pv-${p}-boost`),
            };
            // remove undefined keys
            Object.keys(o).forEach(k => o[k] === undefined && delete o[k]);
            return Object.keys(o).length ? o : undefined;
          };
          return {
            TacticalCoach: { voice_id: val('pv-TacticalCoach-voice'), model_id: val('pv-TacticalCoach-model') || 'eleven_multilingual_v2', voice_settings: vs('TacticalCoach') },
            MentalResetAgent: { voice_id: val('pv-MentalResetAgent-voice'), model_id: val('pv-MentalResetAgent-model') || 'eleven_multilingual_v2', voice_settings: vs('MentalResetAgent') },
            RecoveryCoach: { voice_id: val('pv-RecoveryCoach-voice'), model_id: val('pv-RecoveryCoach-model') || 'eleven_multilingual_v2', voice_settings: vs('RecoveryCoach') },
            system_neutral: { voice_id: val('pv-system_neutral-voice'), model_id: val('pv-system_neutral-model') || 'eleven_multilingual_v2', voice_settings: vs('system_neutral') },
          };
        }
        async function loadPV() {
          try {
            const r = await fetch('/api/tts/persona-voices').then(r=>r.json());
            if (r?.success && r.voices) { window.__personaVoices = r.voices; renderPV(r.voices); if (pvStatus) pvStatus.textContent = 'loaded'; }
            else { renderPV(personaVoices); if (pvStatus) pvStatus.textContent = 'using default'; }
          } catch { renderPV(personaVoices); if (pvStatus) pvStatus.textContent = 'using default'; }
        }
        async function savePV() {
          try {
            const body = { voices: collectPV() };
            const r = await fetch('/api/tts/persona-voices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r=>r.json());
            if (r?.success) { window.__personaVoices = body.voices; if (pvStatus) pvStatus.textContent = 'saved'; }
            else { if (pvStatus) pvStatus.textContent = 'save failed'; }
          } catch { if (pvStatus) pvStatus.textContent = 'save error'; }
        }
        function collectPVFor(p) {
          const val = id => (document.getElementById(id)?.value || '').trim();
          const num = id => { const s = val(id); if (s === '') return undefined; const n = Number(s); return isNaN(n) ? undefined : Math.min(1, Math.max(0, n)); };
          const chk = id => !!(document.getElementById(id)?.checked);
          const vs = {
            stability: num(`pv-${p}-stability`),
            similarity_boost: num(`pv-${p}-similarity`),
            style: num(`pv-${p}-style`),
            use_speaker_boost: chk(`pv-${p}-boost`),
          };
          Object.keys(vs).forEach(k => vs[k] === undefined && delete vs[k]);
          const o = { voice_id: val(`pv-${p}-voice`), model_id: val(`pv-${p}-model`) || 'eleven_multilingual_v2' };
          if (Object.keys(vs).length) o.voice_settings = vs;
          return o;
        }
        function sampleForPersona(p) {
          const SAMPLES = {
            TacticalCoach: 'Test phrase: Precision over power. Own the court.',
            MentalResetAgent: 'Test phrase: Breathe. Reset. Confidence returns now.',
            RecoveryCoach: 'Test phrase: Control your tempo. Recover with composure.',
            system_neutral: 'System voice check: all systems nominal.'
          };
          return SAMPLES[p] || 'Voice test: This is a sample line.';
        }
        async function testPV(personaKey) {
          const btn = document.getElementById(`pv-${personaKey}-test`);
          const lab = document.getElementById(`pv-${personaKey}-test-status`);
          try {
            if (btn) btn.disabled = true;
            if (lab) { lab.textContent = 'testing...'; lab.className = 'text-xs text-yellow-300'; }
            const cfg = collectPVFor(personaKey);
            if (window.__voiceIndicator) window.__voiceIndicator.setVoiceState('warming');
            const prep = await fetch('/api/tts/prepare', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: sampleForPersona(personaKey), persona: personaKey, ...cfg })
            }).then(r=>r.json()).catch(()=>null);
            const started = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            const maxPollMs = 4500, pollEvery = 350;
            let url = prep?.url || null;
            while (!url) {
              await new Promise(r=>setTimeout(r,pollEvery));
              const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started;
              if (elapsed > maxPollMs) break;
              const st = await fetch(`/api/tts/status?id=${encodeURIComponent(prep?.jobId||'')}`).then(r=>r.json()).catch(()=>null);
              if (st?.ready && st?.url) { url = st.url; break; }
            }
            if (url) {
              const t = await audioMgr.playWithTelemetry(url, { volume: 0.9, concurrency: 'overlap' });
              try {
                window.__telemetry.cues.push({ event: 'pv_test', persona: personaKey, ...t });
                if (window.__voiceIndicator) { window.__voiceIndicator.setVoiceTooltip(t.cue_to_voice_ms); window.__voiceIndicator.setVoiceState('ready'); }
                if (lab) { lab.textContent = `ok ${Math.round(t.cue_to_voice_ms)} ms`; lab.className = 'text-xs text-emerald-300'; }
              } catch {}
            } else {
              if (lab) { lab.textContent = 'timeout'; lab.className = 'text-xs text-red-300'; }
              if (window.__voiceIndicator) window.__voiceIndicator.setVoiceState('ready');
            }
          } catch {
            if (lab) { lab.textContent = 'error'; lab.className = 'text-xs text-red-300'; }
          } finally { if (btn) btn.disabled = false; }
        }
        async function prewarmPV(personaKey) {
          const btn = document.getElementById(`pv-${personaKey}-warm`);
          const lab = document.getElementById(`pv-${personaKey}-warm-status`);
          try {
            if (btn) btn.disabled = true;
            if (lab) { lab.textContent = 'prewarming...'; lab.className = 'text-xs text-yellow-300'; }
            const cfg = collectPVFor(personaKey);
            if (window.__voiceIndicator) window.__voiceIndicator.setVoiceState('warming');
            const prep = await fetch('/api/tts/prepare', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: sampleForPersona(personaKey), persona: personaKey, ...cfg })
            }).then(r=>r.json()).catch(()=>null);
            const started = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            const maxPollMs = 4500, pollEvery = 300;
            let url = prep?.url || null;
            while (!url) {
              await new Promise(r=>setTimeout(r,pollEvery));
              const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started;
              if (elapsed > maxPollMs) break;
              const st = await fetch(`/api/tts/status?id=${encodeURIComponent(prep?.jobId||'')}`).then(r=>r.json()).catch(()=>null);
              if (st?.ready && st?.url) { url = st.url; break; }
            }
            if (url) {
              try { await voiceEngine.preloadUrl(url); } catch {}
              if (lab) { lab.textContent = 'warmed'; lab.className = 'text-xs text-emerald-300'; }
              if (window.__voiceIndicator) window.__voiceIndicator.setVoiceState('ready');
            } else {
              if (lab) { lab.textContent = 'timeout'; lab.className = 'text-xs text-red-300'; }
              if (window.__voiceIndicator) window.__voiceIndicator.setVoiceState('ready');
            }
          } catch {
            if (lab) { lab.textContent = 'error'; lab.className = 'text-xs text-red-300'; }
          } finally { if (btn) btn.disabled = false; }
        }
        if (pvToggle && pvPanel) {
          pvToggle.addEventListener('click', () => {
            const isHidden = pvPanel.classList.contains('hidden');
            pvPanel.classList.toggle('hidden');
            pvToggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
          });
        }
        const pvSave = document.getElementById('persona-voices-save');
        const pvReload = document.getElementById('persona-voices-reload');
        if (pvSave) pvSave.addEventListener('click', () => { if (pvStatus) pvStatus.textContent = 'saving...'; savePV(); });
        if (pvReload) pvReload.addEventListener('click', () => { if (pvStatus) pvStatus.textContent = 'loading...'; loadPV(); });
        const bindTest = (p) => { const b = document.getElementById(`pv-${p}-test`); if (b) b.addEventListener('click', () => testPV(p)); };
        const bindWarm = (p) => { const b = document.getElementById(`pv-${p}-warm`); if (b) b.addEventListener('click', () => prewarmPV(p)); };
        ['TacticalCoach','MentalResetAgent','RecoveryCoach','system_neutral'].forEach(p => { bindTest(p); bindWarm(p); });
        loadPV();

        // Clamp numeric fields 0..1 with live feedback
        const clampIds = [
          'pv-TacticalCoach-stability','pv-TacticalCoach-similarity','pv-TacticalCoach-style',
          'pv-MentalResetAgent-stability','pv-MentalResetAgent-similarity','pv-MentalResetAgent-style',
          'pv-RecoveryCoach-stability','pv-RecoveryCoach-similarity','pv-RecoveryCoach-style',
          'pv-system_neutral-stability','pv-system_neutral-similarity','pv-system_neutral-style'
        ];
        clampIds.forEach(id => {
          const el = document.getElementById(id);
          if (!el) return;
          el.addEventListener('input', () => {
            let v = parseFloat(el.value);
            if (isNaN(v)) return;
            if (v < 0) v = 0; if (v > 1) v = 1;
            el.value = v.toFixed(2);
          });
        });

        // Voice Metrics HUD updater
        function updateVoiceHud() {
          const hud = document.getElementById('voice-metrics-hud');
          const cont = document.getElementById('voice-metrics-content');
          if (!hud || !cont) return;
          const rows = (window.__telemetry?.cues || []).slice(-6);
          if (!rows.length) { cont.textContent = 'latency: —'; return; }
          const vals = rows.map(r => r.cue_to_voice_ms).filter(v => typeof v === 'number' && isFinite(v));
          if (!vals.length) { cont.textContent = 'latency: —'; return; }
          const avg = vals.reduce((a,b)=>a+b,0)/vals.length;
          cont.textContent = `avg ${Math.round(avg)} ms | last ${vals.map(v=>Math.round(v)).join(', ')} ms`;
        }
        setInterval(updateVoiceHud, 800);
        // Start background crowd noise at low volume
        const crowdNoise = document.getElementById("crowd-noise");
        crowdNoise.volume = 0.05; // Very low volume so it doesn't drown out coach voice
        crowdNoise.play().catch((e) => console.log("Audio autoplay prevented"));

        // Initialize all charts
        initializeKalmanChart();
        initializePersonaHeatmap();
        initializeEmotionalTrajectory();

        // Initialize widgets with random data
        initializeWidgets();

        // Setup interactive effects
        setupScrollEffects(REDUCED_MOTION);
        setupParallaxEffects(REDUCED_MOTION);
      });

      // Widget initialization and refresh functions
      function initializeWidgets() {
        refreshServeSpeed();
        refreshSpinRate();
        refreshAccuracy();
        refreshCoverage();
        refreshReactionTime();
        refreshRallyStats();
      }

      function refreshServeSpeed() {
        const speed = Math.floor(Math.random() * 20) + 115; // 115-135 mph
        const maxSpeed = Math.floor(Math.random() * 15) + 130; // 130-145 mph
        document.getElementById("serve-speed").textContent = speed;
        document.getElementById("max-serve").textContent = maxSpeed + " mph";
      }

      function refreshSpinRate() {
        const spinRate = Math.floor(Math.random() * 1500) + 2000; // 2000-3500 rpm
        const spinTypes = ["Topspin", "Backspin", "Sidespin", "Flat"];
        const spinType = spinTypes[Math.floor(Math.random() * spinTypes.length)];
        document.getElementById("spin-rate").textContent = spinRate;
        document.getElementById("spin-type").textContent = spinType;
      }

      function refreshAccuracy() {
        const accuracy = Math.floor(Math.random() * 30) + 70; // 70-100%
        const recentHits = Math.floor(Math.random() * 5) + 6; // 6-10
        document.getElementById("shot-accuracy").textContent = accuracy;
        document.getElementById("recent-accuracy").textContent = recentHits + "/10";
      }

      function refreshCoverage() {
        const coverage = Math.floor(Math.random() * 25) + 65; // 65-90%
        const distance = (Math.random() * 0.8 + 0.8).toFixed(1); // 0.8-1.6 km
        document.getElementById("court-coverage").textContent = coverage;
        document.getElementById("total-distance").textContent = distance + " km";
      }

      function refreshReactionTime() {
        const reactionTime = (Math.random() * 0.3 + 0.25).toFixed(2); // 0.25-0.55s
        const bestReaction = (Math.random() * 0.15 + 0.2).toFixed(2); // 0.20-0.35s
        document.getElementById("reaction-time").textContent = reactionTime;
        document.getElementById("best-reaction").textContent = bestReaction + "s";
      }

      function refreshRallyStats() {
        const avgRally = (Math.random() * 6 + 4).toFixed(1); // 4.0-10.0 shots
        const longestRally = Math.floor(Math.random() * 20) + 15; // 15-35 shots
        document.getElementById("rally-length").textContent = avgRally;
        document.getElementById("longest-rally").textContent = longestRally + " shots";
      }

      // ENHANCED LOCAL AUDIO PLAYBACK - USES YOUR EXACT FILENAMES
      async function playSlogan(text) {
        const statusEl = document.getElementById("coach-status");
        const buttons = document.querySelectorAll(".slogan-btn");

        // Map slogans to their EXACT file names from your directory
        const sloganMap = {
          "Perfect your serve - every ball counts!": "slogan_01_perfect_your_serve__every",
          "Stay focused - champions are made in practice!": "slogan_02_stay_focused__champions_a",
          "Analyze your opponent - find their weakness!": "slogan_03_analyze_your_opponent__fi",
          "Mental strength wins matches!": "slogan_04_mental_strength_wins_match",
          "Footwork is everything - stay light on your feet!":
            "slogan_05_footwork_is_everything__s",
          "Trust your training - you got this!": "slogan_06_trust_your_training__you_",
          "Consistency beats power every time!": "slogan_07_consistency_beats_power_e",
          "Watch the ball - anticipate the shot!": "slogan_08_watch_the_ball__anticipat",
          "Control your breathing - stay calm under pressure!":
            "slogan_09_control_your_breathing__s",
          "Every point matters - play with purpose!": "slogan_10_every_point_matters__play",
          "Position yourself for success - court awareness is key!":
            "slogan_11_position_yourself_for_suc",
          "Adapt your strategy - be unpredictable!": "slogan_12_adapt_your_strategy__be_u",
          "Find your rhythm - feel the flow of the game!": "slogan_13_find_your_rhythm__feel_th",
          "Patience wins points - wait for your opportunity!":
            "slogan_14_patience_wins_points__wai",
          "Power comes from technique, not force!": "slogan_15_power_comes_from_techniqu",
          "Read the court - anticipate before they hit!": "slogan_16_read_the_court__anticipat",
        };

        try {
          // Disable all buttons and show loading
          buttons.forEach((btn) => {
            btn.disabled = true;
            btn.style.opacity = "0.5";
          });
          statusEl.textContent = "Loading audio...";
          statusEl.style.color = "#fbbf24";

          // Get the exact filename for this slogan
          const filename = sloganMap[text];
          if (!filename) {
            throw new Error("Slogan not found");
          }

          // Create audio element with your EXACT file path
          const audio = new Audio(`/assets/coach_slogans/${filename}.mp3`);
          audio.volume = 0.8; // Good volume level

          statusEl.textContent = "Playing...";
          statusEl.style.color = "#00F5D4";

          audio.onended = () => {
            statusEl.innerHTML = '<span class="text-green-400">●</span> Demo Mode Active';
            statusEl.style.color = "#8b949e";
            buttons.forEach((btn) => {
              btn.disabled = false;
              btn.style.opacity = "1";
            });
          };

          audio.onerror = () => {
            console.error("Audio file not found:", filename);
            statusEl.textContent = "Audio file not found";
            statusEl.style.color = "#ef4444";
            buttons.forEach((btn) => {
              btn.disabled = false;
              btn.style.opacity = "1";
            });
          };

          await audio.play();
        } catch (error) {
          console.error("Failed to play audio:", error);
          statusEl.textContent = "Audio playback failed";
          statusEl.style.color = "#ef4444";
          buttons.forEach((btn) => {
            btn.disabled = false;
            btn.style.opacity = "1";
          });
        }
      }

      // Enhanced coach panel controls
      

      // Enhanced slogan dropdown with animations
      

      

      

      // Enhanced scroll effects with parallax
      

      

      // Enhanced chart initializations
      

      

      

      // Enhanced form submission
      document.querySelector("form").addEventListener("submit", function (e) {
        e.preventDefault();

        // Create success notification
        const notification = document.createElement("div");
        notification.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, #4ade80, #22c55e);
          color: #0d1117;
          padding: 2rem 3rem;
          border-radius: 15px;
          font-weight: bold;
          font-size: 1.1rem;
          z-index: 1001;
          box-shadow: 0 20px 60px rgba(74, 222, 128, 0.3);
          animation: slideInScale 0.5s ease;
        `;
        notification.innerHTML = `
          <i class="fas fa-check-circle mr-2"></i>
          Thank you for your interest! We'll be in touch soon.
        `;
        document.body.appendChild(notification);

        // Reset form
        this.reset();

        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      });

      // Add custom animations
      const style = document.createElement("style");
      style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }

        @keyframes slideInScale {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `;
      document.head.appendChild(style);

      // Performance monitoring
      console.log("🎾 MatchPoint Systems loaded successfully!");
      console.log("🤖 AI Coach ready with local audio files!");
      console.log("📊 Analytics dashboard active!");

      // Dashboard-specific script integrated
      // Configurable API base with URL param/env fallback and auto-detect
      const ENV_API = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_BASE_URL) || (true && import.meta?.env?.VITE_API_BASE_URL);
      const URL_API = new URLSearchParams(window.location.search).get('api');
      const DEFAULT_API = 'http://localhost:5000';
      let API_BASE_URL = URL_API || ENV_API || DEFAULT_API;
      // Respect reduced-motion preference
      const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let validationInterval = null,
        historyInterval = null,
        lastHistoryData = null;
      const errorBanner = document.getElementById("error-banner");
      let sensorWeightsChart, driftChart, cueBiasChart, emotionalBaselineChart;

      async function fetchData(endpoint, options = {}) {
        try {
          if (!DEMO_MODE) errorBanner.classList.add("hidden");
          const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return await response.json();
        } catch (error) {
          console.error(`Fetch error from ${endpoint}:`, error);
          if (!DEMO_MODE) errorBanner.classList.remove("hidden");
          document.getElementById("hub-status-dot").className = "status-dot error";
          return null;
        }
      }

      // Smooth counter animation for KPIs
      const prevMetrics = { latency: null, uptime: null, anomaly: null };
      function animateCounter(el, from, to, suffix = "", duration = 600) {
        if (!el || to === undefined || to === null) return (el.textContent = `--`);
        const start = performance.now();
        const step = (t) => {
          const p = Math.min(1, (t - start) / duration);
          const val = from + (to - from) * p;
          el.textContent = `${toStringWithPrecision(val)}${suffix}`;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
      function toStringWithPrecision(n) {
        if (Math.abs(n) >= 100) return n.toFixed(0);
        if (Math.abs(n) >= 10) return n.toFixed(1);
        return n.toFixed(2);
      }

      function updateUI(data) {
        if (!data) return;
        const latency = data.enterprise_metrics?.performance_slas?.avg_latency;
        const uptime = data.enterprise_metrics?.performance_slas?.uptime;
        const latencyEl = document.getElementById("latency-metric");
        const uptimeEl = document.getElementById("uptime-metric");
        animateCounter(latencyEl, prevMetrics.latency ?? latency, latency ?? 0, " ms", 700);
        animateCounter(uptimeEl, prevMetrics.uptime ?? uptime, uptime ?? 0, " %", 900);
        prevMetrics.latency = latency;
        prevMetrics.uptime = uptime;
        document.getElementById("security-metric").textContent =
          data.enterprise_metrics?.security_compliance?.security_score.toFixed(1) || "--";
        document.getElementById("compliance-metric").textContent =
          data.enterprise_metrics?.security_compliance?.compliance_status || "--";
        // Sensor fusion weights (support both legacy and new shape)
        const weights =
          data.sensor_fusion?.adaptive_sensor_weights ||
          (data.sensor_weights
            ? Object.fromEntries(
                (data.sensor_weights.labels || []).map((l, i) => [
                  l,
                  data.sensor_weights.weights[i],
                ])
              )
            : {});
        updateSensorWeightsChart(Object.keys(weights), Object.values(weights));
        // Anomaly score (support both legacy and new shape)
        const anomaly =
          data.sensor_fusion && data.sensor_fusion.anomaly_detection_score !== undefined
            ? data.sensor_fusion.anomaly_detection_score
            : data.neural_net && data.neural_net.anomaly_score !== undefined
              ? data.neural_net.anomaly_score
              : undefined;
        const anomalyEl = document.getElementById("anomaly-metric");
        if (anomaly !== undefined) {
          animateCounter(anomalyEl, prevMetrics.anomaly ?? anomaly, anomaly, "", 800);
          prevMetrics.anomaly = anomaly;
        } else {
          anomalyEl.textContent = "--";
        }
        document.getElementById("hub-status-dot").className = "status-dot healthy";
      }

      

      function updatePersonaDriftPanel(data) {
        if (!data) return;
        const panel = document.getElementById("persona-drift-panel");
        panel.classList.remove("hidden");
        document.getElementById("vocal-style-trend").textContent =
          `STYLE TREND: ${data.tone_trend.join(" → ")}`;
        document.getElementById("gemini-insight-text").textContent = data.gemini_insight;
        updateCueBiasChart(data.cue_bias_evolution);
        updateEmotionalBaselineChart(data.emotional_baseline_trends);
        const vocalSettingsDisplay = document.getElementById("vocal-settings-display");
        const voiceSettings = data.voice_settings || {};
        vocalSettingsDisplay.innerHTML = `<span>Stability: ${voiceSettings.stability?.toFixed(2)}</span> | <span>Style: ${voiceSettings.style?.toFixed(2)}</span> | <span>Similarity: ${voiceSettings.similarity_boost?.toFixed(2)}</span>`;
      }

      async function playAudioForCategory(category) {
        try {
          // Persona switch warmup based on UI category
          const personaByCat = { Tactical: 'TacticalCoach', Reset: 'MentalResetAgent', Recovery: 'RecoveryCoach' };
          if (window.__voiceIndicator) window.__voiceIndicator.setVoiceState('warming');
          if (personaByCat[category]) {
            await (typeof warmPersona === 'function' ? warmPersona(personaByCat[category]) : Promise.resolve());
            if (window.__voiceIndicator) window.__voiceIndicator.setVoiceState('ready');
          }
        } catch(_){}
        const mockPayload = {
          player_profile: {
            player_id: "matthew_001",
            preferred_tone: "direct",
            emotional_baseline: { confidence: 0.8, composure: 0.7 },
          },
          match_context: {
            recent_cues: [],
            consecutive_errors: 0,
            serve_speed: 110,
            point_outcome: "neutral",
          },
        };
        const coachResponse = await fetchData("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mockPayload),
        });
        if (coachResponse) {
          document.getElementById("cue-text-display").textContent = `"${coachResponse.final_cue}"`;
          document.getElementById("audit-score-display").textContent =
            coachResponse.audit.score.toFixed(2);
          document.getElementById("audit-score-display").className =
            `audit-score ${coachResponse.audit.passed ? "pass" : "caution"}`;
          document.getElementById("gemini-feedback").textContent =
            coachResponse.reason_for_rewrite || "Cue passed all checks.";
          // Narrative interaction: manual cues nudge next phase authentically
          if (DEMO_MODE) {
            const phase = typeof currentDemoPhase === "string" ? currentDemoPhase : "";
            window.demoAdjust = window.demoAdjust || { anomaly: 0, latency: 0 };
            // Tactical during Pressure lowers anomaly and boosts confidence trend
            if (category === "Tactical" && (phase === "Pressure" || phase === "Rally")) {
              window.demoAdjust.anomaly += -0.03;
              window.demoAdjust.latency += -8;
              window.demoState.confBase += 0.02;
              window.demoState.compBase += 0.015;
              safePlaySlogan(
                nextCarousel("Tactical") ||
                  "Position yourself for success - court awareness is key!"
              );
            }
            // Reset helps composure under Pressure
            if (category === "Reset") {
              window.demoAdjust.anomaly += -0.025;
              window.demoState.compBase += 0.02;
              safePlaySlogan(
                nextCarousel("Reset") || "Control your breathing - stay calm under pressure!"
              );
            }
            // Recovery stabilizes both
            if (category === "Recovery") {
              window.demoAdjust.anomaly += -0.02;
              window.demoState.confBase += 0.01;
              window.demoState.compBase += 0.02;
              safePlaySlogan(
                nextCarousel("Recovery") || "Find your rhythm - feel the flow of the game!"
              );
            }
          }
          // Refresh history so timeline and stats move live
          const hist = await fetchData("/api/history?player_id=matthew_001");
          if (hist) updateHistoryPanel(hist);
        }
      }

      async function composeCue() {
        const composePanel = document.getElementById("improvisation-panel");
        const response = await fetchData("/api/compose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player_id: "matthew_001" }),
        });
        if (response) {
          document.getElementById("generated-cue-text").textContent =
            `"${response.generated_cue_text}"`;
          document.getElementById("generation-reason").textContent = response.generation_reason;
          // Append directly to library for immediate feedback
          const libraryList = document.getElementById("cue-library-list");
          if (libraryList) {
            const div = document.createElement("div");
            div.className = "p-2 bg-gray-800/50 rounded-md";
            div.innerHTML = `<p class="font-semibold text-cyan-400">"${response.generated_cue_text}"</p><p class="text-xs text-gray-500">${response.generation_reason || ""}</p>`;
            libraryList.prepend(div);
          }
          // Refresh history to keep panels in sync
          const data = await fetchData("/api/history?player_id=matthew_001");
          if (data) updateHistoryPanel(data);
          if (composePanel) {
            composePanel.classList.add("shimmer");
            setTimeout(() => composePanel.classList.remove("shimmer"), 1500);
          }

          // === Real-time TTS (optimistic) ===
          try {
            const text = (response.generated_cue_text || '').toString();
            // Heuristic persona selection; adjust if your /api/compose returns persona
            const inferredPersona = (response.persona || '').toString() || 'TacticalCoach';
            const pvDynamic = (window.__personaVoices || {})[inferredPersona] || {};
            const pvStatic = (personaVoices || {})[inferredPersona] || {};
            const pv = Object.assign({}, pvStatic, pvDynamic);
            const voice_id = pv.voice_id;
            const model_id = pv.model_id;
            const voice_settings = pv.voice_settings; // optional
            if (window.__voiceIndicator) window.__voiceIndicator.setVoiceState('warming');

            // Kick off TTS preparation
            // Prosody adjustment based on current drift (demoState or default)
            const drift = (window.demoState ? { conf: window.demoState.confBase, comp: window.demoState.compBase } : { conf: 0.5, comp: 0.5 });
            const prosody_adjust = computeProsodyAdjust(drift);
            const prepRes = await fetch('/api/tts/prepare', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text, persona: inferredPersona, prosody_adjust })
            }).then(r => r.json()).catch(() => null);

            const fallbackByPersona = {
              TacticalCoach: '/assets/audio/tactical/tactical_01.mp3',
              MentalResetAgent: '/assets/audio/reset/reset_01.mp3',
              RecoveryCoach: '/assets/audio/recovery/recovery_01.mp3',
              system_neutral: '/assets/audio/coach_s_calibration.mp3'
            };
            const fallbackUrl = fallbackByPersona[inferredPersona] || '/assets/audio/tactical/tactical_01.mp3';

            // Play fallback via VoiceEngine immediately (capacitor buffer),
            // and prepare to crossfade to TTS when ready.
            let handle = null;
            if (!prepRes?.ready || !prepRes?.url) {
              try { handle = await voiceEngine.playUrl(fallbackUrl, { persona: inferredPersona, volume: 0.85 }); } catch {}
            } else {
              try { handle = await voiceEngine.playUrl(prepRes.url, { persona: inferredPersona, volume: 0.9 }); } catch {}
            }

            // If ready now, play TTS; else poll for a short window
            const maxPollMs = 4000;
            const pollEvery = 400;
            let gaveUp = false;
            let urlToPlay = prepRes?.url || null;

            const started = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            while (!urlToPlay) {
              await new Promise(res => setTimeout(res, pollEvery));
              const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started;
              if (elapsed > maxPollMs) { gaveUp = true; break; }
              const stat = await fetch(`/api/tts/status?id=${encodeURIComponent(prepRes?.jobId || '')}`).then(r => r.json()).catch(() => null);
              if (stat?.ready && stat?.url) { urlToPlay = stat.url; break; }
            }

            if (urlToPlay) {
              try {
                // Prefer streaming endpoint for lower startup latency
            const streamUrl = urlToPlay.replace('/file/', '/stream/');
            const nextHandle = await voiceEngine.playStream(streamUrl, { persona: inferredPersona, volume: 0.95, fadeInMs: 120 });
                if (handle) { try { handle.stop(); } catch {} }
                handle = nextHandle;
                const tPlay = (typeof performance !== 'undefined' ? performance.now() : Date.now());
                const cue_to_voice_ms = Math.max(0, tPlay - started);
                try { window.__telemetry.cues.push({ event: 'compose_tts', persona: inferredPersona, url: urlToPlay, cue_to_voice_ms }); } catch {}
                try { await fetch('/api/soul/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'compose_tts', payload: { persona: inferredPersona, url: urlToPlay, cue_to_voice_ms } }) }); } catch {}
                if (window.__voiceIndicator) { window.__voiceIndicator.setVoiceTooltip(cue_to_voice_ms); window.__voiceIndicator.setVoiceState('ready'); }
              } catch {}
            } else {
              // Stayed on fallback
              if (window.__voiceIndicator) window.__voiceIndicator.setVoiceState('ready');
            }
          } catch (e) { /* non-fatal for demo */ }
        }
      }

      function initCharts() {
        Chart.defaults.color = "#9ca3af";
        const gridColor = "rgba(55, 65, 81, 0.5)";
        const sensorCtx = document.getElementById("sensor-weights-chart").getContext("2d");
        sensorWeightsChart = new Chart(sensorCtx, {
          type: "bar",
          data: {
            labels: [],
            datasets: [{ label: "Weight", data: [], backgroundColor: "rgba(59, 130, 246, 0.5)" }],
          },
          options: {
            maintainAspectRatio: false,
            indexAxis: "y",
            plugins: { legend: { display: false } },
            scales: {
              x: { min: 0, max: 1, grid: { color: gridColor } },
              y: { grid: { color: gridColor } },
            },
          },
        });
        const driftCtx = document.getElementById("drift-chart").getContext("2d");
        driftChart = new Chart(driftCtx, {
          type: "line",
          data: {
            labels: [],
            datasets: [
              {
                label: "Confidence Δ",
                data: [],
                borderColor: "#34d399",
                tension: 0.2,
                pointRadius: 2,
              },
              {
                label: "Composure Δ",
                data: [],
                borderColor: "#60a5fa",
                tension: 0.2,
                pointRadius: 2,
              },
            ],
          },
          options: {
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: "bottom",
                labels: { boxWidth: 10, font: { size: 10 } },
              },
            },
            scales: { y: { display: false, beginAtZero: true }, x: { display: false } },
          },
        });
        const biasCtx = document.getElementById("cue-bias-chart").getContext("2d");
        cueBiasChart = new Chart(biasCtx, {
          type: "radar",
          data: {
            labels: [],
            datasets: [
              {
                label: "Cue Bias",
                data: [],
                backgroundColor: "rgba(168, 85, 247, 0.2)",
                borderColor: "rgba(168, 85, 247, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              r: {
                beginAtZero: true,
                max: 0.7,
                pointLabels: { color: "#c9d1d9" },
                grid: { color: gridColor },
                angleLines: { color: gridColor },
              },
            },
          },
        });
        const baselineCtx = document.getElementById("emotional-baseline-chart").getContext("2d");
        emotionalBaselineChart = new Chart(baselineCtx, {
          type: "line",
          data: {
            labels: [],
            datasets: [
              { label: "Confidence", data: [], borderColor: "#34d399" },
              { label: "Composure", data: [], borderColor: "#60a5fa" },
              { label: "Resilience", data: [], borderColor: "#f59e0b" },
            ],
          },
          options: {
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: "bottom",
                labels: { boxWidth: 10, font: { size: 10 } },
              },
            },
            scales: {
              y: { min: 0, max: 1, grid: { color: gridColor } },
              x: { grid: { color: gridColor } },
            },
          },
        });
      }

      function updateSensorWeightsChart(labels, data) {
        if (sensorWeightsChart) {
          sensorWeightsChart.data.labels = labels;
          sensorWeightsChart.data.datasets[0].data = data;
          sensorWeightsChart.update();
        }
      }

      

      function updateCueBiasChart(biasData) {
        if (!cueBiasChart || !biasData) return;
        cueBiasChart.data.labels = Object.keys(biasData);
        cueBiasChart.data.datasets[0].data = Object.values(biasData);
        cueBiasChart.update();
      }
      function updateEmotionalBaselineChart(baselineData) {
        if (!emotionalBaselineChart || !baselineData) return;
        const labels = Array.from(
          { length: baselineData.confidence.length },
          (_, i) => `S${i + 1}`
        );
        emotionalBaselineChart.data.labels = labels;
        emotionalBaselineChart.data.datasets[0].data = baselineData.confidence;
        emotionalBaselineChart.data.datasets[1].data = baselineData.composure;
        emotionalBaselineChart.data.datasets[2].data = baselineData.resilience;
        emotionalBaselineChart.update();
      }

      function startSession(isTour = false) {
        const scenario = document.getElementById("scenario-select").value;
        const btn = document.getElementById("start-session-btn");
        if (!isTour) {
          btn.textContent = "Session Active...";
          btn.disabled = true;
          btn.classList.add("opacity-50", "cursor-not-allowed");
        }
        if (validationInterval) clearInterval(validationInterval);
        validationInterval = setInterval(async () => {
          const data = await fetchData(`/api/validation/${scenario}`);
          updateUI(data);
        }, 2500);
        if (historyInterval) clearInterval(historyInterval);
        historyInterval = setInterval(async () => {
          const data = await fetchData("/api/history?player_id=matthew_001");
          updateHistoryPanel(data);
        }, 3500);
      }

      async function checkInitialHealth() {
        let health = null;
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 1200);
          const resp = await fetch(`${API_BASE_URL}/api/health`, { signal: ctrl.signal });
          clearTimeout(t);
          if (resp.ok) health = await resp.json();
        } catch (e) {}
        if (health && health.status === "healthy") {
          errorBanner.classList.add("hidden");
        } else {
          // Clean fallback to demo mode
          DEMO_MODE = true;
          errorBanner.classList.add("hidden");
          const status = document.getElementById("coach-status");
          if (status) {
            status.textContent = "Demo Mode Active (backend not detected)";
            status.style.color = "#8b949e";
          }
          document.getElementById("hub-status-dot").className = "status-dot healthy";
          startDemoNarrative();
        }
      }

      const walkthroughOverlay = document.getElementById("walkthrough-overlay");
      const walkthroughText = document.getElementById("walkthrough-text");
      const nextWalkthroughBtn = document.getElementById("next-walkthrough-btn");
      const endWalkthroughBtn = document.getElementById("end-walkthrough-btn");
      let currentStep = 0,
        activeSpotlight = null;

      const tourScript = [
        {
          id: "diagnostic-hub-panel",
          text: "Welcome to the MatchPoint Intelligence Dashboard. This is the Diagnostic Hub, where we can initiate various real-time validation scenarios to test the system's resilience and accuracy.",
        },
        {
          id: "diagnostic-hub-panel",
          text: "Let's start an 'Environmental' session to simulate real-world conditions.",
          action: () => startSession(true),
        },
        {
          id: "metrics-panel",
          text: "On the right, you can see live Enterprise Metrics. We guarantee sub-200ms latency and 99.99% uptime, all tracked in real-time.",
        },
        {
          id: "sensor-fusion-panel",
          text: "Our Sensor Fusion panel shows how the system intelligently weighs data from different sources. The Neural Net adapts on the fly, and the Anomaly Score reflects system confidence.",
        },
        {
          id: "ai-coach-panel",
          text: "This is the AI Coach. It audits every cue for persona alignment and ethical delivery.",
        },
        {
          id: "improvisation-panel",
          text: "When a cue isn't perfect, the system can improvise. This panel shows how the AI can compose new, emotionally attuned cues on demand.",
          action: () => composeCue(),
        },
        {
          id: "cue-history-manager",
          text: "Every action is recorded in the CueHistoryManager. This is the system's memory—its soul. It tracks emotional drift and provides session summaries, proving that it learns.",
        },
        {
          id: "persona-drift-panel",
          text: "Finally, the PersonaDriftTracker visualizes the long-term impact of our coaching, showing how a player's profile and the AI's own voice evolve over time.",
          action: async () => {
            const data = await fetchData("/api/drift");
            updatePersonaDriftPanel(data);
          },
        },
        {
          id: "contact",
          text: "This concludes our tour. This is more than a demo; it's a new standard for emotionally intelligent AI. Let's build the future together.",
        },
      ];

      function runWalkthroughStep() {
        if (currentStep >= tourScript.length) {
          endWalkthrough();
          return;
        }
        const step = tourScript[currentStep];
        const element = document.getElementById(step.id);
        if (activeSpotlight) activeSpotlight.classList.remove("spotlight");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("spotlight");
          activeSpotlight = element;
        }
        walkthroughText.textContent = step.text;
        if (step.action) step.action();
        if (currentStep === tourScript.length - 1) {
          nextWalkthroughBtn.textContent = "Finish";
        } else {
          nextWalkthroughBtn.textContent = "Next →";
        }
      }

      function startWalkthrough() {
        currentStep = 0;
        walkthroughOverlay.classList.add("visible");
        runWalkthroughStep();
      }
      function endWalkthrough() {
        walkthroughOverlay.classList.remove("visible");
        if (activeSpotlight) activeSpotlight.classList.remove("spotlight");
        const btn = document.getElementById("start-session-btn");
        btn.textContent = "Start Session";
        btn.disabled = false;
        btn.classList.remove("opacity-50", "cursor-not-allowed");
        if (validationInterval) clearInterval(validationInterval);
        if (historyInterval) clearInterval(historyInterval);
      }

      // === START: Demo Narrative Director (UI-only, authentic-feel) ===
      // Global demo flag (set by health auto-detect or tour)
      let DEMO_MODE = false;
      let demoTimers = [];
      const DEMO_SPEED = 1.7; // ~1.7x pacing
      let currentDemoPhase = null;
      // Global demo state so manual clicks can influence next updates
      window.demoState = { confBase: 0, compBase: 0 };
      window.demoAdjust = { anomaly: 0, latency: 0 };
      const PHASE_SLOGANS = {
        Warmup: "Perfect your serve - every ball counts!",
        Pressure: "Control your breathing - stay calm under pressure!",
        Reset: "Trust your training - you got this!",
        Rally: "Find your rhythm - feel the flow of the game!",
        Breakthrough: "Every point matters - play with purpose!",
        Closeout: "Read the court - anticipate before they hit!",
      };
      function safePlaySlogan(text) {
        // Persona-aware manual cue playback with AudioManager + telemetry
        try {
          const baseMap = {
            "Perfect your serve - every ball counts!": { url: "/assets/coach_slogans/slogan_01_perfect_your_serve__every.mp3", persona: 'TacticalCoach', fallback: "/assets/audio/tactical/tactical_01.mp3" },
            "Stay focused - champions are made in practice!": { url: "/assets/coach_slogans/slogan_02_stay_focused__champions_a.mp3", persona: 'MentalResetAgent', fallback: "/assets/audio/reset/reset_02.mp3" },
            "Analyze your opponent - find their weakness!": { url: "/assets/coach_slogans/slogan_03_analyze_your_opponent__fi.mp3", persona: 'TacticalCoach', fallback: "/assets/audio/tactical/tactical_03.mp3" },
            "Mental strength wins matches!": { url: "/assets/coach_slogans/slogan_04_mental_strength_wins_match.mp3", persona: 'MentalResetAgent', fallback: "/assets/audio/reset/reset_03.mp3" },
            "Footwork is everything - stay light on your feet!": { url: "/assets/coach_slogans/slogan_05_footwork_is_everything__s.mp3", persona: 'TacticalCoach', fallback: "/assets/audio/tactical/tactical_04.mp3" },
            "Trust your training - you got this!": { url: "/assets/coach_slogans/slogan_06_trust_your_training__you_.mp3", persona: 'MentalResetAgent', fallback: "/assets/audio/reset/reset_01.mp3" },
            "Consistency beats power every time!": { url: "/assets/coach_slogans/slogan_07_consistency_beats_power_e.mp3", persona: 'TacticalCoach', fallback: "/assets/audio/tactical/tactical_02.mp3" },
            "Watch the ball - anticipate the shot!": { url: "/assets/coach_slogans/slogan_08_watch_the_ball__anticipat.mp3", persona: 'TacticalCoach', fallback: "/assets/audio/tactical/tactical_05.mp3" },
            "Control your breathing - stay calm under pressure!": { url: "/assets/coach_slogans/slogan_09_control_your_breathing__s.mp3", persona: 'MentalResetAgent', fallback: "/assets/audio/reset/reset_04.mp3" },
            "Every point matters - play with purpose!": { url: "/assets/coach_slogans/slogan_10_every_point_matters__play.mp3", persona: 'TacticalCoach', fallback: "/assets/audio/tactical/tactical_06.mp3" },
            "Position yourself for success - court awareness is key!": { url: "/assets/coach_slogans/slogan_11_position_yourself_for_suc.mp3", persona: 'TacticalCoach', fallback: "/assets/audio/tactical/tactical_07.mp3" },
            "Adapt your strategy - be unpredictable!": { url: "/assets/coach_slogans/slogan_12_adapt_your_strategy__be_u.mp3", persona: 'TacticalCoach', fallback: "/assets/audio/tactical/tactical_08.mp3" },
            "Find your rhythm - feel the flow of the game!": { url: "/assets/coach_slogans/slogan_13_find_your_rhythm__feel_th.mp3", persona: 'RecoveryCoach', fallback: "/assets/audio/recovery/recovery_01.mp3" },
            "Patience wins points - wait for your opportunity!": { url: "/assets/coach_slogans/slogan_14_patience_wins_points__wai.mp3", persona: 'MentalResetAgent', fallback: "/assets/audio/reset/reset_05.mp3" },
            "Power comes from technique, not force!": { url: "/assets/coach_slogans/slogan_15_power_comes_from_techniqu.mp3", persona: 'TacticalCoach', fallback: "/assets/audio/tactical/tactical_09.mp3" },
            "Read the court - anticipate before they hit!": { url: "/assets/coach_slogans/slogan_16_read_the_court__anticipat.mp3", persona: 'TacticalCoach', fallback: "/assets/audio/tactical/tactical_10.mp3" }
          };
          const cfg = baseMap[text];
          if (!cfg) return;
          // Persona warm + indicator
          try { if (window.__voiceIndicator) window.__voiceIndicator.setVoiceState('warming'); } catch(_){ }
          try { if (typeof warmPersona === 'function') warmPersona(cfg.persona); } catch(_){ }
          // Try coach_slogans first; fallback to local persona clip
          audioMgr.preload(cfg.url, { volume: 0.8 })
            .then(() => audioMgr.playWithTelemetry(cfg.url, { volume: 0.8, concurrency: 'overlap' }))
            .catch(() => audioMgr.playWithTelemetry(cfg.fallback, { volume: 0.8, concurrency: 'overlap' }))
            .then((t) => {
              try {
                if (t && t.cue_to_voice_ms != null) {
                  if (window.__telemetry) window.__telemetry.cues.push({ event: 'manual_slogan', text, url: t.url, cue_to_voice_ms: t.cue_to_voice_ms });
                  if (window.__voiceIndicator) window.__voiceIndicator.setVoiceTooltip(t.cue_to_voice_ms);
                  if (window.__voiceIndicator) window.__voiceIndicator.setVoiceState('ready');
                }
              } catch(_){}
            })
            .catch(()=>{});
        } catch (e) {
          // Fallback to legacy method
          try { if (typeof playSlogan === 'function') playSlogan(text); } catch(_){ }
        }
      }

      // Slogan Carousel — never repeats until the set is exhausted
      const SLOGAN_SETS = {
        Phase: [
          "Perfect your serve - every ball counts!",
          "Control your breathing - stay calm under pressure!",
          "Trust your training - you got this!",
          "Find your rhythm - feel the flow of the game!",
          "Every point matters - play with purpose!",
          "Read the court - anticipate before they hit!",
        ],
        Tactical: [
          "Perfect your serve - every ball counts!",
          "Analyze your opponent - find their weakness!",
          "Position yourself for success - court awareness is key!",
          "Adapt your strategy - be unpredictable!",
          "Power comes from technique, not force!",
          "Watch the ball - anticipate the shot!",
        ],
        Reset: [
          "Control your breathing - stay calm under pressure!",
          "Trust your training - you got this!",
          "Stay focused - champions are made in practice!",
          "Patience wins points - wait for your opportunity!",
        ],
        Recovery: [
          "Find your rhythm - feel the flow of the game!",
          "Consistency beats power every time!",
          "Footwork is everything - stay light on your feet!",
        ],
      };
      const carouselState = { Phase: 0, Tactical: 0, Reset: 0, Recovery: 0 };
      function nextCarousel(category) {
        const list = SLOGAN_SETS[category];
        if (!list || list.length === 0) return null;
        let idx = carouselState[category] % list.length;
        const text = list[idx];
        carouselState[category] = idx + 1;
        return text;
      }

      function stopDemoNarrative() {
        DEMO_MODE = false;
        demoTimers.forEach((t) => clearTimeout(t));
        demoTimers = [];
        // resume backend polling if needed
        if (!validationInterval) {
          const scenario = document.getElementById("scenario-select").value;
          validationInterval = setInterval(async () => {
            const data = await fetchData(`/api/validation/${scenario}`);
            updateUI(data);
          }, 2500);
        }
        if (!historyInterval) {
          historyInterval = setInterval(async () => {
            const data = await fetchData("/api/history?player_id=matthew_001");
            updateHistoryPanel(data);
          }, 3500);
        }
      }

      function startDemoNarrative() {
        // Pause backend polling while demo drives the UI
        if (validationInterval) {
          clearInterval(validationInterval);
          validationInterval = null;
        }
        if (historyInterval) {
          clearInterval(historyInterval);
          historyInterval = null;
        }
        DEMO_MODE = true;

        const phases = [
          {
            name: "Warmup",
            dur: 4000,
            drift: { conf: 0.03, comp: 0.02 },
            anomaly: 0.06,
            sla: { lat: 165, up: 99.94 },
            weights: { Vision: 0.28, Ballistics: 0.32, Pose: 0.22, Acoustics: 0.18 },
            sound: "/assets/audio/tactical_01.mp3",
          },
          {
            name: "Pressure",
            dur: 4200,
            drift: { conf: -0.05, comp: -0.04 },
            anomaly: 0.14,
            sla: { lat: 190, up: 99.91 },
            weights: { Vision: 0.24, Ballistics: 0.38, Pose: 0.2, Acoustics: 0.18 },
            sound: "/assets/audio/reset_01.mp3",
          },
          {
            name: "Reset",
            dur: 3800,
            drift: { conf: 0.04, comp: 0.05 },
            anomaly: 0.09,
            sla: { lat: 170, up: 99.95 },
            weights: { Vision: 0.26, Ballistics: 0.34, Pose: 0.24, Acoustics: 0.16 },
            sound: "/assets/audio/recovery_01.mp3",
          },
          {
            name: "Rally",
            dur: 4200,
            drift: { conf: 0.06, comp: 0.04 },
            anomaly: 0.07,
            sla: { lat: 160, up: 99.97 },
            weights: { Vision: 0.3, Ballistics: 0.3, Pose: 0.25, Acoustics: 0.15 },
            sound: "/assets/audio/tactical_02.mp3",
          },
          {
            name: "Breakthrough",
            dur: 4200,
            drift: { conf: 0.07, comp: 0.06 },
            anomaly: 0.05,
            sla: { lat: 150, up: 99.98 },
            weights: { Vision: 0.32, Ballistics: 0.28, Pose: 0.25, Acoustics: 0.15 },
            sound: "/assets/audio/coach_s_celebrate_focus.mp3",
          },
          {
            name: "Closeout",
            dur: 3600,
            drift: { conf: 0.03, comp: 0.03 },
            anomaly: 0.06,
            sla: { lat: 155, up: 99.98 },
            weights: { Vision: 0.31, Ballistics: 0.29, Pose: 0.26, Acoustics: 0.14 },
            sound: "/assets/audio/coach_s_cooldown_breathe.mp3",
          },
        ];

        let confBase = window.demoState.confBase,
          compBase = window.demoState.compBase;
        let composed = [];

        const schedulePhase = (idx, delay) => {
          // Prefetch the phase's linked sound so playback is instant and update indicator
          try {
            const s = phases[idx]?.sound;
            if (s) {
              if (window.__voiceIndicator) window.__voiceIndicator.setVoiceState('warming');
              audioMgr.preload(s, { volume: 0.4 }).then(() => {
                if (window.__voiceIndicator) window.__voiceIndicator.setVoiceState('ready');
              }).catch(()=>{});
              // Persona-based warm based on sound path
              if (s.includes('/tactical/')) { audioMgr.prefetchAll(personaClips('TacticalCoach')); cueScheduler.prewarmPersona('TacticalCoach'); }
              else if (s.includes('/reset/')) { audioMgr.prefetchAll(personaClips('MentalResetAgent')); cueScheduler.prewarmPersona('MentalResetAgent'); }
              else if (s.includes('/recovery/')) { audioMgr.prefetchAll(personaClips('RecoveryCoach')); cueScheduler.prewarmPersona('RecoveryCoach'); }
            }
          } catch (_) {}
          const to = setTimeout(() => {
            if (!DEMO_MODE) return;
            const p = phases[idx];
            currentDemoPhase = p.name;
            // Voice slogan synced to phase using carousel (no repeats until cycle completes)
            safePlaySlogan(
              nextCarousel("Phase") ||
                PHASE_SLOGANS[p.name] ||
                "Trust your training - you got this!"
            );

            // Build synthetic validation payload for updateUI
            const weights = p.weights;
            // Apply manual-adjust influence (decays over time)
            const anomalyAdj = window.demoAdjust?.anomaly || 0;
            const latAdj = window.demoAdjust?.latency || 0;
            const data = {
              enterprise_metrics: {
                performance_slas: {
                  avg_latency: Math.max(120, p.sla.lat + latAdj),
                  uptime: p.sla.up,
                },
                security_compliance: { security_score: 9.8, compliance_status: "SOC2-ready" },
              },
              sensor_weights: { labels: Object.keys(weights), weights: Object.values(weights) },
              neural_net: { anomaly_score: Math.max(0, Math.min(0.3, p.anomaly + anomalyAdj)) },
            };
            updateUI(data);

            // Drift narrative
            const steps = 12;
            const drift = [];
            confBase += p.drift.conf;
            compBase += p.drift.comp;
            window.demoState.confBase = confBase;
            window.demoState.compBase = compBase;
            for (let i = 0; i < steps; i++) {
              const nudge = i / steps;
              drift.push({
                confidence_change: Number((confBase * nudge).toFixed(3)),
                composure_change: Number((compBase * nudge).toFixed(3)),
              });
            }
            updateDriftChart(drift);

            // History narrative (minimal)
            const now = new Date();
            const lastCue = {
              timestamp: now.toISOString(),
              cue_category: idx % 2 === 0 ? "Tactical" : "Reset",
              original_cue: idx % 2 === 0 ? "Exploit the open court." : "Exhale. Reset stance.",
              audit_score: 0.95,
              rewrite_details: { reason: idx % 2 ? "calm-down" : "sharpen" },
            };
            const fakeHistory = {
              recent_cues: [lastCue],
              emotional_drift_trend: drift,
              rewrite_stats: { rate: 0.85, rewritten: 34, total: 40 },
              latest_summary: {
                summary: {
                  profile_adjustment_suggestion:
                    "Lean into tempo control. Sustain composure on break points.",
                },
              },
              composed_cues: composed,
            };
            updateHistoryPanel(fakeHistory);

            // Occasionally compose a cue during demo
            if (idx === 2 || idx === 4) {
              const cue = {
                generated_cue_text:
                  idx === 2 ? "Breathe. Own the pace." : "Choose high-percentage shots.",
                generation_reason: p.name,
              };
              composed.push(cue);
              const libraryList = document.getElementById("cue-library-list");
              if (libraryList) {
                const div = document.createElement("div");
                div.className = "p-2 bg-gray-800/50 rounded-md";
                div.innerHTML = `<p class="font-semibold text-cyan-400">"${cue.generated_cue_text}"</p><p class="text-xs text-gray-500">${cue.generation_reason}</p>`;
                libraryList.prepend(div);
              }
            }

            // Decay manual adjustments gradually
            if (window.demoAdjust) {
              window.demoAdjust.anomaly *= 0.5;
              window.demoAdjust.latency *= 0.5;
            }
            // Chain next phase
            if (idx + 1 < phases.length) {
              schedulePhase(idx + 1, phases[idx].dur / DEMO_SPEED);
            }
          }, delay);
          demoTimers.push(to);
        };
        schedulePhase(0, 400 / DEMO_SPEED);
      }
      // === END: Demo Narrative Director ===

      async function generateSessionMemoir() {
        const memoirModal = document.getElementById("memoir-modal");
        const memoirContent = document.getElementById("memoir-content");
        // Fallback: fetch history if not yet loaded
        if (!lastHistoryData) {
          const data = await fetchData("/api/history?player_id=matthew_001");
          if (data) lastHistoryData = data;
        }
        if (!lastHistoryData) {
          memoirContent.innerHTML =
            "<p>No session data available to generate a memoir. Please run a session first.</p>";
        } else {
          const summary =
            lastHistoryData.latest_summary?.summary?.profile_adjustment_suggestion ||
            "No specific profile adjustments suggested.";
          const rewrites = lastHistoryData.rewrite_stats;
          let cumulativeConfidence = 0;
          lastHistoryData.emotional_drift_trend.forEach(
            (d) => (cumulativeConfidence += d.confidence_change || 0)
          );
          let cumulativeComposure = 0;
          lastHistoryData.emotional_drift_trend.forEach(
            (d) => (cumulativeComposure += d.composure_change || 0)
          );
          const narrative = `
                  <h3 class="text-xl font-bold text-cyan-400 mb-3">Session Narrative Summary</h3>
                  <p class="mb-2">This session demonstrated the system's adaptive intelligence. The dominant cue category was <strong>${lastHistoryData.recent_cues[0]?.cue_category || "N/A"}</strong>.</p>
                  <p class="mb-2">Emotional drift analysis showed a final confidence change of <strong>${cumulativeConfidence.toFixed(2)}</strong> and a composure change of <strong>${cumulativeComposure.toFixed(2)}</strong>, indicating the player's evolving psychological state.</p>
                  <p class="mb-2">The system's rewrite frequency was <strong>${(rewrites.rate * 100).toFixed(0)}%</strong>, showing active recalibration of its coaching strategy.</p>
                  <h4 class="text-lg font-semibold text-cyan-400 mt-4 mb-2">Strategic Recommendation</h4>
                  <p class="italic">"${summary}"</p>`;
          memoirContent.innerHTML = narrative;
        }
        memoirModal.style.display = "block";
      }

      document
        .querySelectorAll(".cue-btn")
        .forEach((button) =>
          button.addEventListener("click", () => playAudioForCategory(button.dataset.category))
        );
      // === START: Cinematic Tour Function ===
      function startCinematicTour() {
        // Micro tennis animation (subtle accent)
        if (!REDUCED_MOTION) {
          const ball = document.createElement("div");
          ball.className = "tennis-ball";
          ball.innerHTML =
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="#00F5D4" stroke-width="2" fill="none"/><path d="M2 10 C8 8, 16 16, 22 14" stroke="#00F5D4" stroke-width="2" fill="none"/></svg>';
          document.body.appendChild(ball);
          setTimeout(() => ball.remove(), 1600);
        }

        // Sound cue + smooth scroll to dashboard
        audioMgr.playWithTelemetry("/assets/audio/reset_01.mp3", { volume: 0.4, concurrency: 'overlap' })
          .then(t => { try { window.__telemetry.cues.push({ event: 'tour_start', ...t }); if (window.__voiceIndicator) window.__voiceIndicator.setVoiceTooltip(t.cue_to_voice_ms); } catch(_){} });
        const dash = document.getElementById("dashboard");
        if (dash) dash.scrollIntoView({ behavior: "smooth", block: "start" });

        // Intro.js cinematic tour with button focusing
        if (typeof introJs !== "function") return;
        const tour = introJs();
        tour.setOptions({
          scrollTo: true,
          scrollToElement: true,
          showProgress: true,
          exitOnOverlayClick: false,
          tooltipClass: "intro-tooltip",
          highlightClass: "highlight-focus",
          steps: [
            {
              element: "#diagnostic-hub-panel",
              intro: "Diagnostic Hub: start test sessions and scenarios.",
            },
            {
              element: "#ai-coach-panel",
              intro: "AI Coach audits and refines cues for persona alignment.",
            },
            {
              element: "#improvisation-panel",
              intro: "Gemini Improvisation composes emotionally attuned cues.",
            },
            {
              element: "#cue-history-manager",
              intro: "CueHistoryManager tracks timeline, drift, and rewrites.",
            },
            {
              element: "#metrics-panel",
              intro: "Enterprise metrics: latency, uptime, and compliance.",
            },
            {
              element: "#persona-drift-panel",
              intro: "PersonaDriftTracker visualizes long-term evolution.",
            },
          ],
        });

        // Panel glow helper
        let prevTarget = null;
        const glowPanel = (el) => {
          if (prevTarget) prevTarget.classList.remove("panel-glow");
          if (el) {
            el.classList.add("panel-glow");
            el.classList.add("edge-sweep");
            setTimeout(() => el.classList.remove("edge-sweep"), 1300);
            prevTarget = el;
          }
        };

        const focusButtons = () => {
          const nextBtn = document.querySelector(".introjs-nextbutton");
          const doneBtn = document.querySelector(".introjs-donebutton");
          [nextBtn, doneBtn].forEach((btn) => {
            if (btn) {
              btn.classList.add("pulse-next");
              btn.style.outline = "3px solid #10b981";
              btn.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          });
          // Explicitly clear outline on the close (X)
          const skipBtn = document.querySelector(".introjs-skipbutton");
          if (skipBtn) skipBtn.style.outline = "none";
        };

        tour.onafterchange((el) => {
          glowPanel(el);
          focusButtons();
        });
        const refocus = () => focusButtons();
        document.addEventListener("click", refocus);
        document.addEventListener("keydown", refocus);

        const finish = () => {
          document.removeEventListener("click", refocus);
          document.removeEventListener("keydown", refocus);
          if (prevTarget) prevTarget.classList.remove("panel-glow");
          audioMgr.playWithTelemetry("/assets/audio/coach_s_calibration.mp3", { volume: 0.5, concurrency: 'overlap' })
            .then(t => { try { window.__telemetry.cues.push({ event: 'tour_finish', ...t }); if (window.__voiceIndicator) window.__voiceIndicator.setVoiceTooltip(t.cue_to_voice_ms); } catch(_){} });
          stopDemoNarrative();
        };

        tour.oncomplete(finish);
        tour.onexit(finish);
        tour.start();
        // Kick off demo narrative alongside tour for authentic flow
        startDemoNarrative();
      }
      // === END: Cinematic Tour Function ===

      document
        .getElementById("start-walkthrough-btn")
        .addEventListener("click", startCinematicTour);

      // Basic ESC close for modals
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const mm = document.getElementById('memoir-modal');
          const cm = document.getElementById('cue-modal');
          if (mm) mm.style.display = 'none';
          if (cm) cm.style.display = 'none';
        }
      });

      document.getElementById("next-walkthrough-btn").addEventListener("click", () => {
        currentStep++;
        runWalkthroughStep();
      });
      endWalkthroughBtn.addEventListener("click", endWalkthrough);
      document
        .getElementById("start-session-btn")
        .addEventListener("click", () => startSession(false));
      document.getElementById("compose-cue-btn").addEventListener("click", composeCue);
      document
        .getElementById("generate-memoir-btn")
        .addEventListener("click", generateSessionMemoir);

      checkInitialHealth();
      initCharts();

