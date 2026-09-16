#!/usr/bin/env node
/*
 * AARHUS SURVIVORS — build script
 * ---------------------------------------------------------------
 * Dev sources live in src/ as three separate files (index.html,
 * aarhus-survivors.css, aarhus-survivors.js) so they're easier to
 * edit and diff in VS Code.
 *
 * The GAME MUST SHIP as a single dependency-free .html file (no
 * wifi at the event, opened directly in a phone browser or hosted
 * as one static file via something like Netlify Drop). This script
 * inlines the CSS and JS from src/ back into one file so nothing
 * about the deploy story changes.
 *
 * Usage:
 *   node build.js
 *
 * Reads:  src/index.html, src/aarhus-survivors.css, src/aarhus-survivors.js
 * Writes: aarhus-survivors.html   (the file you actually host/share)
 *
 * No dependencies — plain Node fs/path only.
 */
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const OUT_FILE = path.join(__dirname, 'aarhus-survivors.html');

const htmlPath = path.join(SRC_DIR, 'index.html');
const cssPath = path.join(SRC_DIR, 'aarhus-survivors.css');
const jsPath = path.join(SRC_DIR, 'aarhus-survivors.js');

for (const p of [htmlPath, cssPath, jsPath]) {
  if (!fs.existsSync(p)) {
    console.error(`build.js: missing source file ${path.relative(__dirname, p)}`);
    process.exit(1);
  }
}

let html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

const linkTag = '<link rel="stylesheet" href="aarhus-survivors.css">';
const scriptTag = '<script src="aarhus-survivors.js"></script>';

if (!html.includes(linkTag)) {
  console.error(`build.js: could not find ${JSON.stringify(linkTag)} in src/index.html`);
  process.exit(1);
}
if (!html.includes(scriptTag)) {
  console.error(`build.js: could not find ${JSON.stringify(scriptTag)} in src/index.html`);
  process.exit(1);
}

html = html.replace(linkTag, `<style>\n${css}</style>`);
html = html.replace(scriptTag, `<script>\n${js}</script>`);

fs.writeFileSync(OUT_FILE, html);
console.log(`build.js: wrote ${path.relative(__dirname, OUT_FILE)} (${(html.length / 1024).toFixed(1)} KB)`);
