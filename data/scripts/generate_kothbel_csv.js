const fs = require('fs');

const jsonPath = 'c:\\Bayazid\\kothbel\\data\\koba_products_offline.json';
const outCsvPath = 'c:\\Bayazid\\kothbel\\data\\kothbel_products_import.csv';

const productsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const headers = [
    'title', 'slug', 'description', 'sku', 'category', 'brand', 'tags', 
    'images', 'base_price', 'original_price', 'stock', 'is_unlimited_stock', 
    'is_multi_variant', 'free_delivery', 'free_delivery_min_qty', 
    'free_delivery_min_amount', 'status', 'is_flash_sale'
];

function generateSlug(text) {
    if (!text) return '';
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function escapeCsv(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

const csvRows = [];
csvRows.push(headers.join(','));

const usedSlugs = new Set();
let idCounter = 1;

for (const p of productsData) {
    const title = p.name || 'Unknown Product';
    
    let baseSlug = generateSlug(title);
    if (!baseSlug) baseSlug = 'product';
    let slug = baseSlug + (p.sku ? '-' + p.sku.toLowerCase() : '');
    
    if (usedSlugs.has(slug)) {
        slug = slug + '-' + idCounter;
    }
    usedSlugs.add(slug);
    idCounter++;
    
    const desc = p.description || '';
    const sku = p.sku || '';
    const category = p.category_name || '';
    const brand = p.brand_name || '';
    const tags = '[]';
    const images = p.image_url ? JSON.stringify([p.image_url]) : '[]';
    const basePrice = p.price || 0;
    const originalPrice = ''; // blank for NULL in CSV
    const stock = p.stock_quantity || 0;
    const status = (p.status === 'in_stock' || p.active) ? 'active' : 'draft';
    
    const rowData = {
        title: title,
        slug: slug,
        description: desc,
        sku: sku,
        category: category,
        brand: brand,
        tags: tags,
        images: images,
        base_price: basePrice,
        original_price: originalPrice,
        stock: stock,
        is_unlimited_stock: 0,
        is_multi_variant: 0,
        free_delivery: 0,
        free_delivery_min_qty: 0,
        free_delivery_min_amount: 0,
        status: status,
        is_flash_sale: 0
    };
    
    const row = headers.map(h => escapeCsv(rowData[h]));
    csvRows.push(row.join(','));
}

fs.writeFileSync(outCsvPath, csvRows.join('\n'), 'utf-8');
console.log(`Successfully generated Kothbel compatible CSV at: ${outCsvPath}`);
