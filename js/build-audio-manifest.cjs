const fs = require('fs');
const path = require('path');

const roots = [
  path.resolve(__dirname, '..', 'assets', 'audio'),
  path.resolve(__dirname, '..', 'voices'),
  path.resolve(__dirname, '..', 'coaching_personas', 'sources'),
];

const outDir = path.resolve(__dirname, '..', 'assets', 'manifest');
const outFile = path.join(outDir, 'audio.json');

function listFiles(dir, exts, base) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(listFiles(full, exts, base));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (exts.includes(ext)) {
        const rel = base ? full.replace(base, '').replace(/\\/g, '/') : full;
        const stat = fs.statSync(full);
        results.push({ path: rel.startsWith('/') ? rel : '/' + rel, size: stat.size });
      }
    }
  }
  return results;
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function run() {
  const audioExts = ['.mp3', '.wav', '.ogg', '.m4a'];
  const all = [];
  for (const root of roots) {
    const base = path.resolve(__dirname, '..');
    const files = listFiles(root, audioExts, base);
    all.push(...files);
  }
  const manifest = {
    generatedAt: new Date().toISOString(),
    count: all.length,
    items: all.sort((a,b)=> a.path.localeCompare(b.path)),
  };
  ensureDir(outDir);
  fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${manifest.count} items to ${path.relative(process.cwd(), outFile)}`);
}

run();

