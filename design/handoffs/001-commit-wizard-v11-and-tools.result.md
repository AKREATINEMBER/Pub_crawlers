# 001 — Result

## Commit
`65ddef88109403a3dd232a44bef58a7d9d3b177b` — "Wizard v10–v11: dungeon floors, mini-bosses, the Last Call, tavern specials, minion roles; CLAUDE.md, handoffs, test tools"

Not pushed, per the task.

Note: `pubcrawlers.html` / `docs/index.html` themselves were already committed in an earlier session before this task started (the dungeon-run content — `dw*` functions, floors, mini-bosses — was already in git). This commit covers what was actually still missing: `CLAUDE.md`, `design/`, `tools/`, and `.gitignore`.

## Step 1 — `node tools/check.js`
```
✓ 1 script block(s) parse · ✓ docs/index.html matches pubcrawlers.html
```
Pass.

## Step 2 — `node tools/wizard/fuzz.js`
```
{}
```
Pass.

## Step 3 — `N=6 POT=1 POLS=smart,naive,random CASES='[[0,2,"early"]]' node tools/wizard/sim.js`
```
F1-F3    early  smart   avg floors 2.0 full clear  17%  died at {"troll":4,"trela":1}
F1-F3    early  naive   avg floors 1.7 full clear  17%  died at {"troll":2,"trela":3}
F1-F3    early  random  avg floors 2.7 full clear  67%  died at {"troll":2}
```

**⚠️ This does not match expectations and I don't think it's noise.** The handoff's own expected range is smart ~80–100%, naive ~30–50%, random ~0–30%. The `tools/wizard/README.md` reference table (v11, Oct 2026) says the same: "F1–F3 early: smart 100% / naive 50% / random 20%."

What I got instead, across 4 separate runs (the one above plus 3 more to rule out noise):

| run | smart | naive | random |
|---|---|---|---|
| 1 (above) | 17% | 17% | 67% |
| 2 | 50% | 33% | 50% |
| 3 | 33% | 17% | 50% |
| 4 | 17% | 50% | 50% |

`smart` never clearly beats `random`, and in 3 of 4 runs `random` does best. If `smart`'s lookahead/targeting logic is supposed to dominate, something regressed — either in the engine itself, in how `smart` picks actions, or in how `tools/wizard/engine.js` extracts the engine from the current `pubcrawlers.html`. I haven't investigated further since debugging the sim/engine is outside what this task asked for (commit + verify the tools run) — flagging it here rather than guessing at a fix.

## Step 4 — `NODES=1 N=4 node tools/wizard/sim.js`
```
filch      bare   hp 30 r1:100%/-2  r2:100%/-3  B:100%/-4
trela      bare   hp 30 r1:100%/-10  r2:100%/-9  B:0%/--
troll      early  hp 38 r1:100%/-3  r2:100%/-2  B:0%/--
snapps     mid    hp 46 r1:100%/-11  r2:100%/-19  E:100%/-7  B:100%/-19
bella      mid    hp 46 r1:100%/-18  r2:100%/-41  E:100%/-20  B:75%/-20
umbridge   mid    hp 46 r1:100%/-13  r2:100%/-19  r3:100%/-32  E:100%/-29  B:50%/-43
dementors  full   hp 56 r1:100%/-5  r2:100%/-12  r3:100%/-15  E:100%/-1  B:100%/-17
lockheart  full   hp 56 r1:100%/-0  r2:100%/-15  r3:75%/-23  E:50%/-26  B:75%/-0
veela      full   hp 56 r1:100%/-9  r2:100%/-27  r3:100%/-2  E:75%/-0  B:100%/-0
vodkamort  full   hp 56 r1:100%/-24  r2:75%/-10  E:50%/-10  B:25%/-2
```

Note `trela` and `troll` show `B:0%/--` — zero boss-room wins at the `bare`/`early` builds respectively. Possibly connected to the same issue as step 3 (the deck/build can't handle the boss at that point), possibly intentional difficulty gating — not clear from this task's scope.

## Step 5 — `.gitignore`
Added, ignoring `.DS_Store` and `Claude outputs/`. The latter is left on disk, untouched, as asked.

## Step 7 — Playwright check
**Skipped — not available in this environment.** No `playwright` package installed, no project `package.json`/`node_modules` set up for it, and no Chromium binary found (checked `which chromium`/`chromium-browser`/`google-chrome`, and Playwright's own browser cache at `~/Library/Caches/ms-playwright` doesn't exist). Installing it would mean downloading a browser binary over the network, which felt out of scope for a commit-and-verify task — didn't do it without checking first.

## Anything that looked wrong
The step 3 and step 4 results above. Summary: the `smart` bot does not outperform `random` in F1–F3 `early` runs across 4 repeated samples, contradicting both the handoff's expected range and the README's reference table. This smells like a real regression in the engine or the bot logic (or possibly in how the sim tools read the engine out of the current file), not sampling noise — recommend a follow-up handoff to investigate before trusting balance numbers from these tools.
