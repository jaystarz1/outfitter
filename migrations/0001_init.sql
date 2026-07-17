-- Outfitter initial schema
CREATE TABLE IF NOT EXISTS stores (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'shopify',
  branding TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  last_synced_at TEXT,
  product_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  store_slug TEXT NOT NULL,
  id INTEGER NOT NULL,
  handle TEXT NOT NULL,
  title TEXT NOT NULL,
  vendor TEXT,
  product_type TEXT,
  category TEXT,
  colours TEXT NOT NULL DEFAULT '[]',
  fit TEXT,
  price_min REAL,
  price_max REAL,
  compare_at_price REAL,
  on_sale INTEGER NOT NULL DEFAULT 0,
  in_stock INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT,
  synced_at TEXT NOT NULL,
  PRIMARY KEY (store_slug, id)
);
CREATE INDEX IF NOT EXISTS idx_products_cat ON products(store_slug, category, in_stock);

CREATE TABLE IF NOT EXISTS variants (
  store_slug TEXT NOT NULL,
  id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  title TEXT,
  price REAL,
  available INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (store_slug, id)
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(store_slug, product_id);

CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
  store_slug UNINDEXED, product_id UNINDEXED, title, product_type, tags
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  store_slug TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'customer',
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  recommendations TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, id);

CREATE TABLE IF NOT EXISTS render_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  spec TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  result_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_slug TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  products_seen INTEGER,
  products_upserted INTEGER,
  products_pruned INTEGER,
  status TEXT NOT NULL DEFAULT 'running',
  error TEXT
);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip TEXT NOT NULL,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, window_start)
);
