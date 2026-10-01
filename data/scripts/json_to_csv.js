const fs = require('fs');
const path = require('path');

const inputPath = 'c:\\Bayazid\\kothbel\\data\\koba_products_offline.json';
const outputPath = 'c:\\Bayazid\\kothbel\\data\\koba_products_offline.csv';

console.log('Reading JSON...');
const rawData = fs.readFileSync(inputPath, 'utf-8');
const products = JSON.parse(rawData);

if (!Array.isArray(products) || products.length === 0) {
    console.error('No products found or invalid format.');
    process.exit(1);
}

const headers = [
    'id', 'name', 'sku', 'price', 'commission_percentage', 'commission', 
    'stock_quantity', 'status', 'featured', 'free_shipping', 'active', 
    'image_url', 'description', 'created_at_formatted', 'updated_at_formatted'
];

function escapeCsv(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // If it contains comma, double quote, or newlines, we must quote the whole string
    // and escape internal double quotes with two double quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

const csvRows = [];
// Add header row
csvRows.push(headers.join(','));

// Add data rows
for (const p of products) {
    const row = headers.map(h => escapeCsv(p[h]));
    csvRows.push(row.join(','));
}

console.log(`Writing ${products.length} products to CSV...`);
fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf-8');
console.log('Done! Saved to ' + outputPath);
