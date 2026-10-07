// Fast sanity check: every inline <script> parses, and docs/index.html is identical to pubcrawlers.html.
//   node tools/check.js
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'pubcrawlers.html'), 'utf8');
let n = 0, bad = 0;
for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)){ n++; try{ new Function(m[1]); }catch(e){ bad++; console.log('✗ script', n, e.message); } }
const docs = path.join(root, 'docs', 'index.html'), same = fs.existsSync(docs) && fs.readFileSync(docs, 'utf8') === html;
console.log(`${bad ? '✗' : '✓'} ${n} script block(s) parse · ${same ? '✓' : '✗'} docs/index.html ${same ? 'matches' : 'DIFFERS from'} pubcrawlers.html`);
process.exit(bad || !same ? 1 : 0);
