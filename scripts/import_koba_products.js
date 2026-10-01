/**
 * KOBA to Kothbel D1 Product Importer
 * Usage:
 *   node scripts/import_koba_products.js --all
 */

const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../data/koba_catalog_enriched.json');
if (!fs.existsSync(catalogPath)) {
  console.error('Enriched catalog not found!');
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Existing categories in D1 mapped by slug
const categoryMap = {
  'body-lotion': 'e6364e13-0383-46f2-ba0d-8eacece716f3',
  'body-wash': 'df94633e-21e5-4600-993a-1f4b674a3eed',
  'cleansing-oil': '73dabb60-27d0-41e8-b8e7-d7405415ad71',
  'combo': 'b7b0a08f-65ee-431f-b97b-bd9aa10205f5',
  'cream': '38494629-5f45-4805-ba69-c6d6faef9e55',
  'eye-cream': 'ad5f11ad-d94e-4da7-a341-6a972fb90cf7',
  'face-wash': '3de2852b-5a99-4095-a32a-4dab661396eb',
  'gloe-mask': '63b84d17-ff1a-477a-a814-58cf0b6d593c',
  'hair-conditioner': 'b730372a-e867-4ad0-bcb6-e5834794768e',
  'lip-tint': '335e3541-0fcb-444c-a83f-a7c8b5472945',
  'parfum': '6179f9c6-6c18-4614-b575-28bcd9f79674',
  'serum': 'ee8e895b-c38a-4ca4-abb6-ec473ff40c40',
  'shampoo': '3f16a864-01fd-4ee7-8882-f2d08bd494a9',
  'skin-care-combo': '7c28f282-2920-4ac1-b537-7655e375339b',
  'sun-cream': '9f2693c5-e8ea-4bcf-b2bb-fe5d25d4b266',
  'toner': '44e0e288-3a97-4b05-a236-5d1a47d98bd2'
};

function matchCategory(p) {
  const name = (p.name + ' ' + (p.sub_category || '')).toLowerCase();
  if (name.includes('sun cream') || name.includes('sun serum') || name.includes('sunblock') || name.includes('sunscreen') || name.includes('sun stick')) return 'sun-cream';
  if (name.includes('serum') || name.includes('ampoule')) return 'serum';
  if (name.includes('toner') || name.includes('pad')) return 'toner';
  if (name.includes('cleanser') || name.includes('foam') || name.includes('face wash')) return 'face-wash';
  if (name.includes('cleansing oil') || name.includes('cleansing balm')) return 'cleansing-oil';
  if (name.includes('eye cream')) return 'eye-cream';
  if (name.includes('cream') || name.includes('moisturizer') || name.includes('gel')) return 'cream';
  if (name.includes('body lotion')) return 'body-lotion';
  if (name.includes('body wash') || name.includes('shower gel')) return 'body-wash';
  if (name.includes('shampoo')) return 'shampoo';
  if (name.includes('conditioner') || name.includes('treatment') || name.includes('rinse')) return 'hair-conditioner';
  if (name.includes('mask')) return 'gloe-mask';
  if (name.includes('lip') || name.includes('tint')) return 'lip-tint';
  if (name.includes('perfume') || name.includes('parfum')) return 'parfum';
  if (name.includes('combo') || name.includes('set') || name.includes('kit')) return 'combo';
  return 'cream';
}

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeSql(str) {
  if (str === null || str === undefined) return "''";
  return `'${String(str).replace(/'/g, "''")}'`;
}

// In-stock products only
const inStockProducts = catalog.filter(p => p.status === 'in_stock' && p.stock > 0);
console.log(`Loaded In-Stock Products: ${inStockProducts.length}`);

const sqlStatements = [];
const seenSlugs = new Set();

inStockProducts.forEach((p) => {
  let baseSlug = slugify(p.name);
  let finalSlug = baseSlug;
  let counter = 1;
  while (seenSlugs.has(finalSlug)) {
    finalSlug = `${baseSlug}-${counter++}`;
  }
  seenSlugs.add(finalSlug);

  const wholesale = p.wholesale_price || 0;
  const sellingPrice = p.suggested_price || Math.round((wholesale * 1.25) / 10) * 10;
  const origPrice = p.original_price || Math.round((wholesale * 1.45) / 10) * 10;
  const stock = p.stock || 10;
  const images = p.image_url ? JSON.stringify([p.image_url]) : '[]';
  const tags = JSON.stringify([p.brand, p.category, p.sub_category].filter(Boolean));

  const matchedCatSlug = matchCategory(p);
  const catName = matchedCatSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const descHtml = `
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

  const insertSql = `
INSERT OR IGNORE INTO products (
  title, slug, description, sku, category, brand, tags, images,
  base_price, original_price, stock, is_unlimited_stock, is_multi_variant,
  free_delivery, free_delivery_min_qty, free_delivery_min_amount, is_flash_sale, status
) VALUES (
  ${escapeSql(p.name)},
  ${escapeSql(finalSlug)},
  ${escapeSql(descHtml)},
  ${escapeSql(p.sku)},
  ${escapeSql(catName)},
  ${escapeSql(p.brand)},
  ${escapeSql(tags)},
  ${escapeSql(images)},
  ${sellingPrice},
  ${origPrice},
  ${stock},
  0,
  0,
  0,
  0,
  0,
  0,
  'active'
);
  `.trim();

  sqlStatements.push(insertSql);
});

// Generate chunked SQL files (each ~150 statements) for fast D1 batching
const CHUNK_SIZE = 150;
const chunks = [];
for (let i = 0; i < sqlStatements.length; i += CHUNK_SIZE) {
  chunks.push(sqlStatements.slice(i, i + CHUNK_SIZE));
}

console.log(`Generated ${sqlStatements.length} product insert statements in ${chunks.length} batches.`);

chunks.forEach((chunk, index) => {
  const fileName = path.join(__dirname, `../data/koba_import_part${index + 1}.sql`);
  fs.writeFileSync(fileName, chunk.join('\n\n'), 'utf8');
});

// Combined file as well
const combinedPath = path.join(__dirname, '../data/koba_import.sql');
fs.writeFileSync(combinedPath, sqlStatements.join('\n\n'), 'utf8');

console.log(`Saved batch files to data/koba_import_part1.sql through part${chunks.length}.sql`);
