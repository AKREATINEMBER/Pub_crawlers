# PHASE A — robustness & critical bugs

Backup before editing: `backups/pre_A.html` (identical to the baseline). Edits were made with verified python replacements (`tests/A/edits/e1..e6.py`, `ed.py` asserts each match count). Tests: `tests/A/` (harness `h.js`; `node tests/A/run_all.js` runs everything, including the syntax check and `/tmp/pc_test/reg.js`; `PC_FILE=backups/pre_A.html node tests/A/<test>.js` reproduces the old bugs). `reg.js` is unchanged; read-only `window._pendingChugXP/_pendingGamblerXP/_pendingWizXP` getters keep it (and old console scripts) working.

## A1 · Sir Drinks-A-Lot (lars F3/F12/F15, mads F1–F3, jonas F3)
- **Dead tap after the Wheel of Chaos.** New `resetPint()` (empty glass, tap enabled, label cleared, rAF cancelled) is used by `acceptPintResult`, `useRerollPint` and the Chaos path of `previewPintResult`.
- **Pour multiplier never paid.** `acceptPintResult` now sets `S.currentTile = {...tile, pourMult}` (a copy, so `TILES` is never mutated). `applyWin` → `winBaseXP(t)` applies `pourMult`, the Ring and revenge in one place. The preview card and the challenge card show `previewWinXP(t)` = base × pour × class multiplier (+ next-tile ×2), i.e. exactly what's paid. **Zones/multipliers are unchanged.**
- **Fill was per-frame.** It's now time-based: `POUR_MS = 2381` (the old 0.007/frame at 60 Hz), and the same goes for the settle animation and the Wizard's knight-form pour (2083 ms).
- **touch/pointer cancel.** Added `ontouchcancel`/`onpointercancel` → `stopFill` / `wzPourStop` (treated as a release, so it can't be used to abort a bad pour). A `visibilitychange` to hidden also releases a held tap.
- Test `t01_machine.js` (15 checks: tap after a real wheel + real hold, promise == paid at 4 fills incl. class bonus and ×2, 60 vs simulated 120 Hz, touchcancel/pointercancel for both taps).

## A2 · Pending rewards persist (lars F1/F2/F8/F9/F12/F14/F16/F19, mads F5 race)
- **One persisted claim.** `S._claim = {kind:'tank'|'gambler'|'wizard', p, card}` is set via `setClaim()` the moment the result is known, saved, and shown by `showClaimCard()`. `claimReward()` dispatches to `chugClaimXP/gamblerClaimXP/wizClaimXP`, which use `takeClaim()` (idempotent). Each class panel turns its main button into "✓ COLLECT …" while a claim waits, which is the recovery path if a card is ever clobbered. The lever locks on `S._claim`.
- **Boot resume:** `resumePending()` (init and restore) re-binds `_wiz/_bj/_duel`, settles a committed den spin, finishes a blackjack hand, lands a committed brew roll or curdle, lands a poly-Gambler spin, then re-shows the single relevant card (claim → jkClaim → slot result → duel → wheel) and schedules any owed chests.
- **Poly-Jester soft-lock.** `wzPick` → `wzPolyFinishPick()`; after a reload a "🌀 REVEAL YOUR FATE" button appears. Reroll/doubleNext go into the claim and are applied in `wizClaimXP` **after** the payout, so the Moon's ×2 is no longer eaten by its own payout (a latent bug).
- **Slot result card.** The outcome is committed to `S._slotPending` *before the reels spin* (and before the pint settle animation, including pour mult/label/fill). A reload re-shows the same card. It's cleared on accept/reroll. `spinSlot`/`startFill` re-show it instead of spinning again.
- **`save()` at the end of `applyWin`** for Tank and Gambler (the Jester and Wizard already did).
- **Chests.** `pendingLevelUps` only drops in `openBreweryChest()`. `scheduleChest()` is a single timer. `chestBlocked()` waits for cards, the level flash, reels, wheel, pour/settle, den spin, a running chug/duel/poly timer, or a pending slot result. Init schedules owed chests.
- **Wizard brew.** `_wiz` is the same object as `S._wizPendingWin.brew` (saved). The roll is committed as `brew.pendingBust` before the 700 ms bubble, and `wizApplyBrewStep(instant)` lands it (instantly on boot). A curdle on screen + reload is still a curdle. The scry and its binding roll persist.
- **Gambler.** `denSpin` commits `S._denSpin {game, idx, mult, label, bet, xp}` before the animation, and `denSettle()` pays it (end of animation or boot), using the committed bet. Blackjack: `S._bj` mirrors `_bj` at every step; every timeout is bound to its hand (`if(_bj!==hand) return`). `bjResume()` finishes a deal/dealer draw after a reload. The lever is refused mid-hand ("FINISH YOUR HAND FIRST"), with no throw and no lost bet. While a den spin runs, SAFE is hidden and the spin button says "SPINNING…" (also after the 5 s `syncHUD`), and `denTakeSafe` is refused. The 21 tab is disabled and `bjStart` refuses while an XP wager is pending.
- **Chug-Off:** `S._duel` is persisted from `duelBegin` (a round whose timer was running restarts that round). It's cleared on finish/cancel.
- **Wheel of Chaos:** the spin target is committed as `S._wheelSpin`. A reload re-opens the wheel, or shows the committed result. The inline card for an open wheel shows "🎡 SPIN THE WHEEL OF CHAOS" (`resumeWheel()`), never "DONE/FAILED".
- **Tank:** the wager/idle try is now spent when the chug is *stopped*, not started, so a reload mid-chug keeps it. Results (incl. a MISS) are committed before the 800 ms beat.
- Tests `t02a_claims.js`, `t02b_chests.js`, `t02c_wizard_gambler.js`, `t02d_duel_wheel.js` (49 checks), plus `t10_soak_reload.js`: 200 pulls/class (Chaos included) with 10 reloads at random points. Never stuck, pulls exact, no errors.

## A3 · Double-tap / mis-tap guards (lars F4/F5/F12/F15)
- **STOP is ignored for 1 s after START** (`STOP_GUARD_MS`) in the chug, Chug-Off and Wizard tank form. `armStopButton()` gives instant feedback: the label becomes "🍺 CHUGGING… STOP IN 1s", then "🛑 STOP". The Tank chug button turns blood-red while running (new `#chugBtn.red` rule in the tank theme). The Tank SAFE row is hidden mid-chug.
- **Street Act:** a 450 ms `jkActTapOK()` debounce on stake/TOSS/BOW/close (the auto-bow of a PERFECT act is exempt).
- **Lever:** `slotSpinning` stays true until the result card is up, and `syncHUD` no longer re-enables the lever mid-spin. `acceptSlotResult` consumes the pending tile.
- **Debounces:** `tapGuard()` gives a 500 ms per-id debounce on `buyRelic`, `buyConsumable`, `buyWithXP`, `useItem`, `jkBuyCard`, `jkBurnCard`.
- **CSS:** `button{touch-action:manipulation}`. `#levelFlash{pointer-events:auto}` swallows taps while it covers the screen.
- **`chugTakeSafe`** requires phase `ready` and no missed try. **`denTakeSafe`** requires no spin.
- Test `t03_doubletap.js` (14 checks, real taps).

## A4 · Jester Street Act refill (jonas F7)
- Removed `S.jkActs = JK_ACTS` from `gamblerClaimXP`. The lap block (now `countPull`) adds `JK_ACTS_PER_LAP = 2`, capped at `JK_ACTS = 3`.
- Panel, toast, guide and header copy now say acts refill every lap. The payout constants are untouched.

## A5 · Chaos pulls count
- New shared `countPull(tile)` (pulls, karaoke flag, lap: laps/shop/hat/Jester tricks+respin+acts, lap XP/coins). It's used by `acceptSlotResult`, `acceptPintResult` and both Chaos paths.

## A6 · Tank relic tries on the XP wager (lars F13, jonas F15)
- In `chugResolve`, a wager miss with tries left sets `pw.missed`, re-rolls `S._chugTarget`, keeps the pending win and toasts the tries left. SAFE is hidden and refused after a miss.
- Only the wager gets retries. Idle coin chugs are unchanged.
- Iron/Horn/Legend, One More In The Tank and the guide copy are now accurate. The Horn no longer promises "bonus coins on a perfect" (`perfectBonus` was never implemented). The guide no longer says "pick one before you chug" (the best mode is automatic).
- Test `t04_jester_chaos_tank.js` (17 checks, also covers A4/A5 and the flat lap bonus).

## A7 · Storage & boot hardening (lars F11/F18)
- **Save failures:** `store.set` returns a bool and shows one hype epic-toast ("📜 THE SCRIBES CAN'T WRITE ON THIS PHONE…") on the first failure.
- **Corrupt saves:** JSON is stashed as `as_state_corrupt_<ts>` (newest 3 kept) and a recovery card offers the raw save as an `ASFULL1:` code.
- **`migrate(p)`:** type-checks every freshState key (nulls/wrong types/NaN → defaults) and cleans up an unknown `charId`, stale/invalid poly forms, malformed pending wins/claims/hands/juggles/den spins/duels/wheel spins and non-string relics.
- **`init`:** wrapped in try/catch. `buildCharGrid`, `loop` and both intervals always start, and a failed boot shows the recovery card ("⚠ THE TAVERN TRIPPED ON THE STAIRS": TRY AGAIN / START A FRESH RUN, which stashes the old save).
- **Restore:** `doRestoreBackup` rejects empty or foreign codes without touching the run. Valid codes run `migrate`. `clearTransientState()` (also used by `doReset`) bumps `_runEpoch` (in-flight slot/pint/den/wheel animations bail out) and clears `_wiz/_bj/_duel/_wzPoly`, chug/pint/spin flags and `window._pending*`. A restore resets `lastProdTs` (no brewery catch-up).
- Test `t07_storage_boot.js` (15 checks incl. a fault injected inside `load()`).

## A8 · Battery (lars F6)
- `loop(ts)` draws the arena at ~15 fps (`ARENA_FRAME_MS = 66`) and advances `boardFrame` by the real number of 60 Hz frames (`_arenaSteps`). Smoke/bat/floater motion is scaled by `_arenaSteps`, and `frame % n === k` spawns use `arenaHits()`, so spawn rates and speeds are unchanged.
- Nothing is drawn while `document.hidden` or off the game screen.
- The boot sprite interval only paints on the boot screen. The char-grid, class-portrait and Jester-portrait 90 ms painters skip while hidden.
- Measured (`t08_perf.js`, 4× CPU throttle, main-thread busy %, pre_A → now):

  | Screen | pre_A | now |
  |---|---|---|
  | tank | 28.7 | 12.7 |
  | gambler | 23.9 | 26.3 (noise, see below) |
  | jester | 32.6 | 23.6 |
  | wizard | 22.0 | 16.9 |
  | machine | 23.6 | 17.4 |
  | lvl-20 brewery | 43.9 | 19.5 |

  - **Average −33 to −45 %** across runs.
  - Arena draws 60 → 15 per second. Animation clock still 60 frames/s. A floater still lives ~1 s.
  - Hidden page: 60 → 0 draws/s. Boot sprite off the boot screen: 67–89 → 0 paints.

## A9 · Small correctness bugs
- **Titles:** `CHAR_TITLE_BASE` now holds full titles ("THE BREW-ZARD SUPREME", "THE GAMBLER — THE HOUSE EDGE", …). There was no more "THE BREW-ZARD THE BREW-ZARD SUPREME". (Note: `#hudTitle` doesn't exist in the current DOM, so the title isn't rendered anywhere yet.)
- **Den "NOTHING" on an XP wager** now reads "— PUSH · THE WHEEL SHRUGS" (`_finishApplyWin(xpMult, isSafe)`). SAFE keeps the SAFE copy.
- **Jester lever lock** includes `S.jkClaim`.
- **`grantXP(amount, why, opts)` (jonas F11):** `tileClassMult(tile)` was extracted. `{tile:false}` (lap, beer log, forfeit, both secret missions) skips the tile class multiplier and doesn't consume `doubleNext`. Tile payouts (the claims, the Knight, the Wheel) are unchanged.
- Test `t09_small.js` (12 checks).

## Verification
- `node tests/A/run_all.js`: 13/13 suites green (syntax, 11 Phase A suites = 132 checks, reg.js 15 wins × 5 classes, no stuck, no errors).
- Lars's original repro scripts (run against the new build from a scratch copy) confirm F1–F5, F9–F19. Remaining differences there are the intended guards (e.g. his scripts stop chugs after 100 ms, which is now ignored).
- Screenshots at 390×844 and 360×740: `shots/A/` (red running chug, miss with tries left, claim card after reload, COLLECT button, poly-Jester REVEAL, den spinning + 21 locked, wheel after reload, Knight preview, recovery card).
