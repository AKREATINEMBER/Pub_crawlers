/* =========================================================
   AARHUS SURVIVORS — roguelike pub crawl
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
    body:'The prophecy begins. Everyone raises a glass. The night begins. Pass here again and the whole squad toasts like it\'s a coronation.', xp:5 },

  { n:'FIRST BEER', t:T.BEER, icon:'🍺', venue:'Væskebalancen, Jægergårdsgade — proper neighbourhood bar.',
    body:'Order a beer you have never had before. This is officially "research." No repeats all night — you\'re building a legacy, not a rut.', xp:15, drink:1 },

  { n:'BEER PONG', t:T.GAMBLE, icon:'🏓', venue:'Anywhere with a flat table and low standards.',
    body:'2v2, best of one, played with the gravity of an Olympic final nobody else knew was happening. Winners choose the next bar. Losers take the forfeit and their dignity, briefly, elsewhere.', xp:25, gamble:true },

  { n:'SPLIT THE G', t:T.BOSS, icon:'🍀', venue:'Tir Na nÓg, Frederiksgade — real Guinness, real judgement.',
    body:'One pint of Guinness. One gulp. Land the foam line exactly on the G in GUINNESS, as the ancient Irish gods intended.\n\nPERFECT SPLIT = legend status, statue optional.\nCLOSE = respect, no statue.\nMISS = forfeit, and the Guinness gods remember your name.', xp:60, drink:1, gamble:true },

  { n:'SHOT ROULETTE', t:T.SHOT, icon:'🥃', venue:'Bartender picks. You do not.',
    body:'Everyone points at someone, democracy at its finest. Most-pointed picks the shot for the whole table, sight unseen.', xp:20, drink:1 },

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
    body:'One full song, all four of you, no phones, no irony, full commitment to whatever this dance is supposed to be. Squad votes on the song.', xp:35 },

  { n:'PHOTO MISSION', t:T.SOCIAL, icon:'📸', venue:'',
    body:'Recreate a photo from a night out years ago. Same poses, same energy, twice the regret. Post it in the group chat as historical documentation.', xp:30 },

  { n:'LAST ORDERS', t:T.SOCIAL, icon:'🔔', venue:'',
    body:'Everyone says one honest nice thing about the person to their left. Then a final round.\n\nThen: kebab, taxi, bed. In that sacred order.', xp:40, drink:1 },

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
  { n:'NEW NICKNAME',      c:'#ffd24a', d:'The squad votes you a nickname. It is legally binding for the rest of the night.', xp:15 },
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
/* ---------- svg icon system ---------- */
// All icons: 16×16 viewBox, currentColor — scale with sz parameter
const ICON_MAP = {
  '🎩': '<rect x="4" y="1" width="8" height="1" fill="#0d0d1a"/><rect x="3" y="2" width="1" height="1" fill="#0d0d1a"/><rect x="4" y="2" width="8" height="1" fill="#1a1530"/><rect x="12" y="2" width="1" height="1" fill="#0d0d1a"/><rect x="3" y="3" width="1" height="1" fill="#0d0d1a"/><rect x="4" y="3" width="8" height="1" fill="#2a2048"/><rect x="12" y="3" width="1" height="1" fill="#0d0d1a"/><rect x="3" y="4" width="1" height="1" fill="#0d0d1a"/><rect x="4" y="4" width="8" height="1" fill="#3d3060"/><rect x="12" y="4" width="1" height="1" fill="#0d0d1a"/><rect x="3" y="5" width="1" height="1" fill="#0d0d1a"/><rect x="4" y="5" width="8" height="1" fill="#6655a0"/><rect x="12" y="5" width="1" height="1" fill="#0d0d1a"/><rect x="3" y="6" width="1" height="1" fill="#0d0d1a"/><rect x="4" y="6" width="8" height="1" fill="#3d3060"/><rect x="12" y="6" width="1" height="1" fill="#0d0d1a"/><rect x="3" y="7" width="1" height="1" fill="#0d0d1a"/><rect x="4" y="7" width="8" height="1" fill="#d4a820"/><rect x="12" y="7" width="1" height="1" fill="#0d0d1a"/><rect x="3" y="8" width="1" height="1" fill="#0d0d1a"/><rect x="4" y="8" width="8" height="1" fill="#8a6800"/><rect x="12" y="8" width="1" height="1" fill="#0d0d1a"/><rect x="2" y="9" width="1" height="1" fill="#0d0d1a"/><rect x="3" y="9" width="10" height="1" fill="#c8a020"/><rect x="13" y="9" width="1" height="1" fill="#0d0d1a"/><rect x="2" y="10" width="1" height="1" fill="#0d0d1a"/><rect x="3" y="10" width="10" height="1" fill="#ffe060"/><rect x="13" y="10" width="1" height="1" fill="#0d0d1a"/><rect x="2" y="11" width="1" height="1" fill="#0d0d1a"/><rect x="3" y="11" width="10" height="1" fill="#ffe060"/><rect x="13" y="11" width="1" height="1" fill="#0d0d1a"/><rect x="2" y="12" width="1" height="1" fill="#0d0d1a"/><rect x="3" y="12" width="10" height="1" fill="#f0e0a0"/><rect x="13" y="12" width="1" height="1" fill="#0d0d1a"/><rect x="2" y="13" width="12" height="1" fill="#0d0d1a"/>',
  '⚡': '<rect x="8" y="0" width="4" height="1" fill="#ffffff"/><rect x="12" y="0" width="4" height="1" fill="#ffe030"/><rect x="7" y="1" width="1" height="1" fill="#ffffff"/><rect x="8" y="1" width="5" height="1" fill="#ffe030"/><rect x="13" y="1" width="3" height="1" fill="#ffc000"/><rect x="6" y="2" width="1" height="1" fill="#ffffff"/><rect x="7" y="2" width="5" height="1" fill="#ffe030"/><rect x="12" y="2" width="3" height="1" fill="#ffc000"/><rect x="5" y="3" width="1" height="1" fill="#ffffff"/><rect x="6" y="3" width="5" height="1" fill="#ffe030"/><rect x="11" y="3" width="3" height="1" fill="#ffc000"/><rect x="4" y="4" width="1" height="1" fill="#ffffff"/><rect x="5" y="4" width="5" height="1" fill="#ffe030"/><rect x="10" y="4" width="3" height="1" fill="#ffc000"/><rect x="3" y="5" width="1" height="1" fill="#ffffff"/><rect x="4" y="5" width="5" height="1" fill="#ffe030"/><rect x="9" y="5" width="3" height="1" fill="#ffc000"/><rect x="2" y="6" width="1" height="1" fill="#ffffff"/><rect x="3" y="6" width="12" height="1" fill="#ffe030"/><rect x="1" y="7" width="1" height="1" fill="#ffffff"/><rect x="2" y="7" width="13" height="1" fill="#ffe030"/><rect x="0" y="8" width="1" height="1" fill="#1a1400"/><rect x="1" y="8" width="12" height="1" fill="#ffe030"/><rect x="13" y="8" width="1" height="1" fill="#1a1400"/><rect x="0" y="9" width="1" height="1" fill="#1a1400"/><rect x="1" y="9" width="6" height="1" fill="#ffe030"/><rect x="7" y="9" width="1" height="1" fill="#1a1400"/><rect x="0" y="10" width="1" height="1" fill="#1a1400"/><rect x="1" y="10" width="4" height="1" fill="#ffe030"/><rect x="5" y="10" width="1" height="1" fill="#1a1400"/><rect x="0" y="11" width="1" height="1" fill="#1a1400"/><rect x="1" y="11" width="3" height="1" fill="#ffe030"/><rect x="4" y="11" width="1" height="1" fill="#1a1400"/><rect x="0" y="12" width="1" height="1" fill="#1a1400"/><rect x="1" y="12" width="2" height="1" fill="#ffe030"/><rect x="3" y="12" width="1" height="1" fill="#1a1400"/><rect x="0" y="13" width="1" height="1" fill="#1a1400"/><rect x="1" y="13" width="1" height="1" fill="#ffe030"/><rect x="2" y="13" width="1" height="1" fill="#1a1400"/><rect x="0" y="14" width="2" height="1" fill="#1a1400"/>',
  '💍': '<rect x="6" y="1" width="5" height="1" fill="#1a0d00"/><rect x="4" y="2" width="2" height="1" fill="#1a0d00"/><rect x="11" y="2" width="2" height="1" fill="#1a0d00"/><rect x="3" y="3" width="1" height="1" fill="#1a0d00"/><rect x="4" y="3" width="9" height="1" fill="#8a6800"/><rect x="13" y="3" width="1" height="1" fill="#1a0d00"/><rect x="2" y="4" width="1" height="1" fill="#1a0d00"/><rect x="3" y="4" width="2" height="1" fill="#8a6800"/><rect x="5" y="4" width="7" height="1" fill="#d4a820"/><rect x="12" y="4" width="2" height="1" fill="#8a6800"/><rect x="14" y="4" width="1" height="1" fill="#1a0d00"/><rect x="2" y="5" width="1" height="1" fill="#1a0d00"/><rect x="3" y="5" width="1" height="1" fill="#8a6800"/><rect x="4" y="5" width="1" height="1" fill="#d4a820"/><rect x="5" y="5" width="7" height="1" fill="#ffe060"/><rect x="12" y="5" width="1" height="1" fill="#d4a820"/><rect x="13" y="5" width="1" height="1" fill="#8a6800"/><rect x="14" y="5" width="1" height="1" fill="#1a0d00"/><rect x="1" y="6" width="1" height="1" fill="#1a0d00"/><rect x="2" y="6" width="1" height="1" fill="#8a6800"/><rect x="3" y="6" width="1" height="1" fill="#d4a820"/><rect x="4" y="6" width="2" height="1" fill="#ffe060"/><rect x="6" y="6" width="1" height="1" fill="#ffffff"/><rect x="7" y="6" width="3" height="1" fill="#40a8e0"/><rect x="10" y="6" width="1" height="1" fill="#ffffff"/><rect x="11" y="6" width="2" height="1" fill="#ffe060"/><rect x="13" y="6" width="1" height="1" fill="#d4a820"/><rect x="14" y="6" width="1" height="1" fill="#8a6800"/><rect x="15" y="6" width="1" height="1" fill="#1a0d00"/><rect x="1" y="7" width="1" height="1" fill="#1a0d00"/><rect x="2" y="7" width="1" height="1" fill="#8a6800"/><rect x="3" y="7" width="1" height="1" fill="#d4a820"/><rect x="4" y="7" width="2" height="1" fill="#ffe060"/><rect x="6" y="7" width="1" height="1" fill="#ffffff"/><rect x="7" y="7" width="1" height="1" fill="#80d4ff"/><rect x="8" y="7" width="2" height="1" fill="#40a8e0"/><rect x="10" y="7" width="1" height="1" fill="#ffffff"/><rect x="11" y="7" width="2" height="1" fill="#ffe060"/><rect x="13" y="7" width="1" height="1" fill="#d4a820"/><rect x="14" y="7" width="1" height="1" fill="#8a6800"/><rect x="15" y="7" width="1" height="1" fill="#1a0d00"/><rect x="1" y="8" width="1" height="1" fill="#1a0d00"/><rect x="2" y="8" width="1" height="1" fill="#8a6800"/><rect x="3" y="8" width="1" height="1" fill="#d4a820"/><rect x="4" y="8" width="2" height="1" fill="#ffe060"/><rect x="6" y="8" width="1" height="1" fill="#ffffff"/><rect x="7" y="8" width="3" height="1" fill="#40a8e0"/><rect x="10" y="8" width="1" height="1" fill="#ffffff"/><rect x="11" y="8" width="2" height="1" fill="#ffe060"/><rect x="13" y="8" width="1" height="1" fill="#d4a820"/><rect x="14" y="8" width="1" height="1" fill="#8a6800"/><rect x="15" y="8" width="1" height="1" fill="#1a0d00"/><rect x="2" y="9" width="1" height="1" fill="#1a0d00"/><rect x="3" y="9" width="2" height="1" fill="#8a6800"/><rect x="5" y="9" width="1" height="1" fill="#d4a820"/><rect x="6" y="9" width="7" height="1" fill="#ffe060"/><rect x="13" y="9" width="1" height="1" fill="#d4a820"/><rect x="14" y="9" width="1" height="1" fill="#8a6800"/><rect x="15" y="9" width="1" height="1" fill="#1a0d00"/><rect x="3" y="10" width="1" height="1" fill="#1a0d00"/><rect x="4" y="10" width="2" height="1" fill="#8a6800"/><rect x="6" y="10" width="7" height="1" fill="#d4a820"/><rect x="13" y="10" width="2" height="1" fill="#8a6800"/><rect x="15" y="10" width="1" height="1" fill="#1a0d00"/><rect x="4" y="11" width="1" height="1" fill="#1a0d00"/><rect x="5" y="11" width="9" height="1" fill="#8a6800"/><rect x="14" y="11" width="1" height="1" fill="#1a0d00"/><rect x="6" y="12" width="2" height="1" fill="#1a0d00"/><rect x="11" y="12" width="2" height="1" fill="#1a0d00"/><rect x="8" y="13" width="5" height="1" fill="#1a0d00"/>',
  '👟': '<rect x="2" y="2" width="4" height="1" fill="#1a0800"/><rect x="2" y="3" width="1" height="1" fill="#1a0800"/><rect x="3" y="3" width="4" height="1" fill="#8B4513"/><rect x="7" y="3" width="1" height="1" fill="#1a0800"/><rect x="2" y="4" width="1" height="1" fill="#1a0800"/><rect x="3" y="4" width="4" height="1" fill="#8B4513"/><rect x="7" y="4" width="2" height="1" fill="#1a0800"/><rect x="2" y="5" width="1" height="1" fill="#1a0800"/><rect x="3" y="5" width="4" height="1" fill="#c06030"/><rect x="7" y="5" width="2" height="1" fill="#8B4513"/><rect x="9" y="5" width="1" height="1" fill="#1a0800"/><rect x="2" y="6" width="1" height="1" fill="#1a0800"/><rect x="3" y="6" width="4" height="1" fill="#d08050"/><rect x="7" y="6" width="3" height="1" fill="#8B4513"/><rect x="10" y="6" width="1" height="1" fill="#1a0800"/><rect x="2" y="7" width="1" height="1" fill="#1a0800"/><rect x="3" y="7" width="4" height="1" fill="#d08050"/><rect x="7" y="7" width="4" height="1" fill="#8B4513"/><rect x="11" y="7" width="1" height="1" fill="#1a0800"/><rect x="2" y="8" width="1" height="1" fill="#1a0800"/><rect x="3" y="8" width="5" height="1" fill="#d08050"/><rect x="8" y="8" width="4" height="1" fill="#8B4513"/><rect x="12" y="8" width="1" height="1" fill="#1a0800"/><rect x="2" y="9" width="1" height="1" fill="#1a0800"/><rect x="3" y="9" width="5" height="1" fill="#c06030"/><rect x="8" y="9" width="5" height="1" fill="#8B4513"/><rect x="13" y="9" width="1" height="1" fill="#1a0800"/><rect x="2" y="10" width="1" height="1" fill="#1a0800"/><rect x="3" y="10" width="11" height="1" fill="#8B4513"/><rect x="14" y="10" width="1" height="1" fill="#1a0800"/><rect x="2" y="11" width="1" height="1" fill="#1a0800"/><rect x="3" y="11" width="11" height="1" fill="#8B4513"/><rect x="14" y="11" width="1" height="1" fill="#1a0800"/><rect x="2" y="12" width="2" height="1" fill="#1a0800"/><rect x="4" y="12" width="2" height="1" fill="#404040"/><rect x="6" y="12" width="6" height="1" fill="#606060"/><rect x="12" y="12" width="2" height="1" fill="#404040"/><rect x="14" y="12" width="1" height="1" fill="#1a0800"/><rect x="3" y="13" width="1" height="1" fill="#1a0800"/><rect x="4" y="13" width="10" height="1" fill="#606060"/><rect x="14" y="13" width="1" height="1" fill="#1a0800"/><rect x="4" y="14" width="1" height="1" fill="#1a0800"/><rect x="5" y="14" width="9" height="1" fill="#a0a0a0"/><rect x="14" y="14" width="1" height="1" fill="#1a0800"/>',
  '🕶️': '<rect x="5" y="1" width="6" height="1" fill="#1a1008"/><rect x="4" y="2" width="1" height="1" fill="#1a1008"/><rect x="5" y="2" width="6" height="1" fill="#4a3820"/><rect x="11" y="2" width="1" height="1" fill="#1a1008"/><rect x="4" y="3" width="1" height="1" fill="#1a1008"/><rect x="5" y="3" width="1" height="1" fill="#4a3820"/><rect x="6" y="3" width="2" height="1" fill="#6a5030"/><rect x="8" y="3" width="3" height="1" fill="#4a3820"/><rect x="11" y="3" width="1" height="1" fill="#1a1008"/><rect x="4" y="4" width="1" height="1" fill="#1a1008"/><rect x="5" y="4" width="4" height="1" fill="#6a5030"/><rect x="9" y="4" width="2" height="1" fill="#4a3820"/><rect x="11" y="4" width="1" height="1" fill="#1a1008"/><rect x="2" y="5" width="12" height="1" fill="#1a1008"/><rect x="2" y="6" width="1" height="1" fill="#1a1008"/><rect x="3" y="6" width="10" height="1" fill="#4a3820"/><rect x="13" y="6" width="1" height="1" fill="#1a1008"/><rect x="2" y="7" width="1" height="1" fill="#1a1008"/><rect x="3" y="7" width="1" height="1" fill="#4a3820"/><rect x="4" y="7" width="4" height="1" fill="#0a0808"/><rect x="8" y="7" width="1" height="1" fill="#4a3820"/><rect x="9" y="7" width="3" height="1" fill="#0a0808"/><rect x="12" y="7" width="1" height="1" fill="#4a3820"/><rect x="13" y="7" width="1" height="1" fill="#1a1008"/><rect x="2" y="8" width="1" height="1" fill="#1a1008"/><rect x="3" y="8" width="1" height="1" fill="#4a3820"/><rect x="4" y="8" width="4" height="1" fill="#181210"/><rect x="8" y="8" width="1" height="1" fill="#4a3820"/><rect x="9" y="8" width="3" height="1" fill="#181210"/><rect x="12" y="8" width="1" height="1" fill="#4a3820"/><rect x="13" y="8" width="1" height="1" fill="#1a1008"/><rect x="2" y="9" width="1" height="1" fill="#1a1008"/><rect x="3" y="9" width="1" height="1" fill="#4a3820"/><rect x="4" y="9" width="4" height="1" fill="#0a0808"/><rect x="8" y="9" width="1" height="1" fill="#4a3820"/><rect x="9" y="9" width="3" height="1" fill="#0a0808"/><rect x="12" y="9" width="1" height="1" fill="#4a3820"/><rect x="13" y="9" width="1" height="1" fill="#1a1008"/><rect x="2" y="10" width="1" height="1" fill="#1a1008"/><rect x="3" y="10" width="10" height="1" fill="#4a3820"/><rect x="13" y="10" width="1" height="1" fill="#1a1008"/><rect x="3" y="11" width="2" height="1" fill="#1a1008"/><rect x="5" y="11" width="6" height="1" fill="#4a3820"/><rect x="11" y="11" width="2" height="1" fill="#1a1008"/><rect x="4" y="12" width="1" height="1" fill="#1a1008"/><rect x="5" y="12" width="7" height="1" fill="#3a2810"/><rect x="12" y="12" width="1" height="1" fill="#1a1008"/><rect x="4" y="13" width="1" height="1" fill="#1a1008"/><rect x="5" y="13" width="6" height="1" fill="#5a4020"/><rect x="11" y="13" width="1" height="1" fill="#1a1008"/><rect x="5" y="14" width="1" height="1" fill="#1a1008"/><rect x="6" y="14" width="4" height="1" fill="#7a5830"/><rect x="10" y="14" width="1" height="1" fill="#1a1008"/><rect x="6" y="15" width="1" height="1" fill="#1a1008"/><rect x="7" y="15" width="2" height="1" fill="#2a1c08"/><rect x="9" y="15" width="1" height="1" fill="#1a1008"/>',
  '🍺': '<rect x="4" y="1" width="6" height="1" fill="#1a0d00"/><rect x="3" y="2" width="1" height="1" fill="#1a0d00"/><rect x="4" y="2" width="6" height="1" fill="#f8f8e8"/><rect x="10" y="2" width="2" height="1" fill="#1a0d00"/><rect x="3" y="3" width="1" height="1" fill="#1a0d00"/><rect x="4" y="3" width="5" height="1" fill="#fff8e0"/><rect x="9" y="3" width="2" height="1" fill="#f8f8e8"/><rect x="11" y="3" width="1" height="1" fill="#1a0d00"/><rect x="3" y="4" width="1" height="1" fill="#1a0d00"/><rect x="4" y="4" width="5" height="1" fill="#fff8e0"/><rect x="9" y="4" width="2" height="1" fill="#f8f8e8"/><rect x="11" y="4" width="1" height="1" fill="#1a0d00"/><rect x="12" y="4" width="1" height="1" fill="#808060"/><rect x="13" y="4" width="1" height="1" fill="#1a0d00"/><rect x="3" y="5" width="1" height="1" fill="#1a0d00"/><rect x="4" y="5" width="5" height="1" fill="#d48000"/><rect x="9" y="5" width="2" height="1" fill="#f8f8e8"/><rect x="11" y="5" width="1" height="1" fill="#1a0d00"/><rect x="12" y="5" width="1" height="1" fill="#808060"/><rect x="13" y="5" width="1" height="1" fill="#1a0d00"/><rect x="3" y="6" width="1" height="1" fill="#1a0d00"/><rect x="4" y="6" width="1" height="1" fill="#a05800"/><rect x="5" y="6" width="4" height="1" fill="#d48000"/><rect x="9" y="6" width="1" height="1" fill="#a05800"/><rect x="10" y="6" width="1" height="1" fill="#f8f8e8"/><rect x="11" y="6" width="1" height="1" fill="#1a0d00"/><rect x="12" y="6" width="1" height="1" fill="#808060"/><rect x="13" y="6" width="1" height="1" fill="#1a0d00"/><rect x="3" y="7" width="1" height="1" fill="#1a0d00"/><rect x="4" y="7" width="1" height="1" fill="#c8a000"/><rect x="5" y="7" width="5" height="1" fill="#d48000"/><rect x="10" y="7" width="1" height="1" fill="#f8f8e8"/><rect x="11" y="7" width="1" height="1" fill="#1a0d00"/><rect x="12" y="7" width="1" height="1" fill="#606040"/><rect x="13" y="7" width="1" height="1" fill="#1a0d00"/><rect x="3" y="8" width="1" height="1" fill="#1a0d00"/><rect x="4" y="8" width="1" height="1" fill="#906000"/><rect x="5" y="8" width="1" height="1" fill="#c8a000"/><rect x="6" y="8" width="4" height="1" fill="#d48000"/><rect x="10" y="8" width="1" height="1" fill="#f8f8e8"/><rect x="11" y="8" width="1" height="1" fill="#1a0d00"/><rect x="12" y="8" width="1" height="1" fill="#606040"/><rect x="13" y="8" width="1" height="1" fill="#1a0d00"/><rect x="3" y="9" width="1" height="1" fill="#1a0d00"/><rect x="4" y="9" width="2" height="1" fill="#c8a000"/><rect x="6" y="9" width="4" height="1" fill="#d48000"/><rect x="10" y="9" width="1" height="1" fill="#f8f8e8"/><rect x="11" y="9" width="1" height="1" fill="#1a0d00"/><rect x="12" y="9" width="1" height="1" fill="#808060"/><rect x="13" y="9" width="1" height="1" fill="#1a0d00"/><rect x="3" y="10" width="1" height="1" fill="#1a0d00"/><rect x="4" y="10" width="3" height="1" fill="#c8a000"/><rect x="7" y="10" width="3" height="1" fill="#d48000"/><rect x="10" y="10" width="1" height="1" fill="#f8f8e8"/><rect x="11" y="10" width="3" height="1" fill="#1a0d00"/><rect x="3" y="11" width="1" height="1" fill="#1a0d00"/><rect x="4" y="11" width="3" height="1" fill="#c8a000"/><rect x="7" y="11" width="4" height="1" fill="#d48000"/><rect x="11" y="11" width="1" height="1" fill="#f8f8e8"/><rect x="12" y="11" width="1" height="1" fill="#1a0d00"/><rect x="3" y="12" width="1" height="1" fill="#1a0d00"/><rect x="4" y="12" width="4" height="1" fill="#c8a000"/><rect x="8" y="12" width="3" height="1" fill="#d48000"/><rect x="11" y="12" width="1" height="1" fill="#f8f8e8"/><rect x="12" y="12" width="1" height="1" fill="#1a0d00"/><rect x="3" y="13" width="10" height="1" fill="#1a0d00"/>',
  '🎲': '<rect x="2" y="1" width="8" height="1" fill="#1a1a1a"/><rect x="1" y="2" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="2" width="8" height="1" fill="#ffffff"/><rect x="10" y="2" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="3" width="1" height="1" fill="#ffffff"/><rect x="4" y="3" width="1" height="1" fill="#202020"/><rect x="5" y="3" width="4" height="1" fill="#ffffff"/><rect x="9" y="3" width="1" height="1" fill="#202020"/><rect x="10" y="3" width="1" height="1" fill="#ffffff"/><rect x="11" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="4" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="4" width="1" height="1" fill="#ffffff"/><rect x="4" y="4" width="1" height="1" fill="#202020"/><rect x="5" y="4" width="4" height="1" fill="#ffffff"/><rect x="9" y="4" width="1" height="1" fill="#202020"/><rect x="10" y="4" width="1" height="1" fill="#ffffff"/><rect x="11" y="4" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="5" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="5" width="4" height="1" fill="#ffffff"/><rect x="7" y="5" width="1" height="1" fill="#202020"/><rect x="8" y="5" width="3" height="1" fill="#ffffff"/><rect x="11" y="5" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="6" width="4" height="1" fill="#ffffff"/><rect x="7" y="6" width="1" height="1" fill="#202020"/><rect x="8" y="6" width="3" height="1" fill="#ffffff"/><rect x="11" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="7" width="1" height="1" fill="#ffffff"/><rect x="4" y="7" width="1" height="1" fill="#202020"/><rect x="5" y="7" width="4" height="1" fill="#ffffff"/><rect x="9" y="7" width="1" height="1" fill="#202020"/><rect x="10" y="7" width="1" height="1" fill="#ffffff"/><rect x="11" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="8" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="8" width="1" height="1" fill="#ffffff"/><rect x="4" y="8" width="1" height="1" fill="#202020"/><rect x="5" y="8" width="4" height="1" fill="#ffffff"/><rect x="9" y="8" width="1" height="1" fill="#202020"/><rect x="10" y="8" width="1" height="1" fill="#ffffff"/><rect x="11" y="8" width="5" height="1" fill="#1a1a1a"/><rect x="1" y="9" width="8" height="1" fill="#1a1a1a"/><rect x="9" y="9" width="5" height="1" fill="#f0f0f0"/><rect x="14" y="9" width="2" height="1" fill="#1a1a1a"/><rect x="3" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="10" width="5" height="1" fill="#c0c0c0"/><rect x="9" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="10" y="10" width="1" height="1" fill="#d8d8d8"/><rect x="11" y="10" width="1" height="1" fill="#202020"/><rect x="12" y="10" width="3" height="1" fill="#d8d8d8"/><rect x="15" y="10" width="1" height="1" fill="#202020"/><rect x="3" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="11" width="5" height="1" fill="#c0c0c0"/><rect x="9" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="10" y="11" width="2" height="1" fill="#a8a8a8"/><rect x="12" y="11" width="3" height="1" fill="#d8d8d8"/><rect x="15" y="11" width="1" height="1" fill="#a8a8a8"/><rect x="3" y="12" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="12" width="5" height="1" fill="#c0c0c0"/><rect x="9" y="12" width="1" height="1" fill="#1a1a1a"/><rect x="10" y="12" width="3" height="1" fill="#d8d8d8"/><rect x="13" y="12" width="1" height="1" fill="#202020"/><rect x="14" y="12" width="2" height="1" fill="#d8d8d8"/><rect x="3" y="13" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="13" width="5" height="1" fill="#c0c0c0"/><rect x="9" y="13" width="1" height="1" fill="#1a1a1a"/><rect x="10" y="13" width="3" height="1" fill="#d8d8d8"/><rect x="13" y="13" width="1" height="1" fill="#202020"/><rect x="14" y="13" width="2" height="1" fill="#d8d8d8"/><rect x="3" y="14" width="7" height="1" fill="#1a1a1a"/><rect x="10" y="14" width="2" height="1" fill="#a8a8a8"/><rect x="12" y="14" width="3" height="1" fill="#d8d8d8"/><rect x="15" y="14" width="1" height="1" fill="#a8a8a8"/><rect x="11" y="15" width="5" height="1" fill="#1a1a1a"/>',
  '🃏': '<rect x="2" y="0" width="10" height="1" fill="#1a1a1a"/><rect x="2" y="1" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="1" width="10" height="1" fill="#f8f8f8"/><rect x="13" y="1" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="2" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="2" width="1" height="1" fill="#f8f8f8"/><rect x="4" y="2" width="2" height="1" fill="#cc2020"/><rect x="6" y="2" width="2" height="1" fill="#f8f8f8"/><rect x="8" y="2" width="2" height="1" fill="#2020cc"/><rect x="10" y="2" width="3" height="1" fill="#f8f8f8"/><rect x="13" y="2" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="3" width="1" height="1" fill="#f8f8f8"/><rect x="4" y="3" width="2" height="1" fill="#cc2020"/><rect x="6" y="3" width="2" height="1" fill="#f8f8f8"/><rect x="8" y="3" width="2" height="1" fill="#2020cc"/><rect x="10" y="3" width="3" height="1" fill="#f8f8f8"/><rect x="13" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="4" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="4" width="3" height="1" fill="#f8f8f8"/><rect x="6" y="4" width="3" height="1" fill="#ffe040"/><rect x="9" y="4" width="4" height="1" fill="#f8f8f8"/><rect x="13" y="4" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="5" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="5" width="2" height="1" fill="#f8f8f8"/><rect x="5" y="5" width="1" height="1" fill="#ffe040"/><rect x="6" y="5" width="1" height="1" fill="#7818a0"/><rect x="7" y="5" width="1" height="1" fill="#a020c0"/><rect x="8" y="5" width="1" height="1" fill="#7818a0"/><rect x="9" y="5" width="1" height="1" fill="#ffe040"/><rect x="10" y="5" width="3" height="1" fill="#f8f8f8"/><rect x="13" y="5" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="6" width="2" height="1" fill="#f8f8f8"/><rect x="5" y="6" width="1" height="1" fill="#ffe040"/><rect x="6" y="6" width="1" height="1" fill="#a020c0"/><rect x="7" y="6" width="1" height="1" fill="#7818a0"/><rect x="8" y="6" width="1" height="1" fill="#a020c0"/><rect x="9" y="6" width="1" height="1" fill="#ffe040"/><rect x="10" y="6" width="3" height="1" fill="#f8f8f8"/><rect x="13" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="7" width="3" height="1" fill="#f8f8f8"/><rect x="6" y="7" width="3" height="1" fill="#ffe040"/><rect x="9" y="7" width="4" height="1" fill="#f8f8f8"/><rect x="13" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="8" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="8" width="10" height="1" fill="#f8f8f8"/><rect x="13" y="8" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="9" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="9" width="2" height="1" fill="#f8f8f8"/><rect x="5" y="9" width="2" height="1" fill="#cc2020"/><rect x="7" y="9" width="3" height="1" fill="#f8f8f8"/><rect x="10" y="9" width="2" height="1" fill="#2020cc"/><rect x="12" y="9" width="1" height="1" fill="#f8f8f8"/><rect x="13" y="9" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="10" width="2" height="1" fill="#f8f8f8"/><rect x="5" y="10" width="2" height="1" fill="#cc2020"/><rect x="7" y="10" width="3" height="1" fill="#f8f8f8"/><rect x="10" y="10" width="2" height="1" fill="#2020cc"/><rect x="12" y="10" width="1" height="1" fill="#f8f8f8"/><rect x="13" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="11" width="10" height="1" fill="#f8f8f8"/><rect x="13" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="12" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="12" width="5" height="1" fill="#f8f8f8"/><rect x="8" y="12" width="1" height="1" fill="#c0a020"/><rect x="9" y="12" width="4" height="1" fill="#f8f8f8"/><rect x="13" y="12" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="13" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="13" width="4" height="1" fill="#f8f8f8"/><rect x="7" y="13" width="3" height="1" fill="#c0a020"/><rect x="10" y="13" width="3" height="1" fill="#f8f8f8"/><rect x="13" y="13" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="14" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="14" width="5" height="1" fill="#f8f8f8"/><rect x="8" y="14" width="1" height="1" fill="#c0a020"/><rect x="9" y="14" width="4" height="1" fill="#f8f8f8"/><rect x="13" y="14" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="15" width="10" height="1" fill="#1a1a1a"/>',
  '🧲': '<rect x="4" y="1" width="9" height="1" fill="#1a1a1a"/><rect x="3" y="2" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="2" width="5" height="1" fill="#cc2020"/><rect x="9" y="2" width="5" height="1" fill="#c0c0c0"/><rect x="14" y="2" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="3" width="1" height="1" fill="#cc2020"/><rect x="5" y="3" width="2" height="1" fill="#ff4040"/><rect x="7" y="3" width="2" height="1" fill="#cc2020"/><rect x="9" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="10" y="3" width="1" height="1" fill="#e0e0e0"/><rect x="11" y="3" width="2" height="1" fill="#c0c0c0"/><rect x="13" y="3" width="1" height="1" fill="#909090"/><rect x="14" y="3" width="1" height="1" fill="#c0c0c0"/><rect x="15" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="4" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="4" width="4" height="1" fill="#cc2020"/><rect x="8" y="4" width="2" height="1" fill="#1a1a1a"/><rect x="11" y="4" width="1" height="1" fill="#1a1a1a"/><rect x="12" y="4" width="2" height="1" fill="#c0c0c0"/><rect x="14" y="4" width="1" height="1" fill="#909090"/><rect x="15" y="4" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="5" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="5" width="3" height="1" fill="#cc2020"/><rect x="7" y="5" width="2" height="1" fill="#1a1a1a"/><rect x="11" y="5" width="1" height="1" fill="#1a1a1a"/><rect x="12" y="5" width="2" height="1" fill="#c0c0c0"/><rect x="14" y="5" width="1" height="1" fill="#909090"/><rect x="15" y="5" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="6" width="2" height="1" fill="#cc2020"/><rect x="6" y="6" width="2" height="1" fill="#1a1a1a"/><rect x="11" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="12" y="6" width="2" height="1" fill="#c0c0c0"/><rect x="14" y="6" width="1" height="1" fill="#909090"/><rect x="15" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="7" width="1" height="1" fill="#cc2020"/><rect x="5" y="7" width="2" height="1" fill="#1a1a1a"/><rect x="11" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="12" y="7" width="2" height="1" fill="#c0c0c0"/><rect x="14" y="7" width="1" height="1" fill="#909090"/><rect x="15" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="8" width="2" height="1" fill="#1a1a1a"/><rect x="7" y="8" width="6" height="1" fill="#1a1a1a"/><rect x="13" y="8" width="2" height="1" fill="#c0c0c0"/><rect x="15" y="8" width="1" height="1" fill="#1a1a1a"/><rect x="7" y="9" width="1" height="1" fill="#1a1a1a"/><rect x="8" y="9" width="4" height="1" fill="#606060"/><rect x="12" y="9" width="2" height="1" fill="#c0c0c0"/><rect x="14" y="9" width="1" height="1" fill="#1a1a1a"/><rect x="7" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="8" y="10" width="4" height="1" fill="#606060"/><rect x="12" y="10" width="2" height="1" fill="#c0c0c0"/><rect x="14" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="7" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="8" y="11" width="4" height="1" fill="#606060"/><rect x="12" y="11" width="2" height="1" fill="#c0c0c0"/><rect x="14" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="7" y="12" width="1" height="1" fill="#1a1a1a"/><rect x="8" y="12" width="4" height="1" fill="#606060"/><rect x="12" y="12" width="2" height="1" fill="#c0c0c0"/><rect x="14" y="12" width="1" height="1" fill="#1a1a1a"/><rect x="8" y="13" width="1" height="1" fill="#1a1a1a"/><rect x="9" y="13" width="3" height="1" fill="#606060"/><rect x="12" y="13" width="1" height="1" fill="#c0c0c0"/><rect x="13" y="13" width="1" height="1" fill="#1a1a1a"/><rect x="8" y="14" width="6" height="1" fill="#1a1a1a"/>',
  '🫗': '<rect x="4" y="1" width="4" height="1" fill="#1a1a1a"/><rect x="3" y="2" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="2" width="4" height="1" fill="#ffe040"/><rect x="8" y="2" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="3" width="7" height="1" fill="#ffc000"/><rect x="11" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="4" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="4" width="8" height="1" fill="#ff8000"/><rect x="12" y="4" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="5" width="1" height="1" fill="#1a1a1a"/><rect x="5" y="5" width="6" height="1" fill="#ff8000"/><rect x="11" y="5" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="6" width="9" height="1" fill="#1a1a1a"/><rect x="4" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="5" y="7" width="8" height="1" fill="#a0d8f0"/><rect x="13" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="8" width="1" height="1" fill="#1a1a1a"/><rect x="5" y="8" width="1" height="1" fill="#d0ecf8"/><rect x="6" y="8" width="7" height="1" fill="#a0d8f0"/><rect x="13" y="8" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="9" width="1" height="1" fill="#1a1a1a"/><rect x="5" y="9" width="1" height="1" fill="#d0ecf8"/><rect x="6" y="9" width="7" height="1" fill="#a0d8f0"/><rect x="13" y="9" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="5" y="10" width="1" height="1" fill="#d0ecf8"/><rect x="6" y="10" width="1" height="1" fill="#e8f4fc"/><rect x="7" y="10" width="6" height="1" fill="#a0d8f0"/><rect x="13" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="5" y="11" width="1" height="1" fill="#d0ecf8"/><rect x="6" y="11" width="1" height="1" fill="#e8f4fc"/><rect x="7" y="11" width="6" height="1" fill="#a0d8f0"/><rect x="13" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="12" width="1" height="1" fill="#1a1a1a"/><rect x="5" y="12" width="1" height="1" fill="#d0ecf8"/><rect x="6" y="12" width="2" height="1" fill="#e8f4fc"/><rect x="8" y="12" width="5" height="1" fill="#a0d8f0"/><rect x="13" y="12" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="13" width="9" height="1" fill="#1a1a1a"/>',
  '📯': '<image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAARdUlEQVR42u1ae5QcVZn/ffdWdfW7e3qm55kwyWRCBkISIBsJSTBE8QkrimeiooiiIgoLnuO6K7qrhLNBBAFl3RVY0D1ZcTUDRCCJyyKQQSHhEUlIMiaT1yTzyLx6evpdXVX3fvvHTFiIoElmsuo6v3P6nO4+VXVv/e7ve9zvu8AUpjCFKUxhClOYwhT+MkHHcY1sHf/SBjAAPUXbX4ACCAA3NzdboXzqdldTtRQQANp29I883ApQG6D+j+YoXjfPt1QgMwQAJgJPHjEEnBaKDjUFg9wcjnJ9IHILACwHjP/vqqCWSKRyYUPlI49+pyX3q41fc154tNVe/Zn6zgQiNzCDWgF5Kicx/nyaXxP/m7nJivXzqivWL6hLXAe8YezXFFx6OLGm2Fa1EgB47fHP7a1Wkkdy2qAAf+iCcwxUvGORhse8Z8vm2US0DMDdg8fnQE8aBwABgnIUnSc0LlZguFqPEOH7B8bkrsa1TgSwIOMyCD4IAEge/9zEm/zmJIJnN88JPPHgP8+yA/NuYGffL6GeXIf+vUWthMiSmBw7+334DcGNc+i+r11T8e4Na2aU1z84q3z9p6rfF+PgHb8huGtbIQlgrK2Ilh+v2WSEpEUssyfjYH7H9jUobgmx4JyWgOGPNADFIXiZEQQDfpFMitB7FyWiQ79776RhOWAsPStWUVtlLJs1I56ccXpYzGyyRGO9v6oyYS4699yK2K5BED8DIy9906FpsZDkKKjiRMeWYwoKL7tgTlLltixx+bfvVH0/SKrUS/+o3NTX3QdvrHHCiG44RQYgAGBedaxpdiIx8Pz36speYZX3+O2Xqsc+5VP87DnO+geWOjOCoV8DwOjDtYucR2tH+Yk6th+r/TA/0+g/Efv/fT4ArFlrT6E0PIp0ykGimIfhr0Rj0zRz6dlHmjztO6cw4t9t9fS4ANA+Fp4mI0kShpAWQ1cHYhWQwtEjI1lKd7ucz7oU83kGWFQAgI+0ISBj2tF7iHkvrThknygBbypjLdlnSTLCzijZO7pRHpWQvW1AToqln7xef+sGf8vO3d6vXaWoHfDaAW8SM0Q9kpXpbNbz3IZFjMLLGO3bzmu3EJ7YlIK0c1DMYzmIEKaMElwlL7UuHXyVWyFp5YnlJ8cqgAHAU0aXIl7T9rT9oXyv8g8OaF4W1TI8awcF1Aji05r54xfvol37xOfONU8bNg3tc8q89ZXe3o6FAG0dI+SEHOVCwNwK8JzK2PKGarFi4ZlhqquLYttzveg+ZGNGtYEwa7hpG9IQaG2FJLYOe3nndkcgBQBYCz0Zpnn0Eb5pwZjXFK3gpD/Od3ywkks/iipv56WK7dWat52l3jY9xDVCcFPQxw1+31cnY/mrfZGfvqOllrm9sczON/VNV56vVtZD/cOSiNp0bcz9xZcquVKEX6FjtMtrIZlbJTPkRPMABkBnJpM+n+FcI8F+0yR3Rz99+rEXrUWXJA7pwX1pseaREj75mavcQOUM7SNPvPLCi+9b99D6ilg0bDi6dHtyqDicBygMcPvYM4+VplgOiHaA550Wi0qH7igpEfrwMmNh0DO8bMONMjr4EnxuF5RpQgiNVztdmnVuTP3rd2bNWv2tzn9bvrDqurv/fp/CCqgx6bedMOFvmQh1DA3lAdx/9I/DI/GFcUue94EF3e7hbiUeeEhg8+YPyvr5F0jAxlBv99tt5b3dAmD6/He1o+j9IVsfd5zwuZlyuhj9pOORnFFNiLtSi9q3E448ybqYhtIESzKG05pmgPSyJYlIydGtB4cKN+BCeFvvXWjwIrXIM7gawxl28/Zo8AP97ROKAkfjcR6gDCB8Vfq2l7olvrvB++z7L5jp3Xff52Swsg7l/CgMK0KxQNj7RDSmF9Y18l19B29pqYyNWkKkmTmlgAO7hkc3jK86tQNqblXFSinp0lJZ24GIjN61usHxR3yGTI3Sq+2OkCoLQJGGQCIIDvoIdklA2EUa3XeQhaTRsquJCArYqtTzZ602aq0LYZvQ6eIeAC0TJmDcu2M5YLQPZfcZqcSOxrCHSy7w8fz5cxGKVQCCIE0/G2SIGX6/WBAKw3b4ChgCLgCQgNbqWQDrAahnaczIWIrzGfiYBmAaEkvODrNMGty/1cZ27YBoLBZLATIlSGlw0BKImJqF7RCYjRFzwPHW1V5BtdUtHI9PQ6FcRkERa+QnnAccQ4RaCJhDEfXj7T3l2Lc32jd/ZUGvJw0hKyoTuP/WW5F5aCNdNnsOrzlwELffmHT71zEPdSkEAwJdnje3oNRzfiHAHkEbjIiyG1uk3128NMwf+EKU3PwRSdM/C7ehEq67Ciz8ACSIwQoExUAkLFEZAMojRQhJvHUruV7Rvcaq9C1BvJYxcoQQIlCaKiaVAAAcBnhrJpNOQPRMz4E9z+HsSAqRcABDfT0I5jJcilfBjjuYXxOWCZOQCgMRi6BKxcoaaS4JBQQoABRHGXPPaMaZjqcbwiXUz5kDL3A+RNUK6APboFQJlNsIqBQUTBDKkARoxSi7TCYBgogABplGRu9PeSJSJk/xg+SpDZp0ZrIJeC1EmgZCfssQQkju6TqEqtoamH4/HE/hmb19OP/6EHwdUfizErPqCJIkLnTDqs6ROtIELLgW+MlXbFz1w3vEiw8+SEc6OqGbbyXOdzN0AO7g08jl8+DSdgY7IBIgAJoJZcUQRMwMKMXjNQsSwrYNuAV4WXdz4BPptZOSCr+ZGQCgqGn9/HD3gHnzP91919VXrdQDhw9jcHgI8BSiykMyqzA4lEJfxo/agB/EhILrUsgn5byPVGH7o4cwf/FihOpb4JhRFOwuiOEHoLvagXAQVBiAYgt8pAsIOxACcBUjHBDwG4DnMUytwQz93uZmq+jlrnGFjJkmkRcI9/EzaQObAFoFb7IVwADE3lKpt767d2OpVFg1MJQKWj5DpDJ5hFjD9TyQZhRtD0dyOaR1HuwIsKWRDIYQP4PQ8+8u5p9fBxmIQJEfucwB4PDjrPI+GMIGMcNTDJRyQNCAlGMK8JtAyCIo1jDJgJSEUdsWFR8b6JpI4nWiJqAAiKVnntnVXy6fdef3frTFKet6HylvqWUJx2b4BEEaBHYEEvOBxEygY4NAmovIH3Kx380jkC3QQuS4f6gH6TzB6cwhm7KRnF8HmBKCCMKUgJCwbQHP0xCC4LkKwYowjOlV8LxuTJ8GbOn530wQrdAnWhM8mT09t3V0OKn9+wc8z9WLF0WQiBP1eR5G2AMzg2gsn65pEZi5guH3aXgaYFZwlIJ2SgxnBGUAwzYjNegCglAezsPuS4MAFHuzUDkPl1wcwew5YepLeYiFBCIhghSAaRKwpcdx19WtKqyr/tKJboImQgBAQAfg8wf9dM9Pv4kz59Vg82gRe1wPliDYRaD6bKJ5H2VUzATmXW7ALTCIGKY0ULaLgFOGLQz05RzYJQKI4KSy8IZL8BTDHizCK3o4d1kMVTUmp3Iall8gFJBQrge8VpnWV0qm1qH7KyN4vC7AfGLboZMjgAGghpXnqPy2dRgeLODyZSaWv41xqMgIBAm9rwK7HiNkDhO2tSkYASJohqsZrgZ6u7qxfNkCXHTZFbjloSIOdmmk0hJ5W8DRhNQI4NguYFWAfUEYgqEUo0wmIZGEp5kBCM1ivSHE7ESDr9N2aAkRmL95/KY9gbKWJtIqGkm/gLpEGYvmmDpZxTrPBCkEovWKc8Mafa9qhGsZZgCsPA0PgFO2kRocQLK6EqGqBmzpdFCyCekMI5dnhC1C/7BGuaSBQJCEZUEcXVfDZFghmCT18sZGn3XZkes8F0Xhl7UE/ZHcwzXVAPTxKkGc5PoTMFQiA1d+7k6VWvW3DcKzAsad65VRGQHsgsZFNwk0LmH07iRc/EMJIwyQImRNwo5cBqkjg+g6cBjl0T7U1fpw239pPLKphIDBeM/iAB55zsbggQEg9FdQ/jmAZ4PdMtg8Df7pH4PjuWa57hAxQI7mW92UOmKFxGfZ1bNpFTTaju/dJlLYVNu6Rx/buLmU+f6aEdrfrduLSreDiXx+0tvbBHRZ4NxWYPu9gOcQCUMgz4z+bFZ1du7nl7Z14vS6An5wrR89GUbfKNTeYfb2DLBSWsMuAiqT4araEOKVcRgBEx4R7d1zRAMYmY5pIICjH+m/RwMFWALSJHUqw+AbUJVMhpNw8cDPRsGS/tMDayGM5YaP9J6faBEMSDQuY7x0LyOaBJMAyoaJXXu7zQP3/AcODxb1yr+egTtuPAeSN9PmAZ/5/BNA0PCwsJq5VPAzdjyMlZ+/Cr8ybETsV3R/zG9c3Xpzx/vfOeuCH2zYYR8NgXmtPy9zHHdt/57xzoo+5QQMDQ2p+uoErZhbiY6RTLAra2seDxNWCDAsgvYEQvHxRRESQgpyWbVZwNlLFiRnzTs9ztlMmTSzDeafEekcBOL9RaP1mU6WgVqX5s/YKWobFQW9JDoHjrCrReneX+xIvxaUVkIBA0+/IVAdZz4w4R4fEVR9xI+OkQwEBPNY4g5fiHHgaQ+7N2oIKQAwSAhmkDicpy9PLxa+d9sPV8ye1+KUt9+3yTKtoG97t7wOGCg0JxLRoiuueOlpRsx0MHfm83rWkgshrGb03P8U+SxfhSqDXv+SvBZy0y7Qhaug6ATqkRMlgJg5ZkmChChpsJZCgAShXCDMWCZQPUei8ymNdBePNbEAmChXKcPa+sLm/St2vehEN/3Kf5iF+kJNjUTLAIx+IjYFf7wyyvK5w7i26UXvbRdP63Rf2M3GvRudbSTxjZtuAr2+8HqyidBECfBIYENvzr48YRnnhIg8xRqaiSqbgLqLiGWL1nVZkqkDGiQFNDNcaH+fU1x983f2v0uTXG6YxuChXHojAAwAQCqVA/ATANg3EHvfBbPoPBT63IO/Fb4fP6t7XMo+vmrV5DRnTzYKjIdCONv605/+5f6h/oRPXF3pM77IRLrskHzXV3x6r6PkRz+VMudfbCJWLeA6GoIIxniVqSpuiZlVPg5amo/tNi8HjGbAqgzrVRt3qZ9f8Q0vtLa9vL4yrP+u9Qz4JqsPMRn9vaghKDI9EYHPFF4pDyz4ssVPdznGt+9NZ8IhemJ32uP6JQTPNo6OSO2Alwz6nDOqIuQoJB46pmrcDngNgOrL5fbsPKx3/XpHOf/yznJHfz7/28EO6BPtO5wKAo5OoCAN8aHeTLHLJEi/T6iDIwrrX7S3beooXv9kh3P51asGZXKBRfEGwVACHlSppSp+iV/S6QawXzB/V79Ju328Jimm1RvfbqrymufWGasxVkr3MEmYeBQA1Ms9w+2nhcSgJUVjwBJqw89z5j2PD7QJ6axJGtFm7XAXTzOmWbUSjq3gg2U7Sl9tSTE9Y5fX7h3Nfn9lKyTa3tSR6ef3pHIAckDh1HRjMUEZtAJyd6ocWjQjSpue9Kw1vxh9cmFT6F+0Ag2Vs/sipu8dH/ziIdHb4xnRkKGCUq17T3PyvGjQj21DpTgA+Qd6GvS6z58WAQDwEKByZb1HSMqWi0AxQ246jdj7G5M1a1tbZcm2Rstl/u9NLxeKqYxLDTH/HElUqRiptO3uA6Da/jDPPFl2f0oONDBAdaFQ25cWn85fXzanMKsi6p2eiN/z+utq/eFXmmIxvu3d8wpXnj2T68PBO4/e/8ea+6QMXA0wATxNoj1bVgvssm6oDpiUjFizv7hk5jtJw9TM9NT+wYr9I0V3/0iJyq7eyZ5+GQBV/xFXdtJsary97Z6RqPiWJnx1TlUAFzVVoSYaHD/GBBxIZfHY7kGkSy48VlftG8n96Oh9f9YKAIBLALUVEKbg5zzmu3Mlb8G2/uz5kXTJ8zQEQDxasg3NvFaAUpY09gCg8fvwZ6+AYzE7Hr3RlPKWslJjuxYGDEFg8s7oTOV3/6n4L+NUOEQAGLWMp5j5y6YQDpGQSmsALBQFRpcjb0zimaIp/EmaAMZPgLxFi42nqJ/CFKYwhSn88fE/b29nm7DqYZ8AAAAASUVORK5CYII=" x="0" y="0" width="16" height="16"/>',
  '⚗️': '<rect x="6" y="0" width="2" height="1" fill="#1a1a1a"/><rect x="5" y="1" width="1" height="1" fill="#1a1a1a"/><rect x="6" y="1" width="2" height="1" fill="#a0d8f0"/><rect x="8" y="1" width="1" height="1" fill="#1a1a1a"/><rect x="5" y="2" width="1" height="1" fill="#1a1a1a"/><rect x="6" y="2" width="2" height="1" fill="#a0d8f0"/><rect x="8" y="2" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="5" y="3" width="4" height="1" fill="#a0d8f0"/><rect x="9" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="4" width="1" height="1" fill="#1a1a1a"/><rect x="5" y="4" width="4" height="1" fill="#a0d8f0"/><rect x="9" y="4" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="5" width="9" height="1" fill="#1a1a1a"/><rect x="3" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="6" width="9" height="1" fill="#a0d8f0"/><rect x="13" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="7" width="1" height="1" fill="#a0d8f0"/><rect x="4" y="7" width="1" height="1" fill="#e8f4fc"/><rect x="5" y="7" width="9" height="1" fill="#a0d8f0"/><rect x="14" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="8" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="8" width="1" height="1" fill="#a0d8f0"/><rect x="4" y="8" width="1" height="1" fill="#e8f4fc"/><rect x="5" y="8" width="9" height="1" fill="#a0d8f0"/><rect x="14" y="8" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="9" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="9" width="11" height="1" fill="#a0d8f0"/><rect x="14" y="9" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="10" width="2" height="1" fill="#a0d8f0"/><rect x="5" y="10" width="1" height="1" fill="#ff4040"/><rect x="6" y="10" width="8" height="1" fill="#a0d8f0"/><rect x="14" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="11" width="2" height="1" fill="#a0d8f0"/><rect x="5" y="11" width="1" height="1" fill="#ff4040"/><rect x="6" y="11" width="1" height="1" fill="#cc2020"/><rect x="7" y="11" width="7" height="1" fill="#a0d8f0"/><rect x="14" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="12" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="12" width="11" height="1" fill="#a0d8f0"/><rect x="14" y="12" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="13" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="13" width="11" height="1" fill="#808060"/><rect x="14" y="13" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="14" width="13" height="1" fill="#1a1a1a"/>',
  '👊': '<rect x="4" y="1" width="8" height="1" fill="#1a0800"/><rect x="3" y="2" width="1" height="1" fill="#1a0800"/><rect x="4" y="2" width="8" height="1" fill="#d4956a"/><rect x="12" y="2" width="1" height="1" fill="#1a0800"/><rect x="3" y="3" width="1" height="1" fill="#1a0800"/><rect x="4" y="3" width="1" height="1" fill="#e8b090"/><rect x="5" y="3" width="7" height="1" fill="#d4956a"/><rect x="12" y="3" width="1" height="1" fill="#1a0800"/><rect x="3" y="4" width="1" height="1" fill="#1a0800"/><rect x="4" y="4" width="1" height="1" fill="#e8b090"/><rect x="5" y="4" width="7" height="1" fill="#d4956a"/><rect x="12" y="4" width="1" height="1" fill="#1a0800"/><rect x="3" y="5" width="1" height="1" fill="#1a0800"/><rect x="4" y="5" width="8" height="1" fill="#d4956a"/><rect x="12" y="5" width="1" height="1" fill="#1a0800"/><rect x="3" y="6" width="1" height="1" fill="#1a0800"/><rect x="4" y="6" width="8" height="1" fill="#d4956a"/><rect x="12" y="6" width="1" height="1" fill="#1a0800"/><rect x="2" y="7" width="12" height="1" fill="#1a0800"/><rect x="2" y="8" width="1" height="1" fill="#1a0800"/><rect x="3" y="8" width="12" height="1" fill="#d4956a"/><rect x="15" y="8" width="1" height="1" fill="#1a0800"/><rect x="2" y="9" width="1" height="1" fill="#1a0800"/><rect x="3" y="9" width="1" height="1" fill="#e8b090"/><rect x="4" y="9" width="11" height="1" fill="#d4956a"/><rect x="15" y="9" width="1" height="1" fill="#1a0800"/><rect x="2" y="10" width="1" height="1" fill="#1a0800"/><rect x="3" y="10" width="1" height="1" fill="#e8b090"/><rect x="4" y="10" width="10" height="1" fill="#d4956a"/><rect x="14" y="10" width="1" height="1" fill="#e8b090"/><rect x="15" y="10" width="1" height="1" fill="#1a0800"/><rect x="2" y="11" width="1" height="1" fill="#1a0800"/><rect x="3" y="11" width="12" height="1" fill="#d4956a"/><rect x="15" y="11" width="1" height="1" fill="#1a0800"/><rect x="2" y="12" width="1" height="1" fill="#1a0800"/><rect x="3" y="12" width="12" height="1" fill="#d4956a"/><rect x="15" y="12" width="1" height="1" fill="#1a0800"/><rect x="2" y="13" width="1" height="1" fill="#1a0800"/><rect x="3" y="13" width="1" height="1" fill="#b07048"/><rect x="4" y="13" width="10" height="1" fill="#d4956a"/><rect x="14" y="13" width="1" height="1" fill="#b07048"/><rect x="15" y="13" width="1" height="1" fill="#1a0800"/><rect x="2" y="14" width="14" height="1" fill="#1a0800"/>',
  '🪺': '<rect x="3" y="1" width="10" height="1" fill="#1a0d00"/><rect x="2" y="2" width="1" height="1" fill="#1a0d00"/><rect x="3" y="2" width="10" height="1" fill="#8B4513"/><rect x="13" y="2" width="1" height="1" fill="#1a0d00"/><rect x="2" y="3" width="1" height="1" fill="#1a0d00"/><rect x="3" y="3" width="1" height="1" fill="#8B4513"/><rect x="4" y="3" width="1" height="1" fill="#6b3010"/><rect x="5" y="3" width="9" height="1" fill="#8B4513"/><rect x="14" y="3" width="1" height="1" fill="#1a0d00"/><rect x="2" y="4" width="1" height="1" fill="#1a0d00"/><rect x="3" y="4" width="1" height="1" fill="#8B4513"/><rect x="4" y="4" width="1" height="1" fill="#6b3010"/><rect x="5" y="4" width="1" height="1" fill="#8B4513"/><rect x="6" y="4" width="6" height="1" fill="#c06030"/><rect x="12" y="4" width="3" height="1" fill="#8B4513"/><rect x="15" y="4" width="1" height="1" fill="#1a0d00"/><rect x="2" y="5" width="1" height="1" fill="#1a0d00"/><rect x="3" y="5" width="3" height="1" fill="#8B4513"/><rect x="6" y="5" width="1" height="1" fill="#c06030"/><rect x="7" y="5" width="5" height="1" fill="#d08050"/><rect x="12" y="5" width="3" height="1" fill="#8B4513"/><rect x="15" y="5" width="1" height="1" fill="#1a0d00"/><rect x="2" y="6" width="1" height="1" fill="#1a0d00"/><rect x="3" y="6" width="3" height="1" fill="#8B4513"/><rect x="6" y="6" width="1" height="1" fill="#c06030"/><rect x="7" y="6" width="1" height="1" fill="#d08050"/><rect x="8" y="6" width="3" height="1" fill="#e0c060"/><rect x="11" y="6" width="1" height="1" fill="#c06030"/><rect x="12" y="6" width="3" height="1" fill="#8B4513"/><rect x="15" y="6" width="1" height="1" fill="#1a0d00"/><rect x="2" y="7" width="1" height="1" fill="#1a0d00"/><rect x="3" y="7" width="3" height="1" fill="#8B4513"/><rect x="6" y="7" width="1" height="1" fill="#c06030"/><rect x="7" y="7" width="1" height="1" fill="#d08050"/><rect x="8" y="7" width="2" height="1" fill="#ffe080"/><rect x="10" y="7" width="1" height="1" fill="#e0c060"/><rect x="11" y="7" width="1" height="1" fill="#c06030"/><rect x="12" y="7" width="3" height="1" fill="#8B4513"/><rect x="15" y="7" width="1" height="1" fill="#1a0d00"/><rect x="2" y="8" width="1" height="1" fill="#1a0d00"/><rect x="3" y="8" width="3" height="1" fill="#8B4513"/><rect x="6" y="8" width="1" height="1" fill="#c06030"/><rect x="7" y="8" width="1" height="1" fill="#d08050"/><rect x="8" y="8" width="2" height="1" fill="#ffe080"/><rect x="10" y="8" width="1" height="1" fill="#e0c060"/><rect x="11" y="8" width="1" height="1" fill="#c06030"/><rect x="12" y="8" width="3" height="1" fill="#8B4513"/><rect x="15" y="8" width="1" height="1" fill="#1a0d00"/><rect x="2" y="9" width="1" height="1" fill="#1a0d00"/><rect x="3" y="9" width="3" height="1" fill="#8B4513"/><rect x="6" y="9" width="1" height="1" fill="#c06030"/><rect x="7" y="9" width="1" height="1" fill="#d08050"/><rect x="8" y="9" width="3" height="1" fill="#e0c060"/><rect x="11" y="9" width="1" height="1" fill="#c06030"/><rect x="12" y="9" width="3" height="1" fill="#8B4513"/><rect x="15" y="9" width="1" height="1" fill="#1a0d00"/><rect x="2" y="10" width="1" height="1" fill="#1a0d00"/><rect x="3" y="10" width="3" height="1" fill="#8B4513"/><rect x="6" y="10" width="1" height="1" fill="#c06030"/><rect x="7" y="10" width="5" height="1" fill="#d08050"/><rect x="12" y="10" width="3" height="1" fill="#8B4513"/><rect x="15" y="10" width="1" height="1" fill="#1a0d00"/><rect x="2" y="11" width="1" height="1" fill="#1a0d00"/><rect x="3" y="11" width="3" height="1" fill="#8B4513"/><rect x="6" y="11" width="6" height="1" fill="#c06030"/><rect x="12" y="11" width="3" height="1" fill="#8B4513"/><rect x="15" y="11" width="1" height="1" fill="#1a0d00"/><rect x="2" y="12" width="1" height="1" fill="#1a0d00"/><rect x="3" y="12" width="1" height="1" fill="#8B4513"/><rect x="4" y="12" width="1" height="1" fill="#6b3010"/><rect x="5" y="12" width="9" height="1" fill="#8B4513"/><rect x="14" y="12" width="1" height="1" fill="#1a0d00"/><rect x="2" y="13" width="1" height="1" fill="#1a0d00"/><rect x="3" y="13" width="10" height="1" fill="#8B4513"/><rect x="13" y="13" width="1" height="1" fill="#1a0d00"/><rect x="2" y="14" width="12" height="1" fill="#1a0d00"/>',
  '🔁': '<rect x="3" y="1" width="3" height="1" fill="#1a3a1a"/><rect x="12" y="1" width="3" height="1" fill="#1a3a1a"/><rect x="2" y="2" width="1" height="1" fill="#1a3a1a"/><rect x="3" y="2" width="3" height="1" fill="#40c040"/><rect x="6" y="2" width="1" height="1" fill="#1a3a1a"/><rect x="11" y="2" width="1" height="1" fill="#1a3a1a"/><rect x="12" y="2" width="3" height="1" fill="#2060ff"/><rect x="15" y="2" width="1" height="1" fill="#1a3a1a"/><rect x="1" y="3" width="1" height="1" fill="#1a3a1a"/><rect x="2" y="3" width="4" height="1" fill="#40c040"/><rect x="6" y="3" width="1" height="1" fill="#1a3a1a"/><rect x="11" y="3" width="1" height="1" fill="#1a3a1a"/><rect x="12" y="3" width="4" height="1" fill="#2060ff"/><rect x="0" y="4" width="1" height="1" fill="#1a3a1a"/><rect x="1" y="4" width="1" height="1" fill="#80ff80"/><rect x="2" y="4" width="4" height="1" fill="#40c040"/><rect x="6" y="4" width="1" height="1" fill="#1a3a1a"/><rect x="11" y="4" width="1" height="1" fill="#1a3a1a"/><rect x="12" y="4" width="4" height="1" fill="#2060ff"/><rect x="0" y="5" width="1" height="1" fill="#1a3a1a"/><rect x="1" y="5" width="1" height="1" fill="#80ff80"/><rect x="2" y="5" width="4" height="1" fill="#40c040"/><rect x="6" y="5" width="1" height="1" fill="#1a3a1a"/><rect x="11" y="5" width="1" height="1" fill="#1a3a1a"/><rect x="12" y="5" width="4" height="1" fill="#2060ff"/><rect x="0" y="6" width="1" height="1" fill="#1a3a1a"/><rect x="1" y="6" width="1" height="1" fill="#80ff80"/><rect x="2" y="6" width="12" height="1" fill="#40c040"/><rect x="14" y="6" width="2" height="1" fill="#2060ff"/><rect x="0" y="7" width="1" height="1" fill="#1a3a1a"/><rect x="1" y="7" width="1" height="1" fill="#80ff80"/><rect x="2" y="7" width="12" height="1" fill="#40c040"/><rect x="14" y="7" width="2" height="1" fill="#2060ff"/><rect x="0" y="8" width="1" height="1" fill="#1a3a1a"/><rect x="1" y="8" width="1" height="1" fill="#80c0ff"/><rect x="2" y="8" width="12" height="1" fill="#208020"/><rect x="14" y="8" width="1" height="1" fill="#1040c0"/><rect x="15" y="8" width="1" height="1" fill="#80c0ff"/><rect x="0" y="9" width="1" height="1" fill="#1a3a1a"/><rect x="1" y="9" width="1" height="1" fill="#80c0ff"/><rect x="2" y="9" width="12" height="1" fill="#208020"/><rect x="14" y="9" width="1" height="1" fill="#1040c0"/><rect x="15" y="9" width="1" height="1" fill="#80c0ff"/><rect x="1" y="10" width="1" height="1" fill="#1a3a1a"/><rect x="2" y="10" width="13" height="1" fill="#208020"/><rect x="15" y="10" width="1" height="1" fill="#1040c0"/><rect x="2" y="11" width="1" height="1" fill="#1a3a1a"/><rect x="3" y="11" width="3" height="1" fill="#208020"/><rect x="6" y="11" width="1" height="1" fill="#1a3a1a"/><rect x="11" y="11" width="1" height="1" fill="#1a3a1a"/><rect x="12" y="11" width="3" height="1" fill="#1040c0"/><rect x="15" y="11" width="1" height="1" fill="#80c0ff"/><rect x="3" y="12" width="1" height="1" fill="#1a3a1a"/><rect x="4" y="12" width="2" height="1" fill="#40c040"/><rect x="6" y="12" width="1" height="1" fill="#1a3a1a"/><rect x="11" y="12" width="1" height="1" fill="#1a3a1a"/><rect x="12" y="12" width="2" height="1" fill="#2060ff"/><rect x="14" y="12" width="1" height="1" fill="#1a3a1a"/><rect x="4" y="13" width="3" height="1" fill="#1a3a1a"/><rect x="11" y="13" width="3" height="1" fill="#1a3a1a"/>',
  '📜': '<rect x="2" y="0" width="12" height="1" fill="#1a0d00"/><rect x="2" y="1" width="1" height="1" fill="#1a0d00"/><rect x="3" y="1" width="2" height="1" fill="#8B4513"/><rect x="5" y="1" width="1" height="1" fill="#1a0d00"/><rect x="6" y="1" width="7" height="1" fill="#e8d090"/><rect x="13" y="1" width="1" height="1" fill="#8B4513"/><rect x="14" y="1" width="1" height="1" fill="#1a0d00"/><rect x="2" y="2" width="1" height="1" fill="#1a0d00"/><rect x="3" y="2" width="2" height="1" fill="#8B4513"/><rect x="5" y="2" width="1" height="1" fill="#1a0d00"/><rect x="6" y="2" width="1" height="1" fill="#f8e8b0"/><rect x="7" y="2" width="6" height="1" fill="#e8d090"/><rect x="13" y="2" width="1" height="1" fill="#8B4513"/><rect x="14" y="2" width="1" height="1" fill="#1a0d00"/><rect x="2" y="3" width="1" height="1" fill="#1a0d00"/><rect x="3" y="3" width="2" height="1" fill="#8B4513"/><rect x="5" y="3" width="1" height="1" fill="#1a0d00"/><rect x="6" y="3" width="1" height="1" fill="#f8e8b0"/><rect x="7" y="3" width="6" height="1" fill="#e8d090"/><rect x="13" y="3" width="1" height="1" fill="#8B4513"/><rect x="14" y="3" width="1" height="1" fill="#1a0d00"/><rect x="2" y="4" width="1" height="1" fill="#1a0d00"/><rect x="3" y="4" width="2" height="1" fill="#8B4513"/><rect x="5" y="4" width="1" height="1" fill="#1a0d00"/><rect x="6" y="4" width="1" height="1" fill="#f8e8b0"/><rect x="7" y="4" width="1" height="1" fill="#fff8e0"/><rect x="8" y="4" width="5" height="1" fill="#e8d090"/><rect x="13" y="4" width="1" height="1" fill="#8B4513"/><rect x="14" y="4" width="1" height="1" fill="#1a0d00"/><rect x="2" y="5" width="1" height="1" fill="#1a0d00"/><rect x="3" y="5" width="2" height="1" fill="#8B4513"/><rect x="5" y="5" width="1" height="1" fill="#1a0d00"/><rect x="6" y="5" width="1" height="1" fill="#f8e8b0"/><rect x="7" y="5" width="1" height="1" fill="#fff8e0"/><rect x="8" y="5" width="5" height="1" fill="#e8d090"/><rect x="13" y="5" width="1" height="1" fill="#8B4513"/><rect x="14" y="5" width="1" height="1" fill="#1a0d00"/><rect x="2" y="6" width="1" height="1" fill="#1a0d00"/><rect x="3" y="6" width="2" height="1" fill="#8B4513"/><rect x="5" y="6" width="1" height="1" fill="#1a0d00"/><rect x="6" y="6" width="1" height="1" fill="#f8e8b0"/><rect x="7" y="6" width="2" height="1" fill="#fff8e0"/><rect x="9" y="6" width="4" height="1" fill="#e8d090"/><rect x="13" y="6" width="1" height="1" fill="#8B4513"/><rect x="14" y="6" width="1" height="1" fill="#1a0d00"/><rect x="2" y="7" width="1" height="1" fill="#1a0d00"/><rect x="3" y="7" width="2" height="1" fill="#8B4513"/><rect x="5" y="7" width="1" height="1" fill="#1a0d00"/><rect x="6" y="7" width="1" height="1" fill="#f8e8b0"/><rect x="7" y="7" width="2" height="1" fill="#fff8e0"/><rect x="9" y="7" width="4" height="1" fill="#e8d090"/><rect x="13" y="7" width="1" height="1" fill="#8B4513"/><rect x="14" y="7" width="1" height="1" fill="#1a0d00"/><rect x="2" y="8" width="1" height="1" fill="#1a0d00"/><rect x="3" y="8" width="2" height="1" fill="#8B4513"/><rect x="5" y="8" width="1" height="1" fill="#1a0d00"/><rect x="6" y="8" width="1" height="1" fill="#f8e8b0"/><rect x="7" y="8" width="3" height="1" fill="#fff8e0"/><rect x="10" y="8" width="3" height="1" fill="#e8d090"/><rect x="13" y="8" width="1" height="1" fill="#8B4513"/><rect x="14" y="8" width="1" height="1" fill="#1a0d00"/><rect x="2" y="9" width="1" height="1" fill="#1a0d00"/><rect x="3" y="9" width="2" height="1" fill="#8B4513"/><rect x="5" y="9" width="1" height="1" fill="#1a0d00"/><rect x="6" y="9" width="1" height="1" fill="#f8e8b0"/><rect x="7" y="9" width="3" height="1" fill="#fff8e0"/><rect x="10" y="9" width="3" height="1" fill="#e8d090"/><rect x="13" y="9" width="1" height="1" fill="#8B4513"/><rect x="14" y="9" width="1" height="1" fill="#1a0d00"/><rect x="2" y="10" width="1" height="1" fill="#1a0d00"/><rect x="3" y="10" width="2" height="1" fill="#8B4513"/><rect x="5" y="10" width="1" height="1" fill="#1a0d00"/><rect x="6" y="10" width="1" height="1" fill="#f8e8b0"/><rect x="7" y="10" width="4" height="1" fill="#fff8e0"/><rect x="11" y="10" width="2" height="1" fill="#e8d090"/><rect x="13" y="10" width="1" height="1" fill="#8B4513"/><rect x="14" y="10" width="1" height="1" fill="#1a0d00"/><rect x="2" y="11" width="1" height="1" fill="#1a0d00"/><rect x="3" y="11" width="2" height="1" fill="#8B4513"/><rect x="5" y="11" width="1" height="1" fill="#1a0d00"/><rect x="6" y="11" width="1" height="1" fill="#f8e8b0"/><rect x="7" y="11" width="4" height="1" fill="#fff8e0"/><rect x="11" y="11" width="2" height="1" fill="#e8d090"/><rect x="13" y="11" width="1" height="1" fill="#8B4513"/><rect x="14" y="11" width="1" height="1" fill="#1a0d00"/><rect x="2" y="12" width="1" height="1" fill="#1a0d00"/><rect x="3" y="12" width="2" height="1" fill="#8B4513"/><rect x="5" y="12" width="1" height="1" fill="#1a0d00"/><rect x="6" y="12" width="8" height="1" fill="#c8b060"/><rect x="14" y="12" width="1" height="1" fill="#8B4513"/><rect x="15" y="12" width="1" height="1" fill="#1a0d00"/><rect x="2" y="13" width="1" height="1" fill="#1a0d00"/><rect x="3" y="13" width="2" height="1" fill="#8B4513"/><rect x="5" y="13" width="1" height="1" fill="#1a0d00"/><rect x="6" y="13" width="8" height="1" fill="#a08030"/><rect x="14" y="13" width="1" height="1" fill="#8B4513"/><rect x="15" y="13" width="1" height="1" fill="#1a0d00"/><rect x="2" y="14" width="1" height="1" fill="#1a0d00"/><rect x="3" y="14" width="12" height="1" fill="#8B4513"/><rect x="15" y="14" width="1" height="1" fill="#1a0d00"/><rect x="3" y="15" width="12" height="1" fill="#1a0d00"/>',
  '🎡': '<rect x="4" y="1" width="9" height="1" fill="#1a0d00"/><rect x="3" y="2" width="1" height="1" fill="#1a0d00"/><rect x="4" y="2" width="9" height="1" fill="#8B4513"/><rect x="13" y="2" width="1" height="1" fill="#1a0d00"/><rect x="3" y="3" width="1" height="1" fill="#1a0d00"/><rect x="4" y="3" width="2" height="1" fill="#8B4513"/><rect x="6" y="3" width="1" height="1" fill="#1a0d00"/><rect x="7" y="3" width="4" height="1" fill="#8B4513"/><rect x="11" y="3" width="1" height="1" fill="#1a0d00"/><rect x="12" y="3" width="2" height="1" fill="#8B4513"/><rect x="14" y="3" width="1" height="1" fill="#1a0d00"/><rect x="3" y="4" width="1" height="1" fill="#1a0d00"/><rect x="4" y="4" width="2" height="1" fill="#8B4513"/><rect x="6" y="4" width="1" height="1" fill="#1a0d00"/><rect x="7" y="4" width="4" height="1" fill="#8B4513"/><rect x="11" y="4" width="1" height="1" fill="#1a0d00"/><rect x="12" y="4" width="2" height="1" fill="#8B4513"/><rect x="14" y="4" width="1" height="1" fill="#1a0d00"/><rect x="3" y="5" width="1" height="1" fill="#1a0d00"/><rect x="4" y="5" width="2" height="1" fill="#8B4513"/><rect x="6" y="5" width="2" height="1" fill="#1a0d00"/><rect x="8" y="5" width="2" height="1" fill="#d4a820"/><rect x="10" y="5" width="2" height="1" fill="#1a0d00"/><rect x="12" y="5" width="2" height="1" fill="#8B4513"/><rect x="14" y="5" width="1" height="1" fill="#1a0d00"/><rect x="3" y="6" width="1" height="1" fill="#1a0d00"/><rect x="4" y="6" width="3" height="1" fill="#8B4513"/><rect x="7" y="6" width="1" height="1" fill="#1a0d00"/><rect x="8" y="6" width="2" height="1" fill="#d4a820"/><rect x="10" y="6" width="1" height="1" fill="#1a0d00"/><rect x="11" y="6" width="3" height="1" fill="#8B4513"/><rect x="14" y="6" width="1" height="1" fill="#1a0d00"/><rect x="3" y="7" width="1" height="1" fill="#1a0d00"/><rect x="4" y="7" width="3" height="1" fill="#8B4513"/><rect x="7" y="7" width="1" height="1" fill="#1a0d00"/><rect x="8" y="7" width="2" height="1" fill="#d4a820"/><rect x="10" y="7" width="1" height="1" fill="#1a0d00"/><rect x="11" y="7" width="3" height="1" fill="#8B4513"/><rect x="14" y="7" width="1" height="1" fill="#1a0d00"/><rect x="3" y="8" width="1" height="1" fill="#1a0d00"/><rect x="4" y="8" width="3" height="1" fill="#8B4513"/><rect x="7" y="8" width="1" height="1" fill="#1a0d00"/><rect x="8" y="8" width="2" height="1" fill="#d4a820"/><rect x="10" y="8" width="1" height="1" fill="#1a0d00"/><rect x="11" y="8" width="3" height="1" fill="#8B4513"/><rect x="14" y="8" width="1" height="1" fill="#1a0d00"/><rect x="3" y="9" width="1" height="1" fill="#1a0d00"/><rect x="4" y="9" width="3" height="1" fill="#8B4513"/><rect x="7" y="9" width="4" height="1" fill="#1a0d00"/><rect x="11" y="9" width="3" height="1" fill="#8B4513"/><rect x="14" y="9" width="1" height="1" fill="#1a0d00"/><rect x="3" y="10" width="1" height="1" fill="#1a0d00"/><rect x="4" y="10" width="10" height="1" fill="#8B4513"/><rect x="14" y="10" width="1" height="1" fill="#1a0d00"/><rect x="3" y="11" width="1" height="1" fill="#1a0d00"/><rect x="4" y="11" width="10" height="1" fill="#8B4513"/><rect x="14" y="11" width="1" height="1" fill="#1a0d00"/><rect x="4" y="12" width="1" height="1" fill="#1a0d00"/><rect x="5" y="12" width="8" height="1" fill="#8B4513"/><rect x="13" y="12" width="1" height="1" fill="#1a0d00"/><rect x="4" y="13" width="9" height="1" fill="#1a0d00"/><rect x="6" y="14" width="1" height="1" fill="#1a0d00"/><rect x="7" y="14" width="2" height="1" fill="#808080"/><rect x="9" y="14" width="1" height="1" fill="#1a0d00"/><rect x="5" y="15" width="1" height="1" fill="#1a0d00"/><rect x="6" y="15" width="4" height="1" fill="#808080"/><rect x="10" y="15" width="1" height="1" fill="#1a0d00"/>',
  '🔒': '<rect x="4" y="1" width="6" height="1" fill="#1a1a1a"/><rect x="3" y="2" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="2" width="6" height="1" fill="#c0c0c0"/><rect x="10" y="2" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="3" width="2" height="1" fill="#c0c0c0"/><rect x="5" y="3" width="3" height="1" fill="#e0e0e0"/><rect x="8" y="3" width="4" height="1" fill="#c0c0c0"/><rect x="12" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="4" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="4" width="2" height="1" fill="#c0c0c0"/><rect x="5" y="4" width="3" height="1" fill="#e0e0e0"/><rect x="8" y="4" width="4" height="1" fill="#c0c0c0"/><rect x="12" y="4" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="5" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="5" width="10" height="1" fill="#c0c0c0"/><rect x="13" y="5" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="6" width="10" height="1" fill="#c0c0c0"/><rect x="13" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="7" width="11" height="1" fill="#1a1a1a"/><rect x="2" y="8" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="8" width="11" height="1" fill="#606060"/><rect x="14" y="8" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="9" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="9" width="3" height="1" fill="#606060"/><rect x="6" y="9" width="1" height="1" fill="#1a1a1a"/><rect x="7" y="9" width="3" height="1" fill="#ffe040"/><rect x="10" y="9" width="1" height="1" fill="#1a1a1a"/><rect x="11" y="9" width="3" height="1" fill="#606060"/><rect x="14" y="9" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="10" width="3" height="1" fill="#606060"/><rect x="6" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="7" y="10" width="3" height="1" fill="#ffe040"/><rect x="10" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="11" y="10" width="3" height="1" fill="#606060"/><rect x="14" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="11" width="3" height="1" fill="#606060"/><rect x="6" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="7" y="11" width="1" height="1" fill="#ffe040"/><rect x="8" y="11" width="1" height="1" fill="#c0a000"/><rect x="9" y="11" width="1" height="1" fill="#ffe040"/><rect x="10" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="11" y="11" width="3" height="1" fill="#606060"/><rect x="14" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="12" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="12" width="5" height="1" fill="#606060"/><rect x="8" y="12" width="1" height="1" fill="#806800"/><rect x="9" y="12" width="5" height="1" fill="#606060"/><rect x="14" y="12" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="13" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="13" width="11" height="1" fill="#606060"/><rect x="14" y="13" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="14" width="13" height="1" fill="#1a1a1a"/>',
  '🪙': '<rect x="5" y="1" width="6" height="1" fill="#1a0d00"/><rect x="4" y="2" width="1" height="1" fill="#1a0d00"/><rect x="5" y="2" width="6" height="1" fill="#d4a820"/><rect x="11" y="2" width="1" height="1" fill="#1a0d00"/><rect x="3" y="3" width="1" height="1" fill="#1a0d00"/><rect x="4" y="3" width="1" height="1" fill="#d4a820"/><rect x="5" y="3" width="5" height="1" fill="#ffe060"/><rect x="10" y="3" width="2" height="1" fill="#d4a820"/><rect x="12" y="3" width="1" height="1" fill="#1a0d00"/><rect x="2" y="4" width="1" height="1" fill="#1a0d00"/><rect x="3" y="4" width="1" height="1" fill="#d4a820"/><rect x="4" y="4" width="2" height="1" fill="#ffe060"/><rect x="6" y="4" width="3" height="1" fill="#fff8c0"/><rect x="9" y="4" width="2" height="1" fill="#ffe060"/><rect x="11" y="4" width="2" height="1" fill="#d4a820"/><rect x="13" y="4" width="1" height="1" fill="#1a0d00"/><rect x="2" y="5" width="1" height="1" fill="#1a0d00"/><rect x="3" y="5" width="1" height="1" fill="#d4a820"/><rect x="4" y="5" width="1" height="1" fill="#ffe060"/><rect x="5" y="5" width="1" height="1" fill="#fff8c0"/><rect x="6" y="5" width="3" height="1" fill="#ffe060"/><rect x="9" y="5" width="1" height="1" fill="#fff8c0"/><rect x="10" y="5" width="1" height="1" fill="#ffe060"/><rect x="11" y="5" width="2" height="1" fill="#d4a820"/><rect x="13" y="5" width="1" height="1" fill="#1a0d00"/><rect x="2" y="6" width="1" height="1" fill="#1a0d00"/><rect x="3" y="6" width="1" height="1" fill="#d4a820"/><rect x="4" y="6" width="1" height="1" fill="#ffe060"/><rect x="5" y="6" width="1" height="1" fill="#fff8c0"/><rect x="6" y="6" width="1" height="1" fill="#ffe060"/><rect x="7" y="6" width="1" height="1" fill="#f0d040"/><rect x="8" y="6" width="1" height="1" fill="#ffe060"/><rect x="9" y="6" width="1" height="1" fill="#fff8c0"/><rect x="10" y="6" width="1" height="1" fill="#ffe060"/><rect x="11" y="6" width="2" height="1" fill="#d4a820"/><rect x="13" y="6" width="1" height="1" fill="#1a0d00"/><rect x="2" y="7" width="1" height="1" fill="#1a0d00"/><rect x="3" y="7" width="1" height="1" fill="#d4a820"/><rect x="4" y="7" width="1" height="1" fill="#ffe060"/><rect x="5" y="7" width="1" height="1" fill="#fff8c0"/><rect x="6" y="7" width="3" height="1" fill="#ffe060"/><rect x="9" y="7" width="1" height="1" fill="#fff8c0"/><rect x="10" y="7" width="1" height="1" fill="#ffe060"/><rect x="11" y="7" width="2" height="1" fill="#d4a820"/><rect x="13" y="7" width="1" height="1" fill="#1a0d00"/><rect x="2" y="8" width="1" height="1" fill="#1a0d00"/><rect x="3" y="8" width="1" height="1" fill="#d4a820"/><rect x="4" y="8" width="2" height="1" fill="#ffe060"/><rect x="6" y="8" width="3" height="1" fill="#fff8c0"/><rect x="9" y="8" width="2" height="1" fill="#ffe060"/><rect x="11" y="8" width="2" height="1" fill="#d4a820"/><rect x="13" y="8" width="1" height="1" fill="#1a0d00"/><rect x="2" y="9" width="1" height="1" fill="#1a0d00"/><rect x="3" y="9" width="2" height="1" fill="#d4a820"/><rect x="5" y="9" width="5" height="1" fill="#ffe060"/><rect x="10" y="9" width="3" height="1" fill="#d4a820"/><rect x="13" y="9" width="1" height="1" fill="#1a0d00"/><rect x="3" y="10" width="1" height="1" fill="#1a0d00"/><rect x="4" y="10" width="8" height="1" fill="#d4a820"/><rect x="12" y="10" width="1" height="1" fill="#1a0d00"/><rect x="4" y="11" width="1" height="1" fill="#1a0d00"/><rect x="5" y="11" width="6" height="1" fill="#d4a820"/><rect x="11" y="11" width="1" height="1" fill="#1a0d00"/><rect x="4" y="12" width="1" height="1" fill="#1a0d00"/><rect x="5" y="12" width="6" height="1" fill="#8a6800"/><rect x="11" y="12" width="1" height="1" fill="#1a0d00"/><rect x="4" y="13" width="8" height="1" fill="#1a0d00"/>',
  '🔥': '<rect x="8" y="1" width="1" height="1" fill="#ffffff"/><rect x="9" y="1" width="1" height="1" fill="#1a0800"/><rect x="7" y="2" width="1" height="1" fill="#ffffff"/><rect x="8" y="2" width="2" height="1" fill="#ffe040"/><rect x="10" y="2" width="1" height="1" fill="#1a0800"/><rect x="3" y="3" width="1" height="1" fill="#1a0800"/><rect x="4" y="3" width="2" height="1" fill="#ffffff"/><rect x="6" y="3" width="3" height="1" fill="#ffe040"/><rect x="9" y="3" width="1" height="1" fill="#1a0800"/><rect x="2" y="4" width="1" height="1" fill="#1a0800"/><rect x="3" y="4" width="1" height="1" fill="#ffffff"/><rect x="4" y="4" width="5" height="1" fill="#ffe040"/><rect x="9" y="4" width="1" height="1" fill="#1a0800"/><rect x="2" y="5" width="1" height="1" fill="#1a0800"/><rect x="3" y="5" width="6" height="1" fill="#ffe040"/><rect x="9" y="5" width="1" height="1" fill="#1a0800"/><rect x="2" y="6" width="1" height="1" fill="#1a0800"/><rect x="3" y="6" width="3" height="1" fill="#ffe040"/><rect x="6" y="6" width="1" height="1" fill="#ff8000"/><rect x="7" y="6" width="2" height="1" fill="#ffe040"/><rect x="9" y="6" width="1" height="1" fill="#1a0800"/><rect x="2" y="7" width="1" height="1" fill="#1a0800"/><rect x="3" y="7" width="2" height="1" fill="#ffe040"/><rect x="5" y="7" width="3" height="1" fill="#ff8000"/><rect x="8" y="7" width="2" height="1" fill="#ffe040"/><rect x="10" y="7" width="1" height="1" fill="#1a0800"/><rect x="2" y="8" width="1" height="1" fill="#1a0800"/><rect x="3" y="8" width="1" height="1" fill="#ffffff"/><rect x="4" y="8" width="1" height="1" fill="#ffe040"/><rect x="5" y="8" width="2" height="1" fill="#ff8000"/><rect x="7" y="8" width="1" height="1" fill="#e04000"/><rect x="8" y="8" width="3" height="1" fill="#ff8000"/><rect x="11" y="8" width="1" height="1" fill="#ffe040"/><rect x="12" y="8" width="1" height="1" fill="#1a0800"/><rect x="2" y="9" width="1" height="1" fill="#1a0800"/><rect x="3" y="9" width="1" height="1" fill="#ffe040"/><rect x="4" y="9" width="1" height="1" fill="#ff8000"/><rect x="5" y="9" width="4" height="1" fill="#e04000"/><rect x="9" y="9" width="2" height="1" fill="#ff8000"/><rect x="11" y="9" width="1" height="1" fill="#ffe040"/><rect x="12" y="9" width="1" height="1" fill="#1a0800"/><rect x="2" y="10" width="1" height="1" fill="#1a0800"/><rect x="3" y="10" width="1" height="1" fill="#ffe040"/><rect x="4" y="10" width="1" height="1" fill="#ff8000"/><rect x="5" y="10" width="4" height="1" fill="#e04000"/><rect x="9" y="10" width="2" height="1" fill="#ff8000"/><rect x="11" y="10" width="1" height="1" fill="#ffe040"/><rect x="12" y="10" width="1" height="1" fill="#1a0800"/><rect x="2" y="11" width="1" height="1" fill="#1a0800"/><rect x="3" y="11" width="1" height="1" fill="#ffe040"/><rect x="4" y="11" width="2" height="1" fill="#ff8000"/><rect x="6" y="11" width="2" height="1" fill="#e04000"/><rect x="8" y="11" width="3" height="1" fill="#ff8000"/><rect x="11" y="11" width="1" height="1" fill="#ffe040"/><rect x="12" y="11" width="1" height="1" fill="#1a0800"/><rect x="2" y="12" width="1" height="1" fill="#1a0800"/><rect x="3" y="12" width="1" height="1" fill="#ffe040"/><rect x="4" y="12" width="1" height="1" fill="#cc2000"/><rect x="5" y="12" width="5" height="1" fill="#801000"/><rect x="10" y="12" width="1" height="1" fill="#cc2000"/><rect x="11" y="12" width="1" height="1" fill="#ffe040"/><rect x="12" y="12" width="1" height="1" fill="#1a0800"/><rect x="2" y="13" width="1" height="1" fill="#1a0800"/><rect x="3" y="13" width="1" height="1" fill="#ffe040"/><rect x="4" y="13" width="7" height="1" fill="#801000"/><rect x="11" y="13" width="1" height="1" fill="#ffe040"/><rect x="12" y="13" width="1" height="1" fill="#1a0800"/><rect x="3" y="14" width="10" height="1" fill="#1a0800"/>',
  '💀': '<rect x="5" y="1" width="6" height="1" fill="#1a1a1a"/><rect x="4" y="2" width="1" height="1" fill="#1a1a1a"/><rect x="5" y="2" width="6" height="1" fill="#f0ecd8"/><rect x="11" y="2" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="3" width="8" height="1" fill="#f0ecd8"/><rect x="12" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="4" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="4" width="2" height="1" fill="#f0ecd8"/><rect x="5" y="4" width="1" height="1" fill="#ffffff"/><rect x="6" y="4" width="3" height="1" fill="#f0ecd8"/><rect x="9" y="4" width="1" height="1" fill="#ffffff"/><rect x="10" y="4" width="3" height="1" fill="#f0ecd8"/><rect x="13" y="4" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="5" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="5" width="1" height="1" fill="#f0ecd8"/><rect x="4" y="5" width="3" height="1" fill="#1a1a1a"/><rect x="7" y="5" width="2" height="1" fill="#f0ecd8"/><rect x="9" y="5" width="3" height="1" fill="#1a1a1a"/><rect x="12" y="5" width="1" height="1" fill="#f0ecd8"/><rect x="13" y="5" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="6" width="1" height="1" fill="#f0ecd8"/><rect x="4" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="5" y="6" width="2" height="1" fill="#c8c0a0"/><rect x="7" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="8" y="6" width="1" height="1" fill="#f0ecd8"/><rect x="9" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="10" y="6" width="2" height="1" fill="#c8c0a0"/><rect x="12" y="6" width="1" height="1" fill="#f0ecd8"/><rect x="13" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="7" width="1" height="1" fill="#f0ecd8"/><rect x="4" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="5" y="7" width="2" height="1" fill="#c8c0a0"/><rect x="7" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="8" y="7" width="1" height="1" fill="#f0ecd8"/><rect x="9" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="10" y="7" width="2" height="1" fill="#c8c0a0"/><rect x="12" y="7" width="1" height="1" fill="#f0ecd8"/><rect x="13" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="8" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="8" width="1" height="1" fill="#f0ecd8"/><rect x="4" y="8" width="3" height="1" fill="#1a1a1a"/><rect x="7" y="8" width="2" height="1" fill="#f0ecd8"/><rect x="9" y="8" width="3" height="1" fill="#1a1a1a"/><rect x="12" y="8" width="1" height="1" fill="#f0ecd8"/><rect x="13" y="8" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="9" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="9" width="10" height="1" fill="#f0ecd8"/><rect x="13" y="9" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="10" width="2" height="1" fill="#f0ecd8"/><rect x="5" y="10" width="1" height="1" fill="#b8b090"/><rect x="6" y="10" width="4" height="1" fill="#f0ecd8"/><rect x="10" y="10" width="1" height="1" fill="#b8b090"/><rect x="11" y="10" width="2" height="1" fill="#f0ecd8"/><rect x="13" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="11" width="2" height="1" fill="#f0ecd8"/><rect x="5" y="11" width="2" height="1" fill="#b8b090"/><rect x="7" y="11" width="2" height="1" fill="#f0ecd8"/><rect x="9" y="11" width="2" height="1" fill="#b8b090"/><rect x="11" y="11" width="2" height="1" fill="#f0ecd8"/><rect x="13" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="12" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="12" width="2" height="1" fill="#f0ecd8"/><rect x="5" y="12" width="1" height="1" fill="#b8b090"/><rect x="6" y="12" width="1" height="1" fill="#f0ecd8"/><rect x="7" y="12" width="1" height="1" fill="#606040"/><rect x="8" y="12" width="1" height="1" fill="#f0ecd8"/><rect x="9" y="12" width="1" height="1" fill="#b8b090"/><rect x="10" y="12" width="3" height="1" fill="#f0ecd8"/><rect x="13" y="12" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="13" width="2" height="1" fill="#1a1a1a"/><rect x="4" y="13" width="2" height="1" fill="#f0ecd8"/><rect x="6" y="13" width="4" height="1" fill="#1a1a1a"/><rect x="10" y="13" width="2" height="1" fill="#f0ecd8"/><rect x="12" y="13" width="2" height="1" fill="#1a1a1a"/><rect x="3" y="14" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="14" width="1" height="1" fill="#808060"/><rect x="5" y="14" width="5" height="1" fill="#1a1a1a"/><rect x="10" y="14" width="1" height="1" fill="#808060"/><rect x="11" y="14" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="15" width="7" height="1" fill="#1a1a1a"/>',
  '💧': '<rect x="7" y="1" width="2" height="1" fill="#001a2a"/><rect x="7" y="2" width="1" height="1" fill="#001a2a"/><rect x="8" y="2" width="2" height="1" fill="#60b0e0"/><rect x="10" y="2" width="1" height="1" fill="#001a2a"/><rect x="6" y="3" width="1" height="1" fill="#001a2a"/><rect x="7" y="3" width="4" height="1" fill="#60b0e0"/><rect x="11" y="3" width="1" height="1" fill="#001a2a"/><rect x="4" y="4" width="1" height="1" fill="#001a2a"/><rect x="5" y="4" width="2" height="1" fill="#60b0e0"/><rect x="7" y="4" width="1" height="1" fill="#90d0f0"/><rect x="8" y="4" width="3" height="1" fill="#60b0e0"/><rect x="11" y="4" width="1" height="1" fill="#001a2a"/><rect x="4" y="5" width="1" height="1" fill="#001a2a"/><rect x="5" y="5" width="1" height="1" fill="#60b0e0"/><rect x="6" y="5" width="2" height="1" fill="#90d0f0"/><rect x="8" y="5" width="4" height="1" fill="#60b0e0"/><rect x="12" y="5" width="1" height="1" fill="#001a2a"/><rect x="3" y="6" width="1" height="1" fill="#001a2a"/><rect x="4" y="6" width="2" height="1" fill="#60b0e0"/><rect x="6" y="6" width="2" height="1" fill="#90d0f0"/><rect x="8" y="6" width="1" height="1" fill="#e0f4fc"/><rect x="9" y="6" width="4" height="1" fill="#60b0e0"/><rect x="13" y="6" width="1" height="1" fill="#001a2a"/><rect x="3" y="7" width="1" height="1" fill="#001a2a"/><rect x="4" y="7" width="3" height="1" fill="#60b0e0"/><rect x="7" y="7" width="1" height="1" fill="#90d0f0"/><rect x="8" y="7" width="1" height="1" fill="#e0f4fc"/><rect x="9" y="7" width="4" height="1" fill="#60b0e0"/><rect x="13" y="7" width="1" height="1" fill="#001a2a"/><rect x="3" y="8" width="1" height="1" fill="#001a2a"/><rect x="4" y="8" width="4" height="1" fill="#60b0e0"/><rect x="8" y="8" width="1" height="1" fill="#e0f4fc"/><rect x="9" y="8" width="4" height="1" fill="#60b0e0"/><rect x="13" y="8" width="1" height="1" fill="#001a2a"/><rect x="3" y="9" width="1" height="1" fill="#001a2a"/><rect x="4" y="9" width="11" height="1" fill="#60b0e0"/><rect x="15" y="9" width="1" height="1" fill="#001a2a"/><rect x="3" y="10" width="1" height="1" fill="#001a2a"/><rect x="4" y="10" width="11" height="1" fill="#60b0e0"/><rect x="15" y="10" width="1" height="1" fill="#001a2a"/><rect x="3" y="11" width="1" height="1" fill="#001a2a"/><rect x="4" y="11" width="11" height="1" fill="#60b0e0"/><rect x="15" y="11" width="1" height="1" fill="#001a2a"/><rect x="4" y="12" width="1" height="1" fill="#001a2a"/><rect x="5" y="12" width="9" height="1" fill="#60b0e0"/><rect x="14" y="12" width="1" height="1" fill="#001a2a"/><rect x="4" y="13" width="1" height="1" fill="#001a2a"/><rect x="5" y="13" width="8" height="1" fill="#60b0e0"/><rect x="13" y="13" width="1" height="1" fill="#001a2a"/><rect x="4" y="14" width="9" height="1" fill="#001a2a"/>',
  '🏆': '<rect x="1" y="0" width="14" height="1" fill="#1a0d00"/><rect x="1" y="1" width="1" height="1" fill="#1a0d00"/><rect x="2" y="1" width="12" height="1" fill="#d4a820"/><rect x="14" y="1" width="1" height="1" fill="#1a0d00"/><rect x="1" y="2" width="1" height="1" fill="#1a0d00"/><rect x="2" y="2" width="1" height="1" fill="#d4a820"/><rect x="3" y="2" width="10" height="1" fill="#ffe060"/><rect x="13" y="2" width="1" height="1" fill="#d4a820"/><rect x="14" y="2" width="1" height="1" fill="#1a0d00"/><rect x="0" y="3" width="1" height="1" fill="#1a0d00"/><rect x="1" y="3" width="2" height="1" fill="#d4a820"/><rect x="3" y="3" width="10" height="1" fill="#ffe060"/><rect x="13" y="3" width="2" height="1" fill="#d4a820"/><rect x="15" y="3" width="1" height="1" fill="#1a0d00"/><rect x="0" y="4" width="1" height="1" fill="#1a0d00"/><rect x="1" y="4" width="2" height="1" fill="#d4a820"/><rect x="3" y="4" width="2" height="1" fill="#ffe060"/><rect x="5" y="4" width="1" height="1" fill="#fff8c0"/><rect x="6" y="4" width="4" height="1" fill="#ffe060"/><rect x="10" y="4" width="1" height="1" fill="#fff8c0"/><rect x="11" y="4" width="2" height="1" fill="#ffe060"/><rect x="13" y="4" width="2" height="1" fill="#d4a820"/><rect x="15" y="4" width="1" height="1" fill="#1a0d00"/><rect x="0" y="5" width="1" height="1" fill="#1a0d00"/><rect x="1" y="5" width="2" height="1" fill="#d4a820"/><rect x="3" y="5" width="10" height="1" fill="#ffe060"/><rect x="13" y="5" width="2" height="1" fill="#d4a820"/><rect x="15" y="5" width="1" height="1" fill="#1a0d00"/><rect x="1" y="6" width="1" height="1" fill="#1a0d00"/><rect x="2" y="6" width="3" height="1" fill="#d4a820"/><rect x="5" y="6" width="6" height="1" fill="#ffe060"/><rect x="11" y="6" width="3" height="1" fill="#d4a820"/><rect x="14" y="6" width="1" height="1" fill="#1a0d00"/><rect x="2" y="7" width="1" height="1" fill="#1a0d00"/><rect x="3" y="7" width="10" height="1" fill="#d4a820"/><rect x="13" y="7" width="1" height="1" fill="#1a0d00"/><rect x="3" y="8" width="1" height="1" fill="#1a0d00"/><rect x="4" y="8" width="3" height="1" fill="#d4a820"/><rect x="7" y="8" width="2" height="1" fill="#ffe060"/><rect x="9" y="8" width="3" height="1" fill="#d4a820"/><rect x="12" y="8" width="1" height="1" fill="#1a0d00"/><rect x="4" y="9" width="1" height="1" fill="#1a0d00"/><rect x="5" y="9" width="6" height="1" fill="#d4a820"/><rect x="11" y="9" width="1" height="1" fill="#1a0d00"/><rect x="4" y="10" width="1" height="1" fill="#1a0d00"/><rect x="5" y="10" width="6" height="1" fill="#c0c0c0"/><rect x="11" y="10" width="1" height="1" fill="#1a0d00"/><rect x="4" y="11" width="1" height="1" fill="#1a0d00"/><rect x="5" y="11" width="1" height="1" fill="#c0c0c0"/><rect x="6" y="11" width="3" height="1" fill="#808080"/><rect x="9" y="11" width="1" height="1" fill="#c0c0c0"/><rect x="10" y="11" width="1" height="1" fill="#808080"/><rect x="11" y="11" width="1" height="1" fill="#1a0d00"/><rect x="3" y="12" width="2" height="1" fill="#1a0d00"/><rect x="5" y="12" width="6" height="1" fill="#c0c0c0"/><rect x="11" y="12" width="2" height="1" fill="#1a0d00"/><rect x="3" y="13" width="1" height="1" fill="#1a0d00"/><rect x="4" y="13" width="9" height="1" fill="#d4a820"/><rect x="13" y="13" width="1" height="1" fill="#1a0d00"/><rect x="4" y="14" width="10" height="1" fill="#1a0d00"/>',
  '⚔': '<rect x="2" y="0" width="2" height="1" fill="#1a1a1a"/><rect x="12" y="0" width="2" height="1" fill="#1a1a1a"/><rect x="2" y="1" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="1" width="2" height="1" fill="#d0d8e0"/><rect x="5" y="1" width="1" height="1" fill="#1a1a1a"/><rect x="12" y="1" width="1" height="1" fill="#1a1a1a"/><rect x="13" y="1" width="2" height="1" fill="#d0d8e0"/><rect x="15" y="1" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="2" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="2" width="4" height="1" fill="#d0d8e0"/><rect x="8" y="2" width="1" height="1" fill="#1a1a1a"/><rect x="11" y="2" width="1" height="1" fill="#1a1a1a"/><rect x="12" y="2" width="4" height="1" fill="#d0d8e0"/><rect x="4" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="5" y="3" width="4" height="1" fill="#d0d8e0"/><rect x="9" y="3" width="2" height="1" fill="#1a1a1a"/><rect x="11" y="3" width="4" height="1" fill="#d0d8e0"/><rect x="15" y="3" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="4" width="1" height="1" fill="#1a1a1a"/><rect x="5" y="4" width="8" height="1" fill="#d0d8e0"/><rect x="13" y="4" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="5" width="2" height="1" fill="#1a1a1a"/><rect x="6" y="5" width="6" height="1" fill="#d0d8e0"/><rect x="12" y="5" width="1" height="1" fill="#1a1a1a"/><rect x="6" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="7" y="6" width="4" height="1" fill="#d0d8e0"/><rect x="11" y="6" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="7" width="1" height="1" fill="#d4a820"/><rect x="5" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="6" y="7" width="4" height="1" fill="#d0d8e0"/><rect x="10" y="7" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="8" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="8" width="3" height="1" fill="#d4a820"/><rect x="7" y="8" width="1" height="1" fill="#1a1a1a"/><rect x="8" y="8" width="2" height="1" fill="#d0d8e0"/><rect x="10" y="8" width="1" height="1" fill="#1a1a1a"/><rect x="2" y="9" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="9" width="5" height="1" fill="#d4a820"/><rect x="8" y="9" width="2" height="1" fill="#1a1a1a"/><rect x="2" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="10" width="6" height="1" fill="#d4a820"/><rect x="9" y="10" width="1" height="1" fill="#1a1a1a"/><rect x="3" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="11" width="4" height="1" fill="#d4a820"/><rect x="8" y="11" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="12" width="1" height="1" fill="#1a1a1a"/><rect x="5" y="12" width="2" height="1" fill="#d4a820"/><rect x="7" y="12" width="1" height="1" fill="#1a1a1a"/><rect x="4" y="13" width="3" height="1" fill="#1a1a1a"/>',
  '💰': '<rect x="5" y="1" width="4" height="1" fill="#1a0d00"/><rect x="4" y="2" width="1" height="1" fill="#1a0d00"/><rect x="5" y="2" width="4" height="1" fill="#8B4513"/><rect x="9" y="2" width="1" height="1" fill="#1a0d00"/><rect x="4" y="3" width="1" height="1" fill="#1a0d00"/><rect x="5" y="3" width="1" height="1" fill="#8B4513"/><rect x="6" y="3" width="1" height="1" fill="#a07830"/><rect x="7" y="3" width="2" height="1" fill="#8B4513"/><rect x="9" y="3" width="1" height="1" fill="#1a0d00"/><rect x="5" y="4" width="1" height="1" fill="#1a0d00"/><rect x="6" y="4" width="2" height="1" fill="#8B4513"/><rect x="8" y="4" width="1" height="1" fill="#1a0d00"/><rect x="5" y="5" width="8" height="1" fill="#1a0d00"/><rect x="4" y="6" width="1" height="1" fill="#1a0d00"/><rect x="5" y="6" width="8" height="1" fill="#d4a820"/><rect x="13" y="6" width="1" height="1" fill="#1a0d00"/><rect x="3" y="7" width="1" height="1" fill="#1a0d00"/><rect x="4" y="7" width="1" height="1" fill="#d4a820"/><rect x="5" y="7" width="7" height="1" fill="#ffe060"/><rect x="12" y="7" width="2" height="1" fill="#d4a820"/><rect x="14" y="7" width="1" height="1" fill="#1a0d00"/><rect x="2" y="8" width="1" height="1" fill="#1a0d00"/><rect x="3" y="8" width="1" height="1" fill="#d4a820"/><rect x="4" y="8" width="3" height="1" fill="#ffe060"/><rect x="7" y="8" width="2" height="1" fill="#fff8c0"/><rect x="9" y="8" width="4" height="1" fill="#ffe060"/><rect x="13" y="8" width="2" height="1" fill="#d4a820"/><rect x="15" y="8" width="1" height="1" fill="#1a0d00"/><rect x="1" y="9" width="1" height="1" fill="#1a0d00"/><rect x="2" y="9" width="1" height="1" fill="#d4a820"/><rect x="3" y="9" width="2" height="1" fill="#ffe060"/><rect x="5" y="9" width="1" height="1" fill="#fff8c0"/><rect x="6" y="9" width="2" height="1" fill="#d4a820"/><rect x="8" y="9" width="1" height="1" fill="#fff8c0"/><rect x="9" y="9" width="3" height="1" fill="#ffe060"/><rect x="12" y="9" width="3" height="1" fill="#d4a820"/><rect x="15" y="9" width="1" height="1" fill="#1a0d00"/><rect x="1" y="10" width="1" height="1" fill="#1a0d00"/><rect x="2" y="10" width="1" height="1" fill="#d4a820"/><rect x="3" y="10" width="3" height="1" fill="#ffe060"/><rect x="6" y="10" width="2" height="1" fill="#fff8c0"/><rect x="8" y="10" width="4" height="1" fill="#ffe060"/><rect x="12" y="10" width="3" height="1" fill="#d4a820"/><rect x="15" y="10" width="1" height="1" fill="#1a0d00"/><rect x="1" y="11" width="1" height="1" fill="#1a0d00"/><rect x="2" y="11" width="1" height="1" fill="#d4a820"/><rect x="3" y="11" width="9" height="1" fill="#ffe060"/><rect x="12" y="11" width="3" height="1" fill="#d4a820"/><rect x="15" y="11" width="1" height="1" fill="#1a0d00"/><rect x="2" y="12" width="1" height="1" fill="#1a0d00"/><rect x="3" y="12" width="1" height="1" fill="#d4a820"/><rect x="4" y="12" width="7" height="1" fill="#ffe060"/><rect x="11" y="12" width="3" height="1" fill="#d4a820"/><rect x="14" y="12" width="1" height="1" fill="#1a0d00"/><rect x="3" y="13" width="1" height="1" fill="#1a0d00"/><rect x="4" y="13" width="9" height="1" fill="#d4a820"/><rect x="13" y="13" width="1" height="1" fill="#1a0d00"/><rect x="4" y="14" width="10" height="1" fill="#1a0d00"/>',
};
function ico(emoji, sz, col){
  sz = sz || 16;
  const inner = ICON_MAP[emoji];
  if(!inner) return '<span style="font-size:'+sz+'px;line-height:1">' + emoji + '</span>';
  const colStyle = col ? ';color:'+col : '';
  return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;display:inline-block;flex-shrink:0'+colStyle+'" aria-hidden="true">'+inner+'</svg>';
}

const RELICS = [
  { id:'luckyhat', n:'THE UNREASONABLY LUCKY HAT', icon:'🎩', d:'Nobody can explain why it works. It just works. Your first failed challenge each lap counts as a win instead. Also +0.3 beer/min — permanently.', price:70, brewBonus:0.3 },
  { id:'energy',   n:'LIQUID COURAGE (BOTTLED, LEGAL)', icon:'⚡', char:'machine', d:'The Machine treats this as a food group, not a beverage. Keeps you sharp all night, or at least convincingly upright. Also +0.3 beer/min — permanently.', price:55, brewBonus:0.3 },
  { id:'ring',     n:"THE GAMBLER'S SIGNET RING", icon:'💍', char:'gambler', d:'Standard-issue equipment for every Gambler at birth, allegedly. +25% XP on every gambling tile. Also +0.4 beer/min — permanently.', price:65, brewBonus:0.4 },
  { id:'shoes',    n:'SHOES OF SUSPICIOUSLY GOOD BALANCE', icon:'👟', char:'jester', d:'The Jester\'s preferred method of avoiding responsibility at high speed. MOVE tiles send you 2 extra squares. Also +0.2 beer/min — permanently.', price:45, brewBonus:0.2 },
  { id:'shades',   n:'SUNGLASSES AT NIGHT (ICONIC, NOT PRACTICAL)', icon:'🕶️', d:'Look effortlessly cool doing literally any of this. Also +0.3 beer/min — permanently.', price:55, brewBonus:0.3 },
  { id:'bottomlessstein', n:'THE BOTTOMLESS STEIN', icon:'🍺', char:'tank', d:'Rumored to never actually empty. An extra +25% XP on top of your already absurd beer bonus. Also +0.3 beer/min — permanently.', price:60, brewBonus:0.3 },
  { id:'loadeddice', n:"LOADED DICE (DON'T ASK)", icon:'🎲', char:'gambler', d:"Definitely not legal at the actual casino. An extra +25% XP on gambling tiles AND unlocks Dice game in The Den — rigged in your favour, allegedly. Also +0.3 beer/min.", price:60, brewBonus:0.3 },
  { id:'tarotdeck',  n:"THE TAROT DECK",            icon:'🃏', char:'gambler', d:"Ancient cards, dubious provenance. Unlocks Cards in The Den — pure 50/50, 2 spins per challenge. Also +0.4 beer/min.", price:75, brewBonus:0.4 },
  { id:'horseshoe',  n:"THE LUCKY HORSESHOE",        icon:'🧲', char:'gambler', d:"Nailed above every great gambler's door. Unlocks the Horseshoe game in The Den — 60/40 odds in your favour, 1 golden spin per challenge. Also +0.5 beer/min.", price:100, brewBonus:0.5 },
  { id:'ironthroat',  n:"IRON THROAT",           icon:'🫗', char:'tank', d:"Forged in the fires of a hundred ill-advised challenges. Unlocks the Iron Chug — longer sweet spot, 3 attempts per challenge. Also +0.3 beer/min.", price:55, brewBonus:0.3 },
  { id:'vikinghorn',  n:"THE VIKING DRINKING HORN", icon:'📯', char:'tank', d:"Passed down through generations of people who definitely didn't need it. Unlocks the Horn Chug — massive sweet spot, bonus coins on a perfect. Also +0.4 beer/min.", price:75, brewBonus:0.4 },
  { id:'meadaltar',   n:"THE MEAD ALTAR",           icon:'⚗️', char:'tank', d:"Built from reclaimed pub stools and sheer disregard for consequences. Unlocks Legend Mode — nail the perfect zone for 3× XP and a glory toast. Also +0.5 beer/min.", price:100, brewBonus:0.5 },
  { id:'jokerscap', n:"THE JOKER'S CAP", icon:'🃏', char:'jester', d:'Bells that only you can hear, apparently. An extra +25% XP on party games and the Wheel. Also +0.3 beer/min — permanently.', price:60, brewBonus:0.3 },
  { id:'ironknuckles', n:'IRON KNUCKLES', icon:'👊', char:'machine', d:'Not technically legal in darts. An extra +25% XP on physical challenges, stacking on Raw Power. Also +0.3 beer/min — permanently.', price:60, brewBonus:0.3 }
];

const CONSUMABLES = [
  { id:'fakeid',    n:"THE WORLD'S MOST CONVINCING FAKE ID", icon:'🪪', char:'tank', d:'The Tank\'s go-to for doors, dealers, and one very specific ex. Auto-wins your next challenge tile, no questions asked.', price:25 },
  { id:'anotherround', n:"ONE MORE IN THE TANK", icon:'🥃', char:'tank', d:"The Tank doesn't quit. +1 chug attempt right now — because sometimes the bar needs a second opinion.", price:25 },
  { id:'icebucket',   n:"ONE MORE SPIN, I SWEAR",   icon:'🔁', d:'Instantly refills a reroll — spin the lever again for free. Famous last words.', price:15 },
  { id:'haggle',      n:"THE GIFT OF THE GAB",      icon:'🤝', d:"Smooth talk your way to one deal. Use it in the shop to pay for any item in XP instead of coins. Works once, burns after.", price:5 },
  { id:'debtpardon',  n:"THE DEBT COLLECTOR'S NIGHTMARE", icon:'📜', d:"A sealed letter from someone high up. All outstanding debts: forgiven. Balances restored to zero. Nobody asks questions.", price:80 }
];

/* ---------- secret missions (one assigned privately per run) ---------- */
const MISSIONS = [
  { n:'THE FAKE TRADITION', d:'Invent a fake "tradition" right now (e.g. "you always down your drink when someone drops a coaster"). Get at least 2 others to actually follow it later, unprompted, like it\'s a real rule.', xp:90 },
  { n:'THE COUNTERFEIT WORD', d:'Pick a totally made-up word right now (something dumb, like "grimbleton"). Slip it into conversation once yourself, then get 2 others to say it back later — unprompted, as if it\'s a real word.', xp:90 },
  { n:'THE NAVIGATOR', d:'Silently pick a specific venue in your head right now. Get the squad to end up there next WITHOUT you naming it out loud first — someone else has to suggest it.', xp:95 },
  { n:'SKÅL SIMON SAYS', d:'Secretly start a 10-minute timer. Get all 3 others to individually say "skål" before it runs out — without ever calling a group toast yourself.', xp:100 },
  { n:'THE FALSE COMPLIMENT', d:'Pick one specific, slightly absurd compliment right now (e.g. "incredible taste in shoes"). Get 2 different people to say that exact compliment to one specific squad member tonight.', xp:85 },
  { n:'MATCHING ORDERS', d:'Order a specific drink. Without telling anyone what it is, get all 3 others to independently order that exact same drink at some point tonight.', xp:95 },
  { n:'THE FAKE EXCUSE', d:'Invent one specific fake reason right now (e.g. "that place looked closed") to skip a venue that was actually on the plan — and get the squad to actually skip it because of your excuse.', xp:85 },
  { n:'THE PLANTED LIE', d:'Tell the squad one small, harmless, made-up "fact" about the city or one of them right now. Catch at least one of them repeating it to someone else later as if it\'s true.', xp:95 },
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
    coins:0, souvenirs:{}, relics:[], items:{}, hatUsedThisLap:false, denSpinsLeft:3, chugAttemptsLeft:2,
    rage:0, bloodied:false, chugMisses:0, perfectChugs:0, rageActivations:0, haggleActive:false,
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
    // brewery no longer funds S.coins — it's a pure score/prestige tracker
    S.beerCoinsTotal = (S.beerCoinsTotal||0) + whole;
    if(!document.getElementById('screen-game').classList.contains('hide')) floatText('+'+whole+'🍺', '#e8b23a');
    save();
  }
  const liveTotal = (S.beerCoinsTotal||0) + (S.coinAccum||0);
  const lifeEl = document.getElementById('brewLifetime');
  if(lifeEl) lifeEl.textContent = liveTotal.toFixed(1);
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
  // clear character theme when leaving the game
  if(screen==='boot' || screen==='char') document.body.setAttribute('data-char','');
  ['boot','char','game','squad','log','bag','shop'].forEach(s=>{
    document.getElementById('screen-'+s).classList.toggle('hide', s!==screen);
  });
  const nav = document.getElementById('nav');
  nav.classList.toggle('hide', screen==='boot' || screen==='char');
  document.getElementById('navGame').classList.toggle('on', screen==='game');
  document.getElementById('navBag').classList.toggle('on', screen==='bag');
  document.getElementById('navSquad').classList.toggle('on', screen==='squad');
  document.getElementById('navLog').classList.toggle('on', screen==='log');
  document.getElementById('navShop').classList.toggle('on', screen==='shop');
  if(screen==='char') buildCharGrid();
  if(screen==='squad'){ renderBackup(); }
  if(screen==='log') renderLog();
  if(screen==='game'){
    if(S.currentTile && !S.resolved) showChallengeInline();
    else hideChallengeInline();
  }
  if(screen==='bag') renderBag();
  if(screen==='shop') renderShop();
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
function tankRankLabel(){
  const pc = S.perfectChugs || 0;
  const ra = S.rageActivations || 0;
  if(pc >= 50 || ra >= 25) return 'THE LEGEND';
  if(pc >= 30 || ra >= 10) return 'THE WARLORD';
  if(pc >= 15 || ra >= 3)  return 'THE BERSERKER';
  if(pc >= 5)              return 'THE FOOTSOLDIER';
  return 'THE DRUNKARD';
}

function computeEpicTitle(){
  if(!S || !S.charId) return '';
  const ch = CHARS.find(c=>c.id===S.charId);
  const parts = [];
  if(S.charId === 'tank'){
    const pc = S.perfectChugs || 0;
    const ra = S.rageActivations || 0;
    let rank;
    if(pc >= 50 || ra >= 25)      rank = 'THE LEGEND';
    else if(pc >= 30 || ra >= 10) rank = 'THE WARLORD';
    else if(pc >= 15 || ra >= 3)  rank = 'THE BERSERKER';
    else if(pc >= 5)              rank = 'THE FOOTSOLDIER';
    else                          rank = 'THE DRUNKARD';
    parts.push((ch ? ch.name : '') + ' — ' + rank);
  } else {
    parts.push((ch ? ch.name : '') + ' ' + (CHAR_TITLE_BASE[S.charId]||''));
  }
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
  // apply per-character body theme
  document.body.setAttribute('data-char', S.charId || '');
  document.getElementById('hudName').textContent = S.name;
  document.getElementById('hudLevel').textContent = 'LV '+S.level;
  const titleEl = document.getElementById('hudTitle');
  if(titleEl){
    const title = computeEpicTitle();
    const wounded = S.charId==='tank' && S.bloodied;
    titleEl.textContent = wounded ? '🩸 WAR WOUNDS · '+title : title;
    titleEl.style.color = wounded ? '#c03028' : '';
  }
  const need = xpNeeded(S.level);
  const cur = S.xp;
  const xpFillEl = document.getElementById('xpFill');
  if(xpFillEl) xpFillEl.style.width = Math.min(100, cur/need*100)+'%';
  // Tank rage: glow the XP bar amber when rage is full
  const xpBarEl = xpFillEl && xpFillEl.parentElement;
  if(xpBarEl){
    const rageFull = S.charId==='tank' && (S.rage||0)>=100;
    xpBarEl.style.boxShadow = rageFull ? '0 0 8px 2px rgba(212,132,26,.7)' : '';
  }
  const xpTxtEl = document.getElementById('xpTxt');
  if(xpTxtEl){
    const rageReady = S.charId==='tank' && (S.rage||0)>=100;
    xpTxtEl.textContent = rageReady ? '🔥 RAGE READY' : cur+' / '+need+' XP';
    xpTxtEl.style.color  = rageReady ? '#d4841a' : '';
  }
  document.getElementById('stDrinks').textContent = S.drinks;
  document.getElementById('stFails').textContent = S.fails;
  document.getElementById('stWins').textContent = S.wins;
  document.getElementById('stSkips').textContent = S.skips;
  document.getElementById('arenaLabel').textContent = (breweryName||'AARHUS') + ' · ' + (S.currentTile?S.currentTile.n:'NO OUTCOME YET');
  tickBreweryProduction();
  const tierNameEl = document.getElementById('brewTierName');
  if(tierNameEl) tierNameEl.textContent = breweryTierFor(S.level).name;
  // show only the right character special panel, hide the other
  const _tankChugEl   = document.getElementById('tankChug');
  const _gamblerDenEl = document.getElementById('gamblerDen');
  if(S.charId==='gambler'){
    if(_tankChugEl)   _tankChugEl.classList.add('hide');
    refreshDen();
  } else if(S.charId==='tank'){
    if(_gamblerDenEl) _gamblerDenEl.classList.add('hide');
    refreshChug();
  } else {
    if(_tankChugEl)   _tankChugEl.classList.add('hide');
    if(_gamblerDenEl) _gamblerDenEl.classList.add('hide');
  }
  const leverBtn = document.getElementById('btnSpin');
  if(leverBtn && S.charId==='gambler'){
    const locked = !!S._pendingWin;
    leverBtn.disabled = locked;
    leverBtn.style.opacity = locked ? '0.35' : '';
    leverBtn.title = locked ? 'Resolve your Den bet first' : '';
  }
  if(leverBtn && S.charId==='tank'){
    const locked = !!S._tankPendingWin;
    leverBtn.disabled = locked;
    leverBtn.style.opacity = locked ? '0.35' : '';
    leverBtn.title = locked ? 'Finish your chug first' : '';
  }
  // debt indicator — red when negative
  const coinsEl = document.getElementById('stCoins');
  if(coinsEl){
    const c = S.coins||0;
    coinsEl.textContent = c < 0 ? c+' IN DEBT' : c;
    coinsEl.style.color = c < 0 ? '#c03028' : '';
  }
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
  // Gambler: offer XP wager before awarding
  if(S.charId === 'gambler'){
    S._pendingWin = { t, xpAmount, isRevenge };
    refreshDen(); // load XP stake into the den
    return;
  }
  // Tank: offer XP wager via chug meter
  if(S.charId === 'tank'){
    S._tankPendingWin = { t, xpAmount, isRevenge };
    S.chugAttemptsLeft = chugGetMaxAttempts(); // fresh wager attempts
    S.chugRoundLeft = chugGetMaxAttempts();      // also reset idle pool (new lever pull)
    S._chugTarget = chugPickTarget();
    refreshChug();
    return;
  }
  // Others: award immediately
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
  const coinsGained = Math.max(5, Math.round(t.xp/2));
  grantCoins(coinsGained);
  addLog(`✓ ${t.n} — +${g} XP, +${coinsGained}🪙`);
  toast('+'+g+' XP · +'+coinsGained+'🪙');
  save(); syncHUD(); checkAchievements();
  if(t.t===T.BOSS) S.shopPending = true;
  maybeOpenShop();
}

/* ---------- Gambler XP Wheel ---------- */
/* ══════════════════════════════════════════════════════════════
   THE DEN — Gambler's permanent gambling widget
   ══════════════════════════════════════════════════════════════ */

// Games available in the den
// maxSpins = coin-gamble spins allowed per challenge session
const DEN_GAMES = {
  wheel: {
    id:'wheel', icon:'🎡', name:'WHEEL', maxSpins:3,
    segs:[
      { label:'LOSE',    mult:0, c:'#6a1008', textCol:'#f5c0b0', pct:0.40 },
      { label:'WIN',     mult:2, c:'#c8a010', textCol:'#0e0806', pct:0.30 },
      { label:'NOTHING', mult:1, c:'#2a1a08', textCol:'#8a6a44', pct:0.30 },
    ]
  },
  dice: {
    id:'dice', icon:'🎲', name:'DICE', maxSpins:2, relic:'loadeddice',
    segs:[
      { label:'LOSE',    mult:0, c:'#6a1008', textCol:'#f5c0b0', pct:0.35 },
      { label:'NOTHING', mult:1, c:'#2a1a08', textCol:'#8a6a44', pct:0.25 },
      { label:'WIN x2',  mult:2, c:'#5a3a10', textCol:'#d4a820', pct:0.25 },
      { label:'HIGH x3', mult:3, c:'#c8a010', textCol:'#0e0806', pct:0.15 },
    ]
  },
  cards: {
    id:'cards', icon:'🃏', name:'CARDS', maxSpins:2, relic:'tarotdeck',
    // 50/50 — pure win or lose, no nothing
    segs:[
      { label:'LOSE',  mult:0, c:'#6a1008', textCol:'#f5c0b0', pct:0.50 },
      { label:'WIN x2',mult:2, c:'#c8a010', textCol:'#0e0806', pct:0.50 },
    ]
  },
  horseshoe: {
    id:'horseshoe', icon:'🧲', name:'HORSESHOE', maxSpins:1, relic:'horseshoe',
    // 60/40 — best odds, one golden shot per challenge
    segs:[
      { label:'LOSE',  mult:0, c:'#6a1008', textCol:'#f5c0b0', pct:0.40 },
      { label:'WIN x2',mult:2, c:'#c8a010', textCol:'#0e0806', pct:0.60 },
    ]
  }
};

/* ══════════════════════════════════════════════════════
   TANK — CHUG TIMER  (phone-to-friend mechanic)
   Show target seconds → hand phone to friend → START
   → chug blind → STOP → score by how close you were
   ══════════════════════════════════════════════════════ */

// Tolerance windows per mode (seconds off target for each tier)
// Tolerances: perfect = tight window for bonus XP, ok = 1.8s window for base XP
// No middle "clean" tier — just nail it or settle for ok.
const CHUG_MODES = {
  basic:  { id:'basic',  name:'BASIC CHUG',  attempts:1, minT:3, maxT:9,  perfect:0.3,  ok:0.9, perfectBonus:false },
  iron:   { id:'iron',   name:'IRON CHUG',   attempts:2, minT:4, maxT:11, perfect:0.45, ok:1.1, perfectBonus:false, relic:'ironthroat' },
  horn:   { id:'horn',   name:'HORN CHUG',   attempts:3, minT:5, maxT:13, perfect:0.6,  ok:1.4, perfectBonus:true,  relic:'vikinghorn' },
  legend: { id:'legend', name:'LEGEND MODE', attempts:4, minT:6, maxT:15, perfect:0.75, ok:1.7, perfectBonus:true,  relic:'meadaltar', tripleXP:true },
};

// Pick a target — range depends on current chug mode
function chugPickTarget(){
  const m = chugGetMode();
  const min = m.minT || 3, max = m.maxT || 9;
  return min + Math.floor(Math.random() * (max - min + 1));
}

function chugGetMode(){
  if(S.relics && S.relics.includes('meadaltar'))  return CHUG_MODES.legend;
  if(S.relics && S.relics.includes('vikinghorn')) return CHUG_MODES.horn;
  if(S.relics && S.relics.includes('ironthroat')) return CHUG_MODES.iron;
  return CHUG_MODES.basic;
}
function chugGetMaxAttempts(){ return chugGetMode().attempts; }
function chugResetAttempts(){
  S.chugAttemptsLeft = chugGetMaxAttempts();
  S.chugRoundLeft = chugGetMaxAttempts(); // total chugs allowed this round
  S._chugTarget = chugPickTarget(); // fresh target
  S.chugMisses = 0;     // reset consecutive miss streak (bloodied persists until healed by a perfect)
  save();
}

let _chugActive = false, _chugStartMs = 0, _chugPhase = 'ready'; // 'ready'|'going'|'result'

function refreshChug(){
  if(S.charId !== 'tank') return;
  const el = document.getElementById('tankChug');
  if(el) el.classList.remove('hide');
  const mode = chugGetMode();
  const hasPending = !!S._tankPendingWin;

  // Ensure a target is set
  if(!S._chugTarget) S._chugTarget = chugPickTarget();
  const target = S._chugTarget;

  // Mode label
  const modeLbl = document.getElementById('chugModeLbl');
  if(modeLbl) modeLbl.textContent = hasPending ? 'XP WAGER · '+mode.name : mode.name;

  // XP at stake row
  const xpRow = document.getElementById('chugXPRow');
  const xpAmt = document.getElementById('chugXPAmt');
  if(xpRow) xpRow.classList.toggle('hide', !hasPending);
  if(xpAmt && hasPending) xpAmt.textContent = S._tankPendingWin.xpAmount;

  // Target display — only show once revealed (after previous chug ends)
  const targetEl = document.getElementById('chugTarget');
  if(targetEl) targetEl.textContent = target ? target + 's' : '—';

  // Tolerance hint
  const tolerEl = document.getElementById('chugToler');
  if(tolerEl) tolerEl.textContent = '±'+mode.perfect+'s PERFECT · ±'+mode.ok+'s OK · MISS = 0 XP';

  // Safe button
  const safeBtn = document.getElementById('chugSafeBtn');
  const safeRow = document.getElementById('chugSafeRow');
  if(safeBtn){ hasPending ? safeBtn.classList.remove('hide') : safeBtn.classList.add('hide'); }
  if(safeRow){ safeRow.style.display = hasPending ? 'flex' : 'none'; }

  // Attempts counter — only relevant during a pending XP wager
  const left = S.chugAttemptsLeft ?? chugGetMaxAttempts();
  const leftEl = document.getElementById('chugLeft');
  const roundLeftDisp = S.chugRoundLeft ?? chugGetMaxAttempts();
  const wagerLeftDisp = S.chugAttemptsLeft ?? chugGetMaxAttempts();
  if(leftEl) leftEl.textContent = hasPending ? wagerLeftDisp : roundLeftDisp;
  const attRow = document.getElementById('chugAttemptsRow');
  // Always show attempts row so player knows how many chugs they have left
  if(attRow) attRow.style.display = 'flex';

  // Main button — wager uses chugAttemptsLeft; idle uses chugRoundLeft
  const btn = document.getElementById('chugBtn');
  const roundLeft = S.chugRoundLeft ?? chugGetMaxAttempts();
  const wagerLeft = S.chugAttemptsLeft ?? chugGetMaxAttempts();
  const noAttempts = hasPending ? wagerLeft <= 0 : roundLeft <= 0;
  if(btn){
    if(_chugPhase === 'going'){
      // Always allow stopping an active chug — check this BEFORE noAttempts
      btn.textContent = '🛑 STOP';
      btn.disabled = false;
      btn.style.opacity = '';
      btn.onclick = chugStop;
    } else if(noAttempts){
      btn.textContent = '💤 NO ATTEMPTS LEFT';
      btn.disabled = true;
      btn.style.opacity = '0.4';
      btn.onclick = null;
    } else {
      btn.textContent = '🍺 START CHUGGING';
      btn.disabled = false;
      btn.style.opacity = '';
      btn.onclick = chugGo;
    }
  }

  // Rank stats
  const rankStatEl = document.getElementById('chugRankStats');
  if(rankStatEl) rankStatEl.textContent = '⚡ '+(S.perfectChugs||0)+' perfects · 🔥 '+(S.rageActivations||0)+' rage activations';

  // Rage meter + bloodied
  const rageBar = document.getElementById('chugRageFill');
  const ragePct = document.getElementById('chugRagePct');
  const bloodiedBadge = document.getElementById('chugBloodied');
  const rage = S.rage || 0;
  if(rageBar){
    rageBar.style.width = rage + '%';
    const full = rage >= 100;
    rageBar.style.boxShadow = full ? '0 0 12px #d4841a, 0 0 4px #ff9a30' : '';
    rageBar.style.animation  = full ? 'rageFlare 0.6s ease-in-out infinite' : '';
  }
  if(ragePct) ragePct.textContent = rage >= 100 ? '🔥 FULL' : rage + '%';
  if(bloodiedBadge) bloodiedBadge.style.display = S.bloodied ? 'block' : 'none';

  // Upgrade buttons
  const upEl = document.getElementById('chugUpgrades');
  if(upEl){
    upEl.innerHTML = Object.values(CHUG_MODES).filter(m=>m.relic).map(m=>{
      const locked = !(S.relics && S.relics.includes(m.relic));
      const active = m.id === mode.id;
      return `<button class="btn ${active?'gold':'ghost'} sm" style="font-size:8px;${locked?'opacity:.45':''}">
        ${active?'⚡':''} ${m.name}${locked?' 🔒':''}
      </button>`;
    }).join('');
  }
}

function chugGo(){
  if(_chugPhase === 'going') return;
  const hasPending = !!S._tankPendingWin;
  if(hasPending){
    const left = S.chugAttemptsLeft ?? chugGetMaxAttempts();
    if(left <= 0){ toast('NO WAGER ATTEMPTS LEFT — TAKE SAFE XP'); return; }
    S.chugAttemptsLeft = Math.max(0, left - 1); // use one wager attempt
  } else {
    const left = S.chugRoundLeft ?? chugGetMaxAttempts();
    if(left <= 0){ toast('NO CHUGS LEFT THIS ROUND'); return; }
    S.chugRoundLeft = Math.max(0, left - 1); // use one idle attempt
  }
  if(!S._chugTarget) S._chugTarget = chugPickTarget(); // fallback: pick if somehow missing
  _chugPhase = 'going';
  _chugActive = true;
  _chugStartMs = Date.now();

  // Keep target visible during chug so player knows what to aim for
  const targetEl = document.getElementById('chugTarget');
  if(targetEl && S._chugTarget) targetEl.textContent = S._chugTarget + 's';
  const res = document.getElementById('chugResult');
  if(res) res.innerHTML = '<span style="color:#8ad4ff;font-size:18px;letter-spacing:2px;animation:chugPulse 0.7s ease-in-out infinite">🍺 CHUGGING…</span>';

  // Update button to STOP
  const btn = document.getElementById('chugBtn');
  if(btn){ btn.textContent = '🛑 STOP'; btn.onclick = chugStop; }
}

// Alias for HTML ontouchstart/onmousedown (old API kept for safety)
function chugStart(e){ if(e && e.cancelable) e.preventDefault(); }
function chugRelease(e){ if(e && e.cancelable) e.preventDefault(); }

function chugStop(){
  if(_chugPhase !== 'going') return;
  _chugPhase = 'result';
  _chugActive = false;
  const elapsed = (Date.now() - _chugStartMs) / 1000;
  chugResolve(elapsed);
}

function chugResolve(elapsed){
  const mode = chugGetMode();
  const target = S._chugTarget || 5;
  const diff = Math.abs(elapsed - target);
  const hasPending = !!S._tankPendingWin;

  let mult, label, color;
  if(diff <= mode.perfect){
    mult = mode.tripleXP ? 3 : 2.5;
    label = mode.tripleXP ? '🏆 LEGENDARY CHUG!' : '⚡ PERFECT!';
    color = '#d4841a';
    S.rage = Math.min(100, (S.rage||0) + 30);
    S.chugMisses = 0;
    S.bloodied = false;
    const _oldRank = tankRankLabel();
    S.perfectChugs = (S.perfectChugs||0) + 1;
    const _newRank = tankRankLabel();
    if(_newRank !== _oldRank){ floatText('⚔ '+_newRank, '#d4841a'); toast('⚔ RANK UP: '+_newRank+'!'); }
    if(S.rage >= 100) floatText('🔥 RAGE FULL!', '#d4841a');
  } else if(diff <= mode.ok){
    mult = 1;
    label = '— COUNTS. BARELY.';
    color = '#8a7060';
    S.rage = Math.max(0, (S.rage||0) - 5);
  } else {
    mult = 0;
    label = elapsed < target ? '💧 TOO FAST — KEEP DRINKING' : '💧 SPILLED — TOO LONG';
    color = '#c03028';
    S.rage = Math.max(0, (S.rage||0) - 20);
    // bloodied only accumulates during real XP wager chugs, not idle practice
    if(hasPending){
      S.chugMisses = (S.chugMisses||0) + 1;
      if(S.chugMisses >= 3 && !S.bloodied){
        S.bloodied = true;
        floatText('🩸 WAR WOUNDS!', '#c03028');
        toast('🩸 WAR WOUNDS — 3 misses in a row! -30% XP until a perfect chug');
      }
    }
  }

  const res = document.getElementById('chugResult');
  const sign = elapsed >= target ? '+' : '-';
  const offStr = sign + diff.toFixed(1) + 's off target';
  if(res) res.innerHTML =
    `<div style="color:${color};font-size:13px;font-weight:bold;letter-spacing:1px">${label}</div>` +
    `<div style="color:#6a8aaa;font-size:9px;margin-top:3px">${elapsed.toFixed(1)}s · target ${target}s · ${offStr}</div>`;

  // Restore target display
  const targetEl = document.getElementById('chugTarget');
  if(targetEl) targetEl.textContent = target + 's';

  // Reset button for next chug / show result
  const btn = document.getElementById('chugBtn');
  if(btn){ btn.textContent = '🍺 START CHUGGING'; btn.onclick = chugGo; }

  setTimeout(()=>{
    _chugPhase = 'ready';
    if(hasPending){
      _chugFinishApplyWin(mult);
    } else {
      S._chugTarget = chugPickTarget(); // fresh target for next idle chug
      if(mult >= 2){
        const bonus = mult >= 2.5 ? 15 : 10;
        grantCoins(bonus);
        addLog('🍺 CHUG: '+label+' +'+bonus+'🪙');
        toast(label+' +'+bonus+'🪙');
        floatText('+'+bonus+'🪙', '#ffd24a');
      } else if(mult === 1){
        grantCoins(3);
        addLog('🍺 CHUG: '+label+' +3🪙');
        toast(label);
      } else {
        addLog('💧 CHUG: '+label);
        toast(label);
      }
      save(); syncHUD();
      setTimeout(()=>{ if(!S._tankPendingWin){ const r=document.getElementById('chugResult'); if(r) r.textContent=''; refreshChug(); } }, 2500);
    }
  }, 800);
}

function chugTakeSafe(){
  if(!S._tankPendingWin) return;
  _chugFinishApplyWin(1, true); // isSafe — rage not consumed, held for next challenge
}

function _chugFinishApplyWin(xpMult, isSafe){
  const pw = S._tankPendingWin;
  if(!pw){ save(); syncHUD(); return; }
  S._tankPendingWin = null;
  const { t, xpAmount, isRevenge } = pw;
  let g = 0;
  if(xpMult > 0){
    // Rage payout only fires when you actually chug (not safe take) — you must earn it
    if(!isSafe && (S.rage||0) >= 100){
      const _oldRk = tankRankLabel();
      xpMult *= 3;
      S.rage = 0;
      S.rageActivations = (S.rageActivations||0) + 1;
      const _newRk = tankRankLabel();
      floatText('🔥 BERSERKER RAGE!', '#d4841a');
      toast('🔥 BERSERKER RAGE — 3× XP BONUS!');
      if(_newRk !== _oldRk){ setTimeout(()=>{ floatText('⚔ '+_newRk, '#d4841a'); toast('⚔ RANK UP: '+_newRk+'!'); }, 1200); }
    } else if(isSafe && (S.rage||0) >= 100){
      toast('🔥 RAGE HELD — land a real chug to unleash it');
    }
    if(S.bloodied){
      xpMult *= 0.7;
      floatText('🩸 WAR WOUNDS', '#c03028');
    }
    g = grantXP(Math.round(xpAmount * xpMult), t.n);
    if(xpMult >= 3)      { addLog('🏆 LEGENDARY — '+t.n+' ×'+xpMult+' = +'+g+' XP'); toast('🏆 LEGENDARY! +'+g+' XP'); floatText('LEGENDARY', '#ffd24a'); }
    else if(xpMult >= 2) { addLog('⚡ PERFECT CHUG — '+t.n+' ×'+xpMult+' = +'+g+' XP'); toast('⚡ ×'+xpMult+'! +'+g+' XP'); }
    else if(xpMult > 1)  { addLog('✅ CHUG — '+t.n+' ×'+xpMult+' = +'+g+' XP'); toast('✅ +'+g+' XP'); }
    else                 { addLog('✓ '+t.n+' — +'+g+' XP (safe)'); toast('+'+g+' XP'); }
    if(isRevenge){ addLog('⚔ REVENGE served via chug.'); toast('⚔ REVENGE SERVED!'); }
  } else {
    floatText('SPILLED', '#5a9aff');
    addLog('💧 '+t.n+' — spilled the chug. No XP lost.');
    toast('💧 SPILLED — but forfeit is skipped. Drink your beer.');
  }
  if(t.drink){ S.drinks++; addPace(t.t===T.SHOT?16:12); }
  if(t.heal) { S.waters++; addPace(-t.heal); }
  S.badLuckHeat = Math.max(0, (S.badLuckHeat||0)-1);
  grantSouvenir(t.t);
  const coinsGained = Math.max(5, Math.round(t.xp/2));
  grantCoins(coinsGained);
  chugResetAttempts();
  save(); syncHUD(); checkAchievements();
  refreshChug();
  if(t.t===T.BOSS) S.shopPending = true;
  maybeOpenShop();
}

function denGetMaxSpins(){
  // return spin allowance for the currently selected game
  return DEN_GAMES[_denGame].maxSpins;
}
function denResetSpins(){
  S.denSpinsLeft = denGetMaxSpins();
  save();
}

let _denGame = 'wheel';
let _denBet  = 10;
let _denSpinning = false;

function denIsUnlocked(gameId){
  const g = DEN_GAMES[gameId];
  return !g.relic || (S.relics && S.relics.includes(g.relic));
}

function denSetGame(id){
  if(!denIsUnlocked(id)){ toast('🔒 BUY IT IN THE SHOP FIRST'); return; }
  _denGame = id;
  // Reset spins for the new game (idle mode only; during a wager keep current session)
  if(!S._pendingWin){ S.denSpinsLeft = denGetMaxSpins(); save(); }
  refreshDen();
}

function denAdjustBet(delta){
  const coins = S.coins||0;
  const maxBet = coins > 0 ? coins : 0;
  _denBet = Math.max(1, Math.min(maxBet, _denBet + delta));
  const el = document.getElementById('denBetAmt');
  if(el) el.textContent = _denBet;
}

function refreshDen(){
  if(S.charId !== 'gambler') return;
  const den = document.getElementById('gamblerDen');
  if(den) den.classList.remove('hide');

  const hasPending = !!S._pendingWin;
  const game = DEN_GAMES[_denGame];

  // mode label
  const modeLbl = document.getElementById('denModeLbl');
  const spinsLeft = S.denSpinsLeft ?? denGetMaxSpins();
  const maxSpins  = denGetMaxSpins();
  if(modeLbl) modeLbl.textContent = hasPending
    ? 'XP WAGER'
    : 'COIN GAMBLE · '+spinsLeft+'/'+maxSpins+' SPINS';

  // XP row vs coin row
  const xpRow   = document.getElementById('denXPRow');
  const coinRow  = document.getElementById('denCoinRow');
  const safeBtn  = document.getElementById('denSafeBtn');
  const spinBtn  = document.getElementById('denSpinBtn');
  if(xpRow && coinRow){
    if(hasPending){
      xpRow.classList.remove('hide'); coinRow.classList.add('hide');
      const xpAmt = document.getElementById('denXPAmt');
      if(xpAmt) xpAmt.textContent = S._pendingWin.xpAmount;
      if(safeBtn) safeBtn.classList.remove('hide');
      const safeRow = document.getElementById('denSafeRow');
      if(safeRow) safeRow.style.display = 'flex';
      const inDebt = (S.coins||0) < 0;
      if(spinBtn){
        spinBtn.textContent = inDebt ? '🚫 IN DEBT — NO GAMBLING' : game.icon+' SPIN FOR XP';
        spinBtn.disabled = inDebt;
        spinBtn.style.opacity = inDebt ? '0.4' : '';
      }
    } else {
      xpRow.classList.add('hide'); coinRow.classList.remove('hide');
      if(safeBtn) safeBtn.classList.add('hide');
      const safeRow2 = document.getElementById('denSafeRow');
      if(safeRow2) safeRow2.style.display = 'none';
      const coins = S.coins||0;
      // always clamp bet to what the player actually has
      _denBet = Math.max(1, Math.min(_denBet, Math.max(1, coins)));
      const noSpins = (S.denSpinsLeft ?? denGetMaxSpins()) <= 0;
      const inDebt  = coins < 0;
      const broke   = coins === 0;
      if(spinBtn){
        if(inDebt)  spinBtn.textContent = '🚫 IN DEBT — NO GAMBLING';
        else if(broke) spinBtn.textContent = '🪙 NO COINS TO BET';
        else        spinBtn.textContent = game.icon+' SPIN ('+_denBet+'🪙)';
        spinBtn.disabled = noSpins || inDebt || broke;
        spinBtn.style.opacity = (noSpins || inDebt || broke) ? '0.4' : '';
      }
      // clamp bet to current coins
      const betEl = document.getElementById('denBetAmt');
      if(betEl) betEl.textContent = _denBet;
    }
  }
  // clear result when refreshing to new state
  if(!_denSpinning){
    const res = document.getElementById('denResult');
    if(res && !hasPending) res.textContent = '';
  }

  // game switcher
  const gamesEl = document.getElementById('denGames');
  if(gamesEl){
    gamesEl.innerHTML = Object.values(DEN_GAMES).map(g => {
      const locked = !denIsUnlocked(g.id);
      const active = g.id === _denGame;
      return `<button class="btn ${active?'gold':'ghost'} sm"
        onclick="denSetGame('${g.id}')"
        style="font-size:8px;${locked?'opacity:.45':''}">
        ${ico(g.icon,13)} ${g.name}${locked?' 🔒':''}
      </button>`;
    }).join('');
  }

  // draw idle wheel
  if(!_denSpinning) denPaintWheel(_denGame, 0);
}

function denPaintWheel(gameId, rotation){
  const c = document.getElementById('denCanvas'); if(!c) return;
  const ctx = c.getContext('2d');
  const segs = DEN_GAMES[gameId].segs;
  const R=86, cx=90, cy=90;
  ctx.clearRect(0,0,180,180);
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(rotation - Math.PI/2);
  let start = 0;
  segs.forEach(seg=>{
    const sweep = seg.pct * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,R,start,start+sweep); ctx.closePath();
    ctx.fillStyle = seg.c; ctx.fill();
    ctx.strokeStyle = '#c8980a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save();
    ctx.rotate(start + sweep/2);
    ctx.fillStyle = seg.textCol;
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(seg.label, R-6, 0);
    ctx.restore();
    start += sweep;
  });
  ctx.restore();
  // hub
  ctx.beginPath(); ctx.arc(cx,cy,15,0,Math.PI*2);
  ctx.fillStyle='#0e0806'; ctx.fill();
  ctx.strokeStyle='#c8980a'; ctx.lineWidth=2; ctx.stroke();
  const game = DEN_GAMES[gameId];
  ctx.font='11px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(game.icon,cx,cy);
}

function denSpin(){
  if(_denSpinning) return;
  const game = DEN_GAMES[_denGame];
  const hasPending = !!S._pendingWin;
  // block if broke or in debt (coin gambling only — XP wager is separate)
  if(!hasPending){
    if((S.coins||0) < 0){
      toast('YOU\'RE IN DEBT — EARN COINS BEFORE GAMBLING');
      return;
    }
    if((S.coins||0) === 0){
      toast('NO COINS — WIN A CHALLENGE TO EARN SOME');
      return;
    }
  } else {
    // XP wager: block only if in debt
    if((S.coins||0) < 0){
      toast('YOU\'RE IN DEBT — EARN COINS BEFORE GAMBLING');
      return;
    }
  }
  if(!hasPending){
    // enforce spin cap for coin gambling
    if((S.denSpinsLeft||0) <= 0){
      toast('NO SPINS LEFT — COMPLETE A CHALLENGE TO REFRESH');
      return;
    }
    S.denSpinsLeft = (S.denSpinsLeft||1) - 1;
    // coin mode: deduct bet upfront (debt allowed)
    S.coins = (S.coins||0) - _denBet;
    save(); syncHUD();
  }
  _denSpinning = true;
  const spinBtn = document.getElementById('denSpinBtn');
  const safeBtn = document.getElementById('denSafeBtn');
  if(spinBtn){ spinBtn.disabled=true; spinBtn.textContent='SPINNING…'; }
  if(safeBtn) safeBtn.classList.add('hide');

  // pick outcome
  const r = Math.random();
  let targetIdx = game.segs.length-1, cum = 0;
  for(let i=0;i<game.segs.length;i++){
    cum += game.segs[i].pct;
    if(r < cum){ targetIdx = i; break; }
  }

  // compute final rotation
  let cumAng = 0;
  const mids = game.segs.map(seg=>{
    const mid = cumAng + seg.pct * Math.PI;
    cumAng += seg.pct * Math.PI * 2;
    return mid;
  });
  const jitter = (Math.random()-0.5)*0.5*game.segs[targetIdx].pct*Math.PI*2;
  const landAt  = mids[targetIdx] + jitter;
  const finalRot = (5 + Math.random()*3)*Math.PI*2 - landAt;

  const dur = 3500, t0 = Date.now();
  (function anim(){
    const p = Math.min(1,(Date.now()-t0)/dur);
    const e = 1 - Math.pow(1-p,4);
    denPaintWheel(_denGame, finalRot*e);
    if(p < 1){ requestAnimationFrame(anim); return; }
    _denSpinning = false;
    const seg = game.segs[targetIdx];
    const res = document.getElementById('denResult');
    if(res){
      if(seg.mult===0)        res.innerHTML = '<span style="color:#c03028">💀 BUST</span>';
      else if(seg.mult>=3)  res.innerHTML = '<span style="color:#d4a820">🏆 WIN \xd7'+seg.mult+'</span>';
      else if(seg.mult===1) res.innerHTML = '<span style="color:#8a6a44">\u2014 NOTHING</span>';
      else                  res.innerHTML = '<span style="color:#a0e060">✅ WIN \xd7'+seg.mult+'</span>';
    }
    if(hasPending){
      _finishApplyWin(seg.mult);
    } else {
      // coin mode — bet already deducted upfront
      if(seg.mult === 0){
        // LOSE — bet is gone, show debt if negative
        addLog('💀 DEN '+game.name+': lost '+_denBet+'🪙. Balance: '+(S.coins||0));
        toast('💀 LOST '+_denBet+'🪙'+(S.coins<0?' — IN DEBT 🟥':''));
        floatText('-'+_denBet, '#c03028');
      } else if(seg.mult === 1){
        // NOTHING — push, return bet
        S.coins = (S.coins||0) + _denBet;
        addLog('— DEN '+game.name+': nothing. Bet returned.');
        toast('NOTHING HAPPENS');
      } else {
        // WIN — return bet + profit
        const won = Math.round(_denBet * seg.mult);
        S.coins = (S.coins||0) + won;
        const net = won - _denBet;
        addLog('✅ DEN '+game.name+': bet '+_denBet+'🪙, won '+won+'🪙 (net +'+net+')');
        toast('+'+net+' 🪙 NET WIN');
        floatText('+'+net, '#d4a820');
      }
      save(); syncHUD();
      // re-enable spin button after short delay
      setTimeout(()=>{
        if(spinBtn){ spinBtn.disabled=false; spinBtn.textContent=game.icon+' SPIN ('+_denBet+'🪙)'; }
        const res2 = document.getElementById('denResult');
        if(res2) res2.textContent='';
      }, 2200);
    }
  })();
}

function denTakeSafe(){
  if(!S._pendingWin) return;
  _finishApplyWin(1);
}

function _finishApplyWin(xpMult){
  const pw = S._pendingWin;
  if(!pw){ save(); syncHUD(); return; }
  S._pendingWin = null;
  const { t, xpAmount, isRevenge } = pw;
  let g = 0;
  if(xpMult > 0){
    g = grantXP(Math.round(xpAmount * xpMult), t.n);
    if(isRevenge){
      addLog('⚔ REVENGE — beat '+t.n+' after it beat you. \xd7'+xpMult+' gamble = +'+g+' XP.');
      toast('⚔ REVENGE SERVED. '+t.n+' AVENGED.');
    } else if(xpMult >= 3){
      addLog('🏆 JACKPOT — '+t.n+' \xd7'+xpMult+' = +'+g+' XP');
      toast('🏆 JACKPOT! +'+g+' XP');
    } else if(xpMult > 1){
      addLog('🎲 WIN — '+t.n+' \xd7'+xpMult+' = +'+g+' XP');
      toast('🎲 \xd7'+xpMult+'! +'+g+' XP');
    } else {
      addLog('✓ '+t.n+' — +'+g+' XP (safe)');
      toast('+'+g+' XP · SAFE');
    }
  } else {
    floatText('BUST', '#c03028');
    addLog('💀 '+t.n+' — gambled and lost everything. 0 XP.');
    toast('💀 BUST. THE HOUSE WINS.');
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
  const coinsGained = Math.max(5, Math.round(t.xp/2));
  grantCoins(coinsGained);
  denResetSpins();
  // Nudge bet to at least 10% of current coins after challenge resolves
  // so a broke player who just won coins isn't stuck betting 1 forever
  const _coinsNow = S.coins || 0;
  if(_coinsNow > 0) _denBet = Math.max(_denBet, Math.min(Math.round(_coinsNow * 0.1), _coinsNow));
  _denBet = Math.max(1, Math.min(_denBet, Math.max(1, _coinsNow)));
  save(); syncHUD(); checkAchievements();
  refreshDen();
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
  if(S._pendingWin){
    toast('⚔ SETTLE YOUR BET FIRST — SPIN THE DEN OR TAKE SAFE XP');
    const den = document.getElementById('gamblerDen');
    if(den) den.scrollIntoView({ behavior:'smooth', block:'center' });
    return;
  }
  if(S._tankPendingWin){
    toast('🍺 FINISH YOUR CHUG FIRST');
    const tc = document.getElementById('tankChug');
    if(tc) tc.scrollIntoView({ behavior:'smooth', block:'center' });
    const den = document.getElementById('gamblerDen');
    if(den) den.scrollIntoView({ behavior:'smooth', block:'center' });
    return;
  }
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
    grantXP(25,'lap'); grantCoins(30);
    toast('🏁 LAP BONUS — +30🪙');
    toast('ANOTHER LAP OF AARHUS — SQUAD TOAST!'); addLog('Another lap of Aarhus — squad toast');
  }
  save();
  showChallengeInline();
}

/* ---------- tile cards ---------- */
function reopenTile(){ toggleChallengeExpand(); }

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
      `+${Math.max(5, Math.round(t.xp/2))}🪙`,
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
  hideChallengeInline(); closeCard();
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
/* ---------- inline challenge card ---------- */
function showChallengeInline(){
  const t = S.currentTile; if(!t) return;
  const slotWrap = document.getElementById('slotWrap');
  const btnSpin  = document.getElementById('btnSpin');
  const card     = document.getElementById('challengeInline');
  if(slotWrap) slotWrap.classList.add('hide');
  if(btnSpin)  btnSpin.classList.add('hide');

  document.getElementById('ciIcon').textContent = t.icon + ' ';
  document.getElementById('ciName').textContent = t.n;
  document.getElementById('ciBody').innerHTML   = escapeHtml(t.body).replace(/\n/g,'<br>');

  const canAutoWin = !S.resolved && S.autoWinNext && t.t!==T.MERCY && t.t!==T.MOVE && t.t!==T.BADLUCK;
  let btns = '';
  if(S.resolved){
    btns = `<button class="btn ghost" onclick="hideChallengeInline()">◀ ALREADY RESOLVED</button>`;
  } else if(canAutoWin){
    btns = `<button class="btn purple" onclick="useAutoWin()">🪪 AUTO-WIN WITH FAKE ID</button>`;
  } else if(t.t===T.MERCY || t.t===T.MOVE || t.t===T.BADLUCK){
    btns = `<button class="btn green" onclick="resolveTile(true)">✓ DONE</button>`;
  } else if(t.gamble){
    btns = `<button class="btn green" onclick="resolveTile(true)">🏆 WON IT</button>
            <button class="btn red" onclick="resolveTile(false)">💀 LOST — FORFEIT</button>`;
  } else {
    btns = `<button class="btn green" onclick="resolveTile(true)">✓ DONE</button>
            <button class="btn red" onclick="resolveTile(false)">✗ FAILED</button>
            <button class="btn ghost sm" onclick="resolveTile(false)">🐔 CHICKENED OUT</button>`;
  }
  document.getElementById('ciButtons').innerHTML = btns;

  // auto-expand if already resolved (read-only reopen)
  const exp = document.getElementById('ciExpanded');
  if(S.resolved) exp.classList.remove('hide');
  else           exp.classList.add('hide');

  const hint = document.getElementById('ciTapHint');
  if(hint) hint.textContent = S.resolved ? '(RESOLVED)' : 'TAP TO RESOLVE ▼';

  if(card) card.classList.remove('hide');
}
function hideChallengeInline(){
  const slotWrap = document.getElementById('slotWrap');
  const btnSpin  = document.getElementById('btnSpin');
  const card     = document.getElementById('challengeInline');
  if(slotWrap) slotWrap.classList.remove('hide');
  if(btnSpin)  btnSpin.classList.remove('hide');
  if(card)     card.classList.add('hide');
  const exp = document.getElementById('ciExpanded');
  if(exp) exp.classList.add('hide');
}
function toggleChallengeExpand(){
  if(S.resolved) return; // already-resolved card auto-expands, no toggle
  const exp = document.getElementById('ciExpanded');
  if(!exp) return;
  exp.classList.toggle('hide');
  const hint = document.getElementById('ciTapHint');
  if(hint) hint.textContent = exp.classList.contains('hide') ? 'TAP TO RESOLVE ▼' : 'TAP TO COLLAPSE ▲';
}

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
function openShop(){ go('shop'); }

function renderShop(){
  const ch = CHARS.find(c=>c.id===S.charId);
  const charName = ch ? ch.name : '';
  const shopThemes = {
    gambler:{ tag:'THE DEN — BACK ROOM',  title:'THE BLACK MARKET', tagline:'Everything here has a price. Some things have two.' },
    tank:   { tag:'THE LONGHOUSE — FORGE', title:'THE ARMORY',       tagline:'You break things. We sell you better things to break them with.' },
  };
  const theme = shopThemes[S.charId] || { tag:'PIT STOP', title:'THE SHOP', tagline:'Spend it or lose it.' };

  function itemCard(r, type, isExclusive){
    const owned   = type==='relic' ? S.relics.includes(r.id) : false;
    const qty     = type==='item'  ? (S.items[r.id]||0) : 0;
    const afford  = S.coins >= r.price;
    const nameCol = type==='relic' ? 'gold' : 'cyan';
    let actionHtml;
    if(type==='relic' && owned){
      actionHtml = `<span style="font-size:8px;letter-spacing:1px;color:#5a8a5a">✓ OWNED</span>`;
    } else if(type==='item' && qty > 0){
      actionHtml = `<span style="font-size:8px;letter-spacing:1px;color:#5a8a80">×${qty} IN BAG</span>
        <button class="btn cyan sm" style="width:auto;margin:0;padding:6px 10px" onclick="buyConsumable('${r.id}')" ${afford?'':'disabled'}>${r.price} <span style="opacity:0.6;font-size:7px">COINS</span></button>`;
    } else {
      const fn  = type==='relic' ? `buyRelic('${r.id}')` : `buyConsumable('${r.id}')`;
      const cls = type==='relic' ? 'purple' : 'cyan';
      const xpBtn = S.haggleActive ? ` <button class="btn blue sm" style="width:auto;margin:0;padding:6px 10px;margin-left:4px" onclick="buyWithXP('${type==='relic'?'relic':'item'}','${r.id}')">${r.price} <span style="opacity:0.6;font-size:7px">XP</span></button>` : '';
      actionHtml = `<button class="btn ${cls} sm" style="width:auto;margin:0;padding:6px 10px" onclick="${fn}" ${afford?'':'disabled'}>${r.price} <span style="opacity:0.6;font-size:7px">COINS</span></button>${xpBtn}`;
    }
    return `<div class="shop-item${owned?' shop-item--owned':''}${isExclusive?' shop-item--exclusive':''}">
      <div class="shop-item__icon">${ico(r.icon, 40, type==='relic'?'#c8a030':'#4fb3a3')}</div>
      <div class="shop-item__body">
        <div class="shop-item__name ${nameCol}">${r.n}</div>
        <div class="shop-item__desc">${r.d}</div>
        <div class="shop-item__action">${actionHtml}</div>
      </div>
    </div>`;
  }

  const myRelics  = RELICS.filter(r=> r.char===S.charId);
  const genRelics = RELICS.filter(r=>!r.char);
  const myItems   = CONSUMABLES.filter(c=> c.char===S.charId);
  const genItems  = CONSUMABLES.filter(c=>!c.char);

  const exclusiveSection = (myRelics.length || myItems.length) ? `
    <div class="shop-exclusive-wrap">
      <div class="shop-exclusive-label">${charName} EXCLUSIVE</div>
      ${myRelics.map(r=>itemCard(r,'relic',true)).join('')}
      ${myItems.map(c=>itemCard(c,'item',true)).join('')}
    </div>` : '';

  document.getElementById('shopInner').innerHTML = `
    ${S.haggleActive ? '<div style="text-align:center;padding:6px;background:rgba(100,200,255,.12);border:1px solid rgba(100,200,255,.3);border-radius:4px;margin-bottom:8px;font-size:8px;letter-spacing:1px;color:#8ad4ff">🤝 HAGGLE MODE — one item, pay in XP</div>' : ''}
    <div class="shop-header">
      <div class="shop-header__tag">${theme.tag}</div>
      <div class="shop-header__title">${theme.title}</div>
      <div class="shop-header__tagline">${theme.tagline}</div>
      <div class="shop-header__coins"><span class="shop-coins-num">${S.coins}</span><span class="shop-coins-label">SKÅL COINS</span></div>
    </div>
    ${exclusiveSection}
    <div class="shop-section">
      <div class="shop-section__label">RELICS</div>
      ${genRelics.map(r=>itemCard(r,'relic',false)).join('')}
    </div>
    <div class="shop-section">
      <div class="shop-section__label">ITEMS</div>
      ${genItems.map(c=>itemCard(c,'item',false)).join('')}
    </div>
  `;
}
function buyRelic(id){
  const r = RELICS.find(x=>x.id===id); if(!r) return;
  if(r.char && r.char!==S.charId) return; // exclusive to another character
  if(S.relics.includes(id)){ toast('ALREADY OWNED'); return; }
  if(S.coins<r.price){ toast('NOT ENOUGH COINS'); return; }
  S.coins -= r.price; S.relics.push(id);
  addLog(`Bought relic: ${r.n} (+${r.brewBonus||0} beer/min, permanently)`);
  toast(r.icon+' '+r.n+' — EQUIPPED, +'+(r.brewBonus||0)+' BEER/MIN');
  save(); syncHUD(); renderShop();
}
function buyConsumable(id){
  const c = CONSUMABLES.find(x=>x.id===id); if(!c) return;
  if(c.char && c.char!==S.charId) return; // exclusive to another character
  if(S.coins<c.price){ toast('NOT ENOUGH COINS'); return; }
  S.coins -= c.price; S.items[id] = (S.items[id]||0)+1;
  addLog(`Bought item: ${c.n}`);
  toast(c.n+' ADDED TO YOUR BAG');
  save(); syncHUD(); renderShop();
}

function buyWithXP(type, id){
  if(!S.haggleActive){ toast('NO HAGGLE ACTIVE'); return; }
  const list = type==='relic' ? RELICS : CONSUMABLES;
  const r = list.find(x=>x.id===id); if(!r) return;
  const xpCost = r.price; // 1:1 coin to XP
  if(S.xp < xpCost){ toast('NOT ENOUGH XP — need '+xpCost+' XP'); return; }
  S.xp -= xpCost; S.haggleActive = false;
  if(type==='relic'){
    if(S.relics.includes(id)){ toast('ALREADY OWNED'); S.xp += xpCost; S.haggleActive = true; return; }
    S.relics.push(id);
    addLog('🤝 Haggled: '+r.n+' — paid '+xpCost+' XP');
    toast(r.icon+' '+r.n+' — YOURS FOR '+xpCost+' XP');
    if(r.brewBonus){ S.brewBonus = (S.brewBonus||0)+r.brewBonus; }
  } else {
    S.items[id] = (S.items[id]||0)+1;
    addLog('🤝 Haggled: '+r.n+' — paid '+xpCost+' XP');
    toast(r.n+' — YOURS FOR '+xpCost+' XP');
  }
  floatText('-'+xpCost+' XP', '#8ad4ff');
  save(); syncHUD(); renderShop();
}
/* ---------- bag / inventory ---------- */
function useItem(id){
  if(!S.items[id] || S.items[id]<=0){ toast('NONE LEFT'); return; }
  const c = CONSUMABLES.find(x=>x.id===id);
  S.items[id]--;
  if(id==='debtpardon'){
    if((S.coins||0) >= 0){ toast('YOU\'RE NOT IN DEBT — SAVE IT FOR LATER'); S.items[id]++; return; }
    const wiped = Math.abs(S.coins);
    S.coins = 0;
    addLog(`📜 Debt pardoned — ${wiped}🪙 debt wiped clean.`);
    toast('📜 DEBT FORGIVEN — BACK TO ZERO');
    floatText('PARDONED', '#c8980a');
    save(); syncHUD(); return;
  }
  if(id==='icebucket'){
    S.skips = (S.skips||0)+1;
    addLog('Used RELOAD — +1 reroll');
    toast('🔁 RELOADED. +1 REROLL');
  } else if(id==='fakeid'){
    S.autoWinNext = true;
    addLog('Activated FAKE ID — next challenge is covered');
    toast('🪪 FAKE ID READY FOR YOUR NEXT TILE');
  } else if(id==='haggle'){
    S.haggleActive = true;
    addLog('🤝 Gift of the Gab — next shop item can be bought with XP');
    toast('🤝 HAGGLE MODE ON — one item, paid in XP');
    floatText('HAGGLE READY', '#8ad4ff');
    save(); syncHUD();
    // Open the shop so they can use it immediately
    openShop(); return;
  } else if(id==='anotherround'){
    S.chugRoundLeft = (S.chugRoundLeft||0) + 1;
    S.chugAttemptsLeft = (S.chugAttemptsLeft||0) + 1;
    addLog('🥃 One More In The Tank — +1 chug attempt');
    toast('🥃 ONE MORE IN THE TANK — CHUG ATTEMPT RESTORED');
    floatText('+1 CHUG', '#ffd24a');
    refreshChug();
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
      ? S.relics.map(id=>{ const r=RELICS.find(x=>x.id===id); return r ? `<div class="logItem gold" style="display:flex;align-items:flex-start;gap:8px;">${ico(r.icon,20,'#c8a030')}<span><b>${r.n}</b><br><span class="dim">${r.d}</span></span></div>` : ''; }).join('')
      : 'None yet. Visit the shop.';
  }
  const itemEl = document.getElementById('itemList');
  if(itemEl){
    const owned = CONSUMABLES.filter(c=>(S.items[c.id]||0)>0);
    itemEl.innerHTML = owned.length
      ? owned.map(c=>`<div class="logItem" style="display:flex;align-items:flex-start;gap:8px;">${ico(c.icon,20,'#4fb3a3')}<span><span class="cyan">${c.n}</span> <span class="dim"> x${S.items[c.id]}</span><br>
          <button class="btn cyan sm" style="width:auto;margin:6px 0 0;padding:6px 10px" onclick="useItem('${c.id}')">USE</button></span></div>`).join('')
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
