-- First, let's fix the existing Umbrella product (ID 1) by updating its variants with proper 'options' JSON
UPDATE product_variants SET options = '{"Color":"Pink"}' WHERE product_id = 1 AND name = 'Pink';
UPDATE product_variants SET options = '{"Color":"Mint Green"}' WHERE product_id = 1 AND name = 'Mint Green';
UPDATE product_variants SET options = '{"Color":"Sky Blue"}' WHERE product_id = 1 AND name = 'Sky Blue';

-- Now let's add a NEW product that has both Color and Size (e.g., A Premium Winter Hoodie)
INSERT OR IGNORE INTO products (id, title, slug, description, sku, category, brand, tags, images, base_price, original_price, stock, is_unlimited_stock, is_multi_variant, status) 
VALUES (4, 'Premium Winter Hoodie', 'premium-winter-hoodie', 'Stay warm and stylish this winter with our premium fleece hoodie.', 'HOODIE-01', 'Fashion', 'Kothbel', '["hoodie", "winter", "fashion"]', '["https://placehold.co/600x600/333333/FFFFFF?text=Black+Hoodie", "https://placehold.co/600x600/CCCCCC/000000?text=White+Hoodie"]', 850, 1200, 100, 0, 1, 'active');

-- Insert the variants for the Hoodie (Color + Size combination)
INSERT OR IGNORE INTO product_variants (product_id, name, sku, image_url, price, original_price, stock, is_unlimited_stock, options, sort_order) 
VALUES 
(4, 'Black / M', 'HOODIE-01-BLK-M', 'https://placehold.co/600x600/333333/FFFFFF?text=Black+Hoodie', 850, 1200, 20, 0, '{"Color":"Black","Size":"M"}', 0),
(4, 'Black / L', 'HOODIE-01-BLK-L', 'https://placehold.co/600x600/333333/FFFFFF?text=Black+Hoodie', 850, 1200, 20, 0, '{"Color":"Black","Size":"L"}', 1),
(4, 'Black / XL', 'HOODIE-01-BLK-XL', 'https://placehold.co/600x600/333333/FFFFFF?text=Black+Hoodie', 850, 1200, 0, 0, '{"Color":"Black","Size":"XL"}', 2), -- Out of stock test
(4, 'White / M', 'HOODIE-01-WHT-M', 'https://placehold.co/600x600/CCCCCC/000000?text=White+Hoodie', 850, 1200, 20, 0, '{"Color":"White","Size":"M"}', 3),
(4, 'White / L', 'HOODIE-01-WHT-L', 'https://placehold.co/600x600/CCCCCC/000000?text=White+Hoodie', 850, 1200, 20, 0, '{"Color":"White","Size":"L"}', 4),
(4, 'White / XL', 'HOODIE-01-WHT-XL', 'https://placehold.co/600x600/CCCCCC/000000?text=White+Hoodie', 850, 1200, 20, 0, '{"Color":"White","Size":"XL"}', 5);
