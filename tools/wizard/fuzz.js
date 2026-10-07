// Fuzz the duel engine: thousands of random builds/rooms/plays, checking invariants (no NaN, no stuck turns,
// pass-out always skips a turn, hand never holds non-potions while asleep, can-play ⇒ play returns events).
//   node tools/wizard/fuzz.js      (prints {} when clean)
require('./engine');
const foes = Object.keys(DW_FOES_CORE), ids = Object.keys(DW_SPELLS).filter(k => !DW_SPELLS[k].potion), pots = Object.keys(DW_SPELLS).filter(k => DW_SPELLS[k].potion);
const R = n => Math.floor(Math.random()*n), issues = {};
function bad(k, info){ issues[k] = issues[k] || { n:0, ex:info }; issues[k].n++; }
for(let n = 0; n < (+process.env.N || 4000); n++){
  const deck = Array.from({ length:6 + R(7) }, () => ids[R(ids.length)]), lv = {}; deck.forEach(d => { if(Math.random() < .5) lv[d] = 1; });
  const build = { core:R(4), wood:R(4), tip:R(4), charm:R(4), deck, lv, gems:['lime','umbrella','bitters','ice','salt','cherry'].filter(() => Math.random() < .3), potions:Array.from({ length:R(4) }, () => pots[R(pots.length)]) };
  const B = dwNewBattle(Math.random() < .4 ? [foes[R(foes.length)], foes[R(foes.length)], foes[R(foes.length)]].slice(0, 2 + R(2)) : foes[R(foes.length)], build, 0, { foeMult:Math.random() < .5 ? .4 : 1 });
  let prevKo = 0;
  for(let t = 0; t < 45 && !B.over; t++){
    if(B.skip && B.hand.some(x => !DW_SPELLS[x].potion)) bad('skip-but-hand', B.hand);
    if(prevKo && !B.skip && !B.over) bad('ko-not-skipped', B.turn);
    let plays = 0;
    while(!B.over && B.hand.length && Math.random() < .8 && plays < 12){
      const live = B.foes.map((f, k) => k).filter(k => !B.foes[k].dead); if(live.length) dwTarget(B, live[R(live.length)]);
      const i = R(B.hand.length), ok = dwCanPlay(B, i), ev = dwPlay(B, i); plays++;
      if(ok && !ev) bad('canplay-but-null', B.hand[i]); if(!ok) break; if(B.me.ko) break; }
    for(const [k, v] of Object.entries({ buzz:B.me.buzz, hp:B.me.hp, block:B.me.block, ...Object.fromEntries(B.foes.map((f, j) => ['foe' + j, f.hp])) }))
      if(typeof v !== 'number' || isNaN(v) || v < 0) bad('bad-number:' + k, v);
    B.foes.forEach(f => { if(f.hp > f.max) bad('overheal', [f.id, f.hp, f.max]); });
    prevKo = B.me.ko; if(!B.over) dwEndTurn(B);
  }
}
console.log(JSON.stringify(issues, null, 1));
