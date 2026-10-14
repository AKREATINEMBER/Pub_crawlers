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

## Oct 12 2026 — Longhouse slim-down (what changed)
Goal: the Longhouse panel was cluttered; strip the Tank back to Hammerschlagen + Forge + Rage + a simple headhunt.
- **Header:** stat lines replaced by tappable chips (`lhInfo('heads'|'rage')`), each opening an explainer card. Foe info is name + two chips (`📌 pin`, `🏆 boon`) opening `hmFoeDetail()`.
- **Renown is silent:** no rank chip, no tier-up toast/log, not in the share line. `tkCheckTierUp` still records the tier, so the outfit still changes.
- **Hammer finish is automatic:** `hmFinishDef()` = newest finish earned. FINISH picker removed from the Forge.
- **Removed:** Forge TROPHY HALL; flawless/rage counters on screen (still tracked for THE UNSHAKABLE).
- **Goblet ladder retired:** Iron Throat / Gondrink / Holy Ale are `retired:true` (hidden from shop), `chugGetMode()` always ONE SHOT. Every XP wager = 1 try (+1 Skull Cup, +1 Neverending Stout). Holy Ale's +1× flawless is gone.
- **War Wounds retired:** no −30%, no badge, no HUD title. `migrate` clears `bloodied`.
- **Holmgang:** ×2 spoils removed (win = head + 20🪙). Before the first Holmgang it asks how many OTHER players are out (`hgAskPlayers` → `S.hgPlayers`, 1–8); that's the heads needed (`hgNeed()`). Changeable from the Heads card. Squad mode (frozen) still uses squad names.

## Hammerschlagen v3 — the swing hits when you tap (Oct 12)
- **Bug:** the swing listened for `click`, which fires when the finger *lifts* (80–150 ms after touching), and read the needle at that later moment. At Ragnar's speed the needle had moved 12–20% of the bar, and gold is 3–8% wide. Faster foes could also step the needle clean over gold between two frames. Browser test, tapping on a frame that showed the needle in gold: **1/30 registered gold before, 30/30 now**. Taps 80 ms after gold still miss (0/30).
- **Fix:** `hmPointer` swings on `pointerdown` using the event's own timestamp. `hmJudge` replays the needle's recorded path (`_hm.hist`) from the last painted frame to the touch, capped at `HM_LOOKBACK_MAX` = 34 ms; the best zone it touched wins. The needle freezes where the hit was judged, and the meter flashes gold or solid.
- The whole meter is now a tap target, not just the button. Status line: "Tap the bar or SWING when the needle hits gold".
- **Smoother:** the needle moves with a compositor transform (`hmNeedleTo`, on a `.hm-track`) plus a faint ghost trail. While you aim, the arena canvas redraws every other frame, so the needle gets the phone's time.

## Cozy v3 — hearth details (whole UI)
- Brass corner filigree on panels and cards (background layers, so no pseudo-elements are used), gilt-rule titles with a ✦, and ornamental diamond dividers.
- **Counter-accent:** the XP bar is now dusk-teal → honey with a slow shimmer (was neon cyan → purple), and the level badge is moonlit teal. Green and cyan buttons are softened to moss and sea-glass.
- (Drifting hearth embers were tried and removed at David's request.)
- Screens fade in (opacity only). The open nav tab has a little lantern flame. The meter has brass rivets.
- **Title screen:** the green PRESS START is now a glowing honey lantern button, with an "A NIGHT OF LEGENDS" tagline. The logo pulse animates transform only (it used to repaint six stacked drop-shadows every frame).

## Tank details (Oct 12) — the Longhouse in Norse craft
- **Borders:** a braided knotwork band runs top and bottom of the Longhouse board (`--tk-braid`). Iron corner brackets with rivets replace the brass curls on every Tank panel and frame the arena (`.hm-stage::before`).
- **Portrait and titles:** the portrait hangs like a shield. Section titles get a gilt knot and a rule running to the edge.
- **Stat chips and Rage:** the stat chips are nailed wooden plaques. The Rage bar is live fire with a running glint.
- **Foe ladder:** foes are nail-hung plaques. The chosen one is gold-rimmed, lifted, and has a pointer down to its name, which sits between two gilt axe-heads.
- **SWING:** the button is an iron-banded plank. `#hmBtn.swing` (set in `hmRefresh`, cleared in `hmSwing`) pulses a gold ring only while it's your turn.
- **Hammer row and Holmgang:** the hammer row is a weapon-rack plank. The Holmgang heads hang each on its own nail on a plank wall.
- All pure CSS, scoped to `body[data-char="tank"]`. The only motion added is two opacity/transform loops (Rage glint, SWING ring).

## Cozy v4 — one crafted system (Oct 12, whole UI)
- **One sigil per class** (`--cz-motif`): Tank knot, Gambler spade, Jester harlequin diamond, Brew-zard star, Sir Drinks-A-Lot shield. It marks:
  - every screen title (a centred plaque: sigil · rule · TITLE · rule · sigil)
  - every board heading (h2)
  - every class-widget section label (sigil · words · rule to the edge)
  - every divider
- **Corner ornaments per class** (`--cz-orn*`): gold curls for the Gambler and Jester (studs in green and red), lilac with mint for the Brew-zard, steel with gold for the Knight. They go on panels, cards, class widgets and stages. The Tank keeps his iron brackets.
- **Bottom bar:** pixel-art icons above each word (mug, sack, coin, scroll, book), drawn as SVG via `--nav-icon` per button.
- **HUD and slots:** the level is a teal medallion, and the XP bar has quarter marks. The slot cabinet has marquee bulbs top and bottom and payline arrows either side of the reels.
- **Achievements** (`renderLog`): rows with a round icon well, name and description. Earned ones glow gold; locked ones are muted wood (they were hyperlink-blue `#4a4080`).
- **Class widgets:**
  - All: framed portraits, rounded meters and tabs, and stages with ornamented corners.
  - Gambler: felt stitched in gold.
  - Jester: the Street Act is a striped booth.
  - Brew-zard: the Surge bar glows violet.
  - Knight: a steel-and-wood counter edge on the tap stage.
- **Legibility:** foe names 5.5→7px, hammer legend 7→8px, head names 6→7.5px, Den tabs and mini buttons to 8px.
- **Rhythm:** 10px between every board.

## Tank · Norse craft (Oct 13) — every Tank screen hand-carved
Motifs are drawn once as SVG (`--nx-*`, generated by script):
- **valknut:** the Tank's sigil.
- **Jörmungandr:** the world-serpent divider, head and curled tail.
- **shield-wall:** four painted round shields on a gunwale.
- **rune band:** it reads ᛊᚲᚨᛚ · ᛏᚨᚾᚲᚨᚱᛞ · ᚹᚨᛚᚺᚨᛚᛚᚨ, i.e. SKÅL · TANKARD · VALHALLA.
- **longship stem-curl**, **round shield**, **knot-line** and **axe-head**.

Where they go:
- **Screen titles:** a stem-curl at each end. **Dividers:** the serpent. **h2 and section labels:** valknut, the words, then a knot-line fading out.
- **HUD:**
  - Level badge: a round shield with an iron rim and rivets.
  - Pills: stitched leather.
  - XP: iron-framed, with notched quarters.
- **Daring signs:** a knot carved along the foot of each.
- **Slot cabinet:**
  - A shield-wall along the top and a braided rail below.
  - Axe-heads on the payline.
  - Nailed iron-bound reels.
- **Every primary or big button:** an iron-banded plank with nails. Gold and green buttons get nails; small gold ones stay plain so the FORGE prices fit.
- **Longhouse:**
  - Top: the braid, then a shield-wall.
  - A carved rune lintel under the portrait row.
  - Foe plaques hang from a beam.
  - Axes either side of the foe's name, and round shields at both ends of the meter.
  - A valknut over the status line, and shields over the Holmgang wall of heads.
- **Forge:**
  - The showcase gets iron brackets.
  - Stat tiles are nailed plaques; materials are nailed crates.
  - Each hammer part sits in a round-shield well, with knot-line row separators. The cellar has a shield emblem.
- **Armory:** braid plus shield-wall header, a serpent under the coin count, and a valknut on the exclusive label. Item art has an iron frame.
- **Achievements:** each in a round shield, with knot-line separators.
- **Cards:** a rune band across the head, iron brackets in the corners, a knot along the foot. **Toasts:** a carved plaque with a valknut seal.
- **Bottom bar:** a carved bench with a braid on top, and wooden tabs with an iron strap and two nails.
- **Fix (all classes):** the Shop sat under #app's empty bottom padding (~144px blank band). `#app:not(:has(> section:not(.hide)))` drops that padding.
- **Motion:** none added.

## Tank · Norse craft II (Oct 13) — second pass over all five tabs
- **Headings:** h2 and section labels drop the doubled icon (valknut + emoji). They now read "emoji WORDS" with a knot-line underneath that ends in a valknut. `background-clip` keeps the line from running under the valknut.
- **Boards:** faint upright plank grain under the lamplight glow.
- **Game:**
  - The brewery window gets iron brackets and a bronze edge; the beer/min reading sits in a small pill.
  - The Daring header is a serif label with a valknut.
- **Challenge card:** the chips are wooden plaques, "YOU WIN IF" is a nailed carved board, and ACCEPT is a strapped moss plank.
- **Bag:**
  - Coins and rerolls are two leather purses (`.bag-purse`, an HTML change shared by all classes; checked in the other classes).
  - Secret Quest steps are round shields: current gold, done moss, blown red. The quest button is a bronze-and-iron plank instead of purple.
- **Armory:**
  - Serif title between longship curls, with an italic tagline.
  - Leather coin purse with a round-shield coin.
  - "THE TOWN / RELICS / ITEMS" breaks are serif labels between fading knot-lines.
- **Info:** Crawler's Path rows are carved slats with round-shield icon wells; "UNLOCKED" is moss.

## Tank dividers (Oct 13): the ring-chain replaces the painted shields
- David: the shield rows were too colourful. They're gone everywhere: slot cabinet top, Longhouse trim, Holmgang wall, Armory header.
- In their place is `--nx-chain`, a continuous Borre-style ring-chain carved in dark brown (rings joined by crossing strands).
- The same chain also divides the boards on every Tank tab: 26px between panels, fading at both ends. It also sits above the Daring dial and the Longhouse.

## Tank · hearth + calm & unified (Oct 13)
- David's feedback: the black slot cabinet looked low-effort. Then: too many patterns, and the boards looked like separate games.
- **One surface, one frame:**
  - Every board shares one surface, `--tk-board` (oak, lamplight from above, faint upright grain), and one frame, `--tk-frame` (2px bronze edge, dark outline, 14px corners).
  - Boards covered: HUD, Daring dial, slot cabinet, Longhouse, challenge strip, cards, Bag/Info/Log panels.
  - The brewery window, hammer arena and forge showcase get the same frame.
  - Even 10px rhythm between boards.
- **Slot cabinet:** the same oak board with a valknut crest at the top, two candle sconces with warm glow (`--nx-sconce-l/r`, `--nx-crest`), a carved recess for the reels, oak-framed reels, and a nailed name-plaque for the result.
- **Armory:** the whole shop is warm oak; item cards are oak (`--si-*` vars), not blood-red.
- **Removed:**
  - The braid and ring-chain bands, and the panel dividers.
  - The rune lintel and the rune band on cards.
  - Corner brackets on boards and pictures.
  - The knots on the Daring signs, the bench braid on the nav, and the Armory header bands.
  - Most nails (they stay only on things you press). Knot-line row separators became hairlines.
- **Kept, as the few meaningful details:**
  - The knot-line + valknut under headings, and the serpent under the Armory purse.
  - The cabinet's crest and candles, the axes on the payline, and the round shields on the meter ends.
  - Leather purses, round-shield wells, and iron-strapped primary buttons.

## Tank HUD (Oct 13): one window, a bronze level medallion
- **Window and nameplate:** the brewery window and the nameplate under it are one piece again. The window has rounded top corners only and the plate rounded bottom corners only, joined by a carved bronze sill (`#arenaWrap + .panel.tight::before`). My unified frame had split them into two boxes that collided.
- **Brew-rate tag:** a small oak tag with a bronze edge.
- **Level:** `syncHUD` now writes `<span class="lv-k">LV</span><span class="lv-n">N</span>` (plus `.lv-cap` ★ at the level cap). This is shared by all classes; the others look as before.
  - The Tank shows it as a polished bronze medallion: 46px, a big serif number, small "LV" above. It replaces the wooden pill with rivets, which David didn't like.

## Tank reels (Oct 13): rebuilt to match the Daring dial
- David: the candle-lit cabinet didn't fit the rest. It mixed in its own vocabulary: a dark recess, sconces, a crest, floating axes, and a result plaque that looked like a second button.
- **Now it's the same board as the Daring dial**, with a serif "THE REELS" label and valknut (`#slotWrap::before`).
- **The reels** are walnut signs with two brass nails, like the Daring signs, 74×70, with a soft dark well behind the icon.
- **The result** is a plain caption like the Daring note.
- The candles, crest, recess, axes and plaque are gone (their SVG vars are left unused).

## Tank: choose, then pull (Oct 13)
- The Daring dial and the reels are one board: the dial has rounded top corners only, the reels rounded bottom corners only, and a carved hairline rule between them. Same oak, continuous grain.

## Tank materials (Oct 13): nothing looks like a default any more
- David: the level counter looked cheap, and other elements too. Every Tank element is now one of four materials.
- **BOARD:** the oak panels (`--tk-board`).
- **SIGN:** raised walnut with two brass nails (`--tk-sign`): the Daring signs, the reels, the foe plaques, the Forge stat tiles, and **the level**. The level is a nailed sign with "LEVEL" carved small and the number in honey serif; it replaces the gradient coin. The Forge stat pips are brass studs in dark sockets.
- **TRAY:** a groove carved into the board, with a dark well and bronze lip (`--tk-tray-bg/--tk-tray-sh`). Used for:
  - the XP bar: a mead-amber fill with gloss, in a groove, quarter-notched
  - the next-unlock line (no dashed border)
  - coin/brew/purse trays (no stitching) and the Armory purse
  - reward lines, the hammer row, the cellar, the Heads/Rage chips, the challenge chips and win-condition
- **BUTTONS:**
  - ember plank: main action (unchanged)
  - dark oak plank with a bronze edge: secondary (FORGE, NEW BAR, REROLL)
  - struck brass plate with an engraved inner line: prices
  - verdigris copper: items
  - disabled: pressed into the wood, muted but legible (not washed-out tan)
- **Shop kind tags:** notched bronze ribbons (RELIC); items get a verdigris ribbon.

## v3 — beta focus: Tank only, a clean tutorial, no Rage, a way out

- **Beta lock.** `BETA_TANK_ONLY = true`: the other four classes show on the select screen with a 🔒 and
  "LOCKED FOR THE BETA"; START refuses them. The developer login (PUBDEV) still starts any class.
- **Hammerschlagen is an unlock now** (`tank_hammer` in `UNLOCKS`, `win:1`, flag `S.hmUnlocked`). It stays
  sealed through the tutorial and its fixed-XP beer tile. The Tank's first *real* win pays XP straight out
  (no stump), then the unlock spotlight plays a 3-step intro (`HM_INTRO`: the stump → swing on gold → the
  gauntlet). Every win after that goes on the stump. Foes reached while sealed arrive silently
  (`hmCheckNewFoes`). Old saves past their first real win are opened by `migrate` (`_hmOld` flag from `load`).
- **The tutorial is the tutorial.** Saga reveals (`vkRevealTick`) wait until `S.tutorialDone && !S.tutStep`,
  and no Hammerschlagen foe spotlight can land inside it.
- **Berserker Rage is gone**: the unlock, the chip, the HUD glow, the ×2.25, the wager tag, the help text and
  the Hulk Smash Horn. Saves get `rage = 0`, and any Horns in the bag are bought back at 45🪙 each.
- **🏳 GIVE UP** (`hmGiveUp`, two taps, no dialog): ends a match between your swings, or settles a wager that
  already lost a try. On a wager it walks away from the whole thing — the XP is lost, whatever tries are left.

## v3.1 — the beers are his strong suit

Logged beers used to climb 8→67 over the first eight and then **drop** to a flat 40 for everyone. For the
Tank-ard the climb never stops now (`beerLogXP(n)`, `TANK_BEER_STEP = 10`, `TANK_BEER_MAX = 150`): the same
first eight, then +10 a beer up to 150. The 3-minute cooldown is unchanged. The button shows the next
beer's value (`🍺 LOG A BEER · +87 XP`). Other classes are unchanged.

```
beers logged    old total   Tank total   share of the Tank's 2898 XP climb
     8             235          235          8%
    12             395          603         21%
    15             515          984         34%
    20             715         1731         60%
```

## v3.2 — less text on the pane, an ⓘ instead

The reward/tries lines (`#hmReward`) and the hammer stat line (`#hmGear` text) are off the Hammerschlagen
pane. An ⓘ next to the HAMMERSCHLAGEN header (`hmInfo()`) opens a card with this foe's rewards and tries
(`hmRewardHTML`), the gold/flawless rule, and every hammer part with its level, what it does and its current
name, plus a FORGE shortcut. The ⚒ FORGE button stays on the pane.

## v3.3 — ⓘ everywhere, less prose on screen

A shared info system: `infoBtn(key)` prints a 44px ⓘ, `showInfo(key)` opens `INFO[key]`. Short labels and
numbers stay on screen; the "how it works" moved behind: the Daring Dial (all four notches, current one
marked — the per-notch description line under the dial is gone), the shop's TOWN / RELICS / ITEMS sections,
and the bag's Forge, Hammer (`hmPartsInfoHTML`), Relics, Secret Quest and upgrades panels. Hammer part rows
keep name, level and NEXT only. The nail game's idle sub-line is gone. Flavor lines stay (house style).
The Tank's bag panel is now "🏘 YOUR TOWN" (he gets no level-up chests).

## v3.4 — out of rerolls? Chug for a new roll (all classes)

With 0 rerolls, the tile card's reroll button becomes **🍺 CHUG FOR A NEW ROLL** (`chugReroll(kind)`; the
Knight's tap says POUR). It opens a confirm card: finish your drink in one go, tap DONE, and the reels spin
again. Honor system like LOG A BEER: it counts a drink (`S.drinks`, `addPace(10)`), pays no XP, and bumps
`S.chugRerolls`. The tile stays in `S._slotPending` until DONE, so a reload just brings the tile back.
Not offered on the tutorial tile.

## v3.5 — he waves at you

Rarely (first after 2.5–5 min of quiet town time, then every 3–7 min; `vkGreetTick`, driven from
`arenaCamera`), the Tank-ard turns, waves and shouts a line in his speech bubble for 6.5 s while the camera
glides to him. Pool: `VK_GREET_LINES` (80 lines) plus a few that read the night (`vkGreetLines`), drawn from a
shuffled bag so nothing repeats until the pool is used up. Only counts time when the game screen is up and
nothing else is happening (no card, spotlight, level flash, tutorial, saga reveal, swiping). `vkSay` now wraps
long lines in two; the swipe hint hides while he talks.
Also: the out-of-rerolls button says "🍺 EMPTY YOUR BEER · NEW ROLL".

## v3.6 — rematches are for fun, pop-ups stay longer, readable on a phone

- **Free rematches against a beaten foe pay nothing** (`hmLoot`: the purse only comes with an XP wager or a
  first win). The night is about the squad; Hammerschlagen is an extra. The ⓘ says so.
- **Pop-ups stay longer:** toasts 2.3 → 3.6 s, epic toasts (the beer-log line) 5 → 8 s, unlock teasers
  4.5 → 7 s, his wave bubble 6.5 → 11 s. Toasts dismiss on tap.
- **Readability layer** (end of the stylesheet, `READABILITY ON A PHONE`): every label that was 5.5–8px is
  now 7.5–9.5px, reading text 10–11px, checked for overflow on game/shop/bag at 390px.
