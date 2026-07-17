# Outfitter

**An AI outfit stylist for any Shopify store.** Point it at a storefront, it ingests the
live catalogue, and shoppers (or in-store sales reps) chat with a stylist that builds
complete outfits — recommending **only real, in-stock, linkable products**.

Live demo, running against [TIP TOP](https://www.tiptop.ca)'s public catalogue:
**https://outfitter.jay-668.workers.dev/s/tiptop**

Upload a photo of the piece you're building around ("what goes with these pants?"),
tell it the occasion, and it answers with a colour palette, styling advice, and product
cards that link straight to the store's own product pages.

## Why this is interesting

Every "AI shopping assistant" demo has the same fatal flaw: the model makes up products
and hallucinates URLs. Outfitter makes that **structurally impossible**:

1. The store's catalogue is synced nightly from Shopify's public `products.json` into a
   database (products, variants, extracted colour/fit/category attributes).
2. The stylist model can only *search* that database via tools, and can only *recommend*
   by product ID from its own search results.
3. The server resolves IDs back to database rows and renders the product cards — image,
   price, sale badge, link. **Model text never contains a URL.**

Adding a store is one registry row + one sync call. Zero code. The demo repo has two
stores loaded to prove it.

## Architecture

```
Browser (mobile-first chat UI, /s/<store-slug>)
   │
Cloudflare Worker (Hono)
   ├─ D1: stores, products, variants, sessions, messages
   ├─ R2: customer photo uploads
   ├─ Claude API (vision + tool use):
   │    search_catalogue · recommend_products · show_palette
   └─ Cron: nightly catalogue sync per registered store
```

- **Stack**: Cloudflare Workers + D1 + R2, Hono, Claude (Sonnet) with tool use. No build
  step, no framework, ~1,500 lines total.
- **Catalogue extraction**: structured-tag convention (`COLOR--`, `FIT--`) when the store
  has one, generic lexicon fallback when it doesn't.
- **Sessions persist** in D1 — close the tab mid-fitting, come back, the conversation is
  still there.

## Run your own

```bash
npm install
npx wrangler d1 create outfitter-db        # put the id in wrangler.jsonc
npx wrangler r2 bucket create outfitter-uploads
npx wrangler d1 migrations apply outfitter-db --remote
npx wrangler secret put ANTHROPIC_API_KEY
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
