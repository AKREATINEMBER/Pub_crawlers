# Pub Crawlers — notes for Claude Code

A roguelike pub-crawl party game for a squad of friends, played on their phones over one night out. Medieval pixel-tavern look. Five classes (Tank, Gambler, Jester, Brew-zard, Sir Drinks-A-Lot), each with its own minigame, progression and shop. **One self-contained HTML file, works offline, no build step, no dependencies.**

## How we work
- **Ideas and design happen in Cowork** (the claude.ai project *pub_crawlers*). David and Claude agree on a design there, and Claude writes a **handoff prompt** into `design/handoffs/NNN-short-name.md`.
- **Building happens here.** Implement the handoff, test it, update the design notes, commit, and write the `.result.md` next to the handoff. The status protocol is in `design/handoffs/README.md`. When David says "check the handoffs", pick up the lowest `STATUS: READY` one.
- If a handoff is ambiguous, or the code disagrees with it, stop and ask David. Don't guess on design: game feel is his call.
- At the end of a task, report what changed, the test/sim numbers, and anything that felt off while playing it (that feeds the next design round).

## Golden rules (do not break)
1. **One file.** The game is `pubcrawlers.html`: all CSS, JS and pixel art inline. No external requests, no libraries, no build step.
2. **`docs/index.html` must be byte-identical to `pubcrawlers.html`** (it's the hosting copy). After every change: `cp pubcrawlers.html docs/index.html`. `node tools/check.js` verifies this.
3. **Tone: hype, funny, epic. Never cautionary, safety-minded or preachy** — no "drink responsibly", no water-break nagging. Grown-ups who know their limits. Puns on pop culture are the house style.
4. **Themes:**
   - The Brew-zard's world is a **Harry Potter parody** (Vodkamort, Um-Brew-dge…), never Norse.
   - The Tank's world is **Norse/Viking** (Hammerschlagen, Valhalla).
   - No birthday content, nothing city-specific.
5. **Saves must survive updates.** State lives in the global `S`, saved to localStorage `as_state`.
   - New fields get defaults in `freshState()`.
   - Any field with a shape gets validated in `migrate(p)`.
   - Anything mid-flow (a pending reward, a run, a hand) is persisted, so a reload can't lose or reroll it.
6. **Phones first.** Test at 390×844. Tap targets ≥44px, text ≥ ~10px. No hover-only UI.
7. **Group features are frozen** (switches `GROUP_SQUAD` / `GROUP_BOUNTY` off). New work targets solo play on one phone.

## Code map (search for these anchors — line numbers drift)
The file is ~1.2 MB. Never rewrite it wholesale; make targeted edits and grep for anchors.

### Core
| Area | Anchors |
|---|---|
| Global state | `function freshState(`, `function migrate(`, `function save()`, `load()` |
| UI plumbing | `function go(` (screens), `function showCard(` (modal cards), `toast(`, `epicToast(`, `function syncHUD(` |
| Tiles | `const TILES = [`, `computeSlotWeights`, `function resolveTile(` |
| XP | `function grantXP(` |
| Unlocks | `const UNLOCKS = [`, `unlocked(id)`, `showSpotlight` |
| Dev mode | `const DEV_CODE` (code PUBDEV). `S.dev` unlocks everything. |
| Pixel art | `SPR_PAL`, `SPR` (16×16 items), `PXI` (12×12 icons), `DW_SPR` / `dwSprCanvas` (duel sprites) |
| Shop | `const RELICS = [` |

### Classes
| Class | Anchors |
|---|---|
| **Tank** | `HAMMERSCHLAGEN`, `const HM_FOES` (Gauntlet & Forge), `tankWagerResult`, Holmgang `hgTokens` |
| **Gambler** | the Den (`denSpin`, `denSegs`), `THE HIGH ROLLER'S LEDGER` |
| **Jester** | `THE DECK OF MANY FOOLS`, `JK_TAROT`, `THE STREET ACT` |
| **Sir Drinks-A-Lot** | `const POUR_ZONES` |

**Brew-zard:**
- The Cauldron: `const WZ_RECIPES`, `WZ_RUNE_GIFT`, `wizResolve`.
- Polymorph: `WILD MAGIC`.
- The duel, **Happy Hex Hour**:
  - **Engine (pure functions, no DOM):** the block starting at the comment `wizarding duel (engine` and ending with `dwFoeAct`. Main entry points: `dwNewBattle`, `dwPlay`, `dwEndTurn`. Foe data lives in `DW_FOES_CORE`, `DW_ROLES`, `DW_ELITES` and `DW_TRAITS`.
  - **UI:** `dwStart`, `dwRefresh`, `dwPaint`, `dwCardHTML`.
  - **Dungeon run:** `THE DUNGEON RUN`, with `dwRunNew`, `dwRunAfter`, `DW_PERKS` and `dwRunMapHTML`.
  - **Full design:** `design/wizard-happy-hex-hour.md`.

## Testing
- **Always:** `node tools/check.js` (scripts parse + docs copy matches).
- **Wizard duel changes:** `node tools/wizard/fuzz.js` (must print `{}`) and the run simulator `tools/wizard/sim.js` — see `tools/wizard/README.md`. Compare against the previous version with `PC_FILE=` (`git show HEAD~1:pubcrawlers.html > /tmp/old.html`).
- **Balance changes:** simulate, don't eyeball. This game has a history of "right on paper, wrong in play."
- **In the browser:** Playwright + Chromium works well:
  1. Write a state object into `localStorage.as_state`.
  2. Reload.
  3. Call game functions via `page.evaluate` (e.g. `wzSetTab('duel'); dwStart()`).
  4. Assert there are no `pageerror` events, and screenshot at 390×844 with deviceScaleFactor 2 to check the look.
  5. Close any open card first with `closeCard()`, and clear `_unlockQueue`.
- Look at the screenshots yourself before calling UI work done.

## Conventions
- Edits to game data tables: keep the existing compact one-line-per-entry style.
- When a mechanic changes, update the in-game help text too (e.g. the duel's `HOW THE DUEL WORKS` panel) and any tutorial or coach copy.
- When a design change ships, append a short **"vN — what changed"** section to the relevant file in `design/` (numbers, function names, sim results).
- **Commit once per shipped version**, with a message like `Wizard v12: …`. Don't commit `.DS_Store`.
- `_archive/` is history; don't edit it or build on it.
