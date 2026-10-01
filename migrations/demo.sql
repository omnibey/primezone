-- Insert Product 1: Umbrella (Multi-variant)
INSERT OR IGNORE INTO products (id, title, slug, description, sku, category, brand, tags, images, base_price, original_price, stock, is_unlimited_stock, is_multi_variant, status) 
VALUES (1, 'Transparent Cherry Blossom Folding Umbrella', 'transparent-cherry-blossom-folding-umbrella', '🌸 ম্যাজিক্যাল ব্লসম ট্রান্সপারেন্ট ছাতা – স্টাইলিশ, কিউট ও ইউনিক! 🌂\n\nবৃষ্টির দিনগুলোকে আরও সুন্দর ও আকর্ষণীয় করে তুলতে আমাদের কাছে এসেছে অসাধারণ ഈ চেরি ব্লসম ফোল্ডিং ছাতা। এটি সাধারণ ছাতার চেয়ে একদম আলাদা এবং অনেক বেশি স্টাইলিশ! ☔', '29170', 'Fashion', 'Kothbel', '["umbrella", "fashion", "rain"]', '["https://i.ibb.co/QFcrJ7c9/1000039059.jpg", "https://i.ibb.co/DHm9765z/1000039061.jpg", "https://i.ibb.co/gL1tNLKm/1000039060.jpg"]', 680, 750, 0, 0, 1, 'active');

INSERT OR IGNORE INTO product_variants (product_id, name, sku, image_url, price, original_price, stock, is_unlimited_stock, sort_order) 
VALUES 
(1, 'Pink', '29170-Pink', 'https://i.ibb.co/QFcrJ7c9/1000039059.jpg', 680, 750, 50, 0, 0),
(1, 'Mint Green', '29170-Mint-Green', 'https://i.ibb.co/gL1tNLKm/1000039060.jpg', 680, 750, 50, 0, 1),
(1, 'Sky Blue', '29170-Sky-Blue', 'https://i.ibb.co/DHm9765z/1000039061.jpg', 680, 750, 0, 0, 2); -- Sky blue is out of stock to test UI

-- Insert Product 2: Premium T-Shirt (Single variant)
INSERT OR IGNORE INTO products (id, title, slug, description, sku, category, brand, tags, images, base_price, original_price, stock, is_unlimited_stock, is_multi_variant, status) 
VALUES (2, 'Mens Premium Cotton T-Shirt', 'mens-premium-cotton-tshirt', 'Premium 100% cotton t-shirt for daily wear. Comfortable and stylish.', 'TSHIRT-01', 'Fashion', 'Kothbel', '["tshirt", "men"]', '["https://placehold.co/600x600/1E3A8A/FFFFFF?text=T-Shirt"]', 350, 500, 100, 0, 0, 'active');

-- Insert Product 3: Earbuds (Discounted)
INSERT OR IGNORE INTO products (id, title, slug, description, sku, category, brand, tags, images, base_price, original_price, stock, is_unlimited_stock, is_multi_variant, status) 
VALUES (3, 'Wireless Bluetooth Earbuds', 'wireless-bluetooth-earbuds', 'High quality sound with deep bass and noise cancellation.', 'EARBUDS-X', 'Electronics', 'TechBrand', '["electronics", "audio"]', '["https://placehold.co/600x600/10B981/FFFFFF?text=Earbuds"]', 1200, 2000, 20, 0, 0, 'active');
