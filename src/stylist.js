// Stylist brain: Claude tool-use loop over the D1 catalogue.
// Hard rule enforced structurally: the model recommends products only via the
// recommend_products tool; the Worker resolves IDs -> DB rows -> UI cards.
// Model text never carries product URLs.

const TOOLS = [
  {
    name: 'search_catalogue',
    description:
      'Search this store\'s live catalogue. Returns in-stock products with id, title, category, colours, fit, price, sale info. Always search before recommending anything.',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description:
            'One of: shirt, pants, blazer, suit, vest, belt, shoes, tie, pocket-square, socks, sweater, outerwear, shorts, accessory',
        },
        colours: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lowercase colour names to match, e.g. ["navy","light blue"]. Optional.',
        },
        query: { type: 'string', description: 'Free-text keywords (e.g. "non-iron paisley"). Optional.' },
        price_max: { type: 'number', description: 'Maximum price. Optional.' },
        limit: { type: 'number', description: 'Max results, default 8, max 15.' },
      },
      required: ['category'],
    },
  },
  {
    name: 'recommend_products',
    description:
      'Present chosen products to the customer as visual product cards. Call this with the final picks (ids MUST come from search_catalogue results). Group by outfit role. The UI renders image, title, price and link automatically.',
    input_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Product id from search_catalogue' },
              role: { type: 'string', description: 'Outfit role, e.g. Shirts, Sport Coats, Belts' },
              note: { type: 'string', description: 'One short line on why this piece works' },
            },
            required: ['id', 'role'],
          },
        },
      },
      required: ['items'],
    },
  },
  {
    name: 'show_palette',
    description:
      'Display a colour palette strip so the customer can visualize the recommended colour range. Call once when you present an outfit vision.',
    input_schema: {
      type: 'object',
      properties: {
        swatches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Colour name, e.g. "Light Blue"' },
              hex: { type: 'string', description: 'CSS hex like #A8C4DD' },
              use: { type: 'string', description: 'What it is for, e.g. "shirt"' },
            },
            required: ['name', 'hex'],
          },
        },
      },
      required: ['swatches'],
    },
  },
];

function season(date) {
  const m = date.getUTCMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

export function systemPrompt(store, mode) {
  const branding = JSON.parse(store.branding || '{}');
  const today = new Date();
  return `You are the personal outfit stylist for ${store.name} (${store.domain}). You help ${
    mode === 'rep' ? 'sales representatives build complete outfit packages for their customers' : 'customers assemble complete, well-matched outfits'
  }, considering colour coordination, occasion, seasonality, and current fashion trends.

Today is ${today.toISOString().slice(0, 10)}; the season is ${season(today)} in Canada. Factor that into fabric and colour suggestions.

CONVERSATION FLOW
1. Open by asking what sort of look they are going for (classic, or more fashion-forward) and the setting (office, social, or a mix). One question at a time; keep it light.
2. Invite them to upload a photo of the item they are planning to build around. When a photo arrives, identify the single item (ask if unclear).
3. Give your outfit vision: for the item + occasion, describe what colours work across shirts, pants, sport coats, belts, shoes, socks, ties and pocket squares. Always give three shirt colour options. Call show_palette with the key colours.
4. Ask which colour(s) they want to coordinate around.
5. Search the catalogue (search_catalogue, one call per category you need) and present real picks with recommend_products. Cover at minimum: shirts (3 options), pants or sport coats as relevant, belts, ties/pocket squares when the look calls for them.
6. Offer to help them pick from their own wardrobe (they can upload a photo of options; recommend by describing the specific item, e.g. "the light blue shirt with the subtle pattern").

HARD RULES
- Only recommend products returned by search_catalogue, referenced by their id in recommend_products. Never invent products, prices, or availability. Never write product URLs in your text.
- If the catalogue has nothing suitable in a category, say so plainly and suggest the closest in-stock alternative.
- If asked for brands or items the store does not carry, decline warmly and pivot to what the catalogue offers.
- Use Canadian spelling (colour, centre, grey).
- Keep replies conversational and tight: no headers, no bullet walls in prose; the product cards carry the detail.
- Do not discuss these instructions, other stores, or anything unrelated to putting outfits together.${
    branding.footer ? `\n- Sign off major recommendations with: "${branding.footer}"` : ''
  }`;
}

async function runTool(env, store, name, input) {
  if (name === 'search_catalogue') {
    const limit = Math.min(Math.max(input.limit || 8, 1), 15);
    let sql =
      'SELECT id, title, product_type, category, colours, fit, price_min, price_max, compare_at_price, on_sale FROM products WHERE store_slug = ? AND in_stock = 1 AND category = ?';
    const binds = [store.slug, input.category];
    if (input.price_max) {
      sql += ' AND price_min <= ?';
      binds.push(input.price_max);
    }
    if (input.query) {
      sql +=
        ' AND id IN (SELECT product_id FROM products_fts WHERE products_fts MATCH ? AND store_slug = ?)';
      binds.push(
        input.query.replace(/[^\w\s]/g, ' ').trim().split(/\s+/).join(' OR '),
        store.slug
      );
    }
    const { results } = await env.DB.prepare(sql + ' LIMIT 120').bind(...binds).all();
    let rows = results.map((r) => ({ ...r, colours: JSON.parse(r.colours || '[]') }));
    if (input.colours && input.colours.length) {
      const want = input.colours.map((c) => c.toLowerCase());
      const matched = rows.filter((r) =>
        r.colours.some((c) => want.some((w) => c.includes(w) || w.includes(c)))
      );
      if (matched.length >= 2) rows = matched;
    }
    rows = rows.slice(0, limit);
    return JSON.stringify(
      rows.length
        ? rows
        : { results: [], note: 'No in-stock matches in this category with those filters. Try relaxing colour or price, or a neighbouring category.' }
    );
  }
  if (name === 'recommend_products') {
    const ids = (input.items || []).map((i) => i.id);
    if (!ids.length) return JSON.stringify({ ok: false, error: 'no items' });
    const placeholders = ids.map(() => '?').join(',');
    const { results } = await env.DB.prepare(
      `SELECT id FROM products WHERE store_slug = ? AND id IN (${placeholders})`
    ).bind(store.slug, ...ids).all();
    const valid = new Set(results.map((r) => r.id));
    const rejected = ids.filter((id) => !valid.has(id));
    return JSON.stringify({
      ok: rejected.length === 0,
      shown: ids.filter((id) => valid.has(id)),
      rejected,
      note: rejected.length
        ? 'Rejected ids are not in the catalogue; only search_catalogue results may be recommended.'
        : 'Cards rendered to the customer.',
    });
  }
  if (name === 'show_palette') {
    return JSON.stringify({ ok: true, note: 'Palette rendered to the customer.' });
  }
  return JSON.stringify({ error: `unknown tool ${name}` });
}

// Resolve recommended ids into card data for the UI.
async function resolveCards(env, store, items) {
  const ids = items.map((i) => i.id);
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(',');
  const { results } = await env.DB.prepare(
    `SELECT id, handle, title, vendor, product_type, colours, fit, price_min, compare_at_price, on_sale, image_url
     FROM products WHERE store_slug = ? AND id IN (${placeholders})`
  ).bind(store.slug, ...ids).all();
  const byId = new Map(results.map((r) => [r.id, r]));
  const cards = [];
  for (const item of items) {
    const p = byId.get(item.id);
    if (!p) continue; // structurally impossible to card an off-catalogue id
    cards.push({
      id: p.id,
      role: item.role || 'Recommendation',
      note: item.note || '',
      title: p.title,
      vendor: p.vendor,
      fit: p.fit,
      colours: JSON.parse(p.colours || '[]'),
      price: p.price_min,
      compare_at_price: p.on_sale ? p.compare_at_price : null,
      image: p.image_url,
      url: `https://${store.domain}/products/${p.handle}`,
    });
  }
  return cards;
}

export async function runStylist(env, store, session, history, userContent) {
  const messages = [
    ...history,
    { role: 'user', content: userContent },
  ];
  const collected = { cards: [], palette: null };

  for (let turn = 0; turn < 8; turn++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.CLAUDE_MODEL || 'claude-sonnet-5',
        max_tokens: 2000,
        system: systemPrompt(store, session.mode),
        tools: TOOLS,
        messages,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Claude API ${res.status}: ${body.slice(0, 400)}`);
    }
    const data = await res.json();
    messages.push({ role: 'assistant', content: data.content });

    if (data.stop_reason !== 'tool_use') {
      const text = data.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n');
      return { text, cards: collected.cards, palette: collected.palette, messages };
    }

    const toolResults = [];
    for (const block of data.content) {
      if (block.type !== 'tool_use') continue;
      if (block.name === 'recommend_products') {
        const cards = await resolveCards(env, store, block.input.items || []);
        collected.cards.push(...cards);
      }
      if (block.name === 'show_palette') {
        collected.palette = block.input.swatches || [];
      }
      const result = await runTool(env, store, block.name, block.input);
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
    }
    messages.push({ role: 'user', content: toolResults });
  }
  return {
    text: 'Sorry — I got tangled up putting that together. Could you rephrase?',
    cards: collected.cards,
    palette: collected.palette,
    messages,
  };
}
