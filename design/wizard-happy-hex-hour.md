# Happy Hex Hour — the Brew-zard's wizarding duel (v4: cocktails, saved mead, clarity)

A turn-based, drink-themed spell duel for the Wizard. You build a deck of spells, powered by the **Rune Circle** (the same five runes that climb the Cauldron). It's a parody of Harry Potter, not a copy, and the rivals have no Norse theme. It sits in a tab next to The Cauldron in the Brew-zard panel.

## v4: strategy & clarity pass
- **Cocktails:** the order of spells within a turn matters. Each spell's element flavours the next one (`B.lastEl`, reset every turn).

  | Order | Cocktail | Effect |
  |---|---|---|
  | ❄ then ⚡ | SHATTER | ×2 on a frozen foe |
  | ☠ then 🔥 | FLAMBÉ | his poison stacks hit at once, ignoring liver |
  | 🛡 then any damage | HOT TODDY | +3 per hit |
  | ✨ then any spell | MIXOLOGY | costs 1 less |

  `DW_COCKTAILS` holds the list and `dwComboFor()` checks it. Cards that would trigger a cocktail glow gold with a 🍸 banner.
- **Saved mead:** up to 2 unspent mead carries over (`B.banked`) and shows as pink pips.
- **Starter loadout:** 2 Incendi-Ouzo, 2 Prote-Grog, Glacius, Jäger-Bombarda, Absinthius and Epi-Whiskey. Costs now vary (1–2), and every cocktail except Mixology works from the first duel.
- **Clarity:**
  - A coach line (`dwCoach`) shows the most useful hint each turn.
  - `dwPreview` clones the battle and runs his turn. The result shows as a pulsing red stripe on your health bar and on the END TURN button ("YOU TAKE 14"). The button turns red if the hit would knock you out. Lockheart shows "might be lying".
  - Cards show the real damage number against this foe (tip, liver, weakness and Hot Toddy included), plus WEAK/RESISTS chips, a big number with its unit, and element-tinted art.
  - A cocktail legend sits under the hand.
- **Balance (thinking bot, depth 6):** foe HP was raised about 10–15% (Troll 118, Snapps 146, Bella 182, Umbridge 330, Dementors 250, Lockheart 500, Veela 460, Vodkamort 110/110/110/130).

  | Build | Wins vs |
  |---|---|
  | early | Troll 100%, Snapps 40%, Bella 7% |
  | mid | Bella 83%, then 33–53% vs ranks 6–9, Vodkamort 3% |
  | full | 100% everywhere |

  A sloppy player wins much less (the full build beats Vodkamort only 47%), so skill matters more than before.


## v5: stars, rival banter, the bar tab, card juice
- **★ Stars (30 total):** each rival has three: beat them, beat them UNTOUCHED, and their own LAST ORDERS challenge (`DW_CHALLENGES`), which teaches that rival's trick.
  - The first LAST ORDERS star pays +2 of that rival's ingredient and +20🪙.
  - Stars show on the ladder chips and in the rival info, with a running total (★ n/30). During a duel, a live progress tag shows until the challenge star is earned.
  - Achievement "Outstanding Wizarding Levels" is for all 30 stars.
  - Saved as `S.dwStars[foeId]` bitmask: 1 = beaten, 2 = untouched, 4 = challenge.
- **LAST ORDERS challenges:**

  | Rival | Challenge |
  |---|---|
  | Filch | mix any cocktail |
  | Trela | land a SHATTER |
  | Troll | land a FLAMBÉ |
  | Snapps | win in 6 turns or fewer |
  | Bella | mix 3 cocktails in one duel |
  | Umbridge | never get a spell cancelled by a Decree |
  | Dementors | win in 7 turns or fewer |
  | Lockheart | land a single hit of 25 or more |
  | Veela | never heal her while charmed |
  | Vodkamort | beat all four forms in 16 turns or fewer |

- **Stats (`B.st`):** the engine tracks damage, biggest hit, damage taken, cocktails (each type), cancelled spells, charmed hits and spells cast.
- **Rival banter (`DW_QUIPS`):** each rival says something at the start, when hit hard (12+ damage, a SHATTER or a FLAMBÉ) and when first dropping below 30% health. It shows as a pixel speech bubble on the canvas.
- **The Bar Tab:** a receipt under the duel button after each duel, showing turns, damage, biggest hit, cocktails, damage taken and stars earned. It replaces the need for a pop-up.
- **Card animations:** a played card flies into the arena, and each new turn's hand deals in with a stagger.

## v6: THE BUZZ (drinking replaces mana; David's design)
- **No mana:** cast as many spells as you like. Every spell is a potion the wizard drinks:
  - **Proof:** each potion adds its proof (`pr`, usually 1–5) to your BUZZ.
  - **Potency:** each extra sip in the same turn is weaker (`DW_POTENCY` 100/100/85/70/55/45/35%). This scales damage, shields, poison and heals.
  - **Passing out:** going over your liver capacity knocks you out. The turn ends at once and you sleep through the next one (he gets two moves), then wake at half buzz.
  - **Sobering up:** you lose a few buzz every turn (`DW_SOBER`).
- **Water:** Epi-Whiskey became AGUAMENTI ON THE ROCKS (0 proof, −3 buzz, small heal). FELIX now sobers you up and draws. The Cauldron draughts sober you instead of giving mead.
- **"More potions" cards:** ACCIO draws 2 (3 at level II).
- **Runes:**

  | Rune | Duel effect |
  |---|---|
  | ᚠ | hand size 4/5/6/7 |
  | ᚢ | health and liver capacity 10/12/14/16 |
  | ᚦ | damage per hit |
  | ᚨ | shield bonus and sobering 3/4/5/6 a turn |
  | ᛟ | gems |

- **Rivals and cocktails:** "tipsy" intents now spike your drink (+3 buzz, which can knock you out). Mixology is now −1 proof.
- **UI:**
  - Buzz meter with tier names (Sober, Tipsy, Merry, Wobbly) and a 💤 marker at your limit. The part you'll sober off by next turn is faded.
  - The meter shows the strength of your next sip and how many you've had this turn.
  - Cards show proof (💧 for water) and their strength % once potency drops. A red "PASSES YOU OUT" warning appears on any card that would put you over.
  - The coach states facts only and never names the card to play.
  - The wizard sways and gets rosy cheeks as he drinks, hiccups, and lies down snoring when out cold.
- **Balance (thinking bot, depth 5):** skill matters a lot, comparing a careful bot with a sloppy one:

  | Build | Rival | Careful | Sloppy |
  |---|---|---|---|
  | mid | Bella | 100% | 40% |
  | mid | Vodkamort | 10% | 0% |
  | full | Vodkamort | 97% | 27% |
  | full | Umbridge | 97% | 50% |

  Vodkamort's forms now have 125/125/125/150 health.

## v6.1: test pass (exploits fixed)
How the buzz duel was tested:
- **Fuzzing:** 4,000 random duels with random builds, decks and gems, checking invariants (no NaN, no negative buzz, no overheal, a pass-out always skips the next turn, sips reset each turn, every duel ends).
- **Strategy comparison:** a search bot against cap-2, cap-3 and greedy bots.
- **Browser runs:** five full duels driven by the search bot, with random tap-spam on cards and END TURN during animations, pass-outs and skipped turns. No errors and nothing stuck.

Fixed:
1. **Free Accio chain:** Mixology made the next ✨ spell cost 0 proof, so Accio → Accio → Accio drew the whole deck for free. Now ✨ never discounts another ✨ (`dwMixes`).
2. **Water weakened the next drink:** a glass of water counted as a sip, lowering the strength of the following potion. Now only potions with proof count as sips (`dwIsSip`), and water/Cauldron draughts never make the next drink weaker.
3. **Stun-lock:** with a hand as big as the loadout you held Petrificus every turn, so the rival never acted again (verified: 0 damage taken over 40 turns). Now a rival who just lost a move (stun) or a hit (Riddikulush) is 😠 WIDE AWAKE for your next turn, and those spells do nothing then (`dwWary`). The card says so.
4. **The hand ate the whole loadout:** at hand 7 with a 6-spell loadout you drew everything every turn, so there was no luck and no deck-building. Hand size is now capped at loadout − 3 (`dwHandSize`), and the Bag shows "ADD SPELLS" when your loadout limits it.
5. **Infinite sobering:** several Aguamenti copies erased the buzz limit every turn. Now it's one glass of water a turn (`dwIsWater`/`B.watered`). Felix and Cauldron draughts are exempt because they're limited already.

Balance after the fixes (thinking bot):

| Build | Results |
|---|---|
| early | Troll 100%, Snapps 25% |
| mid | Bella 95%, Veela 40%, Umbridge 5% |
| full | everything 100% except Vodkamort 80% |

Binging and passing out are sometimes the right call (the smart bot passes out 0.3–1.4 times a duel against tough rivals), while playing safe with a fixed 2–3 potions a turn never won in tests.

## v7: THE CRAWL (runs) + the DAZE meter with sweet-spot crits (David's design)
- **The Crawl:** free play is now a run of 3 bars (fewer if fewer rivals are unlocked).
  - The route is 2 random unlocked rivals below the one you pick, then your pick as the 👑 finale. The two warm-up bars come in at 75% health.
  - Health and daze carry between bars. The walk to the next bar gives +40% health and −4 daze.
  - After each win you pick 1 of 3 rewards for the rest of the crawl:
    - 📜 a random spell added to your loadout
    - 💎 a borrowed gem
    - 💧 a pitcher of water (−6 daze, +10 health)
    - 🍟 bar snacks (+18 health)
    - 🖐 bigger hands (+1 hand size, up to +2)
    - 🍺 round on the house (a free Dragon's Dram next bar)
  - **Losing** ends the crawl but you keep everything won so far. **Finishing** pays +finale purse ×3 coins and +2 of the finale's ingredient (`S.dwCrawls` counts crawls).
  - First-win boons are held until the crawl ends. Stars show as chips on the pick card instead of toasts.
  - 🏠 GO HOME abandons a crawl, and you can't switch rival mid-crawl.
  - An XP wager from the Cauldron is still a single quick duel.
  - The run lives in memory (`_dwRun`), so reloading the page abandons it.
- **Daze curve (`dwPotency` from `dwDazeAfter`, the daze once the potion is down):**

  | Daze after the drink | Strength |
  |---|---|
  | up to 50% of liver | 100% |
  | up to 75% | 85% |
  | above 75% | 70% |
  | **sweet spot**: the last 2 points (`DW_SWEET`) | 💥 **CRIT ×2**: damage, shield, heal and cards drawn |
  | over the liver | **spilled**: no effect, you pass out |

  Crit plus shatter is ×3, not ×4.
- **UI:**
  - The meter is renamed DAZE, with tinted zones and gold sweet-spot boxes.
  - Cards show 💥 CRIT ×2 (glowing), 85%/70%, or "SPILLS · YOU PASS OUT".
  - The coach says "land on daze X–Y for a crit".
  - A route strip of three portraits shows bar progress (✓ / current / 👑 finale).
- **Foe health back to pre-cocktail values:** Troll 106, Snapps 128, Bella 160, Umbridge 300, Dementors 225, Lockheart 460, Veela 420, Vodkamort 115/115/115/135.
- **Crawl simulations:** with the early build a careful player finishes the Troll crawl 90% of the time; a full build finishes the Vodkamort crawl about 70%. Hitting the sweet spot is the difference: a smart player lands 6–20 crits per crawl, a sloppy one about 1, and sloppy play rarely clears bar 2.

## v8: THE DUNGEON RUN (replaces the 3-bar crawl)
- **Starting a run:** every free-play session is a run started with 🗺 START A RUN.
  - The run goes from the chosen starting floor down to the deepest unlocked rival (your level decides how deep).
  - Each floor (`DW_FLOOR_ORDER`, 1 = Filch … 10 = Vodkamort) has ⚔ room 1 (2 minions), ⚔ room 2 (2 minions, or 3 from floor 4), then 👑 the rival.
- **Checkpoints:** you can start on a rival's floor if the rival before it is beaten (or it's floor 1, or dev mode). You pick it in the rival picker; otherwise the run falls back to the nearest allowed floor (`dwCheckpointOK`/`dwStartFloor`).
- **Healing between fights:** after a room you get +15% health and −3 daze. After a rival, the TAVERN restores full health and sobers you completely. You pick 1 of 3 rewards after every win (same pool as the crawl).
- **Loot and ending:**
  - Rooms drop +1 of the floor rival's ingredient.
  - Rivals give their normal loot, stars and Last Orders (rooms don't).
  - Reaching the bottom of what's unlocked pays the finish bonus.
  - Losing or 🏠 going home ends the run, and you keep everything won.
- **Minions (`DW_MINIONS` / `DW_MINION_INFO`, generated stats):** 2 per floor, HP-parody themed, with new 12–14px pixel sprites:

  | Floor | Minions |
  |---|---|
  | Filch | Mrs Pourris, Suit of Armour |
  | Trela-Neat | Cursed Teacup, Sherry Bottle |
  | Troll | Cellar Rat, Cornish Pixie |
  | Snapps | Bubbling Cauldron, Pickled Snake |
  | Bellatrix | Death-Eater Bouncer, Screaming Spectre |
  | Umbridge | Kitten Plate, Educational Decree |
  | Demen-Thirsts | Grindylow, Lost Soul |
  | Lockheart | Flying Book, Pixie Fan Club |
  | Veela | Champagne Flute, Dancing Suit |
  | Vodkamort | Death-Eater, Nagini's Hatchling |

  - Roles: brute (big hits and ward), pest (double hits and strength), support (heal and ward itself), spiker (spikes your drink, +2 daze).
  - Stats scale with the floor: health 7–10 + 5–7×floor, damage about 2.5 + 1.6×floor, liver floor(0.55×floor), and they share the floor rival's weakness.
- **Multi-foe engine:**
  - `B.foes[]` holds the room, and `B.foe`/`B.ti` is the current target. `dwRelink` restores the target after JSON clones.
  - Each living foe acts in order (`dwFoeAct`) on its own intent cycle.
  - Multi-hit spells roll on to the next foe when the target drops.
  - Events carry `who` so projectiles, pops and hit-flashes land on the right minion.
- **UI:**
  - The dungeon map (floors → room/room/👑 nodes, current node pulsing) replaces the rival picker at the top during a run and scrolls to the current node.
  - Rooms draw 2–3 minions, each with a mini health bar, a compact intent (the middle one staggered up so they don't overlap) and status icons.
  - The target gets gold corner brackets and a ▼. Tapping a minion in the arena aims at it, and the hint row says "🎯 tap a foe to aim · N left".
  - Defeated minions tip over and fade, with a "KO!" pop.
- **Simulation (search bot):** an early build reaches the Troll's floor (about 9 fights). Each rival is a wall until its runes are carved, and rooms wear you down on the way. A full build from floor 1 averages about 5–7 floors per run; checkpoints let you push deeper on later runs.
- **Not yet:** a run still lives in memory only, so reloading abandons it.

## v9: boss summons, recipe Cauldron, run specials, saved runs
- **Bosses summon minions:** every rival has a `{a:'summon'}` step (`DW_SUMMON_AT`). Vodkamort summons in forms 2 and 3.
  - Summoned minions are that floor's minions at 60% health, at most 2 at a time.
  - A minion waits a turn before acting (`fresh`) and reuses a dead minion's slot.
  - Layout with a boss: the boss on the right (x 250), minions to its left (190, 148). The boss keeps the big top bar and its intent above its head; minions get mini bars. Summons show a 📣 pop.
- **The Cauldron brews recipes (`WZ_RECIPES`):** House Ale is known from the start, and each tile kind teaches one recipe (the old "ingredient" discovery, so it comes from activities, not XP).
  - Each recipe is its own rune order of 3–5 rungs.

    | Recipe | Runes | Focus |
    |---|---|---|
    | House Ale | ᚠᚢᚦ | a bit of everything |
    | Stout of Stamina | ᚢᚢᚨᚠᛟ | healing, then shield |
    | Dragon's Dram | ᚦᚦᚠᚦᛟ | fire damage |
    | Gossip Fizz | ᚠᚠᚨᚦ | draws |
    | Troll-Sweat Tonic | ᚨᚢᚨᚦ | shields first |
    | Fool's Gold Flip | ᛟᚦᚠᚦᚢ | sobering then damage |
    | Giant's Tooth Grog | ᚦᚨᚦᚢᚦ | damage and armour |
    | Moonwater | ᛟᛟᚢᚠ | sobering |
    | Siren Song | ᚠᚦᚠᚨ | draws and shock |
    | Wanderer's Brew | ᚢᚠᛟᚢ | healing |
    | Cursed Spider Shot | ᚦᛟᚦᚦ | poison damage |

  - Each rung reached adds its rune's gift to the bottle (`WZ_RUNE_GIFT`): ᚠ draw 1 (2 from carve level 2), ᚢ heal 6, ᚦ damage 8 (in the recipe's element), ᚨ shield 7, ᛟ −3 daze. Each gift is ×(1 + 0.5 per carve level).
  - The XP multiplier and risk per rung still follow position (`CAULDRON_STAGES`), adjusted by the carve level of the rune on that rung.
  - The recipe picker sits before the first ingredient. The ladder shows each rung's gift, plus "bottle now" and "full brew" previews.
- **Bottled potions:** become `bp:<recipe>:<rungs>:<dmg.heal.block.draw.sober>:<el>` spells, registered on demand (`dwEnsurePotion`). You can hold up to 4, and they now **stay in your hand across turns** until drunk. A curdle still gives the Botched Brew.
- **Runes:** they are no longer XP-gated (`wz_carve` is level 1). A rune wakes when a known recipe uses it (`wzRuneAwake`). The Rune Circle lists every recipe with its rune sequence and full-brew effect, and each rune shows its brew gift and which recipes use it.
- **Run specials (`DW_SPECIALS`, pick 1 of 2 at the start of each run):**

  | Special | Effect |
  |---|---|
  | 🍸 Happy Hour | sweet spot 3 wide (`build.sweet`) |
  | 🔥 Flaming Shots | fire +3 per hit (`build.fireBonus`) |
  | 🧊 On the Rocks | ice gem effect |
  | 🍺 Open Bar | free Small Draught every fight |
  | 💰 Double or Nothing | rooms drop ×2, minions +30% health |
  | 💀 Last Orders Only | tavern heals only 40%, coins ×2 |

- **Saved runs:** runs persist (`S._dwRun`, validated in migrate). Reloading between fights resumes the run; reloading mid-fight restarts that fight.
- **Best record:** `S.dwBest` tracks the most floors cleared in one run and the deepest floor reached, shown on the idle screen.

## v10 — longer floors, mini-bosses, the Last Call, no trainer

- **Floor layout (`DW_FLOOR_ROOMS`):** rooms per floor go 2, 2, 2, 2, 2, 3, 3, 3, 3, 2 (floors 1–10). Room 1 has 2 minions, room 2 has 3 from floor 4, and room 3 has 3 more (`dwRoomFoes(boss, n)`). From floor 4 a **★ mini-boss** room sits before each rival, so a full run from floor 1 is 41 fights.
- **Mini-bosses (`DW_ELITES`, ids `e_<boss>`):** HP is 40 + 24·floor and hits are 6 + 3·floor. They have a crown and a pink glow and are drawn larger, and the HUD shows their trait banner. On floors 7–9 a minion comes with them. Each one has a **trait**, implemented in the engine (`DW_TRAITS`):

  | Floor | Mini-boss | Trait |
  |---|---|---|
  | 4 | The Bloody Baron-Tender | 🍷 spill: each hit you land adds +1 daze to you |
  | 5 | Fenrir Grey-Goose | 😤 rage: +2 strength every turn |
  | 6 | The Inquisi-Tonic | 🛡 armour: a fresh 8-point ward every turn (plus decrees) |
  | 7 | The Azkaban Bouncer | 🩸 leech: heals 50% of the damage it deals |
  | 8 | The Monster Book of Booze | 🌵 thorns: each hit you land deals 2 damage to you |
  | 9 | The Goblet of Fire-Water | 🍷 spill |
  | 10 | Peter Petti-Grog | 📣 rally: summons Vodkamort's minions |

  A mini-boss drops +2 ingredients and **two** reward picks (`r.morePicks`).
- **THE LAST CALL:**
  - Vodkamort's floor has no checkpoint (`dwCheckpointOK` is false for him).
  - A run that starts on any floor other than 1 ends at Veela (`dwRunLast`, `r.noFinal`); the map shows a locked F10 with the note "only for a run from floor 1".
  - Selecting Vodkamort starts a full run from floor 1. He never takes a quick XP wager (`dwFoe` redirects that to Veela).
  - Beating him pays 8× his purse plus 5 ingredients and increments `S.dwLastCall`, which is shown on the idle screen.
  - Older saved runs are migrated: Vodkamort nodes are removed if the run didn't start on floor 1.
- **Tonight's Specials reworked (`DW_PERKS`):** there is no longer a pick at the door. The **tavern after every rival** offers 3 specials; you order one, and it lasts the whole run and stacks with the others.

  | Special | Effect |
  |---|---|
  | 🍸 Happy Hour | sweet spot 3 wide |
  | 🔥 Flaming Shots | fire +3 per hit |
  | 🧊 On the Rocks | freezes last 2 turns |
  | 🍺 Open Bar | free Small Draught each fight |
  | 🫀 Iron Liver | +2 liver (`build.capBonus`) |
  | 🍲 Hearty Stew | +10 max HP (`build.hpBonus`, `dwRunMaxHp`) |
  | 🥃 The Chaser | first spell each fight costs 0 proof |
  | 🍀 Second Wind | rooms heal 25% instead of 15% |

  Double or Nothing and Last Orders Only were dropped.
- **No trainer:**
  - The coach chips are gone (only the "sleeping it off" notice remains).
  - END TURN no longer predicts the damage you'll take, and the HP bar no longer previews it.
  - The cocktail legend lost its tutorial sentence.
  - Foe intents above their heads stay.
- **Fixes:**
  - Summoned minions now get a random pattern start (the assignment had been swallowed by a comment).
  - The 📣 summon intent showed as "🍸+3 DAZE".
  - Tavern text showed literal `<b>` tags.
- **Balance (node sim `dsim2.js`, depth-3 lookahead bot, with run rewards and 2 cauldron potions):**

  | Run | Build | Full-clear rate |
  |---|---|---|
  | F1–F4 | early | ~20% |
  | F1–F6 | mid | ~40% |
  | F4–F9 | full | ~60% |
  | Full Last Call | full | 0/12 |

  On the full Last Call, a quarter of runs reach Vodkamort himself. It is meant to be the endgame.

## v11 — rooms are teams (target priority matters)

- **Minion roles (`DW_ROLES`):**
  - Each role shows its icon next to the minion's name on the canvas.
  - The room's roles are explained in a roster strip above the hand.
  - Roles are reassigned per floor, so each floor teaches a threat.

  | Role | What it does |
  |---|---|
  | ⚔ Brute | Hits, then spends a turn on ⏳ CHARGE (+ ward), then a 💥 hit for 1.9× damage. Kill, stun or freeze it before the big hit lands. |
  | 🗡 Pest | Many small hits. |
  | 💚 Medic | `mend` heals its most-hurt friend for 4 + 3·floor. A boss only gets half. |
  | 🍸 Spiker | Adds daze. |
  | 📣 Hype | `rally` gives +1 strength to the whole room, permanently, and stacks. |
  | 🛡 Guard | While it stands, your spells do HALF damage to every other foe (`dwGuarded`, applied in `dwHitDmg`; cards show "🛡 GUARDED: ½"). Poison and flambé get through. |

- **Floor line-ups:**

  | Floor | Minions |
  |---|---|
  | 1 Filch | hype cat + brute armour |
  | 2 Trela | spiker teacup + medic sherry |
  | 3 Troll | pest rat + hype pixie |
  | 4 Snapps | medic cauldron + brute snake |
  | 5 Bella | guard bouncer + pest spectre |
  | 6 Umbridge | medic plate + spiker decree |
  | 7 Dementors | pest grindylow + guard lost soul |
  | 8 Lockheart | hype book + spiker fan club |
  | 9 Veela | medic flute + guard suit |
  | 10 Vodkamort | guard death-eater + hype hatchling |

- **Room rules:**
  - A room never doubles up a guard or a medic (`dwRoomFoes`).
  - Bosses summon the non-guard minion first.
- **Minion stats:**
  - Hit value v = 3.5 + 1.5·floor.
  - HP by role:

    | Role | HP |
    |---|---|
    | Brute | 12 + 7f |
    | Pest | 8 + 5f |
    | Medic | 10 + 5f |
    | Spiker | 8 + 5f |
    | Hype | 9 + 5f |
    | Guard | 12 + 6f |

- **New spell:** BOMBARDA BARREL-RUM (`barrel`), proof 3, 4/6 damage to EVERY foe (`s.aoe`). It costs 20🪙 + 2 cork + 1 tea and is also in the run reward pool. It's the answer to medic-heavy rooms, but guards halve it.
- **Rooms now heal 20%** (Second Wind: 30%).
- **Balance:**
  - Sim harness: `psim.js`, a lookahead bot that also chooses targets, compared with naive (lowest HP first), high-HP-first and random targeting.
  - Floors 1–3 with the early build: smart 100%, naive 50%, random 20% (v10 random was 50%), so target choice now matters.
  - The bare build (no runes) clears floors 1–3 about 50% with perfect play and about 20% naively. Upgrades are needed by floor 3.
  - Doing nothing for three turns on floor 1 takes you from 38 to 8 HP.
