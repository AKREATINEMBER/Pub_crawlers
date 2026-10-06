# Pub Crawlers

A roguelike pub-crawl party game for a squad of friends on their phones. Medieval pixel tavern theme, five classes (Tank, Gambler, Jester, Brew-zard, Sir Drinks-A-Lot). One file, no internet needed.

## What's what

- **`pubcrawlers.html`** is the game: the one and only, always the latest. Open it in a phone browser (Android: Chrome from Files) or host it.
- **`docs/`** is the same game packaged for hosting: `index.html` is an exact copy of `pubcrawlers.html`, plus the offline helper (`sw.js`), the home-screen icons and `manifest.webmanifest`. Drag this folder onto Netlify Drop, or turn on GitHub Pages for `/docs`. `docs/DRY_RUN.md` is the real-phone checklist.
- **`_archive/`** holds old versions, kept just in case: the pre-overhaul build, the old Aarhus Survivors twin and its build sources, and early prototypes. Nothing in there is used.

When the game changes, `pubcrawlers.html` and `docs/index.html` are updated together.
