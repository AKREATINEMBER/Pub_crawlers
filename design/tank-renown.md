# The Tank-ard's Renown

He wears what he has done. The hero drawn into the Viking settlement — and his portrait in the
Longhouse panel — change kit as the player earns levels and achievements, from a farmhand with a
pitchfork to Thor's equal standing in the Ragnarök fight.

## Renown

```
RENOWN = level + 2 per achievement earned this run
```

`S.ach` resets every run, so renown is a measure of *this night*, not a career stat.

A Tank-ard can reach level 20 and earn 18 achievements (12 universal + 6 Tank-specific), so
**renown maxes at 56**.

Achievements are worth two levels each on purpose: the ladder is meant to read as a trophy case,
not a second XP bar. But level still carries the floor, which is what stops a level-20 player
turning up to Ragnarök dressed as a farmhand.

## The seven tiers

| tier | renown | kit |
|---|---|---|
| THE FARMHAND | 0 | straw hat, drab tunic, no mantle, no metal |
| THE RAIDER | 6 | studded leather cap, first pelt |
| THE HUSCARL | 13 | riveted iron skullcap, mail-blue tunic |
| THE JARL | 20 | the horned war helm, fur mantle, blood-wine tunic |
| THE BREW-KING | 28 | + the gold crown band |
| THE GOD-TOUCHED | 38 | storm-blue kit, runes burning along the horns |
| THOR'S EQUAL | 48 | white-hot horn tips throwing sparks |

Where that lands in practice:

| level | achievements | renown | tier |
|---|---|---|---|
| 1 | 0 | 1 | FARMHAND |
| 8 | 3 | 14 | HUSCARL |
| 12 | 4 | 20 | JARL |
| 20 | 0 | 20 | JARL |
| 20 | 4 | 28 | BREW-KING |
| 20 | 9 | 38 | GOD-TOUCHED |
| 20 | 14 | 48 | THOR'S EQUAL |

Level 20 alone is a JARL — respectable, never a farmhand at the end of the world. THOR'S EQUAL
needs a maxed level *and* 14 of the 18 trophies, so it stays a real prize, and it lands exactly
where the hero fights beside Thor.

## Where it shows

- **The settlement hero** (`vkHeroScene` → `vkHeroSprite` → `tankStageChar`) — the figure living
  in the Viking world.
- **The Longhouse portrait** (the `cw-portrait` canvas) — so a tier-up is visible without
  leaving the panel.
- **The renown line** under the Rage bar: `⚔ THE JARL · 8 renown to THE BREW-KING`.
- **The end-of-night title** (`computeEpicTitle`).
- **A tier-up announcement** — `tkCheckTierUp()`, fired from `checkAchievements()`. `S.tkTierSeen`
  keeps it to once per tier no matter how many paths call it, and across a reload.

## Code map

| thing | anchor |
|---|---|
| the ladder | `const TK_TIERS` |
| the score | `tankRenown()`, `tkTierIdx()`, `tkTier()`, `tkNextTier()` |
| the tiered char object | `tankStageChar()` |
| the announcement | `tkCheckTierUp()` |
| the sprite | `drawChar`, the `ch.tier` palette and the `accType==='tkTier'` headgear branch |

`drawChar` only behaves differently when `ch.tier` is set, and only `tankStageChar()` sets it.
The character select, the duel sprite and the shop keep the canonical Tank-ard look — verified by
a pixel diff of all five characters against the previous version.

## v1 — what changed

- Added the renown ladder above. Before this, `tkStage(L)`/`tankStageChar(L)` existed but only
  attached a `stage` string that `drawChar` never read, so the hero looked identical at every
  level. That dead plumbing is replaced.
- Seven headgear variants drawn into `drawChar`: straw, leather, iron, horned, crowned, runed,
  storm. The horned/crowned/runed/storm tiers share the existing war-helm art; the crown band is
  now gated so THE JARL has horns without the crown.
- New save field `tkTierSeen` (simple scalar, covered by the generic `migrate` validation).
