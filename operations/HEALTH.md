# Outfitter — Health & Runbook

## Live endpoints

- App: https://outfitter.jay-668.workers.dev/s/tiptop (and /s/frankandoak)
- Health: `curl -s https://outfitter.jay-668.workers.dev/health`
  - Healthy = `ok:true` and every store's `last_synced_at` < 26h old with `product_count > 0`.

## Scheduled work

- Cron `15 7 * * *` UTC (Worker trigger): `syncAllStores` — re-ingests every active store
  from `https://<domain>/products.json`. Failures land in the `sync_log` D1 table
  (`status='error'` + error text); the previous catalogue stays in place, so a failed
  sync degrades freshness, never availability.

## Checks

```bash
# Sync freshness + per-store errors
npx wrangler d1 execute outfitter-db --remote --command \
  "SELECT store_slug,status,started_at,error FROM sync_log ORDER BY id DESC LIMIT 5;"

# Manual resync
curl -X POST https://outfitter.jay-668.workers.dev/admin/sync/tiptop \
  -H "Authorization: Bearer $(cat .admin-token)"
```

## Known failure modes

| Symptom | Cause | Action |
|---|---|---|
| Chat replies "stylist hit a snag" | ANTHROPIC_API_KEY missing/invalid or Anthropic outage | `npx wrangler secret put ANTHROPIC_API_KEY` (RED: Jay) |
| Stale `last_synced_at` | Store's products.json throttled/moved | Check `sync_log.error`; retry manually; storefront 503s are usually transient Shopify throttling |
| 429 to users | Per-IP limit (40/h) | Expected under abuse; raise `RATE_LIMIT_PER_HOUR` in src/index.js if legit |

## Escalation

Venture-level failures file a ledger task (chief-of-staff `scripts/cos-escalate.py --route ledger`),
not direct email to Jay. Secrets: `ANTHROPIC_API_KEY`, `ADMIN_TOKEN` (local copy `.admin-token`, git-ignored).
