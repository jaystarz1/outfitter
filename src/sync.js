// Shopify catalogue sync: paginated products.json -> D1
// Attribute extraction handles Tip Top's "KEY--value" tag convention plus a
// generic lexicon fallback for stores without structured tags.

const COLOUR_LEXICON = [
  'white', 'black', 'navy', 'blue', 'light blue', 'charcoal', 'grey', 'gray',
  'brown', 'tan', 'beige', 'khaki', 'green', 'olive', 'burgundy', 'wine',
  'red', 'pink', 'purple', 'lavender', 'orange', 'rust', 'yellow', 'gold',
  'cream', 'ivory', 'silver', 'teal', 'aqua', 'sage', 'camel', 'taupe',
];

const CATEGORY_RULES = [
  { cat: 'pocket-square', re: /pocket\s*square/i },
  { cat: 'tie', re: /\b(tie|ties|bow\s*tie|necktie)\b/i },
  { cat: 'belt', re: /\b(belt|suspender)/i },
  { cat: 'socks', re: /\bsocks?\b/i },
  { cat: 'shoes', re: /\b(shoe|loafer|oxford|derby|boot|sneaker|brogue|monk)/i },
  { cat: 'pants', re: /\b(pants?|trousers?|chinos?|jeans?|denim|joggers?)\b/i },
  { cat: 'vest', re: /\b(vests?|waistcoats?)\b/i },
  { cat: 'blazer', re: /\b(blazers?|sport\s*coats?|sports\s*coats?|suit\s*jackets?|jackets?)\b/i },
  { cat: 'suit', re: /\bsuits?\b/i },
  { cat: 'shorts', re: /\bshorts?\b/i },
  { cat: 'sweater', re: /\b(sweaters?|knit|cardigans?|pullovers?|hoodies?)\b/i },
  { cat: 'outerwear', re: /\b(coats?|parkas?|overcoats?|topcoats?|puffers?)\b/i },
  { cat: 'shirt', re: /\b(shirts?|polos?|tees?|t-shirts?|henleys?)\b/i },
  { cat: 'accessory', re: /\b(scarf|scarves|gloves?|hats?|cuff\s*links?|cufflinks?|lapel\s*pins?|brooch(es)?|wallets?|bags?|umbrellas?)\b/i },
];

function normalizeColour(raw) {
  // Tip Top uses e.g. "Blue-Bleu" (EN-FR); take the English half, lowercase.
  const c = raw.split(/[-/]/)[0].trim().toLowerCase();
  return c === 'gray' ? 'grey' : c;
}

function extractColours(product) {
  const found = new Set();
  for (const tag of product.tags || []) {
    const m = /^COLOR--(.+)$/i.exec(tag);
    if (m) found.add(normalizeColour(m[1]));
  }
  if (found.size === 0) {
    const hay = [
      product.title,
      ...(product.variants || []).map((v) => v.option1 || ''),
    ].join(' ').toLowerCase();
    for (const colour of COLOUR_LEXICON) {
      if (hay.includes(colour)) found.add(colour === 'gray' ? 'grey' : colour);
    }
  }
  return [...found];
}

function extractCategory(product) {
  const hay = `${product.product_type || ''} ${product.title || ''}`;
  for (const rule of CATEGORY_RULES) {
    if (rule.re.test(hay)) return rule.cat;
  }
  // Fall back to tag conventions like "Category--DRESS SHIRTS"
  for (const tag of product.tags || []) {
    const m = /^(?:Parent Category|Category|WEBCATEGORY1)--(.+)$/i.exec(tag);
    if (m) {
      for (const rule of CATEGORY_RULES) {
        if (rule.re.test(m[1])) return rule.cat;
      }
    }
  }
  return null;
}

function extractFit(product) {
  for (const tag of product.tags || []) {
    const m = /^FIT--(.+)$/i.exec(tag);
    if (m) return m[1].trim();
  }
  const m = /\b(slim|modern|classic|tailored|relaxed|regular)\s+fit\b/i.exec(product.title || '');
  return m ? `${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()} Fit` : null;
}

export function normalizeProduct(store, p, now) {
  const variants = p.variants || [];
  const prices = variants.map((v) => parseFloat(v.price)).filter((n) => !isNaN(n));
  const compareAts = variants
    .map((v) => parseFloat(v.compare_at_price))
    .filter((n) => !isNaN(n) && n > 0);
  const priceMin = prices.length ? Math.min(...prices) : null;
  const compareAt = compareAts.length ? Math.max(...compareAts) : null;
  const image = (p.images && p.images[0] && p.images[0].src) || null;
  return {
    store_slug: store.slug,
    id: p.id,
    handle: p.handle,
    title: p.title,
    vendor: p.vendor || null,
    product_type: p.product_type || null,
    category: extractCategory(p),
    colours: JSON.stringify(extractColours(p)),
    fit: extractFit(p),
    price_min: priceMin,
    price_max: prices.length ? Math.max(...prices) : null,
    compare_at_price: compareAt,
    on_sale: compareAt !== null && priceMin !== null && compareAt > priceMin ? 1 : 0,
    in_stock: variants.some((v) => v.available !== false) ? 1 : 0,
    image_url: image,
    tags: JSON.stringify(p.tags || []),
    updated_at: p.updated_at || null,
    synced_at: now,
    variants: variants.map((v) => ({
      id: v.id,
      product_id: p.id,
      title: v.title || null,
      price: parseFloat(v.price) || null,
      available: v.available === false ? 0 : 1,
    })),
  };
}

async function fetchPage(domain, page) {
  const url = `https://${domain}/products.json?limit=250&page=${page}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'OutfitterSync/1.0 (+outfit stylist catalogue sync)' },
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const data = await res.json();
  return data.products || [];
}

export async function syncStore(env, store) {
  const now = new Date().toISOString();
  const logRes = await env.DB.prepare(
    'INSERT INTO sync_log (store_slug, started_at) VALUES (?, ?) RETURNING id'
  ).bind(store.slug, now).first();
  const logId = logRes.id;

  try {
    let page = 1;
    let seen = 0;
    let upserted = 0;
    // Shopify caps products.json paging; loop until an empty page.
    while (page <= 200) {
      const products = await fetchPage(store.domain, page);
      if (products.length === 0) break;
      seen += products.length;

      const stmts = [];
      for (const raw of products) {
        const p = normalizeProduct(store, raw, now);
        stmts.push(
          env.DB.prepare(
            `INSERT INTO products (store_slug, id, handle, title, vendor, product_type,
               category, colours, fit, price_min, price_max, compare_at_price, on_sale,
               in_stock, image_url, tags, updated_at, synced_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
             ON CONFLICT(store_slug, id) DO UPDATE SET
               handle=excluded.handle, title=excluded.title, vendor=excluded.vendor,
               product_type=excluded.product_type, category=excluded.category,
               colours=excluded.colours, fit=excluded.fit, price_min=excluded.price_min,
               price_max=excluded.price_max, compare_at_price=excluded.compare_at_price,
               on_sale=excluded.on_sale, in_stock=excluded.in_stock,
               image_url=excluded.image_url, tags=excluded.tags,
               updated_at=excluded.updated_at, synced_at=excluded.synced_at`
          ).bind(
            p.store_slug, p.id, p.handle, p.title, p.vendor, p.product_type,
            p.category, p.colours, p.fit, p.price_min, p.price_max,
            p.compare_at_price, p.on_sale, p.in_stock, p.image_url, p.tags,
            p.updated_at, p.synced_at
          )
        );
        stmts.push(
          env.DB.prepare('DELETE FROM variants WHERE store_slug = ? AND product_id = ?')
            .bind(store.slug, p.id)
        );
        for (const v of p.variants) {
          stmts.push(
            env.DB.prepare(
              'INSERT OR REPLACE INTO variants (store_slug, id, product_id, title, price, available) VALUES (?,?,?,?,?,?)'
            ).bind(store.slug, v.id, v.product_id, v.title, v.price, v.available)
          );
        }
        stmts.push(
          env.DB.prepare('DELETE FROM products_fts WHERE store_slug = ? AND product_id = ?')
            .bind(store.slug, p.id)
        );
        stmts.push(
          env.DB.prepare(
            'INSERT INTO products_fts (store_slug, product_id, title, product_type, tags) VALUES (?,?,?,?,?)'
          ).bind(store.slug, p.id, p.title, p.product_type || '', p.tags)
        );
        upserted += 1;
      }
      await env.DB.batch(stmts);
      page += 1;
    }

    // Prune products that vanished from the storefront (not seen this run).
    const pruned = await env.DB.prepare(
      'DELETE FROM products WHERE store_slug = ? AND synced_at < ?'
    ).bind(store.slug, now).run();
    await env.DB.prepare(
      'DELETE FROM products_fts WHERE store_slug = ? AND product_id NOT IN (SELECT id FROM products WHERE store_slug = ?)'
    ).bind(store.slug, store.slug).run();
    await env.DB.prepare(
      'DELETE FROM variants WHERE store_slug = ? AND product_id NOT IN (SELECT id FROM products WHERE store_slug = ?)'
    ).bind(store.slug, store.slug).run();

    await env.DB.prepare(
      'UPDATE stores SET last_synced_at = ?, product_count = (SELECT COUNT(*) FROM products WHERE store_slug = ?) WHERE slug = ?'
    ).bind(now, store.slug, store.slug).run();
    await env.DB.prepare(
      'UPDATE sync_log SET finished_at = ?, products_seen = ?, products_upserted = ?, products_pruned = ?, status = ? WHERE id = ?'
    ).bind(new Date().toISOString(), seen, upserted, pruned.meta.changes || 0, 'ok', logId).run();

    return { store: store.slug, seen, upserted, pruned: pruned.meta.changes || 0 };
  } catch (err) {
    await env.DB.prepare(
      'UPDATE sync_log SET finished_at = ?, status = ?, error = ? WHERE id = ?'
    ).bind(new Date().toISOString(), 'error', String(err), logId).run();
    throw err;
  }
}

export async function syncAllStores(env) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM stores WHERE status = 'active'"
  ).all();
  const outcomes = [];
  for (const store of results) {
    try {
      outcomes.push(await syncStore(env, store));
    } catch (err) {
      outcomes.push({ store: store.slug, error: String(err) });
    }
  }
  return outcomes;
}
