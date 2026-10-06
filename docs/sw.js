/* Pub Crawlers offline helper.
   The game itself saves to the phone; this just keeps a copy of the page so a
   reload in a basement bar with no signal still opens the game.
   Strategy: try the network (so updates arrive), give up after 2.5s and use the copy. */
const CACHE = 'pubcrawlers-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function timeout(ms){ return new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), ms)); }

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if(req.mode === 'navigate'){
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try{
        const fresh = await Promise.race([fetch(req), timeout(2500)]);
        if(fresh && fresh.ok){ cache.put('./index.html', fresh.clone()); return fresh; }
        throw new Error('bad');
      }catch(_){
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch:true }).then(hit => hit || fetch(req)));
});
