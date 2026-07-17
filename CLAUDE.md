# Outfitter — AI outfit stylist (multi-store engine, Tip Top demo)

Multi-store AI outfit stylist webapp on Cloudflare Workers. Any Shopify store
registers via one row in the `stores` table; its catalogue syncs nightly from
`https://<domain>/products.json`; the chat stylist (Claude tool-use over D1)
recommends ONLY real in-catalogue products. Product cards/links are resolved
server-side from product IDs — model text never carries URLs, so hallucinated
links are structurally impossible.

## Layout

| Path | What |
|---|---|
| `src/index.js` | Hono app: UI route `/s/:slug`, `/api/chat`, `/api/history`, `/admin/*`, cron handler |
| `src/sync.js` | Shopify products.json paginated sync + tag-attribute extractor (Tip Top `KEY--value` convention + generic lexicon fallback) |
| `src/stylist.js` | Claude tool loop: `search_catalogue`, `recommend_products`, `show_palette`; per-store system prompt |
| `src/ui.js` | Single-page chat UI (tailor's-atelier design: hang-tag cards, swatch-book palette) |
| `migrations/` | D1 schema |
| `operations/HEALTH.md` | Health/runbook |

## Cloudflare

- Worker `outfitter`, account jay@barkerhrs.com (6683b748eb51641a41a506e5037ac6f2)
- D1 `outfitter-db` (fe2a351c-a732-4aec-9980-5019894eeb2f), R2 `outfitter-uploads`
- Secrets: `ANTHROPIC_API_KEY`, `ADMIN_TOKEN` (wrangler secret put)
- Cron `15 7 * * *` UTC → nightly `syncAllStores`
- Deploy: `npx wrangler deploy`. Migrations: `npx wrangler d1 migrations apply outfitter-db --remote`

## Adding a store (zero code)

```bash
curl -X POST https://<worker>/admin/stores -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"slug":"acme","name":"Acme Menswear","domain":"www.acme.com","branding":{"accent":"#1F3A5F"}}'
curl -X POST https://<worker>/admin/sync/acme -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Rules

- Git: commit/push ONLY via `~/bin/safe-git-push.sh "msg" <paths>`.
- Money, DNS, publishing, legal, credentials, account settings, destructive actions are RED (Jay only). Custom domain + any paid tier = RED gates.
- Render lane (`render_jobs` + local ComfyUI watcher) is dev-only, flag `RENDER_LANE_ENABLED=false`. No paid image APIs.
- Report status to the Chief of Staff (`~/chief-of-staff/`), project record `projects/outfitter.yaml`.
