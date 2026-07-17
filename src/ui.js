// Single-page guided outfit builder, served per store. Design system: tailor's
// atelier — hang-tag product cards, fabric-swatch strips, stitch rules.
// Flow: item -> colour family -> shade -> occasion -> pickable palette (choose
// up to two) -> carousel results -> fitting list. No free text, no model.

import { ANCHOR_ITEMS, FAMILIES, OCCASIONS, COLOUR_HEX } from './palette.js';

export function renderPage(store) {
  const branding = JSON.parse(store.branding || '{}');
  const accent = branding.accent || '#1F3A5F';
  const storeName = store.name;
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(storeName)} — Outfit Stylist</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500&family=Public+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --paper: #FBFAF7;
    --ink: #20242C;
    --ink-soft: #5B5F68;
    --stitch: #E5E1D8;
    --accent: ${accent};
    --sale: #9A3B2E;
    --tag: #FFFFFF;
  }
  * { box-sizing: border-box; margin: 0; }
  html, body { height: 100%; }
  body {
    background: var(--paper);
    color: var(--ink);
    font: 400 16px/1.55 "Public Sans", system-ui, sans-serif;
    display: flex; flex-direction: column;
    -webkit-font-smoothing: antialiased;
  }
  header {
    padding: 14px 20px 12px;
    border-bottom: 1px solid var(--stitch);
    background: var(--paper);
    position: sticky; top: 0; z-index: 5;
  }
  .eyebrow {
    font: 500 10px/1 "IBM Plex Mono", monospace;
    letter-spacing: .22em; text-transform: uppercase;
    color: var(--ink-soft);
  }
  header h1 {
    font: 600 24px/1.15 Fraunces, serif;
    letter-spacing: .01em; margin-top: 3px;
  }
  header h1 em { font-style: normal; color: var(--accent); }
  main {
    flex: 1; overflow-y: auto; scroll-behavior: smooth;
    padding: 20px 16px calc(76px + env(safe-area-inset-bottom));
    max-width: 720px; width: 100%; margin: 0 auto;
  }
  .msg { margin: 0 0 18px; animation: rise .35s ease both; }
  @keyframes rise { from { opacity: 0; transform: translateY(6px); } }
  @media (prefers-reduced-motion: reduce) { .msg { animation: none; } }
  .msg.stylist {
    padding-left: 14px;
    border-left: 2px dashed var(--stitch);
    max-width: 96%;
    white-space: pre-wrap;
  }
  .msg.you {
    margin-left: auto; max-width: 82%;
    background: var(--ink); color: var(--paper);
    padding: 10px 14px; border-radius: 14px 14px 3px 14px;
    white-space: pre-wrap; width: fit-content;
  }
  .msg.you img { display: block; max-width: 180px; border-radius: 10px; margin-top: 8px; }
  .who {
    font: 500 10px/1 "IBM Plex Mono", monospace;
    letter-spacing: .18em; text-transform: uppercase;
    color: var(--ink-soft); margin-bottom: 6px;
  }
  /* Fabric swatch strip (display) */
  .swatches {
    display: flex; gap: 10px; overflow-x: auto; padding: 6px 2px 12px;
    scrollbar-width: none;
  }
  .swatches::-webkit-scrollbar { display: none; }
  .swatch {
    flex: 0 0 auto; width: 86px;
    background: var(--tag); border: 1px solid var(--stitch);
    border-radius: 4px; padding: 5px;
    box-shadow: 0 1px 2px rgba(32,36,44,.06);
  }
  .swatch .chip { height: 58px; border-radius: 2px; }
  .swatch .sname {
    font: 500 10px/1.3 "IBM Plex Mono", monospace;
    margin-top: 6px; letter-spacing: .02em;
  }
  .swatch .suse { font: 400 9px/1.3 "IBM Plex Mono", monospace; color: var(--ink-soft); }
  /* Pickable swatch grid (shade + palette steps) */
  .pickgrid { display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0 4px; }
  .pick {
    width: 96px; background: var(--tag); border: 1px solid var(--stitch);
    border-radius: 4px; padding: 5px; cursor: pointer; text-align: left;
    box-shadow: 0 1px 2px rgba(32,36,44,.06); position: relative;
    font: inherit; color: inherit;
  }
  .pick .chip { height: 52px; border-radius: 2px; }
  .pick .sname { font: 500 10px/1.3 "IBM Plex Mono", monospace; margin-top: 6px; }
  .pick .suse { font: 400 9px/1.3 "IBM Plex Mono", monospace; color: var(--ink-soft); min-height: 12px; }
  .pick:hover { border-color: var(--accent); }
  .pick[aria-pressed="true"] { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent); }
  .pick[aria-pressed="true"]::after {
    content: "✓"; position: absolute; top: 9px; right: 9px;
    width: 20px; height: 20px; border-radius: 50%;
    background: var(--accent); color: #fff;
    font: 600 12px/20px "Public Sans", sans-serif; text-align: center;
  }
  /* Carousel rows of hang-tag product cards */
  .rolehead {
    font: 600 15px/1.2 Fraunces, serif; letter-spacing: .01em;
    margin: 16px 0 8px; color: var(--ink);
    display: flex; align-items: baseline; gap: 8px;
  }
  .rolehead small { font: 400 11px/1 "IBM Plex Mono", monospace; color: var(--ink-soft); }
  .row {
    display: flex; gap: 12px; overflow-x: auto; padding: 2px 2px 10px;
    scroll-snap-type: x proximity; scrollbar-width: none;
  }
  .row::-webkit-scrollbar { display: none; }
  .tagcard {
    flex: 0 0 152px; scroll-snap-align: start;
    text-decoration: none; color: var(--ink);
    background: var(--tag); border: 1px solid var(--stitch); border-radius: 6px;
    overflow: hidden; position: relative; cursor: pointer;
    font: inherit; text-align: left; padding: 0;
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .tagcard:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(32,36,44,.10); }
  .tagcard.selected { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent); }
  .tagcard.selected::after {
    content: "✓"; position: absolute; top: 8px; right: 8px; z-index: 2;
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--accent); color: #fff;
    font: 600 13px/22px "Public Sans", sans-serif; text-align: center;
  }
  .tagcard img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; background: #EFEDE7; }
  .tagcard .ticket {
    padding: 9px 10px 10px; border-top: 1px dashed var(--stitch); position: relative; display: block;
  }
  .tagcard .ticket::before {
    content: ""; position: absolute; top: -5px; left: 12px;
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--paper); border: 1px solid var(--stitch);
  }
  .tagcard .t-title { font: 500 12.5px/1.35 "Public Sans", sans-serif; display: block; }
  .tagcard .t-note { font: 400 11px/1.4 "Public Sans", sans-serif; color: var(--ink-soft); margin-top: 3px; display: block; }
  .tagcard .t-price {
    font: 500 12px/1 "IBM Plex Mono", monospace; margin-top: 7px; display: flex; gap: 7px; align-items: baseline;
  }
  .tagcard .was { color: var(--ink-soft); text-decoration: line-through; font-size: 10.5px; }
  .tagcard .salebadge {
    position: absolute; top: 8px; left: 8px;
    background: var(--sale); color: #fff;
    font: 500 9.5px/1 "IBM Plex Mono", monospace; letter-spacing: .12em;
    padding: 4px 7px; border-radius: 2px; text-transform: uppercase;
  }
  /* Typing: three stitches */
  .stitches { display: inline-flex; gap: 5px; padding: 4px 0; }
  .stitches i {
    width: 10px; height: 2px; background: var(--ink-soft); border-radius: 1px;
    animation: stitch 1s infinite;
  }
  .stitches i:nth-child(2) { animation-delay: .15s; }
  .stitches i:nth-child(3) { animation-delay: .3s; }
  @keyframes stitch { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
  /* Choice chips */
  .chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 4px; }
  .chips button {
    font: 500 13px/1 "Public Sans", sans-serif;
    background: var(--tag); color: var(--ink);
    border: 1px solid var(--stitch); border-radius: 999px;
    padding: 10px 15px; cursor: pointer;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .chips button:hover { border-color: var(--accent); color: var(--accent); }
  .chips button .dot {
    width: 14px; height: 14px; border-radius: 50%;
    border: 1px solid rgba(32,36,44,.18); display: inline-block;
  }
  .chips button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  .chips button.toggle[aria-pressed="true"] { background: var(--sale); border-color: var(--sale); color: #fff; }
  .chips button.ghost { background: transparent; border-style: dashed; color: var(--ink-soft); }
  .whyline {
    font: 400 13.5px/1.5 "Public Sans", sans-serif; color: var(--ink-soft);
    border-top: 1px dashed var(--stitch); margin-top: 4px; padding-top: 10px;
  }
  /* Fitting bar + overlay */
  .fitbar {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 8;
    background: var(--ink); color: var(--paper);
    padding: 13px 18px calc(13px + env(safe-area-inset-bottom));
    font: 600 14px/1 "Public Sans", sans-serif; cursor: pointer;
    display: none; align-items: center; justify-content: space-between;
    border: 0; width: 100%; text-align: left;
  }
  .fitbar span.count { font: 500 12px/1 "IBM Plex Mono", monospace; letter-spacing: .08em; }
  .fitbar.show { display: flex; }
  .overlay {
    position: fixed; inset: 0; z-index: 9; background: var(--paper);
    display: none; flex-direction: column;
  }
  .overlay.show { display: flex; }
  .overlay header { display: flex; align-items: center; justify-content: space-between; }
  .overlay .list { flex: 1; overflow-y: auto; padding: 16px; max-width: 720px; width: 100%; margin: 0 auto; }
  .fitline {
    display: grid; grid-template-columns: 72px 1fr; gap: 12px;
    border: 1px solid var(--stitch); border-radius: 6px; background: var(--tag);
    padding: 10px; margin-bottom: 12px;
  }
  .fitline img { width: 72px; aspect-ratio: 3/4; object-fit: cover; border-radius: 4px; background: #EFEDE7; }
  .fitline .f-title { font: 500 13.5px/1.35 "Public Sans", sans-serif; }
  .fitline .f-style {
    font: 500 11px/1.4 "IBM Plex Mono", monospace; color: var(--ink-soft);
    letter-spacing: .04em; margin-top: 2px;
  }
  .fitline .f-price { font: 500 12.5px/1 "IBM Plex Mono", monospace; margin-top: 4px; }
  .sizes { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }
  .sizes b {
    font: 500 10px/1 "IBM Plex Mono", monospace; font-weight: 500;
    border: 1px solid var(--stitch); border-radius: 3px; padding: 4px 6px;
  }
  .sizes b.out { color: var(--ink-soft); text-decoration: line-through; background: #F1EFEA; }
  .fitline .f-links { margin-top: 8px; display: flex; gap: 12px; align-items: center; }
  .fitline .f-links a { color: var(--accent); font: 500 12.5px/1 "Public Sans", sans-serif; }
  .fitline .f-links button {
    background: none; border: none; color: var(--sale); cursor: pointer;
    font: 500 12px/1 "Public Sans", sans-serif; padding: 0;
  }
  .overlay .actions {
    border-top: 1px solid var(--stitch); padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    display: flex; gap: 10px; max-width: 720px; width: 100%; margin: 0 auto;
  }
  .overlay .actions button {
    flex: 1; font: 600 14px/1 "Public Sans", sans-serif;
    border-radius: 12px; padding: 13px; cursor: pointer;
    border: 1px solid var(--stitch); background: var(--tag); color: var(--ink);
  }
  .overlay .actions button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  .repnote { font: 400 11.5px/1.5 "Public Sans", sans-serif; color: var(--ink-soft); margin: 0 0 12px; }
  .camrow { margin-top: 10px; }
  .camrow button {
    font: 500 12px/1 "IBM Plex Mono", monospace; letter-spacing: .06em;
    background: #EBEAE6; border: 1px solid var(--stitch); border-radius: 10px;
    padding: 9px 13px; cursor: pointer; color: var(--ink-soft);
    display: inline-flex; align-items: center; gap: 8px;
  }
  button:focus-visible, a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
</style>
</head>
<body>
<header>
  <div class="eyebrow">Outfit stylist</div>
  <h1><em>${esc(storeName)}</em></h1>
</header>
<main id="thread"></main>
<button class="fitbar" id="fitbar"><span>Fitting list</span><span class="count" id="fitcount">0 items</span></button>
<div class="overlay" id="overlay" role="dialog" aria-label="Fitting list">
  <header>
    <div>
      <div class="eyebrow">Fitting list</div>
      <h1><em>${esc(storeName)}</em></h1>
    </div>
    <button class="chips" id="closeOverlay" style="border:1px solid var(--stitch);border-radius:999px;background:var(--tag);padding:9px 15px;cursor:pointer;font:500 13px/1 'Public Sans',sans-serif">Close</button>
  </header>
  <div class="list" id="fitlist"></div>
  <div class="actions">
    <button id="copyList">Copy list</button>
    <button id="shareList" class="primary">Share</button>
  </div>
</div>
<input type="file" id="photoInput" accept="image/jpeg,image/png,image/webp" hidden>
<script>
const STORE = ${JSON.stringify(store.slug)};
const ITEMS = ${JSON.stringify(ANCHOR_ITEMS)};
const FAMILIES = ${JSON.stringify(FAMILIES)};
const OCCASIONS = ${JSON.stringify(OCCASIONS)};
const HEX = ${JSON.stringify(COLOUR_HEX)};
const REP = new URLSearchParams(location.search).get('mode') === 'rep';

const thread = document.getElementById('thread');
const photoInput = document.getElementById('photoInput');
const fitbar = document.getElementById('fitbar');
const overlay = document.getElementById('overlay');
const state = { item: null, itemLabel: '', family: null, shade: null, occasion: null, picks: [], photo: null };
const fitting = new Map(); // product id -> card
let busy = false, saleOnly = false, lastResult = null;

function el(html) { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
function escT(s) { const d = document.createElement('span'); d.textContent = s == null ? '' : s; return d.innerHTML; }
function scrollEnd() { thread.scrollTop = thread.scrollHeight; }
function cap(s) { return s.replace(/\\b\\w/g, (ch) => ch.toUpperCase()); }

function addUser(text, imgUrl) {
  const m = el('<div class="msg you"></div>');
  if (text) m.appendChild(el('<div>' + escT(text) + '</div>'));
  if (imgUrl) m.appendChild(el('<img src="' + imgUrl + '" alt="Your photo">'));
  thread.appendChild(m); scrollEnd();
}
function stylistMsg(text) {
  const wrap = el('<div class="msg stylist"><div class="who">Stylist</div></div>');
  if (text) wrap.appendChild(el('<div>' + escT(text) + '</div>'));
  thread.appendChild(wrap); scrollEnd();
  return wrap;
}
function chipRow(wrap) {
  const chips = el('<div class="chips"></div>');
  wrap.appendChild(chips); scrollEnd();
  return chips;
}
function disableAll(container) {
  container.querySelectorAll('button').forEach((b) => { b.disabled = true; b.style.opacity = .45; b.style.cursor = 'default'; });
}
function addTyping() {
  const t = el('<div class="msg stylist"><div class="who">Stylist</div><span class="stitches"><i></i><i></i><i></i></span></div>');
  thread.appendChild(t); scrollEnd(); return t;
}
function pickCard(name, hex, use) {
  return el('<button class="pick" type="button" aria-pressed="false"><span class="chip" style="display:block;background:' +
    escT(hex) + '"></span><span class="sname" style="display:block">' + escT(name) +
    '</span><span class="suse" style="display:block">' + escT(use || '') + '</span></button>');
}

// Step 1: what are we building around?
function stepItem() {
  const wrap = stylistMsg("Let's build a full look around one piece. What are you starting with?");
  const chips = chipRow(wrap);
  for (const it of ITEMS) {
    const b = el('<button>' + escT(it.label) + '</button>');
    b.onclick = () => {
      disableAll(chips);
      state.item = it.key; state.itemLabel = it.label;
      addUser(it.label, state.photo);
      stepFamily();
    };
    chips.appendChild(b);
  }
  const cam = el('<div class="camrow"><button type="button">' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M9 4.5h6l1.2 2H20a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V8A1.5 1.5 0 0 1 4 6.5h3.8L9 4.5z" fill="currentColor"/>' +
    '<circle cx="12" cy="13" r="4.2" fill="#EBEAE6"/><circle cx="12" cy="13" r="2.6" fill="currentColor"/></svg>' +
    'Snap it (optional)</button></div>');
  cam.querySelector('button').onclick = () => photoInput.click();
  wrap.appendChild(cam); scrollEnd();
}

// Grammar-aware possessive question for the anchor item.
function colourQuestion() {
  const it = ITEMS.find((i) => i.key === state.item) || {};
  const noun = state.itemLabel.toLowerCase();
  return it.plural ? 'What colour are your ' + noun + '?' : 'What colour is your ' + noun + '?';
}

// Step 2: broad colour family.
function stepFamily() {
  const wrap = stylistMsg(colourQuestion());
  const chips = chipRow(wrap);
  for (const f of FAMILIES) {
    const b = el('<button><span class="dot" style="background:' + (HEX[f.shades[Math.floor(f.shades.length / 2)] ] || '#999') + '"></span>' + escT(f.label) + '</button>');
    b.onclick = () => {
      disableAll(chips);
      state.family = f;
      addUser(f.label);
      if (f.shades.length === 1) {
        state.shade = f.shades[0];
        stepOccasion();
      } else {
        stepShade(f);
      }
    };
    chips.appendChild(b);
  }
}

// Step 3: the actual shade — light, mid, dark matters.
function stepShade(family) {
  const noun = state.itemLabel.toLowerCase();
  const wrap = stylistMsg('Which ' + family.label.toLowerCase() + '? Match the swatch to the actual shade.');
  const grid = el('<div class="pickgrid"></div>');
  for (const s of family.shades) {
    const card = pickCard(cap(s), HEX[s] || '#999', '');
    card.onclick = () => {
      disableAll(grid);
      state.shade = s;
      addUser(cap(s) + ' ' + noun);
      stepOccasion();
    };
    grid.appendChild(card);
  }
  wrap.appendChild(grid); scrollEnd();
}

// Step 4: occasion.
function stepOccasion() {
  const wrap = stylistMsg('And where is this look headed?');
  const chips = chipRow(wrap);
  for (const o of OCCASIONS) {
    const b = el('<button>' + escT(o.label) + '</button>');
    b.onclick = () => {
      disableAll(chips);
      state.occasion = o.key;
      addUser(o.label);
      stepPalette();
    };
    chips.appendChild(b);
  }
}

// Step 5: the pickable palette — choose up to two colours to build around.
async function stepPalette() {
  const typing = addTyping();
  let data;
  try {
    const r = await fetch('/api/palette', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ item: state.item, shade: state.shade, occasion: state.occasion }),
    });
    data = await r.json();
  } catch {
    typing.remove();
    stylistMsg('I lost the connection for a moment — refresh to try again.');
    return;
  }
  typing.remove();
  if (data.error) { stylistMsg(data.error); return; }

  state.picks = [];
  const wrap = stylistMsg('These all work with your ' + cap(state.shade) + ' ' + state.itemLabel.toLowerCase() +
    '. Pick one or two to build the look around — or just build it and I\\'ll choose.');
  const grid = el('<div class="pickgrid"></div>');
  const roleWord = { shirt: 'shirt', jacket: 'jacket', accent: 'accent' };
  for (const o of data.options) {
    const card = pickCard(o.name, o.hex, o.roles.map((r) => roleWord[r] || r).join(' · '));
    card.onclick = () => {
      const on = card.getAttribute('aria-pressed') === 'true';
      if (on) {
        card.setAttribute('aria-pressed', 'false');
        state.picks = state.picks.filter((p) => p !== o.key);
      } else {
        if (state.picks.length >= 2) return; // two max
        card.setAttribute('aria-pressed', 'true');
        state.picks.push(o.key);
      }
    };
    grid.appendChild(card);
  }
  wrap.appendChild(grid);
  const chips = chipRow(wrap);
  const go = el('<button class="primary">Build the outfit</button>');
  go.onclick = () => {
    disableAll(wrap);
    addUser(state.picks.length ? 'Build around ' + state.picks.map(cap).join(' + ') : 'Build it — your choice');
    buildOutfit();
  };
  chips.appendChild(go);
  scrollEnd();
}

// Step 6: fetch and render the outfit as carousel rows.
async function buildOutfit() {
  if (busy) return;
  busy = true;
  const typing = addTyping();
  let data;
  try {
    const r = await fetch('/api/outfit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ store: STORE, item: state.item, shade: state.shade, occasion: state.occasion, picks: state.picks }),
    });
    data = await r.json();
  } catch {
    typing.remove(); busy = false;
    stylistMsg('I lost the connection for a moment — refresh to try again.');
    return;
  }
  typing.remove(); busy = false;
  if (data.error) { stylistMsg(data.error); return; }
  lastResult = data;
  renderResult(data);
}

function cardEl(c) {
  const price = c.price != null ? '$' + Number(c.price).toFixed(2) : '';
  const was = c.compare_at_price ? '<span class="was">$' + Number(c.compare_at_price).toFixed(2) + '</span>' : '';
  const b = el('<button class="tagcard" type="button">' +
    (c.compare_at_price ? '<span class="salebadge">Sale</span>' : '') +
    '<img loading="lazy" src="' + escT(c.image || '') + '" alt="' + escT(c.title) + '">' +
    '<span class="ticket"><span class="t-title">' + escT(c.title) + '</span>' +
    (c.note ? '<span class="t-note">' + escT(c.note) + '</span>' : '') +
    '<span class="t-price">' + price + ' ' + was + '</span></span></button>');
  if (fitting.has(c.id)) b.classList.add('selected');
  b.onclick = () => {
    if (fitting.has(c.id)) { fitting.delete(c.id); b.classList.remove('selected'); }
    else { fitting.set(c.id, c); b.classList.add('selected'); }
    updateFitbar();
  };
  return b;
}

function renderResult(data) {
  const wrap = el('<div class="msg stylist"><div class="who">Stylist</div></div>');
  if (data.palette && data.palette.length) {
    const sw = el('<div class="swatches" role="list" aria-label="Colour palette"></div>');
    for (const s of data.palette) {
      sw.appendChild(el('<div class="swatch" role="listitem"><div class="chip" style="background:' + escT(s.hex || '#ccc') +
        '"></div><div class="sname">' + escT(s.name || '') + '</div>' +
        (s.use ? '<div class="suse">' + escT(s.use) + '</div>' : '') + '</div>'));
    }
    wrap.appendChild(sw);
  }
  // Sale refinement lives on the results, not before them.
  const saleChips = chipRow(wrap);
  const saleBtn = el('<button class="toggle" aria-pressed="' + saleOnly + '">On sale — cheapest first</button>');
  saleBtn.onclick = () => {
    saleOnly = !saleOnly;
    saleBtn.setAttribute('aria-pressed', String(saleOnly));
    renderRows(wrap, data);
  };
  saleChips.appendChild(saleBtn);
  wrap.appendChild(el('<div class="rows"></div>'));
  renderRows(wrap, data);
  if (data.why) wrap.appendChild(el('<div class="whyline">' + escT(data.why) + '</div>'));
  thread.appendChild(wrap);
  pivotRow(wrap);
  scrollEnd();
  wrap.scrollIntoView({ block: 'start' });
}

function renderRows(wrap, data) {
  const rows = wrap.querySelector('.rows');
  rows.innerHTML = '';
  let shown = 0;
  for (const g of data.groups || []) {
    let cards = g.cards;
    if (saleOnly) {
      cards = cards.filter((c) => c.compare_at_price).sort((a, b) => a.price - b.price);
    }
    if (!cards.length) {
      if (saleOnly) rows.appendChild(el('<div class="rolehead">' + escT(g.role) + ' <small>nothing on sale here</small></div>'));
      continue;
    }
    shown += cards.length;
    rows.appendChild(el('<div class="rolehead">' + escT(g.role) + ' <small>' + cards.length + ' · tap to add</small></div>'));
    const row = el('<div class="row"></div>');
    for (const c of cards) row.appendChild(cardEl(c));
    rows.appendChild(row);
  }
  if (!shown && !saleOnly) {
    rows.appendChild(el('<div>The catalogue is thin around that combination — try different colours.</div>'));
  }
}

// After a result: rework the colours or start over.
function pivotRow(wrap) {
  const chips = chipRow(wrap);
  const rework = el('<button>Change the colours</button>');
  rework.onclick = () => { addUser('Show me the palette again'); stepPalette(); };
  chips.appendChild(rework);
  const again = el('<button class="ghost">Start over</button>');
  again.onclick = () => {
    Object.assign(state, { item: null, itemLabel: '', family: null, shade: null, occasion: null, picks: [], photo: null });
    stepItem();
  };
  chips.appendChild(again);
}

// ---- Fitting list ----
function updateFitbar() {
  const n = fitting.size;
  document.getElementById('fitcount').textContent = n + (n === 1 ? ' item' : ' items');
  fitbar.classList.toggle('show', n > 0);
}

async function openOverlay() {
  const list = document.getElementById('fitlist');
  list.innerHTML = '';
  if (REP) list.appendChild(el('<p class="repnote">Style numbers for POS lookup. Size availability is online stock — confirm on the floor.</p>'));
  const items = [...fitting.values()];
  let variants = {};
  try {
    const r = await fetch('/api/variants?store=' + STORE + '&ids=' + items.map((c) => c.id).join(','));
    variants = (await r.json()).products || {};
  } catch { /* sizes just won't show */ }
  for (const c of items) {
    const vs = variants[c.id] || [];
    const style = (vs.find((v) => v.style) || {}).style;
    const sizes = vs.map((v) => {
      const size = (v.title || '').includes('/') && (v.title || '').match(/^[^/]+\\/(.+)$/)
        ? v.title.replace(/^[^/]*\\/\\s*/, '') : (v.title || '');
      return '<b class="' + (v.available ? '' : 'out') + '">' + escT(size) + '</b>';
    }).join('');
    const line = el('<div class="fitline">' +
      '<img loading="lazy" src="' + escT(c.image || '') + '" alt="">' +
      '<div><div class="f-title">' + escT(c.title) + '</div>' +
      (style ? '<div class="f-style">Style ' + escT(style) + '</div>' : '') +
      '<div class="f-price">$' + Number(c.price).toFixed(2) + '</div>' +
      (sizes ? '<div class="sizes">' + sizes + '</div>' : '') +
      '<div class="f-links"><a href="' + escT(c.url) + '" target="_blank" rel="noopener">View at store ↗</a>' +
      '<button type="button" data-id="' + c.id + '">Remove</button></div></div></div>');
    line.querySelector('.f-links button').onclick = () => {
      fitting.delete(c.id);
      line.remove();
      updateFitbar();
      document.querySelectorAll('.tagcard.selected').forEach((t) => {
        // re-render happens next result; cheap approach: leave cards, bar is truth
      });
      if (!fitting.size) overlay.classList.remove('show');
    };
    list.appendChild(line);
  }
  overlay.classList.add('show');
}

function listAsText() {
  const lines = ['${esc(storeName)} — fitting list'];
  for (const c of fitting.values()) {
    lines.push('• ' + c.title + ' — $' + Number(c.price).toFixed(2) + (c.url ? ' — ' + c.url : ''));
  }
  return lines.join('\\n');
}

fitbar.onclick = openOverlay;
document.getElementById('closeOverlay').onclick = () => overlay.classList.remove('show');
document.getElementById('copyList').onclick = async () => {
  try { await navigator.clipboard.writeText(listAsText()); } catch {}
  document.getElementById('copyList').textContent = 'Copied';
  setTimeout(() => { document.getElementById('copyList').textContent = 'Copy list'; }, 1500);
};
document.getElementById('shareList').onclick = async () => {
  const text = listAsText();
  if (navigator.share) { try { await navigator.share({ text }); } catch {} }
  else { try { await navigator.clipboard.writeText(text); } catch {} }
};

photoInput.onchange = () => {
  const f = photoInput.files[0];
  if (!f) return;
  if (f.size > 5 * 1024 * 1024) { stylistMsg('That photo is over 5 MB — try a smaller one.'); return; }
  const reader = new FileReader();
  reader.onload = () => { state.photo = reader.result; stylistMsg('Got it — pick the item and colour that match your photo.'); };
  reader.readAsDataURL(f);
  photoInput.value = '';
};

stepItem();
</script>
</body>
</html>`;
}
