// Dungeon-run simulator for Happy Hex Hour. A lookahead bot (also picks targets) plays whole runs.
//   node tools/wizard/sim.js                          default cases
//   N=10 POLS=smart,naive,random CASES='[[0,2,"bare"],[3,5,"mid"]]' node tools/wizard/sim.js
// CASES = [startFloorIdx, endFloorIdx, buildName] (floors 0..9; builds in builds.json)
// POLS: smart (search over cards AND targets) · naive (lowest-HP foe first) · high (highest-HP first) · random target
// POT=1 adds run rewards (+hand, Dragon's Dram, new spells) and 2 starting Cauldron potions. Rooms heal 20%, tavern full.
require('./engine');
const fs = require('fs'), path = require('path');
const clone = x => JSON.parse(JSON.stringify(x)); const builds = JSON.parse(fs.readFileSync(path.join(__dirname, 'builds.json'), 'utf8'));
const D = +process.env.D || 3;
const score = X => { const fh = X.foes.reduce((a, f) => a + (f.dead ? 0 : f.hp), 0); return X.over === 'win' ? 1e6 - X.turn + X.me.hp*50 : X.over === 'lose' ? -1e6 : -fh*3 + X.me.hp*3 - (X.skip || X.me.ko ? 70 : 0) - X.foes.filter(f => !f.dead).length*15 - X.me.buzz*.5; };
function look(B, d0, fixed){ let best = { s:-1e9, line:[] };
  (function rec(st, line, d){ const e = clone(st); dwEndTurn(e); const sc = score(e); if(sc > best.s) best = { s:sc, line:line.slice() }; if(!d || st.over) return; const seen = new Set();
    for(let i = 0; i < st.hand.length; i++){ const id = st.hand[i]; if(seen.has(id)) continue; seen.add(id); if(!dwCanPlay(st, i)) continue;
      const s = DW_SPELLS[id], live = st.foes.map((f, k) => k).filter(k => !st.foes[k].dead);
      const tg = fixed != null ? [st.foes[fixed] && !st.foes[fixed].dead ? fixed : live[0]] : (s.dmg || s.stun || s.freeze || s.poison || s.blank || s.confuse) && !s.aoe ? live : [st.ti];
      for(const k of tg){ const n = clone(st); dwTarget(n, k); dwPlay(n, n.hand.indexOf(id)); line.push([id, n.ti]); rec(n, line, d - 1); line.pop(); } } })(B, [], d0);
  return best.line; }
const pick = (B, order) => { const al = B.foes.map((f, k) => [f, k]).filter(x => !x[0].dead); al.sort(order); return al[0][1]; };
const POL = {
  smart:  B => look(B, D),
  naive:  B => look(B, D, pick(B, (a, b) => a[0].hp - b[0].hp)),
  high:   B => look(B, D, pick(B, (a, b) => b[0].hp - a[0].hp)),
  random: B => look(B, D, pick(B, () => Math.random() - .5))
};
function fight(ids, build, carry, pol){ const B = dwNewBattle(ids, build, 0, carry);
  for(let t = 0; t < 40 && !B.over; t++){ const line = B.skip ? [] : pol(B);
    for(const [id, k] of line){ if(B.foes[k] && !B.foes[k].dead) dwTarget(B, k); const i = B.hand.indexOf(id); if(i >= 0 && dwCanPlay(B, i)) dwPlay(B, i); if(B.over || B.me.ko) break; }
    if(!B.over) dwEndTurn(B); } return B; }
function run(a, z, b, pol){ let hp = null, buzz = 0; const max = DW_WOOD_HP[b.wood], build = clone(b); build.potions = []; let cleared = 0, nextPot = [], first = !!process.env.POT;
  for(let f = a; f <= z; f++){ const boss = DW_FLOOR_ORDER[f], nodes = [];
    for(let n = 1; n <= DW_FLOOR_ROOMS[f]; n++) nodes.push(dwRoomFoes(boss, n > 1 ? n : false));
    if(DW_ELITES[boss]) nodes.push(dwEliteFoes(boss)); nodes.push([boss]);
    for(const ids of nodes){ const bb = clone(build); bb.potions = nextPot.concat(first ? ['p_strong', 'p_dragon'] : []); nextPot = []; first = false;
      const B = fight(ids, bb, { hp, buzz }, pol); if(B.over !== 'win') return { cleared, died:ids.join('+') };
      hp = B.me.hp; buzz = B.me.buzz;
      if(ids.length === 1 && ids[0] === boss){ hp = max; buzz = 0; }
      else { hp = Math.min(max, hp + Math.round(max*.2)); buzz = Math.max(0, buzz - 3);
        if(hp < max*.5) hp = Math.min(max, hp + 18);
        else if(process.env.POT){ if((build.handBonus|0) < 2 && Math.random() < .4) build.handBonus = (build.handBonus|0) + 1; else if(Math.random() < .5) nextPot.push('p_dragon'); else build.deck.push(['barrel','jager','butter','glacius'][Math.floor(Math.random()*4)]); } } }
    cleared++; }
  return { cleared }; }
const N = +process.env.N || 6, cases = process.env.NODES ? [] : JSON.parse(process.env.CASES || '[[0,2,"bare"],[0,2,"early"],[3,5,"mid"],[6,8,"full"]]'), pols = (process.env.POLS || 'smart,naive').split(',');
for(const [a, z, b] of cases) for(const p of pols){ let tot = 0, full = 0; const d = {};
  for(let n = 0; n < N; n++){ const r = run(a, z, builds[b], POL[p]); tot += r.cleared; if(r.cleared === z - a + 1) full++; else d[r.died] = (d[r.died]||0) + 1; }
  console.log(`F${a+1}-F${z+1}`.padEnd(8), b.padEnd(6), p.padEnd(7), 'avg floors', (tot/N).toFixed(1), 'full clear', String(Math.round(full/N*100)).padStart(3) + '%', ' died at', JSON.stringify(d)); }
// NODES=1: per-fight difficulty from FULL health (win% / avg health lost) for each floor's rooms, mini-boss and rival.
//   NODES=1 BM='{"filch":"bare","snapps":"mid"}' node tools/wizard/sim.js
if(process.env.NODES){
  const bm = JSON.parse(process.env.BM || '{"filch":"bare","trela":"bare","troll":"early","snapps":"mid","bella":"mid","umbridge":"mid","dementors":"full","lockheart":"full","veela":"full","vodkamort":"full"}');
  for(const boss of Object.keys(bm)){ const b = builds[bm[boss]], f = DW_FLOOR_ORDER.indexOf(boss), out = [];
    const nodes = []; for(let n = 1; n <= DW_FLOOR_ROOMS[f]; n++) nodes.push(['r' + n, dwRoomFoes(boss, n > 1 ? n : false)]);
    if(DW_ELITES[boss]) nodes.push(['E', dwEliteFoes(boss)]); nodes.push(['B', [boss]]);
    for(const [n, ids] of nodes){ let lost = 0, win = 0; for(let k = 0; k < N; k++){ const B = fight(ids, clone(b), null, POL.smart); if(B.over === 'win'){ win++; lost += B.me.max - B.me.hp; } }
      out.push(`${n}:${Math.round(win/N*100)}%/-${win ? Math.round(lost/win) : '-'}`); }
    console.log(boss.padEnd(10), bm[boss].padEnd(6), 'hp', DW_WOOD_HP[b.wood], out.join('  ')); } }
