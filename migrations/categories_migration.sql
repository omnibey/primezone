-- ─── Categories ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  parent_id       TEXT,
  image_url       TEXT DEFAULT '',
  description     TEXT DEFAULT '',
  is_active       INTEGER NOT NULL DEFAULT 1,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);

-- ─── Product Categories (Many-to-Many) ────────────────────────
CREATE TABLE IF NOT EXISTS product_categories (
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id     TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_product_categories_pid ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_cid ON product_categories(category_id);
