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
