import { Hono } from 'hono';
import { syncStore, syncAllStores } from './sync.js';
import { runStylist, resolveCards } from './stylist.js';
import { buildPlan, paletteOptions, COLOUR_FAMILY } from './palette.js';
import { renderPage } from './ui.js';

const app = new Hono();

const MAX_MESSAGES_PER_SESSION = 60;
const RATE_LIMIT_PER_HOUR = 40;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function getStore(env, slug) {
  return env.DB.prepare("SELECT * FROM stores WHERE slug = ? AND status = 'active'")
    .bind(slug)
    .first();
}

async function rateLimit(env, ip) {
  const windowStart = new Date().toISOString().slice(0, 13); // hour bucket
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (ip, window_start, count) VALUES (?, ?, 1)
     ON CONFLICT(ip, window_start) DO UPDATE SET count = count + 1
     RETURNING count`
  ).bind(ip, windowStart).first();
  return row.count <= RATE_LIMIT_PER_HOUR;
}

// ---------- UI ----------
app.get('/', (c) => c.redirect('/s/tiptop'));

app.get('/s/:slug', async (c) => {
  const store = await getStore(c.env, c.req.param('slug'));
  if (!store) return c.text('Store not found', 404);
  return c.html(renderPage(store));
});

// Serve uploaded photos back to the chat UI
app.get('/u/:key{.+}', async (c) => {
  const obj = await c.env.UPLOADS.get(c.req.param('key'));
  if (!obj) return c.text('not found', 404);
  return new Response(obj.body, {
    headers: {
      'content-type': obj.httpMetadata?.contentType || 'image/jpeg',
      'cache-control': 'private, max-age=86400',
    },
  });
});

// ---------- API ----------
app.get('/api/history', async (c) => {
  const sessionId = c.req.query('session');
  const slug = c.req.query('store');
  if (!sessionId || !slug) return c.json({ messages: [] });
  const session = await c.env.DB.prepare(
    'SELECT * FROM sessions WHERE id = ? AND store_slug = ?'
  ).bind(sessionId, slug).first();
  if (!session) return c.json({ messages: [] });
  const { results } = await c.env.DB.prepare(
    'SELECT role, content, recommendations, created_at FROM messages WHERE session_id = ? ORDER BY id'
  ).bind(sessionId).all();
  return c.json({
    messages: results.map((m) => ({
      role: m.role,
      content: JSON.parse(m.content),
      recommendations: m.recommendations ? JSON.parse(m.recommendations) : null,
      created_at: m.created_at,
    })),
  });
});

app.post('/api/chat', async (c) => {
  const env = c.env;
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  if (!(await rateLimit(env, ip))) {
    return c.json({ error: 'Slow down a little — try again in a few minutes.' }, 429);
  }

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'bad request' }, 400);
  }
  const { store: slug, text, image, image_type } = body;
  let sessionId = body.session_id;
  const store = await getStore(env, slug);
  if (!store) return c.json({ error: 'unknown store' }, 404);
  if (!text && !image) return c.json({ error: 'empty message' }, 400);

  const now = new Date().toISOString();
  let session = sessionId
    ? await env.DB.prepare('SELECT * FROM sessions WHERE id = ? AND store_slug = ?')
        .bind(sessionId, slug).first()
    : null;
  if (!session) {
    sessionId = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO sessions (id, store_slug, mode, created_at, updated_at) VALUES (?,?,?,?,?)'
    ).bind(sessionId, slug, body.mode === 'rep' ? 'rep' : 'customer', now, now).run();
    session = { id: sessionId, store_slug: slug, mode: body.mode === 'rep' ? 'rep' : 'customer', message_count: 0 };
  }
  if (session.message_count >= MAX_MESSAGES_PER_SESSION) {
    return c.json({ error: 'This conversation is full — start a fresh one to keep styling.', session_id: sessionId }, 400);
  }

  // Build user content blocks; stash image in R2
  const userContent = [];
  let imageKey = null;
  if (image) {
    const bytes = Uint8Array.from(atob(image), (ch) => ch.charCodeAt(0));
    if (bytes.length > MAX_IMAGE_BYTES) return c.json({ error: 'Image too large (5 MB max).' }, 400);
    const type = ['image/jpeg', 'image/png', 'image/webp'].includes(image_type) ? image_type : 'image/jpeg';
    imageKey = `${slug}/${sessionId}/${Date.now()}.${type.split('/')[1]}`;
    await env.UPLOADS.put(imageKey, bytes, { httpMetadata: { contentType: type } });
    userContent.push({ type: 'image', source: { type: 'base64', media_type: type, data: image } });
  }
  userContent.push({ type: 'text', text: text || 'Here is a photo of the item.' });

  // Reconstruct compact history: text-only (images replaced by a marker)
  const { results: past } = await env.DB.prepare(
    'SELECT role, content FROM messages WHERE session_id = ? ORDER BY id'
  ).bind(sessionId).all();
  const history = past.map((m) => {
    const content = JSON.parse(m.content);
    return {
      role: m.role,
      content: content
        .map((b) => (b.type === 'image_ref' ? { type: 'text', text: '[customer uploaded a photo here]' } : b))
        .filter((b) => b.type === 'text' && b.text),
    };
  }).filter((m) => m.content.length);

  let result;
  try {
    if (env.DEV_BRAIN === 'queue') {
      result = await runDevBrain(env, store, session, history, text, imageKey);
    } else {
      result = await runStylist(env, store, session, history, userContent);
    }
  } catch (err) {
    console.error('stylist error', err);
    return c.json({ error: 'The stylist hit a snag — please try again.', session_id: sessionId }, 502);
  }

  // Persist: user turn (image as ref) + assistant final text + cards/palette
  const storedUser = [];
  if (imageKey) storedUser.push({ type: 'image_ref', key: imageKey, url: `/u/${imageKey}` });
  if (text) storedUser.push({ type: 'text', text });
  else storedUser.push({ type: 'text', text: 'Here is a photo of the item.' });
  const recommendations = { cards: result.cards, palette: result.palette };
  await env.DB.batch([
    env.DB.prepare('INSERT INTO messages (session_id, role, content, created_at) VALUES (?,?,?,?)')
      .bind(sessionId, 'user', JSON.stringify(storedUser), now),
    env.DB.prepare('INSERT INTO messages (session_id, role, content, recommendations, created_at) VALUES (?,?,?,?,?)')
      .bind(sessionId, 'assistant', JSON.stringify([{ type: 'text', text: result.text }]),
        JSON.stringify(recommendations), new Date().toISOString()),
    env.DB.prepare('UPDATE sessions SET message_count = message_count + 2, updated_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), sessionId),
  ]);

  return c.json({
    session_id: sessionId,
    text: result.text,
    cards: result.cards,
    palette: result.palette,
  });
});

// ---------- Outfit builder (deterministic: palette matrix + SQL, no model) ----------

// Step 5: the pickable palette for a chosen item/shade/occasion.
app.post('/api/palette', async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'bad request' }, 400);
  }
  const opts = paletteOptions(body.item, body.shade, body.occasion);
  if (!opts) return c.json({ error: 'unknown item, shade, or occasion' }, 400);
  return c.json(opts);
});

app.post('/api/outfit', async (c) => {
  const env = c.env;
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  if (!(await rateLimit(env, ip))) {
    return c.json({ error: 'Slow down a little — try again in a few minutes.' }, 429);
  }
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'bad request' }, 400);
  }
  const { store: slug, item, shade, occasion, picks } = body;
  const store = await getStore(env, slug);
  if (!store) return c.json({ error: 'unknown store' }, 404);
  const plan = buildPlan(item, shade, occasion, Array.isArray(picks) ? picks : []);
  if (!plan) return c.json({ error: 'unknown item, shade, or occasion' }, 400);

  // Rows merge by display group (Belts & Shoes; Ties, Socks & Pocket Squares).
  const groups = new Map();
  for (const role of plan.roles) {
    const cards = await pickForRole(env, store, role, false);
    if (!cards.length) continue;
    if (!groups.has(role.group)) groups.set(role.group, []);
    groups.get(role.group).push(...cards);
  }
  return c.json({
    palette: plan.swatches,
    why: plan.why,
    groups: [...groups.entries()].map(([role, cards]) => ({ role, cards })),
  });
});

// Fitting list: per-size variants (sku, availability) for selected products.
app.get('/api/variants', async (c) => {
  const slug = c.req.query('store');
  const ids = (c.req.query('ids') || '').split(',').map(Number).filter(Boolean).slice(0, 30);
  const store = await getStore(c.env, slug);
  if (!store || !ids.length) return c.json({ products: [] });
  const placeholders = ids.map(() => '?').join(',');
  const { results } = await c.env.DB.prepare(
    `SELECT product_id, title, sku, price, available FROM variants
     WHERE store_slug = ? AND product_id IN (${placeholders}) ORDER BY product_id, id`
  ).bind(store.slug, ...ids).all();
  const byProduct = {};
  for (const v of results) {
    (byProduct[v.product_id] = byProduct[v.product_id] || []).push({
      title: v.title,
      sku: v.sku,
      style: v.sku ? v.sku.split('~')[0] : null,
      price: v.price,
      available: !!v.available,
    });
  }
  return c.json({ products: byProduct });
});

// Rank a role's category: colour fit first (earlier in the plan's list = better,
// exact beats partial), sale as tiebreaker, then spread picks across prices.
async function pickForRole(env, store, role, saleOnly) {
  let sql =
    `SELECT id, handle, title, product_type, colours, fit, price_min, compare_at_price, on_sale, image_url
     FROM products WHERE store_slug = ? AND in_stock = 1 AND category = ?`;
  if (saleOnly) sql += ' AND on_sale = 1';
  const { results } = await env.DB.prepare(sql).bind(store.slug, role.category).all();
  const scored = [];
  for (const r of results) {
    const colours = JSON.parse(r.colours || '[]');
    let best = -1;      // index into role.colours of the best-matched want
    let quality = 9;    // 0 exact, 1 colour-family, 2 substring
    let matchedTag = null; // the store's own colour word — what the card admits to
    for (let i = 0; i < role.colours.length; i++) {
      const want = role.colours[i];
      const family = COLOUR_FAMILY[want] || [];
      for (const have of colours) {
        let q;
        if (have === want) q = 0;
        else if (family.includes(have)) q = 1;
        else if (have.includes(want) || want.includes(have)) q = 2;
        else continue;
        if (best === -1 || i < best || (i === best && q < quality)) { best = i; quality = q; matchedTag = have; }
      }
    }
    // Belts/shoes/squares often carry no colour tag; keep them as weak candidates.
    if (best === -1 && colours.length) continue;
    let score = (best === -1 ? 200 : best * 16 + quality * 4) - (r.on_sale ? 1 : 0);
    if (/\bboys?\b/i.test(r.title)) score += 1000; // kids' line stays out of adult outfits
    // matched = plan colour (drives one-per-colour diversity); tag = store's word (drives the card note)
    scored.push({ row: r, score, matched: best >= 0 ? role.colours[best] : null, tag: matchedTag });
  }
  scored.sort((a, b) => a.score - b.score || a.row.price_min - b.row.price_min);

  // Diversify: one best pick per plan colour first ("three shirt colour
  // options"), then fill remaining slots by score.
  const chosen = [];
  const ids = new Set();
  for (const want of role.colours) {
    if (chosen.length >= role.count) break;
    const hit = scored.find((p) => p.matched === want && !ids.has(p.row.id));
    if (hit) { chosen.push(hit); ids.add(hit.row.id); }
  }
  for (const p of scored) {
    if (chosen.length >= role.count) break;
    if (!ids.has(p.row.id)) { chosen.push(p); ids.add(p.row.id); }
  }

  return chosen.filter(Boolean).map(({ row, tag }) => ({
    id: row.id,
    role: role.label,
    note: tag ? 'in ' + tag : '',
    title: row.title,
    fit: row.fit,
    price: row.price_min,
    compare_at_price: row.on_sale ? row.compare_at_price : null,
    image: row.image_url,
    url: `https://${store.domain}/products/${row.handle}`,
  }));
}

// ---------- Dev brain (local only: DEV_BRAIN=queue) ----------
// Chat turns queue in D1; the developer's Claude Code session answers them.
async function runDevBrain(env, store, session, history, text, imageKey) {
  const now = new Date().toISOString();
  const payload = JSON.stringify({
    store: store.slug,
    session_id: session.id,
    history,
    text: text || '(photo only)',
    image_key: imageKey,
  });
  const job = await env.DB.prepare(
    'INSERT INTO dev_jobs (session_id, store_slug, payload, created_at) VALUES (?,?,?,?) RETURNING id'
  ).bind(session.id, store.slug, payload, now).first();

  for (let i = 0; i < 110; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const row = await env.DB.prepare('SELECT status, reply FROM dev_jobs WHERE id = ?')
      .bind(job.id).first();
    if (row && row.status === 'done' && row.reply) {
      const reply = JSON.parse(row.reply);
      const cards = await resolveCards(env, store, reply.items || []);
      return { text: reply.text || '', cards, palette: reply.palette || null };
    }
  }
  return { text: 'The stylist stepped away from the counter — try that again in a moment.', cards: [], palette: null };
}

app.get('/admin/dev/jobs', async (c) => {
  if (!adminAuthed(c) || c.env.DEV_BRAIN !== 'queue') return c.text('unauthorized', 401);
  const { results } = await c.env.DB.prepare(
    "SELECT id, payload, created_at FROM dev_jobs WHERE status = 'pending' ORDER BY id"
  ).all();
  return c.json({ jobs: results.map((r) => ({ id: r.id, ...JSON.parse(r.payload), created_at: r.created_at })) });
});

app.post('/admin/dev/reply', async (c) => {
  if (!adminAuthed(c) || c.env.DEV_BRAIN !== 'queue') return c.text('unauthorized', 401);
  const { id, text, items, palette } = await c.req.json();
  await c.env.DB.prepare("UPDATE dev_jobs SET status = 'done', reply = ? WHERE id = ?")
    .bind(JSON.stringify({ text, items: items || [], palette: palette || null }), id).run();
  return c.json({ ok: true });
});

// ---------- Admin ----------
function adminAuthed(c) {
  const auth = c.req.header('authorization') || '';
  return c.env.ADMIN_TOKEN && auth === `Bearer ${c.env.ADMIN_TOKEN}`;
}

app.post('/admin/sync/:slug', async (c) => {
  if (!adminAuthed(c)) return c.text('unauthorized', 401);
  const store = await getStore(c.env, c.req.param('slug'));
  if (!store) return c.text('unknown store', 404);
  const outcome = await syncStore(c.env, store);
  return c.json(outcome);
});

app.post('/admin/stores', async (c) => {
  if (!adminAuthed(c)) return c.text('unauthorized', 401);
  const { slug, name, domain, branding } = await c.req.json();
  if (!slug || !name || !domain) return c.json({ error: 'slug, name, domain required' }, 400);
  await c.env.DB.prepare(
    `INSERT INTO stores (slug, name, domain, branding) VALUES (?,?,?,?)
     ON CONFLICT(slug) DO UPDATE SET name=excluded.name, domain=excluded.domain, branding=excluded.branding`
  ).bind(slug, name, domain, JSON.stringify(branding || {})).run();
  return c.json({ ok: true, slug });
});

app.get('/health', async (c) => {
  const stores = await c.env.DB.prepare(
    'SELECT slug, product_count, last_synced_at FROM stores'
  ).all();
  return c.json({ ok: true, stores: stores.results });
});

export default {
  fetch: app.fetch,
  scheduled: async (event, env, ctx) => {
    ctx.waitUntil(syncAllStores(env));
  },
};
