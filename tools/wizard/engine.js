// Loads the Happy Hex Hour duel ENGINE (pure rules, no drawing) straight out of pubcrawlers.html,
// so the simulators always test the real code. The engine block runs from the comment
// "wizarding duel (engine" down to the end of dwFoeAct ("  B.foe.pi++;\n}").
const fs = require('fs'), path = require('path'), vm = require('vm');
const FILE = process.env.PC_FILE || path.join(__dirname, '..', '..', 'pubcrawlers.html');
const html = fs.readFileSync(FILE, 'utf8');
const a = html.lastIndexOf('/*', html.indexOf('wizarding duel (engine'));
const endMark = '\n  B.foe.pi++;\n}', b = html.indexOf(endMark, a);
if(a < 0 || b < 0) throw new Error('engine markers not found in ' + FILE);
const src = html.slice(a, b + endMark.length);
vm.runInThisContext(src, { filename:'dw-engine.js' });
module.exports = { src, FILE };
