const fs = require('fs');
const path = require('path');

const INDEX = path.resolve(__dirname, '..', 'src', 'index.js');
const MOD_DIR = path.resolve(__dirname, '..', 'src', 'modules');
const CHARTS_MOD = path.join(MOD_DIR, 'charts.js');

const CHART_FUNCS = [
  'initializeKalmanChart',
  'initializePersonaHeatmap',
  'initializeEmotionalTrajectory',
  'updateDriftChart',
  'updateHistoryPanel',
];

function findFunction(source, name) {
  const re = new RegExp(`\\bfunction\\s+${name}\\s*\\(`);
  const m = re.exec(source);
  if (!m) return null;
  const braceStart = source.indexOf('{', m.index);
  if (braceStart === -1) return null;
  let depth = 0;
  for (let pos = braceStart; pos < source.length; pos++) {
    const ch = source[pos];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return { start: m.index, end: pos + 1, code: source.slice(m.index, pos + 1), name };
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
  for (const fn of CHART_FUNCS) {
    const found = findFunction(src, fn);
    if (found) extracted.push(found);
  }
  if (extracted.length === 0) {
    console.log('No chart functions found; nothing to do.');
    process.exit(0);
  }
  extracted.sort((a,b)=>b.start-a.start);
  for (const ex of extracted) {
    src = src.slice(0, ex.start) + src.slice(ex.end);
  }
  // Add import line
  const importLine = "import { initializeKalmanChart, initializePersonaHeatmap, initializeEmotionalTrajectory, updateDriftChart, updateHistoryPanel } from './modules/charts.js';\n";
  if (!src.includes("from './modules/charts.js'")) {
    const firstImportEnd = src.indexOf('\n', src.indexOf('import')) + 1;
    src = src.slice(0, firstImportEnd) + importLine + src.slice(firstImportEnd);
  }

  // Build charts module
  let chartsCode = "import Chart from 'chart.js/auto';\n\n";
  chartsCode += 'let sensorWeightsChart, driftChart, cueBiasChart, emotionalBaselineChart;\n\n';
  // Add exported functions
  for (const ex of extracted.sort((a,b)=>a.start-b.start)) {
    let code = ex.code.replace(new RegExp(`function\\s+${ex.name}\\s*\\(`), `export function ${ex.name}(`);
    chartsCode += code + '\n\n';
  }

  ensureDir(MOD_DIR);
  fs.writeFileSync(CHARTS_MOD, chartsCode.trim() + '\n');
  fs.writeFileSync(INDEX, src);
  console.log(`Extracted ${extracted.length} chart functions to ${path.relative(process.cwd(), CHARTS_MOD)}`);
}

run();

