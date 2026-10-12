# The Town

> What you buy is what you see.

Every upgrade to your base is now a building, and every building stands in your own world. Buy
the Drying Rack and stockfish appear on a rack in the yard. Buy the Watchfire and a beacon burns
on the headland. Buy the Dragonship and it is moored past the fleet with its sail up.

## Where they come from

Two ways, and they draw on the same catalogue:

- **Free, at every level-up** — the chest. Unchanged mechanic: roll a rarity, pull an unowned
  building from your class's set, cascade down the rarities if that pool is dry.
- **Bought, with coin** — the shop's new **THE TOWN** section, cheapest first, everything you
  have not raised yet.

Coins buy the town; beers pay the smith (see [economy.md](economy.md)).

## The catalogue

`TOWN_SETS` is keyed by class. Two classes have bespoke worlds and so have bespoke sets:

- **tank** — the Viking settlement: turf roof, drying rack, woodpile, well, smokehouse, mead
  hives, war banners, pigpen, brewhouse, stone quay, shrine, watchfire, drinking hall,
  dragonship, and the Sky-Anvil.
- **wizard** — the Spire's grounds: potion shelf, herb beds, owlery, floating lamps, greenhouse,
  singing bells, rune gate, cauldron cat, glass stills, library wing, telescope, clockwork wing,
  sky island, sleeping dragon, and the Grand Transmutation.

The Gambler, Jester and Knight keep `BREWERY_UPGRADES` — the tavern yard — because the generic
brewery scene already draws those visuals (gate, gargoyle, bell, dragon, stained glass…). They
get the shop section and the coin purchases like everyone else.

Each set is 15 entries: 4 common, 4 rare, 4 epic, 2 legendary, 1 unique, matching the rarity
weights the chest rolls on.

## Price

```
price = max(20, round(rate * 110))
```

So 28🪙 for a +0.25/min Turf Roof up to 352🪙 for the +3.2/min unique. That sits alongside relics
(30–140) while the top end is a real decision, and it is affordable because coins just shed 1870
of demand when the Forge moved to beer.

## Drawing them

A building's `visual` tag is what the scene looks for, via `breweryUpgradeVisualCount(tag)`.

| world | function | layout |
|---|---|---|
| Viking settlement | `vkTownProps` | `VK_TOWN_ORDER` slots across the land, measured from `lay.X0` |
| the Spire | `spTownProps` | `SP_TOWN_ORDER` slots across `lay.W` |
| tavern yard | inside `drawBrewery` | the pre-existing visual tags |

Both prop functions use the same trick: a fixed slot per tag, spread over the settlement's
current width. Nothing can pile up on anything else, and because the Tank's shore pushes outward
as he levels, a cramped early village loosens into a proper town on its own.

A few pieces ignore the slots because they do not stand on the land: the quay sits at the
shoreline, the dragonship floats past the fleet, the Sky-Anvil and the sky island hang in the
air, and the Grand Transmutation turns in the sky above wherever the camera is looking.

## v1 — what changed

- `TOWN_SETS` added; the level-up chest now pulls from `townSet()` instead of the one generic list.
- Shop gained a TOWN section (`townSectionHTML`, `buyTownBuilding`, `townPrice`, `townAvailable`).
- `vkTownProps` and `spTownProps` added so bought buildings appear in the Viking settlement and
  on the Spire's grounds. Before this, a Tank's upgrades rendered nothing at all — the generic
  brewery drew the visual tags, but `drawBrewery` returns early into `drawVikingSettlement` for
  him, so every chest he opened was invisible.

## v2 — the quest building

One building per set is no longer for sale: the Secret Quest's reward (`quest:true`) is filtered
out of both the shop (`townAvailable`) and the level-up chest (`pickUpgradeForRarity`). It is the
only route into a town that doesn't go through the shop. Tags: `whisperhouse` (Viking settlement),
`whisperframe` (the Spire), `backroom` (tavern yard). See `design/secret-quest.md`.

## v2 — the Tank buys, he no longer finds

For the Tank only, the level-up chest is gone. His buildings come from the shop and nowhere else;
what a level hands him is a Hammerschlagen foe (see [tank-levels.md](tank-levels.md)). The other
four classes keep the chest exactly as it was.

- `offerBreweryUpgradeWhenClear` routes the Tank past `offerBreweryUpgrade`, clearing the owed
  level-ups so the "A CHALLENGER COMES" spotlight can come through.
- `TOWN_SETS.tank` gained `tk_forge` at the front — the gate on all forging, drawn in the
  settlement by the `tkforge` slot in `VK_TOWN_ORDER` as a smithy with a breathing coal glow.
- `townPrice(u)` honours an explicit `u.price` so a building can be priced off its brew rate.
- The tutorial's brewery copy and the `brewmaster` achievement no longer talk about chests; they
  point at THE TOWN in the shop.

## v3 — a better-looking settlement, and THE FORGE you can see (12 Oct 2026)
Feedback: level-up buildings looked very plain, the end state was cluttered and joyless, and THE FORGE purchase had nothing to do with the forge drawn in the world.
- **Building art pass** (`vkHut`, `vkHall`, new helpers `vkStones`, `vkStaves`, `vkWindow`, `vkCarvedDoor`): stone footings, staved walls with seams and knots, deep roof overhangs with staggered shingle or turf rows, eave shadows, carved wall plates, rimmed shields, shuttered windows that glow at night, carved door frames with light spilling out, and banners on the great hall. Every hall in the world uses it (village, farm, market), and so do the brewhouse, drinking hall and smokehouse in the town. Roof smoke now rises from the ridge instead of the roof face.
- **The town quarter** (`vkTownQuarter`, `VK_TOWN_W`): bought buildings no longer stand on top of the halls. They get their own street, a `'town'` segment next to the village, where each owned building has a plot of its own width; the street grows as you buy. The quay, dragonship and Sky-Anvil stay where they were.
- **THE FORGE is the dwarf forge** (`vkForgeStanding`, `vkForge`, `vkForgeProgress`, `vkForgeFocus`):
  - The forge appears the moment you buy `tk_forge`, instead of at level 10. The little smithy prop is gone.
  - Your actual hammer (parts, finish and gems) hangs on a rack outside the forge.
  - The fire grows hotter and the smoke thicker as parts are forged.
  - A second dwarf joins at 3 part-levels, and a bellows dwarf at 9.
  - Ingots pile up as you forge, turning gold at masterwork.
  - The ᚠ runes on the hill light up with progress, and the ember finish or Surtr's Brand set the hill alight.
  - Buying THE FORGE, forging a part or cutting a gem flies the camera to the forge (`window._vkForgePending`, handled in `vkRevealTick`) with a shower of sparks.
  - Level 10 is now just the stone harbour. The saga beat and level name are rewritten, and the hero stands on the quay.
- **Decluttered end state:**
  - Surtr is a small, hazy giant pacing the far horizon behind the flames. He used to stride across the foreground at 0.78 scale and cover the town.
  - Once Surtr is beaten he is gone, and his sword stands dark in the sand (`vkSurtrSword`).
  - The Ragnarök sky is less red, with fewer embers and lighter smoke.
  - The harbour keeps at most two plain longships beside the big ones; it used to line up nine.
  - The Jötunn wades further out, smaller and hazier.
- **Performance (L15 with every building, cloud Chromium, median ms per settlement frame):** 1.41 → 0.96. L5 0.35 → 0.40. L10 with town 0.75 → 0.70.

## v4 — cosy light, a real day, and a proper steading (12 Oct 2026)
- **Sky bug, every class:** `drawBrewery` called `cycleBlend` with the night colour twice, so `cycleT` landed outside the parameter list and the sky stayed on night colours all day for every class. Fixed. The palette is now warmer: indigo nights over a violet horizon, peach dawns, a golden-hazed afternoon (`#4a86c0 → #f3d6a0`) and rose-amber dusks. The daytime ground is warmer too. The other classes now see real day skies as well.
- **Cosy light (Tank):**
  - Lights register themselves while the settlement draws, in device pixels: doors, windows, torches, the watchtower beacon, the forge mouth and the barrow's green breath (`vkLight`).
  - `vkLightPass` then runs after the scene:
    - By day it adds a soft-light golden wash, stronger at dawn and dusk.
    - At night it lays a blue dusk over everything, adds each light back with `'lighter'` (one cached glow sprite per colour), and sends fireflies over the grass.
- **The world beyond** (`vkBackdrop`): two parallax ridges of fjord mountains with clipped snowcaps and shaded flanks, a parallax treeline, and a low mist. Everything is tinted toward the sky's horizon colour, so the backdrop follows the time of day. It is skipped at Ragnarök.
- **Grass** (`vkGrass`): a grassy edge with tufts and the odd flower along all the land, drawn only where the camera can see.
- **The steading** (`vkFarm`): the striped field and haystack domes are gone. It now has a barley patch, a combed hay rick, a scarecrow in a horned helmet, two shaggy cattle that amble and graze, and a low wattle fence.
- **Buildings:**
  - The Heimdall crag has a sunlit face, a shadowed flank, strata, mossy ledges and pines.
  - The barrow is grassed with a lit crown and has a dressed-stone entrance.
  - Small halls (brewhouse) drop the crossed gables, which didn't fit.
- **Performance** (cloud Chromium, ms per settlement frame): L5 0.39 → 0.70, L10 with town 0.72 → 0.97, L15 with town 1.42 → 1.43. That's about +0.3 ms for the backdrop and light pass, well inside the 66 ms budget the 15 fps scene has.

## v6 — a blue, starry night (12 Oct 2026)
- **Night sky** is a clear dark blue: `#101c48` at the top fading to `#2a3a78` at the horizon. It used to be `#0b0d24` → `#2a1e3a`, which read as black on phones.
- **Night tint:** `vkLightPass` darkens only the land now, with a gradient that fades out 70 px above the ground, so the sky keeps its blue.
- **Stars** (all classes):
  - The old 40 stars were scattered over the first 520 world px, so wide worlds were starless past the left edge.
  - Now there are 110 stars in screen space with a 0.94 parallax, in three sizes and colours; the brightest get a twinkle cross.
  - A faint Milky Way haze sits behind them, and a shooting star crosses the sky every 9 s.
- **The moon** follows the camera (it used to sit at the far right end of the world) and has a soft halo.

## v7 — buying grows the village, and a cosy interface (12 Oct 2026)
- **Every purchase is a house** (`VK_TOWN_HOUSE`, `vkTownQuarter` v2).
  - Most town buildings are a cottage (the halls' build, with one lit window and a flower box) with their trade in the yard beside it: the fisher's hut and drying rack, the woodcutter and his woodpile, the beekeeper's skeps, a pig farm, a banner hall, a little hof by the shrine, a house by the well.
  - Turf Roof is a turf cottage of its own. Brewhouse, drinking hall, smokehouse, whisper-house and watchfire stand on their own.
  - With every building bought the street is now ~740 world px, about three screens of town.
  - **Townsfolk:** one more villager walks the street per building, up to 7.
- **Raising a building:** buying one in the shop sets `window._vkBuildPending`. The next time the village is on screen, `vkRevealTick` flies the camera to the plot, and the building rises out of a scaffold (`vkScaffold`, with a carpenter hammering on top) in a cloud of dust (`vkBuildDust`). This is driven by `window._vkBuild` and lasts about 6 s.
- **Remade:** the watchfire is a tripod brazier with a real fire, sparks and light.
- **Performance:** town houses and props off screen are skipped. Settlement frame, ms (cloud Chromium): L5 0.84, L10 with town 1.29, L15 with town 1.60.
- **Cosy UI skin** (`body.cozy`, one CSS layer at the end of the stylesheet, doubled class for specificity):
  - The background is warm walnut with candle vignettes.
  - Panels, cards, shop items, class widgets, reels and daring buttons are rounded wood with a brass edge and a warm inner glow.
  - Buttons are chunky and lit from above (honey gold, ember).
  - Bars and chips are rounded pills, and toasts are warm notes.
  - The bottom bar is a plank shelf whose open tab glows like a lantern.
  - Titles are in a storybook serif (Georgia/Palatino); body text stays pixel-mono.
  - Each class keeps its accent; the Brew-zard and Jester keep their own panel colours.
