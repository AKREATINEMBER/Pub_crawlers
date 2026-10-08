# On Tap — the Brew-zard's bar

> Experimental. Lives in `pubcrawlers-brewzard.html`, not in the shipped game.

## The problem

The Brew-zard's Cauldron was a good push-your-luck ladder that had nothing to do with being in a
pub. You could have played it on a bus. The recipe you picked at bar one was the same recipe at
bar six, the odds never moved, and walking into a new pub — the single most eventful thing that
happens on a crawl — meant nothing to him at all.

## The idea

**The first thing anyone does in a new pub is read the taps.** So does the Brew-zard.

Every bar pours **three guest ales**, drawn from a pool of 26 on the bar's own seed — the same
trick the house rules use, so every phone in the squad reads the same board and you can argue
about it properly. You **pull one pint**, and whatever is in your glass bends the Cauldron until
the squad moves on. Then it is gone, because it always is.

That is the replay engine: the recipe is your plan, the tap list is the hand you were dealt
walking through the door.

## Standing a round

One pint a bar. Get the round in — **60🪙 + 40 per bar**, so rounds get dearer as the night wears
on, exactly as they do in life — and the bar pulls you a **second pint**. Both effects stack.

That is where the real brewing happens:

- a **Session Ale of the Rings** for the extra rung, plus a **Hopslayer IPA** for the climb
- a **Nitro Stout** to start safely, plus **Rocket Fuel** to finish greedily
- **Sour Susan** and **The Shandy Redemption** together, to push far past sane and still keep 60%
  of the wreck

Standing a round also pays 25 XP, because standing a round is good for the soul.

## The taps

26 in the pool. Effects are additive across both hands, except `salvage`, `firstSafe`, `scry` and
`stardust`, which take the better of the two.

| key | does |
|---|---|
| `rung` | +1 rung on the ladder |
| `mult` | ± to every rung's multiplier |
| `bust` | ± to every rung's curdle risk |
| `firstSafe` | the first ingredient cannot curdle |
| `salvage` | a curdle keeps this fraction instead of 20% |
| `gift` / `draw` / `heal` / `sober` | poured into the bottled potion |
| `scry` | scry without owning the Crystal Ball |
| `coins` / `xp` / `surge` / `stardust` | land the moment the glass does |

### The Last Drop

`CAULDRON_STAGES` gained a sixth rung — **×8.0 at 62%** — that **no recipe can reach**. Only a tap
that pours an extra rung opens it. Past the end of a recipe the brewer simply reaches for another
of the last thing he used, so the ladder always has a glyph to show.

A six-rung Dragon's Dram bottled under a Session Ale and a Guest Cask comes out as
`DRAGON'S DRAM ✦✦✦✦✦✦ — 28 🔥 dmg · draw 1 · −6 daze`, and it only exists because of what that
particular bar had on that particular night.

## Code map

| thing | anchor |
|---|---|
| the pool | `WZ_TAP_POOL` |
| tonight's three | `wzTapsForBar(bar)` — seeded like `barPick` |
| what's in your hands | `wzTapsHeld()`, `wzTapFx(key)`, `wzTapSlots()` |
| pulling / the round | `wzPullPint(id)`, `wzStandRound()`, `wzRoundPrice()` |
| the board | `wzTapBoardHTML()`, CSS `.wz-taps` / `.wz-tap` / `.wt-round` |
| the hooks | `wizRisk`, `wzStageMult`, `wzBrewLen`, `wzSeqAt`, `wizFinishCurdle`, `wzPotionFx`, `wizScry` |

State: `S.wzTaps` (ids held), `S.wzTapBar`, `S.wzRoundBar`. All cleared in `newBar()`. The array
and the scalars are covered by the generic `migrate` validation.

## Verified

- Tap lists are stable for a given bar and differ between bars.
- Rocket Fuel 1.4→1.8× and 5%→12% risk; Session Ale 3→4 rungs; Nitro Stout first rung 0% and the
  second unchanged; Guest Cask potion 8→12 dmg.
- Second pull refused until the round is in; the round charges correctly and opens the slot.
- Stacked pints add (1.4+0.25+0.4 = 2.05×) while `salvage` takes the max (0.6, not 1.1).
- Walking to the next bar clears both pints and the round, and the next round costs more.
- Full brew to the sixth rung → ×7.9 → 158 XP claimed → potion bottled with the tap bonus baked in.
- The board renders only for the Brew-zard; the other four classes are untouched; no page errors.

## Still open

- The duel (Happy Hex Hour) does not yet know about taps. A tap that changed the *duel* rather than
  the Cauldron would be the obvious next pour.
- No tap is *bad* on purpose. A genuinely cursed guest ale with a big upside would sharpen the
  choice.
- Rounds currently only buy a second tap. They could also mean something socially — a toast the
  table has to answer.
