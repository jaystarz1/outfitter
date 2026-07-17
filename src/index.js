import { Hono } from 'hono';
import { syncStore, syncAllStores } from './sync.js';
import { runStylist } from './stylist.js';
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
    result = await runStylist(env, store, session, history, userContent);
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
