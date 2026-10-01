const fs = require('fs');
const crypto = require('crypto');

function migrate() {
    const productsDump = JSON.parse(fs.readFileSync('products_dump.json', 'utf16le').replace(/^\uFEFF/, ''));
    const categoriesDump = JSON.parse(fs.readFileSync('categories_dump.json', 'utf16le').replace(/^\uFEFF/, ''));

    const products = productsDump[0].results;
    const categories = categoriesDump[0].results;

    // Create a map of slug to category_id
    const catMap = {};
    categories.forEach(c => {
        catMap[c.slug.toLowerCase()] = c.id;
    });

    let sql = 'DELETE FROM product_categories;\n';

    let newCatsCount = 0;
    let mappingCount = 0;

    // 1. Find missing categories and create them
    products.forEach(p => {
        if (!p.category) return;
        const slugs = p.category.split(',').map(s => s.trim()).filter(Boolean);
        
        slugs.forEach(slug => {
            const lowerSlug = slug.toLowerCase();
            if (!catMap[lowerSlug]) {
                const newId = crypto.randomUUID();
                catMap[lowerSlug] = newId;
                const name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                sql += `INSERT INTO categories (id, name, slug, is_active, show_on_homepage) VALUES ('${newId}', '${name}', '${lowerSlug}', 1, 0);\n`;
                newCatsCount++;
            }
        });
    });

    // 2. Map products to categories
    products.forEach(p => {
        if (!p.category) return;
        const slugs = p.category.split(',').map(s => s.trim()).filter(Boolean);
        
        slugs.forEach(slug => {
            const catId = catMap[slug.toLowerCase()];
            sql += `INSERT INTO product_categories (product_id, category_id) VALUES (${p.id}, '${catId}');\n`;
            mappingCount++;
        });
    });

    fs.writeFileSync('categories_data_migration.sql', sql);
    console.log(`Generated SQL: ${newCatsCount} new categories, ${mappingCount} product mappings.`);
}

migrate();
