const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function escapeSql(str) {
  if (str === null || str === undefined) return "''";
  return "'" + String(str).replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function matchCategory(p) {
  const name = (p.name || '').toLowerCase();
  if (name.includes('sun cream') || name.includes('sun serum') || name.includes('sunblock') || name.includes('sunscreen') || name.includes('sun stick')) {
    return { catName: 'Skin Care', catId: 'cat-skin-care', subName: 'Sunscreen & Sun Care', subId: 'sub-sunscreen' };
  }
  if (name.includes('serum') || name.includes('ampoule')) {
    return { catName: 'Skin Care', catId: 'cat-skin-care', subName: 'Serum & Ampoule', subId: 'sub-serum' };
  }
  if (name.includes('toner') || name.includes('pad')) {
    return { catName: 'Skin Care', catId: 'cat-skin-care', subName: 'Toner & Pads', subId: 'sub-toner' };
  }
  if (name.includes('cleanser') || name.includes('foam') || name.includes('face wash')) {
    return { catName: 'Skin Care', catId: 'cat-skin-care', subName: 'Cleanser & Face Wash', subId: 'sub-cleanser' };
  }
  if (name.includes('cleansing oil') || name.includes('cleansing balm')) {
    return { catName: 'Skin Care', catId: 'cat-skin-care', subName: 'Cleanser & Face Wash', subId: 'sub-cleanser' };
  }
  if (name.includes('eye cream') || name.includes('mask') || name.includes('patch')) {
    return { catName: 'Skin Care', catId: 'cat-skin-care', subName: 'Mask & Eye Care', subId: 'sub-mask' };
  }
  if (name.includes('cream') || name.includes('moisturizer') || name.includes('gel')) {
    return { catName: 'Skin Care', catId: 'cat-skin-care', subName: 'Moisturizer & Cream', subId: 'sub-moisturizer' };
  }
  if (name.includes('body lotion')) {
    return { catName: 'Body & Bath', catId: 'cat-body-bath', subName: 'Body Lotion & Cream', subId: 'sub-body-lotion' };
  }
  if (name.includes('body wash') || name.includes('shower gel')) {
    return { catName: 'Body & Bath', catId: 'cat-body-bath', subName: 'Body Wash & Shower Gel', subId: 'sub-body-wash' };
  }
  if (name.includes('shampoo')) {
    return { catName: 'Hair Care', catId: 'cat-hair-care', subName: 'Shampoo', subId: 'sub-shampoo' };
  }
  if (name.includes('conditioner') || name.includes('treatment') || name.includes('rinse')) {
    return { catName: 'Hair Care', catId: 'cat-hair-care', subName: 'Conditioner & Treatment', subId: 'sub-conditioner' };
  }
  if (name.includes('hair oil') || name.includes('hair serum') || name.includes('hair essence')) {
    return { catName: 'Hair Care', catId: 'cat-hair-care', subName: 'Hair Oil & Serum', subId: 'sub-hair-oil' };
  }
  if (name.includes('lip') || name.includes('tint') || name.includes('balm')) {
    return { catName: 'Lip Care & Makeup', catId: 'cat-lip-makeup', subName: 'Lip Tint & Balm', subId: 'sub-lip-tint' };
  }
  if (name.includes('cushion') || name.includes('bb cream') || name.includes('foundation') || name.includes('powder')) {
    return { catName: 'Lip Care & Makeup', catId: 'cat-lip-makeup', subName: 'Cushion & Makeup', subId: 'sub-makeup' };
  }
  if (name.includes('combo') || name.includes('set') || name.includes('kit')) {
    return { catName: 'Combos & Sets', catId: 'cat-combos-sets', subName: 'Gift & Travel Sets', subId: 'sub-gift-sets' };
  }
  return { catName: 'Skin Care', catId: 'cat-skin-care', subName: 'Moisturizer & Cream', subId: 'sub-moisturizer' };
}

async function main() {
  console.log('Fetching existing products from D1...');
  const jsonOutput = execSync('npx wrangler d1 execute kothbel-db --remote --command="SELECT id, sku, title, slug FROM products" --json', {
    cwd: path.resolve(__dirname, '../worker'),
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  });

  const parsed = JSON.parse(jsonOutput);
  const existingRows = parsed[0]?.results || [];
  console.log(`Found ${existingRows.length} existing products in D1.`);

  const existingSkus = new Set(existingRows.map(r => r.sku ? r.sku.trim() : '').filter(Boolean));
  const existingTitles = new Set(existingRows.map(r => (r.title || '').trim().toLowerCase()));
  const existingSlugs = new Set(existingRows.map(r => r.slug));

  const kobaRaw = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/koba_products_offline.json'), 'utf8'));
  console.log(`Loaded ${kobaRaw.length} KOBA products.`);

  const missingProducts = [];
  for (const p of kobaRaw) {
    const sku = p.sku ? p.sku.trim() : '';
    const titleLower = (p.name || '').trim().toLowerCase();
    
    // Check if already in D1
    if (sku && existingSkus.has(sku)) continue;
    if (existingTitles.has(titleLower)) continue;

    missingProducts.push(p);
  }

  console.log(`Found ${missingProducts.length} missing products to import!`);

  if (missingProducts.length === 0) {
    console.log('All KOBA products are already in D1 database!');
    return;
  }

  const statements = [];
  for (const p of missingProducts) {
    const brand = (p.name || '').split(' ')[0] || 'Korean Beauty';
    const cat = matchCategory(p);
    
    let baseSlug = slugify(p.name);
    if (!baseSlug) baseSlug = `product-${p.id || Date.now()}`;
    let uniqueSlug = baseSlug;
    let count = 1;
    while (existingSlugs.has(uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${count++}`;
    }
    existingSlugs.add(uniqueSlug);

    const retailPrice = Math.round(Number(p.price || 0));
    const origPrice = Math.round((retailPrice * 1.15) / 10) * 10;
    const stock = Number(p.stock_quantity || 0);
    const status = (stock > 0 && p.status === 'in_stock') ? 'active' : 'out_of_stock';
    const sku = p.sku ? p.sku.trim() : `KOBA-${p.id}`;
    const imagesJson = JSON.stringify(p.image_url ? [p.image_url] : []);
    const tagsJson = JSON.stringify([brand, cat.catName, cat.subName].filter(Boolean));

    const desc = `
<p><strong>${p.name}</strong> হল একটি প্রিমিয়াম ১০০% অথেনটিক কোরিয়ান প্রসাধনী ও স্কিন কেয়ার পণ্য।</p>
<h3>🌟 মূল বৈশিষ্ট্যসমূহ (Key Benefits):</h3>
<ul>
    <li>১০০% অরিজিনাল কোরিয়ান স্কিন কেয়ার প্রোডাক্ট (Made in Korea)</li>
    <li>ত্বকের প্রাকৃতিক জেল্লা বৃদ্ধি ও গভীর আর্দ্রতা বজায় রাখে</li>
    <li>ডার্মাটোলজিক্যালি পরীক্ষিত এবং সংবেদনশীল ত্বকসহ সব ধরনের ত্বকের জন্য উপযোগী</li>
</ul>
<h3>🧴 ব্যবহারের নিয়ম (How to Use):</h3>
<p>মুখ বা ত্বক ভালোভাবে পরিষ্কার করার পর পর্যাপ্ত পরিমাণে নিয়ে আলতোভাবে ম্যাসাজ করুন যতক্ষণ না সম্পূর্ণ শোষিত হয়। সেরা ফলাফলের জন্য প্রতিদিন নিয়মিত ব্যবহার করুন।</p>
    `.trim();

    statements.push(`
INSERT INTO products (
  title, slug, description, sku, category, brand, tags, images,
  base_price, original_price, stock, is_unlimited_stock, is_multi_variant,
  free_delivery, free_delivery_min_qty, free_delivery_min_amount,
  status, is_flash_sale, created_at, updated_at
) VALUES (
  ${escapeSql(p.name)}, ${escapeSql(uniqueSlug)}, ${escapeSql(desc)}, ${escapeSql(sku)},
  ${escapeSql(cat.catName)}, ${escapeSql(brand)}, ${escapeSql(tagsJson)}, ${escapeSql(imagesJson)},
  ${retailPrice}, ${origPrice}, ${stock}, 0, 0,
  0, 0, 0,
  ${escapeSql(status)}, 0, datetime('now'), datetime('now')
);

INSERT OR IGNORE INTO product_categories (product_id, category_id)
SELECT id, '${cat.catId}' FROM products WHERE slug = ${escapeSql(uniqueSlug)};

INSERT OR IGNORE INTO product_categories (product_id, category_id)
SELECT id, '${cat.subId}' FROM products WHERE slug = ${escapeSql(uniqueSlug)};
    `.trim());
  }

  console.log(`Generated SQL for ${statements.length} products.`);

  // Write to temporary SQL files in batches of 50
  const BATCH_SIZE = 50;
  const totalBatches = Math.ceil(statements.length / BATCH_SIZE);
  console.log(`Executing in ${totalBatches} batches...`);

  for (let i = 0; i < totalBatches; i++) {
    const batch = statements.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    const sqlContent = batch.join('\n\n');
    const tempSqlPath = path.resolve(__dirname, `temp_import_batch_${i + 1}.sql`);
    fs.writeFileSync(tempSqlPath, sqlContent, 'utf8');

    console.log(`Executing batch ${i + 1} of ${totalBatches} (${batch.length} products)...`);
    execSync(`npx wrangler d1 execute kothbel-db --remote --file="${tempSqlPath}"`, {
      cwd: path.resolve(__dirname, '../worker'),
      stdio: 'inherit'
    });

    // Cleanup
    try { fs.unlinkSync(tempSqlPath); } catch (e) {}
    console.log(`Batch ${i + 1} completed successfully.`);
  }

  console.log('✅ All missing KOBA products successfully imported into D1 database!');
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
