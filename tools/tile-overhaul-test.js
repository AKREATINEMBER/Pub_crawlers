// tile overhaul smoke test: roll sim + UI flows + old-save migration
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.env.OUT || '/tmp/claude-0/-home-claude/bca1aaf3-2c4f-53f7-b6f7-15fb42af2fcd/scratchpad/shots';
require('fs').mkdirSync(OUT, { recursive: true });
const FILE = 'file://' + path.resolve(__dirname, '../pubcrawlers.html');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' + (require('fs').existsSync('/opt/pw-browsers/chromium/chrome') ? '/chrome' : ''), args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(FILE);
  await page.waitForTimeout(800);
  await page.evaluate(() => { document.getElementById('playerName').value = 'DEV'; const c = document.getElementById('devCode'); if (c) c.value = 'PUBDEV'; startDevRun(); });
  await page.waitForTimeout(800);
  await page.evaluate(() => { closeCard(); if (typeof _unlockQueue !== 'undefined') _unlockQueue.length = 0; S.tutorialDone = true; S.pulls = 12; S.level = 6; save(); });

  // ── roll sim ──
  const sim = await page.evaluate(() => {
    const out = {}, removed = ['RAW POWER','KEBAB TO THE FUTURE','THE FOUNTAIN OF YOUTH','EXECUTE ORDER WATER','THE BENCHWARMER','HOME ALONE: PINT FOR ONE','SHOW ME THE MONEY','BIG DOINK','BLACK MIRROR','COUNT DRUNKULA','THE ILLUMINALE HANDSHAKE','A QUIET PLACE','ARM OF STEEL','WHEEL OF CHAOS','THE PADDINGTON RAID','YOU SHALL NOT PASS','PROFESSOR X READS THE ROOM','NEVER HAVE I EVER: SNYDER CUT','MILLION DOLLAR PUNCH','THE SLOTFATHER','DIRTY DANCE FLOOR','A BEER ON ELM STREET','FRIENDLY NEIGHBOURHOOD BREW','THE FAMILY FEUD'];
    const bad = [];
    for (const c of ['tank','gambler','jester','machine','wizard']) {
      S.charId = c;
      for (const d of [1,2]) {
        S.dare = d; const types = {}, names = {};
        for (let i = 0; i < 10000; i++) {
          const t = spinOutcome(); types[t.t] = (types[t.t]||0) + 1; names[t.n] = (names[t.n]||0) + 1;
          if (removed.includes(t.n) || t.t === 'chaos' || t.t === 'boss' || t.t === 'mercy') bad.push(c+d+t.n);
          if (t.gamblerOnly && c !== 'gambler') bad.push('gamblerOnly leak '+c+d+t.n);
          if (t.pics || String(t.body).includes('{PIC}')) bad.push('unbaked '+t.n);
        }
        const pct = o => Object.fromEntries(Object.entries(o).sort((a,b)=>b[1]-a[1]).map(([k,v]) => [k, +(v/100).toFixed(1)]));
        out[c+'@'+d] = { types: pct(types), distinct: Object.keys(names).length, top: Object.entries(names).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k+' '+(v/100).toFixed(1)+'%') };
      }
    }
    S.charId = 'tank'; S.dare = 2;
    return { out, bad: bad.slice(0, 20), badCount: bad.length };
  });
  console.log('SIM bad:', sim.badCount, sim.bad);
  for (const k of ['tank@1','tank@2','gambler@1','gambler@2','wizard@2','machine@2']) console.log(k, JSON.stringify(sim.out[k]));

  const shot = async n => { await page.waitForTimeout(250); await page.screenshot({ path: `${OUT}/${n}.png` }); };
  const find = n => page.evaluate(n => JSON.parse(JSON.stringify(TILES.find(t => t.n === n))), n);

  // ── water card: roll it, take it, then USE IT on the next tile ──
  await page.evaluate(() => { S.waterCards = 0; S.currentTile = null; S.resolved = true; const t = Object.assign({}, TILES.find(x => x.t === T.WATER)); S._slotPending = { tile: t, dare: 2 }; previewSlotResult(t); });
  await shot('01_water_roll');
  await page.evaluate(() => acceptSlotResult());
  await shot('02_water_taken');
  const wc = await page.evaluate(() => [S.waterCards, S.pulls]);
  console.log('water cards after take:', wc);
  await page.evaluate(() => { closeCard(); const t = bakeTile(Object.assign({}, TILES.find(x => x.n === 'THUMB WARS'))); S._slotPending = { tile: t, dare: 2 }; previewSlotResult(t); });
  await shot('03_tile_with_use_it');
  const before = await page.evaluate(() => [S.waterCards, S.skips]);
  await page.evaluate(() => useWaterCard('slot'));
  await page.waitForTimeout(2000);
  const after = await page.evaluate(() => [S.waterCards, S.skips, !!S._slotPending, S._slotPending && S._slotPending.tile.n, S.waterUsed]);
  console.log('use it: before', before, 'after', after);
  await shot('04_after_use_it');

  // ── deck games ──
  for (const n of ['NO CAP, SHERLOCK', 'HIGHER OR LAGER', 'THE LIMIT DOES NOT EXIST']) {
    await page.evaluate(n => { closeCard(); S._slotPending = null; const t = Object.assign({}, TILES.find(x => x.n === n)); S._slotPending = { tile: t, dare: 1 }; acceptSlotResult(); }, n);
    const tag = n.split(' ')[0];
    await shot('10_' + tag + '_inline');
    for (let r = 1; r <= 3; r++) {
      await page.evaluate(() => toolOpen());
      if (r === 1) await shot('11_' + tag + '_q');
      await page.evaluate(() => deckReveal());
      if (r === 1) await shot('12_' + tag + '_a');
      await page.evaluate(() => deckNext());
    }
    await shot('13_' + tag + '_done');
    console.log(n, 'used', await page.evaluate(n => JSON.stringify(S.deckUsed), n), 'run', await page.evaluate(() => JSON.stringify(S.toolRun)));
    await page.evaluate(() => resolveTile(true));
    await page.waitForTimeout(300);
    await page.evaluate(() => { closeCard(); S._pendingWin = null; S._tankPendingWin = null; save(); });
  }

  // ── ride the bus ──
  await page.evaluate(() => { closeCard(); S._tankPendingWin = null; const t = Object.assign({}, TILES.find(x => x.n === 'SPEED: RIDE THE BUS')); S._slotPending = { tile: t, dare: 1 }; acceptSlotResult(); toolOpen(); });
  await shot('20_bus_1');
  await page.evaluate(() => { busGuess('red'); }); await shot('21_bus_1_res');
  await page.evaluate(() => { busNext(); busGuess('hi'); busNext(); busGuess('in'); busNext(); busGuess('0'); });
  await shot('22_bus_end');
  await page.evaluate(() => { busNext(); resolveTile(true); });
  await page.waitForTimeout(300);
  await page.evaluate(() => { closeCard(); S._tankPendingWin = null; save(); });

  // ── gambler: blackjack + roulette ──
  await page.evaluate(() => { S.charId = 'gambler'; S._pendingWin = null; const t = Object.assign({}, TILES.find(x => x.n === 'BLACKJACK SPARROW')); S._slotPending = { tile: t, dare: 2 }; previewSlotResult(t); });
  await shot('30_bj_preview');
  await page.evaluate(() => { acceptSlotResult(); toolOpen(); });
  await shot('31_bj_hand');
  await page.evaluate(() => { bjMiniStand(); }); await shot('32_bj_done');
  await page.evaluate(() => { closeCard(); S.currentTile = null; S.resolved = true; const t = Object.assign({}, TILES.find(x => x.n === '50 SHADES OF RED')); S._slotPending = { tile: t, dare: 2 }; acceptSlotResult(); toolOpen(); });
  await shot('33_red');
  await page.evaluate(() => redSpin('red')); await shot('34_red_res');
  await page.evaluate(() => { closeCard(); S.charId = 'tank'; S.currentTile = null; S.resolved = true; save(); });

  // ── pongs → quarters, snappossible ──
  await page.evaluate(() => { const t = Object.assign({}, TILES.find(x => x.n === 'GAME OF PONGS')); S._slotPending = { tile: t, dare: 2 }; previewSlotResult(t); });
  await shot('40_pongs');
  await page.evaluate(() => playQuarters()); await shot('41_quarters');
  await page.evaluate(() => { closeCard(); S._slotPending = null; const t = pickTileOfType(T.SOCIAL, null, 2); S._slotPending = { tile: t, dare: 2 }; previewSlotResult(t); });
  await shot('42_dare3_social');

  // ── double trouble ──
  const dt = await page.evaluate(() => { closeCard(); S.charId = 'machine'; S.doubleNext = false; S.doubleArm = false; const t = Object.assign({}, TILES.find(x => x.n === 'DOUBLE TROUBLE XP')); S._slotPending = { tile: t, dare: 1 }; acceptPintResult(); resolveTile(true); const a = [S.doubleArm, S.doubleNext]; closeCard(); const t2 = Object.assign({}, TILES.find(x => x.n === 'THUMB WARS')); S._slotPending = { tile: t2, dare: 2 }; acceptPintResult(); const b2 = [S.doubleArm, S.doubleNext]; const x0 = S.xp, l0 = S.level; resolveTile(true); return { afterWin: a, afterNextAccept: b2, xpGain: S.xp - x0, lvl: S.level - l0 }; });
  console.log('double trouble', JSON.stringify(dt));
  await page.evaluate(() => { closeCard(); S.charId = 'tank'; save(); });

  // ── ghostbrewsters ──
  await page.evaluate(() => { const t = Object.assign({}, TILES.find(x => x.n === 'GHOSTBREWSTERS')); S._slotPending = { tile: t, dare: 2 }; previewSlotResult(t); });
  await shot('50_ghost_preview');
  await page.evaluate(() => acceptSlotResult());
  await page.waitForTimeout(1300);
  await shot('51_ghost_haunted');
  const h = await page.evaluate(() => { const b0 = S.beerCoinsTotal; S.lastProdTs = Date.now() - 5*60000; tickBreweryProduction(); go('shop'); return { haunted: brewHaunted(), brewed: S.beerCoinsTotal - b0, shopShown: !document.getElementById('screen-shop')?.classList.contains('hide') }; });
  console.log('haunt', JSON.stringify(h));
  await page.reload(); await page.waitForTimeout(1500);
  console.log('haunt after reload', await page.evaluate(() => [brewHaunted(), !!document.getElementById('hauntBadge')]));
  await shot('52_ghost_reload');

  // ── old save: wheel mid-spin + pending removed tile ──
  await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('as_state'));
    st.currentTile = { n:'WHEEL OF CHAOS', t:'chaos', icon:'🎡', venue:'', body:'x', xp:10 }; st.resolved = false; st._wheelSpin = 3; st._slotPending = null;
    st.brewHauntUntil = 0; delete st.waterCards; delete st.deckUsed;
    localStorage.setItem('as_state', JSON.stringify(st));
  });
  await page.reload(); await page.waitForTimeout(1500);
  console.log('old wheel save', await page.evaluate(() => [S.resolved, S._wheelSpin, S.waterCards, JSON.stringify(S.deckUsed)]));
  await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('as_state'));
    st.currentTile = { n:'YOU SHALL NOT PASS', t:'boss', icon:'🕴', venue:'', body:'old boss', xp:70, gamble:true }; st.resolved = false; st._slotPending = { tile:{ n:'RAW POWER', t:'shot', icon:'⚡', venue:'', body:'old', xp:35 }, dare:2 };
    localStorage.setItem('as_state', JSON.stringify(st));
  });
  await page.reload(); await page.waitForTimeout(1500);
  await shot('60_old_pending');
  console.log('old pending', await page.evaluate(() => [S._slotPending && S._slotPending.tile.n, S.currentTile && S.currentTile.n]));
  await page.evaluate(() => { acceptSlotResult(); });
  await page.evaluate(() => { closeCard(); showChallengeInline(); });
  await shot('61_old_boss_inline');
  await page.evaluate(() => { resolveTile(false); });
  await page.waitForTimeout(500);
  await shot('62_old_boss_lost');

  // ── help + bag ──
  await page.evaluate(() => { closeCard(); S.waterCards = 2; save(); go('bag'); });
  await shot('70_bag');
  console.log('ERRORS', errs);
  await b.close();
})();
