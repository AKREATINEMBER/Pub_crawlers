# Two currencies

> Beer builds the hammer. Coin builds the town.

## Why

Beers used to buy nothing. The production loop carried the comment *"brewery no longer funds
S.coins — it's a pure score/prestige tracker"*: your settlement brewed all night and the number
went up and that was the whole feature. Meanwhile coins paid for everything — relics *and* the
Forge — so the two tracks competed for one wallet.

Splitting them gives the dead currency a job and frees the coin budget for the town builder.

## The split

| | earned by | spent on |
|---|---|---|
| 🍺 **beers** | your settlement brewing, over time (+67 per logged beer after #9) | the Forge: hammer parts, gem inlays |
| 🪙 **coins** | challenges, wagers, first wins over a foe | relics, and the town |

Winning a Hammerschlagen foe still *pays* coins (first-win bounties). Only the spending side moved.

## State

- `S.beerCoinsTotal` — the **cellar**: the spendable balance. Goes up as you brew, down as you forge.
- `S.beerLifetime` — brewed tonight, only ever increases, for the honest flavour stat in the Bag.

Helpers: `beersHeld()`, `spendBeers(n)`, `earnBeers(n)`. `hmCanAfford`/`hmPay` check and spend the
cellar instead of `S.coins`.

## Does it balance?

Forge costs were carried over 1:1 from coins to beers. Modelled against real brewing rates
(`tools/` has no brewery sim, so this is `design/` arithmetic over the live `BREWERY_TIERS` and
upgrade rate tables — one upgrade picked per level, cheapest-first, day/night multiplier averaged
to 1.0, no beer-logging income, so it reads **conservative**):

```
hammer parts : 17 upgrades, 1220 beers to masterwork everything
gem inlays   :  9 cuts,      650 beers
everything   :             1870 beers

  night          lv  picks   brewed    % of hammer   % of everything
  short 2h        8      7      219          18%             12%
  typical 3h     12     11      608          50%             33%
  long 4h        16     15     1328         109%             71%
  marathon 5h    20     18     2402         197%            128%
```

A typical night buys you a real chunk of the hammer but never the whole thing; a long night
nearly masterworks it. That's the shape we want — the Forge is the long chase, and because the
model is conservative the lived numbers should sit a little above these.

Coins, having shed 1870 of demand, now have room for the town.

## v1 — what changed

- Beers became spendable; the Forge (`hmCanAfford`/`hmPay`) now charges them instead of coins.
- Added `beerLifetime` so the "brewed tonight" stat doesn't fall when you spend.
- Forge UI shows the cellar and its brew rate; all forge costs now read 🍺.
- Help text updated: "the smith takes ale, not coin".

## v2 — the beer log always pays

Beta testers logged real beers and got nothing back: from log #9 on, `logBeer()` paid brewed
beers + coins and *no XP at all*. That reads as "the game stopped caring", so it's gone.

- `BEER_LOG_XP` still escalates `[8, 11, 15, 20, 27, 37, 50, 67]` for the first eight logs.
- New `BEER_LOG_XP_STEADY = 40`: every log past the 8th grants a flat 40 XP, **on top of** the
  brewery pay (`+67🍺 brewed, +10🪙`), which is unchanged. The escalation still can't decide the
  night — it just no longer falls to zero.
- A logged beer now always grants XP. The only "no" is the 3-minute cooldown, and its toast now
  ends with `(THE XP IS STILL WAITING)` so the beer feels deferred, not denied.

For the Tank that's 235 XP over the first eight logs, then 40 each; his full ladder to L15 is
2898 XP, so a 20-log night draws ~25% of a level ladder from the log button — real, not decisive.

## v2 — Norse pop-ups for the Tank

The praise toasts were Greek (Zeus, Olympus, Hades) under a Viking class. Rule 4 says the Tank's
world is Norse, so:

- `PERFECT_CHUG_LINES` (Tank-only, used by `_chugFinishApplyWin`) is now 31 all-Norse lines,
  written epic-but-funny — Ægir updating his résumé, Loki taking undeserved credit, Ragnarök
  postponed because nobody wants to follow that act.
- New `BEER_LOG_LINES_NORSE` (40 lines) is served by `beerLogLines()` when `S.charId === 'tank'`.
  Every other class keeps the old all-purpose `BEER_LOG_LINES` — the Brew-zard must never go Norse.
- `blPick(arr)` replaces the repeated inline `arr[Math.floor(Math.random()*arr.length)]`.

## v2 — the Forge needs a forge

Two changes from the Tank pass ([tank-levels.md](tank-levels.md)); the beer/coin split itself is
unchanged.

- **`tk_forge` — THE FORGE, 80🪙, +0.45 beer/min.** Beer still pays the smith, but now there has to
  *be* a smith: `hmForgeBuilt()` gates `hmForgeUpgrade` and `hmCraftInlay`. It is poor value per
  coin on purpose (0.0056 rate/coin against the Turf Roof's 0.0089) — it is a gate, not a bargain.
  `townPrice(u)` now honours an explicit `u.price`, which is how it costs 80 rather than 50.
- **The town is now funded by hammering.** The Tank's buildings are no longer given away by the
  level-up chest, so the full town costs 1698🪙 against 1640🪙 of boss bounties. A player who skips
  Hammerschlagen tops out around 12–13 of 16 buildings, which starves the brew rate, which starves
  the Forge. The two currencies were already separate; now the two *activities* feed each other.

The 1870🍺 forge total is unchanged, and the closed-loop simulation (coins → buildings → beer →
forge → boss → bounty, with bosses gated on the hammer actually being good enough) puts a long
night played well at 100% of it and a typical 3h night at 80%. Table in
[tank-levels.md](tank-levels.md).


## 12 Oct 2026: no more day/night brewing
The brewery used to follow the 8-minute sky cycle (0.5x at midnight up to 1.6x at midday, `dayNightBrewMultiplier`). That is gone: `tickBreweryProduction` now brews at `computeBreweryRate()` flat, so the 🍺/min label only changes when the base rate does (brewery tier, chest upgrades, relics, boss boons). The old swing averaged 1.05x, so total brewing over a night is about 5% lower. The sky still cycles; it is cosmetic only.
