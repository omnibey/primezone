const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync('data/koba_products_offline.json', 'utf8'));

const brandList = [
  'SKIN1004', 'Beauty of Joseon', 'COSRX', 'Anua', 'Round Lab', 'AXIS-Y', 'Torriden', 
  'Some By Mi', 'Haruharu Wonder', 'The Face Shop', 'Laneige', 'Medi-Peel', 'Aplb', 
  'Dabo', 'Kerasys', 'Nature Skin', 'Tocobo', 'iUNIK', 'Dr. Ceuracle', 'Dr.Althea', 
  'TIAM', 'Isntree', 'Purito', 'Missha', 'Tonymoly', 'Holika Holika', 'Raip', 'Medicube', 
  'Green Finger', 'Forest Phyton', 'Beaute Melasma -X', 'Melasma-X', 'Farmstay', 'Innisfree',
  'JMsolution', 'Etude House', 'Peripera', 'Rom&nd', 'Clio', '3CE', 'Heimish', 'Pyunkang Yul',
  'Dr.Jart+', 'Neogen', 'Banila Co', 'Sulwhasoo', 'The Ordinary', 'Cerave', 'Bioderma'
].sort((a, b) => b.length - a.length);

const parsedProducts = raw.map(p => {
  const name = p.name.trim();
  const lower = name.toLowerCase();

  // 1. Detect Brand
  let brand = 'Other';
  for (const b of brandList) {
    if (lower.startsWith(b.toLowerCase()) || lower.includes(b.toLowerCase())) {
      brand = b;
      break;
    }
  }
  if (brand === 'Other') {
    brand = name.split(' ')[0];
  }

  // 2. Detect Category & Sub-Category
  let category = 'Skin Care';
  let subCategory = 'General';

  if (lower.includes('shampoo') || lower.includes('hair') || lower.includes('rinse') || lower.includes('conditioner') || lower.includes('treatment') || lower.includes('scalp') || lower.includes('argan oil')) {
    category = 'Hair Care';
    if (lower.includes('shampoo')) subCategory = 'Shampoo';
    else if (lower.includes('rinse') || lower.includes('conditioner')) subCategory = 'Conditioner';
    else if (lower.includes('oil') || lower.includes('serum')) subCategory = 'Hair Oil & Serum';
    else subCategory = 'Hair Treatment';
  } else if (lower.includes('cleanser') || lower.includes('foam') || lower.includes('wash') || lower.includes('cleansing') || lower.includes('soap')) {
    category = 'Skin Care';
    subCategory = 'Cleanser & Face Wash';
  } else if (lower.includes('toner') || lower.includes('mist') || lower.includes('pad')) {
    category = 'Skin Care';
    subCategory = 'Toner & Pads';
  } else if (lower.includes('serum') || lower.includes('ampoule') || lower.includes('essence') || lower.includes('booster')) {
    category = 'Skin Care';
    subCategory = 'Serum & Ampoule';
  } else if (lower.includes('cream') || lower.includes('gel') || lower.includes('lotion') || lower.includes('moisture') || lower.includes('soothing')) {
    category = 'Skin Care';
    subCategory = 'Moisturizer & Cream';
  } else if (lower.includes('sun') || lower.includes('spf') || lower.includes('shield') || lower.includes('block')) {
    category = 'Skin Care';
    subCategory = 'Sunscreen (SPF)';
  } else if (lower.includes('eye cream') || lower.includes('eye patch') || lower.includes('eye serum')) {
    category = 'Skin Care';
    subCategory = 'Eye Care';
  } else if (lower.includes('lip') || lower.includes('tint') || lower.includes('balm')) {
    category = 'Lip Care';
    subCategory = 'Lip Care & Tint';
  } else if (lower.includes('mask') || lower.includes('pack')) {
    category = 'Skin Care';
    subCategory = 'Mask & Sheet Mask';
  } else if (lower.includes('body') || lower.includes('shower') || lower.includes('underarm') || lower.includes('hand cream')) {
    category = 'Body Care';
    subCategory = 'Body Care';
  }

  // Calculate pricing suggestion: Wholesale + 25% rounded to nearest 10, Strike price + 45%
  const wholesalePrice = p.price || 0;
  const suggestedSellingPrice = Math.round((wholesalePrice * 1.25) / 10) * 10;
  const suggestedOriginalPrice = Math.round((wholesalePrice * 1.45) / 10) * 10;

  return {
    id: p.id,
    name: p.name,
    sku: p.sku || '',
    brand: brand,
    category: category,
    sub_category: subCategory,
    wholesale_price: wholesalePrice,
    suggested_price: suggestedSellingPrice,
    original_price: suggestedOriginalPrice,
    stock: p.stock_quantity || 0,
    status: p.status,
    image_url: p.image_url || ''
  };
});

fs.mkdirSync('public/admin/data', { recursive: true });
fs.writeFileSync('public/admin/data/koba_catalog.json', JSON.stringify(parsedProducts, null, 2), 'utf8');
fs.writeFileSync('data/koba_catalog_enriched.json', JSON.stringify(parsedProducts, null, 2), 'utf8');

// Generate enriched CSV
const headers = ['SKU', 'Brand', 'Category', 'Sub Category', 'Product Name', 'Wholesale Price', 'Suggested Selling Price', 'Original Price', 'Stock Quantity', 'Status', 'Image URL'];
const csvRows = [headers.join(',')];

parsedProducts.forEach(p => {
  const row = [
    `"${(p.sku || '').replace(/"/g, '""')}"`,
    `"${(p.brand || '').replace(/"/g, '""')}"`,
    `"${(p.category || '').replace(/"/g, '""')}"`,
    `"${(p.sub_category || '').replace(/"/g, '""')}"`,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    p.wholesale_price,
    p.suggested_price,
    p.original_price,
    p.stock,
    `"${(p.status || '').replace(/"/g, '""')}"`,
    `"${(p.image_url || '').replace(/"/g, '""')}"`
  ];
  csvRows.push(row.join(','));
});

fs.writeFileSync('data/koba_products_enriched.csv', csvRows.join('\n'), 'utf8');
console.log('Successfully generated enriched catalog files!');
console.log('Total Products:', parsedProducts.length);
