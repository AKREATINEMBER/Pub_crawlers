# The Tank's fifteen

> A level is a boss. Buildings are bought.

The Tank used to climb to 20 alongside everyone else, opening a chest at every level and finding a
building in it. Both halves of that were wrong for him:

- **The chest gave him buildings he hadn't chosen**, in a random order, in a world where his
  Hammerschlagen ladder was the thing he actually cared about.
- **His ladder ran out at level 10.** Ten foes, twenty levels. The back half of his climb unlocked
  nothing he wanted.

So the two were swapped. His ladder is now his level track — **fifteen levels, fifteen foes, one
per level** — and buildings moved into the shop where you pick them.

## The cap and the curve

```
TK_LEVEL_CAP = 15
xpNeeded(lv) = 25 + 28*(lv-1)     // Tank only
             = 20 + 20*(lv-1)     // everyone else, unchanged
```

`levelCap()` and `atLevelCap()` are the accessors; `grantXP`'s loop is now
`while(S.level < levelCap() && ...)`. XP past the cap still banks in `S.xp` — the shop's haggle
path and the end-of-night tally both read it — and the HUD reads `LV 15 ★` /
`MAX LEVEL · n XP BANKED`.

14 steps to the cap is **2898 XP**, against 3800 for the other four classes' 19 steps. That is a
real stretch over the old level-15 cost of 2100, but deliberately *not* the full 3800: at 3800 the
cap would be marathon-only, which contradicts the brief that a long night played well should finish
everything. Modelled against the curve's implied income (560 / 1320 / 2400 / 3800 XP at 2/3/4/5h):

```
  short 2h        L6     typical 3h      L10
  long 4h         L13    long 4h, well   L15      marathon       L15
```

## The fifteen

Levels 1–9 are unchanged. Jörmungandr no longer hands straight over to Surtr; five villains sit
between them, and **Surtr moves from 10 to 15** as the capstone.

| lv | foe | pin | drops | trait |
|---|---|---|---|---|
| 10 | **LOKI** — the oath-breaker | iron-hard | star-steel | `wobble` — the swing lies to you |
| 11 | **GARM** — the hound of Hel | iron-hard | wolf-fang | `double` — lunges twice a turn |
| 12 | **NÍÐHÖGGR** — gnawer of the root | fire-forged | serpent scale | `grave` — his gold drags your pin back up |
| 13 | **HEL** — queen of the dishonoured dead | fire-forged | barrow bone | `heavy` — her gold drives 4 |
| 14 | **HRYM** — helmsman of the nail-ship | fire-forged | frost shard | ramp 1.24, the oars never settle |
| 15 | **SURTR** | fire-forged | ember | `burn` |

Everything below Jörmungandr is a beast, a giant or an honest smith doing his job. These five are
the ones who mean it — that was the brief ("foes that are actually bad guys").

**They drop no new materials, on purpose.** Each one is a *second source* of a late material that
exactly one foe used to carry — and the top of the Forge wants about ten of each. That is what makes
finishing the hammer possible at all, and it is why the five are the material engine rather than a
new grind. Ember stays Surtr-only: it is the last thing in the game.

Their boons are deliberately light on brewing. An earlier draft gave them brew boons and the model
blew the Forge target wide open — 223% of it on a long night, 508% on a marathon. They now add
+1.0 (Níðhöggr) and +1.5 (Hrym) and no new multipliers; the rest pay XP, coins and rerolls.

New arenas: `illusion`, `gnipa`, `root`, `helheim`, `naglfar`, each with a backdrop painter in
`HM_SCENES`, a live layer in `hmSceneLive`, and an entry in the log-decoration branches.

## The Forge is a building now

`tk_forge` — **80🪙, +0.45 beer/min**, first in `TOWN_SETS.tank`. `hmForgeBuilt()` gates
`hmForgeUpgrade` and `hmCraftInlay`; the Forge panel shows a banner and the shop's TOWN section
warns until it is standing. It appears in the settlement as a smithy with a breathing coal glow
(`VK_TOWN_ORDER` slot `tkforge`).

It is bad value per coin — 0.0056 rate/coin against the Turf Roof's 0.0089 — and you buy it anyway,
because until it is standing there is nowhere to work. That is the point: it is a gate wearing a
building's clothes. Materials still drop while you save for it.

## Does it close?

`design/` arithmetic over the live tables, simulated minute by minute: coins buy buildings, buildings
brew beer, beer buys forge steps in cheapest-first order, and **a boss only falls once the hammer is
actually up to it** (head tier ≥ pin hardness, plus a cumulative-forge-spend threshold per rung).
Coin income 200/hr from tiles and laps; bounties land as foes fall.

```
  short 2h                L6   foes  6/15  town 10/16  forge  620/1870 ( 33%)
  typical 3h              L10  foes 10/15  town 14/16  forge 1490/1870 ( 80%)
  typical 3h, played well L11  foes 11/15  town 15/16  forge 1670/1870 ( 89%)
  long 4h                 L13  foes 13/15  town 16/16  forge 1870/1870 (100%)
  long 4h, played well     L15  foes 15/15  town 16/16  forge 1870/1870 (100%)
```

That is the brief: a long night played well clears everything, a typical night gets most of the way.

The gate is real in the other direction too. Bounties total 1640🪙 against a town costing 1698🪙, so
**a player who ignores the hammer cannot afford the town** — they top out around 12–13 of 16
buildings, which starves the brew rate, which starves the Forge. Hammering is the economy.

## Caveat worth knowing

A player who sits in the cheapest tiles all night lands near L7, so **7 of 15 bosses**. The old
10-foe/20-level shape would have shown them about three quarters of the roster. That is an accepted
cost of chill play, not an oversight — but it is a bigger lever on the Tank than on any other class,
because his levels *are* his content. If it ever needs softening the right fix is respreading the foe
levels, not taxing the tiles.

## v1 — what changed

- `TK_LEVEL_CAP`/`levelCap()`/`atLevelCap()` added; `xpNeeded` branches on class; `grantXP` caps.
- Five foes added at lv 10–14, Surtr moved to 15, with boons, portraits, arenas and live layers.
- `HM_MATS.fang` renamed `FENRIR'S FANG` → `WOLF-FANG` (two foes drop it now).
- The Tank's level-up no longer opens a chest: `offerBreweryUpgradeWhenClear` clears the owed
  level-ups and lets the "A CHALLENGER COMES" spotlight through instead.
- `tk_forge` added and wired as a hard gate on all forging.
- The settlement ladder compressed from 20 levels to 15 (see below) and renown rungs rescaled
  (see [tank-renown.md](tank-renown.md)).
- Fixed: the Forge's materials panel mapped `HM_MATS[i]` to `HM_FOES[i]` positionally, which broke
  as soon as the counts diverged (15 foes, 10 materials). It now looks the source foes up by material.
- Fixed: the shared foe templates said "Beat him once" / "His pin is". Hel is a queen.

## The settlement, 8–15

The village ladder ran to 20 and its top five beats would have been stranded above the cap, so they
were **paired up rather than cut**. Every late level now lands two things at once:

| lv | what arrives |
|---|---|
| 8 | Fenrir, bound |
| 9 | the second village |
| 10 | the dwarf forge **+** the stone quay and a bigger ship |
| 11 | the frost giant **+** the market town |
| 12 | Yggdrasil **+** the giant dragonship |
| 13 | Thor's chariot **+** a draugr rises from the barrow |
| 14 | Heimdall's horn **+** the golden fleet |
| 15 | RAGNARÖK |

`VK_NAMES_HIGH` is 8 entries. `vkRevealX` flies the camera to the louder half of each pair. The
hero vignettes are keyed by `vkVignette(L, now)`, which maps levels 10–14 to **two** vignettes each
and alternates on a ~42s cycle — so the four scenes written for the retired levels 16–20 still get
played. `TK_SAGA` entries 10–15 were merged to cover both beats of their level.

Ragnarök now lands at 15, the same level Surtr waits at, which is a better ending than it was.

## 12 Oct 2026: no-grind Hammerschlagen
Beta feedback: the nail game was fun, but players sat farming materials instead of playing the night together.
- **Beat a foe once and his material is unlimited.** `hmMatOwned(k)` is true when any foe that drops `k` is beaten. Recipes check that, plus the beer cost; materials are never spent. `S.hmMats` is no longer read (kept so old saves load).
- **3 tries per challenge at an unbeaten foe** (`HM_TRIES`, `S.hmTries = { foeId: used }`, cleared in `resolveTile` next to `hmPaidWins`). Every match started counts, so a reload can't refund one. Beaten foes: unlimited rematches. XP wagers never use or need a try (the wager is the tile).
- **Rematches still pay the coin purse**, capped at 3 paid wins per challenge as before.
- **Flawless first win pays double the bounty** (it used to double the material drop).
- UI: ladder chips show `n/3` (red at 0/3), the fight button shows `TRY n/3` or `NO TRIES LEFT · PLAY A CHALLENGE`, the reward line shows tries left, the Forge shows ♾ or 🔒 BEAT <FOE> per material, and the help text is rewritten.
- Numbers: a full hammer used to need 98 material units (≈ 60–98 extra wins). Now it needs 0 extra wins, just the first kills you make anyway. The beer cost is unchanged (1,220🍺 for all parts + 650🍺 for all gems), so **beer is now the only gate**. No Tank simulator exists yet, so how far up the ladder a typical night gets is unmeasured. Watch it in the next beta.
