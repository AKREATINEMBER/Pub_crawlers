# Wizard duel tools (Happy Hex Hour)

All three read the duel engine straight out of `pubcrawlers.html` (`engine.js`), so they always test the real code. Node only, no installs.

| Command | What it tells you |
|---|---|
| `node tools/wizard/fuzz.js` | Engine invariants under 4000 random fights. Must print `{}`. |
| `N=10 POT=1 POLS=smart,naive,random node tools/wizard/sim.js` | Whole dungeon runs: avg floors cleared, full-clear %, where runs die. `smart` = lookahead bot that also picks targets; `naive`/`high`/`random` use a fixed targeting rule — the gap between them is how much target priority matters. |
| `NODES=1 N=6 node tools/wizard/sim.js` | Each room / mini-boss / rival from full health: win % and health lost. Finds the walls. |

Env: `CASES='[[start,end,"build"]]'` (floor indexes 0–9), `N` runs per case, `D` lookahead depth (3), `POT=1` run rewards + 2 starting potions, `PC_FILE` to test another copy of the game (e.g. an older version from git: `git show HEAD~1:pubcrawlers.html > /tmp/old.html; PC_FILE=/tmp/old.html node ...`).

Builds (`builds.json`): `bare` (no runes, starter deck) · `early` (runes 1, lime gem) · `mid` (runes 2) · `full` (runes 3, late spells).

Reference numbers (v11, Oct 2026): F1–F3 early: smart 100% / naive 50% / random 20%. F1–F3 bare: smart ~50%. Full Last Call (F1–F10, full): ~0% (endgame by design).
