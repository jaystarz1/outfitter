// Single-page chat UI, served per store. Design system: tailor's atelier —
// hang-tag product cards, fabric-swatch palette strip, stitch-rule dividers.

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
    padding: 20px 16px 8px; max-width: 720px; width: 100%; margin: 0 auto;
  }
  .msg { margin: 0 0 18px; animation: rise .35s ease both; }
  @keyframes rise { from { opacity: 0; transform: translateY(6px); } }
  @media (prefers-reduced-motion: reduce) { .msg { animation: none; } }
  .msg.stylist {
    padding-left: 14px;
    border-left: 2px dashed var(--stitch);
    max-width: 92%;
    white-space: pre-wrap;
  }
  .msg.you {
    margin-left: auto; max-width: 82%;
    background: var(--ink); color: var(--paper);
    padding: 10px 14px; border-radius: 14px 14px 3px 14px;
    white-space: pre-wrap;
  }
  .msg.you img, .msg .snap {
    display: block; max-width: 100%; border-radius: 10px; margin-top: 8px;
  }
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
  /* Quick chips */
  .chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0 14px; }
  .chips button {
    font: 500 12.5px/1 "Public Sans", sans-serif;
    background: var(--tag); color: var(--ink);
    border: 1px solid var(--stitch); border-radius: 999px;
    padding: 9px 14px; cursor: pointer;
  }
  .chips button:hover { border-color: var(--accent); color: var(--accent); }
  /* Composer */
  .composer {
    border-top: 1px solid var(--stitch); background: var(--paper);
    padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
    position: sticky; bottom: 0;
  }
  .composer .row {
    display: flex; gap: 8px; align-items: flex-end;
    max-width: 720px; margin: 0 auto;
  }
  .composer textarea {
    flex: 1; resize: none; max-height: 110px;
    font: 400 15px/1.45 "Public Sans", sans-serif; color: var(--ink);
    background: var(--tag); border: 1px solid var(--stitch); border-radius: 12px;
    padding: 11px 13px; outline: none;
  }
  .composer textarea:focus { border-color: var(--accent); }
  .iconbtn, .sendbtn {
    flex: 0 0 auto; height: 44px; border-radius: 12px; border: 1px solid var(--stitch);
    background: var(--tag); cursor: pointer; display: grid; place-items: center;
  }
  .iconbtn { width: 44px; font-size: 19px; }
  .iconbtn.armed { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent); }
  .sendbtn {
    width: 66px; background: var(--accent); border-color: var(--accent);
    color: #fff; font: 600 13px/1 "Public Sans", sans-serif;
  }
  .sendbtn:disabled { opacity: .45; cursor: default; }
  button:focus-visible, textarea:focus-visible, a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .err { color: var(--sale); font-size: 13px; }
</style>
</head>
<body>
<header>
  <div class="eyebrow">Outfit stylist</div>
  <h1><em>${esc(storeName)}</em></h1>
</header>
<main id="thread"></main>
<div class="composer">
  <div class="row">
    <button class="iconbtn" id="photoBtn" title="Add a photo of your item" aria-label="Add a photo">&#128247;</button>
    <input type="file" id="photoInput" accept="image/jpeg,image/png,image/webp" hidden>
    <textarea id="input" rows="1" placeholder="Tell me about the occasion…" aria-label="Message"></textarea>
    <button class="sendbtn" id="send">Send</button>
  </div>
</div>
<script>
const STORE = ${JSON.stringify(store.slug)};
const KEY = 'outfitter-session-' + STORE;
let sessionId = localStorage.getItem(KEY) || null;
let pendingImage = null, pendingType = null, busy = false;

const thread = document.getElementById('thread');
const input = document.getElementById('input');
const send = document.getElementById('send');
const photoBtn = document.getElementById('photoBtn');
const photoInput = document.getElementById('photoInput');

function el(html) { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
function escT(s) { const d = document.createElement('span'); d.textContent = s; return d.innerHTML; }
function scrollEnd() { thread.scrollTop = thread.scrollHeight; }

function addUser(text, imgUrl) {
  const m = el('<div class="msg you"></div>');
  if (text) m.appendChild(el('<div>' + escT(text) + '</div>'));
  if (imgUrl) m.appendChild(el('<img class="snap" src="' + imgUrl + '" alt="Your photo">'));
  thread.appendChild(m); scrollEnd();
}
function addStylist(text, rec) {
  const wrap = el('<div class="msg stylist"><div class="who">Stylist</div></div>');
  if (rec && rec.palette && rec.palette.length) {
    const sw = el('<div class="swatches" role="list" aria-label="Colour palette"></div>');
    for (const s of rec.palette) {
      sw.appendChild(el('<div class="swatch" role="listitem"><div class="chip" style="background:' + escT(s.hex || '#ccc') +
        '"></div><div class="sname">' + escT(s.name || '') + '</div>' +
        (s.use ? '<div class="suse">' + escT(s.use) + '</div>' : '') + '</div>'));
    }
    wrap.appendChild(sw);
  }
  if (text) wrap.appendChild(el('<div>' + escT(text) + '</div>'));
  if (rec && rec.cards && rec.cards.length) {
    const groups = {};
    for (const c of rec.cards) (groups[c.role] = groups[c.role] || []).push(c);
    for (const role of Object.keys(groups)) {
      wrap.appendChild(el('<div class="rolehead">' + escT(role) + '</div>'));
      const grid = el('<div class="cards"></div>');
      for (const c of groups[role]) {
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
  }
  thread.appendChild(wrap); scrollEnd();
}
function addTyping() {
  const t = el('<div class="msg stylist" id="typing"><div class="who">Stylist</div><span class="stitches"><i></i><i></i><i></i></span></div>');
  thread.appendChild(t); scrollEnd(); return t;
}

function welcome() {
  addStylist("Hello — I'm the " + ${JSON.stringify(storeName)} + " outfit stylist. I'll help you put a full look together around one piece.\\n\\nWhat sort of look are you going for?");
  const chips = el('<div class="chips"></div>');
  for (const c of ['Classic and polished', 'Fashion-forward', 'Business casual', 'Something for a social night']) {
    const b = el('<button>' + escT(c) + '</button>');
    b.onclick = () => { input.value = c; doSend(); };
    chips.appendChild(b);
  }
  thread.appendChild(chips); scrollEnd();
}

async function loadHistory() {
  if (!sessionId) return welcome();
  try {
    const r = await fetch('/api/history?session=' + sessionId + '&store=' + STORE);
    const { messages } = await r.json();
    if (!messages.length) return welcome();
    for (const m of messages) {
      if (m.role === 'user') {
        const text = m.content.filter(b => b.type === 'text').map(b => b.text).join(' ');
        const img = m.content.find(b => b.type === 'image_ref');
        addUser(text, img ? img.url : null);
      } else {
        const text = m.content.filter(b => b.type === 'text').map(b => b.text).join('\\n');
        addStylist(text, m.recommendations);
      }
    }
  } catch { welcome(); }
}

async function doSend() {
  const text = input.value.trim();
  if (busy || (!text && !pendingImage)) return;
  busy = true; send.disabled = true;
  addUser(text || 'Here is a photo of the item.', pendingImage ? 'data:' + pendingType + ';base64,' + pendingImage : null);
  input.value = ''; input.style.height = 'auto';
  const body = { store: STORE, session_id: sessionId, text, image: pendingImage, image_type: pendingType };
  pendingImage = pendingType = null; photoBtn.classList.remove('armed');
  const typing = addTyping();
  try {
    const r = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const data = await r.json();
    typing.remove();
    if (data.session_id) { sessionId = data.session_id; localStorage.setItem(KEY, sessionId); }
    if (data.error) addStylist(data.error);
    else addStylist(data.text, { cards: data.cards, palette: data.palette });
  } catch {
    typing.remove();
    addStylist('I lost the connection for a moment — please send that again.');
  }
  busy = false; send.disabled = false; input.focus();
}

photoBtn.onclick = () => photoInput.click();
photoInput.onchange = () => {
  const f = photoInput.files[0];
  if (!f) return;
  if (f.size > 5 * 1024 * 1024) { addStylist('That photo is over 5 MB — try a smaller one.'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    pendingImage = reader.result.split(',')[1];
    pendingType = f.type;
    photoBtn.classList.add('armed');
    if (!input.value) input.placeholder = 'Photo attached — add a note or hit Send';
  };
  reader.readAsDataURL(f);
  photoInput.value = '';
};
send.onclick = doSend;
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
});
input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 110) + 'px';
});
loadHistory();
</script>
</body>
</html>`;
}
