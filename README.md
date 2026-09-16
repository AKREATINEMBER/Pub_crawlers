# Aarhus Survivors — dev notes

Birthday pub-crawl party game. Single-page, no backend, meant to run on a
phone with no wifi. Full design/architecture write-up: ask for the project
summary, or see the comment banners inside `src/aarhus-survivors.js`.

## Layout

```
src/
  index.html               # page shell + all screens (HTML only)
  aarhus-survivors.css      # all styles
  aarhus-survivors.js       # all game logic
build.js                    # inlines the three src/ files into one file
aarhus-survivors.html       # BUILT FILE — this is what you host/share
```

`aarhus-survivors.html` at the repo root is generated — don't hand-edit it.
Edit the files under `src/` and rebuild.

## Why split, if it has to ship as one file?

The game's hard constraint (no wifi at the event, opened straight in a
phone browser, zero install) means the **deployed** artifact still has to
be a single dependency-free `.html` file. Splitting `src/` into
html/css/js just makes editing bearable — real syntax highlighting per
language, smaller diffs, VS Code's HTML validator stops choking on inline
`<script>`/`<style>` blocks. `build.js` re-merges them for deployment, so
nothing about the "just open the file" story changes.

## Workflow

1. Edit `src/index.html`, `src/aarhus-survivors.css`, or
   `src/aarhus-survivors.js`.
2. For live preview while editing: serve `src/` with any static server
   (e.g. `npx serve src`, or VS Code Live Server on `src/index.html`) —
   it links to the css/js files directly, no build needed for local dev.
3. When you're ready to test the real deploy path or hand out a link, run:
   ```
   node build.js
   ```
   This regenerates `aarhus-survivors.html` at the repo root from `src/`.
4. Sanity-check JS syntax fast: `node --check src/aarhus-survivors.js`.
5. Host/share `aarhus-survivors.html` (e.g. drag it into Netlify Drop) —
   this is the single file that goes out to phones.

## Notes

- `build.js` has zero dependencies (plain Node `fs`), matching the
  project's own "no build tooling for the deployed game" rule — this
  script only runs on your machine before sharing a link, never on a
  player's phone.
- After any gameplay-balance change (XP curve, slot weights, pricing),
  re-run a probability/playthrough simulation rather than trusting the
  numbers alone — this file has a history of "looks right in the numbers,
  plays wrong in practice."
