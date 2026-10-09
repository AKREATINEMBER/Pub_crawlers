# The Secret Quest

> One private five-stage line per run. Where you get busted is what you keep.

## Why

The old system was two flat missions: one secret mission (90 XP), then a high-risk one
(180 XP) that unlocked if you cleared the first. Two taps, two outcomes, done by bar three.
It never built. The quest line turns the same fiction into a ladder you climb all night,
where the interesting question stops being *"can I do this one?"* and becomes *"do I push
for stage 4 or sit on what I've banked?"*

## The shape

Five stages, each drawn from its own pool of five, each pool harder than the last:

| stage | the ask | XP |
|---|---|---|
| 1 · THE SEED | one person, one small thing | 20 |
| 2 · THE SPREAD | two people, unprompted, as if it were always real | 35 |
| 3 · THE TABLE | the whole squad, or a stranger doing your work | 55 |
| 4 · THE MISDIRECTION | the credit has to land on somebody else | 80 |
| 5 · THE PERFECT NIGHT | everyone, more than once, your name never comes up | 110 |

Rules that make it a quest rather than five missions:

- **You only ever see the stage you're on.** Stage *n+1* does not exist until you clear *n*.
- **XP banks as you go.** Clear a stage, keep that XP whatever happens afterwards.
- **One bust kills the line, permanently.** Tap "THEY FIGURED IT OUT" and there is no stage
  after that one, for the rest of the night. No retries, no second envelope.
- **All five pays a completion prize**: +50 XP, +120🪙, and a building for your town that
  coin cannot buy at any price.

## The numbers, and where they came from

All four live as named constants at the top of the quest block, so retuning is a one-line edit:
`QUEST_XP`, `QUEST_BONUS_XP`, `QUEST_BONUS_COINS`, `QUEST_RATE`.

- **350 XP maximum** (300 banked + 50 completion). A typical 3h night earns ~1320 XP, so the
  full line is ~26% of a night — close to the 25% the old 90+180 pair was tuned around.
- **Back-weighted on purpose.** A single flat 400 lump mid-ladder pops two level-ups at once
  (xpNeeded is 221 at L8, 249 at L9 on the Tank's curve), which queues two level-up events
  back to back. 20/35/55/80/110 keeps it to roughly one.
- **120🪙 in the completion prize** because coin is the scarce currency late and beer is not.
  The economy model has a well-played long night ending with 1000–1500 beers sitting *idle* —
  a building that lands at pull 14 of 18 brews maybe 93 more, which doesn't even cross the next
  forge step. The coin is the part that gets felt. The building is the trophy.
- **2.40 beer/min** for the building: above legendary (1.80–2.00), under unique (3.20).
  Swept at 1.80 / 2.40 / 3.20 against the closed loop and forge completion did not move on any
  row, so the rate is a flavour choice, not a balance lever.

## The reward building

One per town set, and the only route into the town that isn't the shop:

| set | building | visual tag |
|---|---|---|
| tank | THE WHISPER-HOUSE | `whisperhouse` |
| wizard | THE WHISPERING PORTRAIT | `whisperframe` |
| generic yard | THE BACK ROOM | `backroom` |

It carries `quest:true`, which keeps it out of **both** acquisition paths: `townAvailable()`
filters it from the shop, and `pickUpgradeForRarity`'s pool filter keeps it out of the level-up
chest. There is a sixth `RARITIES` row, `quest`, which is **render-only** — `chance:0` and last
in the array, so `rollRarity` (whose accumulator already reaches 1.00 at `unique`) can never
return it, and `pickUpgradeForRarity` only cascades downward from the rolled index. It exists
for the badge colour. Giving it a nonzero chance would also make it outrank `unique` in the
`order.indexOf` "best of the batch" sort.

## State

```js
S.quest = { picks:[5 pool indices], cleared:0..5, banked:<XP so far>, blown:false, rewarded:false }
```

Everything mid-flow is in there, so a reload can't reroll a stage, lose a cleared one, or hand
out the completion prize twice (`rewarded`). `migrate` rebuilds a malformed line rather than
leaving it half-valid, and clamps `cleared` / `banked` / `picks`.

Saves from before this shipped keep their `secretDone` / `secret2Done` / `*Blown` flags and get
a fresh line; `questAnyDone()`, `questAllDone()` and `questEverBlown()` read both shapes so old
achievements and legend scores don't reset. `legendScore` pays per stage cleared (50) plus 100
for all five, so busting late still scores.

With a squad roster, `questNew(seed, seat)` deals every seat a different line *and* a different
draw per stage, from the squad seed — no two phones share a stage.

## Anchors

| what | where |
|---|---|
| pools, numbers | `QUEST_POOLS`, `QUEST_XP`, `QUEST_STAGE_NAMES` |
| engine | `questNew`, `questClear`, `questBust`, `questFinish` |
| reads | `qst`, `qCleared`, `qLive`, `qComplete`, `qCurrent`, `qBanked` |
| UI | `openQuest`, `questProgressHTML` (the five pips), `questConfession` |
| building | `questBuilding()`, `townAvailable`, `vkTownProps` / `spTownProps` / `drawBrewery` |

## v1 — what changed

- `MISSIONS` and `TIER2_MISSIONS` replaced by `QUEST_POOLS` (5 × 5 = 25 missions, the strongest
  of the old copy redistributed to the stage that fits its difficulty).
- Removed: `openSecret`, `completeSecret`, `failSecret`, `offerRiskyMission`,
  `acceptRiskyMission`, `declineRiskyMission`, `openSecret2`, `completeSecret2`, `failSecret2`,
  and the whole tier-2 accept/decline flow. There is no "do you accept the risk?" choice any
  more — the risk is the ladder.
- `S.secret*` / `S.secret2*` dropped from `freshState` in favour of `S.quest` (old saves keep
  their flags; nothing writes them).
- Closing time's confession reveals every stage the player actually reached, in order. Stages
  they never got to stay sealed, which is the better reveal.
- New achievement `secret5` (THE USUAL SUSPECT) and a THE PUPPETEER night award at 3 stages.
- The level-up chest and the shop both learned to ignore `quest:true` buildings.
