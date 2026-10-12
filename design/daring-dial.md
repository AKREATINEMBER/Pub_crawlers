# The Daring Dial

The lever used to be pure chance. A table that was three pints deep and happily talking could pull
`THE FOOS AWAKENS` and be told to go find a foosball table. The reels had no idea what kind of night
it was. That is the problem this fixes.

Now the player sets a **notch** before pulling, and the reels can only land inside it.

## The four notches

The axis is **how far the night is allowed to drag you**. Not "how brave are you" — what you will
physically be doing in the next ten minutes.

| # | Notch | Promise | XP |
|---|---|---|---|
| 1 | `SEATED` | Nobody has to stand up | ×0.80 |
| 2 | `AT THE BAR` | A round, a toast, a contest across the table | base |
| 3 | `ON YOUR FEET` | Up, across the room, strangers | ×1.25 |
| 4 | `OUT THE DOOR` | Another venue entirely | ×1.55 |

Labels carry no emoji on purpose. The rest of the UI is emoji-heavy; a dial you *set* should read
differently from a button you press for fun.

## Rules

- **Hard filter.** No spillover, ever. `SEATED` can never be handed a boss fight. The promise is the
  whole point — a dial that "mostly" respects the vibe is worse than no dial.
- **Locked for the lap.** Set it at a lap boundary, it holds for all three pulls. Derived from
  existing state (`S.pulls % 3`), so there is no new lock field to migrate or get out of sync.
- **Curses, the Wheel and START sit outside the dial.** `badLuckHeat` is the house answering your
  failures, not something you opt into, and it ramps at every notch exactly as it always did.

## Tile assignment

61 of 70 tiles carry a `dare` of 1–4. The 9 that do not are deliberate: the 5 curses, the 3 Wheels
and START.

Membership could not come from the tile *type*. Inside `SOCIAL`, `COUNT DRUNKULA` (sit still, count
to ten) and `A QUIET PLACE` (mime your order to a bartender) are both 20–30 XP social tiles and
nothing alike in daring. So the notch is its own field, held in a `TILE_DARE` side table and applied
in the existing `TILES.forEach` beside `TILE_NEEDS` / `TILE_WIN` / `TILE_MIN_PULLS`.

| Notch | Tiles | Avg XP | Venue-gated |
|---|---|---|---|
| 1 | 28 | 21.8 | 1 |
| 2 | 15 | 25.0 | 1 |
| 3 | 10 | 28.5 | 7 |
| 4 | 8 | 42.5 | 7 |

## Why a multiplier at all

The pools already separate themselves on natural tile XP (21.8 → 42.5), but notches 1–3 are nearly
flat, so the dial would have been a vibe control with no reward ladder. The multiplier rides on a
**copy** of the tile into `applyWin`, exactly like the Knight's existing `pourMult`. The board data
is never mutated.

It sits *upstream* of `tileClassMult` and of the class wager mechanics (hammer, den, tarot,
cauldron), so notch 4 gets amplified again downstream. That is why the spread is gentle rather than
dramatic: the effective top-to-bottom gap is far wider than ×0.80→×1.55 suggests.

Budget came from the levelling pass: keep whole-night XP inflation under ~10%. The dial only touches
tile XP, which is about 43% of a night's income — the class layer and the beer log make up the rest,
and the dial cannot scale either.

## Numbers

Measured in-browser, 40k rolls per notch:

```
cross-notch leaks                 0
CHAOS share, every notch       ~17%   (was ballooning to 32% — see below)
BADLUCK share, every notch     ~6.8%

expected XP per pull (every tile won)
  SEATED        15.5
  AT THE BAR    21.3
  ON YOUR FEET  28.8
  OUT THE DOOR  50.7

night XP inflation              3.7%   [budget 10%]
```

Committing to a single notch all night, as a share of the XP to L11:

| Notch | Non-Tank | Tank |
|---|---|---|
| `SEATED` | 78% | 57% |
| `AT THE BAR` | 90% | 66% |
| `ON YOUR FEET` | 108% | 79% |
| `OUT THE DOOR` | 157% | 115% |

A `SEATED`-all-night Tank lands near L7 of 15, so roughly half the Hammerschlagen roster. Ruled
acceptable by the levelling pass: the cap is meant to be a chase, and a player choosing ×0.80 all
night is choosing the chill run. No per-class floor — a dial that means something different for one
class is worse than the problem it solves. If the Tank's exposure ever needs softening, the lever is
the foe spread, not this multiplier.

## One bug worth remembering

Masking out the types a notch cannot serve handed their weight to the types that sit *outside* the
dial. CHAOS went from its true ~14.5% to **32% of all pulls at `SEATED`** — the chill notch was
serving the Wheel a third of the time.

The fix scales the surviving in-dial weights back up so the in/out balance is whatever it would have
been before masking. Any future change that zeroes a weight in `computeSlotWeights` needs the same
care.

## Open

- **The Wheel is a hole in the hard filter.** CHAOS is ~17% of pulls at every notch, and 3 of its 12
  segments (`SPLIT THE G`, `ELM STREET BEER`, `TOKYO DRIFT`) send you out the door. So ~4% of
  `SEATED` pulls can still drag a chill table outside. Filtering Wheel segments by notch would close
  it; whether chaos is *allowed* to ignore the vibe is a design call.
- **Notches 3 and 4 are thin.** Over 40k rolls `SEATED` showed 34 distinct tiles; `ON YOUR FEET`
  showed 15 and `OUT THE DOOR` 14, and most of those are venue-gated. A lap at notch 4 repeats tiles
  and fires the free-swap button often. Wants ~6 more tiles each.

## Code map

| Thing | Anchor |
|---|---|
| Notch table, labels, multipliers | `const DARE_LEVELS` |
| Per-tile assignment | `const TILE_DARE` |
| Helpers | `dareOf`, `dareLevel`, `dareMultFor`, `dareLocked` |
| The filter | `dareTypesOpen`, `spinOutcome`, `pickTileOfType(type, avoidId, dare)` |
| XP hook | `winBaseXP` — `t.dareMult`, beside `t.pourMult` |
| State | `freshState` `dare:2`; `migrate` clamps it and `_slotPending.dare` |
| UI | `#dareDial`, `refreshDareDial`, `setDare`, wired through `syncRollUI` |

Sir Drinks-A-Lot gets the dial free: `startFill` → `resolvePint` goes through the same
`spinOutcome`, so the picker just sits above the tap instead of above the reels.

---

## v1 — what changed

- `DARE_LEVELS` + `TILE_DARE` (61 tiles); `t.dare` applied in the existing `TILES.forEach`.
- `spinOutcome` rewritten: masks types the notch cannot serve, then rescales to hold the in/out
  balance. `pickTileOfType` takes a notch.
- `winBaseXP`: `if(t.dareMult) x = Math.round(x * t.dareMult);`
- `S.dare` (default 2) in `freshState`, clamped in `migrate`; the notch is committed into
  `S._slotPending` so a reload can neither lose nor redial a pending result.
- `acceptSlotResult` / `acceptPintResult` attach `dareMult` to the tile copy; both preview cards show
  the real promised XP and name the notch.
- Dial UI above the reels, per-class tints for jester and wizard, hidden during a challenge and
  during the scripted first pull.
- Help text: `THE LOOP` updated, new `THE DARING DIAL` section, unlock-path row renamed.

Tests: 40k rolls/notch with 0 leaks, state/lock/migrate/accept assertions, `node tools/check.js`
green, click-through and three screenshots at 390×844 with no page errors.

## v2 — carved stones, and change it after any challenge (12 Oct 2026)
- **No more lap lock.** `dareLocked()` used to return true for the second and third pulls of every lap (`S.pulls % 3 !== 0`). Now the dial only holds while a tile is actually in play: pulled and unresolved, a result card waiting (`_slotPending`), a claim, the slot spinning, or a class wager still to settle (`leverPendingLabel()`). Once a challenge is finished you can pick a different stone. Payouts are unaffected: the notch is copied onto the tile when it's pulled (`_slotPending.dare`).
  - Verified in the browser: on pull 4 (mid-lap) you can switch between challenges; switching is refused while a tile is in play and while a hammer wager is pending, and allowed again once it's resolved.
  - The help text and the dial header now say "PICK A STONE · CHANGE IT AFTER ANY CHALLENGE" / "LOCKED TILL THIS CHALLENGE IS DONE".
- **The four notches are runestones** (`.dd-stone`, `DD_CARVE`), each a different rock with a carved pixel icon (inline SVG, so the labels stay emoji-free as the design asked):
  - SEATED: mossy granite, a three-legged stool
  - AT THE BAR: layered sandstone, a foaming tankard
  - ON YOUR FEET: split blue slate, a boot
  - OUT THE DOOR: black basalt with ember-lit cracks and a glowing door
  - Letters are cut into the stone. The chosen stone stands up a little, its carving and name fill with firelight, and it gets a warm halo. While a challenge runs the other stones go grey and dim.

## v3 — wooden signs instead of stones (12 Oct 2026)
David didn't like the runestones next to the cosy skin. The notches are now wooden tavern signs in the same wood-and-brass style: two brass nails each, and a darker wood per notch (birch, oak, walnut, charred bog-oak with an ember glow), with the same burned-in pictures. The chosen sign is lit honey-gold like the open bottom-bar tab. The header now reads "PICK ONE · CHANGE IT AFTER ANY CHALLENGE". The change-after-any-challenge rule from v2 is unchanged.
