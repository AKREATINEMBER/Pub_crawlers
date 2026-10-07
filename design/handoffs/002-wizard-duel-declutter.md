STATUS: READY

# 002 — Wizard duel: declutter the screen, teach the game in the Info tab

## Why
David's playtest verdict on Happy Hex Hour: "the UI is crazy cluttered, so much going on with many texts, it's just confusing."

Today a fight screen stacks all of this, from top to bottom:
- map strip
- arena with tiny 5–6px labels
- a "YOUR TURN" status line
- the run bar
- a roster strip of full-sentence role descriptions
- a mini-boss trait banner
- a DOM daze bar **plus** its own sub-line ("100% → 85% → 70% → ×2 AT… → 💤 · 3📚 · 0🗑") **plus** a second daze strip drawn on the canvas
- cards with 2–3 lines of small print each
- END TURN
- a cocktail legend row
- the Rune Circle box
- a "HOW THE DUEL WORKS" wall of text

The idle screen is just as dense:
- the ladder
- a foe blurb and stat chips
- a warning line
- a boon box
- a Last Orders box
- the canvas
- status text
- the button
- a reward/purse box
- runes
- the howto panel

**Goal:** the screen shows only what you act on *right now*, and every rule lives one tap away (inspect sheets) or in the Info tab. Same mechanics, same numbers: **this is a UI/UX task, no balance or rule changes.**

The layout mockup is `002-mockup.png` (A = between fights, B = in a fight with a card selected, C = the Info tab). It shows layout and hierarchy, not final art: keep the game's existing pixel style, fonts and colours.

## Design principles
1. **One source of truth per fact.** Daze is shown once. Health once per character. Intent once per foe.
2. **Show, then explain on demand.** Icons and numbers are on screen. Words go in an inspect sheet (press-and-hold) or in Info.
3. **No coaching.** David removed the "trainer" (predicted incoming damage, "he hits 12" hints) on purpose. Don't bring predictions of enemy damage back.
   - It's fine to preview *your own card's* effect: where the daze lands and the damage on the target.
4. **Readable on a phone.**
   - Nothing smaller than ~10 CSS px.
   - Canvas text must render at ≥ 10 CSS px at 390px width. The canvas is 300 logical px wide, drawn at ~1.2×, so that means ≥ 8 logical px. Fewer canvas labels, bigger.
5. **Calm by default, loud when it matters.**
   - Warn colours only for: a ⏳ charging foe, a card that would pass you out, low health.

## A · Between fights (idle, no fight running)
Top to bottom:
1. Tabs (unchanged).
2. **Header row:** "🗺 THE DUNGEON" on the left. On the right, two square icon buttons:
   - 🔮 opens the Rune Circle (replaces the `.hm-gear` box).
   - **?** opens Info at the duel section (see C).
3. **Floor strip:** one compact chip per floor, showing a portrait plus "F3 ✓ / ▶ / LV 5". It replaces the current ladder (`dwLadderHTML`, `#dwLadder`). Behaviour stays the same:
   - Tapping an open floor picks the start floor.
   - Vodkamort shows 🏁.
   - During a run, the existing run map (`dwRunMapHTML`) takes this slot, as now.
4. **Arena canvas:** keep it. One label only: the rival's name.
5. **Rival summary card** (replaces `#dwFoeInfo`'s blurb, stat chips, warnings, boon box and Last Orders box): 3 lines max.
   - Line 1: `FLOOR n · NAME`
   - Line 2: what's on the floor ("2 rooms + a mini-boss, then the rival") and the rival's twist in a few words ("regrows 8 a turn · weak 🔥 · resists ❄").
   - Line 3: stars ★★☆ · "tap for the full rival file".

   **Tapping the card opens the Rival File sheet** (use `showCard`), which holds everything that was removed:
   - lore
   - HP and forms
   - liver
   - the boon
   - the Last Orders challenge and progress
   - first-win bounty and drops
   - the paid-wins-this-round line
6. **One primary button:** "🗺 START A RUN · FLOOR a → b", or "⚔ ENTER ROOM…" / "👑 FACE…" during a run.
   - "🏠 GO HOME" moves into the in-run ☰ menu.
   - In XP-wager mode the button is the stake button, with TAKE SAFE XP as a small secondary button, as now.
7. **A row of small chips:**
   - 🏆 best run
   - 🏁 Last Calls (if any)
   - 🧪 potions ready
   - 📚 deck size
   - during a run: perk icons and health/daze carried

   Delete the "HOW THE DUEL WORKS" `<details>` panel (its content moves to Info) and the idle explanatory status paragraphs. `#dwStatus` is only for results ("🏆 YOU WIN…", "🥴 UNDER THE TABLE").

## B · In a fight
1. **Header row (one line):**
   - `FLOOR 5 › ROOM 2/2` (or `★ MINI-BOSS` / `👑 SNAPPS`)
   - the run's perk icons (tap shows their list)
   - spacer
   - ☰: a small menu with Go home (end run), How to play (Info), Rival file
   - **?**

   The challenge-star progress (`★ …` in `.dw-runbar`) appears only in boss fights, as a small chip in this row.
2. **Arena canvas:**
   - **You:** health bar plus "YOU 38/46" top-left. **Remove the canvas daze strip.**
   - **Each minion/elite:** intent box on top. Under it, one line: role icon (⚔🗡💚🍸📣🛡, or the elite's trait icon + ★) and HP number, then a thin HP bar. **No names on the canvas.**
     - Statuses (☠n ❄ 💪n 🛡½) as one compact icon line under the sprite, only when present.
     - Mini-bosses keep the crown and glow.
   - **Bosses:** keep the big bar with name (+ "FORM n/4" for Vodkamort) and the intent box, with bigger text.
   - **Targeting:** keep the gold corner brackets on the target and tap-to-target. **Press-and-hold a foe (~400ms)** opens the **Foe sheet**:
     - name, role or trait, and the `DW_ROLES` / `DW_TRAITS` explanation
     - current statuses in words
     - its next move in words ("⏳ Charging: next turn hits 💥19")

     The intent box already shows that move; the sheet only explains it.
   - **Remove** the roster strip (`.dw-roster`) and the trait banner (`.dw-trait`).
     - At the start of a mini-boss fight, pop the trait once on the canvas ("🍷 SPILL!", ~1.5s) via `dwPop`.
     - The **first time** a player meets each role, pop "📣 NEW: HYPE — hold to inspect" once. Store which roles have been seen in `S.dwSeenRoles` and validate it in `migrate`.
3. **Daze meter (the only one).** A segmented bar directly above the hand:
   - "🌀 DAZE x/cap" on the left and "💥 CRIT AT a–b" on the right.
   - Cells are coloured by zone. The sweet-spot cells are always gold-tinted, and lit gold when you're in it.
   - **When a card is selected,** hatched cells preview where its proof lands ("DAZE 5 → 8"). If it would pass you out, the overflow cells and the label turn red: "💤 PASSES YOU OUT".
   - Delete the old sub-line and its 📚/🗑 counts; the counts move next to the buttons.
4. **Cards: one idea each.**
   - The proof bubble (orange circle). Cauldron potions get a teal "FREE" bubble and a teal border instead.
   - The element icon, the short name, and **one big number + unit** (DMG / SHIELD / DAZE / HEAL / TO ALL / SPELLS).
   - **At most one tag**, by priority: 💤 would pass you out › 🍸 cocktail it triggers › 💥 CRIT › WEAK ×1.5 / RESISTS ½ / 🛡 ½ GUARDED.
   - Secondary effects (freezes, draws, heals, "once a duel", "one glass a turn") move to the card's inspect sheet (**press-and-hold a card**), as do the full description and the level.
   - Keep the current card height or smaller.
   - Five cards per row; wrap to a second row for bigger hands. No horizontal scrolling.
5. **Select, then cast** (new interaction):
   - Tapping a card **selects** it: it lifts, the daze preview shows, and the damage number appears next to the target foe's HP on the canvas ("33 −9").
   - Tapping the **same card again**, or the **CAST button**, plays it. Tapping another card switches the selection. Tapping a foe while a card is selected retargets it, and the preview updates.
   - Cards that don't need a target (shields, water, AoE) still go through select → cast. That's consistent and avoids mis-taps.
   - Respect `dwCanPlay`. Unplayable cards are dimmed and can't be selected, but can still be inspected.
6. **Action row:**
   - small "📚 n / 🗑 n" counts
   - **CAST** ("⚡ CAST ON SPECTRE", or "CAST" for untargeted; only while a card is selected)
   - **🍺 END TURN** (takes the full width when nothing is selected)
   - While sleeping it off: a single "💤 SLEEP IT OFF" button.
7. **Remove from the fight screen:**
   - the cocktail legend row (`.dw-cocktails`); cocktails show only as the card tag and the existing combo pops
   - the `.hm-gear` Rune Circle box
   - the howto panel
   - the "YOUR TURN" status

## C · Info tab: teach Happy Hex Hour
The Info tab's wizard sections (the `wizard:` entry in the guide `sections` object, near `🧪 YOUR MECHANIC — THE CAULDRON`) have nothing on the duel. Add a **⚡ HAPPY HEX HOUR** block after the Cauldron panel, with id `infoDuel` so the **?** buttons can `go('info')` and scroll to it. Six short panels, in plain hype tone. Show icons the way the game draws them, and keep each panel to ~3 lines:
1. **The goal:** fight down the dungeon. Each floor is rooms of minions, a ★ mini-boss (from floor 4), then its rival. Health and daze carry over, and losing ends the run (you keep your loot). Checkpoints. Vodkamort only appears in a run that started on floor 1 and beat all nine rivals.
2. **Your turn:** every spell is a potion, and its orange number is its proof (it adds that much daze). The dazier you are, the weaker spells land (100% → 85% → 70%), until the gold sweet spot, where every potion crits ×2. One over and you pass out: the spell spills and you sleep through a turn. You sober up a little each turn, and 💧 water helps. Tap a card to see where your daze lands, then tap again to cast.
3. **Reading foes:** an icon legend of intents and roles:
   - **Intents:** ⚔ attack, 💥 big hit, ⏳ charging, 🛡 ward, 💪 strength, 🍸 spikes your daze, 💚 mends, 📣 rallies, 📣 HELP summons, 📜 decree (cancels your next hit), 💘 charm, 🎭 might be lying.
   - **Roles:** ⚔ brute, 🗡 pest, 💚 medic, 🍸 spiker, 📣 hype, 🛡 guard.
   - **Mini-boss traits:** 🍷 😤 🛡 🩸 🌵 📣.
   - "Press and hold any foe or card to inspect it."
4. **Cocktails:** ❄→⚡ shatter ×2 · ☠→🔥 flambé · 🛡→hit +3 · ✨→ −1 proof.
5. **The run:** a reward after every room (two after a mini-boss); the tavern after a rival (full heal + one of tonight's specials for the rest of the run); go home any time.
6. **Getting stronger:** carve runes in the Bag (bigger hand, health and liver, damage, shields), brew potions in the Cauldron (they ride along as free cards), and buy spells and gems.

Also update the Cauldron panel's first sentence so it mentions potions feed the duel (it already does). Keep the rest.

## Where in the code
| What | Anchors |
|---|---|
| Idle + fight controls | `dwRefresh()` (builds `#dwCtl`, `#dwLadder`, `#dwFoeInfo`, `#dwGear`, `#dwStatus`) |
| Cards | `dwCardHTML(B, id, i)` |
| Playing | `dwPlayCard(i)` (becomes "cast selected"; add selection state on `_dw`, e.g. `_dw.sel`, cleared on end turn / new hand) |
| Canvas | `dwPaint()` (foe loop: `if(mi){ // a small health bar + its intent…`; the boss bar via `dwBar`; daze strip `if(B){ // the daze strip under your health…` → delete) |
| Taps on canvas | `dwCanvasTap` (add press-and-hold → foe sheet; keep tap → target) |
| Pane markup | `id="dwPane"` (delete the `.dw-howto` details and the `.hm-gear` row) |
| CSS | `.dw-*` rules near `.dw-map`, `.dw-picks`, `.dw-coach`, `.dw-roster`, `.dw-trait` (remove what's unused) |
| Info | the guide `sections` object, key `wizard:` |
| Mini-boss trait pop / role-first-seen pop | `dwStart()` |

Keep `dwCoach` only for the 💤 sleeping state (or fold that into the button).

## Don't change
- Anything in the engine block (`wizarding duel (engine` … `dwFoeAct`). `node tools/wizard/fuzz.js` must still print `{}`, and `sim.js` numbers should be unchanged.
- The run flow, rewards, perks, saves, and the XP-wager mode's behaviour.
- The Cauldron tab.

## Test
1. `node tools/check.js` and `node tools/wizard/fuzz.js`.
2. Playwright at **390×844 and 360×740**, deviceScaleFactor 2. Seed `as_state` with `charId:'wizard'`, `level:6`, `wzRuneLv:[1,1,1,1,0]`, `wzRuneV2:true`, then call `closeCard()`, clear `_unlockQueue`, run `wzSetTab('duel')`. Save screenshots to `design/handoffs/002-shots/`:
   - **idle:** start of a run, mid-run between rooms, XP-wager mode, and the rival file sheet
   - **room fight:** a floor 5 room (has a guard) with no selection; with a damage card selected (daze preview + "−n" on target); with a card that would pass you out selected
   - **inspect sheets:** the foe sheet (press-and-hold) and the card sheet
   - **mini-boss fight:** floor 4, including the trait pop
   - **boss fights:** Snapps, and Vodkamort form 2
   - **asleep:** the 💤 sleeping state
   - **cards between fights:** the reward pick card and the tavern card (shouldn't change)
   - **Info:** the Info tab, duel section, reached via **?**
3. Play at least one full room and one boss through clicks only: select → cast, retarget, end turn. Check for no `pageerror`. Confirm a reload mid-run still resumes.
4. **Clutter check:** count the visible text characters in `#dwPane` (innerText length) during a floor 5 room fight, before and after. Target: **at most half** of before. Report both numbers.
5. Look at every screenshot yourself. Text must be readable, nothing overlaps, and the target and selection are obvious.

## Done means
- One commit: `Wizard v12: decluttered duel UI, select-then-cast, inspect sheets, Happy Hex Hour guide in Info`.
- `docs/index.html` copied.
- A `v12` section appended to `design/wizard-happy-hex-hour.md`.
- `002-wizard-duel-declutter.result.md` written, with:
  - what changed
  - the before/after text counts
  - the screenshot list
  - anything you had to decide yourself, and anything that still feels busy
- This file's status set to `STATUS: DONE`.
