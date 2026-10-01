const fs = require('fs');

const catPath = 'c:\\Bayazid\\kothbel\\data\\koba_categories.json';
const jsonPath = 'c:\\Bayazid\\kothbel\\data\\koba_products_offline.json';
const csvPath = 'c:\\Bayazid\\kothbel\\data\\koba_products_offline.csv';

const categories = JSON.parse(fs.readFileSync(catPath, 'utf-8'));
const products = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

let mappingRules = [];

// Synonyms to make matching smarter
const synonyms = {
    'sunscreen': ['sunscreen', 'sun cream', 'sun block', 'sun lotion'],
    'cleanser': ['cleanser', 'cleansing', 'foam', 'face wash'],
    'moisturizer': ['moisturizer', 'moisture cream'],
    'serum': ['serum', 'ampoule', 'ampule'],
    'body wash': ['body wash', 'shower gel', 'shower cream'],
    'shampoo': ['shampoo'],
    'conditioner': ['conditioner', 'rinse'],
    'lip balm': ['lip balm', 'lip care'],
    'mask': ['mask', 'sheet mask', 'pack'],
};

// Build rules from categories
for (const cat of categories) {
    if (cat.children.length === 0) {
        mappingRules.push({
            keywords: [cat.name.toLowerCase()],
            category_id: cat.id,
            category_name: cat.name,
            sub_category_id: null,
            sub_category_name: null
        });
    }
    for (const sub of cat.children) {
        let keys = [sub.name.toLowerCase()];
        if (synonyms[sub.name.toLowerCase()]) {
            keys = keys.concat(synonyms[sub.name.toLowerCase()]);
        }
        
        mappingRules.push({
            keywords: keys,
            category_id: cat.id,
            category_name: cat.name,
            sub_category_id: sub.id,
            sub_category_name: sub.name
        });
    }
}

// Map products
let matchedCount = 0;
for (const p of products) {
    const pName = p.name.toLowerCase();
    
    let matchedRule = null;
    let longestMatch = -1;
    
    for (const rule of mappingRules) {
        for (const kw of rule.keywords) {
            // Use word boundary if possible, or just indexof
            // To prevent "foil" matching "oil"
            const regex = new RegExp(`\\b${kw}\\b`, 'i');
            if (regex.test(pName)) {
                if (kw.length > longestMatch) {
                    longestMatch = kw.length;
                    matchedRule = rule;
                }
            }
        }
    }
    
    // Fallback if no exact word boundary match, just do includes (for words stuck together)
    if (!matchedRule) {
        for (const rule of mappingRules) {
            for (const kw of rule.keywords) {
                if (pName.includes(kw)) {
                    if (kw.length > longestMatch) {
                        longestMatch = kw.length;
                        matchedRule = rule;
                    }
                }
            }
        }
    }
    
    if (matchedRule) {
        p.category_id = matchedRule.category_id;
        p.category_name = matchedRule.category_name;
        p.sub_category_id = matchedRule.sub_category_id;
        p.sub_category_name = matchedRule.sub_category_name;
        matchedCount++;
    } else {
        p.category_id = null;
        p.category_name = "UnCategorized";
        p.sub_category_id = null;
        p.sub_category_name = null;
    }
}

console.log(`Matched ${matchedCount} out of ${products.length} products to a category.`);

// Save JSON
fs.writeFileSync(jsonPath, JSON.stringify(products, null, 2), 'utf-8');
console.log('Updated JSON file.');

// Convert to CSV
const headers = [
    'id', 'name', 'sku', 'category_name', 'sub_category_name', 'price', 
    'commission_percentage', 'commission', 'stock_quantity', 'status', 
    'featured', 'free_shipping', 'active', 'image_url', 'description', 
    'created_at_formatted', 'updated_at_formatted'
];

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

for (const p of products) {
    const row = headers.map(h => escapeCsv(p[h]));
    csvRows.push(row.join(','));
}

fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf-8');
console.log('Updated CSV file.');
