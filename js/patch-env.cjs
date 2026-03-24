const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'src', 'index.js');
let s = fs.readFileSync(file, 'utf8');

// Fix incorrect checks like `typeof import !== 'undefined'`
s = s.replace(/typeof import !== 'undefined'/g, 'true');
s = s.replace(/typeof import !== "undefined"/g, 'true');
// Also normalize any stray `importMeta` to `import.meta`
s = s.replace(/\bimportMeta\b/g, 'import.meta');

fs.writeFileSync(file, s);
console.log('Patched env checks in src/index.js');

