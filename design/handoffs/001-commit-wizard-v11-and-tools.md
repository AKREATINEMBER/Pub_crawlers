STATUS: DONE

# 001 — Commit the Wizard v10–v11 work and set up the test tools

## Why
The Wizard's Happy Hex Hour duel was rebuilt in Cowork and copied into `pubcrawlers.html` + `docs/index.html`, but none of it is committed yet. Cowork also added project notes and test tools to the repo. Nothing in the game needs changing in this task: get it committed, and check that the tools work on this machine.

## What's already in the folder (from Cowork)
- `CLAUDE.md`: project rules, code map and testing guide. **Read it first.**
- `design/handoffs/`: this system (`README.md`) and this task.
- `design/wizard-happy-hex-hour.md`: the full design and changelog of the duel (v4 → v11).
- `tools/check.js`: checks that the scripts parse and that `docs/index.html` matches the game.
- `tools/wizard/`, which reads the duel engine straight out of the game file:
  - `engine.js`
  - `fuzz.js`
  - `sim.js`
  - `builds.json`
  - `README.md`

## Steps
1. Run `node tools/check.js`. It should report ✓ and ✓.
2. Run `node tools/wizard/fuzz.js`. It must print `{}`.
3. Run `N=6 POT=1 POLS=smart,naive,random CASES='[[0,2,"early"]]' node tools/wizard/sim.js`. Expected roughly:

   | Bot | Full clear |
   |---|---|
   | smart | ~80–100% |
   | naive | ~30–50% |
   | random | ~0–30% |

   This is noisy, so only flag big differences.
4. Run `NODES=1 N=4 node tools/wizard/sim.js` and paste the table into the result file.
5. Add `.DS_Store` to `.gitignore`. `Claude outputs/` is a stray copy folder: leave it on disk but ignore it in git too.
6. Commit everything with the message `Wizard v10–v11: dungeon floors, mini-bosses, the Last Call, tavern specials, minion roles; CLAUDE.md, handoffs, test tools`. Don't push unless David says so.
7. Optional, if Playwright and Chromium are available here: load the game and check:
   - Start a dungeon run as the Wizard: dev mode, or seed `localStorage.as_state` with `charId:'wizard', level:6`.
   - The room roster strip shows the minion roles.
   - No `pageerror`.

   Say in the result file whether you could do this.

## Done means
- One commit with everything above.
- `001-commit-wizard-v11-and-tools.result.md` written, containing:
  - the outputs of steps 1–4 (and 7 if run)
  - the commit hash
  - anything that looked wrong
- This file's first line set to `STATUS: DONE`.
