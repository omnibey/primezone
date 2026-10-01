-- Run this migration to add digital product and customer support to an existing DB

-- 1. Add requires_shipping to products and variants
ALTER TABLE products ADD COLUMN requires_shipping INTEGER NOT NULL DEFAULT 1;
ALTER TABLE product_variants ADD COLUMN requires_shipping INTEGER NOT NULL DEFAULT 1;

-- 2. Add customer support to orders
ALTER TABLE orders ADD COLUMN customer_id INTEGER DEFAULT NULL REFERENCES customers(id) ON DELETE SET NULL;

-- 3. Create customers tables
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    thana TEXT,
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- 4. Create digital products tables
CREATE TABLE IF NOT EXISTS digital_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    digital_asset_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    downloads_count INTEGER DEFAULT 0,
    download_limit INTEGER DEFAULT -1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (digital_asset_id) REFERENCES digital_assets(id) ON DELETE CASCADE
);
