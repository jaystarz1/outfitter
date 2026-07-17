// Single-page guided outfit builder, served per store. Design system: tailor's
// atelier — hang-tag product cards, fabric-swatch palette strip, stitch rules.
// Flow is button-driven (item -> colour -> occasion -> outfit); no free text.

import { ANCHOR_ITEMS, ANCHOR_COLOURS, OCCASIONS, COLOUR_HEX } from './palette.js';

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
    padding: 20px 16px calc(24px + env(safe-area-inset-bottom));
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
  /* Fabric swatch book */
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
  /* Hang-tag product cards */
  .rolehead {
    font: 600 15px/1.2 Fraunces, serif; letter-spacing: .01em;
    margin: 16px 0 8px; color: var(--ink);
  }
  .cards {
    display: grid; gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    margin-bottom: 4px;
  }
  .tagcard {
    display: block; text-decoration: none; color: var(--ink);
    background: var(--tag); border: 1px solid var(--stitch); border-radius: 6px;
    overflow: hidden; position: relative;
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .tagcard:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(32,36,44,.10); }
  .tagcard img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; background: #EFEDE7; }
  .tagcard .ticket {
    padding: 9px 10px 10px; border-top: 1px dashed var(--stitch); position: relative;
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
  .chips button.toggle[aria-pressed="true"] {
    background: var(--sale); border-color: var(--sale); color: #fff;
  }
  .chips button.ghost { background: transparent; border-style: dashed; color: var(--ink-soft); }
  .camrow { margin-top: 10px; }
  .camrow button {
    font: 500 12px/1 "IBM Plex Mono", monospace; letter-spacing: .06em;
    background: #EBEAE6; border: 1px solid var(--stitch); border-radius: 10px;
    padding: 9px 13px; cursor: pointer; color: var(--ink-soft);
    display: inline-flex; align-items: center; gap: 8px;
  }
  .whyline {
    font: 400 13.5px/1.5 "Public Sans", sans-serif; color: var(--ink-soft);
    border-top: 1px dashed var(--stitch); margin-top: 4px; padding-top: 10px;
  }
  button:focus-visible, a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .err { color: var(--sale); font-size: 13px; }
</style>
</head>
<body>
<header>
  <div class="eyebrow">Outfit stylist</div>
  <h1><em>${esc(storeName)}</em></h1>
</header>
<main id="thread"></main>
<input type="file" id="photoInput" accept="image/jpeg,image/png,image/webp" hidden>
<script>
const STORE = ${JSON.stringify(store.slug)};
const ITEMS = ${JSON.stringify(ANCHOR_ITEMS)};
const COLOURS = ${JSON.stringify(ANCHOR_COLOURS)};
const OCCASIONS = ${JSON.stringify(OCCASIONS)};
const HEX = ${JSON.stringify(COLOUR_HEX)};

const thread = document.getElementById('thread');
const photoInput = document.getElementById('photoInput');
const state = { item: null, colour: null, occasion: null, sale: false, photo: null };
let busy = false;

function el(html) { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
function escT(s) { const d = document.createElement('span'); d.textContent = s; return d.innerHTML; }
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
function disableChips(chips) {
  chips.querySelectorAll('button').forEach((b) => { b.disabled = true; b.style.opacity = .45; b.style.cursor = 'default'; });
}
function addTyping() {
  const t = el('<div class="msg stylist"><div class="who">Stylist</div><span class="stitches"><i></i><i></i><i></i></span></div>');
  thread.appendChild(t); scrollEnd(); return t;
}

// Step 1: what are we building around?
function stepItem() {
  const wrap = stylistMsg("Let's build a full look around one piece. What are you starting with?");
  const chips = chipRow(wrap);
  for (const it of ITEMS) {
    const b = el('<button>' + escT(it.label) + '</button>');
    b.onclick = () => {
      disableChips(chips);
      state.item = it.key;
      addUser(it.label, state.photo);
      stepColour(it.label);
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

// Step 2: colour of the anchor piece.
function stepColour(itemLabel) {
  const wrap = stylistMsg('What colour is your ' + itemLabel.toLowerCase() + '?');
  const chips = chipRow(wrap);
  for (const c of COLOURS) {
    const b = el('<button><span class="dot" style="background:' + (HEX[c] || '#999') + '"></span>' + escT(cap(c)) + '</button>');
    b.onclick = () => {
      disableChips(chips);
      state.colour = c;
      addUser(cap(c));
      stepOccasion();
    };
    chips.appendChild(b);
  }
}

// Step 3: occasion + sale toggle, then build.
function stepOccasion() {
  const wrap = stylistMsg('And where is this look headed?');
  const chips = chipRow(wrap);
  const sale = el('<button class="toggle" aria-pressed="false">On sale only</button>');
  sale.onclick = () => {
    state.sale = !state.sale;
    sale.setAttribute('aria-pressed', String(state.sale));
  };
  for (const o of OCCASIONS) {
    const b = el('<button>' + escT(o.label) + '</button>');
    b.onclick = () => {
      disableChips(chips);
      state.occasion = o.key;
      addUser(o.label + (state.sale ? ' — on sale only' : ''));
      buildOutfit();
    };
    chips.appendChild(b);
  }
  chips.appendChild(sale);
}

// Fetch and render the full outfit.
async function buildOutfit() {
  if (busy) return;
  busy = true;
  const typing = addTyping();
  let data;
  try {
    const r = await fetch('/api/outfit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ store: STORE, item: state.item, colour: state.colour, occasion: state.occasion, sale_only: state.sale }),
    });
    data = await r.json();
  } catch {
    typing.remove(); busy = false;
    stylistMsg('I lost the connection for a moment — tap a colour again to retry.');
    return pivotRow(stylistMsg(''));
  }
  typing.remove(); busy = false;
  if (data.error) { stylistMsg(data.error); return; }

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
  let shown = 0;
  for (const g of data.groups || []) {
    if (!g.cards.length) continue;
    shown += g.cards.length;
    wrap.appendChild(el('<div class="rolehead">' + escT(g.role) + '</div>'));
    const grid = el('<div class="cards"></div>');
    for (const c of g.cards) {
      const price = c.price != null ? '$' + Number(c.price).toFixed(2) : '';
      const was = c.compare_at_price ? '<span class="was">$' + Number(c.compare_at_price).toFixed(2) + '</span>' : '';
      grid.appendChild(el('<a class="tagcard" href="' + escT(c.url) + '" target="_blank" rel="noopener">' +
        (c.compare_at_price ? '<span class="salebadge">Sale</span>' : '') +
        '<img loading="lazy" src="' + escT(c.image || '') + '" alt="' + escT(c.title) + '">' +
        '<span class="ticket"><span class="t-title">' + escT(c.title) + '</span>' +
        (c.note ? '<span class="t-note">' + escT(c.note) + '</span>' : '') +
        '<span class="t-price">' + price + ' ' + was + '</span></span></a>'));
    }
    wrap.appendChild(grid);
  }
  if (!shown) {
    wrap.appendChild(el('<div>' + escT(state.sale
      ? 'Nothing on sale fits that combination right now — try it without the sale filter.'
      : 'The catalogue is thin around that combination right now — try a different colour direction.') + '</div>'));
  } else if (data.why) {
    wrap.appendChild(el('<div class="whyline">' + escT(data.why) + '</div>'));
  }
  thread.appendChild(wrap);
  pivotRow(wrap);
  scrollEnd();
}

// After a result: pivot to another colour (full re-present) or start over.
function pivotRow(wrap) {
  const chips = chipRow(wrap);
  for (const c of COLOURS) {
    if (c === state.colour) continue;
    const b = el('<button><span class="dot" style="background:' + (HEX[c] || '#999') + '"></span>' + escT(cap(c)) + '</button>');
    b.onclick = () => {
      state.colour = c;
      addUser('Make it ' + cap(c) + ' instead');
      buildOutfit();
    };
    chips.appendChild(b);
  }
  const again = el('<button class="ghost">Start over</button>');
  again.onclick = () => {
    state.item = state.colour = state.occasion = null;
    state.sale = false; state.photo = null;
    stepItem();
  };
  chips.appendChild(again);
}

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
