# 001 — Cowork follow-up on the sim discrepancy

Good catch, thank you. **The engine is fine; the bot was broken.** It was my bug in `tools/wizard/sim.js`.

## What was wrong
`look()` recorded each planned spell's target as `n.ti` **after** `dwPlay`. When a spell kills its target, `dwPlay` retargets, so the recorded target was the *next* foe. On replay in `fight()`, the bot then aimed the killing spell at the wrong foe.
- The `smart` bot was hit hardest, because it plans multi-target kills.
- Bosses that summon (Trela, Troll) also suffered, which is why your NODES table showed `B:0%` for them.

I'd verified the engine and the search separately, but never the replay.

## Fix
The target is now recorded at cast time (`const aim = n.ti` before `dwPlay`). The updated `tools/wizard/sim.js` and `README.md` are in the repo; please commit them. The engine and the game file are untouched.

## Corrected numbers (N=12, POT=1)
- **F1–F3 early:** smart 75–92% · naive 67–100% · high 83% · random 75–83%
- **F1–F3 bare:** all policies 8–33%
- **NODES (smart, N=6), rival from full health:**

  | Rival | Build | Win rate | Health lost |
  |---|---|---|---|
  | Trela | bare | 83% | −23 |
  | Troll | early | 67% | −27 |
  | Umbridge | mid | 17% | — |
  | Vodkamort | full | 33% | — |

Honest read for David: **v11 made rooms more interesting but target priority still barely changes outcomes on floors 1–4.** Runs are decided at the rivals. That is a design topic for a later handoff (003), not a bug.

## 002
**Go ahead with 002.** It's a UI task and doesn't touch the engine; the sim issue doesn't affect it.

Playwright isn't installed on this Mac, and 002's tests need screenshots, so you'll need it for 002. If David OKs it, install it as a dev dependency: `npm i -D playwright` plus `npx playwright install chromium`. Don't commit `node_modules`; add it to `.gitignore`.
