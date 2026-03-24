const fs = require('fs');
const path = require('path');

const INDEX = path.resolve(__dirname, '..', 'src', 'index.js');
const MOD_DIR = path.resolve(__dirname, '..', 'src', 'modules');
const UI_MOD = path.join(MOD_DIR, 'ui.js');

// Functions to extract into ui.js
const UI_FUNCS = [
  'toggleCoachPanel',
  'toggleSloganDropdown',
  'showCueExplanation',
  'closeCueModal',
  'setupScrollEffects',
  'setupParallaxEffects',
];

function findFunction(source, name) {
  const re = new RegExp(`\\bfunction\\s+${name}\\s*\\(`);
  const m = re.exec(source);
  if (!m) return null;
  let i = m.index;
  // Find opening brace
  const braceStart = source.indexOf('{', m.index);
  if (braceStart === -1) return null;
  let depth = 0;
  for (let pos = braceStart; pos < source.length; pos++) {
    const ch = source[pos];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return { start: i, end: pos + 1, code: source.slice(i, pos + 1) };
      }
    }
  }
  return null;
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function run() {
  let src = fs.readFileSync(INDEX, 'utf8');

  const extracted = [];
  for (const fn of UI_FUNCS) {
    const found = findFunction(src, fn);
    if (!found) continue;
    extracted.push({ name: fn, ...found });
  }
  if (extracted.length === 0) {
    console.log('No target UI functions found; nothing to do.');
    process.exit(0);
  }
  // Remove from end to start to preserve indices
  extracted.sort((a, b) => b.start - a.start);
  for (const ex of extracted) {
    src = src.slice(0, ex.start) + src.slice(ex.end);
  }

  // Update invocations to pass reducedMotion flag for scroll/parallax
  src = src.replace(/\bsetupScrollEffects\(\)/g, 'setupScrollEffects(REDUCED_MOTION)');
  src = src.replace(/\bsetupParallaxEffects\(\)/g, 'setupParallaxEffects(REDUCED_MOTION)');

  // Add import at top if not present
  const importLine = "import { setupScrollEffects, setupParallaxEffects, toggleCoachPanel, toggleSloganDropdown, showCueExplanation, closeCueModal } from './modules/ui.js';\n";
  if (!src.includes("from './modules/ui.js'")) {
    // Insert after first import (there is an existing Chart import)
    const firstImportEnd = src.indexOf('\n', src.indexOf('import')) + 1;
    src = src.slice(0, firstImportEnd) + importLine + src.slice(firstImportEnd);
  }

  // Build ui module code
  extracted.sort((a,b) => a.start - b.start);
  let uiCode = '';
  for (const ex of extracted) {
    let code = ex.code;
    if (ex.name === 'setupScrollEffects' || ex.name === 'setupParallaxEffects') {
      // Replace REDUCED_MOTION with param name
      code = code.replace(/\bREDUCED_MOTION\b/g, 'reducedMotion');
      // Change signature to accept flag
      code = code.replace(new RegExp(`function\\s+${ex.name}\\s*\\(\\)\n?\s*{`), `export function ${ex.name}(reducedMotion) {`);
    } else {
      code = code.replace(new RegExp(`function\\s+${ex.name}\\s*\\(`), `export function ${ex.name}(`);
    }
    uiCode += code + '\n\n';
  }

  ensureDir(MOD_DIR);
  fs.writeFileSync(UI_MOD, uiCode.trim() + '\n');
  fs.writeFileSync(INDEX, src);
  console.log(`Extracted ${extracted.length} UI functions to ${path.relative(process.cwd(), UI_MOD)}`);
}

run();

