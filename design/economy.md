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
