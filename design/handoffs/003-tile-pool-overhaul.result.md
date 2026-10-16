# 003 — result (built Oct 16 2026, from a Cowork session at David's request)

## Built
- Tile pool rewritten: 63 tiles (was 70). All removals, rewrites, new tiles and `e.g.` example lines from the handoff. Examples render under the body on the result card and the inline card (`tileExHTML`).
- Question games are rounds (Red Pill, Usual Suspects, Never Have I Ever, Liar Liar, Pintionaire, Stars in Your Beers).
- **Daring Dial is now TWO notches (David, Oct 16):** AT THE TABLE (base XP; old SEATED + AT THE BAR) and ON THE MOVE (×1.35; old ON YOUR FEET + OUT THE DOOR). Old saves fold 1–2 → 1 and 3–4 → 2 via a `dareV2` flag set in `load()`/`migrate()`. Signs reuse the tankard and door looks (`look` field).
- **Rolling changed:** inside the chosen notch every open tile now has an even chance (× class bias for its type); water, curses and karaoke keep their type weights. Picking a type first let a one-tile type hog a notch (SNAPPOSSIBLE was 17% of ON THE MOVE).
- Wheel of Chaos removed (data, spin UI, resume paths). SAY MY NAME, METHOD ACCENT, DOUBLE TROUBLE XP are tiles. Old saves: a half-spun Wheel is marked resolved, a pending one dropped.
- Bosses removed: no BOSS weight, no boss branch, no revenge marks/penalty, BOSS SLAYER award and boss titles gone, `door` achievement gone. SPLIT THE G (35 XP) and FOOS are normal tiles. Legend score counts SPLIT THE G instead of bosses.
- Water Card: `T.WATER` (weight 4, outside the dial). Taking one adds to `S.waterCards` (max 2; at max pays 15 XP). 💧 USE IT on every result card (lever and Knight's tap) rerolls and counts `waterUsed`. Bag shows the count. Achievement AN AGENT OF CHAOS → THE SHAPE OF WATER (play 3), same id.
- GHOSTBREWSTERS: 15 min haunt (`S.brewHauntUntil`), production paused, shop blocked, badge with countdown, survives reload.
- DOUBLE TROUBLE: arms on win (`doubleArm`), becomes `doubleNext` when the next tile is accepted, so it never doubles itself.
- Deck games (NO CAP SHERLOCK 50 · HIGHER OR LAGER 28 · LIMIT 30): 3 rounds, REVEAL/NEXT, `S.toolRun` persisted, `S.deckUsed` no repeats per night.
- RIDE THE BUS dealer; BLACKJACK SPARROW and 50 SHADES OF RED as in-app mini games, Gambler only (`gamblerOnly` + `tileForClass`).
- GAME OF PONGS: "NO TABLE? PLAY QUARTERS (10 XP)" button. SNAPPOSSIBLE bakes one of 10 famous pictures into the tile when rolled (`bakeTile`).
- No-strangers text (quest stage 3 → THE GHOSTWRITER, 2 forfeits, 2 house rules, dial copy, help copy). Jester: Wheel lines, lap re-spin and RE-SPINS pill removed.

## Tests
- `node tools/check.js` ✓ (docs copy matches).
- `node tools/tile-overhaul-test.js` (Playwright, 390×844): 10k rolls × 5 classes × 2 notches → 0 removed/Wheel/boss/mercy tiles, 0 Gambler-only leaks, 0 unbaked pictures. Water take → USE IT → reroll ✓. Each deck game 3 rounds ✓. Bus, blackjack, roulette ✓. Haunt: 0 brewed in 5 min, shop blocked, survives reload ✓. Old save with a mid-spin Wheel and a pending RAW POWER / unresolved YOU SHALL NOT PASS loads and finishes ✓. No pageerrors.
- Roll shares (Tank, level 6): AT THE TABLE social 37% · beer 22% · phys 9% · shot 4% · water 4% · curses 10%. ON THE MOVE move 27% · phys 21% · social 10% · gamble 7% · water 4% · curses 10%. (Karaoke shows ~15–20% in the sim only because the test run is level 6 and it never fired; it's once a night.)

## Felt off / open
- ON THE MOVE: ~10 tiles, ~27% of its rolls say "leave the bar", 4 need kit (darts, pool, foos, pongs). David (Oct 16): equipment-based is fine for this notch, keep as is. The free swap / Quarters cover bars without the kit.
- Wizard (+40% shots) now sees fewer shots: only 2 SHOT tiles left.
- Jester still has Wheel/boss flavour in a relic (Why-So-Sober Cap), a rank perk (THE COURT) and the Emperor tarot ("×3 on boss fights"). Parked with the class.
- Not committed: the repo already had uncommitted (staged) Tank changes from another session, so nothing was committed. Suggested message: `Tiles v1: works-anywhere pool, two-notch dial, question rounds, water card, deck games`.
