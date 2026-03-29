// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  // Start background crowd noise at low volume
  const crowdNoise = document.getElementById("crowd-noise");
  if (crowdNoise) {
    crowdNoise.volume = 0.05; // Very low volume so it doesn't drown out coach voice
    crowdNoise.play().catch((e) => console.log("Audio autoplay prevented"));
  }

  // Initialize all charts
  initializeKalmanChart();
  initializePersonaHeatmap();
  initializeEmotionalTrajectory();

  // Initialize widgets with random data
  initializeWidgets();

  // Setup interactive effects
  setupScrollEffects();
  setupParallaxEffects();

  // Robust reveal helper: add visible class and clear transform/opacity
  function revealAll(force = false) {
    try {
      document.querySelectorAll(".fade-in, .scroll-reveal").forEach((el) => {
        if (force || !el.classList.contains("visible")) {
          el.classList.add("visible");
          // also set inline styles as a backup so CSS can't keep it hidden
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      });
    } catch (e) {
      // silent
    }
  }

  // Try to reveal after a short delay (lets IntersectionObserver run first),
  // then force-reveal shortly after to guarantee demo visibility.
  setTimeout(() => revealAll(false), 400);
  setTimeout(() => revealAll(true), 1000);

  // Initialize match simulator (generate sample match feed) and start auto-play
  try {
    matchSimulator.init(200);
    // Auto-play demo after a small delay so UI finishes rendering
    setTimeout(() => matchSimulator.play(), 1500);
  } catch (e) {
    // If simulator not available, skip silently; widgets still work
  }
});

// Widget initialization and refresh functions (now accept optional data overrides)
function initializeWidgets() {
  // replaced by match simulator; keep available as fallback
  refreshServeSpeed();
  refreshSpinRate();
  refreshAccuracy();
  refreshCoverage();
  refreshReactionTime();
  refreshRallyStats();
}

function refreshServeSpeed(data) {
  const speed =
    data && data.serveSpeed !== undefined ? data.serveSpeed : Math.floor(Math.random() * 20) + 115;
  const maxSpeed =
    data && data.maxServe !== undefined ? data.maxServe : Math.floor(Math.random() * 15) + 130;
  const el1 = document.getElementById("serve-speed");
  const el2 = document.getElementById("max-serve");
  if (el1) el1.textContent = speed;
  if (el2) el2.textContent = maxSpeed + " mph";
}

function refreshSpinRate(data) {
  const spinRate =
    data && data.spinRate !== undefined ? data.spinRate : Math.floor(Math.random() * 1500) + 2000;
  const spinTypes = ["Topspin", "Backspin", "Sidespin", "Flat"];
  const spinType =
    data && data.spinType ? data.spinType : spinTypes[Math.floor(Math.random() * spinTypes.length)];
  const el1 = document.getElementById("spin-rate");
  const el2 = document.getElementById("spin-type");
  if (el1) el1.textContent = spinRate;
  if (el2) el2.textContent = spinType;
}

function refreshAccuracy(data) {
  const accuracy =
    data && data.accuracy !== undefined ? data.accuracy : Math.floor(Math.random() * 30) + 70;
  const recentHits =
    data && data.recentHits !== undefined ? data.recentHits : Math.floor(Math.random() * 5) + 6;
  const el1 = document.getElementById("shot-accuracy");
  const el2 = document.getElementById("recent-accuracy");
  if (el1) el1.textContent = accuracy;
  if (el2) el2.textContent = recentHits + "/10";
}

function refreshCoverage(data) {
  const coverage =
    data && data.coverage !== undefined ? data.coverage : Math.floor(Math.random() * 25) + 65;
  const distance =
    data && data.distance !== undefined ? data.distance : (Math.random() * 0.8 + 0.8).toFixed(1);
  const el1 = document.getElementById("court-coverage");
  const el2 = document.getElementById("total-distance");
  if (el1) el1.textContent = coverage;
  if (el2) el2.textContent = distance + " km";
}

function refreshReactionTime(data) {
  const reactionTime =
    data && data.reactionTime !== undefined
      ? data.reactionTime
      : (Math.random() * 0.3 + 0.25).toFixed(2);
  const bestReaction =
    data && data.bestReaction !== undefined
      ? data.bestReaction
      : (Math.random() * 0.15 + 0.2).toFixed(2);
  const el1 = document.getElementById("reaction-time");
  const el2 = document.getElementById("best-reaction");
  if (el1) el1.textContent = reactionTime;
  if (el2) el2.textContent = bestReaction + "s";
}

function refreshRallyStats(data) {
  const avgRally =
    data && data.avgRally !== undefined ? data.avgRally : (Math.random() * 6 + 4).toFixed(1);
  const longestRally =
    data && data.longestRally !== undefined ? data.longestRally : Math.floor(Math.random() * 20) + 15;
  const el1 = document.getElementById("rally-length");
  const el2 = document.getElementById("longest-rally");
  if (el1) el1.textContent = avgRally;
  if (el2) el2.textContent = longestRally + " shots";
}

// --- Match Simulator ---
const matchSimulator = {
  pointIndex: 0,
  points: [],
  intervalId: null,
  playing: false,
  speedMs: 2000,

  init(pointsToGenerate = 200) {
    this.points = [];
    for (let i = 0; i < pointsToGenerate; i++) {
      this.points.push(this.generatePointData(i));
    }
    this.pointIndex = 0;
    this.updateUIForPoint(this.points[0]);
  },

  generatePointData(i) {
    // Simulate realistic tennis point progression with variance
    const isServerA = Math.random() > 0.5;
    const serveSpeed = Math.round(Math.random() * 15 + (isServerA ? 120 : 115));
    const spinRate = Math.round(Math.random() * 1200 + 2200);
    const accuracy = Math.max(
      50,
      Math.round(80 + Math.sin(i / 6) * 8 + (Math.random() * 8 - 4))
    );
    const coverage = Math.max(
      40,
      Math.round(70 + Math.cos(i / 10) * 8 + (Math.random() * 6 - 3))
    );
    const reactionTime = (Math.random() * 0.25 + 0.25).toFixed(2);
    const avgRally = (Math.random() * 4 + 3).toFixed(1);
    const longestRally = Math.floor(Math.random() * 20) + 8;
    const distance = (Math.random() * 0.9 + 0.8).toFixed(1);
    return {
      serveSpeed,
      spinRate,
      spinType: Math.random() > 0.7 ? "Topspin" : "Flat",
      accuracy,
      coverage,
      reactionTime,
      avgRally,
      longestRally,
      distance,
      server: isServerA ? "A" : "B",
    };
  },

  updateUIForPoint(point) {
    if (!point) return;
    refreshServeSpeed({ serveSpeed: point.serveSpeed, maxServe: Math.round(point.serveSpeed + 5) });
    refreshSpinRate({ spinRate: point.spinRate, spinType: point.spinType });
    refreshAccuracy({ accuracy: point.accuracy, recentHits: Math.min(10, Math.round(point.accuracy / 10)) });
    refreshCoverage({ coverage: point.coverage, distance: point.distance });
    refreshReactionTime({ reactionTime: point.reactionTime, bestReaction: (point.reactionTime - 0.05).toFixed(2) });
    refreshRallyStats({ avgRally: point.avgRally, longestRally: point.longestRally });

    // update a small match status display if present
    const status = document.getElementById("match-status");
    if (status) {
      status.textContent = `Point ${this.pointIndex + 1} • Server: ${point.server} • Serve ${point.serveSpeed} mph • Accuracy ${point.accuracy}%`;
    }
  },

  play() {
    if (this.playing) return;
    this.playing = true;
    this.intervalId = setInterval(() => {
      this.advance();
    }, this.speedMs);
    const btn = document.getElementById("match-play-btn");
    if (btn) btn.textContent = "Pause";
  },

  pause() {
    this.playing = false;
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
    const btn = document.getElementById("match-play-btn");
    if (btn) btn.textContent = "Start";
  },

  advance() {
    this.pointIndex = Math.min(this.pointIndex + 1, this.points.length - 1);
    this.updateUIForPoint(this.points[this.pointIndex]);
    if (this.pointIndex >= this.points.length - 1) this.pause();
  },

  nextPoint() {
    this.pause();
    this.advance();
  },
};

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
    if (statusEl) {
      statusEl.textContent = "Loading audio...";
      statusEl.style.color = "#fbbf24";
    }

    // Get the exact filename for this slogan
    const filename = sloganMap[text];
    if (!filename) {
      throw new Error("Slogan not found");
    }

    // Create audio element with your EXACT file path
    const audio = new Audio(`assets/coach_slogans/${filename}.mp3`);
    audio.volume = 0.8; // Good volume level

    if (statusEl) {
      statusEl.textContent = "Playing...";
      statusEl.style.color = "#00F5D4";
    }

    audio.onended = () => {
      // Safely render icon + text without innerHTML
      if (statusEl) {
        const icon = document.createElement("span");
        icon.className = "text-green-400";
        icon.textContent = "✓";
        statusEl.replaceChildren(icon, document.createTextNode(" Demo Mode Active"));
        statusEl.style.color = "#8b949e";
      }
      buttons.forEach((btn) => {
        btn.disabled = false;
        btn.style.opacity = "1";
      });
    };

    audio.onerror = () => {
      console.error("Audio file not found:", filename);
      if (statusEl) {
        statusEl.textContent = "Audio file not found";
        statusEl.style.color = "#ef4444";
      }
      buttons.forEach((btn) => {
        btn.disabled = false;
        btn.style.opacity = "1";
      });
    };

    await audio.play();
  } catch (error) {
    console.error("Failed to play audio:", error);
    if (statusEl) {
      statusEl.textContent = "Audio playback failed";
      statusEl.style.color = "#ef4444";
    }
    buttons.forEach((btn) => {
      btn.disabled = false;
      btn.style.opacity = "1";
    });
  }
}

// Demo-friendly slogan playback using local assets that exist in repo
async function playSloganDemo(text) {
  const statusEl = document.getElementById("coach-status");
  const buttons = document.querySelectorAll(".slogan-btn");
  // lazy-load persona audio pool
  if (typeof window.personaAudio === "undefined") window.personaAudio = null;
  if (window.personaAudio === null) {
    try {
      const res = await fetch("assets/persona_audio.json", { cache: "no-store" });
      if (res.ok) window.personaAudio = await res.json();
    } catch (e) {
      /* ignore */
    }
  }

  function randomFrom(arr) {
    return arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
  }
  function selectAudioClip(personaKey, drift) {
    const pool = (window.personaAudio || {})[personaKey];
    if (!pool) return null;
    if (personaKey === "strategist" || personaKey === "rebuilder") {
      const c = drift.confidence.value;
      if (c < 0.6) return randomFrom(pool.lowConfidence);
      if (c < 0.8) return randomFrom(pool.midConfidence);
      return randomFrom(pool.highConfidence);
    }
    if (personaKey === "improviser") {
      const a = drift.arousal.value;
      if (a < 0.4) return randomFrom(pool.lowArousal);
      if (a < 0.7) return randomFrom(pool.midArousal);
      return randomFrom(pool.highArousal);
    }
    return null;
  }

  // Weighted selection with soft transitions + recency + momentum
  function weightedClipSelection(personaKey, drift) {
    const pool = (window.personaAudio || {})[personaKey];
    if (!pool) return null;

    let metric = 0.5;
    let categories = [];
    let centers = {};
    let sharpness = 10; // larger = sharper falloff
    if (personaKey === "strategist" || personaKey === "rebuilder") {
      metric = drift.confidence.value;
      categories = ["lowConfidence", "midConfidence", "highConfidence"];
      centers = { lowConfidence: 0.4, midConfidence: 0.7, highConfidence: 0.9 };
      sharpness = personaKey === "strategist" ? 16 : 10;
    } else if (personaKey === "improviser") {
      metric = drift.arousal.value;
      categories = ["lowArousal", "midArousal", "highArousal"];
      centers = { lowArousal: 0.3, midArousal: 0.6, highArousal: 0.85 };
      sharpness = 6;
    }

    // Compute base weights by inverse distance to category center
    let weights = categories.map((cat) => {
      const dist = Math.abs(metric - centers[cat]);
      const w = 1 / (1 + dist * sharpness);
      return { cat, weight: w };
    });

    // Momentum bias (nudge toward next category when rising, previous when falling)
    let vel = 0;
    if (personaKey === "strategist" || personaKey === "rebuilder")
      vel = drift.confidence.velocity || 0;
    else vel = drift.arousal.velocity || 0;
    const vBias = Math.max(-0.5, Math.min(0.5, vel * 2)); // normalize
    if (vBias !== 0) {
      // push a bit more weight toward categories with larger center when rising
      weights = weights.map((w) => ({
        cat: w.cat,
        weight: w.weight * (1 + vBias * (centers[w.cat] - metric >= 0 ? 0.15 : -0.15)),
      }));
    }

    // Recency penalty to avoid repetition
    const lastCat = window._lastClipCategory || null;
    const lastTs = window._lastClipTs || 0;
    const recent = Date.now() - lastTs < 3000;
    if (recent && lastCat) {
      weights = weights.map((w) => ({
        cat: w.cat,
        weight: w.cat === lastCat ? w.weight * 0.7 : w.weight,
      }));
    }

    // Normalize and draw
    const total = weights.reduce((s, w) => s + w.weight, 0) || 1;
    let r = Math.random() * total;
    for (const w of weights) {
      if (r <= w.weight) {
        const clip = randomFrom(pool[w.cat]);
        return { clip, category: w.cat };
      }
      r -= w.weight;
    }
    // Fallback
    const fallbackCat = categories[0];
    return { clip: randomFrom(pool[fallbackCat]), category: fallbackCat };
  }

  function chooseDemoAudio(s) {
    // Persona-first routing
    if (activePersonaKey === "strategist") return "assets/audio/coach_s_plateau_adapt.mp3";
    if (activePersonaKey === "rebuilder") return "assets/audio/coach_s_cooldown_reset.mp3";
    if (activePersonaKey === "improviser") return "assets/audio/coach_s_cooldown_breathe.mp3";
    const t = (s || "").toLowerCase();
    if (
      t.includes("serve") ||
      t.includes("opponent") ||
      t.includes("strategy") ||
      t.includes("power") ||
      t.includes("court") ||
      t.includes("anticipate") ||
      t.includes("position")
    ) {
      return "assets/audio/coach_s_plateau_adapt.mp3"; // tactical
    }
    if (
      t.includes("focus") ||
      t.includes("breath") ||
      t.includes("calm") ||
      t.includes("patience") ||
      t.includes("consistency") ||
      t.includes("training")
    ) {
      return "assets/audio/coach_s_cooldown_reset.mp3"; // reset
    }
    return "assets/audio/coach_s_cooldown_breathe.mp3"; // recovery
  }

  try {
    buttons.forEach((btn) => {
      btn.disabled = true;
      btn.style.opacity = "0.5";
    });
    if (statusEl) {
      statusEl.textContent = "Loading audio...";
      statusEl.style.color = "#fbbf24";
    }

    const weighted = weightedClipSelection(activePersonaKey, driftState);
    const driftPick = selectAudioClip(activePersonaKey, driftState);
    const audioUrl = (weighted && weighted.clip) || driftPick || chooseDemoAudio(text);
    const audio = new Audio(audioUrl);
    audio.volume = 0.9;

    if (statusEl) {
      statusEl.textContent = "Playing...";
      statusEl.style.color = "#00F5D4";
    }

    audio.onended = () => {
      if (statusEl) {
        statusEl.textContent = "Demo Mode Active";
        statusEl.style.color = "#8b949e";
      }
      buttons.forEach((btn) => {
        btn.disabled = false;
        btn.style.opacity = "1";
      });
    };

    audio.onerror = () => {
      if (statusEl) {
        statusEl.textContent = "Audio file not found";
        statusEl.style.color = "#ef4444";
      }
      buttons.forEach((btn) => {
        btn.disabled = false;
        btn.style.opacity = "1";
      });
    };

    await audio.play();
    if (weighted && weighted.category) {
      window._lastClipCategory = weighted.category;
      window._lastClipTs = Date.now();
    }
  } catch (error) {
    console.error("Failed to play audio:", error);
    if (statusEl) {
      statusEl.textContent = "Audio playback failed";
      statusEl.style.color = "#ef4444";
    }
    buttons.forEach((btn) => {
      btn.disabled = false;
      btn.style.opacity = "1";
    });
  }
}

// Enhanced coach panel controls
function toggleCoachPanel() {
  const panel = document.getElementById("coach-panel");
  if (!panel) return;
  panel.classList.toggle("minimized");

  // Add animation effect
  if (panel.classList.contains("minimized")) {
    panel.style.transform = "translateY(10px)";
    setTimeout(() => {
      panel.style.transform = "translateY(0)";
    }, 100);
  }
}

// Enhanced slogan dropdown with animations
function toggleSloganDropdown() {
  const dropdown = document.getElementById("slogan-dropdown");
  const expandBtn = document.querySelector(".expand-btn i");

  if (!dropdown) return;
  dropdown.classList.toggle("expanded");

  if (expandBtn) {
    if (dropdown.classList.contains("expanded")) {
      expandBtn.classList.remove("fa-chevron-down");
      expandBtn.classList.add("fa-chevron-up");
      expandBtn.style.transform = "rotate(180deg)";
    } else {
      expandBtn.classList.remove("fa-chevron-up");
      expandBtn.classList.add("fa-chevron-down");
      expandBtn.style.transform = "rotate(0deg)";
    }
  }
}

// Accessibility helpers for modals
const __modalFocusReturn = new WeakMap();
const __modalKeyHandler = new WeakMap();
function getFocusableElements(container) {
  if (!container) return [];
  const selectors = ["a[href]", "button", "textarea", "input", "select", "[tabindex]:not([tabindex=\"-1\"])"].join(
    ","
  );
  return Array.from(container.querySelectorAll(selectors)).filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1 && el.offsetParent !== null
  );
}
function activateModalAccessibility(modalEl, initialFocusEl) {
  if (!modalEl) return;
  // static ARIA attributes
  modalEl.setAttribute("role", "dialog");
  modalEl.setAttribute("aria-modal", "true");
  if (!modalEl.hasAttribute("tabindex")) modalEl.setAttribute("tabindex", "-1");
  // preserve focus
  __modalFocusReturn.set(modalEl, document.activeElement);
  // focus management
  const focusables = getFocusableElements(modalEl);
  const first = focusables[0] || initialFocusEl || modalEl;
  const last = focusables[focusables.length - 1] || first;
  (initialFocusEl || first).focus();
  // key handler (trap Tab, handle Escape)
  const handler = (e) => {
    if (e.key === "Tab") {
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    } else if (e.key === "Escape") {
      // close this modal
      modalEl.style.display = "none";
      deactivateModalAccessibility(modalEl);
    }
  };
  modalEl.addEventListener("keydown", handler);
  __modalKeyHandler.set(modalEl, handler);
}
function deactivateModalAccessibility(modalEl) {
  if (!modalEl) return;
  const handler = __modalKeyHandler.get(modalEl);
  if (handler) modalEl.removeEventListener("keydown", handler);
  const prev = __modalFocusReturn.get(modalEl);
  if (prev && typeof prev.focus === "function") {
    try {
      prev.focus();
    } catch (_) {}
  }
  __modalKeyHandler.delete(modalEl);
  __modalFocusReturn.delete(modalEl);
}

function showCueExplanation() {
  const modal = document.getElementById("cue-modal");
  if (!modal) return;
  modal.style.display = "block";
  activateModalAccessibility(modal, document.getElementById("cue-modal-close-x"));
}

function closeCueModal() {
  const modal = document.getElementById("cue-modal");
  if (!modal) return;
  modal.style.display = "none";
  deactivateModalAccessibility(modal);
}

// Enhanced scroll effects with parallax
function setupScrollEffects() {
  // Enhanced progress bar
  window.addEventListener("scroll", () => {
    const scrolled =
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    const bar = document.getElementById("scroll-progress-bar");
    if (bar) bar.style.width = scrolled + "%";
  });

  // Enhanced fade-in animations with stagger
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add("visible");
          }, index * 100);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "-50px",
    }
  );

  document.querySelectorAll(".fade-in, .scroll-reveal").forEach((el) => {
    observer.observe(el);
  });
}

function setupParallaxEffects() {
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;

    // Parallax effect for background elements
    const parallaxElements = document.querySelectorAll(".section");
    parallaxElements.forEach((el, index) => {
      const speed = 0.5 + index * 0.1;
      el.style.transform = `translateY(${scrollY * speed * 0.1}px)`;
    });
  });
}

// Enhanced chart initializations
function initializeKalmanChart() {
  const canvas = document.getElementById("animatedTrackerDemo");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");

  // Generate more sophisticated tracking data
  const timePoints = Array.from({ length: 100 }, (_, i) => i);
  const actualPosition = timePoints.map(
    (t) => Math.sin(t * 0.15) * 25 + Math.cos(t * 0.08) * 15 + Math.sin(t * 0.25) * 10 + 50
  );
  const noisyMeasurements = actualPosition.map((pos) => pos + (Math.random() - 0.5) * 18);
  const kalmanFiltered = [];

  // Enhanced Kalman filter simulation
  let estimate = noisyMeasurements[0];
  let errorEstimate = 15;
  const processNoise = 0.1;
  const measurementNoise = 8;

  noisyMeasurements.forEach((measurement) => {
    // Prediction step
    const predictedEstimate = estimate;
    const predictedError = errorEstimate + processNoise;

    // Update step
    const kalmanGain = predictedError / (predictedError + measurementNoise);
    estimate = predictedEstimate + kalmanGain * (measurement - predictedEstimate);
    errorEstimate = (1 - kalmanGain) * predictedError;

    kalmanFiltered.push(estimate);
  });

  new Chart(ctx, {
    type: "line",
    data: {
      labels: timePoints,
      datasets: [
        {
          label: "Actual Ball Position",
          data: actualPosition,
          borderColor: "#00F5D4",
          backgroundColor: "rgba(0, 245, 212, 0.1)",
          borderWidth: 4,
          pointRadius: 0,
          tension: 0.4,
        },
        {
          label: "Noisy Sensor Data",
          data: noisyMeasurements,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.05)",
          borderWidth: 1,
          pointRadius: 1,
          tension: 0,
        },
        {
          label: "Kalman Filtered",
          data: kalmanFiltered,
          borderColor: "#4ade80",
          backgroundColor: "rgba(74, 222, 128, 0.1)",
          borderWidth: 3,
          pointRadius: 0,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: {
          labels: {
            color: "#c9d1d9",
            font: { size: 14 },
          },
        },
        tooltip: {
          backgroundColor: "rgba(22, 27, 34, 0.9)",
          borderColor: "#00F5D4",
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Time (frames)",
            color: "#c9d1d9",
          },
          ticks: { color: "#8b949e" },
          grid: { color: "rgba(139, 148, 158, 0.1)" },
        },
        y: {
          title: {
            display: true,
            text: "Position (mm)",
            color: "#c9d1d9",
          },
          ticks: { color: "#8b949e" },
          grid: { color: "rgba(139, 148, 158, 0.1)" },
        },
      },
    },
  });
}

function initializePersonaHeatmap() {
  const canvas = document.getElementById("personaHeatmap");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");

  const data = {
    labels: ["Aggressive", "Defensive", "Strategic", "Power", "Finesse", "Consistent"],
    datasets: [
      {
        label: "Player Intensity",
        data: [85, 45, 92, 70, 65, 95],
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(0, 245, 212, 0.8)",
        ],
        borderColor: ["#ef4444", "#3b82f6", "#a855f7", "#f59e0b", "#22c55e", "#00F5D4"],
        borderWidth: 3,
        pointBackgroundColor: ["#ef4444", "#3b82f6", "#a855f7", "#f59e0b", "#22c55e", "#00F5D4"],
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  new Chart(ctx, {
    type: "radar",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: "#8b949e",
            backdropColor: "transparent",
            font: { size: 12 },
          },
          grid: {
            color: "rgba(139, 148, 158, 0.2)",
            lineWidth: 1,
          },
          angleLines: {
            color: "rgba(139, 148, 158, 0.2)",
          },
          pointLabels: {
            color: "#c9d1d9",
            font: { size: 16, weight: "bold" },
          },
        },
      },
    },
  });
}

function initializeEmotionalTrajectory() {
  const canvas = document.getElementById("emotionalTrajectoryChart");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");

  // Enhanced emotional trajectory data
  const timeLabels = ["Start", "15min", "30min", "45min", "60min", "75min", "90min", "End"];
  const emotionalData = [7.2, 6.8, 8.1, 5.3, 6.7, 7.8, 8.5, 8.9];
  const stressLevels = [3.5, 4.2, 2.8, 7.1, 5.5, 3.9, 2.2, 1.8];

  new Chart(ctx, {
    type: "line",
    data: {
      labels: timeLabels,
      datasets: [
        {
          label: "Emotional State",
          data: emotionalData,
          borderColor: "#00F5D4",
          backgroundColor: "rgba(0, 245, 212, 0.1)",
          borderWidth: 4,
          pointBackgroundColor: "#00F5D4",
          pointBorderColor: "#fff",
          pointBorderWidth: 3,
          pointRadius: 8,
          tension: 0.4,
          fill: true,
        },
        {
          label: "Stress Level",
          data: stressLevels,
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          borderWidth: 3,
          pointBackgroundColor: "#f59e0b",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 6,
          tension: 0.3,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: {
          labels: {
            color: "#c9d1d9",
            font: { size: 14 },
          },
        },
        tooltip: {
          backgroundColor: "rgba(22, 27, 34, 0.9)",
          borderColor: "#00F5D4",
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Match Time",
            color: "#c9d1d9",
            font: { size: 14, weight: "bold" },
          },
          ticks: {
            color: "#8b949e",
            font: { size: 12 },
          },
          grid: { color: "rgba(139, 148, 158, 0.1)" },
        },
        y: {
          title: {
            display: true,
            text: "Score (1-10)",
            color: "#c9d1d9",
            font: { size: 14, weight: "bold" },
          },
          min: 0,
          max: 10,
          ticks: {
            color: "#8b949e",
            font: { size: 12 },
          },
          grid: { color: "rgba(139, 148, 158, 0.1)" },
        },
      },
    },
  });
}

// Enhanced form submission (null-safe)
(() => {
  const form = document.querySelector("form");
  if (!form) return;
  form.addEventListener("submit", function (e) {
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
    // Build content safely without innerHTML
    const icon = document.createElement("i");
    icon.className = "fas fa-check-circle mr-2";
    notification.appendChild(icon);
    notification.appendChild(
      document.createTextNode("Thank you for your interest! We'll be in touch soon.")
    );
    document.body.appendChild(notification);

    // Reset form
    this.reset();

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  });
})();

// Add custom animations
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeInout {
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
console.log("MatchPoint Systems loaded successfully!");
console.log("AI Coach ready with local audio files!");
console.log("Analytics dashboard active!");

// Dashboard-specific script integrated
// Prefer same-origin during Vite dev (proxy at 3000 -> 5000) to avoid CORS
const isLocal3000 =
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
  window.location.port === "3000";
const API_BASE_URL = isLocal3000
  ? ""
  : (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:5000"
  : "https://your-production-api.com";
let validationInterval = null,
  historyInterval = null,
  lastHistoryData = null;

let sensorWeightsChart, driftChart, cueBiasChart, emotionalBaselineChart;

// Persona configuration (runtime)
const personaConfig = {
  strategist: {
    name: "The Strategist",
    introLine: "Let's break this down and play the angles.",
    toneTuner: { stability: 0.8, style: 0.3, similarityBoost: 0.9 },
    cueBias: { tactical: 0.9, motivational: 0.1, creative: 0.0 },
    driftSensitivity: 0.2,
    rewriteFrequency: 0.1,
  },
  rebuilder: {
    name: "The Rebuilder",
    introLine: "We'll take this one point at a time. You've got this.",
    toneTuner: { stability: 0.95, style: 0.6, similarityBoost: 0.5 },
    cueBias: { tactical: 0.2, motivational: 0.8, creative: 0.0 },
    driftSensitivity: 0.9,
    rewriteFrequency: 0.7,
  },
  improviser: {
    name: "The Improviser",
    introLine: "Let's make something unexpected happen out there.",
    toneTuner: { stability: 0.4, style: 0.95, similarityBoost: 0.2 },
    cueBias: { tactical: 0.2, motivational: 0.3, creative: 0.5 },
    driftSensitivity: 0.7,
    rewriteFrequency: 0.5,
  },
};
let activePersonaKey = "strategist";
function setPersona(key) {
  if (!personaConfig[key]) return;
  activePersonaKey = key;
  const el = document.getElementById("active-persona");
  if (el) el.textContent = personaConfig[key].name;
  const status = document.getElementById("coach-status");
  if (status) {
    status.textContent = `${personaConfig[key].name} ready`;
    setTimeout(() => {
      status.textContent = "Demo Mode Active";
    }, 1200);
  }
}

// Emotional drift + envelopes (demo implementation)
const personaEnvelopes = {
  strategist: {
    base: { stability: 0.8, style: 0.3, similarity: 0.9 },
    bounds: {
      stability: { min: 0.7, max: 0.95 },
      style: { min: 0.2, max: 0.5 },
      similarity: { min: 0.8, max: 1.0 },
    },
    sensitivity: { confidenceToStability: +0.3, composureToStyle: -0.1 },
    rewriteFrequency: { min: 0.05, max: 0.2 },
    cueBias: { tactical: 0.9, motivational: 0.1, creative: 0.0 },
    driftGain: 0.6,
  },
  rebuilder: {
    base: { stability: 0.95, style: 0.6, similarity: 0.5 },
    bounds: {
      stability: { min: 0.85, max: 1.0 },
      style: { min: 0.5, max: 0.8 },
      similarity: { min: 0.4, max: 0.7 },
    },
    sensitivity: { confidenceToStability: +0.4, composureToStyle: +0.2 },
    rewriteFrequency: { min: 0.4, max: 0.8 },
    cueBias: { tactical: 0.2, motivational: 0.8, creative: 0.0 },
    driftGain: 1.0,
  },
  improviser: {
    base: { stability: 0.4, style: 0.95, similarity: 0.2 },
    bounds: {
      stability: { min: 0.25, max: 0.6 },
      style: { min: 0.7, max: 1.0 },
      similarity: { min: 0.1, max: 0.4 },
    },
    sensitivity: {
      confidenceToStability: +0.1,
      composureToStyle: +0.1,
      arousalToStyle: +0.3,
    },
    rewriteFrequency: { min: 0.3, max: 0.6 },
    cueBias: { tactical: 0.2, motivational: 0.3, creative: 0.5 },
    driftGain: 0.8,
  },
};

const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const clampTo = (x, rng) => Math.max(rng.min, Math.min(rng.max, x));

const driftState = {
  confidence: { value: 0.6, velocity: 0, confidence: 0.8 },
  composure: { value: 0.7, velocity: 0, confidence: 0.8 },
  arousal: { value: 0.5, velocity: 0, confidence: 0.6 },
};

function mapDriftToTone(drift, env) {
  const dConf = drift.confidence.value - 0.5;
  const dComp = drift.composure.value - 0.5;
  const dAro = (drift.arousal?.value || 0.5) - 0.5;
  let stability =
    env.base.stability + env.driftGain * (env.sensitivity.confidenceToStability || 0) * dConf;
  let style =
    env.base.style +
    env.driftGain * (env.sensitivity.composureToStyle || 0) * -dComp +
    env.driftGain * (env.sensitivity.arousalToStyle || 0) * dAro;
  let similarity = env.base.similarity;
  stability = clampTo(stability, env.bounds.stability);
  style = clampTo(style, env.bounds.style);
  similarity = clampTo(similarity, env.bounds.similarity);
  return { stability, style, similarity };
}

function mapDriftToCueBias(base, drift) {
  const conf = drift.confidence.value;
  const comp = drift.composure.value;
  const aro = drift.arousal?.value ?? 0.5;
  let tactical = base.tactical + (comp - 0.5) * 0.15 + (conf - 0.5) * 0.1;
  let motivational = base.motivational + (0.5 - conf) * 0.25;
  let creative = base.creative + (aro - 0.5) * 0.2;
  const sum = tactical + motivational + creative || 1;
  return {
    tactical: tactical / sum,
    motivational: motivational / sum,
    creative: creative / sum,
  };
}

let currentTone = { stability: 0.8, style: 0.3, similarity: 0.9 };
let currentCueParams = {
  rewriteFreq: 0.2,
  cueBias: { tactical: 0.9, motivational: 0.1, creative: 0.0 },
};

// Track previous values to estimate velocity (for momentum bias)
let _prevDrift = {
  confidence: driftState.confidence.value,
  composure: driftState.composure.value,
  arousal: driftState.arousal.value,
};
function driftTick(dtSec) {
  // Simulate small random walk with decay toward base per persona
  const env = personaEnvelopes[activePersonaKey] || personaEnvelopes.strategist;
  const noise = (s) => (Math.random() - 0.5) * s;
  const cNew = clamp(driftState.confidence.value + noise(0.04));
  const mNew = clamp(driftState.composure.value + noise(0.04));
  const aNew = clamp(driftState.arousal.value + noise(0.06));

  // Estimate velocities
  const dt = Math.max(0.05, dtSec || 0.25);
  driftState.confidence.velocity = (cNew - _prevDrift.confidence) / dt;
  driftState.composure.velocity = (mNew - _prevDrift.composure) / dt;
  driftState.arousal.velocity = (aNew - _prevDrift.arousal) / dt;
  driftState.confidence.value = cNew;
  _prevDrift.confidence = cNew;
  driftState.composure.value = mNew;
  _prevDrift.composure = mNew;
  driftState.arousal.value = aNew;
  _prevDrift.arousal = aNew;

  const tone = mapDriftToTone(driftState, env);
  const bias = mapDriftToCueBias(env.cueBias, driftState);
  const t = driftState.arousal.value;
  const rf = env.rewriteFrequency.min + (env.rewriteFrequency.max - env.rewriteFrequency.min) * t;
  currentTone = tone;
  currentCueParams = { rewriteFreq: rf, cueBias: bias };

  // Update a small UI readout if present
  const vocalSettingsDisplay = document.getElementById("vocal-settings-display");
  if (vocalSettingsDisplay) {
    const s1 = document.createElement("span");
    s1.textContent = `Stability: ${tone.stability.toFixed(2)}`;
    const sep1 = document.createTextNode(" | ");
    const s2 = document.createElement("span");
    s2.textContent = `Style: ${tone.style.toFixed(2)}`;
    const sep2 = document.createTextNode(" | ");
    const s3 = document.createElement("span");
    s3.textContent = `Similarity: ${tone.similarity.toFixed(2)}`;
    vocalSettingsDisplay.replaceChildren(s1, sep1, s2, sep2, s3);
  }
}

const _driftIntervalId = setInterval(() => driftTick(0.25), 750);

// Return demo payloads when backend isn't available
function getDemoPayload(endpoint) {
  const persona = personaConfig[activePersonaKey] || personaConfig.strategist;
  if (endpoint.startsWith("/api/validation")) {
    return {
      enterprise_metrics: {
        performance_slas: { avg_latency: 112, uptime: 99.98 },
        security_compliance: { security_score: 9.6, compliance_status: "SOC 2" },
      },
      sensor_fusion: {
        adaptive_sensor_weights: { camera: 0.48, acoustic: 0.22, imu: 0.3 },
        anomaly_detection_score: 0.11,
      },
      voice_settings: {
        stability: currentTone.stability,
        style: currentTone.style,
        similarity_boost: currentTone.similarity,
      },
    };
  }
  if (endpoint.startsWith("/api/history")) {
    const now = Date.now();
    const rate = persona.rewriteFrequency;
    return {
      recent_cues: [
        {
          timestamp: now - 5000,
          cue_category: persona.cueBias.tactical > 0.5 ? "Tactical" : "Motivational",
          original_cue: "Work the backhand.",
          audit_score: 0.92,
        },
        {
          timestamp: now - 12000,
          cue_category: persona.cueBias.motivational >= 0.5 ? "Motivational" : "Reset",
          original_cue: "Reset your breath.",
          audit_score: 0.88,
          rewrite_details: rate > 0.5 ? { reason: "tone softening" } : undefined,
        },
        {
          timestamp: now - 24000,
          cue_category: persona.cueBias.creative > 0.4 ? "Creative" : "Recovery",
          original_cue: "Relax shoulders.",
          audit_score: 0.86,
        },
      ],
      emotional_drift_trend: Array.from({ length: 12 }, (_, i) => ({
        timestamp: now - (12 - i) * 60000,
        confidence_change: (Math.random() - 0.5) * (0.15 + persona.driftSensitivity * 0.2),
        composure_change: (Math.random() - 0.5) * (0.15 + persona.driftSensitivity * 0.2),
      })),
      rewrite_stats: {
        rate: currentCueParams.rewriteFreq,
        rewritten: Math.round(currentCueParams.rewriteFreq * 50),
        total: 50,
      },
      latest_summary: {
        summary: {
          profile_adjustment_suggestion: "Increase composure cues during tight points.",
        },
      },
      composed_cues: [
        {
          generated_cue_text: "Play cross-court to open space.",
          generation_reason: "opponent slow on recovery",
        },
        {
          generated_cue_text: "Breathe and reset your stance.",
          generation_reason: "post-error reset",
        },
      ],
    };
  }
  if (endpoint.startsWith("/api/drift")) {
    const env = personaConfig[activePersonaKey] || personaConfig.strategist;
    const tone_label =
      currentTone.style > 0.8
        ? "Expressive"
        : currentTone.style > 0.6
        ? "Energetic"
        : currentTone.style > 0.4
        ? "Attentive"
        : "Calm";
    return {
      tone_trend: [tone_label, "Focused", "Adaptive"],
      cue_bias_evolution: currentCueParams.cueBias,
      emotional_baseline_trends: {
        confidence: Array.from({ length: 10 }, () =>
          clamp(driftState.confidence.value + (Math.random() - 0.5) * 0.1)
        ).map((x) => +x.toFixed(2)),
        composure: Array.from({ length: 10 }, () =>
          clamp(driftState.composure.value + (Math.random() - 0.5) * 0.1)
        ).map((x) => +x.toFixed(2)),
        resilience: Array.from({ length: 10 }, () => clamp(0.6 + (Math.random() - 0.5) * 0.1)).map(
          (x) => +x.toFixed(2)
        ),
      },
      voice_settings: {
        stability: currentTone.stability,
        style: currentTone.style,
        similarity_boost: currentTone.similarity,
      },
      gemini_insight: `${env.name} adjusting tone for current drift.`,
    };
  }
  if (endpoint.startsWith("/api/coach")) {
    return {
      final_cue:
        persona.cueBias.tactical > 0.5
          ? "Eyes on the ball, play to open space."
          : persona.cueBias.motivational > 0.5
          ? "Breathe, one point at a time."
          : "Try a quick tempo change, surprise the baseline.",
      audit: { score: 0.95, passed: true },
      reason_for_rewrite: "",
    };
  }
  if (endpoint.startsWith("/api/compose")) {
    return {
      generated_cue_text: "Slow your tempo and find rhythm.",
      generation_reason: "momentum dip detected",
    };
  }
  if (endpoint.startsWith("/api/health")) {
    return { status: "healthy" };
  }
  return null;
}

// Safe references for status UI (avoid NREs if nodes missing)
const errorBanner =
  document.getElementById("error-banner") || {
    classList: {
      add() {},
      remove() {},
      contains() {
        return false;
      },
    },
  };
const hubStatusDot = document.getElementById("hub-status-dot") || null;

async function fetchData(endpoint, options = {}) {
  // For demo: short-circuit known endpoints to avoid network noise
  if (
    endpoint.startsWith("/api/validation") ||
    endpoint.startsWith("/api/history") ||
    endpoint.startsWith("/api/coach") ||
    endpoint.startsWith("/api/compose")
  ) {
    const demo = getDemoPayload(endpoint);
    if (demo) {
      if (hubStatusDot) hubStatusDot.className = "status-dot healthy";
      return demo;
    }
  }
  try {
    try {
      errorBanner.classList.add("hidden");
    } catch (_) {}
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    // Fallback to demo payloads to keep the UI alive
    const demo = getDemoPayload(endpoint);
    if (demo) {
      console.warn(`Using demo data for ${endpoint}`);
      if (hubStatusDot) hubStatusDot.className = "status-dot healthy";
      return demo;
    }
    console.error(`Fetch error from ${endpoint}:`, error);
    try {
      errorBanner.classList.remove("hidden");
    } catch (_) {}
    if (hubStatusDot) hubStatusDot.className = "status-dot error";
    return null;
  }
}

function updateUI(data) {
  if (!data) return;
  const avgLatency = data.enterprise_metrics?.performance_slas?.avg_latency;
  const uptime = data.enterprise_metrics?.performance_slas?.uptime;
  const secScore = data.enterprise_metrics?.security_compliance?.security_score;
  const compliance = data.enterprise_metrics?.security_compliance?.compliance_status;
  const anomaly = data.sensor_fusion?.anomaly_detection_score;
  const latencyEl = document.getElementById("latency-metric");
  const uptimeEl = document.getElementById("uptime-metric");
  const secEl = document.getElementById("security-metric");
  const compEl = document.getElementById("compliance-metric");
  const anomalyEl = document.getElementById("anomaly-metric");
  if (latencyEl)
    latencyEl.textContent = avgLatency !== undefined ? `${Number(avgLatency).toFixed(0)} ms` : "-- ms";
  if (uptimeEl) uptimeEl.textContent = uptime !== undefined ? `${Number(uptime).toFixed(2)} %` : "-- %";
  if (secEl) secEl.textContent = secScore !== undefined ? Number(secScore).toFixed(1) : "--";
  if (compEl) compEl.textContent = compliance || "--";
  const weights = data.sensor_fusion?.adaptive_sensor_weights || {};
  updateSensorWeightsChart(Object.keys(weights), Object.values(weights));
  if (anomalyEl) anomalyEl.textContent = anomaly !== undefined ? Number(anomaly).toFixed(2) : "--";
  if (hubStatusDot) hubStatusDot.className = "status-dot healthy";
}

// --- Invisible char sanitizer (safe, fast) ---
const INVIS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\u2060\uFEFF]/g;
function sanitizeInvisibles(s) {
  return INVIS_RE.test(s) ? s.replace(INVIS_RE, "") : s;
}

// --- Grapheme-safe truncation (avoids cutting emojis) ---
function truncateGraphemes(str, n) {
  const s = String(str);
  if (window.Intl?.Segmenter) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    let out = "",
      i = 0;
    for (const g of seg.segment(s)) {
      if (i++ >= n) break;
      out += g.segment;
    }
    return out;
  }
  return s.slice(0, n);
}

// --- A11Y-friendly cue <li> builder ---
function renderCue(cue) {
  const li = document.createElement("li");
  li.className = "cue-item text-xs";

  const pass = Number(cue?.audit_score ?? 0) > 0.8;

  const status = document.createElement("span");
  status.className = "mp-status";
  status.setAttribute("aria-hidden", "true");
  status.textContent = pass ? "✓" : "";

  const sr = document.createElement("span");
  sr.className = "sr-only";
  sr.textContent = pass ? "Pass" : "No status";

  const score = Number(cue?.audit_score ?? 0).toLocaleString([], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const ts = new Date(cue?.timestamp ?? Date.now()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const cat = cue?.cue_category ?? "—";
  const cleanCue = sanitizeInvisibles(String(cue?.original_cue ?? ""));
  const cuePreview = truncateGraphemes(cleanCue, 20);

  const text = document.createTextNode(
    ` ${ts}: [${cat}] "${cuePreview}..." (${score})${
      cue?.rewrite_details?.reason ? " -> Rewritten" : ""
    }`
  );

  li.append(status, sr, text);
  return li;
}

// --- Efficient list replace ---
function renderCueList(cues, ul) {
  if (!ul) return;
  const frag = document.createDocumentFragment();
  (cues ?? []).forEach((c) => frag.appendChild(renderCue(c)));
  ul.replaceChildren(frag);
}

// --- Optional: dev-only DOM scrubber (don’t run in prod) ---
function scrubInvisibleChars(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const cleaned = sanitizeInvisibles(node.nodeValue || "");
    if (cleaned !== node.nodeValue) node.nodeValue = cleaned;
  }
}

function updateHistoryPanel(data) {
  if (!data || !data.recent_cues) return;
  lastHistoryData = data;
  const historyPanel = document.getElementById("cue-history-manager-panel");
  if (!historyPanel) return;

  // Safe render without using innerHTML for dynamic data
  {
    historyPanel.replaceChildren();
    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 md:grid-cols-2 gap-6";

    // Left: Cue Timeline
    const left = document.createElement("div");
    const h4Timeline = document.createElement("h4");
    h4Timeline.className = "font-bold text-green-300 mb-2";
    h4Timeline.textContent = "Cue Timeline";
    const ul = document.createElement("ul");
    ul.id = "cue-history-list";
    ul.className = "cue-list space-y-2 h-48 overflow-y-auto";
    left.append(h4Timeline, ul);

    // Right: Stats + Summary
    const right = document.createElement("div");
    right.className = "space-y-4";

    const freqBox = document.createElement("div");
    const h4Freq = document.createElement("h4");
    h4Freq.className = "font-bold text-green-300 mb-2";
    h4Freq.textContent = "Rewrite Frequency";
    const pRate = document.createElement("p");
    pRate.className = "text-2xl font-bold text-white";
    const rate = Number(data.rewrite_stats?.rate || 0);
    pRate.textContent = `${(rate * 100).toFixed(0)}%`;
    const pDetail = document.createElement("p");
    pDetail.className = "text-xs text-slate-400";
    const rewritten = Number(data.rewrite_stats?.rewritten || 0);
    const total = Number(data.rewrite_stats?.total || 0);
    pDetail.textContent = `${rewritten} of ${total} cues rewritten`;
    freqBox.append(h4Freq, pRate, pDetail);

    const summaryBox = document.createElement("div");
    const h4Summary = document.createElement("h4");
    h4Summary.className = "font-bold text-green-300 mb-2";
    h4Summary.textContent = "Session Summary";
    const pSummary = document.createElement("p");
    pSummary.className = "text-xs italic text-slate-300";
    const summaryText = data.latest_summary ? data.latest_summary.summary : "No summary yet.";
    pSummary.textContent = `"${summaryText}"`;
    summaryBox.append(h4Summary, pSummary);

    right.append(freqBox, summaryBox);
    grid.append(left, right);
    historyPanel.appendChild(grid);

    // Render cues safely
    renderCueList(data.recent_cues, ul);

    // Render library safely
    const libraryList = document.getElementById("cue-library-list");
    if (libraryList) {
      libraryList.replaceChildren();
      (data.composed_cues || []).forEach((c) => {
        const li = document.createElement("li");
        li.className = "text-xs italic";
        li.textContent = `"${sanitizeInvisibles(c.generated_cue_text || "")}"`;
        libraryList.appendChild(li);
      });
    }

    // Skip legacy innerHTML path
    return;
  }
}

function updatePersonaDriftPanel(data) {
  if (!data) return;
  const panel = document.getElementById("persona-drift-panel");
  if (panel) panel.classList.remove("hidden");
  const trendEl = document.getElementById("vocal-style-trend");
  if (trendEl) trendEl.textContent = `STYLE TREND: ${data.tone_trend.join(" -> ")}`;
  const insightEl = document.getElementById("gemini-insight-text");
  if (insightEl) insightEl.textContent = data.gemini_insight;
  updateCueBiasChart(data.cue_bias_evolution);
  updateEmotionalBaselineChart(data.emotional_baseline_trends);
  const vocalSettingsDisplay = document.getElementById("vocal-settings-display");
  const voiceSettings = data.voice_settings || {};
  if (vocalSettingsDisplay) {
    const stability = (voiceSettings.stability ?? 0).toFixed(2);
    const style = (voiceSettings.style ?? 0).toFixed(2);
    const similarity = (voiceSettings.similarity_boost ?? 0).toFixed(2);
    const s1 = document.createElement("span");
    s1.textContent = `Stability: ${stability}`;
    const sep1 = document.createTextNode(" | ");
    const s2 = document.createElement("span");
    s2.textContent = `Style: ${style}`;
    const sep2 = document.createTextNode(" | ");
    const s3 = document.createElement("span");
    s3.textContent = `Similarity: ${similarity}`;
    vocalSettingsDisplay.replaceChildren(s1, sep1, s2, sep2, s3);
  }
}

async function playAudioForCategory(category) {
  // Keep the live text demo update
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
  try {
    const coachResponse = await fetchData("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockPayload),
    });
    if (coachResponse) {
      const cueTextEl = document.getElementById("cue-text-display");
      const auditEl = document.getElementById("audit-score-display");
      const feedbackEl = document.getElementById("gemini-feedback");
      if (cueTextEl) cueTextEl.textContent = `"${coachResponse.final_cue}"`;
      if (auditEl) {
        const score = coachResponse.audit?.score;
        auditEl.textContent =
          score !== undefined && score !== null && typeof score.toFixed === "function"
            ? score.toFixed(2)
            : "--";
        auditEl.className = `audit-score ${coachResponse.audit?.passed ? "pass" : "caution"}`;
      }
      if (feedbackEl) feedbackEl.textContent = coachResponse.reason_for_rewrite || "Cue passed all checks.";
    }
  } catch (e) {
    console.warn("Coach API not available; continuing demo with local audio.");
  }

  // Audio DEMO: map categories -> local generated voice lines
  const fileMap = {
    Tactical: "coach_s_plateau_adapt.mp3",
    Reset: "coach_s_cooldown_reset.mp3",
    Recovery: "coach_s_cooldown_breathe.mp3",
  };
  const filename = fileMap[category] || "coach_s_calibration.mp3";
  const audioPath = `coaching_engine/voices/coach_s/generated/${filename}`;
  try {
    const audio = new Audio(audioPath);
    // In case autoplay is blocked, rely on user-initiated click context
    await audio.play();
  } catch (err) {
    console.error("Audio demo failed:", err);
  }
}

async function composeCue() {
  const composePanel = document.getElementById("improvisation-panel");
  const response = await fetchData("/api/compose?player_id=matthew_001");
  if (response) {
    const genEl = document.getElementById("generated-cue-text");
    const reasonEl = document.getElementById("generation-reason");
    if (genEl) genEl.textContent = `"${response.generated_cue_text}"`;
    if (reasonEl) reasonEl.textContent = response.generation_reason;
    if (composePanel) {
      composePanel.classList.add("shimmer");
      setTimeout(() => composePanel.classList.remove("shimmer"), 1500);
    }
  }
}

function initCharts() {
  Chart.defaults.color = "#9ca3af";
  const gridColor = "rgba(55, 65, 81, 0.5)";
  const sensorEl = document.getElementById("sensor-weights-chart");
  if (sensorEl && sensorEl.getContext) {
    const sensorCtx = sensorEl.getContext("2d");
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
  }
  const driftEl = document.getElementById("drift-chart");
  if (driftEl && driftEl.getContext) {
    const driftCtx = driftEl.getContext("2d");
    driftChart = new Chart(driftCtx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Confidence",
            data: [],
            borderColor: "#34d399",
            tension: 0.2,
            pointRadius: 2,
          },
          {
            label: "Composure",
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
  }
  const biasEl = document.getElementById("cue-bias-chart");
  if (biasEl && biasEl.getContext) {
    const biasCtx = biasEl.getContext("2d");
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
  }
  const baselineEl = document.getElementById("emotional-baseline-chart");
  if (baselineEl && baselineEl.getContext) {
    const baselineCtx = baselineEl.getContext("2d");
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
}

function updateSensorWeightsChart(labels, data) {
  if (sensorWeightsChart) {
    sensorWeightsChart.data.labels = labels;
    sensorWeightsChart.data.datasets[0].data = data;
    sensorWeightsChart.update();
  }
}

function updateDriftChart(driftData) {
  if (!driftChart || !driftData) return;
  const labels = Array.from({ length: driftData.length }, (_, i) => i + 1);
  let cumulativeConfidence = 0,
    cumulativeComposure = 0;
  const confidenceTrend = driftData.map(
    (d) => (cumulativeConfidence += d.confidence_change || 0)
  );
  const composureTrend = driftData.map(
    (d) => (cumulativeComposure += d.composure_change || 0)
  );
  driftChart.data.labels = labels;
  driftChart.data.datasets[0].data = confidenceTrend;
  driftChart.data.datasets[1].data = composureTrend;
  driftChart.update();
}

function updateCueBiasChart(biasData) {
  if (!cueBiasChart || !biasData) return;
  cueBiasChart.data.labels = Object.keys(biasData);
  cueBiasChart.data.datasets[0].data = Object.values(biasData);
  cueBiasChart.update();
}
function updateEmotionalBaselineChart(baselineData) {
  if (!emotionalBaselineChart || !baselineData) return;
  const labels = Array.from({ length: baselineData.confidence.length }, (_, i) => `S${i + 1}`);
  emotionalBaselineChart.data.labels = labels;
  emotionalBaselineChart.data.datasets[0].data = baselineData.confidence;
  emotionalBaselineChart.data.datasets[1].data = baselineData.composure;
  emotionalBaselineChart.data.datasets[2].data = baselineData.resilience;
  emotionalBaselineChart.update();
}

function startSession(isTour = false) {
  const scenarioEl = document.getElementById("scenario-select");
  const scenario = scenarioEl ? scenarioEl.value : "environmental";
  const btn = document.getElementById("start-session-btn");
  if (!isTour && btn) {
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
  const health = await fetchData("/api/health");
  if (health && health.status === "healthy") {
    try {
      errorBanner.classList.add("hidden");
    } catch (_) {}
  } else if (hubStatusDot) hubStatusDot.className = "status-dot error";
}

const walkthroughoverlay = document.getElementById("walkthrough-overlay");
const walkthroughText = document.getElementById("walkthrough-text");
const nextWalkthroughBtn = document.getElementById("next-walkthrough-btn");
const endWalkthroughBtn = document.getElementById("end-walkthrough-btn");
let currentStep = 0,
  activeSpotlight = null;

let tourScript = [
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
    text: "on the right, you can see live Enterprise Metrics. We guarantee sub-200ms latency and 99.99% uptime, all tracked in real-time.",
  },
  {
    id: "sensor-fusion-panel",
    text: "our Sensor Fusion panel shows how the system intelligently weighs data from different sources. The Neural Net adapts on the fly, and the Anomaly Score reflects system confidence.",
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
    text: "Every action is recorded in the CueHistoryManager. This is the system's memory,its soul. It tracks emotional drift and provides session summaries, proving that it learns.",
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

// Cinematic Tour (override)
tourScript = [
  // Scene 1: Diagnostic Hub & Session Control
  {
    id: "diagnostic-hub-panel",
    text: "Welcome to the Conductor's Podium. This is the Diagnostic Hub, where we initiate the live session. With a single click, we activate the entire sentient symphony of MatchPoint, and the performance begins.",
  },
  {
    id: "diagnostic-hub-panel",
    text: "Beginning Cinematic Session: activating sensors, routing cues, and preparing the orchestra.",
    action: () => startSession(true),
  },
  // Scene 2: AI Coach Intelligence
  {
    id: "ai-coach-panel",
    text: "Here is the Voice of Empathy. The system is now selecting, auditing for ethical alignment, and emotionally attuning every coaching cue in real time. This is where the system thinks, feels, and adapts.",
  },
  // Scene 3: Gemini Improvisation
  {
    id: "improvisation-panel",
    text: "This is the moment of creation. When a standard cue isn't perfect, the system doesn't just respond—it composes. Here, our AI improvises a new, original cue, born from its memory and the emotional context of the session.",
    action: () => composeCue(),
  },
  // Scene 4: Gemini Cue Library
  {
    id: "cue-library-list",
    text: "This is the Archive of Authorship. Every cue composed by the system is preserved here, creating a living memoir of its creative journey and ensuring its voice has a legacy.",
  },
  // Scene 5: CueHistoryManager: Session Reflection
  {
    id: "cue-history-manager",
    text: "This is the Mirror of Reflection. The Cue History Manager serves as the system's soul, visualizing its decision-making process, tracking the player's emotional drift, and proving its ability to learn from every interaction.",
  },
  // Scene 6: PersonaDriftTracker & Vocal Attunement
  {
    id: "persona-drift-panel",
    text: "This is the Lens of Evolution. The Persona Drift Tracker proves that MatchPoint doesn't just guide—it cultivates growth. It visualizes the long-term impact of our coaching, even attuning its own voice to the player's emotional frequency.",
    action: async () => {
      const data = await fetchData("/api/drift");
      updatePersonaDriftPanel(data);
    },
  },
  // Final Scene: The Vision
  {
    id: "contact",
    text: "This concludes our tour. What you have witnessed is a new standard for emotionally intelligent AI. A system that remembers, reflects, expresses, and resonates. This is the Sentient Symphony. Let's build the future together.",
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
  if (walkthroughText) walkthroughText.textContent = step.text;
  if (step.action) step.action();
  if (nextWalkthroughBtn) {
    if (currentStep === tourScript.length - 1) {
      nextWalkthroughBtn.textContent = "Finish";
    } else {
      nextWalkthroughBtn.textContent = " Next »";
    }
  }
}

function startWalkthrough() {
  currentStep = 0;
  if (walkthroughoverlay) walkthroughoverlay.classList.add("visible");
  runWalkthroughStep();
}
function endWalkthrough() {
  if (walkthroughoverlay) walkthroughoverlay.classList.remove("visible");
  if (activeSpotlight) activeSpotlight.classList.remove("spotlight");
  const btn = document.getElementById("start-session-btn");
  if (btn) {
    btn.textContent = "Start Session";
    btn.disabled = false;
    btn.classList.remove("opacity-50", "cursor-not-allowed");
  }
  if (validationInterval) clearInterval(validationInterval);
  if (historyInterval) clearInterval(historyInterval);
}

function generateSessionMemoir() {
  const memoirModal = document.getElementById("memoir-modal");
  const memoirContent = document.getElementById("memoir-content");
  if (!memoirModal || !memoirContent) return;

  if (!lastHistoryData) {
    memoirContent.replaceChildren();
    const p = document.createElement("p");
    p.textContent = "No session data available to generate a memoir. Please run a session first.";
    memoirContent.appendChild(p);
  } else {
    const summary =
      lastHistoryData.latest_summary?.summary?.profile_adjustment_suggestion ||
      "No specific profile adjustments suggested.";
    const rewrites = lastHistoryData.rewrite_stats || {};
    let cumulativeConfidence = 0;
    (lastHistoryData.emotional_drift_trend || []).forEach(
      (d) => (cumulativeConfidence += d.confidence_change || 0)
    );
    let cumulativeComposure = 0;
    (lastHistoryData.emotional_drift_trend || []).forEach(
      (d) => (cumulativeComposure += d.composure_change || 0)
    );
    const h3 = document.createElement("h3");
    h3.className = "text-xl font-bold text-cyan-400 mb-3";
    h3.textContent = "Session Narrative Summary";
    const p1 = document.createElement("p");
    p1.className = "mb-2";
    const cueCat = lastHistoryData.recent_cues?.[0]?.cue_category || "N/A";
    p1.textContent = `This session demonstrated the system's adaptive intelligence. The dominant cue category was ${cueCat}.`;
    const p2 = document.createElement("p");
    p2.className = "mb-2";
    p2.textContent = `Emotional drift analysis showed a final confidence change of ${cumulativeConfidence.toFixed(
      2
    )} and a composure change of ${cumulativeComposure.toFixed(
      2
    )}, indicating the player's evolving psychological state.`;
    const p3 = document.createElement("p");
    p3.className = "mb-2";
    const ratePct = Number((rewrites.rate || 0) * 100).toFixed(0);
    p3.textContent = `The system's rewrite frequency was ${ratePct}%, showing active recalibration of its coaching strategy.`;
    const h4 = document.createElement("h4");
    h4.className = "text-lg font-semibold text-cyan-400 mt-4 mb-2";
    h4.textContent = "Strategic Recommendation";
    const p4 = document.createElement("p");
    p4.className = "italic";
    p4.textContent = `"${summary}"`;
    memoirContent.replaceChildren(h3, p1, p2, p3, h4, p4);
  }
  memoirModal.style.display = "block";
  activateModalAccessibility(memoirModal, document.getElementById("memoir-close-x"));
}

document
  .querySelectorAll(".cue-btn")
  .forEach((button) =>
    button.addEventListener("click", () => playAudioForCategory(button.dataset.category))
  );
const startWalkBtn = document.getElementById("start-walkthrough-btn");
if (startWalkBtn) {
  startWalkBtn.textContent = "Begin Cinematic Tour";
  startWalkBtn.addEventListener("click", startWalkthrough);
}
// Sanitize any corrupted glyphs in key headings/buttons at runtime
const fundingH2 = document.querySelector("#funding .section-title");
if (fundingH2 && fundingH2.textContent && fundingH2.textContent.indexOf("Funding") === -1) {
  fundingH2.textContent = "Funding Ask";
}
const memoirH2 = document.querySelector("#memoir-modal h2");
if (memoirH2) {
  memoirH2.textContent = "Session Memoir";
  if (!memoirH2.id) memoirH2.id = "memoir-title";
}
const memoirBtn = document.getElementById("generate-memoir-btn");
if (memoirBtn) {
  memoirBtn.textContent = "Generate Session Memoir";
}
document.getElementById("next-walkthrough-btn")?.addEventListener("click", () => {
  currentStep++;
  runWalkthroughStep();
});
endWalkthroughBtn?.addEventListener("click", endWalkthrough);
const startSessionBtn = document.getElementById("start-session-btn");
if (startSessionBtn) startSessionBtn.addEventListener("click", () => startSession(false));
const composeCueBtn = document.getElementById("compose-cue-btn");
if (composeCueBtn) composeCueBtn.addEventListener("click", composeCue);
document.getElementById("generate-memoir-btn")?.addEventListener("click", generateSessionMemoir);

// Failsafe reveal: ensure any .fade-in / .scroll-reveal are made visible even if observers fail
(function () {
  const revealAllNow = () => {
    try {
      document
        .querySelectorAll(".fade-in, .scroll-reveal")
        .forEach((el) => el.classList.add("visible"));
    } catch {}
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", revealAllNow);
  else setTimeout(revealAllNow, 0);
})();

// Bind safe event listeners (replacing inline handlers)
const memoirModalEl = document.getElementById("memoir-modal");
document.getElementById("memoir-close-x")?.addEventListener("click", () => {
  if (memoirModalEl) memoirModalEl.style.display = "none";
});
document.getElementById("memoir-close-btn")?.addEventListener("click", () => {
  if (memoirModalEl) memoirModalEl.style.display = "none";
});
document.getElementById("cue-modal-close-x")?.addEventListener("click", () => {
  if (typeof closeCueModal === "function") closeCueModal();
});

document.getElementById("coach-toggle-btn")?.addEventListener("click", () => {
  if (typeof toggleCoachPanel === "function") toggleCoachPanel();
});
document.querySelectorAll(".persona-btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    const persona = btn.getAttribute("data-persona");
    if (persona && typeof setPersona === "function") setPersona(persona);
  })
);
document.getElementById("toggle-slogan-dropdown-btn")?.addEventListener("click", () => {
  if (typeof toggleSloganDropdown === "function") toggleSloganDropdown();
});
document.querySelectorAll(".slogan-btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    const slogan = btn.getAttribute("data-slogan");
    if (slogan && typeof playSloganDemo === "function") playSloganDemo(slogan);
  })
);

document.getElementById("match-play-btn")?.addEventListener("click", () => {
  try {
    if (matchSimulator?.playing) matchSimulator.pause();
    else matchSimulator.play();
  } catch (_) {}
});
document.getElementById("match-next-btn")?.addEventListener("click", () => {
  try {
    matchSimulator?.nextPoint?.();
  } catch (_) {}
});

document.getElementById("refresh-serve-btn")?.addEventListener("click", () => {
  try {
    refreshServeSpeed?.();
  } catch (_) {}
});
document.getElementById("refresh-spin-btn")?.addEventListener("click", () => {
  try {
    refreshSpinRate?.();
  } catch (_) {}
});
document.getElementById("refresh-accuracy-btn")?.addEventListener("click", () => {
  try {
    refreshAccuracy?.();
  } catch (_) {}
});
document.getElementById("refresh-coverage-btn")?.addEventListener("click", () => {
  try {
    refreshCoverage?.();
  } catch (_) {}
});
document.getElementById("refresh-reaction-btn")?.addEventListener("click", () => {
  try {
    refreshReactionTime?.();
  } catch (_) {}
});
document.getElementById("refresh-rally-btn")?.addEventListener("click", () => {
  try {
    refreshRallyStats?.();
  } catch (_) {}
});

// Set ARIA & keyboard handlers on modal close icons
const memoirCloseX = document.getElementById("memoir-close-x");
if (memoirCloseX) {
  memoirCloseX.setAttribute("role", "button");
  memoirCloseX.setAttribute("tabindex", "0");
  memoirCloseX.setAttribute("aria-label", "Close dialog");
  memoirCloseX.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      memoirModalEl && (memoirModalEl.style.display = "none");
    }
  });
}
const cueCloseX = document.getElementById("cue-modal-close-x");
if (cueCloseX) {
  cueCloseX.setAttribute("role", "button");
  cueCloseX.setAttribute("tabindex", "0");
  cueCloseX.setAttribute("aria-label", "Close dialog");
  cueCloseX.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      closeCueModal();
    }
  });
}

// Ensure modal containers have ARIA labels
const cueModalEl = document.getElementById("cue-modal");
if (cueModalEl) {
  cueModalEl.setAttribute("role", "dialog");
  cueModalEl.setAttribute("aria-modal", "true");
  cueModalEl.setAttribute("tabindex", "-1");
  const cueH = cueModalEl.querySelector("h3");
  if (cueH && !cueH.id) cueH.id = "cue-title";
  cueModalEl.setAttribute("aria-labelledby", "cue-title");
}
const memoirModalEl2 = document.getElementById("memoir-modal");
if (memoirModalEl2) {
  memoirModalEl2.setAttribute("role", "dialog");
  memoirModalEl2.setAttribute("aria-modal", "true");
  memoirModalEl2.setAttribute("tabindex", "-1");
  memoirModalEl2.setAttribute("aria-labelledby", "memoir-title");
}

// Clear background intervals on unload
window.addEventListener("beforeunload", () => {
  try {
    if (validationInterval) clearInterval(validationInterval);
  } catch (_) {}
  try {
    if (historyInterval) clearInterval(historyInterval);
  } catch (_) {}
  try {
    if (typeof _driftIntervalId !== "undefined") clearInterval(_driftIntervalId);
  } catch (_) {}
  try {
    if (matchSimulator && matchSimulator.intervalId)
      clearInterval(matchSimulator.intervalId);
  } catch (_) {}
});

checkInitialHealth();
initCharts();

// ---- ASK Modal wiring ----
(function () {
  const modal = document.getElementById("ask-modal");
  const askCloseX = document.getElementById("ask-close-x");
  const askCloseBtn = document.getElementById("ask-close-btn");
  const appRoot = document.getElementById("dashboard-container");
  let lastFocus = null;
  function trapTab(e) {
    if (e.key !== "Tab" || !modal || modal.hasAttribute("hidden")) return;
    const f = modal.querySelectorAll(
      "a,button,input,select,textarea,[tabindex]:not([tabindex='-1'])"
    );
    if (!f.length) return;
    const first = f[0],
      last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }
  function openAsk() {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.style.display = "block";
    modal.removeAttribute("hidden");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("role", "dialog");
    (modal.querySelector("[data-autofocus]") || askCloseBtn || askCloseX || modal).focus();
    document.addEventListener("keydown", trapTab);
    // Lock background scroll and mark app inert if available
    try {
      document.body.dataset.prevOverflow = document.body.style.overflow || "";
      document.body.style.overflow = "hidden";
    } catch {}
    try {
      appRoot?.setAttribute("inert", "");
    } catch {}
  }
  function closeAsk() {
    if (!modal) return;
    modal.setAttribute("hidden", "");
    modal.style.display = "none";
    document.removeEventListener("keydown", trapTab);
    try {
      lastFocus && lastFocus.focus();
    } catch {}
    try {
      document.body.style.overflow = document.body.dataset.prevOverflow || "";
      delete document.body.dataset.prevOverflow;
    } catch {}
    try {
      appRoot?.removeAttribute("inert");
    } catch {}
  }
  askCloseX?.addEventListener("click", closeAsk);
  askCloseBtn?.addEventListener("click", closeAsk);
  askCloseX?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      closeAsk();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.hasAttribute("hidden")) closeAsk();
  });
  window.addEventListener("mp:ask:show", openAsk);
  window.addEventListener("mp:ask:open", openAsk);
})();

// --- GO harness auto-run for recording (dev-gated), triggered by ?mode=investor&go=1 ---
(function () {
  const qp = new URLSearchParams(location.search);
  if (qp.get("mode") !== "investor" || qp.get("go") !== "1") return;

  try {
    localStorage.setItem("mp_dev_enabled", "1");
    localStorage.setItem("mp_go_visible", "1");
  } catch {}

  const waitFor = (cond, fn, timeout = 8000, step = 100) => {
    const t0 = Date.now();
    (function tick() {
      try {
        if (cond()) return fn();
      } catch {}
      if (Date.now() - t0 > timeout) return;
      setTimeout(tick, step);
    })();
  };

  function revealAndRun() {
    try {
      if (window.MP_GoHarness?.toggle) window.MP_GoHarness.toggle(true);
      setTimeout(() => window.MP_GoHarness?.run?.(), 200);
      window.addEventListener(
        "mp:demo:ready",
        () => {
          try {
            window.MP_DemoReady?.pin?.(true);
          } catch {}
        },
        { once: true }
      );
    } catch {}
  }

  window.addEventListener(
    "mp:vo:started",
    () => {
      waitFor(() => !!window.MP_GoHarness?.run, revealAndRun);
    },
    { once: true }
  );

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => waitFor(() => !!window.MP_GoHarness?.run, revealAndRun), 2000);
  });
})();

// --- Clean capture mode (recording) ---
(function () {
  try {
    const qp = new URLSearchParams(location.search);
    if (qp.get("rec") === "1") document.documentElement.classList.add("mp-recording");
  } catch {}
})();

// ---- Investor Autopilot (optional) ----
(function () {
  const qp = new URLSearchParams(location.search);
  if (qp.get("mode") !== "investor") return;
  if (sessionStorage.getItem("mp_investor_auto") === "1") return;
  sessionStorage.setItem("mp_investor_auto", "1");

  let live = false,
    replaying = false,
    kpiSeen = false;

  window.addEventListener("mp:sse:open", () => (live = true), { once: true });
  window.addEventListener("mp:replay:start", () => (replaying = true));
  window.addEventListener("mp:replay:end", () => (replaying = false));

  // When audio is enabled, start tour; if SSE isn’t live shortly after, trigger golden replay.
  window.addEventListener(
    "mp:sound-enabled",
    () => {
      window.dispatchEvent(new CustomEvent("mp:tour:start"));
      setTimeout(() => {
        if (!live && !replaying) {
          try {
            window.MP_Replay?.playGolden?.();
          } catch {}
          if (!window.MP_Replay?.playGolden) {
            window.dispatchEvent(new CustomEvent("mp:replay:golden"));
          }
        }
      }, 1500);
    },
    { once: true }
  );

  // First KPI -> show ASK (or fallback timer)
  const markKPI = () => {
    kpiSeen = true;
    showAsk();
    cleanupKPI();
  };
  const cleanupKPI = () => {
    window.removeEventListener("mp:style_outcome", markKPI);
    window.removeEventListener("mp:layout:diff", markKPI);
  };
  window.addEventListener("mp:style_outcome", markKPI, { once: true });
  window.addEventListener("mp:layout:diff", markKPI, { once: true });

  function showAsk() {
    window.dispatchEvent(new CustomEvent("mp:ask:show"));
    try {
      window.MP_DemoReady?.pin(true);
    } catch {}
  }

  // If no KPI lands, show ASK ~4.5 min after VO ends.
  window.addEventListener(
    "mp:vo:ended",
    () => {
      setTimeout(() => {
        if (!kpiSeen) showAsk();
      }, 270000);
    },
    { once: true }
  );
})();
