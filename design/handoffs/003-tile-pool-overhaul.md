STATUS: DONE

# 003 — Tile pool overhaul: works anywhere, no strangers, no bosses, question rounds, water card, three answer games

## Why
David reviewed every rollable outcome (Oct 12–16, Cowork docs `tile-pool-review.md` v5, `tile-pool-round2-decisions.md`, `app-content-decks.md`). The verdict: too many tiles need a specific drink, venue, kit or stranger; some are cringe; question games should be rounds; water should be a power-up, not a nag. Every tile must work in any bar in any city without moving the group.

## Defaults chosen in Cowork (David can override before build)
- AVENGERS ASSEMBLE (Wheel slice): dropped — the new sip tiles cover it.
- SNAPPOSSIBLE "Defo picture": read as "a famous picture the app describes in text".
- Water cards: hold max 2.
- **Boss mechanic removed entirely (David, Oct 16).** SPLIT THE G survives as a normal tile.
- Jester and other classes are parked. Only remove what breaks (see "Wheel removal").

## Global rules for all tile copy
- Every tile body ends with one example line, formatted `e.g. …` (render it dim/italic under the body, like the existing win line).
- No strangers. Ordering a drink is the only contact outside the squad. One approved exception: STRANGER THINGS.
- Tone stays hype/funny (CLAUDE.md rule 3). No water nagging — the Water Card is a reward.

---

## A. Remove from TILES (and from TILE_DARE, TILE_WIN, TILE_NEEDS, TILE_MIN_PULLS, BOSS_WEIGHTS, TILE_RENAMES targets as relevant)
RAW POWER (replaced by UNLIMITED POWER), KEBAB TO THE FUTURE, THE FOUNTAIN OF YOUTH, EXECUTE ORDER WATER, THE BENCHWARMER, HOME ALONE: PINT FOR ONE, SHOW ME THE MONEY, BIG DOINK, BLACK MIRROR, COUNT DRUNKULA, THE ILLUMINALE HANDSHAKE, A QUIET PLACE, ARM OF STEEL (replaced by THUMB WARS), all 3 × WHEEL OF CHAOS, THE PADDINGTON RAID, YOU SHALL NOT PASS, PROFESSOR X READS THE ROOM, NEVER HAVE I EVER: SNYDER CUT (merged), MILLION DOLLAR PUNCH, THE SLOTFATHER, DIRTY DANCE FLOOR, A BEER ON ELM STREET, FRIENDLY NEIGHBOURHOOD BREW (merged into FIRST CONTACT), THE FAMILY FEUD (replaced by NO CAP, SHERLOCK).

Saves: a run saved mid-tile on a removed tile must still finish (the tile copy is persisted on `S.currentTile`; verify). `migrate()` must tolerate removed names anywhere they're stored (history, souvenirs, flags).

## B. Rewrites of existing tiles (keep type unless noted)
| Tile | New body (+ example) | XP | Notch |
|---|---|---|---|
| UNLIMITED POWER (SHOT→BEER, replaces RAW POWER) | Only you: order the strongest beer on tap, whatever this bar calls strong. Raise it like a Sith Lord who just found the cellar. *e.g. The 9% Belgian tripel at the bottom of the menu. Yours.* | 30 | 2 |
| SPLIT THE G (BOSS→BEER, normal tile) | One pint of Guinness, one gulp, land the line on the G. **No Guinness?** Any pint in a branded glass — land it on the logo. **No logo either?** The squad races to chug a beer; fastest wins. Keep the PERFECT/CLOSE/MISS lines but drop the BOSS FIGHT wording. *e.g. The line stops dead on the G. Statue pending.* | 35 | 2 |
| BABY GUINNESS | Keep. Add: no Baileys or Kahlúa? Any sweet or layered shot on the menu. *e.g. A round of tiny pints, six seconds of connoisseurship.* | 20 | 2 |
| MINECRAFT BEER TASTING | The squad picks a beer off the menu for you. Review it out loud like a sommelier who just learned the word. *e.g. "Notes of grapefruit, regret and a hint of Tuesday."* | 20 | 1 |
| BEER: FIRST CONTACT | Keep, add "local brews count double the bragging rights". *e.g. Never had a sour? Now you have.* | 15 | 1 |
| LOST IN TRANSLATION TOAST | 60 s: toast in five languages. Each squadmate may feed you one. (Remove the stranger line.) *e.g. Cheers, Skål, Prost, Salud, Kanpai!* | 30 | 2 |
| KNIVES OUT: THE ALIBI | Keep setup. Win/lose: **stories clash → you and {LEFT} finish your drinks; stories match → every questioner drinks.** *e.g. "What were you eating?" You: pizza. {LEFT}: sushi. Bottoms up.* | 30 | 1 |
| DRAW ME LIKE YOUR FRENCH GIRLS | 60 s to draw a squadmate on your phone. The others guess who. Nobody gets it → you drink. *e.g. Huge beard, tiny hat — "It's Tom!"* | 25 | 1 |
| THE FOOS AWAKENS (BOSS→PHYS) | 1v1 to 5 goals; spinning allowed. Loser drinks. Drop the BOSS FIGHT wording. Keep the TILE_NEEDS free swap. *e.g. 4–4, last ball, total silence.* | 30 | 3 |
| GAME OF PONGS | Keep. Add a **NO TABLE? PLAY QUARTERS** button on the card: bounce a coin into a glass (no coin → bottle cap → balled-up napkin), 3 tries each, worst drinks. The Quarters version pays **10 XP**. *e.g. Clink. First try. Unbearable.* | 25 / 10 | 3 |
| BLACKJACK SPARROW / 50 SHADES OF RED | Played **in the app**, stake is sips, no casino, no money. **Gambler only** — never in the pool for other classes. Reuse the Den's blackjack/roulette code if it fits; otherwise a simple one-hand deal / one red-black spin. Losing = drink the staked sips. Remove "Bring ID"/casino venue text and their TILE_NEEDS. | 35 | 2 |
| SPEED: RIDE THE BUS | The app deals: 4 screens (red/black → higher/lower → in/out → suit), one card each; wrong guess = drink, blow the last row = "on the bus". Remove its TILE_NEEDS (no deck needed). *e.g. Red. Higher. Outside… hearts? Spades. On the bus.* | 30 | 1 |
| MISSION: SNAPPOSSIBLE | The app describes one famous picture from a list; the squad recreates it, photo into the group chat. List (text only, no images): Abbey Road crossing · Titanic "I'm flying" · The Last Supper · The Creation of Adam fingers · Rocky on the steps · Lunch atop a skyscraper · The Beatles' jump · Napoleon crossing the Alps · American Gothic · The Thinker. *e.g. Two of you, one bar stool, "I'm flying" — full commitment.* | 30 | 3 |
| THUMB WARS (replaces ARM OF STEEL) | Best of three thumb wars against {LEFT}. Loser drinks. *e.g. "1, 2, 3, 4, I declare a thumb war…"* | 20 | 2 |
| DARTH 501 | Fix the mismatch: rules say 501 (keep title). | 25 | 3 |
| A STAR IS BOOZED | Keep; make the phone-speaker version the default text (karaoke machine = bonus). | 35 | 3 |

## C. Question games become ROUNDS (everyone takes a turn)
Rewrite the body so everyone at the table asks one; the person who rolled goes first. Keep XP; the roller wins if they finished the round without drinking (update TILE_WIN).
- RED PILL OR BLUE PILL — everyone asks one would-you-rather, point left/right on three, minority drinks. *e.g. Only warm beer forever, or only flat beer forever?*
- THE USUAL SUSPECTS — everyone asks one "most likely to…", point on three, most-pointed drinks. *e.g. Most likely to text an ex tonight?*
- NEVER HAVE I EVER — everyone says one; whoever has done it drinks. *e.g. Never have I ever fallen asleep in a taxi.*
- LIAR LIAR, PINTS ON FIRE — everyone tells two truths and a lie. Table spots your lie → you drink; table misses → they drink. *e.g. I've met a footballer / been to Iceland / can juggle.*
- WHO WANTS TO BE A PINTIONAIRE — everyone gets 3 questions about the person on their left; fewer than 2 right → drink. *e.g. Sam's middle name? Favourite pizza? First concert?*
- STARS IN YOUR BEERS — everyone gets a famous person picked by the squad; yes/no questions; last to guess drinks. *e.g. "Am I real?" "No." "Am I green?" "…Shrek?"*
Also add an `e.g.` line to every other kept tile (KING'S SPEECH, GUARDIANS OF THE JUKEBOX, GRANDMASTER THUMB, WORD BAN, INTERVIEW, 2 FAST 2 TOAST, COMPLIMENT KOMBAT, MIRROR MIRROR, IRON THRONE, STARE WARS, RPS, LAST ORDERS, FIZZ BUZZ, RHYME CHAIN, CATEGORY IS, ONCE UPON A PINT, STOUTSHANK, TOP FLIP, POOL FICTION, DEER SHOTTER, TOKYO DRIFT, PIRATES OF THE CHEAP LAGER). Examples are in Cowork doc `tile-pool-review.md` v5.

## D. Remove the boss mechanic
- No more bosses, rolled or otherwise. Remove `T.BOSS` from `SLOT_BASE_WEIGHTS`, `BOSS_WEIGHTS`, the boss branch in `pickTileOfType`, boss-only UI/copy (BOSS FIGHT banners, "boss" in the Daring Dial notch 4 text and help), and the TROPHY souvenir.
- SPLIT THE G and THE FOOS AWAKENS are normal tiles (see B).
- Retire the boss-marks / avenge system (`bossMarks`, `bossesAvenged`, the counter that reads `['gsplit','bouncer']`). Leave the saved fields harmless in `freshState`/`migrate`; just stop using and showing them. List anything else that depended on bosses in the result file.
- Achievements: keep `gsplit` but reword to "Split the G" (still set when that tile is won). Remove the `door` achievement (YOU SHALL PASS) and its `flags.bouncer` setter — no replacement.
- Daring Dial notch 4 OUT THE DOOR copy: "Boss fights, the casino, the next pub." → "The next pub, the unknown, wherever the night points."

## E. New tiles
| Name | Type | Notch | XP | Body + example |
|---|---|---|---|---|
| ONE SMALL SIP FOR MAN | BEER | 1 | 5 | Take a sip. That's it. History is made. *e.g. One sip. Neil would be proud.* |
| THE TWO TOWERS | BEER | 1 | 6 | Two sips. One for each tower. *e.g. Sip, sip. Middle-earth nods.* |
| THE THREE SIPKETEERS | BEER | 1 | 8 | Three sips. All for one. *e.g. Sip, sip, sip — en garde.* |
| FINISH HIM! | BEER | 2 | 12 | Finish your drink. Fatality. *e.g. Half a pint left? Not any more.* |
| INTO THE UNKNOWN | MOVE | 4 | 15 | The next bar has to be one none of you has been inside. First lit door that fits. *e.g. You've all done the Irish pub — the tiny wine bar next door it is.* |
| STRANGER THINGS | MOVE | 3 | 15 | Ask the bartender or a local where they'd go next. You go. No vetoes. *e.g. "The basement place with the jukebox." That's the plan now.* |
| THE UPSIDE DOWN | MOVE | 4 | 15 | Spin a phone on the table. Walk the way it points. The first bar you reach is the next one, no vetoes. *e.g. It points down the alley. The alley has a karaoke bar. Fate.* |
| SAY MY NAME (from Wheel) | SOCIAL | 2 | 15 | The squad votes you a nickname. It's legally binding for the rest of the night. *e.g. You are now "Captain Nachos". Respond to it.* |
| METHOD ACCENT (from Wheel) | SOCIAL | 2 | 20 | Fake accent for 10 minutes — the squad picks which. Slip out and you take 2 sips. *e.g. Pirate it is. Arrr, another pint.* |
| DOUBLE TROUBLE XP (from Wheel) | SOCIAL | 1 | 10 | Your next tile is worth double (reuse the Wheel's `doubleNext`). *e.g. Next one's a thumb war? Make it count.* |
| NO CAP, SHERLOCK (replaces FAMILY FEUD) | SOCIAL | 1 | 25 | Deck game, see F. |
| HIGHER OR LAGER | SOCIAL | 1 | 25 | Deck game, see F. |
| THE LIMIT DOES NOT EXIST | SOCIAL | 1 | 25 | Deck game, see F. |
| THE WATER CARD | WATER (new) | outside dial | 5 | See G. |
| GHOSTBREWSTERS | BADLUCK | – | 10 | Phone face-down for 15 minutes. Your brewery is haunted: no collecting, building or spending until the ghosts leave. *e.g. Your cellar's dripping 3 beer/min… and you can't touch it.* Mechanic: set `S.brewHauntUntil = now+15min`; brewery production pauses and brewery/shop actions are disabled with a ghost overlay + countdown. Persist; survives reload. |
| THE DESIGNATED BUTLER (replaces BENCHWARMER) | BADLUCK | – | 10 | You fetch every drink for the squad until your next pull, towel over your arm. They still pay. *e.g. "Another round, m'lord?"* |
| PHONE A FRIEND: THE HANGOVER CALL (replaces HOME ALONE) | BADLUCK | – | 10 | Call a friend who isn't here, on speaker. They choose your next drink. *e.g. Your brother says "something blue". Good luck.* |

BADLUCK sub-weights: EXECUTE ORDER WATER is gone, so drop its "far more often" weighting; spread evenly across PIRATES OF THE CHEAP LAGER, GHOSTBREWSTERS, DESIGNATED BUTLER, PHONE A FRIEND.

## F. Deck games (NO CAP, SHERLOCK · HIGHER OR LAGER · THE LIMIT DOES NOT EXIST)
- The roller is the game master. 3 rounds. Card shows the prompt → **REVEAL** → answer → NEXT. After round 3, resolve the tile as normal (roller wins if they never drank — honour system button like other tiles).
- NO CAP: everyone calls FACT or CAP at once; wrong guessers drink.
- HIGHER OR LAGER: two things + a measure; everyone calls which is MORE; wrong guessers drink.
- THE LIMIT DOES NOT EXIST: everyone says a number at once; closest wins, furthest drinks; spot on = hand out 2 sips.
- Data lives inline as three arrays (`DECK_NOCAP`, `DECK_HOL`, `DECK_LIMIT`), one line per entry. Store used ids in `S.deckUsed = {nocap:[], hol:[], limit:[]}` (default in `freshState`, validated in `migrate`); never repeat in a night; when a deck runs dry, reset that deck.
- Content: see the appendix below (copy exactly).

## G. The Water Card
- New type `T.WATER`, base weight 4, outside the Daring Dial (like BADLUCK). Icon 💧. Souvenir: reuse the old MERCY one or add 💧 "BOTTLE".
- Rolling it: "+1 WATER CARD — save it for a tile you don't like." +5 XP. Hold max 2; at max, rolling it pays 15 XP instead.
- `S.waterCards` (default 0, validate 0–2).
- While `S.waterCards > 0`, every tile result card shows a **💧 USE IT** button next to the existing reroll. Tap → toast "Drink a glass of water — fresh tile incoming" → reroll exactly like `useReroll()` but decrements `waterCards`, not `S.skips`. Show the count in the bag next to REROLLS LEFT.
- Remove `T.MERCY` from weights (no tiles left). `heal`/`pace` stays as-is (it's inert).

## H. Wheel of Chaos removal
- Remove `T.CHAOS` from `SLOT_BASE_WEIGHTS`, the WHEEL array, the spin UI, `_wheelSpin` (keep a `migrate` line that clears any saved `_wheelSpin`), `dareOutside` CHAOS, souvenir STICKER.
- Only SAY MY NAME, METHOD ACCENT, DOUBLE TROUBLE move to tiles (section E). All other slices are gone.
- Forfeit text: "until the next Wheel" (STREET BEER navigation) → "until your next pull".
- Achievement `AN AGENT OF CHAOS` (spin the Wheel 5×) → "Use 3 water cards" (`s.waterUsed>=3`).
- Jester (parked): remove the two Wheel lines from his `up` list and set `CHAR_SLOT_BIAS.jester` CHAOS entry to nothing. Note in the result file that the Jester needs a new perk.
- Brewery town art has `wheel:true` (a water wheel building) — unrelated, leave it.

## I. No-strangers text changes (exact)
| Where | Now | New |
|---|---|---|
| QUEST_POOLS stage 3 | THE RECRUITED STRANGER: "Get a stranger to deliver your line to the table — a toast, a rule, a question you planted with them — with the squad never learning you set it up." | THE GHOSTWRITER: "Get one squadmate to deliver your line to the table — a toast, a rule, a question you planted with them — without the rest of the squad learning you set it up." |
| FORFEITS BABY GUINNESS | "…like you mean it, in front of strangers." | "…like you mean it, loud enough for the whole table." |
| FORFEITS CIDER | "…Even the bouncer." | "…Even the coat rack." |
| HOUSE_RULES | "Compliment the bartender before every order. Sincerely." | "Every new drink gets a toast before the first sip." |
| HOUSE_RULES | "Order everything in your best pirate voice." | "Pirate voice at the table until the next bar. Slip-ups sip." |
| DARE_LEVELS lv3 | "Darts, pool, the dance floor, strangers. You cross the room for this one." | "Darts, pool, the dance floor, the next room. You cross the room for this one." |
| Dial help text | "ON YOUR FEET is darts, pool, the dance floor and strangers." | "ON YOUR FEET is darts, pool, the dance floor and the next room." |
| Achievement `door` | YOU SHALL PASS — "Beat The Bouncer" | Removed (see D). |

## Testing
- `node tools/check.js`; `cp pubcrawlers.html docs/index.html`.
- Roll sim (quick node script over `computeSlotWeights` + `pickTileOfType`, 10k pulls per notch per class): no removed tile ever appears; no BOSS or CHAOS anywhere; WATER ≈ 3%; BLACKJACK/RED only for Gambler; report the type shares before/after.
- Playwright at 390×844: water card roll → USE IT on next tile → reroll; GHOSTBREWSTERS lock + reload keeps the lock; each deck game through 3 rounds; RIDE THE BUS deal; no boss UI anywhere; an old save with `_wheelSpin` and a pending removed tile loads with no `pageerror`.
- Update in-game help text (dial help, any Wheel mentions, tutorial/coach copy).

## Done means
All of A–I shipped, sims and screenshots in `003-tile-pool-overhaul.result.md`, design note appended, one commit: `Tiles v1: works-anywhere pool, question rounds, water card, deck games`.

---

## Appendix — deck content (copy exactly)

### DECK_NOCAP (answer in brackets)
1 Honey never spoils — edible honey has been found in ancient Egyptian tombs. [FACT]
2 Octopuses have three hearts. [FACT]
3 Bananas are berries; strawberries are not. [FACT]
4 A group of flamingos is called a "flamboyance". [FACT]
5 Scotland's national animal is the unicorn. [FACT]
6 Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid. [FACT]
7 Wombat poo is cube-shaped. [FACT]
8 The Eiffel Tower grows up to about 15 cm taller in summer. [FACT]
9 Sharks existed before trees. [FACT]
10 Oxford University is older than the Aztec Empire. [FACT]
11 A day on Venus is longer than its year. [FACT]
12 Guinness isn't actually black — it's a very dark ruby red. [FACT]
13 Humans were brewing beer before they invented writing. [FACT]
14 Hops are close relatives of cannabis. [FACT]
15 Nintendo was founded in 1889 as a playing-card company. [FACT]
16 The shortest war in history lasted under an hour. [FACT]
17 The inventor of the Pringles can had some of his ashes buried in one. [FACT]
18 A "jiffy" is an actual unit of time. [FACT]
19 A pineapple takes about two years to grow. [FACT]
20 The Hawaiian alphabet has only 13 letters. [FACT]
21 Butterflies taste with their feet. [FACT]
22 The Mona Lisa has no eyebrows. [FACT]
23 The dot over a lowercase i is called a tittle. [FACT]
24 Ketchup was once sold as medicine. [FACT]
25 There are more possible games of chess than atoms in the observable universe. [FACT]
26 Goldfish have a three-second memory. [CAP]
27 The Great Wall of China is visible from space with the naked eye. [CAP]
28 Napoleon was unusually short for his time. [CAP]
29 Humans only use 10% of their brains. [CAP]
30 Bulls charge because the colour red makes them angry. [CAP]
31 Lightning never strikes the same place twice. [CAP]
32 Bats are blind. [CAP]
33 Einstein failed maths at school. [CAP]
34 You swallow about eight spiders a year in your sleep. [CAP]
35 Vikings wore horned helmets into battle. [CAP]
36 Chameleons change colour mainly to blend into their background. [CAP]
37 Mount Everest is the tallest mountain on Earth measured from base to peak. [CAP]
38 A coin dropped from the top of the Empire State Building could kill someone. [CAP]
39 Alcohol warms your body up. [CAP]
40 "Sushi" means raw fish. [CAP]
41 Ostriches bury their heads in the sand when scared. [CAP]
42 Botanically, a tomato is a vegetable. [CAP]
43 The Titanic was the first ship ever to send an SOS. [CAP]
44 Mars is red because it's so hot. [CAP]
45 Fortune cookies were invented in China. [CAP]
46 One dog year equals exactly seven human years. [CAP]
47 Glass is a slow-moving liquid — that's why old windows are thicker at the bottom. [CAP]
48 Walt Disney's body was frozen after he died. [CAP]
49 Sharks can smell a single drop of blood from a mile away. [CAP]
50 The Danish pastry was invented in Denmark. [CAP]

### DECK_HOL (measure | A | B | answer)
1 Calories | a pint of lager (~200) | a Big Mac (~550) | Big Mac
2 Height | Eiffel Tower (330 m) | Empire State Building roof (381 m) | Empire State
3 Height | Big Ben's tower (96 m) | Statue of Liberty incl. pedestal (93 m) | Big Ben
4 Height | a giraffe (~5.5 m) | a double-decker bus (~4.4 m) | giraffe
5 Alcohol % | Guinness Draught (4.2%) | Heineken (5%) | Heineken
6 Legs | a spider (8) | a lobster (10) | lobster
7 Eyes | a bee (5) | a typical spider (8) | spider
8 Bones | an adult human (206) | a cat (~230) | cat
9 Bones | a human hand (27) | a human foot (26) | hand
10 Teeth | an adult human (32) | a dog (42) | dog
11 Top speed | a cheetah (~110 km/h) | a racehorse (~70 km/h) | cheetah
12 Length | a marathon (42.2 km) | the English Channel at its narrowest (~33 km) | marathon
13 Length | the Great Wall of China (~21,000 km) | Earth's diameter (~12,700 km) | Great Wall
14 Distance | Everest's height (8,849 m) | the Mariana Trench's depth (~10,900 m) | trench
15 Moons | Mars (2) | Earth (1) | Mars
16 Length of a day | Mars (24 h 37 min) | Earth (24 h) | Mars
17 Area | Denmark (~43,000 km²) | Switzerland (~41,000 km²) | Denmark
18 Population | Iceland (~390k) | Malta (~550k) | Malta
19 Weight | a blue whale's tongue (~2.7 t) | an African elephant (~6 t) | elephant
20 Count | squares on a chessboard (64) | cards in a deck (52) | chessboard
21 Count | keys on a piano (88) | strings on a concert harp (47) | piano
22 Players per team | rugby union (15) | Aussie rules (18) | Aussie rules
23 Count | Harry Potter books (7) | Star Wars saga films (9) | Star Wars
24 Year (later = more) | first Moon landing (1969) | first Star Wars film (1977) | Star Wars
25 Year founded (later = more) | Nokia (1865) | Nintendo (1889) | Nintendo
26 Age (older = more) | Weihenstephan brewery (1040) | Oxford University (1096) | Weihenstephan
27 Age (older = more) | Guinness (1759) | Carlsberg (1847) | Guinness
28 Episodes | Friends (236) | The Office US (201) | Friends

### DECK_LIMIT (question | answer)
1 How tall is the Eiffel Tower, in metres? | 330
2 How tall is Mount Everest, in metres? | 8,849
3 How deep is the Mariana Trench, in metres? | ~10,900
4 How many bones are in the adult human body? | 206
5 How many teeth does an adult human have? | 32
6 How many bones are in a giraffe's neck? | 7
7 How many times does your heart beat in a day? | ~100,000
8 How many keys are on a piano? | 88
9 How long is a marathon, in metres? | 42,195
10 How far away is the Moon, in km? | ~384,400
11 How long is Earth's circumference, in km? | ~40,075
12 How many Earths would fit inside the Sun? | ~1.3 million
13 How hot is the surface of the Sun, in °C? | ~5,500
14 How old is the universe, in billions of years? | 13.8
15 How many people have walked on the Moon? | 12
16 How fast can a cheetah run, in km/h? | ~110
17 What's the speed of sound, in km/h? | ~1,235
18 How long is the Nile, in km? | ~6,650
19 How long is the Great Wall of China, in km? | ~21,000
20 In what year did the Titanic sink? | 1912
21 In what year was Guinness founded? | 1759
22 In what year was the first email sent? | 1971
23 How many minutes are in a week? | 10,080
24 How many seconds are in a day? | 86,400
25 How many squares are on a chessboard? | 64
26 How many countries are in the EU? | 27
27 How many languages are spoken in the world? | ~7,000
28 How many plays did Shakespeare write? | ~37
29 How many episodes of Friends are there? | 236
30 How many hearts does an octopus have? | 3
