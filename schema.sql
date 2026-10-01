PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE products (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT    NOT NULL,
  slug            TEXT    NOT NULL UNIQUE,
  description     TEXT    DEFAULT '',          -- HTML content (from Smart Editor)
  sku             TEXT    DEFAULT '',          -- Parent SKU / Style Code
  category        TEXT    DEFAULT '',
  brand           TEXT    DEFAULT '',
  tags            TEXT    DEFAULT '[]',        -- JSON array of strings
  images          TEXT    DEFAULT '[]',        -- JSON array of image URLs
  base_price      REAL    NOT NULL DEFAULT 0,
  original_price  REAL    DEFAULT NULL,        -- Strike-through price (NULL = no discount)
  stock           INTEGER NOT NULL DEFAULT 99,
  is_unlimited_stock INTEGER NOT NULL DEFAULT 0,  -- 1 = unlimited
  is_variant_bulk_mode   INTEGER NOT NULL DEFAULT 0,  -- 1 = has variants
  free_delivery         INTEGER NOT NULL DEFAULT 0,  -- 1 = always free delivery
  free_delivery_min_qty INTEGER NOT NULL DEFAULT 0,  -- Free if qty >= this (0 = off)
  free_delivery_min_amount REAL NOT NULL DEFAULT 0,  -- Free if subtotal >= this (0 = off)
  status          TEXT    NOT NULL DEFAULT 'active', -- active / draft / archived
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  is_flash_sale   INTEGER NOT NULL DEFAULT 0,
  requires_shipping INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE product_variants (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name            TEXT    NOT NULL DEFAULT '',   -- e.g. "Red / XL"
  sku             TEXT    DEFAULT '',
  image_url       TEXT    DEFAULT '',
  price           REAL    NOT NULL DEFAULT 0,
  original_price  REAL    DEFAULT NULL,
  stock           INTEGER NOT NULL DEFAULT 99,
  is_unlimited_stock INTEGER NOT NULL DEFAULT 0,
  options         TEXT    DEFAULT '{}',         -- JSON e.g. {"Color":"Red","Size":"XL"}
  sort_order      INTEGER NOT NULL DEFAULT 0,
  requires_shipping INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE orders (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id          TEXT    NOT NULL UNIQUE,      -- KOT-YYMMDD-NNNN-D format
  customer_id       INTEGER DEFAULT NULL REFERENCES customers(id) ON DELETE SET NULL,
  customer_name     TEXT    NOT NULL,
  phone             TEXT    NOT NULL,
  email             TEXT    DEFAULT NULL,
  address           TEXT    DEFAULT '',
  city              TEXT    NOT NULL DEFAULT '',   -- District
  thana             TEXT    DEFAULT '',
  delivery_area     TEXT    NOT NULL DEFAULT 'digital', -- inside / outside / digital
  requires_shipping INTEGER NOT NULL DEFAULT 1,
  subtotal          REAL    NOT NULL DEFAULT 0,
  delivery_fee      REAL    NOT NULL DEFAULT 0,
  discount_amount   REAL    NOT NULL DEFAULT 0,
  coupon_code       TEXT    DEFAULT NULL,
  total_amount      REAL    NOT NULL DEFAULT 0,
  payment_method    TEXT    NOT NULL DEFAULT 'cod',  -- cod / full
  payment_provider  TEXT    DEFAULT NULL,            -- bKash / Nagad / Rocket
  sender_number     TEXT    DEFAULT NULL,
  payment_status    TEXT    NOT NULL DEFAULT 'Pending', -- Pending / Verify Manual / Verified
  notes             TEXT    DEFAULT NULL,
  items             TEXT    NOT NULL DEFAULT '[]',   -- JSON array of order items
  status            TEXT    NOT NULL DEFAULT 'Pending', -- Pending/Processing/Shipped/Delivered/Cancelled/Returned
  source            TEXT    DEFAULT 'checkout_drawer',
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE counters (
  key    TEXT PRIMARY KEY,   -- 'global' or 'daily_YYYY_MM_DD'
  count  INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE coupons (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT    NOT NULL UNIQUE,
  type        TEXT    NOT NULL DEFAULT 'Fixed',   -- Fixed / Percentage
  value       REAL    NOT NULL DEFAULT 0,         -- Amount or percentage
  min_order   REAL    NOT NULL DEFAULT 0,         -- Minimum order amount
  max_uses    INTEGER NOT NULL DEFAULT 0,         -- 0 = unlimited
  used_count  INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1,         -- 1 = active, 0 = inactive
  expires_at  TEXT    DEFAULT NULL,               -- ISO date or NULL for no expiry
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE store_settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL DEFAULT ''   -- JSON string
);
CREATE TABLE admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,              -- bcrypt or argon2 hash
  name          TEXT    DEFAULT 'Admin',
  permissions   TEXT    NOT NULL DEFAULT '["super_admin"]', -- JSON array of permissions
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE blogs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  title       TEXT    NOT NULL,
  content     TEXT    DEFAULT '',
  category    TEXT    DEFAULT 'General',
  status      TEXT    NOT NULL DEFAULT 'published',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE pages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  title       TEXT    NOT NULL,
  content     TEXT    DEFAULT '',       -- HTML content
  status      TEXT    NOT NULL DEFAULT 'published', -- 'published' or 'draft'
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE reviews (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating        INTEGER NOT NULL DEFAULT 5,
  reviewer_name TEXT    NOT NULL DEFAULT 'Customer',
  body          TEXT    DEFAULT '',
  verified      INTEGER NOT NULL DEFAULT 0,
  approved      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE categories (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  parent_id       TEXT,
  image_url       TEXT DEFAULT '',
  description     TEXT DEFAULT '',
  is_active       INTEGER NOT NULL DEFAULT 1,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')), show_on_homepage INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);
CREATE TABLE product_categories (
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id     TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);
DELETE FROM sqlite_sequence;
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created ON products(created_at DESC);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_phone ON orders(phone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(active);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_blogs_status ON blogs(status);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_approved ON reviews(approved);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_sort ON categories(sort_order);
CREATE INDEX idx_product_categories_pid ON product_categories(product_id);
CREATE INDEX idx_product_categories_cid ON product_categories(category_id);
CREATE TABLE analytics_summary (
  date          TEXT PRIMARY KEY,
  views         INTEGER NOT NULL DEFAULT 0,
  product_views INTEGER NOT NULL DEFAULT 0,
  cart_adds     INTEGER NOT NULL DEFAULT 0,
  checkouts     INTEGER NOT NULL DEFAULT 0,
  orders        INTEGER NOT NULL DEFAULT 0,
  revenue       REAL NOT NULL DEFAULT 0,
  sources       TEXT NOT NULL DEFAULT '{}',
  devices       TEXT NOT NULL DEFAULT '{}',
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  unique_visitors INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_analytics_summary_date ON analytics_summary(date);

CREATE TABLE daily_visitor_hashes (
  date          TEXT NOT NULL,
  visitor_hash  TEXT NOT NULL,
  PRIMARY KEY (date, visitor_hash)
);
CREATE INDEX idx_daily_visitor_hashes_date ON daily_visitor_hashes(date);

-- ═══════════════════════════════════════════════════
-- Landing Pages (Product-level visual page builder)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS landing_pages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  linked_product_id INTEGER DEFAULT NULL REFERENCES products(id) ON DELETE SET NULL,
  
  title           TEXT    NOT NULL,
  slug            TEXT    NOT NULL UNIQUE,
  description     TEXT    DEFAULT '',
  sku             TEXT    DEFAULT '',
  category        TEXT    DEFAULT '',
  brand           TEXT    DEFAULT '',
  images          TEXT    DEFAULT '[]',
  base_price      REAL    NOT NULL DEFAULT 0,
  original_price  REAL    DEFAULT NULL,
  stock           INTEGER NOT NULL DEFAULT 99,
  is_unlimited_stock INTEGER NOT NULL DEFAULT 0,
  is_variant_bulk_mode INTEGER NOT NULL DEFAULT 0,
  
  sections        TEXT    NOT NULL DEFAULT '[]',
  settings        TEXT    NOT NULL DEFAULT '{}',
  is_active       INTEGER NOT NULL DEFAULT 0,
  requires_shipping INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_active ON landing_pages(is_active);

CREATE TABLE IF NOT EXISTS landing_page_variants (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  landing_page_id INTEGER NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  linked_variant_id INTEGER DEFAULT NULL REFERENCES product_variants(id) ON DELETE SET NULL,
  
  name            TEXT    NOT NULL DEFAULT '',
  sku             TEXT    DEFAULT '',
  image_url       TEXT    DEFAULT '',
  price           REAL    NOT NULL DEFAULT 0,
  original_price  REAL    DEFAULT NULL,
  stock           INTEGER NOT NULL DEFAULT 99,
  is_unlimited_stock INTEGER NOT NULL DEFAULT 0,
  options         TEXT    DEFAULT '{}',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  requires_shipping INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_landing_page_variants_parent ON landing_page_variants(landing_page_id);

-- ═══════════════════════════════════════════════════
-- Order Activity Logs
-- ═══════════════════════════════════════════════════
CREATE TABLE order_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      TEXT    NOT NULL,
  admin_name    TEXT    NOT NULL,
  action        TEXT    NOT NULL, -- 'created', 'status_updated', 'details_updated', 'note_added'
  changes       TEXT    DEFAULT NULL, -- JSON object describing changes
  note          TEXT    DEFAULT NULL, -- Custom note text
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_order_logs_order ON order_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- ═══════════════════════════════════════════════════
-- Customer Accounts & Profiles
-- ═══════════════════════════════════════════════════
CREATE TABLE customers (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  email             TEXT    UNIQUE DEFAULT NULL,
  phone             TEXT    UNIQUE DEFAULT NULL,  -- Optional
  password_hash     TEXT    DEFAULT NULL,         -- Secure bcrypt/argon2 hash or NULL for OTP
  full_name         TEXT    NOT NULL,
  
  -- Auth Providers (Social Login)
  provider          TEXT    DEFAULT 'local',      -- 'local', 'google', 'facebook'
  provider_id       TEXT    DEFAULT NULL,         -- Social ID
  
  -- Marketing & Tracking
  accepts_marketing INTEGER NOT NULL DEFAULT 0,
  total_spent       REAL    NOT NULL DEFAULT 0,
  orders_count      INTEGER NOT NULL DEFAULT 0,
  
  status            TEXT    NOT NULL DEFAULT 'active', -- 'active', 'blocked'
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_provider ON customers(provider, provider_id);

CREATE TABLE customer_addresses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id   INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  label         TEXT    DEFAULT 'Home',       -- e.g., Home, Office
  name          TEXT    NOT NULL,
  phone         TEXT    NOT NULL,
  address       TEXT    NOT NULL,
  city          TEXT    NOT NULL,
  thana         TEXT    DEFAULT '',
  
  is_default    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);

-- ═══════════════════════════════════════════════════
-- Digital Products & Downloads
-- ═══════════════════════════════════════════════════
CREATE TABLE digital_assets (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id      INTEGER DEFAULT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id      INTEGER DEFAULT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  landing_id      INTEGER DEFAULT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  
  name            TEXT    NOT NULL,             -- e.g., "Installation Guide PDF"
  file_url        TEXT    DEFAULT NULL,         -- The hidden AWS/Drive link
  instructions    TEXT    DEFAULT NULL,         -- Text instructions or license keys
  
  max_downloads   INTEGER NOT NULL DEFAULT 0,   -- Default limit for buyers (0 = unlimited)
  expiry_days     INTEGER NOT NULL DEFAULT 0,   -- e.g., expires in 30 days (0 = never)
  
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_digital_assets_product ON digital_assets(product_id);
CREATE INDEX IF NOT EXISTS idx_digital_assets_landing ON digital_assets(landing_id);

CREATE TABLE order_downloads (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id          TEXT    NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  asset_id          INTEGER NOT NULL REFERENCES digital_assets(id) ON DELETE CASCADE,
  customer_id       INTEGER DEFAULT NULL REFERENCES customers(id) ON DELETE SET NULL, -- Null if guest
  
  download_token    TEXT    NOT NULL UNIQUE,      -- Secure UUID for the download link
  customer_email    TEXT    NOT NULL,             -- Mandatory for delivery
  
  downloads_count   INTEGER NOT NULL DEFAULT 0,   -- Track how many times they downloaded
  download_limit    INTEGER DEFAULT -1,           -- Limit for buyers (-1 = unlimited)
  expires_at        TEXT    DEFAULT NULL,         -- Calculated at time of purchase
  
  is_revoked        INTEGER NOT NULL DEFAULT 0,   -- Admin can manually revoke access (1 = revoked)
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  last_downloaded_at TEXT   DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_downloads_token ON order_downloads(download_token);
CREATE INDEX IF NOT EXISTS idx_order_downloads_order ON order_downloads(order_id);
