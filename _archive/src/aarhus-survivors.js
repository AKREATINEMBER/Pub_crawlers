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
    perk:'+40% XP on beer challenges, -25% on party games\nBeer tiles come up more for you.\nParty games come up less.' },
  { id:'gambler', name:'THE GAMBLER', hair:'#1a1a1a', body:'#2a6b2a', pants:'#1a3d1a', acc:'#2e7d2e', accType:'fedora', scaleMult:1.18,
    perk:"At the table he's never been beat\nPut him in a fight and watch him retreat.\n\nDouble XP at the casino, -25% on physical duels\nGambling tiles come up more for you.\nDouble forfeits — you knew the risk." },
  { id:'jester', name:'THE JESTER', hair:'#2a0a0a', body:'#c1392b', pants:'#170f08', acc:'#c1392b', accType:'jesterhat', scaleMult:1.18,
    perk:"Chaos in his blood, he's always in luck\nWhen it comes to beer, he doesn't give a duck.\n\nEvery win is a draw from his tarot deck.\nBuild it in the shop. Peek & shuffle with Tricks.\n+30% party games, +50% Wheel, -25% beer\n1 Wheel re-spin every lap." },
  { id:'machine', name:'SIR DRINKS-A-LOT', hair:'#8a8f99', body:'#9aa2af', pants:'#454a54', acc:'#c9a227', accType:'helmet', scaleMult:1.18, chestIcon:'beer',
    perk:"Built like a wall, hits like a door\nSend him to the casino, he's out on the floor.\n\n+50% XP on physical challenges, -25% at the casino\nPhysical tiles come up more for you.\nGambling tiles come up less." },
  { id:'wizard', name:'THE BREW-ZARD', hair:'#d6c8a0', body:'#8a8a8a', pants:'#5a5a5a', acc:'#a0a0a0', accType:'wizardhat', scaleMult:1.18,
    perk:"Master of beer, staff in his hand\nParty games? He doesn't understand.\n\n+40% XP on shots (they're potions), -25% on party games\nShot tiles come up more for you.\nWild magic: sometimes he polymorphs into another class." }
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

/* ══ PIXEL ITEM ART — hand-drawn 16×16 sprites for every shop relic & item ══
   rows use one letter per pixel ('.' = empty); a dark outline is added automatically
   and every sprite is centred on an 18×18 canvas so they all sit the same way. */
const SPR_PAL = {"k":"#1a1018","w":"#f4ecd8","h":"#ffffff","y":"#f0c840","Y":"#b8841c","l":"#fff0a0","o":"#f08a24","r":"#d8343c","R":"#8a1a28","m":"#f080b0","b":"#4a90e0","B":"#24509a","c":"#70e8d8","C":"#2a9a90","g":"#58c040","G":"#2a7a28","p":"#a060e0","P":"#5a2a90","n":"#a86a34","N":"#6a3c1c","u":"#d8a060","s":"#d0d4dc","S":"#8a90a0","d":"#4a4e5a","x":"#3a3050","X":"#6a5a94","f":"#f0b890","F":"#c07a58","a":"#f0a830","A":"#b86818","v":"#c8b48a","i":"#c8e8f4","I":"#88c0d8","e":"#ff6a3a"};
const SPR = {"luckyhat":"................|....xxxxxxxx....|....xXXxxxxx....|....xXxxxxxx....|....xXxxxxxx....|....xXxxxxxx....|....xXxxxxxx....|....rrrrrgrr....|....RRRRgRgR....|....xXxxxxxx....|..xxxxxxxxxxxx..|.xXXXXXXXXXXXXx.|..xxxxxxxxxxxx..","energy":"......nnnn......|......NNNN......|......shss......|......shss......|.....shssss.....|....shyyyyys....|....hyyyyyys....|....hxxxlxxs....|....hxxllxxs....|....hxlllxxs....|....hxxllxxs....|....hxxlxxxs....|....hyyyyyYs....|....syyyyYYs....|.....ssssss.....","ring":"......YYYY......|.....YrhrrY.....|.....YrrrRY.....|.....YRRRRY.....|....yyYYYYyy....|...yly....yyY...|..yl........yY..|..yl........YY..|..yy........YY..|..yY........YY..|...yY......YY...|....YYYYYYYY....","shoes":"............yY..|...........ylyY.|............YY..|............p...|..yyyyy.....pP..|..rrrrp....ppP..|..rhrrpp..ppP...|.rrrrrppppppP...|.rrrrrpppppP....|.NNNNNNNNNN.....","shades":"dddddddddddddddd|dBhbBBBddBhbBBBd|dBbBBBBddBbBBBBd|dBBBBBBd.dBBBBBd|.dBBBBd...dBBBd.|..dddd.....ddd..","bottomlessstein":"....www.ww......|..wwhwwwwwww....|.wwwwwwwwwwww...|..wnnwwnnnww....|..SSSSSSSSSS....|..nnunnnnNnN.SS.|..nnunnnnNnNS..S|..nnunnnnNnNS..S|..nnunnnnNnNS..S|..nnunnnnNnN.SS.|..SSSSSSSSSS....|..nnunnnnNnN....|..NNNNNNNNNN....","loadeddice":"wwwwwww.........|wrwwwwwS........|wwwwwwwS........|wwwrwwwS........|wwwwwkkkkkkkkk..|wwwwwkwwwwwwwS..|SSSSSkwrwwwrwS..|.....kwwwwwwwS..|.....kwwwrwwwS..|.....kwwwwwwwS..|.....kwrwwwrwS..|.....kwwwwwwwS..|......SSSSSSSS..","tarotdeck":".PPPPPPPP.......|.PpPPPPpP.......|.PPpPPpPP.......|.PPPpkkkkkkkkkk.|.PPpPkwwwwwwwwk.|.PpPPkwyyyyyywk.|.PPPPkwywwwwywk.|.PPPPkwywrrwywk.|.PPPPkwyryyrywk.|.PpPPkwyryyrywk.|.PPpPkwywrrwywk.|.PPPpkwywwwwywk.|.....kwyyyyyywk.|.....kwwwwwwwwk.|.....kkkkkkkkkk.","horseshoe":".yyy........yyy.|.lyY........lyY.|.lkY........lkY.|.lyY........lyY.|.lyY........lyY.|.lkY........lkY.|.lyY........lyY.|.lyyY......lyyY.|..lyyY....lyyY..|..lkyyyyyyyykY..|...lyyyyyyyyY...|....YYYYYYYY....","ironthroat":".......o........|....o..oo...o...|....oo.oyo.oo...|...ooyoylyooyo..|..hsssssssssss..|..sSSSSSSSSSSd..|..sSSdSSSSdSSd..|...sSSSSSSSSd...|....sSSSSSSd....|.....ssSSdd.....|......sSSd......|......sSdd......|....ssSSSSdd....|...SSSSSSSSSS...","vikinghorn":"...........yyyy.|..........ylaaay|..........yaaaay|...........YYYY.|..........wwwwv.|.........wwwwvv.|........yyyyyY..|NN.....wwwwvv...|.Nw...wwwwvv....|.ww..wwwwvv.....|.wwwwwwwvv......|..wwwwwvv.......|...vvvvv........","meadaltar":"..o..........o..|.oyo........oyo.|..y...yyyy...y..|..w..yaaaaY..w..|.www.yaaaaY.www.|.whw..yaaY..whw.|.whw...yY...whw.|.whw...yY...whw.|.www..yyYY..www.|SSSSSSSSSSSSSSSS|shsssssssssssssd|.dSSdSSSSSSdSSd.|.SSSSrrrrrrSSSS.|.SSSSrRyyRrSSSS.|.SSSSrrrrrrSSSS.|.dddddddddddddd.","jokerscap":".......yy.......|.......yY.......|.yy....pP....yy.|.yY....pP....yY.|..rr...pP...rr..|..rrr..pP..rrR..|...rrrppPPrrR...|...rrrppPPrrR...|..yyyyyyyyyyyy..|..YrYpYrYpYrYY..|..yyyyyyyyyyyy..","markedcards":"...yyyyyyyyyy...|...yRRRRRRRRy...|...yRrRRRRrRy...|...yRRrRRrRRy...|...yRRRrrRRRy...|...yRRwwwwRRy...|...yRwbBBbwRy...|...yRwBkkBwRy...|...yRwbBBbwRy...|...yRRwwwwRRy...|...yRRRrrRRRy...|...yRRrRRrRRy...|...yRrRRRRrRy...|...yRRRRRRRhy...|...yyyyyyyyyy...","marotte":"..yy........yy..|..yrr......ppy..|....rrr..ppp....|.....rrrppp.....|......ffff......|.....fkffkf.....|.....ffffff.....|.....ffRRff.....|......ffff......|.....yyyyyy.....|......yYYy......|.......nN.......|.......nN.......|.......nN.......|......yYYy......","stolencrown":".r.....rr.....r.|.y.....yy.....y.|.yy...yyyy...yy.|.yyy.yyyyyy.yyy.|.yyyyyyyyyyyyyy.|.ylyyyyyyyyyyyY.|.yyrrYybbYyrrYY.|.yyrrYybbYyrrYY.|.ylyyyyyyyyyyyY.|.YYYYYYYYYYYYYY.","ironknuckles":".hs..hs..hs..hs.|h..Sh..Sh..Sh..S|s..Ss..Ss..Ss..S|s..Ss..Ss..Ss..S|ssssssssssssssSS|.sssssssssssssS.|...SsssssssssS..|.....SssssSS....|......SSSS......","crystalball":"......pppp......|....pphcppPP....|...phhcppppPP...|..pphcpppcppPP..|..phcppppccpPP..|..pcpppcccppPP..|..ppppccppppPP..|..pppppppppPPP..|...pppppppPPP...|....PpppPPPP....|......PPPP......|....yyyyyyyy....|...yllyyyyyyY...|..YYYYYYYYYYYY..","philstone":".....rrrrrr.....|....rhhrrrRr....|...rhrrrrrRRr...|..rrrrrrrrrRRr..|..RRRRRRRRRRRR..|...rrrrrrrrRR...|....rrrrrrRR....|.....rrrrRR.....|......rrRR......|.......rR.......","wildtome":"..rrrrrrrrrrr...|.Nrrrrrrrrrrrw..|.NryyyyyyyyyRw..|.NryrrrrrrryRw..|.NryrrrcrrryRw..|.NryrrcccrryRw..|.NryrcchccryRw..|.NryrrcccrryRw..|.NryrrrcrrryRw..|.NryrrrrrrryRw..|.NryyyyyyyyyRw..|.Nrrrrrrrrrrrw..|.NRRRRRRRRRRRw..|..wwwwwwwwwwww..","mooncauldron":"...........ll...|..........llly..|..........lyyy..|...........yy...|....c...........|......c..c......|..XXXXXXXXXXXX..|.XxcccccCccccxX.|.xxxxxxxxxxxxxx.|xXxxxxxxxxxxxxxx|.xXxxxxxxxxxxxx.|.xXxxxxxxxxxxxx.|..xXxxxxxxxxxx..|...xxxxxxxxxx...|...x........x...","loanshark":"......SS........|.....sSS........|....ssSS........|...sssSSS.......|...sssSSS.......|..ssssSSSS......|..ssssSSSSS.....|.sssssSSSSSSS...|bhbbbbhbbbbbhbbb|bbBbbbbBbbbbbBbb|BBBBBBBBBBBBBBBB","fakeid":"bbbbbbbbbbbbbbbb|bwwwwwwwwwwwwwwb|bwNNNNwwwwwwwwwb|bwNffNwSSSSSSwwb|bwffffwwwwwwwwwb|bwfkkfwSSSSwwwwb|bwffffwwwwwwwwwb|bwBBBBwSSSSSSSwb|bwwwwwwwwwwwrrwb|bbbbbbbbbbbbbbbb","stardust":"..l.........l...|.lhl.......lhl..|..l....l....l...|......lhl.......|.......l........|......ppp.......|.....yyyyy......|......ppp.......|.....ppppp......|....pplpppP.....|...pppppppPp....|...ppppplppP....|...plppppppP....|....pppppPP.....|.....PPPPP......","polyscroll":"..nuuuuuuuuuun..|..NnnnnnnnnnnN..|...wwwwwwwwww...|...wwwwwwwwwv...|...wwwpppwwwv...|...wwpwwwpwwv...|...wpwwppwpwv...|...wpwpwwpwwv...|...wpwwpwwpwv...|...wwpwwwpwwv...|...wwwpppwwwv...|...wwwwwwwwwv...|..nuuuuuuuuuun..|..NnnnnnnnnnnN..","sparemask":"...yyyyyyyyyy...|..yllyyyyyyyyY..|..yyyyyyyyyyyY..|..yxxxyyyyxxxY..|..yxxxyyyyxxxY..|..yyyyyyyyyyyY..|rryyyyyYYyyyyYrr|..yykyyyyyykyY..|...yykkkkkkyY...|....yyyyyyyY....|.....yyyyyY.....|......YYYY......","wildcard":"..yyyyyyyyyyyy..|..ywwwwwwwwwwy..|..ywywwwwwwywy..|..ywrrwwwwppwy..|..ywwrrwwppwwy..|..ywwwrrppwwwy..|..ywwyyyyyywwy..|..ywwffffffwwy..|..ywwfkffkfwwy..|..ywwffRRffwwy..|..ywwwffffwwwy..|..ywwwwwwwwwwy..|..yyyyyyyyyyyy..","anotherround":"..hiiiiiiiiiiS..|..hiiiiiiiiiiS..|..hiiiiiiiiiiS..|..haaaaaaaaaaS..|..haiiIaaaaaAS..|..hahiIaaaaaAS..|..haIIIaaaaaAS..|..haaaaaaaaaAS..|..hAaaaaaaaAAS..|..hAAAAAAAAAAS..|..hsssssssssSS..|..SSSSSSSSSSSS..","debtpardon":"wwwwwwwwwwwwwwww|vvwwwwwwwwwwwwvv|wwvvwwwwwwwwvvww|wwwwvvwwwwvvwwww|wwwwwvrrrrvwwwww|wwwwwrrhrrRwwwww|wwwwwrhrrrRwwwww|wwwwwrrrrRRwwwww|wwwwwwRRRRwwwwww|wwwwwwwwwwwwwwww|vvvvvvvvvvvvvvvv","haggle":"..wwwwwwwwwwww..|.wwwwwyyyywwwwv.|wwwwwyllyyYwwwwv|wwwwwylYYyYwwwwv|wwwwwylyyyYwwwwv|wwwwwyyyyYYwwwwv|.wwwwwYYYYwwwwv.|..wwwwwwwwwwvv..|...wwvvvvvvv....|..wv............|.w..............","icebucket":"................|.......gg.......|....gggggggg....|...ggllgggggg...|..ggll....ggGG..|..gll......ggG..|..gl........gG..|.ggl........ggG.|.ggl.......ggggg|..gl........ggg.|..gll........g..|..ggll..........|...gGlgggg......|....GGGggG......|.......GG.......|................","xpchip":".......wr.......|....wwwwrrrr....|...rrwwwrrrww...|..rrrYYYYYYwww..|.wrrYlllyyyYwwr.|.wwYlllyyyyyYrr.|.wwYllyYYyyyYrr.|wwwYlyYyyYyyYrrr|rrrYyyYyyYyyYwww|.rrYyyyYYyyyYww.|.rrYyyyyyyyyYww.|.rwwYyyyyyyYrrw.|..wwwYYYYYYrrr..|...wwrrrwwwrr...|....rrrrwwww....|.......rw......."};
const _sprCache = {};
function _sprBody(id){
  if(_sprCache[id]) return _sprCache[id];
  const rows = SPR[id].split('|'), OUT = '#120a10', N = 18;
  let y0=99,y1=-1,x0=99,x1=-1;
  rows.forEach((r,y)=>{ for(let x=0;x<r.length;x++) if(r[x]!=='.'){ y0=Math.min(y0,y); y1=Math.max(y1,y); x0=Math.min(x0,x); x1=Math.max(x1,x); } });
  const oy = Math.floor((N-(y1-y0+1))/2), ox = Math.floor((N-(x1-x0+1))/2);
  const g = Array.from({length:N},()=>Array(N).fill(null));
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){ const ch=rows[y][x]; if(ch && ch!=='.') g[oy+y-y0][ox+x-x0]=SPR_PAL[ch]; }
  const o = g.map(r=>r.slice());
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    if(g[y][x]) continue;
    if([[1,0],[-1,0],[0,1],[0,-1]].some(([dy,dx])=>g[y+dy]&&g[y+dy][x+dx])) o[y][x]=OUT;
  }
  let s='';
  for(let y=0;y<N;y++){ let x=0; while(x<N){ const c=o[y][x]; if(!c){x++;continue;} let w=1; while(x+w<N&&o[y][x+w]===c) w++; s+=`<rect x="${x}" y="${y}" width="${w}" height="1" fill="${c}"/>`; x+=w; } }
  return (_sprCache[id]=s);
}
function sprSVG(id, sz){
  return `<svg class="px-spr" width="${sz}" height="${sz}" viewBox="0 0 18 18" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${_sprBody(id)}</svg>`;
}
/* art for any relic/item: the pixel sprite when one exists, the old icon otherwise */
function itemArt(r, sz){ return (r && SPR[r.id]) ? sprSVG(r.id, sz) : ico(r.icon, sz); }
/* shop copy: split the flavour line from the rules text, and pull the beer/min out into a chip */
const _FLAV_SENTENCES = { luckyhat:2, stolencrown:2, shades:9, icebucket:0 };
function itemCopy(r){
  let d = (r.d||'').replace(/\s*Also,? \+[\d.]+ beer\/min(?:\s*[—-]\s*permanently)?\.?\s*$/i,'');
  const parts = d.match(/(?:[^.!?]|[.!?](?!\s|$))+[.!?]*\s*/g) || [d];
  let n = _FLAV_SENTENCES[r.id];
  if(n===undefined) n = (parts.length>1 && !/\d|XP|reroll|auto-wins|\+/i.test(parts[0])) ? 1 : 0;
  return { flav: parts.slice(0,n).join('').trim(), fx: parts.slice(n).join('').trim() };
}

const RELICS = [
  { id:'luckyhat', n:'THE UNREASONABLY LUCKY HAT', icon:'🎩', d:'Nobody can explain why it works. It just works. Your first failed challenge each lap counts as a win instead. Also +0.3 beer/min — permanently.', price:70, brewBonus:0.3 },
  { id:'energy',   n:'LIQUID COURAGE (BOTTLED, LEGAL)', icon:'⚡', char:'machine', d:'The Machine treats this as a food group, not a beverage. Keeps you sharp all night, or at least convincingly upright. Also +0.3 beer/min — permanently.', price:55, brewBonus:0.3 },
  { id:'ring',     n:"THE GAMBLER'S SIGNET RING", icon:'💍', char:'gambler', d:'Standard-issue equipment for every Gambler at birth, allegedly. +25% XP on every gambling tile. Also +0.4 beer/min — permanently.', price:65, brewBonus:0.4 },
  { id:'shoes',    n:'SHOES OF SUSPICIOUSLY GOOD BALANCE', icon:'👟', char:'jester', d:'Curled toes, silent bells, zero responsibility. SKIP THE PUB tiles pay DOUBLE XP and slip you a free 🎭 Trick. Also +0.2 beer/min — permanently.', price:40, brewBonus:0.2 },
  { id:'shades',   n:'SUNGLASSES AT NIGHT (ICONIC, NOT PRACTICAL)', icon:'🕶️', d:'Look effortlessly cool doing literally any of this. Also +0.3 beer/min — permanently.', price:55, brewBonus:0.3 },
  { id:'bottomlessstein', n:'THE BOTTOMLESS STEIN', icon:'🍺', char:'tank', d:'Rumored to never actually empty. An extra +25% XP on top of your already absurd beer bonus. Also +0.3 beer/min — permanently.', price:60, brewBonus:0.3 },
  { id:'loadeddice', n:"LOADED DICE (DON'T ASK)", icon:'🎲', char:'gambler', d:"Definitely not legal at the actual casino. An extra +25% XP on gambling tiles AND unlocks Dice game in The Den — rigged in your favour, allegedly. Also +0.3 beer/min.", price:60, brewBonus:0.3 },
  { id:'tarotdeck',  n:"THE TAROT DECK",            icon:'🃏', char:'gambler', d:"Ancient cards, dubious provenance. Unlocks Cards in The Den — pure 50/50, 2 spins per challenge. Also +0.4 beer/min.", price:75, brewBonus:0.4 },
  { id:'horseshoe',  n:"THE LUCKY HORSESHOE",        icon:'🧲', char:'gambler', d:"Nailed above every great gambler's door. Unlocks the Horseshoe game in The Den — 60/40 odds in your favour, 1 golden spin per challenge. Also +0.5 beer/min.", price:100, brewBonus:0.5 },
  { id:'ironthroat',  n:"IRON THROAT",           icon:'🫗', char:'tank', d:"Forged in the fires of a hundred ill-advised challenges. Unlocks the Iron Chug — wider sweet spot, 2 attempts per challenge. Also +0.3 beer/min.", price:55, brewBonus:0.3 },
  { id:'vikinghorn',  n:"THE VIKING DRINKING HORN", icon:'📯', char:'tank', d:"Passed down through generations of people who definitely didn't need it. Unlocks the Horn Chug — massive sweet spot, bonus coins on a perfect. Also +0.4 beer/min.", price:75, brewBonus:0.4 },
  { id:'meadaltar',   n:"THE MEAD ALTAR",           icon:'⚗️', char:'tank', d:"Built from reclaimed pub stools and sheer disregard for consequences. Unlocks Legend Mode — nail the perfect zone for 3× XP and a glory toast. Also +0.5 beer/min.", price:100, brewBonus:0.5 },
  { id:'jokerscap', n:"THE CAP OF BELLS", icon:'🔔', char:'jester', d:'Bells only you can hear, apparently. +25% XP on party games and the Wheel, and every source of 🔔 Mirth fills 50% faster. Also +0.3 beer/min — permanently.', price:60, brewBonus:0.3 },
  { id:'markedcards', n:'THE MARKED DECK', icon:'🎴', char:'jester', d:'Pinpricks on the backs that only your thumb can read. One card in every draw is dealt FACE-UP. Also +0.3 beer/min — permanently.', price:70, brewBonus:0.3 },
  { id:'marotte', n:"THE FOOL'S SCEPTRE", icon:'🪄', char:'jester', d:"A little stick with a little carved head that looks suspiciously like you. Wave it over a curse and it laughs: ⚡ THE TOWER is dealt REVERSED — full XP, +25 coins and +30 🔔 Mirth. Also +0.4 beer/min.", price:85, brewBonus:0.4 },
  { id:'stolencrown', n:'THE STOLEN CROWN', icon:'👑', char:'jester', d:"You wore it once for a joke. The King never asked for it back. Every draw deals a FOURTH card, and ☀️ The Sun turns up twice as often. Also +0.5 beer/min.", price:120, brewBonus:0.5 },
  { id:'ironknuckles', n:'IRON KNUCKLES', icon:'👊', char:'machine', d:'Not technically legal in darts. An extra +25% XP on physical challenges, stacking on Raw Power. Also +0.3 beer/min — permanently.', price:60, brewBonus:0.3 },
  { id:'crystalball', n:'THE CRYSTAL BALL', icon:'🔮', char:'wizard', d:'Swirling fog, occasionally helpful. Once per brew, SCRY the cauldron: see whether the next ingredient will curdle before you add it. Also +0.3 beer/min — permanently.', price:70, brewBonus:0.3 },
  { id:'philstone',   n:"THE PHILOSOPHER'S STONE", icon:'💎', char:'wizard', d:'Turns lead into gold and disasters into merely bad nights. A curdled potion salvages HALF your XP instead of a fifth. Also +0.3 beer/min — permanently.', price:60, brewBonus:0.3 },
  { id:'wildtome',    n:'THE TOME OF WILD MAGIC', icon:'📕', char:'wizard', d:'Its pages rearrange themselves when you are not looking. The Arcane Surge fills 50% faster, and Arcane Echo becomes +1.0 on every polymorph win. Also +0.4 beer/min.', price:75, brewBonus:0.4 },
  { id:'mooncauldron',n:'THE MOONLIT CAULDRON', icon:'🌕', char:'wizard', d:'Forged under a full moon by someone who really should have been asleep. Every stage of your brew is 5 points less likely to curdle. Also +0.5 beer/min.', price:90, brewBonus:0.5 },
  // ── the Gambler's ledger artifacts — earned by filling the High Roller's Ledger, never sold ──
  { id:'gb_chip',     artifact:1, char:'gambler', icon:'🔘', n:'THE WEIGHTED CHIP', d:'Heavier on one side. Nobody ever checks. +1 Den spin every round, at every table.', brewBonus:0.2 },
  { id:'gb_tongue',   artifact:1, char:'gambler', icon:'🗣️', n:'THE SILVER TONGUE', d:'You could talk a bouncer into a hug. Your forfeits are no longer doubled, and every gambling tile you lose pays you 10🪙 of hush money.', brewBonus:0.2 },
  { id:'gb_rabbit',   artifact:2, char:'gambler', icon:'🐇', n:"THE RABBIT'S FOOT", d:"Rubbed smooth by three generations of degenerates. Every Den table's LOSE slice shrinks by 10 points — handed straight to its best WIN.", brewBonus:0.3 },
  { id:'gb_house',    artifact:2, char:'gambler', icon:'🏠', n:'HOUSE MONEY', d:"It's not gambling if it's not your money. Your first coin bet each round is on the house: if it busts, you get it back.", brewBonus:0.3 },
  { id:'gb_tell',     artifact:3, char:'gambler', icon:'👁️', n:"THE DEALER'S TELL", d:'He scratches his ear when he holds a ten. Blackjack: you can see the dealer’s face-down card, and naturals pay 3×.', brewBonus:0.4 },
  { id:'gb_midas',    artifact:3, char:'gambler', icon:'💰', n:'THE MIDAS TOUCH', d:'Everything you win turns to gold. Winning a gambling tile also pays its full XP value in coins.', brewBonus:0.4 },
  { id:'gb_golden',   artifact:4, char:'gambler', icon:'🪙', n:'THE GOLDEN CHIP', d:'Minted for a king who lost it to your great-grandmother at cards. Every winning XP wager gets +1 on its multiplier: ×2 becomes ×3, ×3 becomes ×4.', brewBonus:0.6 },
  { id:'gb_sleeve',   artifact:4, char:'gambler', icon:'🃏', n:"THE CARD SHARP'S SLEEVE", d:'Deeper than it has any right to be. Blackjack wins pay 3×, and naturals pay 4×.', brewBonus:0.6 },
  { id:'gb_ancestor', artifact:5, char:'gambler', icon:'🎲', n:"GRANDFATHER'S FIRST DIE", d:"The ancestral relic of your bloodline — thrown since before the first tavern was built. The House always wins, and now YOU are the House: XP wagers can never lose (every LOSE becomes a push), and every Den coin win pays one extra ×.", brewBonus:1.0 },
  { id:'loanshark', n:"THE LOAN SHARK'S HANDSHAKE", icon:'🦈', char:'gambler', d:"A favour from someone you really shouldn't owe a favour to. Lets you bet up to 50 coins even when you're in the red. The debt is yours. The winnings are yours. The consequences — entirely yours.", price:60, brewBonus:0.2, discoverable:true }
];

const CONSUMABLES = [
  { id:'fakeid',    n:"THE WORLD'S MOST CONVINCING FAKE ID", icon:'🪪', char:'tank', d:'The Tank\'s go-to for doors, dealers, and one very specific ex. Auto-wins your next challenge tile, no questions asked.', price:25 },
  { id:'stardust', n:'A PINCH OF STARDUST', icon:'✨', char:'wizard', d:'Sprinkle it in and nothing can go wrong — for exactly one ingredient. Your next ingredient CANNOT curdle.', price:25 },
  { id:'polyscroll', n:'SCROLL OF POLYMORPH', icon:'🌀', char:'wizard', d:'Read it aloud, badly. Your Arcane Surge fills to the brim — your next win polymorphs you into another class.', price:40 },
  { id:'sparemask', n:'A SPARE MASK', icon:'🎭', char:'jester', d:'Every good fool carries a second face. +1 🎭 Trick — spend it mid-draw to PEEK at a card or SHUFFLE the whole hand.', price:20 },
  { id:'wildcard',  n:'THE WILD CARD', icon:'🃏', char:'jester', d:"Slipped up your sleeve before the deal. Your next draw is stacked: one card is guaranteed to pay ×2 or more — pulled from your own deck if you own one, otherwise The Magician. You still have to find it.", price:35 },
  { id:'anotherround', n:"ONE MORE IN THE TANK", icon:'🥃', char:'tank', d:"The Tank doesn't quit. +1 chug attempt right now — because sometimes the bar needs a second opinion.", price:25 },
  { id:'icebucket',   n:"ONE MORE SPIN, I SWEAR",   icon:'🔁', d:'Instantly refills a reroll — spin the lever again for free. Famous last words.', price:15, discoverable:true },
  { id:'haggle',      n:"THE GIFT OF THE GAB",      icon:'🤝', d:"Smooth talk your way to one deal. Use it in the shop to pay for any item in XP instead of coins. Works once, burns after.", price:5, discoverable:true },
  { id:'debtpardon',  n:"THE DEBT COLLECTOR\'S NIGHTMARE", icon:'📜', d:"A sealed letter from someone high up. All outstanding debts: forgiven. Balances restored to zero. Nobody asks questions.", price:80, discoverable:true },
  { id:'xpchip', n:"THE INSIDE MAN'S CHIP", icon:'🪙', char:'gambler', d:"A back-channel favour from someone who owes you. Convert up to 100 XP into coins — one time, no questions, gone after. Only the Gambler knows who to call.", price:5, oneTime:true, discoverable:true }
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
  { id:'brewmaster', n:'MASTER BREWER', d:'Choose 8 brewery upgrades', test:s=>(s.breweryUpgrades||[]).length>=8 },
  { id:'wzpoly', char:'wizard', n:'SHAPESHIFTER', d:'Polymorph into another class', test:s=>(s.wzPolyCount||0)>=1 },
  { id:'wzall', char:'wizard', n:'A THOUSAND FACES', d:'Polymorph 4 times in one night', test:s=>(s.wzPolyCount||0)>=4 },
  { id:'tkduel', char:'tank', n:'CHAMPION OF THE MEAD HALL', d:'Win a Chug-Off', test:s=>((s.duels||{}).w||0)>=1 },
  { id:'tkwall', char:'tank', n:'THE TROPHY WALL', d:'Beat 3 different squadmates in a Chug-Off', test:s=>(s.trophies||[]).length>=3 },
  { id:'tklegend', char:'tank', n:'A SAGA FOR THE AGES', d:'Reach THE LEGEND', test:s=>(s.saga||0)>=25 },
  { id:'jkking', char:'jester', n:'HERE COMES THE SUN', d:'Draw The Sun', test:s=>((s.jkStats||{}).kings||0)>=1 },
  { id:'jkdeck', char:'jester', n:'THE FULL ARCANA', d:'Build a deck of 25+ cards', test:s=>Array.isArray(s.jkDeck) && s.jkDeck.length>=25 },
  { id:'jkgrand', char:'jester', n:'THE GRAND JEST', d:'Play a Grand Jest', test:s=>((s.jkStats||{}).grand||0)>=1 },
  { id:'jkfool', char:'jester', n:'KING OF FOOLS', d:'Reach the highest rank of the court', test:s=>(s.jkRankLv||0)>=4 }
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
    coins:10000, souvenirs:{}, relics:[], items:{}, hatUsedThisLap:false, denSpinsLeft:3, chugAttemptsLeft:1, chugRoundLeft:0,
    rage:0, bloodied:false, chugMisses:0, perfectChugs:0, rageActivations:0, haggleActive:false,
    autoWinNext:false, shopPending:false, discovered:[], itemsUsed:{},
    breweryUpgrades:[], coinAccum:0, lastProdTs:null, beerCoinsTotal:0, pendingLevelUps:0,
    mirth:0, tricks:1, jkGrand:false, jkWildNext:false, jkHand:null, jkClaim:null, jkRankLv:0,
    jkStats:{ draws:0, kings:0, curses:0, grand:0, peeks:0, shuffles:0 },
    jkDeck:null, jkFreeBurns:0, jkExtraNext:0, jkHermitNext:0, jkLastCard:null,
    gbLedger:0, gbTier:0, gbPending:[], gbHouseUsed:false, gbWonTotal:0,
    saga:0, sagaStones:[], duels:{ w:0, l:0, d:0 }, trophies:[], duelNames:[], duelLap:null, tankDuelBoost:false,
    wzSurge:0, wzPolyCount:0, wzLastForm:null, wzStardust:false
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
// each character gets a private slice of a shared cycle, so their little animations
// never trigger at the same moment as anyone else's
const ANIM_CYCLE = 200;
const ANIM_WINDOW = 45;
const ANIM_OFFSET = { tank:0, gambler:50, jester:100, machine:150, wizard:175 };
function drawCharAnimation(ctx, ch, px, py, scale, bob, frame){
  const offset = ANIM_OFFSET[ch.id];
  if(offset==null) return;
  const t = ((frame - offset) % ANIM_CYCLE + ANIM_CYCLE) % ANIM_CYCLE;

  if(ch.id==='tank'){
    // a quick double-bicep flex, crown catching a little shine
    if(t<35){
      let amt;
      if(t<8) amt = t/8;
      else if(t<25) amt = 1 + 0.08*Math.sin((t-8)/3);
      else amt = Math.max(0, 1-(t-25)/10);
      const alpha = t<8 ? t/8 : (t<25 ? 1 : Math.max(0,1-(t-25)/10));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = Math.round(scale*1.9*amt)+'px sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('💪', px+10*scale, py+8.2*scale+bob);
      ctx.restore();
    }
    if(t>=10 && t<22){
      const spark = 0.5+0.5*Math.sin((t-10)/2);
      ctx.save();
      ctx.globalAlpha = spark;
      ctx.font = Math.round(scale*1.1)+'px sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('✨', px+6.5*scale, py-1.6*scale+bob);
      ctx.restore();
    }
  } else if(ch.id==='gambler'){
    // flips a coin up in a spinning arc and catches it
    if(t<40){
      const p = t/40;
      const arcY = 8.5 - Math.sin(p*Math.PI)*7.5;
      const spin = Math.cos(t*0.9);
      const cx = px+9.6*scale, cy = py+arcY*scale+bob;
      ctx.save();
      ctx.translate(cx,cy);
      ctx.scale(Math.max(0.15,Math.abs(spin)),1);
      ctx.fillStyle = '#e8c34a';
      ctx.beginPath(); ctx.arc(0,0,scale*0.55,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#170f08'; ctx.lineWidth = Math.max(0.6,scale*0.08); ctx.stroke();
      ctx.restore();
      if(p>0.85){
        ctx.save();
        ctx.globalAlpha = (p-0.85)/0.15;
        ctx.font = Math.round(scale*1.1)+'px sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('✨', px+9.6*scale, py+7.6*scale+bob);
        ctx.restore();
      }
    }
  } else if(ch.id==='jester'){
    // a chaos zap, then a quick two-ball juggle
    if(t<6){
      ctx.save();
      ctx.globalAlpha = 1-(t/6);
      ctx.font = Math.round(scale*1.3)+'px sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('⚡', px+6.5*scale, py-1.8*scale+bob);
      ctx.restore();
    }
    if(t>=4 && t<40){
      const jt = t-4;
      [{phase:0,color:'#38f2e0'},{phase:Math.PI,color:'#ff3ea5'}].forEach(b=>{
        const ang = (jt/36)*Math.PI*4 + b.phase;
        const bx = 6.5 + Math.cos(ang)*3.4;
        const by = 7.6 - Math.abs(Math.sin(ang))*4.2;
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.arc(px+bx*scale, py+by*scale+bob, scale*0.45, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      });
    }
  } else if(ch.id==='machine'){
    // The glass lives in his right hand at arm height at rest.
    // During the animation window he raises it to his mouth, drinks with a foam bubble,
    // then lowers it back to rest. No crush — he just enjoys it like a gentleman.
    const REST_X = 9.2, REST_Y = 8.8;
    const MOUTH_X = 5.8, MOUTH_Y = 5.1;

    let mugX = REST_X, mugY = REST_Y, foamAlpha = 0, drinkT = 0;

    if(t < 45){
      if(t < 10){
        // raise
        const p = t / 10;
        const e = p*p*(3-2*p);
        mugX = REST_X + (MOUTH_X - REST_X)*e;
        mugY = REST_Y + (MOUTH_Y - REST_Y)*e;
      } else if(t < 26){
        // drinking — gentle jitter, foam bubbles
        mugX = MOUTH_X + Math.sin((t-10)*0.9)*0.08;
        mugY = MOUTH_Y + Math.sin((t-10)*1.3)*0.05;
        drinkT = (t-10)/16;
        foamAlpha = Math.sin(drinkT*Math.PI) * 0.9;
      } else if(t < 36){
        // lower back down
        const p = (t-26) / 10;
        const e = p*p*(3-2*p);
        mugX = MOUTH_X + (REST_X - MOUTH_X)*e;
        mugY = MOUTH_Y + (REST_Y - MOUTH_Y)*e;
      }
      // otherwise t 36-44: resting — falls through to rest draw below
    }

    // draw the glass: tall pint glass shape
    const gx = px + mugX*scale, gy = py + mugY*scale + bob;
    const gw = scale*1.3, gh = scale*1.6;
    // amber beer fill (level drops as he drinks)
    const fillFrac = drinkT > 0 ? Math.max(0.15, 1 - drinkT*0.7) : 1;
    ctx.save();
    ctx.fillStyle = '#e8b23a';
    ctx.fillRect(gx + scale*0.08, gy + gh*(1-fillFrac), gw - scale*0.15, gh*fillFrac);
    // glass outline (clear)
    ctx.strokeStyle = '#c8d8e8';
    ctx.lineWidth = Math.max(1, scale*0.18);
    ctx.strokeRect(gx + scale*0.08, gy, gw - scale*0.15, gh);
    // foam top
    const foamY = gy + gh*(1-fillFrac) - scale*0.22;
    ctx.fillStyle = `rgba(255,252,240,${0.85 + foamAlpha*0.15})`;
    ctx.fillRect(gx + scale*0.1, foamY, gw - scale*0.2, scale*0.28);
    // handle
    ctx.strokeStyle = '#c8d8e8';
    ctx.lineWidth = Math.max(1, scale*0.15);
    ctx.beginPath();
    ctx.arc(gx + gw + scale*0.15, gy + gh*0.4, scale*0.35, -Math.PI*0.45, Math.PI*0.45);
    ctx.stroke();
    ctx.restore();

    // foam bubble pops during the drink
    if(foamAlpha > 0.1){
      ctx.save();
      ctx.globalAlpha = foamAlpha * 0.8;
      ctx.fillStyle = '#fff8e8';
      const bubs = [[0.3,-0.5],[0.7,-0.7],[1.1,-0.4],[0.5,-1.0]];
      bubs.forEach(([bx,by],i)=>{
        const s = 0.18 + 0.08*Math.sin(frame*0.4+i);
        ctx.beginPath();
        ctx.arc(gx + bx*scale, gy + by*scale, s*scale, 0, Math.PI*2);
        ctx.fill();
      });
      ctx.restore();
    }
  } else if(ch.id==='wizard'){
    // beard — drawn over the lower face/body rows
    ctx.fillStyle = '#d6c8a0';
    ctx.fillRect(px+3*scale, py+5.0*scale+bob, scale*6, scale*1.1);
    ctx.fillRect(px+2.8*scale, py+6.0*scale+bob, scale*6.4, scale*1.2);
    ctx.fillRect(px+3.2*scale, py+7.1*scale+bob, scale*5.6, scale*1.1);
    ctx.fillRect(px+3.6*scale, py+8.0*scale+bob, scale*4.8, scale*1.0);
    ctx.fillRect(px+4.0*scale, py+8.9*scale+bob, scale*4.0, scale*0.9);
    ctx.fillRect(px+4.6*scale, py+9.7*scale+bob, scale*2.8, scale*0.7);

    // staff — right side of sprite, from top of hand down past feet
    const staffX = px+11.2*scale;
    ctx.fillStyle = '#8a6030';
    ctx.fillRect(staffX, py+6.5*scale+bob, scale*0.9, scale*6.8);
    // staff orb at the top
    ctx.fillStyle = '#a0e8ff';
    ctx.beginPath(); ctx.arc(staffX+scale*0.45, py+6.2*scale+bob, scale*1.1, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.arc(staffX+scale*0.2, py+5.8*scale+bob, scale*0.38, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;

    // sparkle cast animation — orb pulses then fires particles outward
    if(t<45){
      const staffTipX = staffX + scale*0.45;
      const staffTipY = py+6.2*scale+bob;

      const chargeT = Math.min(1, t/20);
      ctx.save();
      ctx.globalAlpha = chargeT * 0.6;
      ctx.fillStyle = '#a0e8ff';
      ctx.beginPath();
      ctx.arc(staffTipX, staffTipY, scale*(1.1 + chargeT*0.9), 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      if(t >= 18){
        const ft = (t-18)/27; // 0→1 over the firing phase
        const numParticles = 7;
        for(let i=0; i<numParticles; i++){
          const angle = (i/numParticles)*Math.PI*2 + ft*0.4;
          const dist = ft * scale * 8.5;
          const alpha = Math.max(0, 1 - ft*1.1);
          const pSize = scale*(0.35 + 0.25*Math.sin(i*1.7));
          const colours = ['#ffffff','#a0e8ff','#ffd24a','#ff88ff'];
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = colours[i % colours.length];
          const px2 = staffTipX + Math.cos(angle)*dist;
          const py2 = staffTipY + Math.sin(angle)*dist;
          ctx.fillRect(px2-pSize*0.5, py2-pSize*1.5, pSize, pSize*3);
          ctx.fillRect(px2-pSize*1.5, py2-pSize*0.5, pSize*3, pSize);
          ctx.restore();
        }
      }
    }
  }
}
function drawChar(ctx, ch, px, py, scale, frame){
  const map = { O:'#170f08', H:ch.hair, S:'#f0c49b', E:'#170f08', M:'#b06a4a', B:ch.body, A:'#f0c49b', P:ch.pants };
  const bob = (frame && Math.floor(frame/22)%2===1) ? scale : 0;
  for(let y=0;y<SPRITE.length;y++){
    for(let x=0;x<SPRITE[y].length;x++){
      const c = SPRITE[y][x];
      if(c==='.') continue;
      let col = map[c] || '#fff';
      if(ch.id==='jester'){
        // counterchanged motley: crimson/violet halves, gold-and-cream ruff, gilt buttons
        if(c==='B') col = y===7 ? (x%2 ? '#f4e6d0' : '#e8c34a') : ((x===6 && y===9) ? '#e8c34a' : (x<6 ? '#b3203a' : '#6b2a96'));
        else if(c==='P') col = x<6 ? '#6b2a96' : '#b3203a';
        else if(c==='A' && y===8) col = x<6 ? '#6b2a96' : '#b3203a';
      }
      ctx.fillStyle = col;
      ctx.fillRect(px + x*scale, py + y*scale + bob, scale, scale);
    }
  }
  // per-character idle animations — each has its own offset in a shared cycle so
  // they never trigger at the same time as each other
  drawCharAnimation(ctx, ch, px, py, scale, bob, frame);
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
  } else if(ch.accType==='helmet'){
    // medieval knight helm — steel dome over the hair, flared cheek guards, a nose bar, gold crest plume
    const steel = '#aab2bf', steelDark = '#5c6570';
    ctx.fillStyle = steel;
    ctx.fillRect(px+2*scale, ay, scale*8, scale*4);
    ctx.fillRect(px+2*scale, ay+scale*4, scale*2, scale*1.6);
    ctx.fillRect(px+8*scale, ay+scale*4, scale*2, scale*1.6);
    ctx.fillStyle = steelDark;
    ctx.fillRect(px+2*scale, ay, scale, scale*4);
    ctx.fillRect(px+9*scale, ay, scale, scale*4);
    ctx.fillRect(px+5.3*scale, ay+scale*2.5, scale*0.9, scale*2);
    ctx.fillStyle = ch.acc;
    ctx.fillRect(px+5*scale, ay-scale*1.6, scale*2, scale*1.8);
  } else if(ch.accType==='wizardhat'){
    const hatCol  = '#a0a0a0';   // mid grey
    const hatDark = '#686868';   // darker grey shading
    // wide brim
    ctx.fillStyle = hatDark;
    ctx.fillRect(px+1*scale, ay-scale*0.3, scale*10, scale*1.0);
    // tall cone: 4 sections stepping inward as they rise
    ctx.fillStyle = hatCol;
    ctx.fillRect(px+3*scale,   ay-scale*1.2, scale*6,   scale*1.0);
    ctx.fillRect(px+3.8*scale, ay-scale*2.3, scale*4.4, scale*1.2);
    ctx.fillRect(px+4.5*scale, ay-scale*3.5, scale*3.0, scale*1.3);
    ctx.fillRect(px+5.1*scale, ay-scale*4.6, scale*1.8, scale*1.2);
    // shading stripe on the left of the cone
    ctx.fillStyle = hatDark;
    ctx.fillRect(px+3*scale,   ay-scale*1.2, scale*0.7, scale*1.0);
    ctx.fillRect(px+3.8*scale, ay-scale*2.3, scale*0.7, scale*1.2);
    ctx.fillRect(px+4.5*scale, ay-scale*3.5, scale*0.6, scale*1.3);
    // star tip
    ctx.fillStyle = '#aad4f0';
    ctx.fillRect(px+5.6*scale, ay-scale*5.3, scale*0.8, scale*0.8);
    ctx.fillRect(px+5.2*scale, ay-scale*5.0, scale*1.6, scale*0.45);
  } else if(ch.accType==='fedora'){
    const brim  = ch.acc;           // green
    const crown = '#1e5c1e';        // slightly darker green for the crown body
    const band  = '#0e2e0e';        // very dark band stripe
    const shine = '#4aad4a';        // lighter highlight on crown top
    // wide brim — extends past the sprite edges for that classic fedora look
    ctx.fillStyle = brim;
    ctx.fillRect(px+0*scale, ay,           scale*12, scale*1.1);
    // crown — tall, sits above the brim, slightly narrower
    ctx.fillStyle = crown;
    ctx.fillRect(px+2.5*scale, ay-scale*3.2, scale*7, scale*3.3);
    // pinched-crown dip in the middle of the top
    ctx.fillStyle = '#170f08';
    ctx.fillRect(px+5.3*scale, ay-scale*3.5, scale*1.4, scale*0.6);
    // darker band stripe along the brim-crown join
    ctx.fillStyle = band;
    ctx.fillRect(px+2.5*scale, ay-scale*0.6, scale*7, scale*0.7);
    // highlight along the top of the crown
    ctx.fillStyle = shine;
    ctx.fillRect(px+2.8*scale, ay-scale*3.0, scale*6.4, scale*0.45);
  } else if(ch.accType==='jesterhat'){
    // three-pointed motley cap of bells — crimson / violet / crimson, gilt band, gold bells
    const cr = '#b3203a', vi = '#6b2a96', crD = '#7a0f26', gold = '#e8c34a', blk = '#170f08';
    const R = (x,y,w,h,c)=>{ ctx.fillStyle=c; ctx.fillRect(px+x*scale, ay+y*scale, w*scale, h*scale); };
    // cap dome
    R(2.3,-0.7,2.7,1.5,cr); R(4.9,-1.0,2.2,1.8,vi); R(7.0,-0.7,2.7,1.5,cr);
    // left prong curls out
    R(1.6,-1.7,2.4,1.1,cr); R(0.9,-2.6,1.7,1.0,cr); R(1.6,-1.7,0.6,1.1,crD);
    // middle prong stands tall
    R(5.2,-2.2,1.6,1.3,vi); R(5.5,-3.1,1.0,1.0,vi);
    // right prong curls out
    R(8.0,-1.7,2.4,1.1,cr); R(9.4,-2.6,1.7,1.0,cr); R(9.8,-1.7,0.6,1.1,crD);
    // gilt band across the brow, studded with little diamonds
    R(2.0,0.6,8.0,0.9,gold); R(3.1,0.8,0.7,0.5,cr); R(5.65,0.8,0.7,0.5,vi); R(8.2,0.8,0.7,0.5,cr);
    // bells — they swing a little
    const sw = Math.sin((frame||0)*0.35)*0.25;
    [[1.1+sw,-3.0],[6.0,-3.55],[10.9-sw,-3.0]].forEach(([bx,by])=>{
      ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(px+bx*scale, ay+by*scale, scale*0.62, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff6c8'; ctx.fillRect(px+(bx-0.35)*scale, ay+(by-0.35)*scale, scale*0.3, scale*0.3);
      ctx.fillStyle = blk; ctx.fillRect(px+(bx-0.12)*scale, ay+(by+0.2)*scale, scale*0.24, scale*0.3);
    });
  }
}

/* ---------- per-character size (some characters are drawn a little bigger/beefier) ---------- */
function charDrawParams(ch, baseScale, basePx, basePy){
  const mult = ch.scaleMult || 1;
  const scale = baseScale * mult;
  const baseline = basePy + 12*baseScale; // feet stay put — sprite grows upward/outward from the ground
  const cx = basePx + 13*baseScale/2;     // stays horizontally centered in the same spot
  return { scale, px: cx - 13*scale/2, py: baseline - 12*scale };
}

/* ---------- boot sprite ---------- */
function paintBootSprite(){
  const c = document.getElementById('bootSprite'); if(!c) return;
  const ctx = c.getContext('2d'); ctx.clearRect(0,0,110,136);
  const ch = CHARS[Math.floor((Date.now()/1400)%CHARS.length)];
  const {scale,px,py} = charDrawParams(ch, 8, 8, 38);
  drawChar(ctx, ch, px, py, scale, Math.floor(Date.now()/40));
}
setInterval(paintBootSprite, 90);

/* ---------- character select ---------- */
let selChar = 'tank';
let charGridFrame = 0;
function buildCharGrid(){
  const g = document.getElementById('charGrid');
  g.innerHTML = '';
  CHARS.forEach(ch=>{
    const d = document.createElement('div');
    d.className = 'charCard' + (ch.id===selChar?' sel':'');
    d.onclick = ()=>{ selChar = ch.id; buildCharGrid(); };
    d.innerHTML = `<canvas width="72" height="100"></canvas>
      <div class="charName">${ch.name}</div>
      <div class="charPerk">${ch.perk.replace(/\n/g,'<br>')}</div>`;
    g.appendChild(d);
  });
  paintCharGridFrame();
}
function paintCharGridFrame(){
  const cards = document.querySelectorAll('#charGrid .charCard');
  cards.forEach((card,i)=>{
    const ch = CHARS[i];
    const canvas = card.querySelector('canvas');
    if(!ch || !canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const {scale,px,py} = charDrawParams(ch, 5.2, 5, 37);
    drawChar(ctx, ch, px, py, scale, charGridFrame);
  });
}
setInterval(()=>{
  if(!document.getElementById('screen-char').classList.contains('hide')){
    charGridFrame++;
    paintCharGridFrame();
  }
}, 90);

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
  machine: { [T.PHYS]:1.5, [T.GAMBLE]:0.75 },
  wizard:  { [T.SHOT]:1.5, [T.SOCIAL]:0.75 }
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
function dayNightBrewMultiplier(){
  // same 8-min cycle as the sky — peaks at 1.6× during midday, dips to 0.5× at deep night
  const CYCLE_MS = 8 * 60 * 1000;
  const t = (Date.now() % CYCLE_MS) / CYCLE_MS;
  // smooth sine curve: t=0.45 (midday) → max, t=0.0/1.0 (midnight) → min
  const angle = (t - 0.45) * Math.PI * 2; // midday = 0 offset
  const raw = Math.cos(angle); // -1 to +1
  return 0.5 + (raw + 1) / 2 * 1.1; // maps to 0.5 → 1.6
}
function tickBreweryProduction(){
  if(!S || !S.lastProdTs) return;
  const now = Date.now();
  let elapsedMin = (now - S.lastProdTs) / 60000;
  S.lastProdTs = now;
  if(elapsedMin<=0) return;
  const CATCHUP_CAP_MIN = 180; // don't dump hours of coins if the phone was closed/asleep a long time
  if(elapsedMin>CATCHUP_CAP_MIN) elapsedMin = CATCHUP_CAP_MIN;
  const baseRate = computeBreweryRate();
  const mult = dayNightBrewMultiplier();
  const rate = baseRate * mult;
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
  const brewedEl = document.getElementById('stBrewed');
  if(brewedEl) brewedEl.textContent = Math.floor(liveTotal);
  const rateEl = document.getElementById('stBrewRate');
  if(rateEl) rateEl.textContent = rate.toFixed(1)+'/min';
  const rateLbl = document.getElementById('brewRateLabel');
  if(rateLbl) rateLbl.textContent = '🍺 '+rate.toFixed(1)+'/min';
}
function offerBreweryUpgrade(){
  showCard({
    cls:'good',
    tag:'🍺 BREWERY LOOT',
    title:`LEVEL ${S.level} — A CHEST APPEARS`,
    body:'Open it to find out what your brewery gets this time.',
    raw:`<button class="chestBtn" onclick="openBreweryChest()" aria-label="Open chest">
           <svg viewBox="0 0 40 34" xmlns="http://www.w3.org/2000/svg">
             <path d="M4 15 Q4 4 20 4 Q36 4 36 15 L36 16 L4 16 Z" fill="#8a5a2b" stroke="#170f08" stroke-width="1.6"/>
             <rect x="4" y="16" width="32" height="15" rx="2" fill="#6b4a26" stroke="#170f08" stroke-width="1.6"/>
             <rect x="4" y="16" width="32" height="3" fill="#3a2712"/>
             <rect x="16.5" y="4" width="7" height="27" fill="#c9a227" stroke="#170f08" stroke-width="1"/>
             <rect x="4" y="22" width="32" height="2.4" fill="#3a2712" opacity=".55"/>
             <rect x="4" y="27" width="32" height="2.4" fill="#3a2712" opacity=".55"/>
             <rect x="15.5" y="15" width="9" height="8" rx="1.5" fill="#e8a33d" stroke="#170f08" stroke-width="1.4"/>
             <circle cx="20" cy="19.2" r="1.7" fill="#170f08"/>
             <rect x="19.2" y="19.2" width="1.6" height="2.6" fill="#170f08"/>
           </svg>
         </button>
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
function discoverItem(id){
  // Find in relics or consumables
  const relic = RELICS.find(r=>r.id===id);
  const item  = CONSUMABLES.find(c=>c.id===id);
  const r = relic || item;
  if(!r) return;
  const type = relic ? 'relic' : 'item';
  showCard({
    cls:'forfeit',
    tag:'🔍 YOU FOUND SOMETHING',
    title: r.icon+' '+r.n,
    body: r.d,
    chips: [r.price+'🪙 IN THE SHOP'],
    buttons:`<button class="btn primary" onclick="claimDiscovery('${id}','${type}')">TAKE IT TO THE SHOP</button>`
  });
}
function claimDiscovery(id, type){
  closeCard();
  go('shop');
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
const CHAR_SKY_TINT = { tank:'#2e6bd6', gambler:'#2a6b2a', jester:'#7a2a9a', machine:'#c1392b', wizard:'#a0a0a0' };
function drawBrewery(ctx, W, H, frame){
  const tier = breweryTierFor(S.level);
  ensureBreweryEntities(tier);
  const groundY = H - 20;

  // day/night cycle — full loop every 8 minutes of real time
  const CYCLE_MS = 8 * 60 * 1000;
  const cycleT = (Date.now() % CYCLE_MS) / CYCLE_MS; // 0→1 over 8 min
  // phase boundaries: 0.0 night → 0.2 dawn → 0.35 day → 0.55 dusk → 0.7 night
  function lerpCol(a, b, t){
    const ah=parseInt(a.slice(1),16), bh=parseInt(b.slice(1),16);
    const ar=(ah>>16)&255, ag=(ah>>8)&255, ab_=ah&255;
    const br=(bh>>16)&255, bg=(bh>>8)&255, bb_=bh&255;
    const r=Math.round(ar+(br-ar)*t), g2=Math.round(ag+(bg-ag)*t), b2=Math.round(ab_+(bb_-ab_)*t);
    return `rgb(${r},${g2},${b2})`;
  }
  function cycleBlend(night, dawn, day, dusk, t){
    if(t<0.20) return lerpCol(night, dawn, t/0.20);
    if(t<0.35) return lerpCol(dawn, day, (t-0.20)/0.15);
    if(t<0.55) return lerpCol(day, dusk, (t-0.35)/0.20);
    if(t<0.70) return lerpCol(dusk, night, (t-0.55)/0.15);
    return night;
  }
  const skyTop    = cycleBlend('#08050f','#a04820','#1a72c8','#3a1060','#08050f', cycleT);
  const skyBot    = cycleBlend('#170f08','#d86030','#60b0e8','#6a1838','#170f08', cycleT);
  const isNight   = cycleT < 0.18 || cycleT > 0.68;
  const isDawn    = cycleT >= 0.18 && cycleT < 0.35;
  const isDay     = cycleT >= 0.35 && cycleT < 0.55;
  const isDusk    = cycleT >= 0.55 && cycleT < 0.68;
  const nightness = isNight ? 1 : isDawn ? 1-(cycleT-0.18)/0.17 : isDusk ? (cycleT-0.55)/0.13 : 0;
  const dayness   = isDay ? 1 : isDawn ? (cycleT-0.20)/0.15 : isDusk ? 1-(cycleT-0.55)/0.15 : 0;

  // sky gradient
  const g = ctx.createLinearGradient(0,0,0,groundY);
  g.addColorStop(0, skyTop); g.addColorStop(1, skyBot);
  ctx.fillStyle = g; ctx.fillRect(0,0,W,groundY);

  // character sky tint (only at night/dusk to avoid washing out daylight)
  const tint = CHAR_SKY_TINT[S && S.charId];
  if(tint && nightness > 0){
    ctx.save();
    ctx.globalCompositeOperation = 'color'; // imparts hue while keeping the tier's own brightness/darkness intact
    ctx.globalAlpha = 0.75 * nightness;
    ctx.fillStyle = tint;
    ctx.fillRect(0,0,W,groundY);
    ctx.restore();
  }

  // sun (day) — arcs across the sky
  if(dayness > 0.02){
    const sunPhase = (cycleT - 0.20) / 0.50; // 0 at dawn, 1 at dusk
    const sunX = W * sunPhase;
    const sunY = groundY * 0.55 - Math.sin(sunPhase * Math.PI) * groundY * 0.45;
    ctx.save();
    ctx.globalAlpha = dayness * 0.95;
    // outer glow
    const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 22);
    sg.addColorStop(0, 'rgba(255,240,180,0.6)'); sg.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sunX, sunY, 22, 0, Math.PI*2); ctx.fill();
    // sun disc
    ctx.fillStyle = '#ffe87a';
    ctx.beginPath(); ctx.arc(sunX, sunY, 8, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // moon (night) — fixed position, fades with night
  if(nightness > 0.02){
    ctx.save();
    ctx.globalAlpha = nightness * 0.85;
    ctx.fillStyle = '#d8d4e8';
    ctx.beginPath(); ctx.arc(326, 20, 9, 0, Math.PI*2); ctx.fill();
    // crescent shadow
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = nightness * 0.55;
    ctx.beginPath(); ctx.arc(330, 18, 8, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // stars — visible at night, fade during day
  if(nightness > 0.05 || tier.epic >= 1){
    const starAlpha = nightness;
    breweryStars.forEach(s=>{
      const twinkle = 0.25 + 0.45*Math.max(0, Math.sin(frame/26 + s.seed));
      ctx.globalAlpha = twinkle * starAlpha; ctx.fillStyle='#fff';
      ctx.fillRect(s.x, s.y, 1.4, 1.4);
    });
    ctx.globalAlpha = 1;
  }

  // dawn/dusk horizon glow
  if(isDawn || isDusk){
    const glowStr = isDawn ? (cycleT-0.18)/0.17 : 1-(cycleT-0.55)/0.13;
    const glowCol = isDawn ? 'rgba(255,140,60,' : 'rgba(220,80,40,';
    const hg = ctx.createLinearGradient(0, groundY*0.4, 0, groundY);
    hg.addColorStop(0, glowCol+'0)'); hg.addColorStop(1, glowCol+(0.35*glowStr)+')');
    ctx.fillStyle = hg; ctx.fillRect(0, groundY*0.4, W, groundY*0.6);
  }

  // ground — darker at night, lighter tan during day
  const groundCol = isDay ? '#1a1508' : nightness > 0.5 ? '#0c0a12' : lerpCol('#1a1508','#0c0a12', nightness);
  ctx.fillStyle = groundCol; ctx.fillRect(0, groundY, W, H-groundY);
  ctx.fillStyle = lerpCol('#2a2010','#171420', nightness);
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
          const winAlpha = 0.25 + 0.75*nightness;
          ctx.fillStyle = `rgba(255,${Math.round(110+40*flick)},${Math.round(40*flick)},${winAlpha})`;
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
  else if(S && S.charId) document.body.setAttribute('data-char', S.charId); // entering the run → class theme on
  ['boot','char','game','squad','backup','log','bag','shop'].forEach(s=>{
    const _sc=document.getElementById('screen-'+s); if(_sc) _sc.classList.toggle('hide', s!==screen);
  });
  const nav = document.getElementById('nav');
  nav.classList.toggle('hide', screen==='boot' || screen==='char');
  document.getElementById('navGame').classList.toggle('on', screen==='game');
  document.getElementById('navBag').classList.toggle('on', screen==='bag');
  document.getElementById('navSquad').classList.toggle('on', screen==='squad'||screen==='backup');
  document.getElementById('navLog').classList.toggle('on', screen==='log');
  document.getElementById('navShop').classList.toggle('on', screen==='shop');
  if(screen==='char') buildCharGrid();
  if(screen==='squad'||screen==='backup'){ renderBackup(); } if(screen==='squad'){ renderGuide(); }
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
  tank: 'THE UNSHAKABLE', gambler: 'THE HOUSE EDGE', jester: 'THE CHAOS AGENT', machine: 'THE RAW POWER', wizard: 'THE BREW-ZARD SUPREME'
};
/* ── THE SAGA — the Tank's ranks, earned by every chug (perfect 3 · OK 1 · duel win 3) ── */
const TANK_RANKS = [
  { lv:0, n:'THE DRUNKARD',    need:0,  perk:'Base chug windows' },
  { lv:1, n:'THE FOOTSOLDIER', need:3,  perk:'OK window +0.3s wider' },
  { lv:2, n:'THE BERSERKER',   need:8,  perk:'Rage builds 50% faster — and OK chugs feed it' },
  { lv:3, n:'THE WARLORD',     need:15, perk:'Immune to War Wounds' },
  { lv:4, n:'THE LEGEND',      need:25, perk:'Every perfect chug pays 3×' }
];
function tankRank(){ const p = (S && S.saga) || 0; let r = TANK_RANKS[0]; TANK_RANKS.forEach(x => { if(p >= x.need) r = x; }); return r; }
function tankRankLabel(){ return tankRank().n; }
function tankOkBonus(){ return tankRank().lv >= 1 ? 0.3 : 0; }
function tankAddSaga(n, stone){
  if(!S || S.charId!=='tank') return;
  const before = tankRank().lv;
  S.saga = (S.saga||0) + (n||0);
  if(stone){ S.sagaStones = (S.sagaStones||[]).concat([stone]).slice(-8); }
  const after = tankRank();
  if(after.lv > before){
    addLog('⚔ THE SAGA GROWS — you are now '+after.n+' ('+after.perk+')');
    floatText('⚔ '+after.n, '#d4841a');
    setTimeout(()=>epicToast('⚔ RANK UP · '+after.n+' — '+after.perk.toUpperCase()), 500);
    if(after.lv >= 3){ S.bloodied = false; S.chugMisses = 0; }
  }
}


function computeEpicTitle(){
  if(!S || !S.charId) return '';
  const ch = CHARS.find(c=>c.id===S.charId);
  const parts = [];
  if(S.charId === 'tank'){
    parts.push((ch ? ch.name : '') + ' — ' + tankRankLabel());
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
  // apply per-character body theme — but the title & character-select screens always stay in the tavern
  const _onTitle = ['boot','char'].some(id=>{ const e=document.getElementById('screen-'+id); return e && !e.classList.contains('hide'); });
  document.body.setAttribute('data-char', _onTitle ? '' : (S.charId || ''));
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
  const _el = (id) => document.getElementById(id);
  if(_el('stDrinks')) _el('stDrinks').textContent = S.drinks;
  if(_el('stFails'))  _el('stFails').textContent  = S.fails;
  if(_el('stWins'))   _el('stWins').textContent   = S.wins;
  if(_el('stSkips'))  _el('stSkips').textContent  = S.skips;
  if(_el('bagSkips')) _el('bagSkips').textContent = S.skips;
  const charNameEl = document.getElementById('hudCharName');
  if(charNameEl){
    const ch = CHARS.find(c=>c.id===S.charId);
    charNameEl.textContent = ch ? '· '+(S.charId==='jester' ? jkRank().n : S.charId==='tank' ? tankRankLabel() : ch.name) : '';
  }
  tickBreweryProduction();
  const tierNameEl = document.getElementById('brewTierName');
  if(tierNameEl) tierNameEl.textContent = breweryTierFor(S.level).name;
  // show only the right character special panel, hide the other
  const _tankChugEl   = document.getElementById('tankChug');
  const _gamblerDenEl = document.getElementById('gamblerDen');
  const _jesterDeckEl = document.getElementById('jesterDeck');
  const _wizCauldronEl = document.getElementById('wizardCauldron');
  if(S.charId==='gambler'){
    if(_tankChugEl)   _tankChugEl.classList.add('hide');
    if(_jesterDeckEl) _jesterDeckEl.classList.add('hide');
    if(_wizCauldronEl) _wizCauldronEl.classList.add('hide');
    refreshDen();
  } else if(S.charId==='tank'){
    if(_gamblerDenEl) _gamblerDenEl.classList.add('hide');
    if(_jesterDeckEl) _jesterDeckEl.classList.add('hide');
    if(_wizCauldronEl) _wizCauldronEl.classList.add('hide');
    refreshChug();
  } else if(S.charId==='jester'){
    if(_tankChugEl)   _tankChugEl.classList.add('hide');
    if(_gamblerDenEl) _gamblerDenEl.classList.add('hide');
    if(_wizCauldronEl) _wizCauldronEl.classList.add('hide');
    refreshJesterDeck();
  } else if(S.charId==='wizard'){
    if(_tankChugEl)   _tankChugEl.classList.add('hide');
    if(_gamblerDenEl) _gamblerDenEl.classList.add('hide');
    if(_jesterDeckEl) _jesterDeckEl.classList.add('hide');
    refreshCauldron();
  } else {
    if(_tankChugEl)   _tankChugEl.classList.add('hide');
    if(_gamblerDenEl) _gamblerDenEl.classList.add('hide');
    if(_jesterDeckEl) _jesterDeckEl.classList.add('hide');
    if(_wizCauldronEl) _wizCauldronEl.classList.add('hide');
  }
  const leverBtn = document.getElementById('btnSpin');
  if(leverBtn){
    const challengeActive = !!(S.currentTile && !S.resolved);
    const gamblerLocked = challengeActive || !!S._pendingWin;
    const tankLocked = challengeActive || !!S._tankPendingWin;
    const jesterLocked = challengeActive || !!S._jesterPendingWin || !!S.jkJuggle;
    const wizLocked = challengeActive || !!S._wizPendingWin;
    const isLocked = S.charId==='gambler' ? gamblerLocked : S.charId==='tank' ? tankLocked : S.charId==='jester' ? jesterLocked : S.charId==='wizard' ? wizLocked : challengeActive;
    leverBtn.disabled = isLocked;
    leverBtn.style.opacity = isLocked ? '0.35' : '';
    leverBtn.title = challengeActive ? 'Finish your challenge first' : S._pendingWin ? 'Resolve your Den bet first' : S._tankPendingWin ? 'Finish your chug first' : S._jesterPendingWin ? 'Draw your fate first' : S._wizPendingWin ? 'Bottle your potion first' : '';
  }
  // debt indicator — red when negative
  const coinsEl = document.getElementById('stCoins');
  if(coinsEl){
    const c = S.coins||0;
    coinsEl.textContent = c < 0 ? c+' IN DEBT' : c;
    coinsEl.style.color = c < 0 ? '#c03028' : '';
  }
  syncRollUI();
}

/* ---------- XP / level ---------- */
function grantXP(amount, why){
  const ch = CHARS.find(c=>c.id===S.charId);
  const tile = S.currentTile;
  let mult = 1;
  if(ch.id==='tank' && tile && tile.t===T.BEER) mult += .4 + 0.05*Math.min(3, (S.trophies||[]).length);
  if(ch.id==='tank' && tile && tile.t===T.SOCIAL) mult -= .25;
  if(ch.id==='gambler' && tile && tile.t===T.GAMBLE) mult += 1;
  if(ch.id==='gambler' && tile && tile.t===T.PHYS) mult -= .25;
  if(ch.id==='jester' && tile && tile.t===T.SOCIAL) mult += .3;
  if(ch.id==='jester' && tile && tile.t===T.BEER) mult -= .25;
  if(ch.id==='machine' && tile && tile.t===T.PHYS) mult += .5;
  if(ch.id==='machine' && tile && tile.t===T.GAMBLE) mult -= .25;
  if(ch.id==='wizard' && tile && tile.t===T.SHOT) mult += .4;    // shots are potions
  if(ch.id==='wizard' && tile && tile.t===T.SOCIAL) mult -= .25; // party games? he doesn't understand
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
const PERFECT_CHUG_LINES = [
  '⚡ YOUR ANCESTORS SMILE DOWN FROM THE HEAVENS — THIS IS WHY THEY DRANK',
  '⚡ THE VALHALLA GATES CREAK OPEN JUST A LITTLE — THEY ARE WATCHING',
  '⚡ ODIN HIMSELF RAISES THE GREAT HORN AND BELLOWS YOUR NAME INTO THE VOID',
  '⚡ THE VIKINGS OF OLD WEEP TEARS THEY NEVER KNEW THEY COULD WEEP',
  '⚡ YOUR BLOODLINE TREMBLES — EVERY ANCESTOR FEELS THIS THROUGH THE AGES',
  '⚡ THE MEAD RUNS UPHILL IN YOUR HONOR — NATURE YIELDS TO YOUR WILL',
  '⚡ THOR SETS DOWN HIS HAMMER. WHAT YOU JUST DID REQUIRES NO AID.',
  '⚡ THE GREAT SERPENT JÖRMUNGANDR PAUSES AND BOWS ITS ANCIENT HEAD',
  '⚡ RAVENS CIRCLE THE BAR — THEY CARRY WORD OF THIS TO THE ALLFATHER',
  '⚡ THE NORNS REWRITE YOUR FATE IN INK THAT WILL NOT FADE FOR CENTURIES',
  '⚡ FREYA RIDES ACROSS THE SKY AND SCATTERS GOLDEN TEARS OF JOY',
  '⚡ VALHALLA ERUPTS. THE EINHERJAR SLAM THEIR SHIELDS. THE WALLS SHAKE.',
  '⚡ FROM MIDGARD TO ASGARD THEY SPEAK OF THIS — YOUR NAME CARRIED ON THE WIND',
  '⚡ THE WORLD TREE SHUDDERS. YGGDRASIL KNOWS WHAT JUST HAPPENED.',
  '⚡ EVERY WARRIOR WHO EVER LIVED FEELS A WARMTH THEY CANNOT EXPLAIN',
  '⚡ THE SEA STILLS ITSELF — EVEN POSEIDON HOLDS HIS BREATH IN AWE',
  '⚡ THE FATES SEAL THIS MOMENT IN AMBER — IT WILL OUTLAST THE GODS THEMSELVES',
  '⚡ A CONSTELLATION IS BORN TONIGHT AND IT BEARS YOUR EXACT SHAPE',
  '⚡ THE DEAD IN HADES PAUSE THEIR WANDERING — THIS STORY REACHES EVEN THERE',
  '⚡ DIONYSUS WEEPS AND LAUGHS AT ONCE — HE HAS NEVER FELT SUCH PRIDE',
  '⚡ YOUR NAME WILL BE SPOKEN IN THE DRINKING HALLS OF GODS LONG AFTER THE STARS DIE',
  '⚡ THE OLD ONES STIR IN THEIR ETERNAL SLEEP — EVEN THEY FEEL IT',
  '⚡ ZEUS HURLS HIS THUNDERBOLT NOT IN ANGER — BUT IN CELEBRATION',
  '⚡ THE AURORA BOREALIS BLOOMS ABOVE AARHUS IN COLORS NEVER BEFORE SEEN',
  '⚡ THE LAST OF THE GREAT VIKINGS EXHALES IN PEACE — THEIR LINEAGE IS SECURE',
  '⚡ MOUNTAINS SHIFT IMPERCEPTIBLY. OCEANS DEEPEN IN RESPECT.',
  '⚡ YOUR FOREBEARS DID NOT DIE IN VAIN — THEY DIED THAT THIS CHUG MIGHT LIVE',
  '⚡ THE HORN OF GJALLARHORN SOUNDS ONCE — NOT AS WARNING, BUT AS SALUTE',
  '⚡ HEROES OF LEGEND COVER THEIR EYES — THEY CANNOT BEAR THE BRIGHTNESS OF YOUR GLORY',
  '⚡ THE AARHUS NIGHT SKY BENDS SLIGHTLY TOWARD YOU — EVEN GRAVITY PAYS RESPECTS'
];
const BEER_LOG_LINES = [
  '🍺 ZEUS HIMSELF RAISES A GLASS TO YOU',
  'THE OLYMPIANS DESCEND FROM MOUNT AARHUS TO WITNESS THIS',
  'POSEIDON WEEPS TEARS OF FOAM — MOVED BEYOND WORDS',
  'A LEGEND IS FORGED THIS NIGHT, AND THE NIGHT REMEMBERS',
  'DIONYSUS NAMES YOU HIS FAVORITE MORTAL — UNOFFICIALLY',
  'THE FATES WRITE THIS ONE INTO THE GREAT SCROLLS OF AARHUS',
  'ARES DROPS HIS SWORD TO APPLAUD. SLOWLY. REVERENTLY.',
  'THE ORACLE FORETOLD THIS EXACT MOMENT AND WEPT',
  'HERMES CARRIES THE NEWS ACROSS ALL OF CREATION',
  'A GOLDEN LAUREL DESCENDS GENTLY FROM THE HEAVENS',
  'THE GODS ARGUE OVER WHO GETS CREDIT. NONE ARE WORTHY.',
  'ATLAS SHRUGS, IMPRESSED DESPITE HIS MANY BURDENS',
  'THIS DEED ECHOES THROUGH THE MARBLE HALLS OF OLYMPUS',
  'HERACLES CONSIDERS THIS HIS THIRTEENTH AND GREATEST LABOR',
  'THE MUSES ABANDON ALL OTHER WORK AND BEGIN AN EPIC ABOUT THIS',
  'ZEUS THROWS A CELEBRATORY THUNDERBOLT — FULL OF LOVE',
  'APOLLO PAUSES THE SUN IN ITS ARC JUST TO WATCH',
  'A TEMPLE RISES IN YOUR HONOR EVEN AS YOU DRINK',
  'HADES ALLOWS A BRIEF FURLOUGH TO ALL SOULS — IN YOUR HONOR',
  'THE THREE FATES PUT DOWN THEIR THREAD AND CLAP',
  'ATHENA WRITES THIS DOWN IN HER PERSONAL JOURNAL',
  'A NEW CONSTELLATION TAKES YOUR SHAPE IN THE NIGHT SKY',
  'PROMETHEUS SAYS THE FIRE WAS STOLEN FOR THIS VERY MOMENT',
  'THE ORACLE OF DELPHI CANCELS ALL OTHER PROPHECIES TODAY',
  'MOUNT OLYMPUS TREMBLES NOT WITH ANGER — BUT WITH PRIDE',
  'A MINOR GOD IS PROMOTED JUST FOR HAVING WITNESSED THIS',
  'THE UNDERWORLD PAUSES ITS ETERNAL PUNISHMENTS OUT OF RESPECT',
  'ODYSSEUS TAKES NOTES. HE HAS NEVER SEEN SUCH BRAVERY.',
  'THE THUNDER ITSELF APPLAUDS — DISTANT, SINCERE, EMOTIONAL',
  'A LAUREL WREATH IS WOVEN AT IMPOSSIBLE SPEED IN YOUR HONOR',
  'SPARTA HEARS ABOUT THIS AND APPROVES WITHOUT CONDITIONS',
  'THE STARS THEMSELVES REARRANGE TO SPELL YOUR NAME TONIGHT',
  'EVERY ANCESTOR YOU HAVE EVER HAD RAISES THEIR GLASS AS ONE',
  'THE RIVERS OF AARHUS RUN A LITTLE COLDER WITH RESPECT',
  'ODIN LOOKS DOWN FROM VALHALLA AND NODS. JUST ONCE. IT IS ENOUGH.',
  'EVEN THE MEAD-HALLS OF THE DEAD GROW QUIET TO HEAR TELL OF THIS',
  'THE POETS OF A THOUSAND GENERATIONS WILL BORROW FROM THIS NIGHT',
  'YOUR BLOODLINE IS BLESSED SEVEN GENERATIONS FORWARD',
  'THE GREAT HORN IS SOUNDED AND THE HEAVENS ANSWER IN KIND',
  'WHOEVER COMES AFTER YOU WILL LIVE IN YOUR GOLDEN SHADOW'
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
    epicToast(BEER_LOG_LINES[Math.floor(Math.random()*BEER_LOG_LINES.length)]);
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
  const prev = S.souvenirs[type]||0;
  S.souvenirs[type] = prev + 1;
  const total = S.souvenirs[type];
  addLog(`${sv.icon} ${sv.n} — souvenir #${total} collected`);
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
    if(t.t===T.GAMBLE) gbAddWinnings(t.xp, 'gambling tile');
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
  // Jester: every win is a draw from the Deck of Many Fools
  if(S.charId === 'jester'){
    if(t.t===T.MOVE && S.relics.includes('shoes')){
      xpAmount *= 2; jkAddTrick(1, true);
      addLog('👟 The Shoes dance you out the door — ×2 XP and a free 🎭 Trick');
    }
    if(t.t===T.SOCIAL || t.t===T.KARAOKE) jkAddMirth(15, 'party');
    S._jesterPendingWin = { t, xpAmount, isRevenge };
    S.jkHand = null;
    save();
    refreshJesterDeck();
    setTimeout(()=>{ const d=document.getElementById('jesterDeck'); if(d) d.scrollIntoView({ behavior:'smooth', block:'center' }); }, 250);
    return;
  }
  // Wizard: brew the cauldron before awarding — unless wild magic polymorphs him
  if(S.charId === 'wizard'){
    const pw = { t, xpAmount, isRevenge };
    _wiz = null; wzPolyReset();
    wzMaybePolymorph(pw);
    S._wizPendingWin = pw;
    save();
    refreshCauldron();
    setTimeout(()=>{ const d=document.getElementById('wizardCauldron'); if(d) d.scrollIntoView({ behavior:'smooth', block:'center' }); }, 250);
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

/* ══════════════════════════════════════════════════════
   THE HIGH ROLLER'S LEDGER — the Gambler's progression bar
   Everything the Gambler WINS from gambling fills it (losses never subtract):
   Den coin profit, blackjack profit, bonus XP from winning XP wagers, and
   won gambling tiles. Each fill pays out an artifact: rare → epic →
   legendary → mythic → the ancestral relic.
   ══════════════════════════════════════════════════════ */
const GB_TIERS = [
  { tier:1, key:'rare',      label:'RARE',      col:'#38c2f2', target:40,  cls:'rarity-rare' },
  { tier:2, key:'epic',      label:'EPIC',      col:'#a45cff', target:80,  cls:'rarity-epic' },
  { tier:3, key:'legendary', label:'LEGENDARY', col:'#ffb62e', target:130, cls:'rarity-legendary' },
  { tier:4, key:'mythic',    label:'MYTHIC',    col:'#ff4a4a', target:190, cls:'rarity-mythic' },
  { tier:5, key:'ancestral', label:'ANCESTRAL', col:'#ffd24a', target:260, cls:'rarity-ancestral' }
];
function gbHas(id){ return !!(S && S.relics && S.relics.includes(id)); }
function gbAddWinnings(n, why){
  if(!S || S.charId!=='gambler') return;
  n = Math.round(n||0);
  if(n <= 0) return;
  S.gbWonTotal = (S.gbWonTotal||0) + n;
  if((S.gbTier||0) >= GB_TIERS.length) { save(); return; } // ledger complete
  S.gbLedger = (S.gbLedger||0) + n;
  S.gbPending = S.gbPending || [];
  let filled = false;
  while((S.gbTier||0) < GB_TIERS.length && S.gbLedger >= GB_TIERS[S.gbTier||0].target){
    S.gbLedger -= GB_TIERS[S.gbTier||0].target;
    S.gbTier = (S.gbTier||0) + 1;
    S.gbPending.push(S.gbTier);
    filled = true;
    const T_ = GB_TIERS[S.gbTier-1];
    addLog('📜 THE LEDGER FILLS — a '+T_.label+' artifact awaits');
  }
  if((S.gbTier||0) >= GB_TIERS.length) S.gbLedger = 0;
  floatText('+'+n+' 📜', '#e8c040');
  save();
  gbRenderLedger();
  if(filled) setTimeout(gbOfferWhenClear, 900);
}
function gbRenderLedger(){
  const box = document.getElementById('gbLedger'); if(!box || !S) return;
  const tier = S.gbTier||0, done = tier >= GB_TIERS.length;
  const cur = done ? GB_TIERS[GB_TIERS.length-1] : GB_TIERS[tier];
  const pct = done ? 100 : Math.min(100, (S.gbLedger||0)/cur.target*100);
  box.style.setProperty('--gbc', cur.col);
  const fill = document.getElementById('gbLedgerFill'); if(fill) fill.style.width = pct+'%';
  const num = document.getElementById('gbLedgerNum');
  if(num) num.textContent = done ? '★ THE HOUSE IS YOURS' : (S.gbLedger||0)+' / '+cur.target+' → '+cur.label;
  const tiers = document.getElementById('gbTiers');
  if(tiers){
    const h = GB_TIERS.map(T_ => {
      const got = tier >= T_.tier, next = !done && T_.tier===tier+1;
      return `<span class="gb-tier${got?' got':''}${next?' next':''}" style="--tc:${T_.col}">${got?'✓ ':''}${T_.label}</span>`;
    }).join('');
    if(tiers.innerHTML !== h) tiers.innerHTML = h;
  }
  const claim = document.getElementById('gbClaimBtn');
  if(claim) claim.classList.toggle('hide', !(S.gbPending && S.gbPending.length));
}
function gbOfferWhenClear(){
  if(!S || !(S.gbPending && S.gbPending.length)) return;
  if(document.getElementById('cardOverlay') || _denSpinning){ setTimeout(gbOfferWhenClear, 500); return; }
  gbOfferReward();
}
function gbOfferReward(){
  if(!S.gbPending || !S.gbPending.length) return;
  const tier = S.gbPending[0], T_ = GB_TIERS[tier-1];
  let opts = RELICS.filter(r => r.artifact===tier && !S.relics.includes(r.id));
  if(!opts.length){ S.gbPending.shift(); save(); gbRenderLedger(); return; }
  const optHTML = opts.map(r => `
    <div class="gb-opt" style="--tc:${T_.col}">
      <div class="gb-opt-icon">${ico(r.icon, 36)}</div>
      <div class="gb-opt-body">
        <div class="gb-opt-name">${r.n}</div>
        <div class="gb-opt-desc">${r.d}</div>
        <button class="btn gold sm" onclick="gbTakeArtifact('${r.id}')">${tier===5 ? '🎲 CLAIM YOUR BIRTHRIGHT' : '✋ TAKE IT'}</button>
      </div>
    </div>`).join('');
  showCard({
    cls: T_.cls,
    tag: '📜 THE LEDGER IS FULL · FILL '+tier+' OF 5',
    title: tier===5 ? 'THE ANCESTRAL RELIC' : 'CHOOSE A '+T_.label+' ARTIFACT',
    raw: `<p class="small" style="text-align:center">${tier===5 ? 'Five ledgers filled. Your grandfather would weep with pride. The family die is yours.' : 'The House pays its debts. Pick one — the other goes back in the vault.'}</p>${optHTML}`
  });
}
function gbTakeArtifact(id){
  const r = RELICS.find(x=>x.id===id); if(!r || !S.gbPending || !S.gbPending.length) return;
  if(r.artifact !== S.gbPending[0]) return;
  S.gbPending.shift();
  if(!S.relics.includes(id)) S.relics.push(id);
  const T_ = GB_TIERS[r.artifact-1];
  addLog('📜 '+T_.label+' ARTIFACT: '+r.n);
  closeCard();
  setTimeout(()=>epicToast(r.icon+' '+T_.label+' ARTIFACT — '+r.n), 250);
  if(id==='gb_chip') S.denSpinsLeft = (S.denSpinsLeft||0) + 1;
  save(); syncHUD(); refreshDen();
  if(S.gbPending.length) setTimeout(gbOfferWhenClear, 1400);
}
// the Den tables with artifacts applied (Rabbit's Foot shifts odds; the ancestral die turns LOSE into a push on XP wagers)
function denSegs(gameId){
  const g = DEN_GAMES[gameId]; if(!g || !g.segs) return [];
  let segs = g.segs.map(x => Object.assign({}, x));
  if(gbHas('gb_rabbit')){
    const lose = segs.find(x => x.mult===0);
    const best = segs.reduce((a,x)=> x.mult > a.mult ? x : a, segs[0]);
    if(lose && best && best!==lose){ const d = Math.min(0.10, lose.pct); lose.pct = +(lose.pct-d).toFixed(3); best.pct = +(best.pct+d).toFixed(3); }
  }
  if(gbHas('gb_ancestor') && S._pendingWin){
    segs = segs.map(x => x.mult===0 ? Object.assign(x, { mult:1, label:'PUSH', c:'#3a2a10', textCol:'#c8a060' }) : x);
  }
  return segs;
}
function gbXPMult(m){ return (m > 1 && gbHas('gb_golden')) ? m + 1 : m; }

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
  },
  blackjack: {
    id:'blackjack', icon:'🃏', name:'BLACKJACK', maxSpins:99, noRelic:true
    // No segs — blackjack uses its own card engine
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
  basic:  { id:'basic',  name:'BASIC CHUG',  attempts:1, minT:3, maxT:9,  perfect:0.4,  ok:1.0, perfectBonus:false },
  iron:   { id:'iron',   name:'IRON CHUG',   attempts:2, minT:4, maxT:11, perfect:0.55, ok:1.2, perfectBonus:false, relic:'ironthroat' },
  horn:   { id:'horn',   name:'HORN CHUG',   attempts:3, minT:5, maxT:13, perfect:0.7,  ok:1.5, perfectBonus:true,  relic:'vikinghorn' },
  legend: { id:'legend', name:'LEGEND MODE', attempts:4, minT:6, maxT:15, perfect:0.85, ok:1.8, perfectBonus:true,  relic:'meadaltar', tripleXP:true },
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
  if(tolerEl) tolerEl.textContent = '±'+mode.perfect+'s PERFECT · ±'+(Math.round((mode.ok+tankOkBonus())*100)/100)+'s OK · MISS = 0 XP';

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

  // Rank label + the Saga
  const rankLbl = document.getElementById('chugRankLbl');
  if(rankLbl) rankLbl.innerHTML = 'RANK · <b>'+tankRankLabel()+'</b>';
  tankRenderSaga();
  tankRenderDuel();

  // Chug-mode tiles — the whole ladder, current one lit, locked ones name their relic
  const upEl = document.getElementById('chugUpgrades');
  if(upEl){
    const MODE_ICON = { basic:'🍺', iron:'🫗', horn:'📯', legend:'⚗️' };
    const html = Object.values(CHUG_MODES).map(m=>{
      const locked = m.relic && !(S.relics && S.relics.includes(m.relic));
      const active = m.id === mode.id;
      const relic = m.relic ? RELICS.find(r=>r.id===m.relic) : null;
      const sub = locked ? '🔒 '+(relic ? relic.n.split(' ').slice(-1)[0] : 'SHOP') : m.attempts+' TR'+(m.attempts>1?'IES':'Y')+(m.tripleXP?' · 3×':'');
      return `<div class="lh-mode${active?' on':''}${locked?' locked':''}"><span class="i">${ico(MODE_ICON[m.id]||'🍺',16)}</span><span class="n">${m.name.replace(' CHUG','').replace(' MODE','')}</span><span class="s">${sub}</span></div>`;
    }).join('');
    if(upEl.innerHTML !== html) upEl.innerHTML = html;
  }
}

function tankRenderSaga(){
  const r = tankRank(), next = TANK_RANKS[r.lv+1], p = S.saga||0;
  const fill = document.getElementById('sagaFill');
  const lbl = document.getElementById('sagaNum');
  const pct = next ? Math.min(100, (p - r.need) / (next.need - r.need) * 100) : 100;
  if(fill) fill.style.width = pct+'%';
  if(lbl) lbl.textContent = next ? p+' / '+next.need+' → '+next.n.replace('THE ','') : '★ '+p+' — A LEGEND';
  const st = document.getElementById('sagaStones');
  if(st){
    const h = (S.sagaStones||[]).map(x => `<i class="lh-stone ${x}" title="${({p:'perfect',o:'ok',m:'miss',d:'duel win'})[x]}"></i>`).join('');
    if(st.innerHTML !== h) st.innerHTML = h;
  }
  const pk = document.getElementById('sagaPerk');
  if(pk) pk.textContent = next ? 'NEXT PERK: '+next.perk.toUpperCase() : 'EVERY PERFECT PAYS 3×';
}
function tankDuelReady(){ return S.duelLap == null || S.duelLap !== S.laps; }
function tankRenderDuel(){
  const box = document.getElementById('duelBox'); if(!box) return;
  const d = S.duels || { w:0, l:0, d:0 };
  const tro = S.trophies || [];
  const ready = tankDuelReady();
  const html = `
    <div class="cw-tagrow" style="justify-content:flex-start;margin-top:0">
      <span class="cw-tag">🏆 <b>${d.w}</b> WON · <b>${d.l}</b> LOST${d.d?' · '+d.d+' DRAWN':''}</span>
      ${S.tankDuelBoost ? '<span class="cw-tag" style="border-color:#ffd24a;color:#ffd24a">⚔ NEXT CHALLENGE ×2</span>' : ''}
    </div>
    <button class="btn ${ready?'primary':'ghost'} sm" onclick="duelOpen()" ${ready && _chugPhase!=='going' ? '' : 'disabled'}>${ready ? '⚔ CHALLENGE A SQUADMATE' : '⏳ NEXT CHUG-OFF ON THE NEXT LAP'}</button>
    <div class="lh-trophies">
      <span class="lbl">🏆 TROPHY WALL</span>
      ${tro.length ? tro.map((n,i)=>`<span class="lh-trophy${i<3?' paid':''}">${escapeHtml(n)}${i<3?' · +5% 🍺':''}</span>`).join('') : '<span class="dim" style="font-size:7px">No heads on the wall yet. Beat a squadmate to hang one.</span>'}
    </div>`;
  if(box.innerHTML !== html) box.innerHTML = html;
}
let _duel = null;
function duelOpen(){
  if(!S || S.charId!=='tank') return;
  if(_chugPhase==='going'){ toast('FINISH YOUR CHUG FIRST'); return; }
  if(!tankDuelReady()){ toast('ONE CHUG-OFF PER LAP — KEEP PULLING THE LEVER'); return; }
  _duel = { opp:'', target: 4 + Math.floor(Math.random()*5), phase:'setup', tankT:null, oppT:null, t0:0 };
  duelRender();
}
function duelPickName(n){ const i = document.getElementById('duelName'); if(i) i.value = n; }
function duelRender(){
  const d = _duel; if(!d) return;
  const me = S.name || 'THE TANK';
  if(d.phase==='setup'){
    const recent = (S.duelNames||[]).slice(-6);
    showCard({
      cls:'boss', tag:'⚔ THE CHUG-OFF', title:'CALL SOMEONE OUT',
      raw:`<p class="small">Pick a squadmate. You both chug to the <b class="gold">same target time</b> while a third person runs the timer — nobody looks at the clock. Closest to the target wins.</p>
        <div class="lh-duel-target">${d.target}<small>s</small></div>
        <input type="text" id="duelName" maxlength="10" placeholder="THEIR NAME" autocomplete="off" value="${escapeHtml(d.opp)}">
        ${recent.length ? `<div class="cw-tagrow">${recent.map(n=>`<button class="lh-namechip" onclick="duelPickName('${escapeHtml(n).replace(/'/g,'&#39;')}')">${escapeHtml(n)}</button>`).join('')}</div>` : ''}
        <div class="lh-duel-stakes"><span class="w">WIN · next challenge ×2 · +20🪙 · a trophy</span><span class="l">LOSE · you take the forfeit</span></div>`,
      buttons:`<button class="btn primary" onclick="duelBegin()">⚔ BEGIN — ${escapeHtml(me)} CHUGS FIRST</button>
               <button class="btn ghost sm" onclick="duelCancel()">◀ BACK DOWN</button>`
    });
  } else if(d.phase==='tank' || d.phase==='opp'){
    const who = d.phase==='tank' ? me : d.opp;
    showCard({
      cls:'boss', tag:'⚔ THE CHUG-OFF · ROUND '+(d.phase==='tank'?'1':'2')+' OF 2', title: escapeHtml(who)+' — CHUG FOR '+d.target+'s',
      raw:`<div class="lh-duel-target">${d.target}<small>s</small></div>
        <p class="small" style="text-align:center">Timekeeper: tap <b class="gold">START</b> when ${escapeHtml(who)} starts drinking, <b class="gold">STOP</b> when the glass hits the table.</p>
        <div id="duelStatus" class="lh-duel-status">${d.phase==='opp' ? '🔒 '+escapeHtml(me)+'’S TIME IS LOCKED IN' : '&nbsp;'}</div>`,
      buttons:`<button class="btn primary big" id="duelBtn" onclick="duelTap()">🍺 START</button>`
    });
  } else if(d.phase==='reveal'){
    const tOff = Math.abs(d.tankT - d.target), oOff = Math.abs(d.oppT - d.target);
    const draw = Math.abs(tOff - oOff) < 0.05, win = !draw && tOff < oOff;
    d.result = draw ? 'draw' : win ? 'win' : 'loss';
    const row = (name, t, off, crown) => `<div class="lh-duel-row${crown?' win':''}"><span class="n">${crown?'👑 ':''}${escapeHtml(name)}</span><span class="t">${t.toFixed(2)}s</span><span class="o">${off<0.005?'DEAD ON':(off.toFixed(2)+'s off')}</span></div>`;
    showCard({
      cls: win ? 'good' : draw ? '' : 'forfeit',
      tag:'⚔ THE CHUG-OFF · TARGET '+d.target+'s',
      title: win ? 'VICTORY!' : draw ? 'DEAD HEAT' : 'DEFEAT',
      raw:`${row(me, d.tankT, tOff, win)}${row(d.opp, d.oppT, oOff, !win && !draw)}
        <p class="small" style="text-align:center;margin-top:8px">${win ? 'Another head for the Trophy Wall. Your next challenge pays double.' : draw ? 'Too close to call. Both of you drink — nobody wins, everybody wins.' : escapeHtml(d.opp)+' out-chugged you. The forfeit is yours.'}</p>`,
      buttons:`<button class="btn ${win?'gold':draw?'ghost':'red'}" onclick="duelFinish()">${win ? '🏆 CLAIM THE SPOILS' : draw ? '🍻 BOTH DRINK' : '🍺 TAKE THE FORFEIT'}</button>`
    });
  }
}
function duelBegin(){
  const inp = document.getElementById('duelName');
  const nm = ((inp && inp.value) || '').trim().toUpperCase();
  if(!nm){ toast('WHO ARE YOU CALLING OUT?'); return; }
  if(nm === (S.name||'').toUpperCase()){ toast('YOU CAN\'T DUEL YOURSELF. PROBABLY.'); return; }
  _duel.opp = nm; _duel.phase = 'tank';
  S.duelLap = S.laps; // the duel is on — this lap's challenge is spent
  save(); refreshChug(); duelRender();
}
function duelCancel(){ _duel = null; closeCard(); }
function duelTap(){
  const d = _duel; if(!d) return;
  const btn = document.getElementById('duelBtn'), st = document.getElementById('duelStatus');
  if(!d.t0){
    d.t0 = Date.now();
    if(btn) btn.textContent = '🛑 STOP';
    if(st) st.innerHTML = '<span class="lh-duel-going">🍺 CHUGGING…</span>';
    return;
  }
  const el = (Date.now() - d.t0) / 1000; d.t0 = 0;
  if(d.phase==='tank'){ d.tankT = el; d.phase = 'opp'; }
  else { d.oppT = el; d.phase = 'reveal'; }
  duelRender();
}
function duelFinish(){
  const d = _duel; if(!d || d.phase!=='reveal') return;
  _duel = null; closeCard();
  S.duels = S.duels || { w:0, l:0, d:0 };
  S.duelNames = (S.duelNames||[]).filter(n => n!==d.opp).concat([d.opp]).slice(-8);
  // the Tank's own chug still carves the saga
  const mode = chugGetMode(), off = Math.abs(d.tankT - d.target);
  if(off <= mode.perfect){ S.perfectChugs = (S.perfectChugs||0) + 1; tankAddSaga(3, 'p'); }
  else if(off <= mode.ok + tankOkBonus()) tankAddSaga(1, 'o');
  else tankAddSaga(0, 'm');
  if(d.result==='win'){
    S.duels.w++;
    S.tankDuelBoost = true;
    grantCoins(20);
    tankAddSaga(3, 'd');
    const isNew = !(S.trophies||[]).includes(d.opp);
    if(isNew) S.trophies = (S.trophies||[]).concat([d.opp]);
    addLog('⚔ CHUG-OFF — beat '+d.opp+' ('+d.tankT.toFixed(2)+'s vs '+d.oppT.toFixed(2)+'s, target '+d.target+'s)');
    setTimeout(()=>epicToast(isNew && S.trophies.length<=3 ? '🏆 '+d.opp+' HANGS ON THE TROPHY WALL — +5% BEER XP, FOREVER' : '⚔ '+d.opp+' DEFEATED — NEXT CHALLENGE PAYS DOUBLE'), 300);
  } else if(d.result==='loss'){
    S.duels.l++;
    addLog('⚔ CHUG-OFF — lost to '+d.opp+' ('+d.tankT.toFixed(2)+'s vs '+d.oppT.toFixed(2)+'s, target '+d.target+'s)');
    setTimeout(()=>drawForfeit(null), 300);
  } else {
    S.duels.d++;
    addLog('⚔ CHUG-OFF — dead heat with '+d.opp);
    toast('🍻 DEAD HEAT — BOTH OF YOU DRINK');
  }
  save(); syncHUD(); checkAchievements(); refreshChug();
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
  const _rk = tankRank().lv;
  if(diff <= mode.perfect){
    const triple = mode.tripleXP || _rk >= 4; // THE LEGEND: every perfect pays 3×
    mult = triple ? 3 : 2.5;
    label = triple ? '🏆 LEGENDARY CHUG!' : '⚡ PERFECT!';
    color = '#d4841a';
    S.rage = Math.min(100, (S.rage||0) + (_rk >= 2 ? 45 : 30));
    S.chugMisses = 0;
    S.bloodied = false;
    S.perfectChugs = (S.perfectChugs||0) + 1;
    tankAddSaga(3, 'p');
    if(S.rage >= 100) floatText('🔥 RAGE FULL!', '#d4841a');
  } else if(diff <= mode.ok + tankOkBonus()){
    mult = 1;
    label = '— COUNTS. BARELY.';
    color = '#8a7060';
    S.rage = _rk >= 2 ? Math.min(100, (S.rage||0) + 5) : Math.max(0, (S.rage||0) - 5);
    tankAddSaga(1, 'o');
  } else {
    tankAddSaga(0, 'm');
    mult = 0;
    label = elapsed < target ? '💧 TOO FAST — KEEP DRINKING' : '💧 SPILLED — TOO LONG';
    color = '#c03028';
    S.rage = Math.max(0, (S.rage||0) - 20);
    // bloodied only accumulates during real XP wager chugs, not idle practice — and never for a Warlord
    if(hasPending && _rk < 3){
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
        setTimeout(()=>epicToast(PERFECT_CHUG_LINES[Math.floor(Math.random()*PERFECT_CHUG_LINES.length)]), 600);
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
  const chugQuality = xpMult; // how the chug itself went — the card celebrates this, not the boosted total
  const boosts = [];
  if(xpMult > 0){
    // Apply rage/bloodied modifiers upfront so card shows real numbers
    if(!isSafe && (S.rage||0) >= 100){
      boosts.push('🔥 RAGE ×3');
      xpMult *= 3;
      S.rage = 0;
      S.rageActivations = (S.rageActivations||0) + 1;
      floatText('🔥 BERSERKER RAGE!', '#d4841a');
    } else if(isSafe && (S.rage||0) >= 100){
      toast('🔥 RAGE HELD — land a real chug to unleash it');
    }
    if(S.bloodied){ xpMult *= 0.7; boosts.push('🩸 WOUNDS −30%'); }
    if(S.tankDuelBoost){ xpMult *= 2; S.tankDuelBoost = false; boosts.push('⚔ DUEL SPOILS ×2'); floatText('⚔ DUEL SPOILS ×2', '#ffd24a'); addLog('⚔ Chug-Off spoils — this challenge paid double'); }
    const finalXP = Math.round(xpAmount * xpMult);
    if(chugQuality >= 2){
      // Perfect or legendary — show a celebration card before granting XP
      const isLegendary = chugQuality >= 3;
      const epicLine = PERFECT_CHUG_LINES[Math.floor(Math.random()*PERFECT_CHUG_LINES.length)];
      const coinsGained = Math.max(5, Math.round(t.xp/2));
      window._pendingChugXP = { finalXP, xpMult, quality:chugQuality, tileName:t.n, isRevenge, coinsGained, t, isSafe };
      save(); syncHUD();
      showCard({
        cls:'good',
        tag: isLegendary ? '🏆 LEGENDARY CHUG' : '⚡ PERFECT CHUG',
        title: isLegendary ? 'LEGENDARY!' : 'PERFECT!',
        body: epicLine,
        chips: ['+'+finalXP+' XP', '×'+xpMult.toFixed(1)+' MULTIPLIER', coinsGained+'🪙'].concat(boosts).filter(Boolean),
        buttons:`<button class="btn green" onclick="chugClaimXP()">✓ CLAIM IT</button>`
      });
      return;
    }
    // Ok or safe — show card before granting XP
    const coinsGained = Math.max(5, Math.round(t.xp/2));
    const isSafeLabel = isSafe ? 'SAFE TAKE' : '— COUNTS. BARELY.';
    window._pendingChugXP = { finalXP, xpMult, quality:chugQuality, tileName:t.n, isRevenge, coinsGained, t, isSafe };
    save(); syncHUD();
    showCard({
      cls:'',
      tag: isSafe ? '🛡 SAFE TAKE' : '— OK CHUG',
      title: isSafe ? 'XP SECURED' : 'COUNTS. BARELY.',
      body: isSafe ? 'You played it safe. The XP is yours — no glory, no shame.' : 'Got it down. Not the stuff of legend, but it is in the log.',
      chips: ['+'+finalXP+' XP', coinsGained+'🪙'].concat(boosts),
      buttons:`<button class="btn green" onclick="chugClaimXP()">✓ TAKE IT</button>`
    });
    return;
  } else {
    // Miss — show card, no XP
    const coinsGained = Math.max(5, Math.round(t.xp/2));
    window._pendingChugXP = { finalXP:0, xpMult:0, tileName:t.n, isRevenge:false, coinsGained, t, isSafe:false };
    floatText('SPILLED', '#5a9aff');
    addLog('💧 '+t.n+' — spilled the chug. No XP lost.');
    save(); syncHUD();
    showCard({
      cls:'forfeit',
      tag:'💧 SPILLED',
      title:'MISSED',
      body:'Too fast. Too slow. Either way it ended on the floor. Forfeit skipped — drink your beer and try again.',
      chips:['0 XP', coinsGained+'🪙 ANYWAY'],
      buttons:`<button class="btn ghost" onclick="chugClaimXP()">WALK IT OFF</button>`
    });
    return;
  }
  _chugCleanup(t);
}
function chugClaimXP(){
  const p = window._pendingChugXP;
  if(!p) return;
  window._pendingChugXP = null;
  closeCard();
  if(p.finalXP > 0){
    const g = grantXP(p.finalXP, p.tileName);
    const q = p.quality != null ? p.quality : p.xpMult;
    if(q >= 3)      { addLog('🏆 LEGENDARY — '+p.tileName+' ×'+p.xpMult.toFixed(1)+' = +'+g+' XP'); floatText('LEGENDARY', '#ffd24a'); }
    else if(q >= 2) { addLog('⚡ PERFECT CHUG — '+p.tileName+' ×'+p.xpMult.toFixed(1)+' = +'+g+' XP'); floatText('⚡ PERFECT', '#d4841a'); }
    else                   { addLog((p.isSafe?'✓ SAFE':'✅ CHUG')+' — '+p.tileName+' ×'+p.xpMult.toFixed(1)+' = +'+g+' XP'); }
  } else {
    addLog('💧 '+p.tileName+' — spilled. No XP.');
  }
  if(p.isRevenge){ addLog('⚔ REVENGE served via chug.'); toast('⚔ REVENGE SERVED!'); }
  _chugCleanup(p.t, p.coinsGained);
}
function _chugCleanup(t, coinsGained){
  if(t.drink){ S.drinks++; addPace(t.t===T.SHOT?16:12); }
  if(t.heal) { S.waters++; addPace(-t.heal); }
  S.badLuckHeat = Math.max(0, (S.badLuckHeat||0)-1);
  grantSouvenir(t.t);
  grantCoins(coinsGained !== undefined ? coinsGained : Math.max(5, Math.round(t.xp/2)));
  chugResetAttempts();
  save(); syncHUD(); checkAchievements();
  refreshChug();
  if(t.t===T.BOSS) S.shopPending = true;
  maybeOpenShop();
}

function denGetMaxSpins(){
  if(_denGame === 'blackjack') return 99;
  return DEN_GAMES[_denGame].maxSpins + (gbHas('gb_chip') ? 1 : 0);
}
function denResetSpins(){
  S.denSpinsLeft = denGetMaxSpins();
  S.gbHouseUsed = false; // House Money refreshes every round
  save();
}

let _denGame = 'wheel';
let _denBet  = 10;
let _denSpinning = false;

function denIsUnlocked(gameId){
  const g = DEN_GAMES[gameId];
  if(g.noRelic) return true;
  return !g.relic || (S.relics && S.relics.includes(g.relic));
}

function denSetGame(id){
  if(!denIsUnlocked(id)){ toast('🔒 BUY IT IN THE SHOP FIRST'); return; }
  _denGame = id;
  // Reset spins for the new game (idle mode only; during a wager keep current session)
  // Don't reset spin count on game switch — only reset when entering fresh coin mode
  refreshDen();
}

function denAdjustBet(delta){
  const coins = S.coins||0;
  const hasShark = (S.relics||[]).includes('loanshark');
  const maxBet = hasShark ? 50 : (coins > 0 ? coins : 0);
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
      if(spinBtn){
        spinBtn.textContent = game.icon+' SPIN FOR XP';
        spinBtn.disabled = false;
        spinBtn.style.opacity = '';
      }
    } else {
      xpRow.classList.add('hide'); coinRow.classList.remove('hide');
      if(safeBtn) safeBtn.classList.add('hide');
      const safeRow2 = document.getElementById('denSafeRow');
      if(safeRow2) safeRow2.style.display = 'none';
      const coins = S.coins||0;
      const hasShark = (S.relics||[]).includes('loanshark');
      // with loan shark: bet up to 50 regardless of balance; otherwise clamp to what they have
      const maxBet = hasShark ? 50 : Math.max(1, coins);
      _denBet = Math.max(1, Math.min(_denBet, maxBet));
      const noSpins = (S.denSpinsLeft ?? denGetMaxSpins()) <= 0;
      const inDebt  = coins < 0;
      const broke   = coins === 0 && !hasShark;
      const sharkInDebt = hasShark && inDebt;
      if(spinBtn){
        if(inDebt && !hasShark) spinBtn.textContent = '🚫 IN DEBT — NO GAMBLING';
        else if(broke)          spinBtn.textContent = '🪙 NO COINS TO BET';
        else if(sharkInDebt)    spinBtn.textContent = game.icon+' SPIN IN DEBT ('+_denBet+'🪙)';
        else                    spinBtn.textContent = game.icon+' SPIN ('+_denBet+'🪙)';
        spinBtn.disabled = noSpins || (inDebt && !hasShark) || broke;
        spinBtn.style.opacity = (noSpins || (inDebt && !hasShark) || broke) ? '0.4' : '';
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
    const tabs = Object.values(DEN_GAMES).map(g => {
      const locked = !denIsUnlocked(g.id);
      const active = g.id === _denGame;
      return `<button class="den-tab${active?' on':''}${locked?' locked':''}" onclick="denSetGame('${g.id}')">
        <span class="i">${ico(g.icon,16)}</span><span class="n">${g.name==='HORSESHOE'?'SHOE':g.name==='BLACKJACK'?'21':g.name}${locked?' 🔒':''}</span>
      </button>`;
    }).join('');
    if(gamesEl.innerHTML !== tabs) gamesEl.innerHTML = tabs;
  }
  // spins-left pips + running tally
  const pipsEl = document.getElementById('denSpinPips');
  if(pipsEl){
    if(_denGame==='blackjack' || hasPending) pipsEl.innerHTML = hasPending ? '<span style="color:#e8c040">XP ON THE TABLE</span>' : '∞';
    else {
      const mx = denGetMaxSpins(), lf = Math.max(0, S.denSpinsLeft ?? mx);
      pipsEl.innerHTML = Array.from({length:mx},(_,i)=>`<span class="${i<lf?'':'off'}">●</span>`).join('');
    }
  }
  const statEl = document.getElementById('denStatLbl');
  if(statEl) statEl.innerHTML = '🎲 <b>'+(S.gambleWins||0)+'</b> WON · 📜 <b>'+(S.gbWonTotal||0)+'</b> TOTAL';
  gbRenderLedger();

  // Blackjack mode: toggle wheel canvas vs bj table
  const bjTableEl  = document.getElementById('bjTable');
  const canvasWrap = document.querySelector('#gamblerDen .bj-canvas-wrap');
  const arrowPip   = document.querySelector('#gamblerDen [style*="border-top:14px"]');
  const isBJ = _denGame === 'blackjack';

  // The canvas container (arrow + canvas)
  const canvasEl = document.getElementById('denCanvas');
  const canvasParent = canvasEl ? canvasEl.parentElement : null; // .den-wheelwrap (pointer + wheel)
  if(canvasParent) canvasParent.style.display = isBJ ? 'none' : '';
  // hide result + wheel bet rows when bj active
  const denResEl = document.getElementById('denResult');
  if(denResEl) denResEl.style.display = isBJ ? 'none' : '';
  const denXPEl  = document.getElementById('denXPRow');
  if(denXPEl && isBJ) denXPEl.classList.add('hide');
  const denCoinEl = document.getElementById('denCoinRow');
  if(denCoinEl) denCoinEl.style.display = isBJ ? 'none' : '';
  const denActEl = document.getElementById('denActions');
  if(denActEl) denActEl.style.display = isBJ ? 'none' : '';
  // show/hide bj table
  if(bjTableEl){ bjTableEl.style.display = isBJ ? '' : 'none'; if(isBJ && !_bj) bjRender(); }
  // mode label
  if(modeLbl && isBJ) modeLbl.textContent = 'BLACKJACK';

  // draw idle wheel (only when not in blackjack mode)
  if(!_denSpinning && !isBJ) denPaintWheel(_denGame, 0);
}

/* ══════════════════════════════════════════════════════
   BLACKJACK — pixel-art card engine for the Gambler's Den
   ══════════════════════════════════════════════════════ */
let _bj = null; // active blackjack hand state

function bjNewDeck(){
  const suits = ['♠','♥','♦','♣'];
  const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const deck = [];
  suits.forEach(s => ranks.forEach(r => deck.push({r,s})));
  for(let i=deck.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [deck[i],deck[j]]=[deck[j],deck[i]];
  }
  return deck;
}

function bjVal(hand){
  let v=0, aces=0;
  hand.forEach(c=>{
    if(c.r==='A'){aces++;v+=11;}
    else if(['J','Q','K'].includes(c.r)) v+=10;
    else v+=parseInt(c.r);
  });
  while(v>21&&aces>0){v-=10;aces--;}
  return v;
}

function bjCardHTML(c, faceDown, isNew){
  const nc = isNew ? ' bj-new' : '';
  if(faceDown) return `<div class="bj-card back${nc}">🂠</div>`;
  const red = c.s==='♥'||c.s==='♦';
  return `<div class="bj-card${red?' red':''}${nc}">
    <span class="bj-rank-top">${c.r}</span>
    <span class="bj-suit-mid">${c.s}</span>
    <span class="bj-rank-bot">${c.r}</span>
  </div>`;
}

function bjStart(){
  if(!S||S.charId!=='gambler') return;
  const bet = Math.min(_denBet, S.coins||0);
  if((S.coins||0)<1){
    const el=document.getElementById('bjTable');
    if(el) el.innerHTML='<div class="bj-result-banner" style="color:#c84040">NO COINS 💸</div>';
    return;
  }
  const deck = bjNewDeck();
  _bj = { deck, bet, player:[], dealer:[], phase:'dealing', result:null, _newHand:'', _newIdx:-1 };
  S.coins -= bet;
  syncHUD(); save();
  bjRender();

  const D = 360; // ms between each card
  // Deal order: player, dealer, player, dealer(face-down)
  const steps = [
    ()=>{ _bj._newHand='player'; _bj.player.push(_bj.deck.pop()); bjRender(); },
    ()=>{ _bj._newHand='dealer'; _bj.dealer.push(_bj.deck.pop()); bjRender(); },
    ()=>{ _bj._newHand='player'; _bj.player.push(_bj.deck.pop()); bjRender(); },
    ()=>{ _bj._newHand='dealer'; _bj.dealer.push(_bj.deck.pop()); bjRender();
          // After last card, check blackjack then open player turn
          setTimeout(()=>{
            _bj._newHand=''; _bj._newIdx=-1;
            if(bjVal(_bj.player)===21){
              _bj.phase='done'; _bj.result='blackjack';
              const gain=Math.floor(_bj.bet*(gbHas('gb_sleeve') ? 4 : gbHas('gb_tell') ? 3 : 2.5));
              gbAddWinnings(gain - _bj.bet, 'blackjack');
              S.coins+=gain;
              addLog(`🃏 BLACKJACK! Natural 21 — +${gain} 🪙`);
              syncHUD(); save();
            } else {
              _bj.phase='player';
            }
            bjRender();
          }, 300);
        }
  ];
  steps.forEach((fn,i)=>setTimeout(fn, D*(i+1)));
}

function bjHit(){
  if(!_bj||_bj.phase!=='player') return;
  _bj._newHand='player';
  _bj.player.push(_bj.deck.pop());
  if(bjVal(_bj.player)>21){
    _bj.phase='done'; _bj.result='bust';
    addLog(`🃏 Blackjack — BUST. Lost ${_bj.bet} 🪙`);
    syncHUD(); save();
  }
  bjRender();
  _bj._newHand='';
}

function bjStand(){
  if(!_bj||_bj.phase!=='player') return;
  // Lock player actions immediately
  _bj.phase='dealer';
  // Snapshot dealer hand length before drawing extras
  _bj._dealerRevealed = _bj.dealer.length; // typically 2 (hole card flip is index 1)
  _bj._newHand='dealer'; // mark hole card as "new" so it gets the flip animation
  bjRender(); // first render: flip hole card, show actions disabled
  _bj._newHand='';

  // Draw extra dealer cards one by one with delay, then settle
  function dealerStep(){
    if(bjVal(_bj.dealer)<17){
      setTimeout(()=>{ _bj._newHand='dealer'; _bj.dealer.push(_bj.deck.pop()); bjRender(); _bj._newHand=''; dealerStep(); }, 420);
    } else {
      // Settle after a short pause so the last card is visible
      setTimeout(()=>{
        const pv=bjVal(_bj.player), dv=bjVal(_bj.dealer);
        if(dv>21||pv>dv){
          _bj.result='win';
          const gain=_bj.bet*(gbHas('gb_sleeve') ? 3 : 2);
          gbAddWinnings(gain - _bj.bet, 'blackjack');
          S.coins+=gain;
          addLog(`🃏 Blackjack — WIN! +${gain} 🪙`);
        } else if(pv===dv){
          _bj.result='push';
          S.coins+=_bj.bet;
          addLog(`🃏 Blackjack — PUSH. Bet returned.`);
        } else {
          _bj.result='lose';
          addLog(`🃏 Blackjack — DEALER WINS. Lost ${_bj.bet} 🪙`);
        }
        _bj.phase='done';
        syncHUD(); save(); bjRender();
      }, 320);
    }
  }
  // Give the hole-card flip animation time to play before drawing more
  setTimeout(dealerStep, 340);
}

function bjDouble(){
  if(!_bj||_bj.phase!=='player') return;
  const canDouble = (S.coins||0)>=_bj.bet;
  if(canDouble){ S.coins-=_bj.bet; _bj.bet*=2; syncHUD(); }
  _bj._newHand='player'; _bj.player.push(_bj.deck.pop()); _bj._newHand='';
  if(bjVal(_bj.player)>21){
    _bj.phase='done'; _bj.result='bust';
    addLog(`🃏 Blackjack — BUST (doubled). Lost ${_bj.bet} 🪙`);
    syncHUD(); save(); bjRender();
  } else {
    bjStand();
  }
}

function bjAdjBet(delta){
  const coins = S ? (S.coins||0) : 0;
  const hasShark = (S&&S.relics||[]).includes('loanshark');
  const max = hasShark ? 50 : Math.max(1, coins);
  _denBet = Math.max(1, Math.min(max, _denBet + delta));
  // Update the den bet display too
  const denBetEl = document.getElementById('denBetAmt');
  if(denBetEl) denBetEl.textContent = _denBet;
  // Re-render idle table
  if(!_bj) bjRender();
}

function bjRender(){
  const el=document.getElementById('bjTable');
  if(!el) return;
  if(!_bj){
    const coins=S?S.coins||0:0;
    el.innerHTML=`
      <div class="bj-section">
        <div class="bj-label">DEALER</div>
        <div class="bj-hand" style="opacity:.25">
          <div class="bj-card back">🂠</div>
          <div class="bj-card back">🂠</div>
        </div>
      </div>
      <div class="bj-divider"></div>
      <div class="bj-section">
        <div class="bj-hand" style="opacity:.25">
          <div class="bj-card back">🂠</div>
          <div class="bj-card back">🂠</div>
        </div>
        <div class="bj-label">PLAYER</div>
      </div>
      <div class="bj-divider" style="margin:6px 0"></div>
      <div class="bj-bet-row">
        <button class="btn ghost sm" onclick="bjAdjBet(-5)" style="padding:2px 10px;font-size:13px">−</button>
        <div style="text-align:center;flex:1">
          <div class="bj-label" style="margin-bottom:1px">BET</div>
          <div class="bj-bet-badge" id="bjBetDisplay" style="font-size:14px">${_denBet} 🪙</div>
          <div style="font-size:8px;color:#5a4030;letter-spacing:1px;margin-top:1px">${coins} avail</div>
        </div>
        <button class="btn ghost sm" onclick="bjAdjBet(5)" style="padding:2px 10px;font-size:13px">+</button>
      </div>
      <div class="bj-action-row" style="margin-top:6px">
        <button class="btn primary" onclick="bjStart()" style="letter-spacing:2px;flex:1">🃏 DEAL</button>
      </div>`;
    return;
  }

  const pv=bjVal(_bj.player);
  const dv=bjVal(_bj.dealer);
  const showDealer = _bj.phase!=='player' && _bj.phase!=='dealing';
  // Only the most recently dealt card gets the flip animation
  const newHand = _bj._newHand || '';
  const dealerLastIdx = _bj.dealer.length - 1;
  const playerLastIdx = _bj.player.length - 1;
  const dealerCards=_bj.dealer.map((c,i)=>{
    const faceDown = i===1 && !showDealer && !gbHas('gb_tell'); // the Dealer's Tell shows the hole card
    // During dealing: new = last card in this hand. During stand: hole card (i===1) is "new"
    const isNew = newHand==='dealer'
      ? (i===dealerLastIdx)                          // freshly dealt/drawn
      : (_bj.phase==='dealer' && i===1 && showDealer && _bj.dealer.length===2); // hole-card reveal (caught above via _newHand but fallback)
    return bjCardHTML(c, faceDown, isNew);
  }).join('');
  const playerCards=_bj.player.map((c,i)=>{
    const isNew = newHand==='player' && i===playerLastIdx;
    return bjCardHTML(c,false,isNew);
  }).join('');
  const visibleDV=showDealer?dv:(_bj.dealer.length?bjVal([_bj.dealer[0]]):0);

  let banner='', actions='';
  const rmap={win:'🏆 YOU WIN!',blackjack:'🎉 BLACKJACK!',bust:'💥 BUST!',lose:'☠ DEALER WINS',push:'🤝 PUSH'};
  const rcol={win:'#d4a820',blackjack:'#ffd700',bust:'#c84040',lose:'#c84040',push:'#8a8a8a'};

  if(_bj.phase==='dealing'){
    actions=`<div style="text-align:center;color:#8a6a44;font-size:10px;letter-spacing:2px;padding:8px">DEALING…</div>`;
  } else if(_bj.phase==='player'){
    if(pv>21){
      banner=`<span style="color:#c84040">💥 BUST!</span>`;
    } else if(pv===21){
      banner=`<span style="color:#ffd700">⭐ 21!</span>`;
    }
    const canDouble=(S&&(S.coins||0)>=_bj.bet)&&_bj.player.length===2;
    actions=`
      <button class="btn primary" onclick="bjHit()">HIT</button>
      <button class="btn ghost" onclick="bjStand()">STAND</button>
      ${canDouble?'<button class="btn ghost" onclick="bjDouble()" style="font-size:9px">2×</button>':''}
    `;
  } else if(_bj.phase==='dealer'){
    // Dealer playing — show spinner, no player actions
    actions=`<div style="text-align:center;color:#8a6a44;font-size:10px;letter-spacing:2px;padding:8px">DEALER DRAWING…</div>`;
  } else {
    const r=_bj.result;
    banner=`<span style="color:${rcol[r]}">${rmap[r]||''}</span>`;
    actions=`<button class="btn primary" onclick="_bj=null;bjRender();" style="width:100%">🃏 DEAL AGAIN</button>`;
  }

  el.innerHTML=`
    <div class="bj-section">
      <div class="bj-score-row"><span class="dim">DEALER</span><span class="gold">${visibleDV}</span></div>
      <div class="bj-hand">${dealerCards}</div>
    </div>
    <div class="bj-divider"></div>
    <div class="bj-section">
      <div class="bj-hand">${playerCards}</div>
      <div class="bj-score-row"><span class="dim">YOU</span><span class="gold">${pv}</span><span class="bj-bet-badge">BET ${_bj.bet}🪙</span></div>
    </div>
    ${banner?`<div class="bj-result-banner">${banner}</div>`:'<div style="height:8px"></div>'}
    <div class="bj-action-row">${actions}</div>
  `;
}


/* ══════════════════════════════════════════════════════
   THE JESTER — THE DECK OF MANY FOOLS
   Every won challenge is a draw: cards are dealt face-down
   onto the stage, you pick one, it decides the payout.
   🎭 TRICKS  — spend to PEEK at a card or SHUFFLE the hand.
   🔔 MIRTH   — fills from chaos, failure & bad cards; at 100%
                the next draw is the GRAND JEST (all face-up).
   ⚜ RANKS   — the court promotes you as you draw; each rank
                adds a permanent perk.
   ══════════════════════════════════════════════════════ */
/* ── THE MAJOR ARCANA — the Jester's deck is built from these 22 cards ──
   num = position in the arcana · sym = the card's traditional emblem
   mult = XP multiplier · tileBonus = mult on specific tile types · special = custom rule */
const JK_TAROT = {
  fool:       { num:0,  numeral:'0',     name:'THE FOOL',           sym:'🃏', rarity:'epic',      price:65, mult:1, special:'fool',
    desc:"Your patron card. It turns into a copy of the BEST other card on the table — effects and all. If the hand is rubbish, so is the Fool.",
    title:'THE FOOL LEAPS', flavor:'He steps off the cliff whistling and lands, somehow, on the best card in the room.' },
  magician:   { num:1,  numeral:'I',     name:'THE MAGICIAN',       sym:'♾️', rarity:'epic',      price:55, mult:2,
    desc:'Double XP. As above, so below — as in the glass, so in the belly.',
    title:'AS ABOVE, SO BELOW', flavor:'One hand to the heavens, one hand on the tap. Double XP.' },
  priestess:  { num:2,  numeral:'II',    name:'THE HIGH PRIESTESS', sym:'📜', rarity:'common',    price:20, mult:1, reroll:1, mirth:10,
    desc:'Full XP and a free 🔁 reroll. She already knows what the reels will say — and whispers it to you.',
    title:'BEHIND THE VEIL', flavor:'She lifts the veil a finger-width. A free reroll slips out.' },
  empress:    { num:3,  numeral:'III',   name:'THE EMPRESS',        sym:'♀️', rarity:'rare',      price:35, mult:1, coinsMult:3, mirth:5,
    desc:'Full XP and TRIPLE coins. Abundance, harvest, and a bar tab that somehow pays itself.',
    title:'ABUNDANCE', flavor:'The fields are golden and so is your purse. Triple coins.' },
  emperor:    { num:4,  numeral:'IV',    name:'THE EMPEROR',        sym:'♈', rarity:'epic',      price:50, mult:1.5, tileBonus:{ [T.BOSS]:3 },
    desc:'×1.5 XP — ×3 on BOSS FIGHTS. The throne does not lose to a foosball table.',
    title:'THE THRONE SPEAKS', flavor:'Order, law and a crown that fits suspiciously well.' },
  hierophant: { num:5,  numeral:'V',     name:'THE HIEROPHANT',     sym:'🗝️', rarity:'rare',      price:35, mult:1, tileBonus:{ [T.BEER]:2, [T.SHOT]:2 },
    desc:"×2 XP on BEER and SHOT tiles, ×1 on everything else. Tradition says the Jester can't drink. Tradition is wrong.",
    title:'THE OLD WAYS', flavor:'He holds the keys to the cellar, and he hands them to you.' },
  lovers:     { num:6,  numeral:'VI',    name:'THE LOVERS',         sym:'💕', rarity:'rare',      price:35, mult:1.5, tileBonus:{ [T.SOCIAL]:2, [T.KARAOKE]:2 }, mirth:10,
    desc:'×1.5 XP — ×2 on party & social tiles — and +10 🔔 Mirth. Arms around the squad, one song too many.',
    title:'A PERFECT MATCH', flavor:'You and the squad, in harmony. Mostly in tune.' },
  chariot:    { num:7,  numeral:'VII',   name:'THE CHARIOT',        sym:'🐎', rarity:'rare',      price:40, mult:1.25, extraNext:1,
    desc:'×1.25 XP, and your NEXT draw deals one extra card. Momentum is a strategy.',
    title:'FULL GALLOP', flavor:'The horses do not stop, and neither do you.' },
  strength:   { num:8,  numeral:'VIII',  name:'STRENGTH',           sym:'🦁', rarity:'rare',      price:35, mult:1.5, tileBonus:{ [T.PHYS]:2.5 },
    desc:'×1.5 XP — ×2.5 on PHYSICAL DUELS. Gentle hands, iron grip, suspiciously good at darts.',
    title:'THE LION TAMED', flavor:'A calm hand on the lion’s jaw, and a calmer one on the dartboard.' },
  hermit:     { num:9,  numeral:'IX',    name:'THE HERMIT',         sym:'🏮', rarity:'rare',      price:40, mult:1, hermitNext:2, mirth:5,
    desc:'Full XP, and his lantern lights your NEXT draw: two cards are dealt face-up.',
    title:'THE LANTERN', flavor:'He raises his lamp. The next hand has nowhere to hide.' },
  wheel:      { num:10, numeral:'X',     name:'WHEEL OF FORTUNE',   sym:'☸️', rarity:'rare',      price:30, mult:1.5,
    desc:'×1.5 XP. The wheel turns, and tonight it turns your way.',
    title:'THE WHEEL TURNS', flavor:'Round and round — and it stops on you.' },
  justice:    { num:11, numeral:'XI',    name:'JUSTICE',            sym:'⚖️', rarity:'common',    price:20, mult:1.25, trick:1, mirth:5,
    desc:'×1.25 XP and a 🎭 Trick up your sleeve. Fair and square — mostly.',
    title:'FAIR AND SQUARE', flavor:'The scales balance. A little trick drops out of the pan.' },
  hanged:     { num:12, numeral:'XII',   name:'THE HANGED MAN',     sym:'🙃', rarity:'cursed',    price:10, mult:0.6, mirth:25,
    desc:'Only ×0.6 XP — but the crowd loves watching you dangle: +25 🔔 Mirth.',
    title:'HANGING AROUND', flavor:'Upside down, pockets empty, crowd delighted.' },
  death:      { num:13, numeral:'XIII',  name:'DEATH',              sym:'💀', rarity:'epic',      price:45, mult:1.5, freeBurn:1,
    desc:'×1.5 XP and a free 🔥 BURN — remove any card from your deck in the Bag. Every ending makes room.',
    title:'THE CLEAN SLATE', flavor:'Not an ending — a pruning. Something in your deck will not survive the night.' },
  temperance: { num:14, numeral:'XIV',   name:'TEMPERANCE',         sym:'🫗', rarity:'common',    price:25, mult:1.25, reroll:1,
    desc:'×1.25 XP and a free 🔁 reroll. Pouring between two cups and spilling neither.',
    title:'THE STEADY POUR', flavor:'Not a drop spilled. The reels owe you one.' },
  devil:      { num:15, numeral:'XV',    name:'THE DEVIL',          sym:'😈', rarity:'epic',      price:50, mult:3, devil:true,
    desc:'×3 XP. The Devil always collects: take a shot, right now, no bargaining.',
    title:'A DEAL IS A DEAL', flavor:'Triple XP. He smiles and slides a shot glass across the table.' },
  tower:      { num:16, numeral:'XVI',   name:'THE TOWER',          sym:'⚡', rarity:'cursed',    price:5,  mult:0.25, mirth:40,
    desc:'Lightning, rubble, ×0.25 XP. But oh, how the court ROARS: +40 🔔 Mirth.',
    title:'THE TOWER FALLS', flavor:'Lightning. Rubble. Applause.' },
  tower_r:    { num:16.5, numeral:'XVI', name:'THE TOWER · REVERSED', sym:'🪙', rarity:'rare',  mult:1, coins:25, mirth:30, hidden:true,
    desc:"Your Fool's Sceptre flips the Tower: full XP, +25 coins and +30 🔔 Mirth.",
    title:'DISASTER, AVERTED', flavor:'The Sceptre laughs, the Tower lands the other way up, and coins rain out of it.' },
  star:       { num:17, numeral:'XVII',  name:'THE STAR',           sym:'⭐', rarity:'epic',      price:60, mult:2, mirth:20,
    desc:'×2 XP and +20 🔔 Mirth. Hope, wishes, and a very good night.',
    title:'WISH GRANTED', flavor:'You wished on it. It listened. Double XP.' },
  moon:       { num:18, numeral:'XVIII', name:'THE MOON',           sym:'🌙', rarity:'epic',      price:45, mult:1, doubleNext:true, mirth:10,
    desc:'Full XP now — and your NEXT tile pays DOUBLE. Illusions, dreams, and a plan.',
    title:'THE MOON RISES', flavor:'Nothing is what it seems — especially your next tile.' },
  sun:        { num:19, numeral:'XIX',   name:'THE SUN',            sym:'☀️', rarity:'legendary', price:90, mult:3, coins:20,
    desc:'×3 XP and +20 coins. Radiant, total, deeply obnoxious victory.',
    title:'THE COURT KNEELS', flavor:'Every head in the tavern turns. It is, briefly, your kingdom.' },
  judgement:  { num:20, numeral:'XX',    name:'JUDGEMENT',          sym:'📯', rarity:'epic',      price:45, mult:1.5, special:'judgement',
    desc:'×1.5 XP — ×3 if your LAST draw was The Tower or The Hanged Man. The trumpet sounds for the fallen.',
    title:'RISE AGAIN', flavor:'The trumpet sounds, and the fool who fell gets up grinning.' },
  world:      { num:21, numeral:'XXI',   name:'THE WORLD',          sym:'🌍', rarity:'legendary', price:110, mult:2.5, trick:1, reroll:1,
    desc:'×2.5 XP, +1 🎭 Trick and +1 🔁 reroll. Completion. The whole town is yours.',
    title:'THE WHOLE TOWN', flavor:'The dance is complete. Every tavern door swings open for you.' }
};
Object.keys(JK_TAROT).forEach(k => { JK_TAROT[k].id = k; JK_TAROT[k].icon = JK_TAROT[k].sym; });
// cards from older saves (before the deck went tarot) map onto their arcana
const JK_ALIAS = { king:'sun', joker:'magician', lucky:'wheel', rogue:'empress', scales:'justice', mask:'priestess', swap:'hanged', curse:'tower', foolsgold:'tower_r' };
const JK_STARTER = ['sun','magician','magician','moon','wheel','wheel','wheel','empress','empress','justice','justice','priestess','priestess','hanged','hanged','tower','tower'];
const JK_MAX_COPIES = 3;   // legendaries cap at 2
const JK_BURN_COST = 25;   // coins to burn a card from your deck (Death gives free burns)
const JK_MIN_DECK = 8;
const JK_SAFE = { id:'safe', num:-1, numeral:'—', name:'SAFE TAKE', sym:'🛡', icon:'🛡', mult:1, coins:0, mirth:0, rarity:'common', title:'SAFE TAKE', flavor:'No draw, no drama. The court yawns politely.' };
const JK_RANKS = [
  { lv:0, n:'THE FOOL',          req:'Where every jester starts',              perk:'Base deck — 3 cards, 3 Tricks max' },
  { lv:1, n:'THE JONGLEUR',      req:'2 draws',                                perk:'Hold up to 4 🎭 Tricks' },
  { lv:2, n:'THE MOTLEY MASTER', req:'5 draws, or draw The Sun',               perk:'Curses can never pay less than ×0.5' },
  { lv:3, n:'LORD OF MISRULE',   req:'10 draws, or 3 Grand Jests',             perk:'Grand Jest pays +50% on the card you pick' },
  { lv:4, n:'THE KING OF FOOLS', req:'18 draws, 3 Suns or 5 Grand Jests',      perk:'The Sun pays ×4' }
];

let _jkBusy = false, _jkDealUntil = 0, _jkFlipUntil = 0, _jkFlip = new Set(), _jkLastHtml = '', _jkPortraitFrame = 0;

function jkStats(){ if(!S.jkStats) S.jkStats = { draws:0, kings:0, curses:0, grand:0, peeks:0, shuffles:0 }; return S.jkStats; }
function jkRank(){
  const st = jkStats(), d = st.draws||0, k = st.kings||0, g = st.grand||0;
  let lv = 0;
  if(d>=2) lv = 1;
  if(d>=5 || k>=1) lv = 2;
  if(d>=10 || g>=3) lv = 3;
  if(d>=18 || k>=3 || g>=5) lv = 4;
  return JK_RANKS[lv];
}
function jkMaxTricks(){ return jkRank().lv>=1 ? 4 : 3; }
function jkHandSize(){ return 3 + (S.relics.includes('stolencrown') ? 1 : 0); }
function jkDeck(){
  if(!Array.isArray(S.jkDeck) || !S.jkDeck.length) S.jkDeck = JK_STARTER.slice();
  S.jkDeck = S.jkDeck.map(id => JK_ALIAS[id] || id).filter(id => JK_TAROT[id] && !JK_TAROT[id].hidden);
  return S.jkDeck;
}
function jkCopies(id){ return jkDeck().filter(x => x===id).length; }
function jkMaxCopies(id){ const c = JK_TAROT[id]; return c && c.rarity==='legendary' ? 2 : JK_MAX_COPIES; }
function jkCardPrice(id){ const c = JK_TAROT[id]; return Math.round(c.price * (1 + 0.5*jkCopies(id))); }
function jkDrawId(id){ return (id==='tower' && S.relics.includes('marotte')) ? 'tower_r' : id; } // what a deck card becomes when dealt
function jkHandChance(id, n){ // chance at least one copy shows up in an n-card hand
  const deck = jkDeck(), N = deck.length, k = deck.filter(x => x===id).length;
  n = Math.min(n, N); if(!k) return 0;
  let p = 1; for(let i=0;i<n;i++) p *= Math.max(0, (N-k-i)) / (N-i);
  return 1 - p;
}
function jkDeckEV(){ const d = jkDeck(); return d.reduce((a,id)=>a + jkCardById(jkDrawId(id)).mult, 0) / d.length; }

function jkCardById(id){
  id = JK_ALIAS[id] || id;
  if(id==='safe') return JK_SAFE;
  return JK_TAROT[id] || JK_SAFE;
}

function jkCheckRankUp(){
  const r = jkRank();
  if(r.lv > (S.jkRankLv||0)){
    S.jkRankLv = r.lv;
    addLog('⚜ The court names you '+r.n+' — '+r.perk);
    setTimeout(()=>epicToast('⚜ RANK UP · '+r.n+' — '+r.perk.toUpperCase()), 700);
  }
}
function jkAddMirth(n, why){
  if(!S || S.charId!=='jester' || n<=0) return;
  if(S.relics.includes('jokerscap')) n = Math.round(n*1.5);
  if(S.jkGrand) return; // already brimming — the Grand Jest is waiting
  S.mirth = Math.min(100, (S.mirth||0) + n);
  if(S.mirth >= 100){
    S.jkGrand = true;
    addLog('🔔 Mirth overflows — the GRAND JEST is ready');
    setTimeout(()=>epicToast('⚜ THE GRAND JEST IS READY — YOUR NEXT DRAW IS DEALT FACE-UP'), 300);
  } else if(why){
    floatText('+'+n+' MIRTH', '#e0457b');
  }
  save(); refreshJesterDeck(); // stage + meters, so "DRAW" becomes "PLAY THE GRAND JEST" immediately
}
function jkAddTrick(n, overflow){
  const cap = jkMaxTricks() + (overflow ? 2 : 0);
  S.tricks = Math.min(cap, Math.max(S.tricks||0, (S.tricks||0) + n));
  jkUpdateMeters();
}

/* ---------- dealing ---------- */
function jkBuildPool(){ // every physical card in your deck; the Stolen Crown makes The Sun twice as likely
  const crown = S.relics.includes('stolencrown');
  return jkDeck().map(id => ({ id: jkDrawId(id), w: (id==='sun' && crown) ? 2 : 1 }));
}

function jkDrawCards(n){
  const pool = jkBuildPool(), out = [];
  for(let k=0; k<n && pool.length; k++){
    const tot = pool.reduce((a,c)=>a+c.w, 0);
    let r = Math.random()*tot, i = 0;
    for(; i<pool.length-1; i++){ r -= pool[i].w; if(r<=0) break; }
    out.push(pool[i].id); pool.splice(i,1);
  }
  if(S.jkWildNext){
    S.jkWildNext = false;
    const strong = id => jkCardById(id).mult >= 2;
    if(!out.some(strong)){
      const mine = pool.filter(c => strong(c.id));
      out[Math.floor(Math.random()*out.length)] = mine.length ? mine[Math.floor(Math.random()*mine.length)].id : 'magician';
    }
    addLog('🃏 The Wild Card was waiting in the deck');
  }
  for(let i=out.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [out[i],out[j]]=[out[j],out[i]]; }
  return out;
}

function jkDeal(grand){
  const ids = jkDrawCards(jkHandSize() + (S.jkExtraNext ? 1 : 0));
  S.jkExtraNext = 0;
  const revealed = ids.map(()=>!!grand);
  if(!grand){
    const reveal = (S.relics.includes('markedcards') ? 1 : 0) + (S.jkHermitNext || 0);
    const order = ids.map((_,i)=>i).sort(()=>Math.random()-0.5);
    order.slice(0, reveal).forEach(i => revealed[i] = true);
  }
  S.jkHermitNext = 0;
  S.jkHand = { cards:ids, revealed, picked:null, grand:!!grand };
  // cards arrive face-down, then any pre-revealed ones flip once they land
  const now = Date.now();
  _jkDealUntil = now + ids.length*120 + 560;
  _jkFlip = new Set(revealed.map((r,i)=>r?i:-1).filter(i=>i>=0));
  _jkFlipUntil = _jkDealUntil + 500;
  save(); refreshJesterDeck();
  setTimeout(refreshJesterDeck, _jkDealUntil - now + 20);
  setTimeout(refreshJesterDeck, _jkFlipUntil - now + 20);
}

function jkDrawHand(){
  if(!S._jesterPendingWin || S.jkHand || S.jkClaim) return;
  const grand = !!S.jkGrand;
  if(grand){
    S.jkGrand = false; S.mirth = 0; jkStats().grand++;
    addLog('⚜ THE GRAND JEST — the whole deck laid bare');
    jkBurst(['✨','⚜','🔔','♦'], 14);
  }
  jkDeal(grand);
}
function jkTakeSafe(){
  if(!S._jesterPendingWin || S.jkHand) return;
  jkResolve(JK_SAFE, false);
}

/* ---------- tricks ---------- */
function jkPeek(){
  const h = S.jkHand; if(!h || h.picked!==null || _jkBusy) return;
  if((S.tricks||0)<=0){ toast('🎭 NO TRICKS LEFT — THEY REFILL EVERY LAP'); return; }
  const hidden = h.revealed.map((r,i)=>r?-1:i).filter(i=>i>=0);
  if(!hidden.length){ toast('EVERY CARD IS ALREADY SHOWING'); return; }
  S.tricks--; jkStats().peeks++;
  const i = hidden[Math.floor(Math.random()*hidden.length)];
  h.revealed[i] = true;
  _jkFlip = new Set([i]); _jkFlipUntil = Date.now()+500;
  addLog('👁 Peeked at the deck: '+jkCardById(h.cards[i]).name);
  save(); refreshJesterDeck();
  setTimeout(refreshJesterDeck, 520);
}
function jkShuffle(){
  const h = S.jkHand; if(!h || h.picked!==null || _jkBusy) return;
  if((S.tricks||0)<=0){ toast('🎭 NO TRICKS LEFT — THEY REFILL EVERY LAP'); return; }
  S.tricks--; jkStats().shuffles++;
  addLog('🔀 Shuffled the hand back into the deck');
  jkDeal(h.grand);
}

/* ---------- the pick ---------- */
function jkPick(i){
  const h = S.jkHand; if(!h || h.picked!==null || _jkBusy) return;
  _jkBusy = true;
  h.picked = i;
  const already = h.revealed[i];
  h.revealed[i] = true;
  if(!already){ _jkFlip = new Set([i]); _jkFlipUntil = Date.now()+500; }
  save(); refreshJesterDeck();
  setTimeout(()=>{
    const rest = [];
    h.revealed.forEach((r,j)=>{ if(!r){ h.revealed[j] = true; rest.push(j); } });
    if(rest.length){ _jkFlip = new Set(rest); _jkFlipUntil = Date.now()+500; }
    save(); refreshJesterDeck();
    jkBurstFor(jkCardById(h.cards[i]));
    setTimeout(()=>{ _jkBusy = false; jkResolve(jkCardById(h.cards[i]), h.grand); }, 950);
  }, already ? 380 : 700);
}
function jkFinishPicked(){ // recovery after a reload mid-reveal
  const h = S.jkHand; if(!h || h.picked===null) return;
  jkResolve(jkCardById(h.cards[h.picked]), h.grand);
}

function jkEval(card, ctx){ // → { eff: the card whose effects apply, mult, note }
  let eff = card, note = '';
  if(card.special==='fool'){
    let best = null, bestM = -1;
    (ctx.handIds||[]).forEach((id,i)=>{
      if(i===ctx.pickIdx) return;
      const c = jkCardById(id); if(c.special==='fool') return;
      const m = jkEval(c, ctx).mult; if(m > bestM){ bestM = m; best = c; }
    });
    if(!best || bestM <= 1) return { eff:card, mult:1, note:'NOTHING WORTH COPYING' };
    eff = best; note = 'THE FOOL BECOMES '+best.name;
  }
  let mult = eff.mult;
  if(eff.tileBonus && ctx.t && eff.tileBonus[ctx.t.t]!=null){ mult = eff.tileBonus[ctx.t.t]; if(!note) note = 'TILE BONUS ×'+mult; }
  if(eff.special==='judgement' && (ctx.lastId==='tower' || ctx.lastId==='hanged')){ mult = 3; note = 'RISEN FROM '+jkCardById(ctx.lastId).name; }
  return { eff, mult, note };
}
function jkResolve(card, grand){
  const pw = S._jesterPendingWin;
  if(!pw) return;
  const h = S.jkHand;
  const ctx = { t:pw.t, handIds: h ? h.cards : [], pickIdx: h ? h.picked : -1, lastId: S.jkLastCard };
  S._jesterPendingWin = null;
  S.jkHand = null;
  const { t, xpAmount, isRevenge } = pw;
  const rank = jkRank().lv;
  const ev = card.id==='safe' ? { eff:JK_SAFE, mult:1, note:'' } : jkEval(card, ctx);
  const eff = ev.eff;
  let mult = ev.mult;
  const notes = ev.note ? [ev.note] : [];
  if(eff.id==='sun' && rank>=4){ mult = 4; notes.push('KING OF FOOLS ×4'); }
  if(mult<0.5 && rank>=2){ mult = 0.5; notes.push('MOTLEY MASTER — CURSE SOFTENED'); }
  if(grand && rank>=3 && card.id!=='safe'){ mult = Math.round(mult*1.5*100)/100; notes.push('GRAND JEST +50%'); }
  const finalXP = Math.round(xpAmount*mult);
  const baseCoins = Math.max(5, Math.round(t.xp/2));
  const coins = Math.round(baseCoins*(eff.coinsMult||1)) + (eff.coins||0);
  if(card.id!=='safe'){
    const st = jkStats(); st.draws++;
    if(eff.id==='sun') st.kings++;
    if(card.id==='tower') st.curses++;
    S.jkLastCard = eff.id;
  }
  const mirthBefore = S.mirth||0, grandBefore = !!S.jkGrand;
  if(eff.mirth) jkAddMirth(eff.mirth);
  const mirthGained = S.jkGrand && !grandBefore ? (100-mirthBefore) : (S.mirth||0) - mirthBefore;
  addLog(`${card.sym||card.icon} ${card.numeral && card.id!=='safe' ? card.numeral+' · ' : ''}${card.name}${eff!==card?' → '+eff.name:''}${grand?' (GRAND JEST)':''} — ${t.n} ×${mult} = +${finalXP} XP`);
  if(isRevenge) addLog('⚔ REVENGE — beat '+t.n+' after it beat you.');
  S.jkClaim = { t, cardId:card.id, effId:eff.id, mult, finalXP, coins, grand:!!grand, isRevenge,
    reroll:eff.reroll||0, trick:eff.trick||0, doubleNext:!!eff.doubleNext, mirth:Math.max(0,mirthGained), notes,
    devil:!!eff.devil, freeBurn:eff.freeBurn||0, extraNext:eff.extraNext||0, hermitNext:eff.hermitNext||0 };
  jkCheckRankUp();
  save(); syncHUD();
  jkShowResult();
}

function jkShowResult(){
  const c = S.jkClaim; if(!c) return;
  const card = jkCardById(c.cardId), eff = jkCardById(c.effId || c.cardId);
  const clsMap = { legendary:'rarity-legendary', epic:'rarity-epic', rare:'rarity-rare', common:'', cursed: eff.id==='tower' ? 'curse' : 'chaos' };
  const good = c.mult >= 1;
  const chips = [
    '+'+c.finalXP+' XP',
    c.cardId==='safe' ? '' : '×'+c.mult,
    c.coins+'🪙',
    c.mirth ? '+'+c.mirth+' 🔔 MIRTH' : '',
    c.trick ? '+'+c.trick+' 🎭 TRICK' : '',
    c.reroll ? '+'+c.reroll+' 🔁 REROLL' : '',
    c.doubleNext ? '🌙 NEXT TILE ×2' : '',
    c.extraNext ? '🐎 NEXT DRAW +1 CARD' : '',
    c.hermitNext ? '🏮 NEXT DRAW: 2 FACE-UP' : '',
    c.freeBurn ? '+1 🔥 FREE BURN' : '',
    c.devil ? '😈 TAKE A SHOT' : '',
    c.grand ? '⚜ GRAND JEST' : ''
  ].concat(c.notes||[]).filter(Boolean);
  const btn = c.devil ? '😈 SHOT TAKEN — COLLECT' : (eff.rarity==='cursed' ? '🔔 TAKE A BOW' : (good ? '⚜ COLLECT' : 'TAKE IT'));
  const fooled = eff.id !== card.id;
  showCard({
    cls: clsMap[eff.rarity] || '',
    tag: c.cardId==='safe' ? '🛡 THE SAFE ROAD' : (c.grand ? '⚜ THE GRAND JEST · ' : '🃏 ') + card.numeral + ' · ' + card.name,
    title: fooled ? 'THE FOOL BECOMES '+eff.name : eff.title,
    raw: `<div class="jk-result-card">${jkCardHTML(card, { cls:'static', flip:true })}${fooled ? jkCardHTML(eff, { cls:'static' }) : ''}</div>
          <div class="jk-flavor">${fooled ? card.flavor : eff.flavor}</div>
          <div class="rewardRow" style="justify-content:center">${chips.map(x=>`<div class="chip">${x}</div>`).join('')}</div>`,
    buttons: `<button class="btn ${good?'gold':'ghost'}" onclick="jesterClaimXP()">${btn}</button>`
  });
}

function jesterClaimXP(){
  const p = S.jkClaim;
  if(!p) return;
  S.jkClaim = null;
  closeCard();
  const t = p.t;
  if(p.finalXP > 0) grantXP(p.finalXP, t.n);
  if(p.isRevenge) toast('⚔ REVENGE SERVED. '+t.n+' AVENGED.');
  if(p.doubleNext){ S.doubleNext = true; setTimeout(()=>toast('🌙 THE MOON RISES — YOUR NEXT TILE PAYS DOUBLE'), 400); }
  if(p.devil){ S.drinks++; addPace(16); addLog('😈 The Devil collected — one shot, taken'); }
  if(p.extraNext) S.jkExtraNext = 1;
  if(p.hermitNext) S.jkHermitNext = p.hermitNext;
  if(p.freeBurn){ S.jkFreeBurns = (S.jkFreeBurns||0) + p.freeBurn; setTimeout(()=>toast('💀 FREE BURN READY — REMOVE A CARD IN YOUR BAG'), 500); }
  if(t.drink){ S.drinks++; let pa=(t.t===T.SHOT?16:12); if(S.relics.includes('shades')) pa=Math.round(pa*0.8); addPace(pa); }
  if(t.heal){ S.waters++; addPace(-t.heal); }
  S.badLuckHeat = Math.max(0, (S.badLuckHeat||0)-1);
  grantSouvenir(t.t);
  grantCoins(p.coins);
  if(p.reroll) S.skips = (S.skips||0) + p.reroll;
  if(p.trick) jkAddTrick(p.trick, true);
  save(); syncHUD(); checkAchievements();
  refreshJesterDeck();
  if(t.t===T.BOSS) S.shopPending = true;
  maybeOpenShop();
}

/* ---------- visuals ---------- */
function jkMultLabel(card){
  if(card.special==='fool') return 'COPY';
  if(card.id==='sun' && S && jkRank().lv>=4) return '×4';
  if(card.special==='judgement') return '×1.5·×3';
  if(card.tileBonus){ const [k,v] = Object.entries(card.tileBonus)[0]; return '×'+card.mult+'·'+({boss:'⚔',beer:'🍺',phys:'🥊',social:'🎉'}[k]||'')+v; }
  if(card.coinsMult) return card.coinsMult+'×🪙';
  if(card.id==='moon') return '×1→×2';
  if(card.id==='tower_r') return '+25🪙';
  return '×'+card.mult;
}

function jkCardHTML(card, o){
  o = o || {};
  const inner = o.back
    ? `<div class="jkc-back"><div class="jkc-seal">⚜</div></div>`
    : `<div class="jkc-face${o.flip?' flip':''}">
         <span class="jkc-num">${card.numeral}</span>
         <span class="jkc-arch"><span class="jkc-icon">${card.sym||card.icon}</span></span>
         <span class="jkc-name">${card.name}</span>
         <span class="jkc-mult">${jkMultLabel(card)}</span>
       </div>`;
  const rc = o.back ? '' : ' r-'+card.rarity;
  return `<div class="jkc${rc} ${o.cls||''}"${o.onclick?` onclick="${o.onclick}"`:''}>${o.eye?'<span class="jkc-eye">👁</span>':''}${o.count?`<span class="jkc-count">×${o.count}</span>`:''}${inner}</div>`;
}

function jkPileHTML(state){
  return `<div class="jk-pile ${state}"${state==='ready'?' onclick="jkDrawHand()"':''}>`+
    [0,1,2,3].map(i=>`<div class="jkc-back" style="--o:${(3-i)*-2}px"><div class="jkc-seal">⚜</div></div>`).join('')+
  `</div>`;
}
function jkStage(inner, note){
  return `<div class="jk-stage"><div class="jk-valance"></div>${inner}<div class="jk-floor"></div>${note?`<div class="jk-note">${note}</div>`:''}</div>`;
}
function jkNextDrawTags(){
  const n = jkHandSize() + (S.jkExtraNext ? 1 : 0);
  const tags = [`<span class="jk-tag">NEXT DRAW · ${n} CARDS</span>`, `<span class="jk-tag">DECK · ${jkDeck().length}</span>`];
  if(S.jkGrand) tags.push('<span class="jk-tag gold">⚜ GRAND JEST</span>');
  else {
    if(S.relics.includes('markedcards')) tags.push('<span class="jk-tag">🎴 1 MARKED</span>');
    if(S.jkHermitNext) tags.push('<span class="jk-tag gold">🏮 2 FACE-UP</span>');
  }
  if(S.jkExtraNext) tags.push('<span class="jk-tag gold">🐎 +1 CARD</span>');
  if(S.jkWildNext) tags.push('<span class="jk-tag gold">🃏 STACKED</span>');
  if(S.relics.includes('marotte')) tags.push('<span class="jk-tag">🪄 TOWER REVERSED</span>');
  if(S.doubleNext) tags.push('<span class="jk-tag gold">🌙 NEXT TILE ×2</span>');
  if(S.jkFreeBurns) tags.push('<span class="jk-tag gold">🔥 '+S.jkFreeBurns+' FREE BURN</span>');
  return `<div class="jk-tags">${tags.join('')}</div>`;
}

function jkUpdateMeters(){
  if(!S || S.charId!=='jester') return;
  const r = jkRank();
  const rk = document.getElementById('jkRank'); if(rk) rk.innerHTML = 'RANK · <b>'+r.n+'</b>';
  const m = Math.round(S.jkGrand ? 100 : (S.mirth||0));
  const f = document.getElementById('jkMirthFill'); if(f) f.style.width = m+'%';
  const pct = document.getElementById('jkMirthPct'); if(pct) pct.textContent = S.jkGrand ? '⚜ GRAND JEST READY' : m+'%';
  const bar = document.getElementById('jkMirthBar'); if(bar) bar.classList.toggle('full', !!S.jkGrand);
  const pipsEl = document.getElementById('jkTrickPips');
  if(pipsEl){
    const max = jkMaxTricks(), have = S.tricks||0, n = Math.max(max, have);
    let h = '';
    for(let i=0;i<n;i++) h += `<span class="jk-pip${i<have?'':' off'}${i>=max?' extra':''}">🎭</span>`;
    if(pipsEl.innerHTML !== h) pipsEl.innerHTML = h;
  }
}
function refreshJesterDeck(){
  if(!S || S.charId!=='jester') return;
  const wrap = document.getElementById('jesterDeck'); if(wrap) wrap.classList.remove('hide');
  jkUpdateMeters();
  jkRender();
}
function jkRender(){
  const el = document.getElementById('jkArea'); if(!el) return;
  const now = Date.now();
  const pw = S._jesterPendingWin, h = S.jkHand;
  let html = '';
  if(S.jkClaim){
    const card = jkCardById(S.jkClaim.cardId);
    html = jkStage(jkCardHTML(card, { cls:'static picked' }), '') +
      `<div class="jk-hint">THE COURT AWAITS YOUR BOW</div>
       <div class="jk-actions"><button class="btn gold" onclick="jkShowResult()">⚜ COLLECT YOUR WINNINGS</button></div>`;
  } else if(S.jkJuggle){
    html = jkJuggleHTML();
  } else if(!pw && !h){
    html = jkStage(jkPileHTML('sleep'), 'THE DECK SLEEPS UNTIL YOU WIN') +
      jkNextDrawTags() +
      `<div class="jk-hint" style="color:#a891b8">WIN A CHALLENGE TO DRAW YOUR FATE</div>` +
      jkActIdleHTML();
  } else if(pw && !h){
    const grand = !!S.jkGrand;
    html = (grand ? `<div class="jk-grand">⚜ THE GRAND JEST — EVERY CARD FACE-UP ⚜</div>` : '') +
      jkStage(jkPileHTML('ready'), 'TAP THE DECK') +
      `<div class="jk-stake">XP ON THE LINE<b>${pw.xpAmount}</b></div>` +
      jkNextDrawTags() +
      `<div class="jk-actions">
         <button class="btn primary" onclick="jkDrawHand()">${grand ? '⚜ PLAY THE GRAND JEST' : '🎴 DRAW '+jkHandSize()+' CARDS'}</button>
         <button class="btn ghost sm" onclick="jkTakeSafe()">🛡 TAKE SAFE XP (×1)</button>
       </div>`;
  } else {
    const dealing = now < _jkDealUntil;
    const flipping = now < _jkFlipUntil;
    const canPick = h.picked===null && !_jkBusy && !dealing;
    const cards = h.cards.map((id,i)=>{
      const card = jkCardById(id);
      const faceUp = h.revealed[i] && !dealing;
      const cls = [];
      if(h.picked===i) cls.push('picked');
      else if(h.picked!==null && faceUp) cls.push('dim');
      if(canPick) cls.push('pickable'); else cls.push('static');
      const eye = faceUp && h.picked===null && !h.grand;
      const inner = jkCardHTML(card, { back:!faceUp, flip: faceUp && flipping && _jkFlip.has(i), cls:cls.join(' '), onclick: canPick ? `jkPick(${i})` : '', eye });
      return `<div class="jkc-slot${dealing?' deal':''}" style="${dealing?`animation-delay:${i*120}ms`:''}">${inner}</div>`;
    }).join('');
    const hidden = h.revealed.filter(r=>!r).length;
    const tr = S.tricks||0;
    let hint, actions;
    if(h.picked===null){
      hint = h.grand ? '⚜ THE GRAND JEST — CHOOSE YOUR FATE' : 'PICK A CARD — ANY CARD';
      actions = `<div class="row">
          <button class="btn purple sm" onclick="jkPeek()" ${tr>0 && hidden>0 && !dealing ? '' : 'disabled'}>👁 PEEK · 1🎭</button>
          <button class="btn purple sm" onclick="jkShuffle()" ${tr>0 && !dealing ? '' : 'disabled'}>🔀 SHUFFLE · 1🎭</button>
        </div>`;
    } else if(_jkBusy){
      hint = 'THE COURT HOLDS ITS BREATH…'; actions = '';
    } else {
      hint = 'YOUR CARD IS CHOSEN';
      actions = `<button class="btn gold" onclick="jkFinishPicked()">⚜ REVEAL YOUR FATE</button>`;
    }
    html = (h.grand ? `<div class="jk-grand">⚜ THE GRAND JEST ⚜</div>` : '') +
      jkStage(cards, '') +
      `<div class="jk-hint${h.picked===null?' pulse':''}">${hint}</div>
       <div class="jk-stake">XP ON THE LINE<b>${pw ? pw.xpAmount : 0}</b></div>
       <div class="jk-actions">${actions}</div>`;
  }
  if(html !== _jkLastHtml){ el.innerHTML = html; _jkLastHtml = html; }
}

/* ══ THE STREET ACT — the Jester's between-challenges game (push-your-luck with your OWN deck) ══
   Stake coins, then toss cards off the top of a shuffled copy of your deck one by one.
   Every clean card adds its × to the APPLAUSE. Take a bow any time: stake × applause ÷ 2.
   A curse (anything below ×1: the Tower, the Hanged Man) or a fumble drops the lot — you keep
   half the curse's Mirth. Fumbles get likelier every toss (+6% per card after the first).
   5 clean tosses = PERFECT ACT (+25%, auto-bow). 3 acts per round, refilled by every win.
   Deck-building matters here too: burn your curses and the act gets far safer. */
const JK_ACTS = 3, JK_ACT_STAKES = [10, 25, 50], JK_ACT_MAX = 5, JK_ACT_FUMBLE = 0.06, JK_ACT_PAY = 0.5, JK_ACT_PERFECT = 1.25;
let _jkActFlipAt = 0;
function jkActsLeft(){ return S.jkActs == null ? JK_ACTS : S.jkActs; }
function jkActApplause(ids){
  let a = 0, prev = 1;
  ids.forEach(id => { const c = jkCardById(id); const m = c.special==='fool' ? prev : c.mult; a += m; prev = m; });
  return a;
}
function jkActPayout(j, perfect){ return Math.round(j.stake * jkActApplause(j.drawn) * JK_ACT_PAY * (perfect ? JK_ACT_PERFECT : 1)); }
function jkActRisk(j){ // chance the NEXT toss drops everything
  const curse = j.pile.filter(id => jkCardById(id).mult < 1).length / Math.max(1, j.pile.length);
  const fumble = JK_ACT_FUMBLE * j.drawn.length;
  return 1 - (1 - curse) * (1 - fumble);
}
function jkActIdleHTML(){
  const left = jkActsLeft(), coins = S.coins || 0;
  const pips = Array.from({length:JK_ACTS}, (_, i) => `<i class="${i < left ? 'on' : ''}"></i>`).join('');
  const btns = JK_ACT_STAKES.map(s => `<button class="btn ${s===50?'gold':'purple'} sm" onclick="jkActStart(${s})" ${left > 0 && coins >= s ? '' : 'disabled'}>${s}🪙</button>`).join('');
  return `<div class="jk-act">
    <div class="jk-act-h"><span>🤹 THE STREET ACT</span><span class="jk-act-pips">${pips}</span></div>
    <div class="jk-act-sub">${left > 0
      ? 'Juggle cards from <b>your own deck</b> for the crowd. Each card adds its × to the applause — bow out any time for <b>stake × applause ÷ 2</b>. A curse or a fumble drops the lot.'
      : 'The crowd has seen enough for now. <b>Win a challenge</b> to earn 3 more acts.'}</div>
    ${left > 0 ? `<div class="jk-act-lbl">PICK YOUR STAKE</div><div class="row jk-act-stakes">${btns}</div>` : ''}
  </div>`;
}
function jkActStart(stake){
  if(S.charId!=='jester' || S.jkJuggle || S._jesterPendingWin || S.jkHand || S.jkClaim) return;
  if(S.currentTile && !S.resolved){ toast('FINISH YOUR CHALLENGE FIRST'); return; }
  if(jkActsLeft() <= 0){ toast('NO ACTS LEFT — WIN A CHALLENGE'); return; }
  if((S.coins||0) < stake){ toast('NOT ENOUGH COINS'); return; }
  S.coins -= stake; S.jkActs = jkActsLeft() - 1;
  const pile = jkDeck().map(jkDrawId);
  for(let i = pile.length - 1; i > 0; i--){ const k = Math.floor(Math.random()*(i+1)); [pile[i], pile[k]] = [pile[k], pile[i]]; }
  S.jkJuggle = { stake, pile, drawn:[], dropped:null, paid:0, perfect:false };
  const st = jkStats(); st.acts = (st.acts||0) + 1;
  addLog(`🤹 Street act — staked ${stake}🪙`);
  save(); syncHUD();
  jkActToss();
}
function jkActToss(){
  const j = S.jkJuggle; if(!j || j.dropped || j.paid) return;
  const id = j.pile.shift(); if(!id){ jkActBow(); return; }
  const card = jkCardById(id);
  const fumble = card.mult >= 1 && Math.random() < JK_ACT_FUMBLE * j.drawn.length;
  j.drawn.push(id);
  _jkActFlipAt = Date.now();
  if(card.mult < 1 || fumble){
    j.dropped = fumble ? 'fumble' : 'curse';
    const m = fumble ? 5 : Math.round((card.mirth||0) / 2);
    addLog(fumble ? `🤹 Fumbled the act on ${card.name} — lost ${j.stake}🪙` : `🤹 ${card.name} knocked the act over — lost ${j.stake}🪙`);
    jkBurst(['💥','💀','🔔'], 12);
    save(); jkAddMirth(m, true);
  } else if(j.drawn.length >= JK_ACT_MAX){
    jkActBow(true); return;
  } else {
    jkBurstFor(card);
  }
  save(); refreshJesterDeck();
}
function jkActBow(perfect){
  const j = S.jkJuggle; if(!j || j.dropped || j.paid) return;
  j.perfect = !!perfect;
  j.paid = jkActPayout(j, j.perfect);
  S.coins = (S.coins||0) + j.paid;
  const st = jkStats(); st.actBest = Math.max(st.actBest||0, j.paid);
  if(j.perfect) st.perfectActs = (st.perfectActs||0) + 1;
  addLog(`🤹 ${j.perfect ? 'PERFECT ACT' : 'Took a bow'} after ${j.drawn.length} cards — +${j.paid}🪙 (staked ${j.stake})`);
  floatText('+'+j.paid+' COINS', '#ffd24a');
  jkBurst(j.perfect ? ['🪙','⚜','✨','🎉','🔔'] : ['🪙','👏','✨'], j.perfect ? 24 : 12);
  if(j.perfect) setTimeout(()=>epicToast('🤹 PERFECT ACT — THE CROWD THROWS ' + j.paid + ' COINS'), 250);
  save(); syncHUD();
  jkAddMirth(3 * j.drawn.length, true);
  refreshJesterDeck();
}
function jkActClose(){ S.jkJuggle = null; save(); syncHUD(); refreshJesterDeck(); }
function jkJuggleHTML(){
  const j = S.jkJuggle, fresh = Date.now() - _jkActFlipAt < 500;
  const cards = j.drawn.map((id, i) => {
    const last = i === j.drawn.length - 1, card = jkCardById(id);
    const bad = last && j.dropped;
    const rot = (i - (j.drawn.length - 1) / 2) * 7;
    return `<div class="jk-act-card${bad ? ' bad' : ''}" style="--r:${rot}deg;--y:${Math.abs(rot) * 0.9}px">${jkCardHTML(card, { cls:'mini static', flip: last && fresh })}</div>`;
  }).join('');
  const app = jkActApplause(j.drawn.filter((_, i) => !(j.dropped && i === j.drawn.length - 1)));
  let body;
  if(j.dropped){
    const last = jkCardById(j.drawn[j.drawn.length - 1]);
    body = `<div class="jk-act-verdict bad">${j.dropped==='fumble' ? '💥 FUMBLED! THE CARDS HIT THE FLOOR' : '💀 ' + last.name + ' — THE ACT COLLAPSES'}</div>
      <div class="jk-act-sub" style="text-align:center">Lost your ${j.stake}🪙 stake. The crowd laughed anyway — you keep the 🔔 Mirth.</div>
      <div class="jk-actions"><button class="btn ghost" onclick="jkActClose()">🎭 DUST YOURSELF OFF</button></div>`;
  } else if(j.paid){
    body = `<div class="jk-act-verdict good">${j.perfect ? '⚜ PERFECT ACT ⚜' : '🎩 A FINE BOW'} · +${j.paid}🪙</div>
      <div class="jk-actions"><button class="btn gold" onclick="jkActClose()">👏 SOAK UP THE APPLAUSE</button></div>`;
  } else {
    const risk = Math.round(jkActRisk(j) * 100), pay = jkActPayout(j, false), next = j.drawn.length + 1;
    body = `<div class="jk-act-meter"><span>👏 APPLAUSE <b>×${app.toFixed(2)}</b></span><span>BOW NOW <b>${pay}🪙</b></span></div>
      <div class="jk-act-risk"><i style="width:${risk}%"></i><span>NEXT TOSS DROPS IT: ${risk}%</span></div>
      <div class="jk-actions">
        <button class="btn primary" onclick="jkActToss()">🤹 TOSS CARD ${next} OF ${JK_ACT_MAX}${next===JK_ACT_MAX ? ' · PERFECT!' : ''}</button>
        <button class="btn gold sm" onclick="jkActBow()">🎩 TAKE A BOW · ${pay}🪙</button>
      </div>`;
  }
  return `<div class="jk-act-top">🤹 THE STREET ACT · STAKE ${j.stake}🪙</div>` +
    jkStage(`<div class="jk-act-fan">${cards}</div>`, j.dropped || j.paid ? '' : `${j.pile.length} CARDS LEFT IN THE DECK`) + body;
}

function jkBurst(emojis, count){
  const host = document.getElementById('jkPanel'); if(!host) return;
  for(let i=0;i<count;i++){
    const sp = document.createElement('span'); sp.className = 'jk-burst';
    sp.textContent = emojis[i % emojis.length];
    const ang = Math.random()*Math.PI*2, dist = 55 + Math.random()*95;
    sp.style.setProperty('--dx', (Math.cos(ang)*dist)+'px');
    sp.style.setProperty('--dy', (Math.sin(ang)*dist*0.7 - 25)+'px');
    sp.style.setProperty('--rot', (Math.random()*360-180)+'deg');
    sp.style.animationDelay = Math.round(Math.random()*140)+'ms';
    host.appendChild(sp);
    setTimeout(()=>sp.remove(), 1300);
  }
}
function jkBurstFor(card){
  const panel = document.getElementById('jkPanel');
  if(card.devil){ jkBurst(['😈','🔥','🥃'], 16); return; }
  if(card.rarity==='legendary'){ jkBurst(['✨','☀️','🪙','⚜','🔔'], 24); floatText(card.name+'!', '#ffd24a'); }
  else if(card.rarity==='epic') jkBurst(['✨','♦','🔔','⭐'], 15);
  else if(card.rarity==='rare') jkBurst(['✨','♦','🪙'], 10);
  else if(card.rarity==='cursed'){
    jkBurst(['💀','💨','🔔'], 10);
    if(panel){ panel.classList.remove('jk-shake'); void panel.offsetWidth; panel.classList.add('jk-shake'); }
  }
  else jkBurst(['♦','✦'], 6);
}

function jkPl(n, w){ n = n||0; return n+' '+w+(n===1?'':'s'); }
function jkDeckGroups(){ // [{card, count}] sorted by arcana number
  const counts = {};
  jkDeck().forEach(id => counts[id] = (counts[id]||0) + 1);
  return Object.keys(counts).map(id => ({ card:JK_TAROT[id], count:counts[id] })).sort((a,b)=>a.card.num-b.card.num);
}
function jkOpenCodex(){
  const n = jkHandSize();
  const rows = jkDeckGroups().map(({card, count})=>{
    const shown = jkCardById(jkDrawId(card.id));
    return `<div class="jk-codex-row r-${shown.rarity}" onclick="jkInspectCard('${card.id}')" style="cursor:pointer"><span class="i">${shown.sym}</span>
      <span><div class="n">${card.numeral} · ${shown.name} <span style="color:#e8c34a">×${count}</span></div><div class="d">${shown.desc}</div></span>
      <span class="m">${jkMultLabel(shown)}<small>in ~${Math.round(jkHandChance(card.id,n)*100)}% of hands</small></span></div>`;
  }).join('');
  const cur = jkRank().lv, st = jkStats();
  const ranks = JK_RANKS.map(r=>`<div class="jk-codex-row r-${r.lv<=cur?'legendary':'common'}${r.lv===cur?' cur':''}"><span class="i">${r.lv<=cur?'⚜':'🔒'}</span>
      <span><div class="n">${r.n}</div><div class="d">${r.perk}</div></span>
      <span class="m" style="font-size:7px;max-width:90px;white-space:normal">${r.req}</span></div>`).join('');
  showCard({
    cls:'rarity-epic',
    tag:'📜 THE JESTER\'S CODEX',
    title:'YOUR TAROT DECK',
    raw:`<p class="small">Your deck holds <b class="gold">${jkDeck().length} cards</b> (average <b class="gold">×${jkDeckEV().toFixed(2)}</b>). Every win deals <b class="gold">${n}</b> of them face-down. Buy more of the Major Arcana in the <b class="gold">Motley Market</b>; burn the ones you hate in your <b class="gold">Bag</b>. Tap a card for details.</p>
      <div class="jk-codex-h">IN YOUR DECK</div><div class="jk-codex">${rows}</div>
      <div class="jk-codex-h">RANKS OF THE COURT</div><div class="jk-codex">${ranks}</div>
      <p class="small dim" style="text-align:center">${jkPl(st.draws,'draw')} · ${jkPl(st.kings,'sun')} · ${jkPl(st.grand,'grand jest')} · ${jkPl(st.curses,'tower')} survived</p>`,
    buttons:`<button class="btn ghost" onclick="closeCard()">◀ CLOSE</button>`
  });
}
function jkInspectCard(id){
  const card = JK_TAROT[id]; if(!card) return;
  const shown = jkCardById(jkDrawId(id));
  const have = jkCopies(id), n = jkHandSize(), deckN = jkDeck().length;
  const free = S.jkFreeBurns||0;
  const canBurn = have>0 && deckN > JK_MIN_DECK && (free>0 || (S.coins||0) >= JK_BURN_COST);
  const burnWhy = have===0 ? '' : deckN <= JK_MIN_DECK ? `<p class="small dim" style="text-align:center">Your deck can't go below ${JK_MIN_DECK} cards.</p>` : '';
  const flipped = shown.id!==id ? `<p class="small" style="text-align:center;color:#c08aff">🪄 Your Fool's Sceptre deals this card as <b class="gold">${shown.name}</b>.</p>` : '';
  const buyable = card.price && have < jkMaxCopies(id);
  showCard({
    cls: ({legendary:'rarity-legendary',epic:'rarity-epic',rare:'rarity-rare',cursed:'curse'})[card.rarity] || '',
    tag: card.numeral+' · MAJOR ARCANA · '+card.rarity.toUpperCase(),
    title: card.name,
    raw: `<div class="jk-result-card">${jkCardHTML(card, { cls:'static' })}</div>
      <p class="small" style="text-align:center;color:#f4e6d0">${card.desc}</p>${flipped}
      <div class="rewardRow" style="justify-content:center"><div class="chip">IN YOUR DECK ×${have}</div><div class="chip">IN ~${Math.round(jkHandChance(id,n)*100)}% OF HANDS</div><div class="chip">DECK · ${deckN}</div></div>${burnWhy}`,
    buttons: (have>0 ? `<button class="btn red" onclick="jkBurnCard('${id}')" ${canBurn?'':'disabled'}>🔥 BURN ONE COPY · ${free>0?'FREE ('+free+' left)':JK_BURN_COST+'🪙'}</button>` : '') +
             (buyable ? `<button class="btn purple sm" onclick="jkBuyCard('${id}', true)" ${(S.coins||0)>=jkCardPrice(id)?'':'disabled'}>🛒 ADD A COPY · ${jkCardPrice(id)}🪙</button>` : '') +
             `<button class="btn ghost sm" onclick="closeCard()">◀ CLOSE</button>`
  });
}
function jkBurnCard(id){
  if(!S || S.charId!=='jester') return;
  const deck = jkDeck(), idx = deck.indexOf(id);
  if(idx<0) return;
  if(deck.length <= JK_MIN_DECK){ toast('YOUR DECK CAN\'T GO BELOW '+JK_MIN_DECK+' CARDS'); return; }
  if((S.jkFreeBurns||0) > 0) S.jkFreeBurns--;
  else if((S.coins||0) >= JK_BURN_COST) S.coins -= JK_BURN_COST;
  else { toast('NOT ENOUGH COINS TO BURN — '+JK_BURN_COST+'🪙'); return; }
  deck.splice(idx,1);
  const c = JK_TAROT[id];
  addLog('🔥 Burned '+c.numeral+' · '+c.name+' from the deck ('+deck.length+' cards left)');
  toast('🔥 '+c.name+' BURNED — '+deck.length+' CARDS LEFT');
  save(); syncHUD(); closeCard(); renderBag();
}
function jkBuyCard(id, fromInspect){
  if(!S || S.charId!=='jester') return;
  const c = JK_TAROT[id]; if(!c || !c.price) return;
  if(jkCopies(id) >= jkMaxCopies(id)){ toast('YOUR DECK ALREADY HOLDS THE MAXIMUM ×'+jkMaxCopies(id)); return; }
  const price = jkCardPrice(id);
  if((S.coins||0) < price){ toast('NOT ENOUGH COINS'); return; }
  S.coins -= price;
  jkDeck().push(id);
  addLog('🃏 Added '+c.numeral+' · '+c.name+' to the deck for '+price+'🪙');
  toast('🃏 '+c.name+' SHUFFLED INTO YOUR DECK');
  save(); syncHUD();
  if(fromInspect){ closeCard(); jkInspectCard(id); renderBag(); }
  else renderShop();
}
function jkShopTarotHTML(){
  const cards = Object.values(JK_TAROT).filter(c => c.price).sort((a,b)=>a.num-b.num);
  return `<div class="shop-exclusive-label" style="margin-top:16px">🃏 THE MAJOR ARCANA — ADD CARDS TO YOUR DECK</div>
    <p class="small dim" style="padding:0 2px 10px;margin:0">Your deck: <b class="gold">${jkDeck().length} cards</b>, average <b class="gold">×${jkDeckEV().toFixed(2)}</b>. Each extra copy costs 50% more. Inspect &amp; burn cards in your <b class="gold">Bag</b>.</p>
    ${cards.map(c=>{
      const have = jkCopies(c.id), max = jkMaxCopies(c.id), price = jkCardPrice(c.id);
      const action = have >= max
        ? `<span class="si-state si-state--own">✓ MAX ×${max}</span>`
        : `<span class="si-chip si-chip--bag">IN DECK ×${have}</span>
           <button class="si-buy si-buy--relic" onclick="jkBuyCard('${c.id}')" ${(S.coins||0)>=price?'':'disabled'}>${ico('🪙',12)}<span class="si-price">${price}</span></button>`;
      return `<div class="shop-item shop-item--exclusive shop-item--tarot">
        <div class="shop-item__icon tarot" onclick="jkInspectCard('${c.id}')">${jkCardHTML(c, { cls:'mini static' })}</div>
        <div class="shop-item__body">
          <div class="shop-item__name gold">${c.numeral} · ${c.name}</div>
          <div class="shop-item__desc">${c.desc}</div>
          <div class="shop-item__action">${action}</div>
        </div>
      </div>`;
    }).join('')}`;
}
function jkBagDeckHTML(){
  const groups = jkDeckGroups();
  return `<div class="jk-codex-h" style="margin-top:12px">🃏 YOUR TAROT DECK · ${jkDeck().length} CARDS · AVG ×${jkDeckEV().toFixed(2)}</div>
    <p class="small dim" style="margin:0 0 4px">Tap a card to inspect it. 🔥 Burn: ${S.jkFreeBurns?'<b class="gold">'+S.jkFreeBurns+' FREE</b> (from Death)':JK_BURN_COST+'🪙 each'} · minimum ${JK_MIN_DECK} cards.</p>
    <div class="jk-deckgrid">${groups.map(({card,count})=>jkCardHTML(jkCardById(jkDrawId(card.id)), { cls:'mini pickable', count, onclick:`jkInspectCard('${card.id}')` })).join('')}</div>`;
}

/* the jester in the widget juggles when there's fate waiting to be drawn */
setInterval(()=>{
  if(!S || S.charId!=='jester') return;
  const g = document.getElementById('screen-game');
  if(!g || g.classList.contains('hide')) return;
  const c = document.getElementById('jkPortrait'); if(!c) return;
  _jkPortraitFrame++;
  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);
  const ch = CHARS.find(x=>x.id==='jester');
  const { scale, px, py } = charDrawParams(ch, 3.4, 8, 25);
  const excited = !!(S._jesterPendingWin || S.jkHand || S.jkClaim);
  const frame = excited ? 104 + (_jkPortraitFrame % 36) : _jkPortraitFrame;
  drawChar(ctx, ch, px, py, scale, frame);
}, 90);

/* ══════════════════════════════════════════════════════
   THE CAULDRON — press-your-luck potion brewing (Wizard)
   Toss ingredients in one at a time: multiplier climbs,
   bust risk climbs with it. Bottle it whenever you're
   scared enough, or push your luck to the last stage.
   ══════════════════════════════════════════════════════ */
const CAULDRON_STAGES = [
  { mult:1.3, bust:0.05 },
  { mult:1.7, bust:0.12 },
  { mult:2.2, bust:0.20 },
  { mult:3.0, bust:0.32 },
  { mult:4.2, bust:0.48 },
];
const CAULDRON_INGREDIENTS = ['🍄','🐸','✨','🐍','🔥','🌙','🦴','🕷','👁','🧿'];
function wizRisk(i){ const b = CAULDRON_STAGES[i].bust; return S && S.relics.includes('mooncauldron') ? Math.max(0.01, b - 0.05) : b; }

let _wiz = null; // { stage:int, ingredients:[icons], brewing:bool }

function wizCurrentMult(){
  if(!_wiz || _wiz.stage===0) return 1;
  return CAULDRON_STAGES[_wiz.stage-1].mult;
}

function wizAddIngredient(){
  if(!S._wizPendingWin) return;
  if(!_wiz) _wiz = { stage:0, ingredients:[], brewing:false };
  if(_wiz.brewing || _wiz.curdled || _wiz.stage >= CAULDRON_STAGES.length) return;
  const risk = wizRisk(_wiz.stage);
  const icon = CAULDRON_INGREDIENTS[Math.floor(Math.random()*CAULDRON_INGREDIENTS.length)];
  _wiz.ingredients.push(icon);
  _wiz.brewing = true;
  const roll = _wiz.nextRoll != null ? _wiz.nextRoll : Math.random(); // a scried roll is binding
  _wiz.nextRoll = null; _wiz.scry = null;
  const stardust = !!S.wzStardust; S.wzStardust = false;
  wzAddSurge(8, 'ingredient');
  wizRender();
  setTimeout(()=>{
    const busted = !stardust && roll < risk;
    if(busted){
      _wiz.brewing = false; _wiz.curdled = true;
      wizRender();
      cwBurst('wizPanel', ['💥','💨','☠️','💨'], 14);
      const p = document.getElementById('wizPanel');
      if(p){ p.classList.remove('cw-shake'); void p.offsetWidth; p.classList.add('cw-shake'); }
      wzAddSurge(40, 'curdle'); // disaster feeds wild magic
      setTimeout(()=>wizResolve(S.relics.includes('philstone') ? 0.5 : 0.2, true), 850);
    } else {
      _wiz.stage++;
      _wiz.brewing = false;
      wizRender();
      cwBurst('wizPanel', ['✨','🫧','✦'], 7);
    }
  }, 700);
}

function wizBottle(){
  if(!S._wizPendingWin || (_wiz && (_wiz.brewing || _wiz.curdled))) return;
  if(wizCurrentMult() > 1) cwBurst('wizPanel', wizCurrentMult()>=4 ? ['✨','⭐','🧪','✦','🌙'] : ['✨','🧪','✦'], wizCurrentMult()>=4 ? 22 : 10);
  if(wizCurrentMult() >= 4) wzAddSurge(20);
  wizResolve(wizCurrentMult(), false);
}

function wizTakeSafe(){
  if(!S._wizPendingWin || S._wizPendingWin.poly) return;
  wzAddSurge(5);
  wizResolve(1, false);
}
function wizScry(){
  if(!S._wizPendingWin || !S.relics.includes('crystalball')) return;
  if(!_wiz) _wiz = { stage:0, ingredients:[], brewing:false };
  if(_wiz.scryUsed || _wiz.brewing || _wiz.curdled || _wiz.stage >= CAULDRON_STAGES.length) return;
  _wiz.scryUsed = true;
  _wiz.nextRoll = Math.random();
  _wiz.scry = (S.wzStardust || _wiz.nextRoll >= wizRisk(_wiz.stage)) ? 'safe' : 'curdle';
  addLog('🔮 Scried the cauldron — the next ingredient will '+(_wiz.scry==='safe'?'hold':'CURDLE'));
  wizRender();
}

function wizResolve(mult, busted){
  const pw = S._wizPendingWin;
  if(!pw) return;
  S._wizPendingWin = null;
  S.wizStats = S.wizStats || { brews:0, elixirs:0, curdles:0 };
  if(_wiz){ S.wizStats.brews++; if(busted) S.wizStats.curdles++; else if(mult>=4) S.wizStats.elixirs++; }
  const ingredientsUsed = _wiz ? _wiz.ingredients.slice() : [];
  _wiz = null;
  const { t, xpAmount, isRevenge } = pw;
  const finalXP = Math.round(xpAmount * mult);
  const coinsGained = Math.max(5, Math.round(t.xp/2)) + (busted?0:ingredientsUsed.length*3);
  let cardCls, cardTag, cardTitle, cardBody, cardChips, cardBtn;
  if(busted){
    addLog('🧪 CAULDRON CURDLED — '+t.n+' spoiled. +'+finalXP+' XP (consolation)');
    floatText('CURDLED!', '#c03028');
    cardCls='forfeit'; cardTag='💥 CURDLED'; cardTitle='THE POTION SPOILS';
    cardBody='One ingredient too many. The cauldron boils over — you salvage '+(S.relics.includes('philstone')?'half your XP, thanks to the Stone':'a splash of XP')+' from the wreckage. The wild magic LOVED it.';
    cardChips=['+'+finalXP+' XP', coinsGained+'🪙'];
    cardBtn=`<button class="btn ghost" onclick="wizClaimXP()">SCRAPE IT UP</button>`;
  } else if(mult >= 4){
    addLog('🧪 GRAND ELIXIR — '+t.n+' ×'+mult+' = +'+finalXP+' XP');
    floatText('GRAND ELIXIR', '#ffd24a');
    cardCls='good'; cardTag='⚗ GRAND ELIXIR'; cardTitle='PERFECT BREW';
    cardBody='×'+mult+' XP. A once-in-a-crawl potion — bottled just in time.';
    cardChips=['+'+finalXP+' XP', '×'+mult+' MULTIPLIER', coinsGained+'🪙'];
    cardBtn=`<button class="btn green" onclick="wizClaimXP()">COLLECT</button>`;
  } else if(mult > 1){
    addLog('🧪 BREW BOTTLED — '+t.n+' ×'+mult+' = +'+finalXP+' XP');
    cardCls='good'; cardTag='⚗ BOTTLED'; cardTitle='POTION BOTTLED';
    cardBody='×'+mult+' XP, sealed safely before the cauldron got greedy.';
    cardChips=['+'+finalXP+' XP', '×'+mult+' MULTIPLIER', coinsGained+'🪙'];
    cardBtn=`<button class="btn green" onclick="wizClaimXP()">COLLECT</button>`;
  } else {
    addLog('✓ '+t.n+' — +'+finalXP+' XP (safe)');
    cardCls=''; cardTag='🛡 SAFE'; cardTitle='SAFE TAKE';
    cardBody='No brewing. 1× XP — no risk, no elixir.';
    cardChips=['+'+finalXP+' XP', coinsGained+'🪙'];
    cardBtn=`<button class="btn ghost" onclick="wizClaimXP()">TAKE IT</button>`;
  }
  if(isRevenge) addLog('⚔ REVENGE — beat '+t.n+' after it beat you.');
  window._pendingWizXP = { finalXP, t, coinsGained, isRevenge };
  save(); syncHUD();
  showCard({ cls:cardCls, tag:cardTag, title:cardTitle, body:cardBody, chips:(cardChips||[]).filter(Boolean), buttons:cardBtn });
}

function wizClaimXP(){
  const p = window._pendingWizXP;
  if(!p) return;
  window._pendingWizXP = null;
  closeCard();
  if(p.finalXP > 0) grantXP(p.finalXP, p.t.n);
  if(p.isRevenge){ toast('⚔ REVENGE SERVED. '+p.t.n+' AVENGED.'); }
  const { t, coinsGained } = p;
  if(t.drink){ S.drinks++; let pa=(t.t===T.SHOT?16:12); if(S.relics.includes('shades')) pa=Math.round(pa*0.8); addPace(pa); }
  if(t.heal){ S.waters++; addPace(-t.heal); }
  S.badLuckHeat = Math.max(0, (S.badLuckHeat||0)-1);
  grantSouvenir(t.t);
  grantCoins(coinsGained);
  save(); syncHUD(); checkAchievements();
  refreshCauldron();
  if(t.t===T.BOSS) S.shopPending = true;
  maybeOpenShop();
}

/* ══════════════════════════════════════════════════════
   WILD MAGIC — the Brew-zard's chaos arc
   🌀 ARCANE SURGE fills from brewing and disaster; when it's full,
   his next win POLYMORPHS him into a random other class and the win
   plays out through THEIR mechanic (Tank chug · Gambler wheel ·
   Jester tarot · Knight pour). No safe option — but Arcane Echo adds
   +0.5 to every non-zero result.
   ══════════════════════════════════════════════════════ */
const WZ_FORMS = {
  tank:    { id:'tank',    name:'THE TANK',         icon:'🛡', verb:'CHUG IT',      desc:'Hand the phone to a friend. Chug blind to the target time — perfect ×2.5, OK ×1, miss ×0.' },
  gambler: { id:'gambler', name:'THE GAMBLER',      icon:'♠',  verb:'SPIN IT',      desc:'Your XP goes on the Den wheel. WIN ×2, NOTHING ×1, LOSE ×0.' },
  jester:  { id:'jester',  name:'THE JESTER',       icon:'🃏', verb:'DRAW IT',      desc:'Three tarot cards, face-down. Pick one — it sets your payout.' },
  machine: { id:'machine', name:'SIR DRINKS-A-LOT', icon:'⚔',  verb:'POUR IT',      desc:'Hold the tap and let go in the green band. Hold too long past the brim and it spills.' }
};
function wzEcho(){ return S.relics.includes('wildtome') ? 1.0 : 0.5; }
function wzAddSurge(n, why){
  if(!S || S.charId!=='wizard' || n<=0) return;
  if(S.relics.includes('wildtome')) n = Math.round(n*1.5);
  const was = S.wzSurge||0;
  if(was >= 100) return;
  S.wzSurge = Math.min(100, was + n);
  if(S.wzSurge >= 100){
    addLog('🌀 WILD MAGIC surges — the next win will polymorph you');
    setTimeout(()=>epicToast('🌀 WILD MAGIC IS BREWING — YOUR NEXT WIN POLYMORPHS YOU'), 400);
  } else if(why) floatText('+'+n+' 🌀', '#b890ff');
  save();
  wzRenderSurge();
}
function wzRenderSurge(){
  const f = document.getElementById('wzSurgeFill'), n = document.getElementById('wzSurgeNum'), bar = document.getElementById('wzSurgeBar');
  const v = Math.round(S.wzSurge||0);
  if(f) f.style.width = v+'%';
  if(n) n.textContent = v>=100 ? '🌀 POLYMORPH READY' : v+'%';
  if(bar) bar.classList.toggle('full', v>=100);
}
// called from applyWin: returns the form if this win polymorphs
function wzMaybePolymorph(pw){
  if((S.wzSurge||0) < 100) return null;
  const ids = Object.keys(WZ_FORMS).filter(id => id !== S.wzLastForm);
  const form = ids[Math.floor(Math.random()*ids.length)];
  S.wzSurge = 0; S.wzLastForm = form; S.wzPolyCount = (S.wzPolyCount||0) + 1;
  pw.poly = form;
  if(form==='tank') pw.polyTarget = 4 + Math.floor(Math.random()*5);
  if(form==='jester'){ const pool = JK_STARTER.slice(); pw.polyCards = [0,1,2].map(()=>pool.splice(Math.floor(Math.random()*pool.length),1)[0]); pw.polyPicked = null; }
  addLog('🌀 POLYMORPH! The Brew-zard becomes '+WZ_FORMS[form].name+' for this win');
  setTimeout(()=>{ cwBurst('wizPanel', ['🌀','✨','🔮','💫'], 18); epicToast('🌀 POLYMORPH — YOU ARE '+WZ_FORMS[form].name+'!'); }, 350);
  return form;
}
let _wzPoly = { t0:0, spinning:false, fill:0, holding:false, fullAt:0, raf:null, done:false };
function wzPolyReset(){ if(_wzPoly.raf) cancelAnimationFrame(_wzPoly.raf); _wzPoly = { t0:0, spinning:false, fill:0, holding:false, fullAt:0, raf:null, done:false }; }

/* resolve a polymorph with the form's own multiplier; Arcane Echo adds on top of any non-zero result */
function wzPolyResolve(baseMult, headline, detail){
  const pw = S._wizPendingWin; if(!pw || _wzPoly.done) return;
  _wzPoly.done = true;
  const form = WZ_FORMS[pw.poly];
  const echo = baseMult > 0 ? wzEcho() : 0;
  const mult = Math.round((baseMult + echo)*100)/100;
  S._wizPendingWin = null;
  const { t, xpAmount, isRevenge } = pw;
  const finalXP = Math.round(xpAmount * mult);
  const coinsGained = Math.max(5, Math.round(t.xp/2)) + (baseMult>=2 ? 10 : 0);
  S.wizStats = S.wizStats || { brews:0, elixirs:0, curdles:0 };
  addLog('🌀 POLYMORPH · '+form.name+' — '+headline+' — '+t.n+' ×'+mult+' = +'+finalXP+' XP');
  if(isRevenge) addLog('⚔ REVENGE — beat '+t.n+' after it beat you.');
  window._pendingWizXP = { finalXP, t, coinsGained, isRevenge };
  wzPolyReset();
  save(); syncHUD();
  showCard({
    cls: baseMult >= 2 ? 'rarity-epic' : baseMult > 0 ? 'good' : 'forfeit',
    tag: '🌀 POLYMORPH · '+form.icon+' '+form.name,
    title: headline,
    body: detail,
    chips: ['+'+finalXP+' XP', '×'+baseMult+' '+form.name.replace('THE ','').replace('SIR DRINKS-A-LOT','KNIGHT'), echo ? '+'+echo+' ARCANE ECHO' : 'NO ECHO ON A BUST', coinsGained+'🪙'].filter(Boolean),
    buttons: `<button class="btn ${baseMult>0?'gold':'ghost'}" onclick="wizClaimXP()">${baseMult>0 ? '🌀 SHIFT BACK & COLLECT' : '🌀 SHIFT BACK'}</button>`
  });
}

/* ── TANK FORM: blind chug ── */
function wzChugTap(){
  const pw = S._wizPendingWin; if(!pw || pw.poly!=='tank' || _wzPoly.done) return;
  const btn = document.getElementById('wzChugBtn'), st = document.getElementById('wzChugStatus');
  if(!_wzPoly.t0){ _wzPoly.t0 = Date.now(); if(btn) btn.textContent = '🛑 STOP'; if(st) st.innerHTML = '<span class="lh-duel-going">🍺 CHUGGING…</span>'; return; }
  const el = (Date.now() - _wzPoly.t0)/1000, off = Math.abs(el - pw.polyTarget);
  const base = off <= 0.4 ? 2.5 : off <= 1.0 ? 1 : 0;
  wzPolyResolve(base, base>=2.5 ? '⚡ PERFECT CHUG!' : base===1 ? '— COUNTS. BARELY.' : '💧 SPILLED',
    el.toFixed(2)+'s against a '+pw.polyTarget+'s target ('+off.toFixed(2)+'s off). The Tank in you '+(base>=2.5?'roars.':base===1?'shrugs.':'weeps.'));
}
/* ── GAMBLER FORM: the Den wheel ── */
function wzSpin(){
  const pw = S._wizPendingWin; if(!pw || pw.poly!=='gambler' || _wzPoly.spinning || _wzPoly.done) return;
  _wzPoly.spinning = true;
  const segs = DEN_GAMES.wheel.segs;
  const btn = document.getElementById('wzSpinBtn'); if(btn){ btn.disabled = true; btn.textContent = 'SPINNING…'; }
  const r = Math.random(); let idx = segs.length-1, cum = 0;
  for(let i=0;i<segs.length;i++){ cum += segs[i].pct; if(r < cum){ idx = i; break; } }
  let a = 0; const mids = segs.map(s=>{ const m = a + s.pct*Math.PI; a += s.pct*Math.PI*2; return m; });
  const finalRot = (5 + Math.random()*3)*Math.PI*2 - (mids[idx] + (Math.random()-0.5)*0.5*segs[idx].pct*Math.PI*2);
  const t0 = Date.now(), dur = 3200;
  (function anim(){
    const p = Math.min(1, (Date.now()-t0)/dur), e = 1 - Math.pow(1-p, 4);
    denPaintWheel('wheel', finalRot*e, 'wzCanvas');
    if(p < 1){ requestAnimationFrame(anim); return; }
    const seg = segs[idx];
    setTimeout(()=>wzPolyResolve(seg.mult, seg.mult===0 ? '💀 THE HOUSE WINS' : seg.mult===1 ? '— NOTHING HAPPENS' : '🏆 WIN ×'+seg.mult,
      'The wheel stops on '+seg.label+'. '+(seg.mult===0 ? 'Even wizards lose to the House.' : 'The Gambler in you tips his hat.')), 450);
  })();
}
/* ── JESTER FORM: a tarot draw from the starter deck ── */
function wzPick(i){
  const pw = S._wizPendingWin; if(!pw || pw.poly!=='jester' || pw.polyPicked!=null || _wzPoly.done) return;
  pw.polyPicked = i; save(); wizRender();
  const card = JK_TAROT[pw.polyCards[i]];
  setTimeout(()=>{
    if(card.reroll) S.skips = (S.skips||0) + card.reroll;
    if(card.doubleNext) S.doubleNext = true;
    wzPolyResolve(card.mult, card.numeral+' · '+card.name, card.flavor);
  }, 1300);
}
/* ── KNIGHT FORM: the pour (and unlike the real Knight, it spills if you hold past the brim) ── */
function wzPourStart(e){
  if(e && e.cancelable) e.preventDefault();
  const pw = S._wizPendingWin; if(!pw || pw.poly!=='machine' || _wzPoly.holding || _wzPoly.done) return;
  _wzPoly.holding = true; _wzPoly.fill = 0; _wzPoly.fullAt = 0;
  (function loop(){
    if(!_wzPoly.holding) return;
    _wzPoly.fill = Math.min(1, _wzPoly.fill + 0.008);
    if(_wzPoly.fill >= 1 && !_wzPoly.fullAt) _wzPoly.fullAt = Date.now();
    if(_wzPoly.fullAt && Date.now() - _wzPoly.fullAt > 600){ _wzPoly.holding = false; wzPourEnd(true); return; }
    wzPaintPour();
    _wzPoly.raf = requestAnimationFrame(loop);
  })();
}
function wzPourStop(e){
  if(e && e.cancelable) e.preventDefault();
  if(!_wzPoly.holding) return;
  _wzPoly.holding = false;
  if(_wzPoly.fill > 0.04) wzPourEnd(false);
}
function wzPourEnd(spilled){
  const z = spilled ? { label:'SPILLED OVER THE BRIM', mult:0 } : fillZone(_wzPoly.fill);
  wzPaintPour();
  setTimeout(()=>wzPolyResolve(z.mult, spilled ? '💦 SPILLED!' : '🍺 '+z.label,
    spilled ? 'You held the tap past the brim. The Knight would never. Beer everywhere.' : 'Poured to '+Math.round(_wzPoly.fill*100)+'%. The Knight in you nods approvingly.'), 350);
}
function wzPaintPour(){
  const f = document.getElementById('wzPourFill'), l = document.getElementById('wzPourLbl');
  const v = _wzPoly.fill;
  if(f) f.style.height = Math.round(v*100)+'%';
  if(l) l.textContent = v >= 1 ? 'AT THE BRIM — LET GO!' : (v>0 ? fillZone(v).label : 'HOLD THE TAP');
}

/* ── the polymorph stage inside the Cauldron widget ── */
function wzPolyHTML(pw){
  const form = WZ_FORMS[pw.poly];
  const head = `<div class="wz-polyhead"><span class="wz-polyicon">${form.icon}</span><div><div class="wz-polyname">🌀 POLYMORPHED · ${form.name}</div><div class="wz-polydesc">${form.desc}</div></div></div>`;
  const echo = `<div class="cw-tagrow"><span class="cw-tag">🌀 ARCANE ECHO <b>+${wzEcho()}</b> ON ANY WIN</span><span class="cw-tag">NO SAFE OPTION — IT'S CHAOS</span></div>`;
  let body = '';
  if(pw.poly==='tank'){
    body = `<div class="cw-stage lh-stage wz-polystage"><div class="lh-hint">CHUG YOUR BEER FOR</div><div class="lh-shield"><div class="lh-target">${pw.polyTarget}s</div></div><div class="lh-toler">±0.4s PERFECT · ±1s OK</div></div>
      <div id="wzChugStatus" class="lh-duel-status">&nbsp;</div>
      <button class="btn primary big" id="wzChugBtn" onclick="wzChugTap()">🍺 START</button>`;
  } else if(pw.poly==='gambler'){
    body = `<div class="cw-stage den-felt wz-polystage"><div class="den-wheelwrap"><div class="den-pointer"></div><canvas id="wzCanvas" width="180" height="180" style="border-radius:50%;display:block;margin:0 auto;box-shadow:0 0 0 4px #c8980a,0 0 0 7px #3a1a06"></canvas></div></div>
      <button class="btn primary" id="wzSpinBtn" onclick="wzSpin()">🎡 SPIN FOR YOUR XP</button>`;
  } else if(pw.poly==='jester'){
    const picked = pw.polyPicked;
    const cards = pw.polyCards.map((id,i)=>{
      const c = JK_TAROT[id];
      if(picked==null) return `<div class="jkc-slot">${jkCardHTML(c, { back:true, cls:'pickable', onclick:`wzPick(${i})` })}</div>`;
      return `<div class="jkc-slot">${jkCardHTML(c, { cls: i===picked ? 'static picked' : 'static dim', flip:true })}</div>`;
    }).join('');
    body = `<div class="jk-stage wz-polystage"><div class="jk-valance"></div>${cards}<div class="jk-floor"></div></div>
      <div class="jk-hint${picked==null?' pulse':''}">${picked==null ? 'PICK A CARD — ANY CARD' : 'THE CARDS HAVE SPOKEN…'}</div>`;
  } else if(pw.poly==='machine'){
    const zones = [[0.92,1,'#ffd24a','×1.8'],[0.75,0.92,'#3aa84a','×1.5'],[0.45,0.75,'#a07a20','×1.1'],[0.15,0.45,'#4a5268','×0.85'],[0,0.15,'#7a2a2a','×0.5']];
    body = `<div class="cw-stage kt-stage wz-polystage wz-pour">
        <div class="wz-gauge">${zones.map(z=>`<div class="wz-zone" style="bottom:${z[0]*100}%;height:${(z[1]-z[0])*100}%;background:${z[2]}"><span>${z[3]}</span></div>`).join('')}</div>
        <div class="wz-glass"><div class="wz-beer" id="wzPourFill" style="height:0%"></div><div class="wz-brim"></div></div>
      </div>
      <div class="kt-label" id="wzPourLbl">HOLD THE TAP</div>
      <button class="kt-tap" onmousedown="wzPourStart()" ontouchstart="wzPourStart(event)" onmouseup="wzPourStop()" ontouchend="wzPourStop(event)" onmouseleave="wzPourStop()">🍺<br>HOLD<br>THE TAP</button>`;
  }
  return head + body + `<div class="cw-stake">XP ON THE LINE<b>${pw.xpAmount}</b></div>` + echo;
}

function refreshCauldron(){
  if(S.charId !== 'wizard') return;
  const wrap = document.getElementById('wizardCauldron');
  if(wrap) wrap.classList.remove('hide');
  const lbl = document.getElementById('wizModeLbl');
  const hasPending = !!S._wizPendingWin;
  const poly = hasPending && S._wizPendingWin.poly;
  if(lbl) lbl.textContent = poly ? '🌀 POLYMORPHED' : hasPending ? (_wiz ? 'BREWING…' : 'FIRE IS LIT') : 'WIN A TILE TO BREW';
  const ttl = document.getElementById('wizTitle');
  if(ttl) ttl.textContent = poly ? '🌀 WILD MAGIC' : '🧪 THE CAULDRON';
  const panel = document.getElementById('wizPanel');
  if(panel) panel.classList.toggle('wz-poly', !!poly);
  wzRenderSurge();
  const st = S.wizStats || { brews:0, elixirs:0, curdles:0 };
  const sl = document.getElementById('wizStatLbl');
  if(sl){ const h = '⚗ <b>'+st.brews+'</b> BREWS · ✨ <b>'+st.elixirs+'</b> ELIXIRS · 💥 <b>'+st.curdles+'</b>'; if(sl.innerHTML!==h) sl.innerHTML = h; }
  wizRender();
}

// liquid colour climbs with the brew: teal → blue → violet → magenta → molten gold
const CAULDRON_COLORS = [
  ['#3ee8c0','#0e5a4c','rgba(62,232,192,.35)'],
  ['#3ee8c0','#0e5a4c','rgba(62,232,192,.4)'],
  ['#5ab8ff','#123a7a','rgba(90,184,255,.42)'],
  ['#a66cff','#3a1a8a','rgba(166,108,255,.45)'],
  ['#ff4de0','#7a0a6a','rgba(255,77,224,.45)'],
  ['#ffd24a','#8a5a00','rgba(255,210,74,.55)']
];
let _wizLastHtml = '';
function wizCauldronHTML(state){ // state: 'cold' | 'lit' | 'boil' | 'curdle'
  const stage = _wiz ? _wiz.stage : 0;
  const [lq, lqd, lqg] = CAULDRON_COLORS[Math.min(stage, CAULDRON_COLORS.length-1)];
  const drop = (state==='boil' && _wiz && _wiz.ingredients.length) ? `<div class="cd-drop">${_wiz.ingredients[_wiz.ingredients.length-1]}</div>` : '';
  return `<div class="cw-stage cd-stage cd-${state}" style="--lq:${lq};--lqd:${lqd};--lqg:${lqg}">
    ${drop}
    <div class="cd-pot"><div class="cd-rim"></div><div class="cd-liquid"></div><div class="cd-bubbles"><i></i><i></i><i></i><i></i><i></i></div></div>
    <div class="cd-fire"><i></i><i></i><i></i><i></i></div>
    <div class="cd-floor"></div>
  </div>`;
}
function wizLadderHTML(){
  const stage = _wiz ? _wiz.stage : 0;
  return `<div class="cd-ladder">${CAULDRON_STAGES.map((st,i)=>
    `<div class="cd-step${i<stage?' done':''}${(i===stage && !(_wiz&&_wiz.curdled))?' next':''}"><b>×${st.mult}</b><small>${Math.round(wizRisk(i)*100)}% RISK</small></div>`).join('')}</div>`;
}
function wizExtrasHTML(){
  const tags = [];
  if(S.wzStardust) tags.push('<span class="cw-tag" style="border-color:#ffd24a;color:#ffd24a">✨ STARDUST — NEXT INGREDIENT CAN\'T CURDLE</span>');
  if(_wiz && _wiz.scry) tags.push(_wiz.scry==='safe' ? '<span class="cw-tag" style="border-color:#3ee8c0;color:#8af0d8">🔮 THE BALL SHOWS: IT HOLDS</span>' : '<span class="cw-tag" style="border-color:#ff6a5a;color:#ff8a6a">🔮 THE BALL SHOWS: IT CURDLES</span>');
  const canScry = S.relics.includes('crystalball') && !(_wiz && (_wiz.scryUsed || _wiz.brewing || _wiz.curdled || _wiz.stage >= CAULDRON_STAGES.length));
  return (tags.length ? `<div class="cw-tagrow">${tags.join('')}</div>` : '') +
    (canScry ? `<button class="btn purple sm" onclick="wizScry()">🔮 SCRY THE NEXT INGREDIENT · ONCE PER BREW</button>` : '');
}
function wizRender(){
  const el = document.getElementById('wizArea');
  if(!el) return;
  const pw = S._wizPendingWin;
  let html;
  if(pw && pw.poly){
    html = wzPolyHTML(pw);
    if(html !== _wizLastHtml){ el.innerHTML = html; _wizLastHtml = html; if(pw.poly==='gambler' && !_wzPoly.spinning) denPaintWheel('wheel', 0, 'wzCanvas'); }
    return;
  }
  if(!pw){
    html = wizCauldronHTML('cold') +
      `<div class="cd-mult" style="color:#6a64a8;text-shadow:none;font-size:11px;letter-spacing:2px">THE FIRE IS OUT</div>
       <div class="cw-tagrow"><span class="cw-tag">WIN A CHALLENGE TO LIGHT IT</span></div>`;
  } else if(!_wiz){
    html = wizCauldronHTML('lit') + wizLadderHTML() +
      `<div class="cw-stake">XP ON THE LINE<b>${pw.xpAmount}</b></div>
       <div class="cw-actions">
         ${wizExtrasHTML()}
         <button class="btn primary" onclick="wizAddIngredient()">⚗ START BREWING · ${S.wzStardust ? '✨ SAFE' : Math.round(wizRisk(0)*100)+'% RISK'}</button>
         <button class="btn ghost sm" onclick="wizTakeSafe()">🛡 TAKE SAFE XP (×1)</button>
       </div>`;
  } else {
    const stage = _wiz.stage, mult = wizCurrentMult();
    const maxed = stage >= CAULDRON_STAGES.length;
    const nextRisk = maxed ? null : wizRisk(stage);
    const state = _wiz.curdled ? 'curdle' : (_wiz.brewing ? 'boil' : 'lit');
    const ing = `<div class="cd-ing">${_wiz.ingredients.map(ic=>`<span>${ic}</span>`).join('')}</div>`;
    let actions;
    if(_wiz.curdled) actions = `<div class="cw-tagrow"><span class="cw-tag" style="color:#ff8a6a">💥 IT CURDLED…</span></div>`;
    else if(_wiz.brewing) actions = `<div class="cw-tagrow"><span class="cw-tag">🫧 BUBBLING…</span></div>`;
    else actions = `<div class="cw-actions">
        ${!maxed ? wizExtrasHTML() + `<button class="btn primary" onclick="wizAddIngredient()">⚗ ADD INGREDIENT · ${S.wzStardust ? '✨ SAFE' : _wiz.scry==='safe' ? '🔮 SAFE' : _wiz.scry==='curdle' ? '🔮 WILL CURDLE' : Math.round(nextRisk*100)+'% RISK'}</button>` : `<div class="cw-tagrow"><span class="cw-tag"><b>THE CAULDRON IS FULL</b> — BOTTLE IT</span></div>`}
        <button class="btn gold${maxed?'':' sm'}" onclick="wizBottle()">🍾 BOTTLE IT · ×${mult} = ${Math.round(pw.xpAmount*mult)} XP</button>
      </div>`;
    html = wizCauldronHTML(state) + ing +
      `<div class="cd-mult">×${mult}</div>` + wizLadderHTML() +
      `<div class="cw-stake">XP ON THE LINE<b>${pw.xpAmount}</b></div>` + actions;
  }
  if(html !== _wizLastHtml){ el.innerHTML = html; _wizLastHtml = html; }
}

/* ── shared: particle burst inside any class widget ── */
function cwBurst(hostId, emojis, count){
  const host = document.getElementById(hostId); if(!host) return;
  for(let i=0;i<count;i++){
    const sp = document.createElement('span'); sp.className = 'jk-burst';
    sp.textContent = emojis[i % emojis.length];
    const ang = Math.random()*Math.PI*2, dist = 50 + Math.random()*90;
    sp.style.setProperty('--dx', (Math.cos(ang)*dist)+'px');
    sp.style.setProperty('--dy', (Math.sin(ang)*dist*0.7 - 25)+'px');
    sp.style.setProperty('--rot', (Math.random()*360-180)+'deg');
    sp.style.animationDelay = Math.round(Math.random()*140)+'ms';
    host.appendChild(sp);
    setTimeout(()=>sp.remove(), 1300);
  }
}

/* ── shared: the little animated portrait in each class widget ──
   idle = the character's normal idle cycle; excited (something riding on it) = loops their signature move */
const CW_PORTRAIT = { tank:{ off:0, win:35, py:25 }, gambler:{ off:50, win:40, py:25 }, machine:{ off:150, win:45, py:25 }, wizard:{ off:175, win:45, py:29 }, jester:{ off:104, win:36, py:25 } };
let _cwFrame = 0;
setInterval(()=>{
  if(!S || !CW_PORTRAIT[S.charId]) return;
  const g = document.getElementById('screen-game');
  if(!g || g.classList.contains('hide')) return;
  const c = document.querySelector('canvas.cw-portrait[data-char="'+S.charId+'"]');
  if(!c || !c.offsetParent) return;
  _cwFrame++;
  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);
  const polyId = S.charId==='wizard' && S._wizPendingWin && S._wizPendingWin.poly;
  const ch = CHARS.find(x=>x.id===(polyId || S.charId)), p = CW_PORTRAIT[polyId || S.charId];
  const { scale, px, py } = charDrawParams(ch, 3.4, 8, p.py);
  const excited = !!(S._pendingWin || S._tankPendingWin || S._wizPendingWin || _chugPhase==='going' || _pintHolding);
  drawChar(ctx, ch, px, py, scale, excited ? p.off + (_cwFrame % p.win) : _cwFrame);
  if(polyId){ // the wild magic still shimmers around the borrowed body
    for(let i=0;i<6;i++){
      const a = (_cwFrame*0.12) + i*Math.PI/3, r = 24 + Math.sin(_cwFrame*0.2+i)*3;
      ctx.fillStyle = i%2 ? '#b890ff' : '#8af0d8';
      ctx.globalAlpha = 0.55 + 0.35*Math.sin(_cwFrame*0.3+i);
      ctx.fillRect(30 + Math.cos(a)*r - 1.5, 38 + Math.sin(a)*r*1.1 - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1;
  }
}, 90);

function denPaintWheel(gameId, rotation, canvasId){
  const c = document.getElementById(canvasId || 'denCanvas'); if(!c) return;
  const ctx = c.getContext('2d');
  const segs = canvasId ? DEN_GAMES[gameId].segs : denSegs(gameId);
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
  const _hasSharkSpin = (S.relics||[]).includes('loanshark');
  if(!hasPending){
    if((S.coins||0) < 0 && !_hasSharkSpin){
      toast('YOU\'RE IN DEBT — EARN COINS BEFORE GAMBLING');
      return;
    }
    if((S.coins||0) === 0 && !_hasSharkSpin){
      toast('NO COINS — WIN A CHALLENGE TO EARN SOME');
      return;
    }
  } // XP wager has no coin requirement — debt doesn't block it
  if(!hasPending){
    // enforce spin cap for coin gambling
    if((S.denSpinsLeft||0) <= 0){
      toast('NO SPINS LEFT — COMPLETE A CHALLENGE TO REFRESH');
      return;
    }
    S.denSpinsLeft = (S.denSpinsLeft||1) - 1;
    // Discover ONE MORE SPIN I SWEAR when spins run out
    if((S.denSpinsLeft||0) <= 0 && !(S.discovered||[]).includes('icebucket')){
      S.discovered = (S.discovered||[]).concat(['icebucket']); save();
      setTimeout(()=>discoverItem('icebucket'), 800);
    }
    // coin mode: deduct bet upfront (debt allowed)
    S.coins = (S.coins||0) - _denBet;
    save(); syncHUD();
  }
  _denSpinning = true;
  const spinBtn = document.getElementById('denSpinBtn');
  const safeBtn = document.getElementById('denSafeBtn');
  if(spinBtn){ spinBtn.disabled=true; spinBtn.textContent='SPINNING…'; }
  if(safeBtn) safeBtn.classList.add('hide');

  // pick outcome (artifact-adjusted odds)
  const segs = denSegs(_denGame);
  const r = Math.random();
  let targetIdx = segs.length-1, cum = 0;
  for(let i=0;i<segs.length;i++){
    cum += segs[i].pct;
    if(r < cum){ targetIdx = i; break; }
  }

  // compute final rotation
  let cumAng = 0;
  const mids = segs.map(seg=>{
    const mid = cumAng + seg.pct * Math.PI;
    cumAng += seg.pct * Math.PI * 2;
    return mid;
  });
  const jitter = (Math.random()-0.5)*0.5*segs[targetIdx].pct*Math.PI*2;
  const landAt  = mids[targetIdx] + jitter;
  const finalRot = (5 + Math.random()*3)*Math.PI*2 - landAt;

  const dur = 3500, t0 = Date.now();
  (function anim(){
    const p = Math.min(1,(Date.now()-t0)/dur);
    const e = 1 - Math.pow(1-p,4);
    denPaintWheel(_denGame, finalRot*e);
    if(p < 1){ requestAnimationFrame(anim); return; }
    _denSpinning = false;
    const seg = segs[targetIdx];
    const res = document.getElementById('denResult');
    if(res){
      if(seg.mult===0)        res.innerHTML = '<span style="color:#c03028">💀 BUST</span>';
      else if(seg.mult>=3)  res.innerHTML = '<span style="color:#d4a820">🏆 WIN \xd7'+seg.mult+'</span>';
      else if(seg.mult===1) res.innerHTML = '<span style="color:#8a6a44">\u2014 NOTHING</span>';
      else                  res.innerHTML = '<span style="color:#a0e060">✅ WIN \xd7'+seg.mult+'</span>';
    }
    if(hasPending){
      _finishApplyWin(gbXPMult(seg.mult));
    } else {
      // coin mode — bet already deducted upfront
      let _denCardTag, _denCardTitle, _denCardBody, _denCardChips, _denCardCls, _denCardBtn;
      if(seg.mult === 0 && gbHas('gb_house') && !S.gbHouseUsed){
        S.gbHouseUsed = true;
        S.coins = (S.coins||0) + _denBet;
        addLog('🏠 HOUSE MONEY — '+game.name+' bust, '+_denBet+'🪙 refunded');
        _denCardCls=''; _denCardTag='🏠 HOUSE MONEY';
        _denCardTitle='ON THE HOUSE';
        _denCardBody='Bust — but your first bet this round was on the house. '+_denBet+'🪙 back in your pocket.';
        _denCardChips=['BET REFUNDED', _denBet+'🪙'];
        _denCardBtn=`<button class="btn ghost" onclick="denDismissResult()">SPIN AGAIN</button>`;
      } else if(seg.mult === 0){
        addLog('💀 DEN '+game.name+': lost '+_denBet+'🪙. Balance: '+(S.coins||0));
        floatText('-'+_denBet, '#c03028');
        const inDebt = (S.coins||0) < 0;
        _denCardCls='forfeit'; _denCardTag='💀 BUST';
        _denCardTitle='THE HOUSE WINS';
        _denCardBody='Lost '+_denBet+'🪙. Balance: '+(S.coins||0)+'🪙'+(inDebt?' — you\'re in debt.':'.');
        _denCardChips=['-'+_denBet+'🪙', inDebt?'IN DEBT 🟥':''];
        _denCardBtn=`<button class="btn ghost" onclick="denDismissResult()">WALK AWAY</button>`;
        // Discoveries
        if(S.charId==='gambler' && (S.coins||0)<=0 && !(S.discovered||[]).includes('loanshark')){
          S.discovered=(S.discovered||[]).concat(['loanshark']); save();
          setTimeout(()=>discoverItem('loanshark'), 800);
        }
        if((S.coins||0) < -20 && !(S.discovered||[]).includes('debtpardon')){
          S.discovered=(S.discovered||[]).concat(['debtpardon']); save();
          setTimeout(()=>discoverItem('debtpardon'), 1200);
        }
      } else if(seg.mult === 1){
        S.coins = (S.coins||0) + _denBet;
        addLog('— DEN '+game.name+': nothing. Bet returned.');
        _denCardCls=''; _denCardTag='— PUSH';
        _denCardTitle='NOTHING HAPPENS';
        _denCardBody='The wheel gave nothing. Your '+_denBet+'🪙 bet came back. Try again.';
        _denCardChips=['BET RETURNED', _denBet+'🪙'];
        _denCardBtn=`<button class="btn ghost" onclick="denDismissResult()">SPIN AGAIN</button>`;
      } else {
        const coinMult = seg.mult + (gbHas('gb_ancestor') ? 1 : 0);
        const won = Math.round(_denBet * coinMult);
        S.coins = (S.coins||0) + won;
        const net = won - _denBet;
        gbAddWinnings(net, 'den');
        addLog('✅ DEN '+game.name+': bet '+_denBet+'🪙, won '+won+'🪙 (net +'+net+')');
        floatText('+'+net, '#d4a820');
        const isBig = net > 50;
        _denCardCls='good'; _denCardTag=seg.mult>=3?'🏆 JACKPOT':'✅ WIN';
        _denCardTitle='+'+net+' COINS';
        _denCardBody='Bet '+_denBet+'🪙 · Won '+won+'🪙 · Net gain '+net+'🪙. The wheel was kind.';
        _denCardChips=['+'+net+'🪙 NET', '×'+coinMult+' MULTIPLIER', '+'+net+' 📜 LEDGER'];
        _denCardBtn=`<button class="btn green" onclick="denDismissResult()">COLLECT</button>`;
        if(S.charId==='gambler' && net > 50 && !(S.discovered||[]).includes('xpchip') && !(S.itemsUsed||{})['xpchip']){
          S.discovered=(S.discovered||[]).concat(['xpchip']); save();
          setTimeout(()=>discoverItem('xpchip'), 800);
        }
      }
      save(); syncHUD();
      window._denSpinBtn = spinBtn;
      window._denGameRef = game;
      showCard({ cls:_denCardCls, tag:_denCardTag, title:_denCardTitle, body:_denCardBody, chips:(_denCardChips||[]).filter(Boolean), buttons:_denCardBtn });
    }
  })();
}

function denTakeSafe(){
  if(!S._pendingWin) return;
  _finishApplyWin(1);
}

function denDismissResult(){
  closeCard();
  const btn = window._denSpinBtn;
  const g   = window._denGameRef;
  if(btn && g){ btn.disabled=false; btn.textContent=g.icon+' SPIN ('+_denBet+'🪙)'; }
  const res2 = document.getElementById('denResult');
  if(res2) res2.textContent='';
  window._denSpinBtn = null; window._denGameRef = null;
}

function _finishApplyWin(xpMult){
  const pw = S._pendingWin;
  if(!pw){ save(); syncHUD(); return; }
  S._pendingWin = null;
  const { t, xpAmount, isRevenge } = pw;
  const finalXP = Math.round(xpAmount * xpMult);
  const midas = (gbHas('gb_midas') && t.t===T.GAMBLE) ? t.xp : 0;
  const coinsGained = Math.max(5, Math.round(t.xp/2)) + midas;
  if(xpMult > 1) gbAddWinnings(finalXP - xpAmount, 'xp wager');
  // Show result card before granting XP
  let cardCls, cardTag, cardTitle, cardBody, cardChips, cardBtn;
  if(xpMult === 0){
    floatText('BUST', '#c03028');
    addLog('💀 '+t.n+' — gambled and lost everything. 0 XP.');
    cardCls='forfeit'; cardTag='💀 BUST'; cardTitle='THE HOUSE WINS';
    cardBody='You put it all on the line and the wheel took it. No XP. Drink your beer.';
    cardChips=['0 XP', coinsGained+'🪙 ANYWAY'];
    cardBtn=`<button class="btn ghost" onclick="gamblerClaimXP()">WALK AWAY</button>`;
  } else if(xpMult >= 3){
    addLog('🏆 JACKPOT — '+t.n+' ×'+xpMult+' = +'+finalXP+' XP');
    floatText('JACKPOT', '#d4a820');
    cardCls='good'; cardTag='🏆 JACKPOT'; cardTitle='JACKPOT!';
    cardBody='×'+xpMult+' multiplier on '+t.n+'. The wheel was very, very kind.';
    cardChips=['+'+finalXP+' XP', '×'+xpMult+' MULTIPLIER', coinsGained+'🪙'];
    cardBtn=`<button class="btn green" onclick="gamblerClaimXP()">COLLECT</button>`;
  } else if(xpMult > 1){
    addLog('🎲 WIN — '+t.n+' ×'+xpMult+' = +'+finalXP+' XP');
    cardCls='good'; cardTag='🎲 WIN'; cardTitle='WIN!';
    cardBody='×'+xpMult+' on '+t.n+'. The house didn\'t get you this time.';
    cardChips=['+'+finalXP+' XP', '×'+xpMult+' MULTIPLIER', coinsGained+'🪙'];
    cardBtn=`<button class="btn green" onclick="gamblerClaimXP()">COLLECT</button>`;
  } else {
    addLog('✓ '+t.n+' — +'+finalXP+' XP (safe)');
    cardCls=''; cardTag='🛡 SAFE'; cardTitle='SAFE TAKE';
    cardBody='Played it safe. 1× XP — no spin, no risk, no glory.';
    cardChips=['+'+finalXP+' XP', coinsGained+'🪙'];
    cardBtn=`<button class="btn ghost" onclick="gamblerClaimXP()">TAKE IT</button>`;
  }
  if(isRevenge) addLog('⚔ REVENGE — beat '+t.n+' after it beat you.');
  window._pendingGamblerXP = { finalXP, xpMult, t, coinsGained, isRevenge };
  save(); syncHUD();
  showCard({ cls:cardCls, tag:cardTag, title:cardTitle, body:cardBody, chips:(cardChips||[]).filter(Boolean), buttons:cardBtn });
}
function gamblerClaimXP(){
  const p = window._pendingGamblerXP;
  if(!p) return;
  window._pendingGamblerXP = null;
  closeCard();
  if(p.finalXP > 0) grantXP(p.finalXP, p.t.n);
  if(p.isRevenge){ toast('⚔ REVENGE SERVED. '+p.t.n+' AVENGED.'); }
  const { t, coinsGained } = p;
  if(t.drink){ S.drinks++; let pa=(t.t===T.SHOT?16:12); if(S.relics.includes('shades')) pa=Math.round(pa*0.8); addPace(pa); }
  if(t.heal){ S.waters++; addPace(-t.heal); }
  S.badLuckHeat = Math.max(0, (S.badLuckHeat||0)-1);
  grantSouvenir(t.t);
  grantCoins(coinsGained);
  denResetSpins();
  S.jkActs = JK_ACTS; // the Jester's street act refills with every win
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
  a.innerHTML = ACHIEVEMENTS.filter(x=>!x.char || x.char===S.charId).map(x=>{
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
function epicToast(msg){
  document.querySelectorAll('.toast').forEach(t=>t.remove());
  const d=document.createElement('div'); d.className='toast epic-toast'; d.textContent=msg;
  document.body.appendChild(d);
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>d.remove(), 5000);
}

/* ---------- slot machine ---------- */
let slotSpinning = false;
function spinSlot(){
  if(slotSpinning) return;
  if(S.currentTile && !S.resolved){
    toast('FINISH YOUR CHALLENGE FIRST');
    showChallengeInline();
    return;
  }
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
    return;
  }
  if(S.jkJuggle){ toast('🤹 FINISH YOUR ACT FIRST'); return; }
  if(S._jesterPendingWin){
    toast('🎭 DRAW YOUR FATE FIRST');
    const jd = document.getElementById('jesterDeck');
    if(jd) jd.scrollIntoView({ behavior:'smooth', block:'center' });
    return;
  }
  if(S._wizPendingWin){
    toast(S._wizPendingWin.poly ? '🌀 FINISH YOUR POLYMORPH FIRST' : '🧪 BOTTLE YOUR POTION FIRST');
    const wc = document.getElementById('wizardCauldron');
    if(wc) wc.scrollIntoView({ behavior:'smooth', block:'center' });
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
    if(S.charId==='jester'){
      const tb = S.tricks||0;
      if(tb < jkMaxTricks()) S.tricks = tb + 1;
      S.respin = Math.min(2, (S.respin||0) + 1);
      addLog('🎭 New lap — +1 Trick and +1 Wheel re-spin');
    }
    grantXP(25,'lap'); grantCoins(30);
    toast('🏁 ANOTHER LAP — SQUAD TOAST! +30🪙'); addLog('Another lap of the town — squad toast');
  }
  save();
  showChallengeInline();
}

function handleRoll(){
  // If gambler was in blackjack mode, snap den back to wheel before rolling
  if(_denGame === 'blackjack'){ _denGame = 'wheel'; _bj = null; refreshDen(); }
  if(S && S.charId === 'machine') startFill();
  else spinSlot();
}

function syncRollUI(){
  const isSir = S && S.charId === 'machine';
  const slot = document.getElementById('slotWrap');
  const pint = document.getElementById('diceWrap');
  const btn  = document.getElementById('btnSpin');
  const ci   = document.getElementById('challengeInline');
  const inChallenge = !!(ci && !ci.classList.contains('hide'));
  if(slot) slot.classList.toggle('hide', isSir || inChallenge);
  if(pint) pint.classList.toggle('hide', !isSir || inChallenge);
  if(btn) btn.classList.toggle('hide', isSir || inChallenge);
  if(btn && !isSir) btn.textContent = '🎰 PULL THE LEVER';
  if(isSir && !_pintHolding && _pintFill===0) paintPint(0, false, false);
  if(isSir) refreshTapStats();
}

/* ---------- pint glass fill animation (Sir Drinks-A-Lot) ---------- */
let _pintAnimFrame = null;
let _pintFill = 0;
let _pintHolding = false;

function paintPint(fillFrac, foamSettled, tapPulled){
  const c = document.getElementById('pintCanvas'); if(!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);
  const gw = 70, gh = 130, taper = 7;
  const gx = (W - gw) / 2, gy = (H - gh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(gx + taper, gy);
  ctx.lineTo(gx - 2, gy + gh);
  ctx.lineTo(gx + gw + 2, gy + gh);
  ctx.lineTo(gx + gw - taper, gy);
  ctx.closePath();
  ctx.clip();
  if(fillFrac > 0){
    const fillTop = gy + gh * (1 - fillFrac);
    const beerGrad = ctx.createLinearGradient(gx, fillTop, gx+gw, fillTop);
    beerGrad.addColorStop(0, '#b86c18');
    beerGrad.addColorStop(0.3, '#e8a030');
    beerGrad.addColorStop(0.7, '#d08828');
    beerGrad.addColorStop(1, '#9a5810');
    ctx.fillStyle = beerGrad;
    ctx.fillRect(gx-4, fillTop, gw+8, gh);
    if(!foamSettled){
      const t = Date.now() / 350;
      for(let i=0; i<12; i++){
        const bx = gx + 5 + (i * 5.8) % (gw - 10);
        const totalH = gh * fillFrac;
        const by = fillTop + (totalH - ((t * 22 + i * 11) % totalH));
        ctx.globalAlpha = 0.3 + 0.25*Math.sin(i*2.1);
        ctx.fillStyle = '#ffe090';
        ctx.beginPath(); ctx.arc(bx, by, 2, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    const foamH = foamSettled ? 10 : 16;
    const foamTop = fillTop - foamH;
    ctx.fillStyle = '#f4eeda';
    ctx.beginPath();
    ctx.moveTo(gx-4, fillTop);
    for(let i=0; i<=12; i++){
      const fx = gx - 4 + (gw+8)*i/12;
      const wobble = foamSettled ? Math.sin(i*1.2)*2.5 : Math.sin(i*1.6 + Date.now()/180)*5;
      ctx.lineTo(fx, foamTop + wobble);
    }
    ctx.lineTo(gx+gw+4, fillTop);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(200,230,255,0.75)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(gx + taper, gy); ctx.lineTo(gx - 2, gy + gh);
  ctx.lineTo(gx + gw + 2, gy + gh); ctx.lineTo(gx + gw - taper, gy);
  ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,230,255,0.6)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(gx + gw + 16, gy + gh*0.4, 14, -Math.PI*0.5, Math.PI*0.5);
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.2; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(gx + taper + 8, gy + 8); ctx.lineTo(gx + 6, gy + gh - 10); ctx.stroke();
  ctx.restore();
  // ── pour gauge: the fill zones, so the knight knows where to let go ──
  const ZONES = [
    { a:0,    b:0.15, c:'#7a2a2a', t:'×0.5' },
    { a:0.15, b:0.45, c:'#4a5268', t:'×0.85' },
    { a:0.45, b:0.75, c:'#a07a20', t:'×1.1' },
    { a:0.75, b:0.92, c:'#3aa84a', t:'×1.5 ✓' },
    { a:0.92, b:1.0,  c:'#ffd24a', t:'×1.8 ★' }
  ];
  const barX = gx - 44, barW = 10, yAt = f => gy + gh*(1-f);
  const cur = fillFrac > 0 ? ZONES.find(z => fillFrac >= z.a && (fillFrac < z.b || z.b===1)) : null;
  ctx.save();
  ctx.fillStyle = '#05070c'; ctx.fillRect(barX-2, gy-2, barW+4, gh+4);
  ZONES.forEach(z=>{
    const y1 = yAt(z.b), y2 = yAt(z.a);
    ctx.globalAlpha = (cur===z) ? 1 : 0.75;
    ctx.fillStyle = z.c; ctx.fillRect(barX, y1, barW, y2-y1);
    ctx.globalAlpha = (cur===z) ? 1 : 0.7;
    ctx.fillStyle = cur===z ? '#ffffff' : z.c;
    ctx.font = (cur===z ? 'bold ' : '') + '9px monospace';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(z.t, barX-6, (y1+y2)/2);
  });
  ctx.globalAlpha = 1;
  // perfect band ghosted across the glass itself
  ctx.setLineDash([4,3]); ctx.lineWidth = 1;
  [[0.75,'rgba(58,168,74,.8)'],[0.92,'rgba(255,210,74,.8)']].forEach(([f,c])=>{
    ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(gx+2, yAt(f)); ctx.lineTo(gx+gw-2, yAt(f)); ctx.stroke();
  });
  ctx.setLineDash([]);
  if(fillFrac > 0){ // level marker
    const my = yAt(Math.min(1, fillFrac));
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(barX+barW+2, my); ctx.lineTo(barX+barW+9, my-5); ctx.lineTo(barX+barW+9, my+5); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function refreshTapStats(){
  const el = document.getElementById('pintStatLbl'); if(!el || !S) return;
  const st = S.pintStats || { pours:0, perfect:0 };
  el.innerHTML = '🍺 <b>'+st.pours+'</b> POURS · ✓ <b>'+st.perfect+'</b> PERFECT';
}

function fillZone(f){
  if(f < 0.15) return { label:'BARELY A SIP',   mult:0.5  };
  if(f < 0.45) return { label:'DECENT PULL',    mult:0.85 };
  if(f < 0.75) return { label:'SOLID POUR',     mult:1.1  };
  if(f < 0.92) return { label:'PERFECT PINT ✓', mult:1.5  };
  return             { label:'OVERFLOWING! 🍺',  mult:1.8  };
}

function startFill(e){
  if(e) e.preventDefault();
  if(S._pendingWin || S._tankPendingWin) return;
  if(S.currentTile && !S.resolved){ toast('FINISH YOUR CHALLENGE FIRST'); showChallengeInline(); return; }
  if(_pintHolding || _pintFill >= 1) return;
  _pintHolding = true;
  runFillLoop();
}

function stopFill(e){
  if(e) e.preventDefault();
  if(!_pintHolding) return;
  _pintHolding = false;
  if(_pintFill > 0.04) resolvePint();
}

function runFillLoop(){
  if(!_pintHolding){ _pintAnimFrame = null; return; }
  _pintFill = Math.min(1, _pintFill + 0.007);
  const zone = fillZone(_pintFill);
  const lbl = document.getElementById('pintResultLabel');
  if(lbl) lbl.textContent = _pintFill >= 1
    ? (Math.floor(Date.now()/300)%2===0 ? 'OVERFLOWING! 🍺' : 'RELEASE NOW!')
    : zone.label;
  paintPint(_pintFill, false, true);
  _pintAnimFrame = requestAnimationFrame(runFillLoop);
}

let _pendingFillMult = 1;

function resolvePint(){
  _pintAnimFrame = null; _pintHolding = false;
  const fill = _pintFill;
  const zone = fillZone(fill);
  S.pintStats = S.pintStats || { pours:0, perfect:0 };
  S.pintStats.pours++;
  if(zone.mult >= 1.5) S.pintStats.perfect++;
  save(); refreshTapStats();
  const tapBtn = document.getElementById('tapBtn');
  if(tapBtn) tapBtn.disabled = true;
  let settleT = 0;
  function settle(){
    settleT += 0.06;
    paintPint(fill, settleT > 0.5, false);
    if(settleT < 1){ requestAnimationFrame(settle); return; }
    const outcome = spinOutcome();
    _pendingFillMult = zone.mult;
    const lbl = document.getElementById('pintResultLabel');
    if(lbl) lbl.textContent = zone.label;
    setTimeout(()=>previewPintResult(outcome, zone), 350);
  }
  settle();
}

function previewPintResult(tile, zone){
  window._pendingSlotTile = tile;
  if(tile.t===T.CHAOS){ S.currentTile = tile; S.resolved = false; save(); openWheel(); return; }
  const canReroll = S.skips>0;
  const xpNote = zone.mult >= 1.5 ? ' ✨ BONUS XP' : zone.mult <= 0.5 ? ' (low pour)' : '';
  showCard({
    cls: tile.t===T.BADLUCK ? 'curse' : zone.mult >= 1.5 ? 'good' : '',
    tag: tile.t===T.BADLUCK ? '💀 THE TAP HAS CURSED YOU' : `🍺 ${zone.label}`,
    title:`${tile.icon} ${tile.n}`, venue: tile.venue, body:'',
    chips:[`+${Math.round(tile.xp * zone.mult)} XP${xpNote}`, tile.drink?'🍺 DRINK':'', tile.gamble?'🎲 FORFEIT IF LOST':'', tile.heal?'💧 MERCY':'', tile.t===T.BADLUCK?'💀 BAD LUCK':''].filter(Boolean),
    extra:`<p class="small dim">Accept it, or spend a reroll to pour again.</p>`,
    buttons:`<button class="btn green" onclick="acceptPintResult()">✅ ACCEPT</button>
             ${canReroll ? `<button class="btn ghost sm" onclick="useRerollPint()">🔁 REROLL (${S.skips} left)</button>` : ''}`
  });
}

function acceptPintResult(){
  const tile = window._pendingSlotTile; if(!tile) return;
  closeCard();
  _pintFill = 0;
  const tapBtn = document.getElementById('tapBtn'); if(tapBtn) tapBtn.disabled = false;
  const lbl = document.getElementById('pintResultLabel'); if(lbl) lbl.textContent = '';
  paintPint(0, false, false);
  const origXP = tile.xp;
  tile.xp = Math.round(origXP * _pendingFillMult);
  S.currentTile = tile; S.resolved = false;
  S.pulls = (S.pulls||0) + 1;
  if(tile.t===T.KARAOKE) S.karaokeDone = true;
  if(S.pulls % 3 === 0){
    S.laps++; S.hatUsedThisLap = false; S.shopPending = true;
    if(S.charId==='jester'){
      const tb = S.tricks||0;
      if(tb < jkMaxTricks()) S.tricks = tb + 1;
      S.respin = Math.min(2, (S.respin||0) + 1);
      addLog('🎭 New lap — +1 Trick and +1 Wheel re-spin');
    }
    grantXP(25,'lap'); grantCoins(30);
    toast('🏁 ANOTHER LAP — SQUAD TOAST! +30🪙'); addLog('Another lap of the town — squad toast');
  }
  tile.xp = origXP;
  save(); showChallengeInline();
}

function useRerollPint(){
  if(S.skips<=0) return;
  S.skips--; addLog('Used a reroll on the tap'); save(); syncHUD(); closeCard();
  _pintFill = 0; _pintHolding = false;
  const tapBtn = document.getElementById('tapBtn'); if(tapBtn) tapBtn.disabled = false;
  const lbl = document.getElementById('pintResultLabel'); if(lbl) lbl.textContent = '';
  paintPint(0, false, false);
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
    syncHUD(); // immediately re-lock lever if Tank/Gambler set pending state
  } else {
    S.fails++;
    S.badLuckHeat = Math.min(10, (S.badLuckHeat||0)+1);
    floatText('MISS', '#ff4d5e');
    if(S.charId==='jester') jkAddMirth(20, 'fail'); // the court loves a fool who falls
    if(S.charId==='wizard') wzAddSurge(20, 'fail');  // failure feeds wild magic
    if(S.charId==='gambler' && t.t===T.GAMBLE && gbHas('gb_tongue')){ S.coins = (S.coins||0) + 10; addLog('🗣️ Silver Tongue — 10🪙 of hush money'); }
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
  const dbl = (ch.id==='gambler' && t && t.t===T.GAMBLE && !gbHas('gb_tongue'));
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
         `
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
  const ch = CHARS.find(c=>c.id===S.charId);
  if(ch.id==='jester' && (S.respin||0)>0){
    // the Jester doesn't have to accept fate — decide BEFORE anything is paid out
    window._pendingWheelResult = w;
    showCard({
      cls:'chaos',
      tag:'THE WHEEL HAS SPOKEN… OR HAS IT?',
      title:'🎡 '+w.n,
      body:w.d,
      chips:[`+${Math.round(w.xp*1.5)} XP`, '+25 🔔 MIRTH', w.drink?'🍺 DRINK':'', w.heal?'💧 MERCY':''].filter(Boolean),
      extra:`<p class="small" style="color:#c08aff">🃏 A Jester may spit in fate's eye. Re-spins left: <b class="gold">${S.respin}</b> — you get another every lap.</p>`,
      buttons:`<button class="btn primary" onclick="acceptWheelResult()">✓ ACCEPT FATE</button>
               <button class="btn gold sm" onclick="jesterRespin()">🃏 RE-SPIN THE WHEEL (${S.respin} left)</button>`
    });
    return;
  }
  applyWheelResult(w);
}
function acceptWheelResult(){
  const w = window._pendingWheelResult; if(!w) return;
  window._pendingWheelResult = null;
  closeCard();
  applyWheelResult(w);
}
function applyWheelResult(w){
  S.resolved = true;
  const ch = CHARS.find(c=>c.id===S.charId);
  const bonus = ch.id==='jester' ? 1.5 : 1;
  const gained = Math.round(w.xp*bonus);
  grantXP(gained, 'wheel'); // use grantXP so level-ups trigger brewery chest correctly
  if(w.drink){ S.drinks++; addPace(12); }
  if(w.heal){ S.waters++; addPace(-w.heal); }
  if(w.doubleNext) S.doubleNext = true;
  if(ch.id==='jester') jkAddMirth(25, 'wheel');
  grantSouvenir(T.CHAOS);
  grantCoins(5);
  addLog(`🎡 ${w.n} — +${gained} XP`);
  checkAchievements(); save(); syncHUD();
  maybeOpenShop();
  showCard({
    cls:'chaos',
    tag:'THE WHEEL HAS SPOKEN',
    title:'🎡 '+w.n,
    venue:'',
    body:w.d,
    chips:[`+${gained} XP`, ch.id==='jester'?'+25 🔔 MIRTH':'', w.drink?'🍺 DRINK':'', w.heal?'💧 MERCY':''].filter(Boolean),
    buttons:`<button class="btn primary" onclick="closeCard()">✓ ACCEPTED</button>`
  });
}
function jesterRespin(){
  if((S.respin||0)<=0) return;
  S.respin--;
  window._pendingWheelResult = null;
  addLog('🃏 The Jester laughed at fate and re-spun the Wheel');
  save(); openWheel();
}

/* ---------- generic card renderer ---------- */
/* ---------- inline challenge card ---------- */
function showChallengeInline(){
  const t = S.currentTile; if(!t) return;
  const slotWrap = document.getElementById('slotWrap');
  const btnSpin  = document.getElementById('btnSpin');
  const card     = document.getElementById('challengeInline');
  if(slotWrap) slotWrap.classList.add('hide');
  if(btnSpin)  btnSpin.classList.add('hide');
  const pintWrap = document.getElementById('diceWrap');
  if(pintWrap) pintWrap.classList.add('hide');

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
  syncRollUI(); // puts the Knight's tap back (and keeps the reels hidden for him)
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
    jester: { tag:'THE COURT — BEHIND THE CURTAIN', title:'THE MOTLEY MARKET', tagline:'Bells, masks and marked cards. No refunds — only punchlines.' },
    wizard: { tag:'THE TOWER — TOP FLOOR', title:'THE APOTHECARY', tagline:'Eye of newt, sold by the pint. Side effects include glory.' },
    machine:{ tag:"THE KNIGHT'S HALL — SUPPLY TENT", title:'THE QUARTERMASTER', tagline:'Polished steel, fresh mead, and absolutely no refunds on lances.' },
  };
  const theme = shopThemes[S.charId] || { tag:'PIT STOP', title:'THE SHOP', tagline:'Spend it or lose it.' };

  function itemCard(r, type, isExclusive){
    if(r.discoverable && !(S.discovered||[]).includes(r.id)) return ''; // hidden until found
    const owned   = type==='relic' ? S.relics.includes(r.id) : false;
    const qty     = type==='item'  ? (S.items[r.id]||0) : 0;
    const afford  = S.coins >= r.price;
    const oneTimeUsed = r.oneTime && ((S.items[r.id]||0) === 0) && (S.itemsUsed||{})[r.id];
    const copy = itemCopy(r);
    const chips = [];
    if(type==='relic' && r.brewBonus) chips.push(`<span class="si-chip si-chip--brew">🍺 +${r.brewBonus}/MIN</span>`);
    if(type==='relic') chips.push(`<span class="si-chip">PERMANENT</span>`);
    if(type==='item')  chips.push(`<span class="si-chip">${r.oneTime?'ONE PER RUN':'SINGLE USE'}</span>`);
    if(qty>0)          chips.push(`<span class="si-chip si-chip--bag">×${qty} IN BAG</span>`);
    if(r.discoverable) chips.push(`<span class="si-chip si-chip--secret">✦ SECRET</span>`);
    const buyBtn = (fn, extra='') => `<button class="si-buy si-buy--${type}${extra}" onclick="${fn}" ${afford?'':'disabled'}>${ico('🪙',12)}<span class="si-price">${r.price}</span></button>`;
    let actionHtml;
    if(type==='relic' && owned){
      actionHtml = `<span class="si-state si-state--own">✓ EQUIPPED</span>`;
    } else if(type==='item' && oneTimeUsed){
      actionHtml = `<span class="si-state si-state--spent">✗ SPENT</span>`;
    } else {
      const fn  = type==='relic' ? `buyRelic('${r.id}')` : `buyConsumable('${r.id}')`;
      const need = afford ? '' : `<span class="si-need">NEED ${r.price - S.coins} MORE</span>`;
      const xpBtn = S.haggleActive ? `<button class="si-buy si-buy--xp" onclick="buyWithXP('${type==='relic'?'relic':'item'}','${r.id}')"><span class="si-price">${r.price}</span><span class="si-unit">XP</span></button>` : '';
      actionHtml = `${need}${xpBtn}${buyBtn(fn)}`;
    }
    const cls = ['shop-item', 'si--'+type];
    if(owned) cls.push('shop-item--owned');
    if(oneTimeUsed) cls.push('shop-item--spent');
    if(isExclusive) cls.push('shop-item--exclusive');
    if(!afford && !owned && !oneTimeUsed) cls.push('si--poor');
    return `<div class="${cls.join(' ')}">
      <div class="si-plaque">
        <div class="si-art">${itemArt(r, 54)}${owned?'<span class="si-stamp">OWNED</span>':''}</div>
        <div class="si-kind">${type==='relic'?'RELIC':'ITEM'}</div>
      </div>
      <div class="shop-item__body">
        <div class="shop-item__name">${r.n}</div>
        <div class="si-chips">${chips.join('')}</div>
        ${copy.flav ? `<div class="si-flav">${copy.flav}</div>` : ''}
        ${copy.fx ? `<div class="shop-item__desc">${copy.fx}</div>` : ''}
        <div class="shop-item__action">${actionHtml}</div>
      </div>
    </div>`;
  }

  const myRelics  = RELICS.filter(r=> r.char===S.charId && !r.artifact);
  const genRelics = RELICS.filter(r=>!r.char);
  const myItems   = CONSUMABLES.filter(c=> c.char===S.charId);
  const genItems  = CONSUMABLES.filter(c=>!c.char);

  const exclusiveSection = (myRelics.length || myItems.length) ? `
    <div class="shop-exclusive-wrap">
      <div class="shop-exclusive-label">${S.charId==='jester' ? '⚜ THE FOOL\'S KIT — JESTER ONLY' : charName+' EXCLUSIVE'}</div>
      ${myRelics.map(r=>itemCard(r,'relic',true)).join('')}
      ${myItems.map(c=>itemCard(c,'item',true)).join('')}
      ${S.charId==='jester' ? jkShopTarotHTML() : ''}
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
      <div class="shop-section__label"><span>◆ RELICS ◆</span></div>
      <div class="shop-section__sub">Worn forever. Every relic also brews beer while you sleep.</div>
      ${genRelics.map(r=>itemCard(r,'relic',false)).join('')}
    </div>
    <div class="shop-section">
      <div class="shop-section__label"><span>◆ ITEMS ◆</span></div>
      <div class="shop-section__sub">One use each. They wait in your Bag until you need them.</div>
      ${genItems.map(c=>itemCard(c,'item',false)).join('')}
    </div>
  `;
}
function buyRelic(id){
  const r = RELICS.find(x=>x.id===id); if(!r) return;
  if(r.char && r.char!==S.charId) return; // exclusive to another character
  if(r.artifact) return; // ledger artifacts are earned, never bought
  if(S.relics.includes(id)){ toast('ALREADY OWNED'); return; }
  if(S.coins<r.price){
    if((S.xp||0) >= r.price && !(S.discovered||[]).includes('haggle')){
      S.discovered = (S.discovered||[]).concat(['haggle']); save();
      setTimeout(()=>discoverItem('haggle'), 400);
    }
    toast('NOT ENOUGH COINS'); return;
  }
  S.coins -= r.price; S.relics.push(id);
  addLog(`Bought relic: ${r.n} (+${r.brewBonus||0} beer/min, permanently)`);
  toast(r.icon+' '+r.n+' — EQUIPPED, +'+(r.brewBonus||0)+' BEER/MIN');
  save(); syncHUD(); renderShop();
}
function buyConsumable(id){
  const c = CONSUMABLES.find(x=>x.id===id); if(!c) return;
  if(c.char && c.char!==S.charId) return; // exclusive to another character
  if(c.oneTime && (S.itemsUsed||{})[id]){ toast('ALREADY SPENT — ONE PER RUN'); return; }
  if(c.oneTime && (S.items[id]||0) > 0){ toast('YOU ALREADY HAVE ONE'); return; }
  if(S.coins<c.price){
    // Discover GIFT OF THE GAB if they can afford it in XP but not coins
    if((S.xp||0) >= c.price && !(S.discovered||[]).includes('haggle') && id!=='haggle'){
      S.discovered = (S.discovered||[]).concat(['haggle']); save();
      setTimeout(()=>discoverItem('haggle'), 400);
    }
    toast('NOT ENOUGH COINS'); return;
  }
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
  } else if(id==='stardust'){
    if(S.wzStardust){ toast('THE STARDUST IS ALREADY IN THE POT'); S.items[id]++; return; }
    S.wzStardust = true;
    addLog('✨ Stardust sprinkled — the next ingredient cannot curdle');
    toast('✨ YOUR NEXT INGREDIENT IS SAFE');
    refreshCauldron();
  } else if(id==='polyscroll'){
    if((S.wzSurge||0) >= 100){ toast('WILD MAGIC IS ALREADY BREWING'); S.items[id]++; return; }
    S.wzSurge = 0; wzAddSurge(100);
    addLog('🌀 Read the Scroll of Polymorph');
    refreshCauldron();
  } else if(id==='sparemask'){
    jkAddTrick(1, true);
    addLog('🎭 Donned a spare mask — +1 Trick');
    toast('🎭 +1 TRICK UP YOUR SLEEVE');
    floatText('+1 TRICK', '#c08aff');
  } else if(id==='wildcard'){
    if(S.jkWildNext){ toast('A WILD CARD IS ALREADY UP YOUR SLEEVE'); S.items[id]++; return; }
    S.jkWildNext = true;
    addLog('🃏 Wild Card slipped up the sleeve — next draw is stacked');
    toast('🃏 YOUR NEXT DRAW IS STACKED');
    refreshJesterDeck();
  } else if(id==='anotherround'){
    S.chugRoundLeft = (S.chugRoundLeft||0) + 1;
    S.chugAttemptsLeft = (S.chugAttemptsLeft||0) + 1;
    addLog('🥃 One More In The Tank — +1 chug attempt');
    toast('🥃 ONE MORE IN THE TANK — CHUG ATTEMPT RESTORED');
    floatText('+1 CHUG', '#ffd24a');
    refreshChug();
  } else if(id==='xpchip'){
    const xpToConvert = Math.min(100, S.xp||0);
    if(xpToConvert <= 0){ toast('NO XP TO CONVERT — EARN SOME FIRST'); S.items[id]++; return; }
    S.xp -= xpToConvert;
    S.coins += xpToConvert;
    addLog('🪙 Inside Man — converted '+xpToConvert+' XP → '+xpToConvert+' coins');
    toast('🪙 '+xpToConvert+' XP LAUNDERED INTO COINS');
    floatText('+'+xpToConvert+'🪙', '#ffd24a');
    floatText('-'+xpToConvert+' XP', '#38f2e0');
    S.itemsUsed = S.itemsUsed||{}; S.itemsUsed['xpchip'] = true;
    save(); syncHUD(); renderBag(); return;
  } else if(c){
    addLog('Used item: '+c.n);
  }
  save(); syncHUD(); renderBag();
}

function renderGuide(){
  const charId = S ? S.charId : null;
  const el = document.getElementById('guideCharSection');
  if(!el) return;
  
  const sections = {
    tank: `<div class="panel">
      <h2>🍺 YOUR MECHANIC — CHUG TIMER</h2>
      <p class="small">Win a challenge and your XP goes into a chug wager. The screen shows a <b>target time</b> — hand the phone to a friend, they hit <b>START</b>, you chug blind, they hit <b>STOP</b>. <b class="gold">Perfect</b> = ×2.5, <b class="cyan">OK</b> = ×1, <b class="red">Miss</b> = nothing. Perfects fill your <b class="gold">🔥 Rage</b>; full Rage triples your next challenge. Three misses in a row inflict <b class="red">War Wounds</b> (−30% XP) until you land a perfect.</p>
      <p class="small"><b class="gold">Chug modes</b> — pick one before you chug: <b>Basic</b> (1 try) · <b>Iron</b> (🫗 Iron Throat: 2 tries, wider windows) · <b>Horn</b> (📯 Viking Horn: 3 tries, bonus coins on a perfect) · <b>Legend</b> (⚗️ Mead Altar: 4 tries, longer targets, a perfect pays ×3). A <b class="gold">Fake ID</b> auto-wins a tile; <b class="gold">One More in the Tank</b> gives +1 try.</p>
    </div>
    <div class="panel">
      <h2>📜 THE SAGA — YOUR RANKS</h2>
      <p class="small">Every chug is written into your saga: <b class="gold">perfect +3</b>, <b class="cyan">OK +1</b>, <b class="gold">Chug-Off win +3</b>. Each rank is a real power: <b class="gold">Footsoldier</b> (3) OK window +0.3s wider · <b class="gold">Berserker</b> (8) Rage builds 50% faster and OK chugs feed it · <b class="gold">Warlord</b> (15) immune to War Wounds · <b class="gold">Legend</b> (25) every perfect pays 3×.</p>
    </div>
    <div class="panel">
      <h2>⚔ THE CHUG-OFF</h2>
      <p class="small">Once per lap, call out a squadmate from the Longhouse. You both chug to the <b class="gold">same target</b> while a third person runs the timer; your time stays hidden until they've gone. Closest wins. <b class="gold">Win</b>: your next challenge pays ×2, +20🪙, and their name goes on your <b class="gold">🏆 Trophy Wall</b> — each different squadmate beaten gives +5% beer XP forever (up to 3). <b class="red">Lose</b>: you take the forfeit.</p>
    </div>`,
    gambler: `<div class="panel">
      <h2>🎲 YOUR MECHANIC — XP WAGER</h2>
      <p class="small">Win a challenge and your XP goes into <b class="gold">The Den</b>: spin to multiply it, or take it safe. Between challenges the Den runs in <b class="gold">coin mode</b> — bet coins with the chip control. Coin spins refill after every challenge.</p>
      <p class="small"><b class="gold">The tables:</b> 🎡 <b>Wheel</b> (3 spins: 40% lose · 30% ×2 · 30% push) · 🎲 <b>Dice</b> (Loaded Dice: 2 spins, up to ×3) · 🃏 <b>Cards</b> (Tarot Deck: 50/50 for ×2) · 🧲 <b>Horseshoe</b> (Lucky Horseshoe: 1 golden spin at 60/40) · <b>Blackjack</b> (play as many hands as you like).</p>
      <p class="small">Class: <b class="gold">×2 XP on gambling tiles</b>, <b class="red">−25% on physical duels</b>, and your forfeits are doubled. The <b class="gold">Loan Shark's Handshake</b> (secret) lets you keep betting in debt; the <b class="gold">Inside Man's Chip</b> turns up to 100 XP into coins once.</p>
    </div>
    <div class="panel">
      <h2>📜 THE HIGH ROLLER'S LEDGER</h2>
      <p class="small">The thin gold bar in your Den counts everything you <b class="gold">win</b> from gambling — coin profit at the tables and blackjack, bonus XP from winning an XP wager, and every gambling tile you win. Losses never count against you.</p>
      <p class="small">Each time it fills you choose an <b class="gold">artifact</b>: <b style="color:#38c2f2">rare</b> → <b style="color:#a45cff">epic</b> → <b style="color:#ffb62e">legendary</b> → <b style="color:#ff4a4a">mythic</b> — and the fifth fill hands you <b class="gold">Grandfather's First Die</b>, the ancestral relic that makes you the House. Bigger bets fill it faster — if you win them.</p>
    </div>`,
    jester: `<div class="panel">
      <h2>🃏 YOUR MECHANIC — THE TAROT DECK</h2>
      <p class="small">Every challenge you win is a <b class="gold">draw</b>: your tarot deck deals 3 cards face-down onto the stage, you pick one, and it sets your payout. The cards are the 22 <b class="gold">Major Arcana</b> — from ☀️ <b class="gold">The Sun</b> (×3 XP + coins) and ♾️ <b class="gold">The Magician</b> (×2) down to ⚡ <b class="red">The Tower</b> (¼ XP). Rather not gamble? <b class="gold">TAKE SAFE XP</b> pays a flat ×1.</p>
    </div>
    <div class="panel">
      <h2>🛒 BUILD YOUR DECK</h2>
      <p class="small">You start with 17 cards. Buy more of the Major Arcana in the <b class="gold">Motley Market</b> — each one is shuffled into your deck (up to 3 copies, 2 for legendaries; every extra copy costs 50% more). Some bend the rules: <b class="gold">The Fool</b> copies the best card on the table, <b class="gold">The Emperor</b> triples boss fights, <b class="gold">Judgement</b> triples after a Tower, and <b class="gold">The Devil</b> pays ×3 — plus a shot. In your <b class="gold">Bag</b> you can inspect every card and 🔥 <b class="gold">burn</b> the ones you hate for 25🪙 (drawing <b class="gold">Death</b> gives a free burn). A lean deck of strong cards is the goal.</p>
    </div>
    <div class="panel">
      <h2>🤹 THE STREET ACT — BETWEEN CHALLENGES</h2>
      <p class="small">Your own little casino. Stake <b class="gold">10, 25 or 50🪙</b> and juggle cards off the top of <b class="gold">your own deck</b>. Each clean card adds its × to the <b class="gold">Applause</b>; <b class="gold">take a bow</b> any time for stake × Applause ÷ 2. A curse (Tower, Hanged Man) or a fumble drops the lot — fumbles get likelier every toss, and the red bar shows the exact odds. <b class="gold">5 clean cards = PERFECT ACT</b> (+25%). You get <b class="gold">3 acts</b>, refilled by every win — and every act feeds your 🔔 Mirth. Burn your curses and the act gets much safer.</p>
    </div>
    <div class="panel">
      <h2>🎭 TRICKS — CHEAT FATE</h2>
      <p class="small">Masks up your sleeve. Mid-draw, spend one to <b class="gold">👁 PEEK</b> (flip a random face-down card) or <b class="gold">🔀 SHUFFLE</b> (send the whole hand back and redeal). You get <b class="gold">+1 every lap</b>, plus from ⚖️ Justice and 🌍 The World, the Shoes, and the Spare Mask.</p>
    </div>
    <div class="panel">
      <h2>🔔 MIRTH &amp; THE GRAND JEST</h2>
      <p class="small">The court loves a fool. Mirth fills from <b class="gold">party games (+15)</b>, <b class="gold">the Wheel (+25)</b>, <b class="gold">failing a challenge (+20)</b> and — most of all — <b class="gold">drawing bad cards (up to +40)</b>. At 100% your next draw is the <b class="gold">GRAND JEST</b>: every card dealt face-up, you simply take the best. Bad luck is never wasted on a Jester.</p>
    </div>
    <div class="panel">
      <h2>⚜ RANKS OF THE COURT</h2>
      <p class="small">The Fool → <b class="gold">Jongleur</b> (2 draws: hold 4 Tricks) → <b class="gold">Motley Master</b> (5 draws or The Sun: curses never pay under ×0.5) → <b class="gold">Lord of Misrule</b> (10 draws or 3 Grand Jests: Grand Jest pays +50%) → <b class="gold">King of Fools</b> (18 draws, 3 Suns or 5 Grand Jests: The Sun pays ×4).</p>
    </div>
    <div class="panel">
      <h2>🎡 THE WHEEL &amp; THE MOTLEY MARKET</h2>
      <p class="small"><b class="gold">+50% XP</b> from the Wheel of Chaos, and you may <b class="gold">RE-SPIN</b> before accepting fate (1 re-spin per lap, hold up to 2). The shop's Jester kit bends the Deck itself: the <b class="gold">Marked Deck</b> deals one card face-up, the <b class="gold">Fool's Sceptre</b> flips The Tower into gold, and the <b class="gold">Stolen Crown</b> deals a 4th card.</p>
    </div>`,
    machine: `<div class="panel">
      <h2>⚔ YOUR MECHANIC — THE KNIGHT'S TAP</h2>
      <p class="small">No lever for you. <b class="gold">Hold the tap</b> to pour a pint, and let go when you dare: the fill level sets the XP multiplier of the tile you land on. The gauge beside the glass shows every zone — <b class="red">under 15% ×0.5</b> · <b>to 45% ×0.85</b> · <b>to 75% ×1.1</b> · <b class="green">to 92% ×1.5 ✓</b> · <b class="gold">92–100% ×1.8 ★</b>. Don't like the tile? Spend a reroll to pour again.</p>
      <p class="small">Class: <b class="gold">+50% XP on physical challenges</b> (they come up more), <b class="red">−25% at the casino</b>. The Quartermaster sells <b class="gold">Liquid Courage</b> (beer/min, and a glowing pipe in your brewery) and <b class="gold">Iron Knuckles</b> (+25% more on physical tiles).</p>
    </div>`,
    wizard: `<div class="panel">
      <h2>🧪 YOUR MECHANIC — THE CAULDRON</h2>
      <p class="small">Win a challenge and the <b class="gold">Cauldron</b> lights up instead of a flat payout. Toss in an ingredient to brew: each one raises your multiplier — <b>×1.3</b> (5% risk) → <b>×1.7</b> (12%) → <b>×2.2</b> (20%) → <b>×3.0</b> (32%) → <b class="gold">×4.2</b> (48%). After every ingredient choose: <b class="gold">ADD ANOTHER</b> or <b class="gold">BOTTLE IT</b>. Curdle and you salvage only a splash of XP. <b class="gold">TAKE SAFE XP</b> pays a flat 1×.</p>
      <p class="small">Your class: <b class="gold">+40% XP on shots</b> (they're potions, obviously) and shot tiles come up more — <b class="red">−25% on party games</b>.</p>
    </div>
    <div class="panel">
      <h2>🌀 WILD MAGIC — POLYMORPH</h2>
      <p class="small">The <b class="gold">Arcane Surge</b> bar fills from chaos: every ingredient (+8), every <b class="red">curdled potion (+40)</b>, every failed challenge (+20). When it's full, your next win <b class="gold">polymorphs</b> you into a random other class and plays out through THEIR mechanic: the <b class="gold">Tank's blind chug</b>, the <b class="gold">Gambler's wheel</b>, a <b class="gold">Jester tarot draw</b> or the <b class="gold">Knight's pour</b>. There's no safe option — but <b class="gold">Arcane Echo</b> adds +0.5 to any win.</p>
      <p class="small">The Apothecary sells your tools: the <b class="gold">Crystal Ball</b> (scry the next ingredient), the <b class="gold">Philosopher's Stone</b> (curdles salvage half), the <b class="gold">Tome of Wild Magic</b> (faster surge, bigger echo), the <b class="gold">Moonlit Cauldron</b> (every stage −5% risk), plus <b class="gold">Stardust</b> and the <b class="gold">Scroll of Polymorph</b>.</p>
    </div>`
  };
  
  const glance = {
    tank:    ['🛡 THE TANK', '+40% XP on beer tiles (+5% per Trophy, up to 3) · −25% on party games · beer tiles come up more'],
    gambler: ['♠ THE GAMBLER', '×2 XP on gambling tiles · −25% on physical duels · double forfeits · gambling tiles come up more'],
    jester:  ['🃏 THE JESTER', '+30% XP on party games · +50% on the Wheel · −25% on beer · 1 Wheel re-spin per lap'],
    machine: ['⚔ SIR DRINKS-A-LOT', '+50% XP on physical challenges · −25% at the casino · physical tiles come up more'],
    wizard:  ['🧪 THE BREW-ZARD', '+40% XP on shots · −25% on party games · shot tiles come up more']
  };
  const g = glance[charId];
  const head = g ? `<div class="panel"><h2>${g[0]} — AT A GLANCE</h2><p class="small">${g[1]}</p><p class="small dim">Class relics &amp; items live in your shop's exclusive section — nobody else can buy them.</p></div>` : '';
  el.innerHTML = charId && sections[charId] ? head + sections[charId] : '';
}
function renderBag(){
  if(!S) return;
  const coinsEl = document.getElementById('bagCoins');
  if(coinsEl) coinsEl.textContent = S.coins;
  const bagSkipsEl = document.getElementById('bagSkips');
  if(bagSkipsEl) bagSkipsEl.textContent = S.skips;
  const secretLabel = document.getElementById('secretBtnLabel');
  if(secretLabel) secretLabel.textContent = S.secretBlown ? 'MY MISSION — BLOWN ✗' : (S.secretDone ? 'MY MISSION — COMPLETE ✓' : 'VIEW MY MISSION');
  const secret2Btn = document.getElementById('secret2Btn');
  const secret2Label = document.getElementById('secret2BtnLabel');
  if(secret2Btn){
    secret2Btn.classList.toggle('hide', !S.secret2Available);
    if(secret2Label) secret2Label.textContent = S.secret2Blown ? 'HIGH RISK — BLOWN ✗' : (S.secret2Done ? 'HIGH RISK — COMPLETE ✓' : 'HIGH RISK MISSION');
  }
  // Brewery upgrades — show each with rate contribution and description
  const upgEl = document.getElementById('bagUpgradeList');
  if(upgEl){
    const ups = S.breweryUpgrades||[];
    const totalRate = computeBreweryRate();
    const totalBrewed = ((S.beerCoinsTotal||0)+(S.coinAccum||0)).toFixed(1);
    if(ups.length){
      upgEl.innerHTML =
        `<div class="pill" style="margin-bottom:10px;display:block;padding:8px 10px;">` +
        `<span class="gold" style="font-size:13px;">🍺 ${totalRate.toFixed(1)} beer/min</span>` +
        `<span class="dim" style="font-size:10px;margin-left:8px;">${totalBrewed} brewed lifetime</span></div>` +
        ups.map(u=>{
          const baseRate = u.rate ? `+${u.rate.toFixed(2)}/min` : '';
          return `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
            <span style="font-size:20px;flex-shrink:0;">${u.icon}</span>
            <span>
              <span class="gold" style="font-size:13px;font-weight:bold;">${u.n}</span>
              ${baseRate ? `<span class="dim" style="font-size:10px;margin-left:6px;">${baseRate}</span>` : ''}
              <br><span class="dim" style="font-size:11px;line-height:1.5;">${u.d}</span>
            </span>
          </div>`;
        }).join('');
    } else {
      upgEl.innerHTML = '<span class="dim">None yet. Level up to pick your first one.</span>';
    }
  }
  // Jester — the fool's kit (mirth, tricks, rank, what's up the sleeve)
  const kitEl = document.getElementById('bagJesterKit');
  if(kitEl){
    kitEl.classList.toggle('hide', S.charId!=='jester');
    if(S.charId==='jester'){
      const r = jkRank(), st = jkStats(), nextR = JK_RANKS[r.lv+1];
      kitEl.innerHTML = `<h2>🃏 THE FOOL'S KIT</h2>
        <div class="statPills" style="margin:0 0 8px">
          <div class="pill" style="font-size:10px">🔔 ${S.jkGrand?'<span class="gold">GRAND JEST</span>':(S.mirth||0)+'%'}<br><span class="dim" style="font-size:8px">MIRTH</span></div>
          <div class="pill" style="font-size:10px">🎭 ${S.tricks||0}/${jkMaxTricks()}<br><span class="dim" style="font-size:8px">TRICKS</span></div>
          <div class="pill" style="font-size:10px">🎡 ${S.respin||0}<br><span class="dim" style="font-size:8px">RE-SPINS</span></div>
        </div>
        <p class="small" style="margin:0 0 4px"><b class="gold">${r.n}</b> — ${r.perk}</p>
        <p class="small dim" style="margin:0 0 4px">${nextR ? 'Next: <b>'+nextR.n+'</b> at '+nextR.req+' — '+nextR.perk : 'You rule the court. There is no one left to fool.'}</p>
        <p class="small dim" style="margin:0">${jkPl(st.draws,'draw')} · ${jkPl(st.kings,'sun')} · ${jkPl(st.grand,'grand jest')} · ${jkPl(st.peeks,'peek')} · ${jkPl(st.shuffles,'shuffle')}${S.jkWildNext?' · <span class="gold">🃏 wild card up your sleeve</span>':''}</p>
        ${jkBagDeckHTML()}
        <div class="row" style="margin-top:6px"><button class="btn purple sm" onclick="jkOpenCodex()">📜 DECK ODDS</button><button class="btn gold sm" onclick="go('shop')">🛒 BUY CARDS</button></div>`;
    }
  }
  // Relics — icon + name + full description
  const relicEl = document.getElementById('relicList');
  if(relicEl){
    relicEl.innerHTML = S.relics.length
      ? S.relics.map(id=>{
          const r=RELICS.find(x=>x.id===id);
          if(!r) return '';
          const bonus = r.brewBonus ? `+${r.brewBonus.toFixed(1)}/min` : '';
          const art = r.artifact ? GB_TIERS[r.artifact-1] : null;
          return `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
            <span class="bag-art">${itemArt(r, 30)}</span>
            <span>
              <span class="gold" style="font-size:13px;font-weight:bold;${art?'color:'+art.col:''}">${r.n}</span>
              ${art ? `<span style="font-size:8px;letter-spacing:1px;margin-left:6px;color:${art.col}">${art.label} ARTIFACT</span>` : ''}
              ${bonus ? `<span class="dim" style="font-size:10px;margin-left:6px;">${bonus}</span>` : ''}
              <br><span class="dim" style="font-size:11px;line-height:1.5;">${r.d}</span>
            </span>
          </div>`;
        }).join('')
      : '<span class="dim">None yet. Visit the shop.</span>';
  }
  // Items — icon + name + description + use button
  const itemEl = document.getElementById('itemList');
  if(itemEl){
    const owned = CONSUMABLES.filter(c=>(S.items[c.id]||0)>0);
    itemEl.innerHTML = owned.length
      ? owned.map(c=>`<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
          <span class="bag-art">${itemArt(c, 30)}</span>
          <span>
            <span class="cyan" style="font-size:13px;font-weight:bold;">${c.n}</span>
            <span class="dim" style="font-size:10px;margin-left:6px;">x${S.items[c.id]}</span>
            <br><span class="dim" style="font-size:11px;line-height:1.5;">${c.d}</span>
            <br><button class="btn cyan sm" style="width:auto;margin:6px 0 0;padding:6px 10px" onclick="useItem('${c.id}')">USE</button>
          </span>
        </div>`).join('')
      : '<span class="dim">Empty. Buy something from the shop.</span>';
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
