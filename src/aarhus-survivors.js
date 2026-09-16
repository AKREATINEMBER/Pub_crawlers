/* =========================================================
   AARHUS SURVIVORS — birthday roguelike pub crawl
   Single-file, no backend. Each phone runs its own private run —
   there is no sharing or comparing between phones, by design.
   ========================================================= */

/* ---------- safe storage (degrades to memory) ---------- */
const mem = {};
const store = {
  get(k){ try{ const v = localStorage.getItem(k); return v===null? (k in mem? mem[k]:null) : v; }catch(e){ return k in mem? mem[k]:null; } },
  set(k,v){ mem[k]=v; try{ localStorage.setItem(k,v); }catch(e){} },
  del(k){ delete mem[k]; try{ localStorage.removeItem(k); }catch(e){} }
};

/* ---------- characters ---------- */
const CHARS = [
  { id:'tank',  name:'THE TANK',   hair:'#8a5a2b', body:'#2e6bd6', pants:'#243a6b', acc:'#ffd24a', accType:'crown',
    perk:'STOUT-BLOODED\n+40% XP on beer challenges, -25% on party games\nBeer tiles come up more for you.\nParty games come up less.' },
  { id:'gambler', name:'THE GAMBLER', hair:'#1a1a1a', body:'#111111', pants:'#2b2b2b', acc:'#ff3ea5', accType:'hat',
    perk:'HOUSE EDGE\nDouble XP at the casino, -25% on physical duels\nGambling tiles come up more for you.\nDouble forfeits — you knew the risk.' },
  { id:'jester', name:'THE JESTER', hair:'#ff6a1f', body:'#a45cff', pants:'#4b2d80', acc:'#38f2e0', accType:'horns',
    perk:'CHAOS MAGNET\n+50% XP from the Wheel, +30% on party games, -25% on beer\nParty games and the Wheel come up more.\n1 free re-spin.' },
  { id:'machine', name:'THE MACHINE', hair:'#d6d6d6', body:'#c9182b', pants:'#3a1010', acc:'#6ee36e', accType:'band',
    perk:'RAW POWER\n+50% XP on physical challenges, -25% at the casino\nPhysical tiles come up more for you.\nGambling tiles come up less.' }
];

/* ---------- board: 28 tiles in a 10x6 ring ---------- */
const T = {
  BEER:'beer', GAMBLE:'gamble', PHYS:'phys', SHOT:'shot', CHAOS:'chaos',
  MERCY:'mercy', MOVE:'move', BOSS:'boss', SOCIAL:'social', START:'start', BADLUCK:'badluck', KARAOKE:'karaoke'
};
const TILES = [
  { n:'SKOLEGADE GATE', t:T.START, icon:'⭐', venue:'Skolegade — the dive-bar spine of Aarhus.',
    body:'The prophecy begins. Everyone raises a glass to the birthday boy, patron saint of tonight. Pass here again and the whole squad toasts like it\'s a coronation.', xp:5 },

  { n:'FIRST BEER', t:T.BEER, icon:'🍺', venue:'Væskebalancen, Jægergårdsgade — proper neighbourhood bar.',
    body:'Order a beer you have never had before. This is officially "research." No repeats all night — you\'re building a legacy, not a rut.', xp:15, drink:1 },

  { n:'BEER PONG', t:T.GAMBLE, icon:'🏓', venue:'Anywhere with a flat table and low standards.',
    body:'2v2, best of one, played with the gravity of an Olympic final nobody else knew was happening. Winners choose the next bar. Losers take the forfeit and their dignity, briefly, elsewhere.', xp:25, gamble:true },

  { n:'SPLIT THE G', t:T.BOSS, icon:'🍀', venue:'Tir Na nÓg, Frederiksgade — real Guinness, real judgement.',
    body:'One pint of Guinness. One gulp. Land the foam line exactly on the G in GUINNESS, as the ancient Irish gods intended.\n\nPERFECT SPLIT = legend status, statue optional.\nCLOSE = respect, no statue.\nMISS = forfeit, and the Guinness gods remember your name.', xp:60, drink:1, gamble:true },

  { n:'SHOT ROULETTE', t:T.SHOT, icon:'🥃', venue:'Bartender picks. You do not.',
    body:'Everyone points at someone, democracy at its finest. Most-pointed picks the shot for the whole table, sight unseen. Birthday boy is immune once, because it\'s literally his day.', xp:20, drink:1 },

  { n:'FOOSBALL DUEL', t:T.BOSS, icon:'⚽', venue:'Kælderbar — pool & darts in the middle of town.',
    body:'BOSS FIGHT. 1v1 to 5 goals. Spinning the rods is allowed, morally correct, and quietly the whole point.\n\nWIN: big XP and a career highlight reel.\nLOSE: forfeit and a strategic, dignified retreat to Skolegade.', xp:55, gamble:true },

  { n:'WHEEL OF CHAOS', t:T.CHAOS, icon:'🎡', venue:'',
    body:'The Wheel decides. The Wheel is never wrong. The Wheel does not care about your plans for tomorrow.', xp:10 },

  { n:'STREET BEER', t:T.BEER, icon:'🚶', venue:'Åboulevarden canal walk.',
    body:'Beer to go, walk to the next spot like a Viking on a very relaxed campaign. Denmark permits this joy. Do not be the person who litters — the canal has seen enough.', xp:15, drink:1 },

  { n:'BABY GUINNESS', t:T.SHOT, icon:'🖤', venue:'The Old Irish Pub, Aarhus.',
    body:'Kahlúa, floated Baileys. A tiny, perfect, deceptively strong pint of a pint. Round for the table — everyone becomes a connoisseur for exactly six seconds.', xp:20, drink:1 },

  { n:'PUNCHING MACHINE', t:T.PHYS, icon:'👊', venue:'Any arcade machine you can find in a bar basement.',
    body:'Everyone gets one punch to settle who among you is secretly built like a Norse god. Highest score is safe. Lowest score takes the forfeit and some light ridicule.', xp:30, gamble:true },

  { n:'WATER FOUNTAIN', t:T.MERCY, icon:'💧', venue:'Ask any bar. Danish tap water is free and excellent.',
    body:'MERCY TILE. Whole squad drinks a full glass of water like functioning adults for exactly ninety seconds. Nobody skips this one — the brewery insists.', xp:20, heal:35 },

  { n:'DARTS 501', t:T.PHYS, icon:'🎯', venue:'Kælderbar or Cockney Pub.',
    body:'Quick 301, played with the focus of someone who definitely didn\'t just have a beer. First to zero wins. Last place takes the forfeit, no appeals.', xp:25, gamble:true },

  { n:'RAW POWER', t:T.SHOT, icon:'⚡', venue:'You know the place. You know the bartender.',
    body:'RAW POWER. Full send, all four, at the exact same time, like a synchronized swimming team with worse decisions. Photo evidence required, for the archives.', xp:35, drink:1 },

  { n:'BLACKJACK', t:T.GAMBLE, icon:'🃏', venue:'Royal Casino Aarhus, Store Torv (Hotel Royal). Bring ID.',
    body:'Minimum bet only. One hand each. The dealer takes no prisoners and definitely judges your outfit.\n\nRemember: you never lose when you gamble — you just get a free drink. The house rules, not the casino\'s.', xp:35, gamble:true },

  { n:'WHEEL OF CHAOS', t:T.CHAOS, icon:'🎡', venue:'',
    body:'Spin it. Accept your fate. Resistance is statistically pointless.', xp:10 },

  { n:'50 ON RED', t:T.GAMBLE, icon:'🔴', venue:'Royal Casino Aarhus — roulette table.',
    body:'50 kr on red. That is the whole strategy. That has always been the whole strategy. Wiser men than you have tried more and gotten less.', xp:35, gamble:true },

  { n:'SLOT MACHINE', t:T.GAMBLE, icon:'🎰', venue:'Bar slot machine or the casino floor.',
    body:'One spin each, smallest stake, maximum drama. Biggest winner is exempt from the next forfeit — a title worth fighting for.', xp:25, gamble:true },

  { n:'BIG DOINK', t:T.SHOT, icon:'💥', venue:'Inside joke. You four know exactly what this means.',
    body:'BIG DOINK. No further explanation will be provided by this game, or by anyone, ever, to anyone outside this circle.', xp:30, drink:1 },

  { n:'SKIP THE PUB', t:T.MOVE, icon:'⏩', venue:'',
    body:'This place is dead, spiritually and possibly literally. Finish your drink and move on like royalty who has better places to be — free XP, no challenge.', xp:10 },

  { n:'THE STOUT TRIAL', t:T.BEER, icon:'🍺', venue:'Any pub with a proper stout tap.',
    body:'A full stout, no rushing, sipped with the solemn patience of a monk who brews for a living. 10 minutes minimum. This is a marathon, not a sprint.', xp:30, drink:1 },

  { n:'CRAFT BEER TASTING', t:T.BEER, icon:'🧑‍🔬', venue:'Any bar with more than 3 taps.',
    body:'Order whatever the bartender is proudest of. Rate it out loud like a sommelier who definitely didn\'t just learn the word "sommelier."', xp:20, drink:1 },

  { n:'LOCAL BREW CHALLENGE', t:T.BEER, icon:'🇩🇰', venue:'Any bar pouring something Danish.',
    body:'Something brewed in Denmark, something you\'ve never tried. New beer, new night, new opportunity to have a strong opinion about hops.', xp:20, drink:1 },

  { n:'LATE NIGHT KEBAB', t:T.MERCY, icon:'🥙', venue:'Any kebab shop or grill still open — Aarhus has plenty.',
    body:'MERCY TILE. Everyone eats something real, blessed by the ancient patron saint of 3am decisions. This is the single best play of the night, full stop.', xp:35, heal:50 },

  { n:'8-BALL POOL', t:T.PHYS, icon:'🎱', venue:'Kælderbar or Golfskoven.',
    body:'Doubles, played like the World Championship of Basements. Potting the black early means instant forfeit, obviously — the felt gods do not forgive.', xp:25, gamble:true },

  { n:'WHEEL OF CHAOS', t:T.CHAOS, icon:'🎡', venue:'',
    body:'Third time. The Wheel remembers everything you did to it earlier.', xp:10 },

  { n:'THE BOUNCER', t:T.BOSS, icon:'🕴', venue:'The door of somewhere slightly too nice for you.',
    body:'BOSS FIGHT. Talk your way into a place none of you would normally get into, armed only with confidence and questionable footwear.\n\nWIN: enormous XP and eternal glory.\nLOSE: forfeit and a strategic, dignified retreat to Skolegade.', xp:70, gamble:true },

  { n:'CANAL RUN', t:T.SOCIAL, icon:'🌉', venue:'Åboulevarden — the canal strip.',
    body:'Walk the canal like conquering heroes surveying newly won territory. Everyone must compliment one stranger, genuinely — spread the chaos of kindness, no weirdness.', xp:25 },

  { n:'DANCE FLOOR', t:T.PHYS, icon:'🕺', venue:'Wherever the music is loudest at this hour.',
    body:'One full song, all four of you, no phones, no irony, full commitment to whatever this dance is supposed to be. Birthday boy picks the song, obviously.', xp:35 },

  { n:'PHOTO MISSION', t:T.SOCIAL, icon:'📸', venue:'',
    body:'Recreate a photo from a night out years ago. Same poses, same energy, twice the regret. Post it in the group chat as historical documentation.', xp:30 },

  { n:'LAST ORDERS', t:T.SOCIAL, icon:'🔔', venue:'',
    body:'Everyone says one honest nice thing about the birthday boy, like a very small, very drunk eulogy for a man who is still alive. Then a final round.\n\nThen: kebab, taxi, bed. In that sacred order.', xp:40, drink:1 },

  { n:'ORDER WATER', t:T.BADLUCK, icon:'💧', venue:'',
    body:'BAD LUCK... but make it hydration. The reels have decided you deserve a glass of water, and honestly, fair. Drink the whole thing before your next real drink.', xp:10, heal:20 },
  { n:'THE CERES CURSE', t:T.BADLUCK, icon:'🥴', venue:'',
    body:'BAD LUCK. The Ceres gods have chosen you. Your next beer has to be a Ceres. No substitutions, no complaining, no bargaining with fate.', xp:10, drink:1 },
  { n:'DRINK ALONE', t:T.BADLUCK, icon:'🚶', venue:'',
    body:'BAD LUCK. Drink your next shot completely alone, like a lone wolf who mildly regrets his choices. Nobody joins you this time.', xp:10, drink:1 },
  { n:'SIT ONE OUT', t:T.BADLUCK, icon:'⏳', venue:'',
    body:'BAD LUCK. Skip a whole round. No drink, no challenge — just sit there, watching everyone else go, contemplating the nature of chance.', xp:5 },
  { n:'BUY THEM IN', t:T.BADLUCK, icon:'🎁', venue:'',
    body:'BAD LUCK. Invite someone outside the squad to join you for a beer. You are now, briefly, a diplomat. Represent well.', xp:15 },

  { n:'THE NUMBER GAME', t:T.SOCIAL, icon:'🔢', venue:'',
    body:'Count upward around the group — 1, 2, 3... First to hesitate, mess up, or say the wrong number drinks. Restart from 1, dignity intact but questionable.', xp:20, gamble:true },
  { n:'FAMOUS PERSON', t:T.SOCIAL, icon:'🎭', venue:'',
    body:'Someone picks a famous person for you — you don\'t know who. Yes/no questions only until you guess. Last to guess drinks and questions their entire cultural literacy.', xp:25, gamble:true },
  { n:'NEVER HAVE I EVER', t:T.SOCIAL, icon:'🙊', venue:'',
    body:'Go around the circle. Say something you have never done. Anyone who HAS done it drinks. No judgment, just consequences and a very specific kind of eye contact.', xp:20, drink:1 },
  { n:'RIDE THE BUS', t:T.SOCIAL, icon:'🚌', venue:'',
    body:'Classic card game — guess red/black, higher/lower, in/out, and the suit. Wrong guess, you drink. Blow the final row and you\'re "on the bus," a title nobody wants and everybody remembers.', xp:30, gamble:true },
  { n:'WHICH IS MORE POPULAR', t:T.SOCIAL, icon:'📊', venue:'',
    body:'Someone names two things. Everyone secretly guesses which one is actually more popular. Whoever\'s wrong drinks and loses all confidence in their worldview.', xp:20, gamble:true },
  { n:'MOST LIKELY TO', t:T.SOCIAL, icon:'👉', venue:'',
    body:'"Most likely to..." — say a scenario, everyone points at who fits, chaos and betrayal ensue. Whoever gets pointed at most drinks.', xp:20, drink:1 },
  { n:'TWO TRUTHS AND A LIE', t:T.SOCIAL, icon:'🎯', venue:'',
    body:'Tell the group two true things and one lie about tonight so far. Guess wrong as a group, everyone drinks — a shared punishment, democratically earned.', xp:20, drink:1 },
  { n:'KATEGORIER', t:T.SOCIAL, icon:'🗂️', venue:'',
    body:'Pick a category — beers, cities, footballers. Go around naming one each. First to repeat, blank, or break rhythm drinks, and takes the shame with it.', xp:20, gamble:true },

  { n:'KARAOKE NIGHT', t:T.KARAOKE, icon:'🎤', venue:'Any bar with a karaoke machine, or your own phone speaker if you\'re desperate.',
    body:'Whole squad picks one song together, a decision that will define the rest of the night. Everyone sings at least one line — no hiding behind harmonies, no pretending you don\'t know the words. History is watching. This only happens once.', xp:35, gamble:true }
];
// within a BADLUCK result, ORDER WATER should come up far more than the other curses
const BADLUCK_WEIGHTS = { 'ORDER WATER':45, 'THE CERES CURSE':15, 'DRINK ALONE':15, 'SIT ONE OUT':10, 'BUY THEM IN':15 };

/* ---------- wheel of chaos ---------- */
const WHEEL = [
  { n:'EVERYONE DRINKS',   c:'#ff3ea5', d:'All four of you. Right now. No negotiation.', xp:15, drink:1 },
  { n:'SPLIT THE G',       c:'#6ee36e', d:'Nearest Guinness. Whoever splits it closest is immune to the next forfeit.', xp:25, drink:1 },
  { n:'SWAP JACKETS',      c:'#38f2e0', d:'Swap outer layers with the person to your left. Keep them until the next Wheel.', xp:15 },
  { n:'NEW NICKNAME',      c:'#ffd24a', d:'The birthday boy gives you a nickname. It is legally binding for the rest of the night.', xp:15 },
  { n:'DANSK KUN',         c:'#a45cff', d:'Danish only for 10 minutes. English costs you a street beer.', xp:20 },
  { n:'STREET BEER',       c:'#ff9d3d', d:'Beer to go. Walk somewhere new. Bin it properly.', xp:15, drink:1 },
  { n:'BABY GUINNESS',     c:'#e8e4ff', d:'A round of Baby Guinness. Small. Perfect. Devastating.', xp:20, drink:1 },
  { n:'SKIP THE PUB',      c:'#38f2e0', d:'Leave now. Next venue. Free XP, no challenge.', xp:15 },
  { n:'WATER ROUND',       c:'#6ee36e', d:'MERCY. Full glass of water each. Free 30 XP because hydration is elite.', xp:30, heal:30 },
  { n:'PHONE IN POCKET',   c:'#ff4d5e', d:'Phones away for 15 minutes. First person to check theirs takes a forfeit.', xp:20 },
  { n:'DOUBLE XP',         c:'#ffd24a', d:'Your next tile is worth double. Choose your moment.', xp:10, doubleNext:true },
  { n:'BUY A ROUND',       c:'#a45cff', d:'You buy the next round. Yes, you. The Wheel has spoken.', xp:25, drink:1 }
];

/* ---------- forfeits (gambling never loses) ---------- */
const FORFEITS = [
  { n:'STOUT',       d:'A full stout. Slowly. That is the punishment and the reward.', drink:1 },
  { n:'STREET BEER', d:'Beer to go, and you carry everyone else\'s coats to the next place like a very sad coat rack.', drink:1 },
  { n:'SHOT',        d:'Bartender\'s choice shot. No complaints, no negotiating, no making a face about it.', drink:1 },
  { n:'STREET BEER', d:'Street beer, and you are on navigation duty until the next Wheel. Google Maps has never trusted a drunker man.', drink:1 },
  { n:'CIDER',       d:'A full cider, and you must speak only in compliments for the next five minutes. Everyone is beautiful. Everyone. Even the bouncer.', drink:1 },
  { n:'STREET BEER', d:'Street beer, and you owe the group one (1) dramatic reenactment of how this happened, on request, any time tonight.', drink:1 },
  { n:'BABY GUINNESS', d:'One Baby Guinness, and you have to say "skål" like you mean it, in front of strangers.', drink:1 },
  { n:'HOUSE WINE',  d:'A glass of whatever\'s open. Denmark doesn\'t judge, and neither should you.', drink:1 }
];

/* ---------- economy: souvenirs, relics, items ---------- */
const SOUVENIRS = {
  [T.BEER]:   { icon:'🍺', n:'COASTER' },
  [T.SHOT]:   { icon:'🥃', n:'BOTTLE CAP' },
  [T.GAMBLE]: { icon:'🎲', n:'POKER CHIP' },
  [T.PHYS]:   { icon:'🎯', n:'WRISTBAND' },
  [T.SOCIAL]: { icon:'📸', n:'POSTCARD' },
  [T.BOSS]:   { icon:'🏆', n:'TROPHY' },
  [T.CHAOS]:  { icon:'🎡', n:'STICKER' },
  [T.BADLUCK]:{ icon:'🪞', n:'BROKEN MIRROR' },
  [T.KARAOKE]:{ icon:'🎤', n:'MICROPHONE' }
};

// items with a "char" field are exclusive to that character's shop — everyone else never even sees them
const RELICS = [
  { id:'luckyhat', n:'THE UNREASONABLY LUCKY HAT', icon:'🎩', d:'Nobody can explain why it works. It just works. Your first failed challenge each lap counts as a win instead. Also +0.3 beer/min — permanently.', price:70, brewBonus:0.3 },
  { id:'energy',   n:'LIQUID COURAGE (BOTTLED, LEGAL)', icon:'⚡', char:'machine', d:'The Machine treats this as a food group, not a beverage. Keeps you sharp all night, or at least convincingly upright. Also +0.3 beer/min — permanently.', price:55, brewBonus:0.3 },
  { id:'ring',     n:"THE GAMBLER'S SIGNET RING", icon:'💍', char:'gambler', d:'Standard-issue equipment for every Gambler at birth, allegedly. +25% XP on every gambling tile. Also +0.4 beer/min — permanently.', price:65, brewBonus:0.4 },
  { id:'shoes',    n:'SHOES OF SUSPICIOUSLY GOOD BALANCE', icon:'👟', char:'jester', d:'The Jester\'s preferred method of avoiding responsibility at high speed. MOVE tiles send you 2 extra squares. Also +0.2 beer/min — permanently.', price:45, brewBonus:0.2 },
  { id:'shades',   n:'SUNGLASSES AT NIGHT (ICONIC, NOT PRACTICAL)', icon:'🕶️', d:'Look effortlessly cool doing literally any of this. Also +0.3 beer/min — permanently.', price:55, brewBonus:0.3 },
  { id:'bottomlessstein', n:'THE BOTTOMLESS STEIN', icon:'🍺', char:'tank', d:'Rumored to never actually empty. An extra +25% XP on top of your already absurd beer bonus. Also +0.3 beer/min — permanently.', price:60, brewBonus:0.3 },
  { id:'loadeddice', n:"LOADED DICE (DON'T ASK)", icon:'🎲', char:'gambler', d:'Definitely not legal at the actual casino. An extra +25% XP on gambling tiles, stacking on the House Edge. Also +0.3 beer/min — permanently.', price:60, brewBonus:0.3 },
  { id:'jokerscap', n:"THE JOKER'S CAP", icon:'🃏', char:'jester', d:'Bells that only you can hear, apparently. An extra +25% XP on party games and the Wheel. Also +0.3 beer/min — permanently.', price:60, brewBonus:0.3 },
  { id:'ironknuckles', n:'IRON KNUCKLES', icon:'👊', char:'machine', d:'Not technically legal in darts. An extra +25% XP on physical challenges, stacking on Raw Power. Also +0.3 beer/min — permanently.', price:60, brewBonus:0.3 }
];

const CONSUMABLES = [
  { id:'fakeid',    n:"THE WORLD'S MOST CONVINCING FAKE ID", icon:'🪪', char:'tank', d:'The Tank\'s go-to for doors, dealers, and one very specific ex. Auto-wins your next challenge tile, no questions asked.', price:25 },
  { id:'icebucket', n:"ONE MORE SPIN, I SWEAR", icon:'🔁', d:'Instantly refills a reroll — spin the lever again for free. Famous last words.', price:15 }
];

/* ---------- secret missions (one assigned privately per run) ---------- */
const MISSIONS = [
  { n:'THE FAKE TRADITION', d:'Invent a fake "tradition" right now (e.g. "you always down your drink when someone drops a coaster"). Get at least 2 others to actually follow it later, unprompted, like it\'s a real rule.', xp:90 },
  { n:'THE COUNTERFEIT WORD', d:'Pick a totally made-up word right now (something dumb, like "grimbleton"). Slip it into conversation once yourself, then get 2 others to say it back later — unprompted, as if it\'s a real word.', xp:90 },
  { n:'THE NAVIGATOR', d:'Silently pick a specific venue in your head right now. Get the squad to end up there next WITHOUT you naming it out loud first — someone else has to suggest it.', xp:95 },
  { n:'SKÅL SIMON SAYS', d:'Secretly start a 10-minute timer. Get all 3 others to individually say "skål" before it runs out — without ever calling a group toast yourself.', xp:100 },
  { n:'THE FALSE COMPLIMENT', d:'Pick one specific, slightly absurd compliment right now (e.g. "incredible taste in shoes"). Get 2 different people to say that exact compliment to the birthday boy tonight.', xp:85 },
  { n:'MATCHING ORDERS', d:'Order a specific drink. Without telling anyone what it is, get all 3 others to independently order that exact same drink at some point tonight.', xp:95 },
  { n:'THE FAKE EXCUSE', d:'Invent one specific fake reason right now (e.g. "that place looked closed") to skip a venue that was actually on the plan — and get the squad to actually skip it because of your excuse.', xp:85 },
  { n:'THE PLANTED LIE', d:'Tell the squad one small, harmless, made-up "fact" about Aarhus or the birthday boy right now. Catch at least one of them repeating it to someone else later as if it\'s true.', xp:95 },
  { n:'THE RELUCTANT ROUND', d:'Without asking directly or offering to pay yourself, get one specific person you pick right now to be the one who buys the next full round.', xp:80 },
  { n:'ONE MORE FOR THE ROAD', d:'At the exact moment someone says "I think I\'m done," get the squad to do one more challenge or drink anyway — reverse the room without arguing about it.', xp:85 }
];

/* ---------- tier 2: high risk / high reward — unlocks only after completing your first secret mission ---------- */
const TIER2_MISSIONS = [
  { n:'THE DOUBLE AGENT', d:'Plant the same idea separately with TWO different squad members. Get both of them to independently claim credit for it — to each other — without either realizing where it actually came from.', xp:180 },
  { n:'THE RUMOR MILL', d:'Start a small, harmless rumor about YOURSELF right now. Get it repeated back to you by someone who heard it from someone else — not directly from you.', xp:170 },
  { n:'THE LONG CON', d:'Plant a specific running joke or callback line right now. Get all 3 others to use it unprompted, on their own, at least twice each before the night is over.', xp:190 },
  { n:'THE SILENT MAJORITY', d:'Get the whole squad to unanimously agree on a decision — next venue, next drink, whatever — while you never once state a preference out loud. Steer it entirely through questions.', xp:175 },
  { n:'THE IMPOSTER TOAST', d:'Plant an exact toast phrase with one specific person. Get them to call the toast to the whole group using your exact words, believing it was their own idea.', xp:180 },
  { n:'THE FULL LOOP', d:'In one continuous stretch of the night: plant an idea, get someone to repeat it, and get a THIRD person to credit it to the wrong squad member. All three, before anyone catches on.', xp:200 }
];

const ACHIEVEMENTS = [
  { id:'first',  n:'FIRST BLOOD',      d:'Complete your first challenge',  test:s=>s.wins>=1 },
  { id:'lap',    n:'LAP OF AARHUS',    d:'Pass GO once',                   test:s=>s.laps>=1 },
  { id:'gsplit', n:'SPLIT THE G',      d:'Beat the Guinness boss',         test:s=>s.flags.gsplit },
  { id:'door',   n:'DOORMAN SLAYER',   d:'Beat The Bouncer',               test:s=>s.flags.bouncer },
  { id:'hydro',  n:'HYDRO HOMIE',      d:'Drink water 3 times',            test:s=>s.waters>=3 },
  { id:'lucky',  n:'HOUSE FAVOURITE',  d:'Win 3 gambles',                  test:s=>s.gambleWins>=3 },
  { id:'chaos',  n:'CHAOS ADDICT',     d:'Spin the Wheel 5 times',         test:s=>s.spins>=5 },
  { id:'secret', n:'DOUBLE LIFE',      d:'Complete your secret mission',   test:s=>s.secretDone },
  { id:'lv5',    n:'HALFWAY LEGEND',   d:'Reach level 5',                  test:s=>s.level>=5 },
  { id:'lv10',   n:'AARHUS SURVIVOR',  d:'Reach level 10',                 test:s=>s.level>=10 },
  { id:'fullset', n:'AARHUS COMPLETIONIST', d:'Collect every souvenir type', test:s=>Object.keys(SOUVENIRS).every(t=>(s.souvenirs&&s.souvenirs[t])>0) },
  { id:'brewmaster', n:'MASTER BREWER', d:'Choose 8 brewery upgrades', test:s=>(s.breweryUpgrades||[]).length>=8 }
];

/* ---------- state ---------- */
let S = null;
function freshState(){
  return {
    name:'', charId:'tank', currentTile:null, pulls:0, xp:0, level:1, drinks:0, fails:0, wins:0,
    skips:2, pace:0, waters:0, laps:0, spins:0, gambleWins:0, respin:1, badLuckHeat:0,
    doubleNext:false, startTime:Date.now(), log:[], ach:[],
    flags:{}, resolved:false, secret:null, secretDone:false, secretBlown:false,
    secret2:null, secret2Available:false, secret2Declined:false, secret2Done:false, secret2Blown:false, karaokeDone:false, beerLogCount:0, bossMarks:{}, bossesAvenged:0,
    coins:0, souvenirs:{}, relics:[], items:{}, hatUsedThisLap:false,
    autoWinNext:false, shopPending:false,
    breweryUpgrades:[], coinAccum:0, lastProdTs:null, beerCoinsTotal:0, pendingLevelUps:0
  };
}
function xpNeeded(lv){ return 12 + (lv-1)*5; } // flattened — a real night is ~4-5 slot pulls per player, not dozens

function save(){ try{ store.set('as_state', JSON.stringify(S)); }catch(e){} }
function load(){
  const raw = store.get('as_state');
  if(!raw) return false;
  try{
    const p = JSON.parse(raw);
    if(p && p.name){
      S = Object.assign(freshState(), p);
      if(!S.lastProdTs) S.lastProdTs = Date.now(); // older saves predate the brewery production timer
      return true;
    }
  }catch(e){}
  return false;
}

/* ---------- pixel sprite engine ---------- */
const SPRITE = [
  "....OOOO....",
  "...OHHHHO...",
  "..OHHHHHHO..",
  "..OSSSSSSO..",
  "..OSESSESO..",
  "..OSSSSSSO..",
  "...OSMMSO...",
  "..OBBBBBBO..",
  ".OABBBBBBAO.",
  ".OABBBBBBAO.",
  "..OPP..PPO..",
  "..OPP..PPO.."
];
function drawChar(ctx, ch, px, py, scale, frame){
  const map = { O:'#170f08', H:ch.hair, S:'#f0c49b', E:'#170f08', M:'#b06a4a', B:ch.body, A:'#f0c49b', P:ch.pants };
  const bob = (frame && Math.floor(frame/22)%2===1) ? scale : 0;
  for(let y=0;y<SPRITE.length;y++){
    for(let x=0;x<SPRITE[y].length;x++){
      const c = SPRITE[y][x];
      if(c==='.') continue;
      ctx.fillStyle = map[c] || '#fff';
      ctx.fillRect(px + x*scale, py + y*scale + bob, scale, scale);
    }
  }
  // accessory
  ctx.fillStyle = ch.acc;
  const ay = py + bob;
  if(ch.accType==='crown'){
    for(const dx of [3,5,7]) ctx.fillRect(px+dx*scale, ay-scale*2, scale, scale*2);
    ctx.fillRect(px+3*scale, ay-scale, scale*5, scale);
  } else if(ch.accType==='hat'){
    ctx.fillRect(px+2*scale, ay, scale*8, scale);
    ctx.fillRect(px+3*scale, ay-scale*2, scale*6, scale*2);
  } else if(ch.accType==='horns'){
    ctx.fillRect(px+2*scale, ay-scale*2, scale, scale*2);
    ctx.fillRect(px+9*scale, ay-scale*2, scale, scale*2);
    ctx.fillRect(px+1*scale, ay-scale*3, scale, scale);
    ctx.fillRect(px+10*scale, ay-scale*3, scale, scale);
  } else if(ch.accType==='band'){
    ctx.fillRect(px+2*scale, ay+scale*1, scale*8, scale);
  }
}

/* ---------- boot sprite ---------- */
function paintBootSprite(){
  const c = document.getElementById('bootSprite'); if(!c) return;
  const ctx = c.getContext('2d'); ctx.clearRect(0,0,78,78);
  const ch = CHARS[Math.floor((Date.now()/1400)%4)];
  drawChar(ctx, ch, 6, 12, 5.5, Math.floor(Date.now()/40));
}
setInterval(paintBootSprite, 90);

/* ---------- character select ---------- */
let selChar = 'tank';
function buildCharGrid(){
  const g = document.getElementById('charGrid');
  g.innerHTML = '';
  CHARS.forEach(ch=>{
    const d = document.createElement('div');
    d.className = 'charCard' + (ch.id===selChar?' sel':'');
    d.onclick = ()=>{ selChar = ch.id; buildCharGrid(); };
    d.innerHTML = `<canvas width="60" height="66"></canvas>
      <div class="charName">${ch.name}</div>
      <div class="charPerk">${ch.perk.replace(/\n/g,'<br>')}</div>`;
    g.appendChild(d);
    const ctx = d.querySelector('canvas').getContext('2d');
    drawChar(ctx, ch, 4, 14, 4.3, 0);
  });
}

let boardFrame = 0;

/* ---------- the slot machine: no dice, no board, just pull the lever ---------- */
const SLOT_ICONS = {
  [T.BEER]:'🍺', [T.SHOT]:'🥃', [T.GAMBLE]:'🎲', [T.PHYS]:'🥊', [T.SOCIAL]:'📜',
  [T.MERCY]:'💧', [T.MOVE]:'⏩', [T.CHAOS]:'🎡', [T.BOSS]:'⚔', [T.BADLUCK]:'💀', [T.KARAOKE]:'🎤'
};
// base relative weights — "swap pub, have a beer" should come up way more than anything else
const SLOT_BASE_WEIGHTS = {
  [T.BEER]:8, [T.MOVE]:8, [T.SHOT]:13, [T.SOCIAL]:22, [T.PHYS]:13,
  [T.GAMBLE]:13, [T.MERCY]:6, [T.CHAOS]:21, [T.BOSS]:25, [T.BADLUCK]:11
};
// within a BOSS result, foosball should come up far more than the other two — foosball alone lands ~15%+ of ALL pulls
const BOSS_WEIGHTS = { 'FOOSBALL DUEL':75, 'SPLIT THE G':13, 'THE BOUNCER':12 };
// each character skews which outcomes come up more often, not just how much XP they're worth —
// mirrors the same strength/weakness pairing used in grantXP() so the two systems tell the same story
const CHAR_SLOT_BIAS = {
  tank:    { [T.BEER]:1.35, [T.SOCIAL]:0.75 },
  gambler: { [T.GAMBLE]:1.5, [T.PHYS]:0.75 },
  jester:  { [T.SOCIAL]:1.35, [T.CHAOS]:1.3, [T.BEER]:0.75 },
  machine: { [T.PHYS]:1.5, [T.GAMBLE]:0.75 }
};
function computeSlotWeights(){
  const heat = Math.min(10, S.badLuckHeat||0);
  const w = {};
  // each pull jitters every weight a little (±25%) so the odds aren't the exact same table every time,
  // while still keeping beer common and boss fights rare on average
  Object.keys(SLOT_BASE_WEIGHTS).forEach(k=>{
    w[k] = SLOT_BASE_WEIGHTS[k] * (0.75 + Math.random()*0.5);
  });
  const bias = CHAR_SLOT_BIAS[S.charId];
  if(bias){
    Object.keys(bias).forEach(k=>{ if(w[k]!=null) w[k] *= bias[k]; });
  }
  w[T.BADLUCK] = (11 + heat*6) * (0.75 + Math.random()*0.5); // fail more, and bad luck ramps up hard and fast
  // KARAOKE unlocks at level 5 — starts at ~10% of all pulls, +5% per level after that (capped so other outcomes never vanish)
  // one-time only: once it's happened once, it never comes up again for this run
  if(S.level>=5 && !S.karaokeDone){
    const frac = Math.min(0.6, 0.10 + 0.05*(S.level-5));
    const otherSum = Object.values(w).reduce((a,b)=>a+b, 0);
    w[T.KARAOKE] = (frac/(1-frac)) * otherSum;
  }
  return w;
}
function weightedPick(weights){
  const entries = Object.entries(weights);
  const total = entries.reduce((s,[,v])=>s+v, 0);
  let r = Math.random()*total;
  for(const [k,v] of entries){ if(r<v) return k; r -= v; }
  return entries[0][0];
}
function pickTileOfType(type, avoidId){
  const fullPool = TILES.filter(t=>t.t===type);
  if(type===T.BOSS){
    const name = weightedPick(BOSS_WEIGHTS);
    const t = fullPool.find(x=>x.n===name);
    if(t) return t;
  }
  if(type===T.BADLUCK){
    const name = weightedPick(BADLUCK_WEIGHTS);
    const t = fullPool.find(x=>x.n===name);
    if(t) return t;
  }
  let pool = fullPool;
  if(avoidId!=null) pool = fullPool.filter(t=>t.n!==avoidId);
  if(!pool.length) pool = fullPool; // every tile of this type shares avoidId's name — fall back rather than crash
  return pool[Math.floor(Math.random()*pool.length)];
}
function spinOutcome(){
  const type = weightedPick(computeSlotWeights());
  const tile = pickTileOfType(type, S.currentTile ? S.currentTile.n : null);
  return tile;
}

/* ---------- brewery background (evolves with level, alive by default) ---------- */
const floaters = [];
const BREWERY_TIERS = [
  { minLevel:1,  name:'THE SHACK',              buildings:1, chimneys:1, banners:0, wheel:false, garden:false, pipes:false, torches:1, epic:0, baseRate:0.4, sky:['#08070f','#141026'] },
  { minLevel:2,  name:'CORNER BREWHOUSE',       buildings:1, chimneys:1, banners:1, wheel:false, garden:false, pipes:true,  torches:2, epic:0, baseRate:0.6, sky:['#07060d','#171130'] },
  { minLevel:3,  name:'AARHUS ALEWORKS',        buildings:2, chimneys:2, banners:1, wheel:true,  garden:false, pipes:true,  torches:2, epic:0, baseRate:0.9, sky:['#08060f','#181138'] },
  { minLevel:4,  name:'THE GRAND BRYGGERI',     buildings:2, chimneys:2, banners:2, wheel:true,  garden:true,  pipes:true,  torches:3, epic:0, baseRate:1.3, sky:['#07050e','#1a1240'] },
  { minLevel:5,  name:'BREWERY PRIME',          buildings:3, chimneys:3, banners:3, wheel:true,  garden:true,  pipes:true,  torches:3, epic:1, baseRate:1.8, sky:['#060410','#1c1348'] },
  { minLevel:6,  name:'INTERGALACTIC TAPHOUSE', buildings:3, chimneys:3, banners:3, wheel:true,  garden:true,  pipes:true,  torches:4, epic:2, baseRate:2.4, sky:['#050310','#221450'] },
  { minLevel:7,  name:'COSMIC BREW NEXUS',      buildings:4, chimneys:4, banners:4, wheel:true,  garden:true,  pipes:true,  torches:4, epic:3, baseRate:3.2, sky:['#040210','#281758'] }
];
function breweryTierFor(level){
  let t = BREWERY_TIERS[0];
  for(const x of BREWERY_TIERS){ if(level>=x.minLevel) t = x; }
  return t;
}

/* ---------- brewery upgrades (chosen at level-up, drives production + looks) ---------- */
const RARITIES = [
  { id:'common',    n:'COMMON',    chance:0.50, color:'#b9b9c9' },
  { id:'rare',      n:'RARE',      chance:0.30, color:'#38c2f2' },
  { id:'epic',      n:'EPIC',      chance:0.14, color:'#a45cff' },
  { id:'legendary', n:'LEGENDARY', chance:0.05, color:'#ffb62e' },
  { id:'unique',    n:'UNIQUE',    chance:0.01, color:'#ff3ea5' }
];
const BREWERY_UPGRADES = [
  // common — small, steady
  { id:'tinmugs',          n:'TIN MUGS',            icon:'🍶', d:"Sturdier mugs. Less waste. The old wooden ones kept getting 'accidentally' thrown at the dartboard.", rate:0.25, visual:null,          rarity:'common' },
  { id:'tidytaproom',      n:'TIDY TAPROOM',        icon:'🧹', d:'A cleaner taproom keeps regulars coming back. Someone finally swept up whatever that was.', rate:0.30, visual:null,          rarity:'common' },
  { id:'ironportcullis',   n:'IRON PORTCULLIS',     icon:'🏰', d:"Keeps the good stuff safe from the guy who keeps saying 'just one more' and means it every time.", rate:0.30, visual:'gate',         rarity:'common' },
  { id:'stainedglass',     n:'STAINED GLASS',       icon:'🌈', d:'The windows glow in colour now. Nobody asked for this. Everyone loves it anyway.',  rate:0.35, visual:'stainedglass',rarity:'common' },
  // rare — a real step up, small visual flair
  { id:'gargoyles',        n:'GARGOYLE SENTRIES',   icon:'🗿', d:'They watch over the roofline and judge every decision you make after midnight. Fair, honestly.', rate:0.50, visual:'gargoyle',     rarity:'rare' },
  { id:'towerbell',        n:'TOWER BELL',          icon:'🔔', d:'Rings out over the whole district every time someone finishes a pint. The neighbours have filed noise complaints.', rate:0.55, visual:'bell',         rarity:'rare' },
  { id:'royalbanner',      n:'ROYAL BANNER',        icon:'🚩', d:'An extra banner flies above the gate. It just says "WE\'RE STILL OPEN, SOMEHOW" in gold thread.', rate:0.60, visual:'banner',       rarity:'rare' },
  { id:'copperstills',     n:'COPPER STILLS',       icon:'🥃', d:'Finer copper kettles, richer brew. Insured for more than the building. The building knows.', rate:0.65, visual:null,           rarity:'rare' },
  // epic — chunky bonus, noticeable flair
  { id:'hopfields',        n:'HOP FIELDS',          icon:'🌾', d:'A whole field of hops, just for you, growing suspiciously fast and mostly at night.', rate:0.90, visual:null,           rarity:'epic' },
  { id:'blessedhops',      n:'BLESSED HOPS',        icon:'🍀', d:"Blessed by the brewer's guild in a ceremony that involved way more chanting than hops usually require.", rate:1.00, visual:null,           rarity:'epic' },
  { id:'grandvats',        n:'GRAND VATS',          icon:'🛢️', d:"Bigger barrels out back. One of them makes a low humming noise. Nobody has looked inside. Nobody wants to.", rate:1.10, visual:null,           rarity:'epic' },
  { id:'dragonvane',       n:'DRAGON WEATHERVANE',  icon:'🐉', d:'It looks incredible doing absolutely nothing useful. Turns with the wind. Occasionally winks. Under investigation.', rate:1.20, visual:'dragon',       rarity:'epic' },
  // legendary — huge bonus, dramatic flair
  { id:'moltenforge',      n:'MOLTEN FORGE',        icon:'🔥', d:'Round-the-clock brewing heat, permanently set to "regrettable decision." Health and safety has stopped visiting.', rate:1.80, visual:'forge',        rarity:'legendary' },
  { id:'enchantedcauldron',n:'ENCHANTED CAULDRON',  icon:'✨', d:'Something in there is glowing, muttering prophecies, and asking to be called "Sir." Production is up, so nobody is arguing.', rate:2.00, visual:'glow',         rarity:'legendary' },
  // unique — only one exists, absurd bonus
  { id:'phoenixstill',     n:'THE PHOENIX STILL',   icon:'🔥', d:'There is only one of these in all of Aarhus. It burns gold, occasionally combusts out of pure enthusiasm, and rebuilds itself better every time. The fire department has given up and started a betting pool.', rate:3.20, visual:'phoenix', rarity:'unique' }
];
function rollRarity(){
  const r = Math.random();
  let acc = 0;
  for(const t of RARITIES){ acc += t.chance; if(r<=acc) return t; }
  return RARITIES[0];
}
function pickUpgradeForRarity(rarityId){
  const takenIds = new Set((S.breweryUpgrades||[]).map(u=>u.id));
  const order = RARITIES.map(r=>r.id);
  const startIdx = order.indexOf(rarityId);
  // try the rolled rarity first, then cascade down through lower rarities if that pool is exhausted
  for(let d=0; d<order.length; d++){
    const idx = startIdx - d; if(idx<0) break;
    const pool = BREWERY_UPGRADES.filter(u=>u.rarity===order[idx] && !takenIds.has(u.id));
    if(pool.length) return pool[Math.floor(Math.random()*pool.length)];
  }
  // every real upgrade taken — hand back an infinite filler scaled to the rolled rarity
  const fillerRates = { common:0.3, rare:0.6, epic:1.0, legendary:1.8, unique:3.2 };
  return { id:'filler_'+rarityId+'_'+Date.now(), n:"BREWER'S INSTINCT", icon:'🍺', d:"You've collected literally everything else, so the brewery just started vibing harder out of sheer respect for your commitment.", rate:fillerRates[rarityId]||0.3, visual:null, rarity:rarityId };
}
function computeBreweryRate(){
  if(!S) return 0;
  const tier = breweryTierFor(S.level);
  let rate = tier.baseRate;
  (S.breweryUpgrades||[]).forEach(u=>{ rate += (u.rate||0); });
  (S.relics||[]).forEach(id=>{ const r = RELICS.find(x=>x.id===id); if(r && r.brewBonus) rate += r.brewBonus; });
  return rate;
}
function breweryUpgradeVisualCount(tag){
  return (S && S.breweryUpgrades) ? S.breweryUpgrades.filter(u=>u.visual===tag).length : 0;
}
function tickBreweryProduction(){
  if(!S || !S.lastProdTs) return;
  const now = Date.now();
  let elapsedMin = (now - S.lastProdTs) / 60000;
  S.lastProdTs = now;
  if(elapsedMin<=0) return;
  const CATCHUP_CAP_MIN = 180; // don't dump hours of coins if the phone was closed/asleep a long time
  if(elapsedMin>CATCHUP_CAP_MIN) elapsedMin = CATCHUP_CAP_MIN;
  const rate = computeBreweryRate();
  S.coinAccum = (S.coinAccum||0) + rate*elapsedMin;
  const whole = Math.floor(S.coinAccum);
  if(whole>0){
    S.coinAccum -= whole;
    S.coins += whole;
    S.beerCoinsTotal = (S.beerCoinsTotal||0) + whole;
    if(!document.getElementById('screen-game').classList.contains('hide')) floatText('+'+whole+'🍺', '#e8b23a');
    save();
  }
  const rateEl = document.getElementById('brewRateLabel');
  if(rateEl) rateEl.textContent = '🍺 '+rate.toFixed(1)+'/min';
  // show one decimal (lifetime whole coins + the fraction brewing right now) so it visibly
  // creeps forward every few seconds instead of only jumping once a whole coin is done
  const liveTotal = (S.beerCoinsTotal||0) + (S.coinAccum||0);
  const lifeEl = document.getElementById('brewLifetime');
  if(lifeEl) lifeEl.textContent = '🍺 '+liveTotal.toFixed(1)+' BREWED';
}
function offerBreweryUpgrade(){
  showCard({
    cls:'good',
    tag:'🍺 BREWERY LOOT',
    title:`LEVEL ${S.level} — A CHEST APPEARS`,
    body:'Open it to find out what your brewery gets this time.',
    raw:`<button class="chestBtn" onclick="openBreweryChest()">🎁</button>
         <p class="small dim" style="text-align:center">Common · Rare · Epic · Legendary · Unique</p>`
  });
}
function openBreweryChest(){
  const rarity = rollRarity();
  const u = pickUpgradeForRarity(rarity.id);
  S.breweryUpgrades.push({ id:u.id, n:u.n, icon:u.icon, rate:u.rate, visual:u.visual, rarity:rarity.id });
  breweryTierCache = null;
  addLog(`🍺 ${rarity.n} brewery upgrade: ${u.n} (+${u.rate} beer/min)`);
  save(); syncHUD();
  const isBig = rarity.id==='legendary' || rarity.id==='unique';
  showCard({
    cls:'rarity-'+rarity.id,
    tag: (isBig ? '✨✨✨ ' : '') + rarity.n + ' UPGRADE' + (isBig ? ' ✨✨✨' : ''),
    title: `${u.icon} ${u.n}`,
    body: u.d,
    chips: [`+${u.rate} beer/min`],
    raw: `<div style="text-align:center;margin:8px 0"><span class="rarityBadge" style="background:${rarity.color}22;color:${rarity.color};border:1px solid ${rarity.color}">${rarity.n}</span></div>`,
    buttons:`<button class="btn primary" onclick="closeBreweryChestResult()">NICE</button>`
  });
}
function closeBreweryChestResult(){
  closeCard();
  if((S.pendingLevelUps||0) > 0){
    S.pendingLevelUps--;
    setTimeout(()=>offerBreweryUpgrade(), 450);
  }
}
let breweryTierCache = null, breweryBanners = [], brewerySmoke = [], breweryStars = null, breweryName = '';
let breweryBat = { x:-30, y:20, active:false, speed:1.1 };
function ensureBreweryEntities(tier){
  if(breweryTierCache === tier) return;
  breweryTierCache = tier;
  breweryName = tier.name;
  breweryBanners = [];
  for(let i=0;i<tier.banners;i++){
    breweryBanners.push({ seed: Math.random()*10 });
  }
  brewerySmoke = [];
  if(!breweryStars){
    breweryStars = Array.from({length:22}, ()=>({ x: Math.random()*360, y: Math.random()*46, seed: Math.random()*10 }));
  }
}
// each character casts a distinct color over their own brewery sky — same tier progression underneath, different mood on top
const CHAR_SKY_TINT = { tank:'#2e6bd6', gambler:'#1e7a4a', jester:'#a45cff', machine:'#c1392b' };
function drawBrewery(ctx, W, H, frame){
  const tier = breweryTierFor(S.level);
  ensureBreweryEntities(tier);
  const groundY = H - 20;

  // night sky
  const g = ctx.createLinearGradient(0,0,0,groundY);
  g.addColorStop(0, tier.sky[1]); g.addColorStop(1, tier.sky[0]);
  ctx.fillStyle = g; ctx.fillRect(0,0,W,groundY);

  // character sky tint
  const tint = CHAR_SKY_TINT[S && S.charId];
  if(tint){
    ctx.save();
    ctx.globalCompositeOperation = 'color'; // imparts hue while keeping the tier's own brightness/darkness intact
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = tint;
    ctx.fillRect(0,0,W,groundY);
    ctx.restore();
  }

  // a plain moon, stars once epic kicks in
  ctx.globalAlpha = 0.8; ctx.fillStyle = '#d8d4e8';
  ctx.beginPath(); ctx.arc(326, 20, 9, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  if(tier.epic>=1){
    breweryStars.forEach(s=>{
      const a = 0.25 + 0.45*Math.max(0, Math.sin(frame/26 + s.seed));
      ctx.globalAlpha = a; ctx.fillStyle='#fff';
      ctx.fillRect(s.x, s.y, 1.4, 1.4);
    });
    ctx.globalAlpha = 1;
  }

  // ground — packed dirt, not pavement
  ctx.fillStyle = '#0c0a12'; ctx.fillRect(0, groundY, W, H-groundY);
  ctx.fillStyle = '#171420';
  ctx.fillRect(0, groundY, W, 3);

  // buildings — stone base, timber cross-frame, peaked roof
  const bw = 54, gap = 7, startX = 16;
  for(let i=0;i<tier.buildings;i++){
    const bx = startX + i*(bw+gap);
    const bh = 38 + (i%2===0?12:5) + Math.min(tier.buildings,4)*3;
    const by = groundY - bh;
    const roofH = 12;
    // stone/plaster wall
    ctx.fillStyle = i%2===0 ? '#5a5460' : '#4f4a58';
    ctx.fillRect(bx, by, bw, bh);
    // timber cross-frame
    ctx.strokeStyle = '#2a1f18'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx+bw, by+bh);
    ctx.moveTo(bx+bw, by); ctx.lineTo(bx, by+bh);
    ctx.stroke();
    ctx.strokeRect(bx+1, by+1, bw-2, bh-2);
    // peaked roof
    ctx.fillStyle = '#241b28';
    ctx.beginPath();
    ctx.moveTo(bx-4, by); ctx.lineTo(bx+bw/2, by-roofH); ctx.lineTo(bx+bw+4, by);
    ctx.closePath(); ctx.fill();
    // windows, torch-lit (warm flicker), scales with tier.torches
    const cols=3, rows=Math.max(2, Math.floor(bh/16));
    let lit=0;
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const wx = bx+6+c*15, wy = by+8+r*14;
        if(wx>bx+bw-10) continue;
        const shouldLight = (lit < tier.torches+1) && ((r+c+i)%2===0);
        if(shouldLight){
          const flick = 0.7 + 0.3*Math.sin(frame/6 + r*3 + c*5);
          ctx.fillStyle = `rgba(255,${Math.round(110+40*flick)},${Math.round(40*flick)},1)`;
          lit++;
        } else {
          ctx.fillStyle = '#0e0b16';
        }
        ctx.fillRect(wx, wy, 8, 8);
        ctx.strokeStyle = '#1c1620'; ctx.lineWidth=1; ctx.strokeRect(wx,wy,8,8);
      }
    }
    // chimney + smoke for first `chimneys` buildings
    if(i < tier.chimneys){
      const chx = bx + bw - 16, chy = by - roofH - 6;
      ctx.fillStyle = '#2a2028'; ctx.fillRect(chx, chy, 9, roofH+6);
      if(frame % 22 === (i*5)%22 && brewerySmoke.length<24){
        brewerySmoke.push({ x: chx+4.5, y: chy, vy: 0.26+Math.random()*0.1, drift:(Math.random()-0.5)*0.22, r: 3+Math.random()*2, alpha:0.5 });
      }
    }
    // copper pipe, flowing beer
    if(tier.pipes){
      const py = by + bh - 12;
      ctx.fillStyle = '#5a3a24'; ctx.fillRect(bx-4, py, bw+8, 6);
      const flowOff = (frame*0.7)%10;
      ctx.fillStyle = '#d98a2b';
      for(let fx=bx-4+flowOff; fx<bx+bw+4; fx+=10){ ctx.fillRect(fx, py+2, 4, 2); }
      if(S.relics && S.relics.includes('energy')){
        ctx.globalAlpha = 0.5 + 0.4*Math.sin(frame/8);
        ctx.fillStyle = '#38f2e0'; ctx.fillRect(bx-4, py-2, bw+8, 1.5);
        ctx.globalAlpha = 1;
      }
    }
    // a torch mounted by the door
    const tx = bx + bw - 8, ty = groundY - 10;
    ctx.fillStyle = '#3a2a1c'; ctx.fillRect(tx, ty, 2, 9);
    const flameFlick = 0.6 + 0.4*Math.sin(frame/5 + i*2) + 0.15*Math.sin(frame/2.3);
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = `rgba(255,${Math.round(120+50*flameFlick)},${Math.round(30*flameFlick)},1)`;
    ctx.beginPath(); ctx.ellipse(tx+1, ty-2, 2.4+flameFlick, 3.4+flameFlick, 0,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // smoke particles
  for(let i=brewerySmoke.length-1;i>=0;i--){
    const p = brewerySmoke[i];
    p.y -= p.vy; p.x += p.drift; p.alpha -= 0.006; p.r += 0.02;
    if(p.alpha<=0){ brewerySmoke.splice(i,1); continue; }
    ctx.globalAlpha = Math.max(0,p.alpha);
    ctx.fillStyle = p.gold ? '#ffb62e' : (p.purple ? '#a45cff' : '#7a7488');
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // banners on poles, flapping — replaces the old walking-worker animation
  breweryBanners.forEach((ban,i)=>{
    const px = startX + 20 + i*70, poleH = 22, py = groundY - poleH;
    ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px,groundY); ctx.lineTo(px,py); ctx.stroke();
    const flap = Math.sin(frame/14 + ban.seed) * 5;
    ctx.fillStyle = ['#7a2020','#6b1f4a','#1f4a6b','#3a5a1f'][i%4];
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px+14+flap, py+3);
    ctx.lineTo(px, py+9);
    ctx.closePath(); ctx.fill();
  });
  if(breweryUpgradeVisualCount('banner')>0){
    const px = startX + 20 + breweryBanners.length*70, poleH = 26, py = groundY - poleH;
    ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px,groundY); ctx.lineTo(px,py); ctx.stroke();
    const flap = Math.sin(frame/12 + 4) * 6;
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px+16+flap, py+4);
    ctx.lineTo(px, py+11);
    ctx.closePath(); ctx.fill();
  }

  // occasional bat/crow crossing the sky — subtle, cheap, moody
  if(!breweryBat.active && frame % 340 === 0){ breweryBat = { x:-20, y: 14+Math.random()*18, active:true, speed: 0.9+Math.random()*0.4 }; }
  if(breweryBat.active){
    breweryBat.x += breweryBat.speed;
    const flap = Math.sin(frame/4) > 0;
    ctx.save(); ctx.strokeStyle='#1a1420'; ctx.lineWidth=1.3;
    const by2 = breweryBat.y + Math.sin(frame/9)*2;
    ctx.beginPath();
    ctx.moveTo(breweryBat.x-4, by2+(flap?-2:1)); ctx.lineTo(breweryBat.x, by2);
    ctx.lineTo(breweryBat.x+4, by2+(flap?-2:1));
    ctx.stroke(); ctx.restore();
    if(breweryBat.x > W+20) breweryBat.active = false;
  }

  // water wheel
  if(tier.wheel){
    const wx = startX + tier.buildings*(bw+gap) + 16, wy = groundY - 16, r = 15;
    ctx.strokeStyle = '#4a3a24'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(wx, wy, r, 0, Math.PI*2); ctx.stroke();
    const spokeAngle = frame/26;
    for(let s=0;s<6;s++){
      const a = spokeAngle + s*(Math.PI/3);
      ctx.beginPath(); ctx.moveTo(wx,wy); ctx.lineTo(wx+Math.cos(a)*r, wy+Math.sin(a)*r); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(58,90,90,.55)';
    for(let d=0;d<3;d++){
      const dy = ((frame*1.3 + d*7) % 20);
      ctx.fillRect(wx-1.5, wy+r+dy-20, 3, 5);
    }
  }

  // medieval beer garden — benches, barrels, torches (no string lights)
  if(tier.garden){
    const gx = W - 66, gy = groundY - 10;
    ctx.fillStyle = '#3a2a1c';
    ctx.fillRect(gx, gy, 26, 4); ctx.fillRect(gx+34, gy, 26, 4);
    ctx.fillStyle = '#5a3a20';
    for(let i=0;i<3;i++){ ctx.fillRect(gx+2+i*8, gy-6, 5, 6); ctx.fillRect(gx+36+i*8, gy-6, 5, 6); }
    // two garden torches instead of string lights
    for(let i=0;i<2;i++){
      const tx = gx + 4 + i*50, ty = gy - 12;
      ctx.fillStyle = '#3a2a1c'; ctx.fillRect(tx, ty, 2, 10);
      const fl = 0.6 + 0.4*Math.sin(frame/5 + i*3);
      ctx.fillStyle = `rgba(255,${Math.round(120+50*fl)},${Math.round(30*fl)},1)`;
      ctx.beginPath(); ctx.ellipse(tx+1, ty-2, 2.2+fl, 3.2+fl, 0,0,Math.PI*2); ctx.fill();
    }
  }

  // relic / achievement flourishes
  if(S.relics && S.relics.includes('luckyhat')){
    ctx.font='12px sans-serif'; ctx.textAlign='center';
    ctx.fillText('🎩', startX+bw/2, groundY - (38+12+Math.min(tier.buildings,4)*3) - 20);
  }
  if(S.ach && S.ach.includes('fullset')){
    ctx.font='12px sans-serif'; ctx.textAlign='center';
    ctx.fillText('🏆', startX+bw-8, groundY - (38+12+Math.min(tier.buildings,4)*3) - 14);
  }

  // brewery upgrade flourishes — each player's choices make the place look different
  const roofTopY = groundY - (38+12+Math.min(tier.buildings,4)*3) - 12;
  if(breweryUpgradeVisualCount('gargoyle')>0){
    ctx.font='11px sans-serif'; ctx.textAlign='center';
    ctx.fillText('🗿', startX-2, groundY - 16);
    ctx.fillText('🗿', startX + tier.buildings*(bw+gap) - 4, groundY - 16);
  }
  if(breweryUpgradeVisualCount('bell')>0){
    const sway = Math.sin(frame/10)*3;
    ctx.font='11px sans-serif'; ctx.textAlign='center';
    ctx.save(); ctx.translate(startX+bw/2+sway, roofTopY-6);
    ctx.fillText('🔔', 0, 0); ctx.restore();
    if(frame % 90 < 4) floatText('♪', '#e8b23a');
  }
  if(breweryUpgradeVisualCount('dragon')>0){
    const bob = Math.sin(frame/16)*2;
    ctx.font='13px sans-serif'; ctx.textAlign='center';
    ctx.fillText('🐉', startX+bw/2, roofTopY-14+bob);
  }
  if(breweryUpgradeVisualCount('gate')>0){
    const gx0 = startX + bw + 2, gy0 = groundY - 22;
    ctx.fillStyle = '#2a2028';
    for(let b=0;b<4;b++){ ctx.fillRect(gx0+b*4, gy0, 2, 22); }
  }
  if(breweryUpgradeVisualCount('glow')>0){
    const pulse = 0.35 + 0.25*Math.sin(frame/12);
    ctx.globalAlpha = pulse; ctx.fillStyle = '#a45cff';
    ctx.beginPath(); ctx.ellipse(startX+bw*1.5+gap, groundY-6, 14, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
    if(frame % 15 === 0 && brewerySmoke.length<30){
      brewerySmoke.push({ x:startX+bw*1.5+gap, y:groundY-8, vy:0.22+Math.random()*0.08, drift:(Math.random()-0.5)*0.3, r:2+Math.random()*1.6, alpha:0.5, purple:true });
    }
  }
  if(breweryUpgradeVisualCount('phoenix')>0){
    // the one-of-a-kind item — gold flame + rising embers over the tallest building
    const px = startX+bw/2, py = roofTopY-16;
    const flick = 0.6 + 0.4*Math.sin(frame/4);
    ctx.font='14px sans-serif'; ctx.textAlign='center';
    ctx.globalAlpha = 0.85;
    ctx.fillText('🔥', px, py+Math.sin(frame/6)*2);
    ctx.globalAlpha = 1;
    if(frame % 8 === 0 && brewerySmoke.length<34){
      brewerySmoke.push({ x:px+(Math.random()-0.5)*10, y:py, vy:0.3+Math.random()*0.15, drift:(Math.random()-0.5)*0.4, r:1.5+Math.random()*1.4, alpha:0.7, gold:true });
    }
  }
  if(breweryUpgradeVisualCount('forge')>0){
    const pulse = 0.3 + 0.25*Math.sin(frame/8);
    ctx.globalAlpha = pulse; ctx.fillStyle = '#ff6a1f';
    ctx.beginPath(); ctx.ellipse(startX+bw/2, groundY-4, 10, 4, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  if(breweryUpgradeVisualCount('stainedglass')>0){
    for(let k=0;k<3;k++){
      const hue = (frame*2 + k*70) % 360;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = `hsl(${hue},80%,60%)`;
      ctx.fillRect(startX+8+k*10, roofTopY+2, 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  // epic layer: aliens & UFOs after level 10 — deliberately jarring against the medieval scene
  if(tier.epic>=1){
    const ufoX = 180 + Math.sin(frame/70)*130;
    const ufoY = 16 + Math.sin(frame/45)*4;
    ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='16px sans-serif';
    ctx.fillText('🛸', ufoX, ufoY);
    if(tier.epic>=2){
      const beamOn = Math.sin(frame/50) > 0.5;
      if(beamOn){
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = '#6ee36e';
        ctx.beginPath();
        ctx.moveTo(ufoX-3, ufoY+8); ctx.lineTo(ufoX+3, ufoY+8);
        ctx.lineTo(ufoX+16, groundY); ctx.lineTo(ufoX-16, groundY);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.font='11px sans-serif';
        ctx.fillText('🛢️', ufoX, groundY - ((frame*1.4)%40));
      }
    }
    if(tier.epic>=3){
      const ufo2X = 90 + Math.sin(frame/55+2)*70;
      ctx.font='13px sans-serif';
      ctx.fillText('🛸', ufo2X, 30);
      ctx.font='12px sans-serif';
      ctx.fillText('👽', startX+8, groundY - (38+12+Math.min(tier.buildings,4)*3) + 4);
      ctx.strokeStyle = `hsl(${(frame*4)%360},90%,60%)`;
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.moveTo(ufo2X,34); ctx.lineTo(ufo2X + Math.sin(frame/20)*40, groundY); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}

function drawArena(){
  const c = document.getElementById('arena'); if(!c) return;
  const ctx = c.getContext('2d');
  const W=c.width, H=c.height;
  ctx.clearRect(0,0,W,H);

  drawBrewery(ctx, W, H, boardFrame);

  // floaters (XP / coin / miss feedback, drawn above the brewery)
  ctx.save(); ctx.textAlign='center';
  for(let i=floaters.length-1;i>=0;i--){
    const f = floaters[i];
    f.y -= 0.9; f.life--;
    ctx.globalAlpha = Math.max(0, f.life/60);
    ctx.fillStyle = f.color;
    ctx.font = '10px monospace';
    ctx.fillText(f.txt, f.x, f.y);
    if(f.life<=0) floaters.splice(i,1);
  }
  ctx.restore();

  const el = document.getElementById('timeLabel');
  if(el){
    const secs = Math.floor((Date.now()-S.startTime)/1000);
    el.textContent = String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');
  }
}
function floatText(txt, color){
  floaters.push({ x:180 + (Math.random()*60-30), y:60, txt, color, life:60 });
}

/* ---------- main loop ---------- */
function loop(){
  boardFrame++;
  if(!document.getElementById('screen-game').classList.contains('hide')){
    drawArena();
  }
  requestAnimationFrame(loop);
}

/* ---------- navigation ---------- */
function go(screen){
  ['boot','char','game','squad','log','bag'].forEach(s=>{
    document.getElementById('screen-'+s).classList.toggle('hide', s!==screen);
  });
  const nav = document.getElementById('nav');
  nav.classList.toggle('hide', screen==='boot' || screen==='char');
  document.getElementById('navGame').classList.toggle('on', screen==='game');
  document.getElementById('navBag').classList.toggle('on', screen==='bag');
  document.getElementById('navSquad').classList.toggle('on', screen==='squad');
  document.getElementById('navLog').classList.toggle('on', screen==='log');
  if(screen==='char') buildCharGrid();
  if(screen==='squad'){ renderBackup(); }
  if(screen==='log') renderLog();
  if(screen==='bag') renderBag();
  window.scrollTo(0,0);
}

function startRun(){
  const nm = (document.getElementById('playerName').value || '').trim().toUpperCase();
  if(!nm){ toast('ENTER A NAME FIRST'); return; }
  S = freshState();
  S.name = nm; S.charId = selChar; S.startTime = Date.now();
  S.lastProdTs = Date.now();
  S.secret = MISSIONS[Math.floor(Math.random()*MISSIONS.length)];
  addLog(`${nm} entered Aarhus as ${CHARS.find(c=>c.id===selChar).name}`);
  save(); syncHUD(); go('game');
  toast('⚡ THE GODS OF AARHUS AWAIT. GO.');
}

/* ---------- HUD ---------- */
// each character's base epithet — the title grows from here as the night earns more of them
const CHAR_TITLE_BASE = {
  tank: 'THE UNSHAKABLE', gambler: 'THE HOUSE EDGE', jester: 'THE CHAOS AGENT', machine: 'THE RAW POWER'
};
function computeEpicTitle(){
  if(!S || !S.charId) return '';
  const ch = CHARS.find(c=>c.id===S.charId);
  const parts = [];
  parts.push(`${ch ? ch.name : ''} ${CHAR_TITLE_BASE[S.charId]||''}`.trim());
  const avenged = S.bossesAvenged||0;
  if(avenged>=2) parts.push(`SLAYER OF ${avenged} BOSSES`);
  else if(avenged===1) parts.push('AVENGER OF ONE BOSS');
  const cursesSurvived = (S.souvenirs && S.souvenirs[T.BADLUCK]) || 0;
  if(cursesSurvived>=1) parts.push(`SURVIVOR OF ${cursesSurvived} CURSE${cursesSurvived>1?'S':''}`);
  if(S.secret2Done) parts.push('MASTER MANIPULATOR');
  else if(S.secretDone) parts.push('KEEPER OF SECRETS');
  if(S.secretBlown || S.secret2Blown) parts.push('ONCE CAUGHT, NEVER DETERRED');
  if(S.karaokeDone) parts.push('VOICE OF THE NIGHT');
  const tier = breweryTierFor(S.level);
  parts.push(`KEEPER OF ${tier.name}`);
  return parts.slice(0,4).join(' · ');
}
function syncHUD(){
  if(!S) return;
  document.getElementById('hudName').textContent = S.name;
  document.getElementById('hudLevel').textContent = 'LV '+S.level;
  const titleEl = document.getElementById('hudTitle');
  if(titleEl) titleEl.textContent = computeEpicTitle();
  const need = xpNeeded(S.level);
  const cur = S.xp;
  document.getElementById('xpFill').style.width = Math.min(100, cur/need*100)+'%';
  document.getElementById('xpTxt').textContent = cur+' / '+need+' XP';
  document.getElementById('stDrinks').textContent = S.drinks;
  document.getElementById('stFails').textContent = S.fails;
  document.getElementById('stWins').textContent = S.wins;
  document.getElementById('stSkips').textContent = S.skips;
  document.getElementById('arenaLabel').textContent = (breweryName||'AARHUS') + ' · ' + (S.currentTile?S.currentTile.n:'NO OUTCOME YET');
  tickBreweryProduction();
  const tierNameEl = document.getElementById('brewTierName');
  if(tierNameEl) tierNameEl.textContent = breweryTierFor(S.level).name;
}

/* ---------- XP / level ---------- */
function grantXP(amount, why){
  const ch = CHARS.find(c=>c.id===S.charId);
  const tile = S.currentTile;
  let mult = 1;
  if(ch.id==='tank' && tile && tile.t===T.BEER) mult += .4;
  if(ch.id==='tank' && tile && tile.t===T.SOCIAL) mult -= .25;
  if(ch.id==='gambler' && tile && tile.t===T.GAMBLE) mult += 1;
  if(ch.id==='gambler' && tile && tile.t===T.PHYS) mult -= .25;
  if(ch.id==='jester' && tile && tile.t===T.SOCIAL) mult += .3;
  if(ch.id==='jester' && tile && tile.t===T.BEER) mult -= .25;
  if(ch.id==='machine' && tile && tile.t===T.PHYS) mult += .5;
  if(ch.id==='machine' && tile && tile.t===T.GAMBLE) mult -= .25;
  // class-signature relics stack further on top of the character's own inherent bias
  if(S.relics.includes('bottomlessstein') && tile && tile.t===T.BEER) mult += .25;
  if(S.relics.includes('loadeddice') && tile && tile.t===T.GAMBLE) mult += .25;
  if(S.relics.includes('jokerscap') && tile && (tile.t===T.SOCIAL || tile.t===T.CHAOS)) mult += .25;
  if(S.relics.includes('ironknuckles') && tile && tile.t===T.PHYS) mult += .25;
  mult = Math.max(.25, mult);
  if(S.doubleNext){ mult += 1; S.doubleNext = false; }
  const gained = Math.round(amount*mult);
  S.xp += gained;
  floatText('+'+gained+' XP', '#38f2e0');
  let levelsGained = 0;
  while(S.xp >= xpNeeded(S.level)){
    S.xp -= xpNeeded(S.level);
    S.level++;
    levelsGained++;
  }
  if(levelsGained>0){ S.pendingLevelUps = (S.pendingLevelUps||0) + levelsGained; showLevelUp(); }
  checkAchievements();
  save(); syncHUD();
  return gained;
}
const LEVEL_UP_LINES = [
  'THE BREWERY HEARD THAT', 'SOMEWHERE, A BARREL GETS BIGGER', 'YOUR LIVER FILED A COMPLAINT',
  'THE TOWN NOTICES YOU NOW', 'A WIZARD DID THIS, PROBABLY', 'THIS IS FINE, ACTUALLY GREAT'
];
function showLevelUp(){
  const line = LEVEL_UP_LINES[Math.floor(Math.random()*LEVEL_UP_LINES.length)];
  const d = document.createElement('div');
  d.id='levelFlash';
  d.innerHTML = `<div class="lvTxt">LEVEL ${S.level}<br><span style="font-size:10px;color:#e8b23a">${line}</span></div>`;
  document.body.appendChild(d);
  addLog(`LEVEL ${S.level}`);
  setTimeout(()=>{
    d.remove();
    if((S.pendingLevelUps||0)>0) offerBreweryUpgradeWhenClear();
  }, 1400);
}
function offerBreweryUpgradeWhenClear(){
  // don't clobber whatever card the player is already looking at (e.g. they spun again fast) — wait for it to clear
  if(document.getElementById('cardOverlay')){ setTimeout(offerBreweryUpgradeWhenClear, 400); return; }
  if((S.pendingLevelUps||0)<=0) return;
  S.pendingLevelUps--;
  offerBreweryUpgrade();
}

function addPace(n){
  // pace is tracked quietly for relic flavor but no longer nags, blocks, or locks anything
  S.pace = Math.max(0, Math.min(120, S.pace + n));
  save(); syncHUD();
}

/* ---------- just log a beer, no challenge attached ---------- */
const BEER_LOG_LINES = [
  '🍺 ZEUS HIMSELF RAISES A GLASS',
  'THE OLYMPIANS DESCEND FROM MOUNT AARHUS TO WITNESS THIS',
  'POSEIDON WEEPS TEARS OF FOAM',
  'A LEGEND IS FORGED ON MOUNT OLYMPUS TONIGHT',
  'DIONYSUS NAMES YOU HIS FAVORITE MORTAL',
  'THE FATES WRITE THIS ONE INTO THE SCROLLS',
  'ARES DROPS HIS SWORD TO APPLAUD',
  'THE ORACLE FORETOLD THIS EXACT MOMENT',
  'HERMES DELIVERS THE NEWS TO ALL OF GREECE',
  'A GOLDEN LAUREL DESCENDS FROM THE HEAVENS',
  'THE GODS ARGUE OVER WHO GETS CREDIT FOR THIS ONE',
  'ATLAS SHRUGS, IMPRESSED DESPITE HIMSELF',
  'THIS DEED ECHOES THROUGH THE HALLS OF OLYMPUS',
  'HERACLES CONSIDERS THIS HIS 13TH LABOR',
  'THE MUSES BEGIN COMPOSING AN EPIC ABOUT THIS',
  'ZEUS THROWS A CELEBRATORY THUNDERBOLT (a light one)',
  'APOLLO PAUSES THE SUN TO WATCH',
  'A TEMPLE IS BEING BUILT IN YOUR HONOR AS WE SPEAK',
  'HADES HIMSELF ALLOWS A BRIEF FURLOUGH TO CELEBRATE',
  'THE THREE FATES PUT DOWN THEIR THREAD TO CLAP',
  'ATHENA WRITES THIS DOWN FOR HER OWN RECORDS',
  'A CONSTELLATION IS QUIETLY RENAMED AFTER YOU',
  'PROMETHEUS SAYS THIS WAS WORTH STEALING FIRE FOR',
  'THE ORACLE OF DELPHI CANCELS ALL OTHER APPOINTMENTS',
  'ICARUS WOULD HAVE FLOWN LOWER JUST TO SEE THIS',
  'MOUNT OLYMPUS ISSUES A PRESS RELEASE',
  'A MINOR GOD IS PROMOTED JUST FOR WITNESSING THIS',
  'THE UNDERWORLD PAUSES ITS ETERNAL PUNISHMENTS OUT OF RESPECT',
  'ODYSSEUS TAKES NOTES FOR HIS NEXT JOURNEY',
  'THE THUNDER ITSELF APPLAUDS, DISTANT BUT SINCERE',
  'A LAUREL WREATH IS BEING WOVEN AS YOU READ THIS',
  'SPARTA HEARS ABOUT THIS AND APPROVES'
];
// escalating reward — beer #1 is a courtesy, beer #5+ is a decent chunk of XP. Caps out at the 8th log so it never runs away.
const BEER_LOG_XP = [8, 11, 15, 20, 27, 37, 50, 67];
function logBeer(){
  S.beerLogCount = (S.beerLogCount||0) + 1;
  const amount = BEER_LOG_XP[Math.min(S.beerLogCount-1, BEER_LOG_XP.length-1)];
  S.drinks++;
  const levelBefore = S.level;
  const g = grantXP(amount, 'beer log');
  addPace(10);
  addLog(`🍺 Logged beer #${S.beerLogCount} — +${g} XP`);
  floatText('+'+g+' XP', '#ff9d3d');
  // skip the epic toast if this log just triggered a level-up — the level flash + chest sequence
  // takes over the screen right after, and stacking a toast on top of that reads as clutter
  if(S.level===levelBefore){
    toast(BEER_LOG_LINES[Math.floor(Math.random()*BEER_LOG_LINES.length)]);
  }
  checkAchievements(); save(); syncHUD();
}

/* ---------- economy helpers ---------- */
function grantCoins(n){
  S.coins += n;
  save(); syncHUD();
}
function grantSouvenir(type){
  const sv = SOUVENIRS[type];
  if(!sv) return;
  S.souvenirs[type] = (S.souvenirs[type]||0) + 1;
  addLog(`Picked up a ${sv.n} ${sv.icon}`);
}
function maybeOpenShop(){
  if(S.shopPending){ S.shopPending = false; setTimeout(()=>openShop(), 650); }
}
function applyWin(t){
  S.wins++;
  if(t.gamble) S.gambleWins++;
  if(t.n==='SPLIT THE G') S.flags.gsplit = true;
  if(t.n==='THE BOUNCER') S.flags.bouncer = true;
  let xpAmount = t.xp;
  if(S.relics.includes('ring') && t.t===T.GAMBLE) xpAmount = Math.round(xpAmount*1.25);
  const isRevenge = t.t===T.BOSS && S.bossMarks && S.bossMarks[t.n];
  if(isRevenge){
    xpAmount = Math.round(xpAmount*1.5);
    delete S.bossMarks[t.n];
    S.bossesAvenged = (S.bossesAvenged||0) + 1;
  }
  const g = grantXP(xpAmount, t.n);
  if(isRevenge){
    addLog(`⚔ REVENGE — you beat ${t.n} after it beat you. +50% XP.`);
    toast(`⚔ REVENGE SERVED. ${t.n} HAS BEEN AVENGED.`);
  }
  if(t.drink){
    S.drinks++;
    let paceAdd = (t.t===T.SHOT?16:12);
    if(S.relics.includes('shades')) paceAdd = Math.round(paceAdd*0.8);
    addPace(paceAdd);
  }
  if(t.heal){ S.waters++; addPace(-t.heal); }
  S.badLuckHeat = Math.max(0, (S.badLuckHeat||0)-1);
  grantSouvenir(t.t);
  const coinsGained = Math.max(3, Math.round(t.xp/3));
  grantCoins(coinsGained);
  addLog(`✓ ${t.n} — +${g} XP, +${coinsGained}🪙`);
  toast('+'+g+' XP · +'+coinsGained+'🪙');
  save(); syncHUD(); checkAchievements();
  if(t.t===T.BOSS) S.shopPending = true;
  maybeOpenShop();
}

/* ---------- log / achievements ---------- */
function addLog(txt){
  const secs = Math.floor((Date.now()-S.startTime)/1000);
  const stamp = String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');
  S.log.unshift({ t:stamp, txt });
  if(S.log.length>120) S.log.pop();
  save();
}
function checkAchievements(){
  ACHIEVEMENTS.forEach(a=>{
    if(S.ach.includes(a.id)) return;
    if(a.test(S)){ S.ach.push(a.id); toast('🏅 '+a.n); addLog('ACHIEVEMENT: '+a.n); }
  });
}
function renderLog(){
  const el = document.getElementById('logList');
  el.innerHTML = S.log.length ? S.log.map(l=>`<div class="logItem"><b>${l.t}</b> · ${escapeHtml(l.txt)}</div>`).join('')
                              : '<p class="small dim">Nothing yet. Go roll.</p>';
  const w = document.getElementById('weaponList');
  const owned = S.breweryUpgrades||[];
  w.innerHTML = owned.length ? owned.map(u=>`<div class="logItem gold">${u.icon} ${u.n}</div>`).join('') : 'Level up to choose your first one.';
  const a = document.getElementById('achList');
  a.innerHTML = ACHIEVEMENTS.map(x=>{
    const has = S.ach.includes(x.id);
    return `<div class="logItem" style="color:${has?'#ffd24a':'#4a4080'}">${has?'🏅':'🔒'} ${x.n} <span style="color:#4a4080">— ${x.d}</span></div>`;
  }).join('');
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ---------- toast ---------- */
let toastTimer=null;
function toast(msg){
  document.querySelectorAll('.toast').forEach(t=>t.remove());
  const d=document.createElement('div'); d.className='toast'; d.textContent=msg;
  document.body.appendChild(d);
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>d.remove(), 2300);
}

/* ---------- slot machine ---------- */
let slotSpinning = false;
function spinSlot(){
  if(slotSpinning) return;
  slotSpinning = true;
  const btn = document.getElementById('btnSpin'); if(btn) btn.disabled = true;
  const outcome = spinOutcome();
  const icon = SLOT_ICONS[outcome.t] || '🍺';
  const allIcons = Object.values(SLOT_ICONS);
  const reels = ['reel0','reel1','reel2'].map(id=>document.getElementById(id)).filter(Boolean);
  let ticks = 0;
  const iv = setInterval(()=>{
    reels.forEach(r=>{ const s=r.querySelector('.reelIcon'); if(s) s.textContent = allIcons[Math.floor(Math.random()*allIcons.length)]; });
    ticks++;
    if(ticks>=14){
      clearInterval(iv);
      reels.forEach(r=>{ const s=r.querySelector('.reelIcon'); if(s) s.textContent = icon; });
      const lbl = document.getElementById('slotResultLabel'); if(lbl) lbl.textContent = outcome.n;
      slotSpinning = false;
      if(btn) btn.disabled = false;
      setTimeout(()=>previewSlotResult(outcome), 300);
    }
  }, 70);
}
function previewSlotResult(tile){
  window._pendingSlotTile = tile;
  if(tile.t===T.CHAOS){
    // the Wheel of Chaos only exists behind the slot machine now — no separate free button
    S.currentTile = tile; S.resolved = false; save();
    openWheel();
    return;
  }
  const canReroll = S.skips>0;
  showCard({
    cls: tile.t===T.BADLUCK ? 'curse' : '',
    tag: tile.t===T.BADLUCK ? '💀 THE REELS HAVE CURSED YOU' : '🎰 THE REELS HAVE SPOKEN',
    title:`${tile.icon} ${tile.n}`,
    venue: tile.venue,
    body:'',
    chips:[`+${tile.xp} XP`, tile.drink?'🍺 DRINK':'', tile.gamble?'🎲 FORFEIT IF LOST':'', tile.heal?'💧 MERCY':'', tile.t===T.BADLUCK?'💀 BAD LUCK':''].filter(Boolean),
    extra:`<p class="small dim">Accept it, or spend a reroll to spin again.</p>`,
    buttons:`<button class="btn green" onclick="acceptSlotResult()">✅ ACCEPT</button>
             ${canReroll ? `<button class="btn ghost sm" onclick="useReroll()">🔁 REROLL (${S.skips} left)</button>` : ''}`
  });
}
function useReroll(){
  if(S.skips<=0) return;
  S.skips--;
  addLog('Used a reroll on the slot machine');
  save(); syncHUD();
  closeCard();
  setTimeout(()=>spinSlot(), 150);
}
function acceptSlotResult(){
  const tile = window._pendingSlotTile;
  if(!tile) return;
  closeCard();
  S.currentTile = tile;
  S.resolved = false;
  S.pulls = (S.pulls||0) + 1;
  if(tile.t===T.KARAOKE) S.karaokeDone = true; // one-time only — never rollable again once it's happened
  if(S.pulls % 3 === 0){
    S.laps++; S.hatUsedThisLap = false; S.shopPending = true;
    grantXP(25,'lap'); grantCoins(10);
    toast('ANOTHER LAP OF AARHUS — SQUAD TOAST!'); addLog('Another lap of Aarhus — squad toast');
  }
  save();
  openChallengeCard();
}

/* ---------- tile cards ---------- */
function reopenTile(){ if(S.currentTile) openChallengeCard(true); else toast('PULL THE LEVER FIRST'); }

function openChallengeCard(reopen){
  const t = S.currentTile; if(!t) return;
  const clsMap = { [T.MERCY]:'good', [T.BOSS]:'boss', [T.BADLUCK]:'curse' };
  const cls = clsMap[t.t] || '';
  const tagMap = {
    [T.BEER]:'BEER CHALLENGE', [T.SHOT]:'SHOT CHALLENGE', [T.GAMBLE]:'GAMBLING TILE',
    [T.PHYS]:'PHYSICAL DUEL', [T.MERCY]:'★ MERCY TILE ★', [T.MOVE]:'QUICK ONE',
    [T.BOSS]:'⚔ BOSS FIGHT ⚔', [T.SOCIAL]:'SOCIAL QUEST', [T.BADLUCK]:'💀 BAD LUCK 💀',
    [T.KARAOKE]:'🎤 KARAOKE NIGHT 🎤'
  };
  const isRevengeBout = t.t===T.BOSS && S.bossMarks && S.bossMarks[t.n] && !S.resolved;
  const canAutoWin = !S.resolved && S.autoWinNext && t.t!==T.MERCY && t.t!==T.MOVE && t.t!==T.BADLUCK;
  let buttons = '';
  if(S.resolved){
    buttons = `<button class="btn ghost" onclick="closeCard()">◀ CLOSE — ALREADY RESOLVED</button>`;
  } else if(canAutoWin){
    buttons = `<button class="btn purple" onclick="useAutoWin()">🪪 AUTO-WIN WITH FAKE ID</button>`;
  } else if(t.t===T.MERCY || t.t===T.MOVE || t.t===T.BADLUCK){
    buttons = `<button class="btn green" onclick="resolveTile(true)">✓ DONE</button>`;
  } else if(t.gamble){
    buttons = `<button class="btn green" onclick="resolveTile(true)">🏆 I WON / I DID IT</button>
               <button class="btn red" onclick="resolveTile(false)">💀 I LOST — FORFEIT</button>`;
  } else {
    buttons = `<button class="btn green" onclick="resolveTile(true)">✓ COMPLETED</button>
               <button class="btn red" onclick="resolveTile(false)">✗ CHICKENED OUT</button>`;
  }
  const swap = '';
  const already = (S.resolved) ? `<p class="small dim">You already resolved this one — reopened for reference only, no repeat rewards.</p>` : '';
  const autoNote = (canAutoWin) ? `<p class="small" style="color:#a45cff">🪪 Your FAKE ID covers this one — just tap to auto-win.</p>` : '';
  const revengeNote = isRevengeBout ? `<p class="small" style="color:#c1392b">⚔ THIS ONE BEAT YOU BEFORE. Win it now for +50% XP revenge bonus.</p>` : '';

  showCard({
    cls,
    tag: tagMap[t.t] || 'OUTCOME',
    title: `${t.icon} ${t.n}`,
    venue: t.venue,
    body: t.body,
    chips: S.resolved ? ['✓ ALREADY CLAIMED'] : [
      `+${t.xp} XP`,
      `+${Math.max(3, Math.round(t.xp/3))}🪙`,
      SOUVENIRS[t.t] ? `${SOUVENIRS[t.t].icon} ${SOUVENIRS[t.t].n}` : '',
      t.drink ? '🍺 DRINK TILE' : '',
      t.gamble ? '🎲 FORFEIT IF LOST' : '',
      t.heal ? `💧 MERCY` : '',
      isRevengeBout ? '⚔ REVENGE MATCH' : ''
    ].filter(Boolean),
    extra: swap + already + autoNote + revengeNote,
    buttons
  });
}

function useAutoWin(){
  S.autoWinNext = false;
  resolveTile(true);
}

function resolveTile(won){
  if(S.resolved) return;
  S.resolved = true;
  const t = S.currentTile;
  closeCard();
  if(won){
    applyWin(t);
  } else {
    S.fails++;
    S.badLuckHeat = Math.min(10, (S.badLuckHeat||0)+1);
    floatText('MISS', '#ff4d5e');
    if(S.relics.includes('luckyhat') && !S.hatUsedThisLap){
      S.hatUsedThisLap = true;
      addLog(`🎩 LUCKY HAT saved you on ${t.n} — counted as a win`);
      toast('🎩 LUCKY HAT SAVES THE DAY');
      applyWin(t);
      return;
    }
    if(t.t===T.BOSS){
      // losing a boss fight marks it for revenge later, and costs a bit of XP right now
      S.bossMarks = S.bossMarks || {};
      S.bossMarks[t.n] = true;
      const lost = Math.max(5, Math.round(t.xp*0.2));
      loseXP(lost, 'lost boss fight');
      addLog(`💀 ${t.n} defeated you — -${lost} XP, and it's personal now`);
      toast(`💀 -${lost} XP. ${t.n} REMEMBERS THIS.`);
    } else {
      addLog(`✗ ${t.n} — forfeit drawn`);
    }
    save(); syncHUD();
    setTimeout(()=>drawForfeit(t), 300);
  }
}

function drawForfeit(t){
  const ch = CHARS.find(c=>c.id===S.charId);
  let f = FORFEITS[Math.floor(Math.random()*FORFEITS.length)];
  const dbl = (ch.id==='gambler' && t && t.t===T.GAMBLE);
  showCard({
    cls:'forfeit',
    tag:'FORFEIT — YOU NEVER LOSE WHEN YOU GAMBLE',
    title:`💀 ${f.n}${dbl?' ×2':''}`,
    venue:'',
    body:`${f.d}${dbl?'\n\nHOUSE EDGE: The Gambler takes double. You knew the risks.':''}`,
    chips:['+10 XP FOR TAKING IT', '🍺 DRINK'],
    buttons:`<button class="btn gold" onclick="takeForfeit(${dbl?2:1})">🍺 TAKEN. NEXT.</button>`
  });
}
function takeForfeit(mult){
  closeCard();
  S.drinks += mult;
  addPace(12*mult);
  grantXP(10,'forfeit');
  addLog(`Took the forfeit${mult>1?' ×2':''}`);
  toast('RESPECT.');
  save(); syncHUD();
}

/* ---------- wheel of chaos ---------- */
let wheelSpinning=false, wheelAngle=0;
function openWheel(){
  const segs = WHEEL;
  showCard({
    cls:'chaos',
    tag:'THE WHEEL OF CHAOS',
    title:'🎡 SPIN IT',
    venue:'',
    body:'',
    chips:[],
    raw:`<div id="wheelWrap"><div class="pointer"></div><canvas id="wheel" width="300" height="300"></canvas></div>
         <div id="wheelResult"></div>
         <button class="btn primary" id="btnWheelSpin" onclick="spinWheel()">🎡 SPIN</button>
         <button class="btn ghost sm" onclick="closeCard()">LATER</button>`
  });
  wheelAngle = 0;
  paintWheel(0);
}
function paintWheel(angle){
  const c=document.getElementById('wheel'); if(!c) return;
  const ctx=c.getContext('2d');
  const R=145, cx=150, cy=150, n=WHEEL.length, step=Math.PI*2/n;
  ctx.clearRect(0,0,300,300);
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(angle);
  for(let i=0;i<n;i++){
    const a0=i*step - Math.PI/2 - step/2;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,R,a0,a0+step); ctx.closePath();
    ctx.fillStyle = WHEEL[i].c; ctx.fill();
    ctx.strokeStyle='#170f08'; ctx.lineWidth=3; ctx.stroke();
    // label — flip on the left half so nothing reads upside-down
    ctx.save();
    const mid = a0 + step/2;
    ctx.rotate(mid);
    ctx.fillStyle='#170f08';
    ctx.font='7px monospace';
    ctx.textBaseline='middle';
    const abs = ((mid + angle) % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
    if(abs > Math.PI/2 && abs < Math.PI*1.5){
      ctx.rotate(Math.PI);
      ctx.textAlign='left';
      ctx.fillText(WHEEL[i].n.slice(0,14), -(R-12), 0);
    } else {
      ctx.textAlign='right';
      ctx.fillText(WHEEL[i].n.slice(0,14), R-12, 0);
    }
    ctx.restore();
  }
  ctx.restore();
  // hub
  ctx.beginPath(); ctx.arc(cx,cy,24,0,Math.PI*2);
  ctx.fillStyle='#170f08'; ctx.fill();
  ctx.strokeStyle='#ffd24a'; ctx.lineWidth=3; ctx.stroke();
  ctx.fillStyle='#ffd24a'; ctx.font='8px monospace';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('SPIN', cx, cy);
}
function spinWheel(){
  if(wheelSpinning) return;
  wheelSpinning = true;
  const btn=document.getElementById('btnWheelSpin'); if(btn) btn.disabled=true;
  const n = WHEEL.length, step = Math.PI*2/n;
  const target = Math.floor(Math.random()*n);
  const turns = 5 + Math.random()*2;
  const finalAngle = turns*Math.PI*2 - target*step;
  const dur = 3600, t0 = Date.now();
  (function anim(){
    const p = Math.min(1, (Date.now()-t0)/dur);
    const e = 1 - Math.pow(1-p, 4);
    paintWheel(finalAngle * e);
    if(p<1){ requestAnimationFrame(anim); }
    else {
      wheelSpinning = false;
      S.spins++;
      showWheelResult(WHEEL[target]);
    }
  })();
}
function showWheelResult(w){
  S.resolved = true;
  const ch = CHARS.find(c=>c.id===S.charId);
  const bonus = ch.id==='jester' ? 1.5 : 1;
  const gained = Math.round(w.xp*bonus);
  S.xp += gained;
  while(S.xp >= xpNeeded(S.level)){ S.xp -= xpNeeded(S.level); S.level++; showLevelUp(); }
  if(w.drink){ S.drinks++; addPace(12); }
  if(w.heal){ S.waters++; addPace(-w.heal); }
  if(w.doubleNext) S.doubleNext = true;
  grantSouvenir(T.CHAOS);
  grantCoins(5);
  addLog(`🎡 ${w.n} — +${gained} XP`);
  checkAchievements(); save(); syncHUD();
  maybeOpenShop();

  const canRespin = (ch.id==='jester' && S.respin>0);
  showCard({
    cls:'chaos',
    tag:'THE WHEEL HAS SPOKEN',
    title:'🎡 '+w.n,
    venue:'',
    body:w.d,
    chips:[`+${gained} XP`, w.drink?'🍺 DRINK':'', w.heal?'💧 MERCY':''].filter(Boolean),
    buttons:`${canRespin?`<button class="btn gold sm" onclick="jesterRespin()">🃏 JESTER RE-SPIN (${S.respin} left)</button>`:''}
             <button class="btn primary" onclick="closeCard()">✓ ACCEPTED</button>`
  });
}
function jesterRespin(){ S.respin--; save(); openWheel(); }

/* ---------- generic card renderer ---------- */
function showCard(o){
  closeCard();
  const ov = document.createElement('div');
  ov.className='overlay'; ov.id='cardOverlay';
  const chips = (o.chips||[]).map(c=>`<div class="chip">${c}</div>`).join('');
  ov.innerHTML = `<div class="card ${o.cls||''}">
    <div class="cardTag">${o.tag||''}</div>
    <div class="cardTitle">${o.title||''}</div>
    ${o.body?`<div class="cardBody">${escapeHtml(o.body).replace(/\n/g,'<br>')}</div>`:''}
    ${chips?`<div class="rewardRow">${chips}</div>`:''}
    ${o.extra||''}
    ${o.raw||''}
    ${o.buttons||''}
  </div>`;
  document.body.appendChild(ov);
}
function closeCard(){ const e=document.getElementById('cardOverlay'); if(e) e.remove(); }

/* ---------- secret mission (private, local-only, never shown to others) ---------- */
function openSecret(){
  if(!S.secret) return;
  const m = S.secret;
  let buttons, tag, chips;
  if(S.secretBlown){
    buttons = `<button class="btn ghost" onclick="closeCard()">◀ CLOSE</button>`;
    tag = '🤫 SECRET MISSION — BLOWN';
    chips = ['✗ THEY FIGURED IT OUT'];
  } else if(S.secretDone){
    buttons = `<button class="btn ghost" onclick="closeCard()">◀ CLOSE</button>`;
    tag = '🤫 SECRET MISSION — COMPLETE';
    chips = ['✓ DONE'];
  } else {
    buttons = `<button class="btn purple" onclick="completeSecret()">✓ MISSION COMPLETE (+${m.xp} XP)</button>
       <button class="btn red sm" onclick="failSecret()">✗ THEY FIGURED IT OUT</button>
       <button class="btn ghost sm" onclick="closeCard()">KEEP IT GOING</button>`;
    tag = '🤫 SECRET MISSION — FOR YOUR EYES ONLY';
    chips = [`+${m.xp} XP IF YOU PULL IT OFF`];
  }
  showCard({
    cls:'boss',
    tag,
    title: m.n,
    venue:'',
    body: m.d,
    chips,
    extra:`<p class="small dim">Nobody else in the squad can see this. If they ever realize what you're doing, the mission is blown for good — there's no retry.</p>`,
    buttons
  });
}
function completeSecret(){
  if(!S.secret || S.secretDone || S.secretBlown) return;
  S.secretDone = true;
  const gained = grantXP(S.secret.xp, 'secret');
  addLog(`🤫 SECRET MISSION COMPLETE — ${S.secret.n} — +${gained} XP`);
  toast('MISSION COMPLETE. NOBODY SUSPECTS A THING.');
  checkAchievements(); save(); syncHUD(); renderBag();
  closeCard();
  setTimeout(()=>offerRiskyMission(), 500);
}
function failSecret(){
  if(!S.secret || S.secretDone || S.secretBlown) return;
  S.secretBlown = true;
  addLog(`🤫 SECRET MISSION BLOWN — ${S.secret.n}`);
  toast('BUSTED. THEY KNOW.');
  save(); syncHUD(); renderBag();
  closeCard();
}

/* ---------- tier 2: high risk mission, unlocked only after tier 1 succeeds ---------- */
function offerRiskyMission(){
  if(S.secret2Available || S.secret2Declined) return; // already offered once — no repeats
  const m = TIER2_MISSIONS[Math.floor(Math.random()*TIER2_MISSIONS.length)];
  showCard({
    cls:'boss',
    tag:'🔥 HIGH RISK MISSION AVAILABLE',
    title: '🔥 '+m.n,
    venue:'',
    body: m.d,
    chips:[`+${m.xp} XP IF YOU PULL IT OFF`, `-${m.xp} XP IF YOU GET CAUGHT`],
    extra:`<p class="small dim">This one is harder, and it bites back. Get caught and you lose exactly the XP you would have gained — not a flat penalty, the real amount. Decide now: there's no changing your mind later.</p>`,
    buttons:`<button class="btn red" onclick="acceptRiskyMission('${m.n.replace(/'/g,"\\'")}')">🔥 ACCEPT THE RISK</button>
             <button class="btn ghost sm" onclick="declineRiskyMission()">PLAY IT SAFE</button>`
  });
  window._pendingRiskyMission = m;
}
function acceptRiskyMission(){
  const m = window._pendingRiskyMission;
  if(!m) return;
  S.secret2 = m;
  S.secret2Available = true;
  addLog(`🔥 Accepted the high risk mission: ${m.n}`);
  toast('🔥 ACCEPTED. NO TURNING BACK.');
  save(); syncHUD(); renderBag();
  closeCard();
}
function declineRiskyMission(){
  S.secret2Declined = true;
  addLog('Declined the high risk mission — played it safe');
  toast('PLAYED IT SAFE.');
  save(); syncHUD(); renderBag();
  closeCard();
}
function openSecret2(){
  if(!S.secret2) return;
  const m = S.secret2;
  let buttons, tag, chips;
  if(S.secret2Blown){
    buttons = `<button class="btn ghost" onclick="closeCard()">◀ CLOSE</button>`;
    tag = '🔥 HIGH RISK MISSION — BLOWN';
    chips = ['✗ THEY FIGURED IT OUT', `-${m.xp} XP TAKEN`];
  } else if(S.secret2Done){
    buttons = `<button class="btn ghost" onclick="closeCard()">◀ CLOSE</button>`;
    tag = '🔥 HIGH RISK MISSION — COMPLETE';
    chips = ['✓ DONE'];
  } else {
    buttons = `<button class="btn red" onclick="completeSecret2()">✓ MISSION COMPLETE (+${m.xp} XP)</button>
       <button class="btn red sm" onclick="failSecret2()">✗ THEY FIGURED IT OUT (-${m.xp} XP)</button>
       <button class="btn ghost sm" onclick="closeCard()">KEEP IT GOING</button>`;
    tag = '🔥 HIGH RISK MISSION — FOR YOUR EYES ONLY';
    chips = [`+${m.xp} XP IF YOU PULL IT OFF`, `-${m.xp} XP IF YOU GET CAUGHT`];
  }
  showCard({
    cls:'boss',
    tag,
    title: m.n,
    venue:'',
    body: m.d,
    chips,
    extra:`<p class="small dim">Same rule as before, but it costs you this time — if they ever figure out what you're doing, you lose the full XP reward on the spot.</p>`,
    buttons
  });
}
function completeSecret2(){
  if(!S.secret2 || S.secret2Done || S.secret2Blown) return;
  S.secret2Done = true;
  const gained = grantXP(S.secret2.xp, 'secret2');
  addLog(`🔥 HIGH RISK MISSION COMPLETE — ${S.secret2.n} — +${gained} XP`);
  toast('PULLED IT OFF. THAT WAS THE RISKY ONE.');
  checkAchievements(); save(); syncHUD(); renderBag();
  closeCard();
}
function failSecret2(){
  if(!S.secret2 || S.secret2Done || S.secret2Blown) return;
  S.secret2Blown = true;
  loseXP(S.secret2.xp, 'secret2 blown');
  addLog(`🔥 HIGH RISK MISSION BLOWN — ${S.secret2.n} — -${S.secret2.xp} XP`);
  toast('BUSTED. THAT ONE COST YOU.');
  save(); syncHUD(); renderBag();
  closeCard();
}
function loseXP(amount, why){
  S.xp = Math.max(0, S.xp - amount);
  floatText('-'+amount+' XP', '#ff4d5e');
  save(); syncHUD();
}

/* ---------- shop ---------- */
function openShop(){
  const relicRows = RELICS.filter(r=>!r.char || r.char===S.charId).map(r=>{
    const owned = S.relics.includes(r.id);
    const action = owned
      ? `<span class="green" style="font-size:8px;white-space:nowrap">OWNED</span>`
      : `<button class="btn purple sm" style="width:auto;margin:0;padding:7px 9px" onclick="buyRelic('${r.id}')" ${S.coins<r.price?'disabled':''}>${r.price}🪙</button>`;
    return `<div class="chip" style="width:100%;box-sizing:border-box;display:flex;justify-content:space-between;align-items:center;gap:8px;text-align:left;padding:8px;">
      <span>${r.icon} <b class="gold">${r.n}</b><br><span class="dim" style="font-size:7px">${r.d}</span></span>
      ${action}
    </div>`;
  }).join('');
  const itemRows = CONSUMABLES.filter(c=>!c.char || c.char===S.charId).map(c=>{
    const owned = S.items[c.id]||0;
    return `<div class="chip" style="width:100%;box-sizing:border-box;display:flex;justify-content:space-between;align-items:center;gap:8px;text-align:left;padding:8px;">
      <span>${c.icon} <b class="cyan">${c.n}</b>${owned?` <span class="dim">x${owned}</span>`:''}<br><span class="dim" style="font-size:7px">${c.d}</span></span>
      <button class="btn cyan sm" style="width:auto;margin:0;padding:7px 9px" onclick="buyConsumable('${c.id}')" ${S.coins<c.price?'disabled':''}>${c.price}🪙</button>
    </div>`;
  }).join('');
  showCard({
    cls:'good',
    tag:'🛒 PIT STOP',
    title:`🪙 ${S.coins} SKÅL COINS`,
    venue:'',
    body:'Spend what you\'ve earned. Relics last all night. Items are one-time use, saved in your BAG.',
    raw:`<div class="cardBody" style="font-size:9px;margin-bottom:4px"><b class="gold">RELICS</b></div>
         <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">${relicRows}</div>
         <div class="cardBody" style="font-size:9px;margin-bottom:4px"><b class="cyan">ITEMS</b></div>
         <div style="display:flex;flex-direction:column;gap:6px">${itemRows}</div>`,
    buttons:`<button class="btn primary" onclick="closeCard()">✓ DONE SHOPPING</button>`
  });
}
function buyRelic(id){
  const r = RELICS.find(x=>x.id===id); if(!r) return;
  if(r.char && r.char!==S.charId) return; // exclusive to another character
  if(S.relics.includes(id)){ toast('ALREADY OWNED'); return; }
  if(S.coins<r.price){ toast('NOT ENOUGH COINS'); return; }
  S.coins -= r.price; S.relics.push(id);
  addLog(`Bought relic: ${r.n} (+${r.brewBonus||0} beer/min, permanently)`);
  toast(r.icon+' '+r.n+' — EQUIPPED, +'+(r.brewBonus||0)+' BEER/MIN');
  save(); syncHUD(); openShop();
}
function buyConsumable(id){
  const c = CONSUMABLES.find(x=>x.id===id); if(!c) return;
  if(c.char && c.char!==S.charId) return; // exclusive to another character
  if(S.coins<c.price){ toast('NOT ENOUGH COINS'); return; }
  S.coins -= c.price; S.items[id] = (S.items[id]||0)+1;
  addLog(`Bought item: ${c.n}`);
  toast(c.n+' ADDED TO YOUR BAG');
  save(); syncHUD(); openShop();
}

/* ---------- bag / inventory ---------- */
function useItem(id){
  if(!S.items[id] || S.items[id]<=0){ toast('NONE LEFT'); return; }
  const c = CONSUMABLES.find(x=>x.id===id);
  S.items[id]--;
  if(id==='icebucket'){
    S.skips = (S.skips||0)+1;
    addLog('Used RELOAD — +1 reroll');
    toast('🔁 RELOADED. +1 REROLL');
  } else if(id==='fakeid'){
    S.autoWinNext = true;
    addLog('Activated FAKE ID — next challenge is covered');
    toast('🪪 FAKE ID READY FOR YOUR NEXT TILE');
  } else if(c){
    addLog('Used item: '+c.n);
  }
  save(); syncHUD(); renderBag();
}
function renderBag(){
  if(!S) return;
  const coinsEl = document.getElementById('bagCoins');
  if(coinsEl) coinsEl.textContent = S.coins;
  const secretLabel = document.getElementById('secretBtnLabel');
  if(secretLabel) secretLabel.textContent = S.secretBlown ? 'MY MISSION — BLOWN ✗' : (S.secretDone ? 'MY MISSION — COMPLETE ✓' : 'VIEW MY MISSION');
  const secret2Btn = document.getElementById('secret2Btn');
  const secret2Label = document.getElementById('secret2BtnLabel');
  if(secret2Btn){
    secret2Btn.classList.toggle('hide', !S.secret2Available);
    if(secret2Label) secret2Label.textContent = S.secret2Blown ? 'HIGH RISK — BLOWN ✗' : (S.secret2Done ? 'HIGH RISK — COMPLETE ✓' : 'HIGH RISK MISSION');
  }
  const upgEl = document.getElementById('bagUpgradeList');
  if(upgEl){
    const ups = S.breweryUpgrades||[];
    upgEl.innerHTML = ups.length
      ? `<p class="small" style="margin:0 0 6px">🍺 ${computeBreweryRate().toFixed(1)} beer/min · ${((S.beerCoinsTotal||0)+(S.coinAccum||0)).toFixed(1)} brewed lifetime</p>` +
        ups.map(u=>`<div class="logItem gold">${u.icon} ${u.n}</div>`).join('')
      : 'None yet. Level up to pick your first one.';
  }
  const grid = document.getElementById('souvenirGrid');
  if(grid){
    const types = Object.keys(SOUVENIRS);
    grid.innerHTML = types.map(t=>{
      const sv = SOUVENIRS[t]; const n = S.souvenirs[t]||0;
      return `<div class="pill" style="text-align:center;display:flex;flex-direction:column;gap:2px;padding:8px 4px;">
        <span style="font-size:16px">${sv.icon}</span>
        <span style="font-size:7px" class="${n>0?'gold':'dim'}">${sv.n}</span>
        <span style="font-size:8px">${n>0?'x'+n:'—'}</span>
      </div>`;
    }).join('');
    const collected = types.filter(t=>(S.souvenirs[t]||0)>0).length;
    const prog = document.getElementById('souvenirProgress');
    if(prog){
      prog.innerHTML = (collected>=types.length)
        ? '🏅 <span class="gold">FULL SET COLLECTED — AARHUS COMPLETIONIST.</span> You have officially seen it all.'
        : collected+' / '+types.length+' souvenir types collected.';
    }
  }
  const relicEl = document.getElementById('relicList');
  if(relicEl){
    relicEl.innerHTML = S.relics.length
      ? S.relics.map(id=>{ const r=RELICS.find(x=>x.id===id); return r ? `<div class="logItem gold">${r.icon} <b>${r.n}</b><br><span class="dim">${r.d}</span></div>` : ''; }).join('')
      : 'None yet. Visit the shop.';
  }
  const itemEl = document.getElementById('itemList');
  if(itemEl){
    const owned = CONSUMABLES.filter(c=>(S.items[c.id]||0)>0);
    itemEl.innerHTML = owned.length
      ? owned.map(c=>`<div class="logItem"><span class="cyan">${c.icon} ${c.n}</span> <span class="dim">x${S.items[c.id]}</span>
          <button class="btn cyan sm" style="width:auto;margin:6px 0 0;padding:6px 10px" onclick="useItem('${c.id}')">USE</button></div>`).join('')
      : 'Empty. Buy something from the shop.';
  }
}

/* ---------- rules ---------- */
function openRules(){
  showCard({
    cls:'good',
    tag:'HOUSE RULES',
    title:'📜 HOW TO PLAY',
    venue:'',
    body:'',
    raw:`<div class="cardBody" style="font-size:9px;line-height:2.1">
      <b class="cyan">THE SETUP</b><br>
      All four of you open this on your own phone. Pick a character, type your name. Everyone plays their own private run.<br><br>
      <b class="gold">THE GOAL</b><br>
      Build the best brewery in Aarhus. The slot machine below is how you fund it — every pull is a night out that earns coin, XP and beer production for the brewery sitting above it.<br><br>
      <b class="cyan">THE LOOP</b><br>
      Pull the lever → the reels land on an outcome → do the thing → mark it done or failed. No dice, no board — just the reels, and you can spend a reroll if you don't like what came up. Win = XP + coins + beer/min. Lose = forfeit.<br><br>
      <b class="cyan">GAMBLING</b><br>
      You never lose when you gamble. You just get a free drink. That is the rule and it is beautiful.<br><br>
      <b class="red">💀 BAD LUCK</b><br>
      Sometimes the reels just hate you — most of the time that's an order to drink water, but occasionally a Ceres you didn't ask for, drinking alone, or sitting a round out. Keep failing challenges and bad luck starts showing up a lot more often, so maybe stop losing.<br><br>
      <b class="purple">🎲 PARTY GAMES</b><br>
      Some SOCIAL outcomes are full group games — Never Have I Ever, Ride the Bus, the Number Game, Which Is More Popular, and a few more. Everyone plays, whoever loses the game takes the tile's outcome.<br><br>
      <b class="purple">🤫 SECRET MISSION</b><br>
      Everyone gets one privately assigned mission only they can see, tucked in the <b>BAG</b> tab — and every phone rolls its own, so nobody has the same one. Each mission is about getting the WHOLE squad to do something, without them realizing you're behind it. Pull it off for bonus XP. But if they ever catch on, tap "THEY FIGURED IT OUT" — the mission is blown for good, no retries.<br><br>
      <b class="red">🔥 HIGH RISK MISSION</b><br>
      Complete your first secret mission and a second, harder one unlocks — bigger XP, but if you get caught this time you lose exactly the XP you would have gained. You choose once whether to accept the risk; no changing your mind after.<br><br>
      <b class="orange">🪙 LOOT & SHOP</b><br>
      Winning tiles earns Skål Coins and a silly souvenir (coasters, bottle caps, poker chips...) — check the <b>BAG</b> tab to see your stash. A shop pops up every lap and after boss fights — spend coins on <b>relics</b> (personal buffs that also permanently boost your brewery's beer output, like a Lucky Hat that saves your first fail each lap) or one-time <b>items</b>. Collect one of every souvenir type for a secret completionist bonus.<br><br>
      <b class="cyan">THE BREWERY</b><br>
      That scene above the board is <b>yours to build</b> — it brews beer into coins the whole night, live, whether you're looking at it or not. Every time you level up, a chest appears — open it for a Common/Rare/Epic/Legendary/Unique upgrade, more production, and a different look every time, so nobody's brewery ends up the same. Watch for a bigger building, a water wheel, a beer garden, gargoyles, a dragon weathervane... and once you hit level 9, things get considerably less normal.<br><br>
      <b class="gold">THE FINE PRINT</b><br>
      · <b>2 rerolls</b> each — spend one on a spin you don't like, no penalty.<br>
      · Mercy tiles (💧 water, 🥙 kebab) are worth big XP on purpose.<br>
      · Got a beer that isn't part of any outcome? Hit <b>LOG A BEER</b> on the Game tab — still counts, still gives XP.<br><br>
      <b class="gold">★ It's his birthday. Make it a good one. ★</b>
    </div>`,
    buttons:`<button class="btn primary" onclick="closeCard()">✓ GOT IT</button>`
  });
}

/* ---------- full backup / restore (survives localStorage getting wiped) ---------- */
function encodeFullSave(){
  try{ return 'ASFULL1:' + btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
  catch(e){ return 'ASFULL1:' + btoa(JSON.stringify(S)); }
}
function renderBackup(){
  const el = document.getElementById('myBackup');
  if(el) el.value = encodeFullSave();
}
function copyBackup(){
  const el = document.getElementById('myBackup');
  if(!el) return;
  el.select(); el.setSelectionRange(0, 99999);
  let ok=false;
  try{ ok = document.execCommand('copy'); }catch(e){}
  if(navigator.clipboard){ navigator.clipboard.writeText(el.value).then(()=>toast('BACKUP COPIED — SAVE IT SOMEWHERE SAFE')).catch(()=>{}); }
  toast(ok?'BACKUP COPIED — SAVE IT SOMEWHERE SAFE':'SELECT & COPY THE TEXT');
}
let pendingRestoreRaw = null;
function restoreBackup(){
  const raw = (document.getElementById('restoreCode').value||'').trim();
  if(!raw.startsWith('ASFULL1:')){ toast('THAT IS NOT A VALID BACKUP CODE'); return; }
  pendingRestoreRaw = raw;
  showCard({
    cls:'forfeit', tag:'ARE YOU SURE', title:'⬆ RESTORE THIS BACKUP',
    body:'This replaces your CURRENT run on this phone with whatever is in the backup code. Your current progress will be lost unless you also backed that up.',
    buttons:`<button class="btn red" onclick="doRestoreBackup()">YES, RESTORE IT</button>
             <button class="btn ghost sm" onclick="closeCard()">NO, CANCEL</button>`
  });
}
function doRestoreBackup(){
  closeCard();
  const raw = pendingRestoreRaw;
  pendingRestoreRaw = null;
  if(!raw) return;
  try{
    const json = decodeURIComponent(escape(atob(raw.slice(8))));
    const p = JSON.parse(json);
    S = Object.assign(freshState(), p);
    if(!S.lastProdTs) S.lastProdTs = Date.now(); // older backups predate the brewery production timer
    save(); syncHUD(); renderBackup();
    document.getElementById('restoreCode').value='';
    toast('RUN RESTORED — WELCOME BACK, '+S.name);
  }catch(e){ toast('COULD NOT READ THAT BACKUP CODE'); }
}

/* ---------- reset ---------- */
function hardReset(){
  showCard({
    cls:'forfeit', tag:'ARE YOU SURE', title:'⟲ RESET RUN',
    body:'This wipes your level, XP, log, coins, your entire brewery and everything in your bag on this phone. The night is not undone, only the scoreboard.',
    buttons:`<button class="btn red" onclick="doReset()">YES, WIPE IT</button>
             <button class="btn ghost sm" onclick="closeCard()">NO, CANCEL</button>`
  });
}
function doReset(){ store.del('as_state'); S = freshState(); closeCard(); go('boot'); toast('RUN RESET'); }

/* ---------- init ---------- */
(function init(){
  if(load()){
    syncHUD(); go('game'); toast('WELCOME BACK, '+S.name);
  } else {
    S = freshState();
    go('boot');
  }
  buildCharGrid();
  loop();
  setInterval(()=>{ if(S && S.name) syncHUD(); }, 5000);
  setInterval(()=>{ if(S && S.name) tickBreweryProduction(); }, 1500);
})();
