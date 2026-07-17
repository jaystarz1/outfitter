# Outfitter

**An outfit stylist for any Shopify store.** Point it at a storefront, it ingests the
live catalogue, and shoppers (or in-store sales reps) build complete outfits in four
taps — recommending **only real, in-stock, linkable products**.

Live demo, running against [TIP TOP](https://www.tiptop.ca)'s public catalogue:
**https://outfitter.jay-668.workers.dev/s/tiptop**

Tap the piece you're building around ("what goes with these pants?"), its colour, and
the occasion — it answers with a colour palette, a line of styling reasoning, and product
cards that link straight to the store's own product pages. Pivot the colour and the
whole outfit rebuilds.

## Why this is interesting

Every "AI shopping assistant" demo has the same fatal flaw: the model makes up products
and hallucinates URLs. Outfitter's primary flow doesn't use a model at all:

1. The store's catalogue is synced nightly from Shopify's public `products.json` into a
   database (products, variants, extracted colour/fit/category attributes).
2. A curated **palette matrix** (`src/palette.js`) — classic menswear colour theory as
   data — maps (anchor item, colour, occasion) to per-category colour targets.
3. The server matches those targets against the catalogue with ranked SQL (exact colour
   beats colour-family, sale as tiebreaker, one pick per colour so you always get three
   shirt options) and renders the cards — image, price, sale badge, link.

Deterministic, instant, free to run, and a hallucinated product is impossible rather
than merely discouraged. An optional chat/vision lane (bring your own Anthropic key)
exists for photo identification and free-text styling, but the core product needs no
API key at all.

Adding a store is one registry row + one sync call. Zero code. The demo repo has two
stores loaded to prove it.

## Architecture

```
Browser (mobile-first guided flow, /s/<store-slug>)
   item → colour → occasion (+ on-sale toggle) → palette + outfit cards
   │
Cloudflare Worker (Hono)
   ├─ Palette matrix: (item, colour, occasion) → per-category colour targets
   ├─ D1: stores, products, variants, sessions, messages
   ├─ R2: customer photo uploads
   ├─ Optional BYOK chat lane (Claude vision + tool use):
   │    search_catalogue · recommend_products · show_palette
   └─ Cron: nightly catalogue sync per registered store
```

- **Stack**: Cloudflare Workers + D1 + R2, Hono. No build step, no framework, no
  required model, ~1,600 lines total.
- **Catalogue extraction**: structured-tag convention (`COLOR--`, `FIT--`) when the store
  has one, generic lexicon fallback when it doesn't.
- **Two audiences, one engine**: a shopper-facing widget and an in-store sales-rep
  assistant/trainer — the palette matrix doubles as a colour-matching curriculum, and
  the on-sale toggle turns it into a clearance mover.

## Run your own

```bash
npm install
npx wrangler d1 create outfitter-db        # put the id in wrangler.jsonc
npx wrangler r2 bucket create outfitter-uploads
npx wrangler d1 migrations apply outfitter-db --remote
# optional, only for the chat/vision lane:  npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put ADMIN_TOKEN
npx wrangler deploy

# Register a store (any Shopify storefront) and sync it
curl -X POST https://<your-worker>/admin/stores \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'content-type: application/json' \
  -d '{"slug":"acme","name":"Acme Menswear","domain":"www.acme.com","branding":{"accent":"#1F3A5F"}}'
curl -X POST https://<your-worker>/admin/sync/acme -H "Authorization: Bearer $ADMIN_TOKEN"
```

Your stylist is live at `https://<your-worker>/s/acme`.

Tests: `npm test`.

## Status

Built in public. MVP: two stores live, nightly sync running, link integrity and
extraction coverage verified. Not affiliated with or endorsed by TIP TOP — the demo
uses their publicly available catalogue feed, and all product links go to their store.

MIT licensed. The code is the easy part; if you ship this to a retailer, I'd love to
hear about it.
