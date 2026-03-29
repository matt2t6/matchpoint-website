const MANIFEST_URL = "/assets/audio_ultra_polished/cue_master_database.json";
const AUDIO_ROOT = "/assets/audio_ultra_polished";
const MAX_RECENT = 15;

const PHASE_CATEGORY_MAP = {
  warmup: ["tactical", "general"],
  pressure: ["pressure", "tactical", "general"],
  crisis: ["reset", "general"],
  recovery: ["recovery", "victory", "general"],
  default: ["general"]
};

const LOW_COMPOSURE_EMOTIONS = new Set(["calming", "focused", "neutral"]);
const HIGH_COMPOSURE_EMOTIONS = new Set(["celebratory", "assertive", "motivational", "neutral"]);

let manifestPromise = null;
let manifestData = null;
let flattenedCues = [];

const recentHistory = [];
const usageCount = new Map();

let totalPlayed = 0;
let uniquePlayed = 0;

function ensureManifest() {
  if (manifestPromise) return manifestPromise;
  manifestPromise = fetch(MANIFEST_URL, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load cue manifest (${response.status})`);
      }
      return response.json();
    })
    .then((data) => {
      manifestData = data || {};
      flattenedCues = Object.values(manifestData).flat();
      return manifestData;
    })
    .catch((error) => {
      manifestPromise = null;
      console.error("[CueSelector] Unable to load manifest", error);
      throw error;
    });
  return manifestPromise;
}

export async function initCueSelector() {
  await ensureManifest();
}

export async function selectCue({ category, phase, composure }) {
  await ensureManifest();
  const candidates = resolveCandidatePool({ category, phase, composure });
  if (!candidates.length) return null;

  const scored = candidates
    .map((cue) => ({ cue, score: scoreCue(cue) }))
    .sort((a, b) => b.score - a.score);

  const topSlice = scored.slice(0, Math.min(3, scored.length));
  const choice = weightedPick(topSlice);
  if (!choice) return null;

  registerCue(choice);
  return buildSelection(choice);
}

export function getCueStats() {
  return {
    total: totalPlayed,
    unique: uniquePlayed,
    recent: [...recentHistory]
  };
}

function resolveCandidatePool({ category, phase, composure }) {
  const preferredCategories = [];
  if (category) preferredCategories.push(category.toLowerCase());
  const mapped = PHASE_CATEGORY_MAP[(phase || "").toLowerCase()] || PHASE_CATEGORY_MAP.default;
  mapped.forEach((cat) => {
    if (!preferredCategories.includes(cat)) preferredCategories.push(cat);
  });

  const emotionPrefs = buildEmotionPreference(composure);

  let pool = filterByCategories(preferredCategories);
  pool = applyPhaseFilter(pool, phase);
  pool = applyEmotionFilter(pool, emotionPrefs);
  pool = filterRecent(pool);

  if (!pool.length) {
    pool = applyEmotionFilter(filterByCategories(mapped), emotionPrefs);
    pool = filterRecent(pool);
  }

  if (!pool.length) {
    pool = filterRecent(flattenedCues);
  }

  return pool;
}

function filterByCategories(categories) {
  if (!Array.isArray(categories) || !categories.length) return flattenedCues;
  return flattenedCues.filter((cue) => {
    const category = (cue.category || "").toLowerCase();
    const source = (cue.source_folder || "").toLowerCase();
    return categories.includes(category) || categories.includes(source);
  });
}

function applyPhaseFilter(cues, phase) {
  if (!phase) return cues;
  const phaseKey = phase.toLowerCase();
  return cues.filter((cue) => {
    const cuePhase = (cue.phase || "any").toLowerCase();
    return cuePhase === "any" || cuePhase === phaseKey;
  });
}

function buildEmotionPreference(composure) {
  if (!Number.isFinite(composure)) return null;
  if (composure < 55) return LOW_COMPOSURE_EMOTIONS;
  if (composure > 75) return HIGH_COMPOSURE_EMOTIONS;
  return null;
}

function applyEmotionFilter(cues, emotionSet) {
  if (!emotionSet || !(emotionSet instanceof Set)) return cues;
  const filtered = cues.filter((cue) => emotionSet.has((cue.emotion || "neutral").toLowerCase()));
  return filtered.length ? filtered : cues;
}

function filterRecent(cues) {
  if (!recentHistory.length) return cues;
  const recentSet = new Set(recentHistory);
  const filtered = cues.filter((cue) => !recentSet.has(cue.new_filename));
  return filtered.length ? filtered : cues;
}

function scoreCue(cue) {
  const filename = cue.new_filename;
  const usage = usageCount.get(filename) || 0;
  const freshness = 100 - usage * 10;
  const emotionBonus = cue.emotion && cue.emotion.toLowerCase() === "celebratory" ? 5 : 0;
  return freshness + emotionBonus + Math.random() * 5;
}

function weightedPick(entries) {
  if (!entries.length) return null;
  if (entries.length === 1) return entries[0].cue;

  const weights = entries.map((entry) => Math.max(1, entry.score));
  const total = weights.reduce((sum, value) => sum + value, 0);
  let threshold = Math.random() * total;
  for (let i = 0; i < entries.length; i += 1) {
    threshold -= weights[i];
    if (threshold <= 0) return entries[i].cue;
  }
  return entries[entries.length - 1].cue;
}

function registerCue(cue) {
  const filename = cue.new_filename;
  const previousUsage = usageCount.get(filename) || 0;
  usageCount.set(filename, previousUsage + 1);

  totalPlayed += 1;
  if (previousUsage === 0) {
    uniquePlayed += 1;
  }

  recentHistory.push(filename);
  if (recentHistory.length > MAX_RECENT) {
    recentHistory.shift();
  }
}

function buildSelection(cue) {
  const sourceFolder = cue.source_folder || cue.category || "tactical";
  const audioPath = `${AUDIO_ROOT}/${sourceFolder}/${cue.new_filename}`;
  return {
    path: audioPath,
    text: cue.cue_text,
    emotion: cue.emotion,
    metadata: cue
  };
}
