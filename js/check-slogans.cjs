const fs = require('fs');
const path = require('path');

const mappingPath = path.resolve(__dirname, '..', 'assets', 'slogans.json');
const outDir = path.resolve(__dirname, '..', 'assets', 'coach_slogans');

function run() {
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  const missing = [];
  for (const base of Object.keys(mapping)) {
    const p = path.join(outDir, base + '.mp3');
    if (!fs.existsSync(p)) missing.push({ file: p, text: mapping[base] });
  }
  console.log(`Total: ${Object.keys(mapping).length}, Missing: ${missing.length}`);
  for (const m of missing) console.log('MISSING:', m.file);
}

run();

