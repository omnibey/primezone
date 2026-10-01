const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CATEGORY_IMAGES = {
    // 5 Main Categories
    'cat-skin-care': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'cat-hair-care': 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'cat-body-bath': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'cat-lip-makeup': 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'cat-combos-sets': 'https://images.unsplash.com/photo-1512290900672-1f4a9b51ca5f?w=300&h=300&fit=crop&crop=center&auto=format&q=80',

    // 15 Subcategories
    'sub-cleanser': 'https://images.unsplash.com/photo-1556228722-d0b5b1442111?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'sub-toner': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'sub-serum': 'https://images.unsplash.com/photo-1608248597359-00628e833446?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'sub-moisturizer': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'sub-sunscreen': 'https://images.unsplash.com/photo-1567928815117-640a32039294?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'sub-mask': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'sub-shampoo': 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'sub-conditioner': 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'sub-hair-oil': 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'sub-body-lotion': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'sub-body-wash': 'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'sub-lip-tint': 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'sub-makeup': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'sub-skincare-combos': 'https://images.unsplash.com/photo-1512290900672-1f4a9b51ca5f?w=300&h=300&fit=crop&crop=center&auto=format&q=80',
    'sub-gift-sets': 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=300&h=300&fit=crop&crop=center&auto=format&q=80'
};

function main() {
    const statements = [];
    for (const [id, url] of Object.entries(CATEGORY_IMAGES)) {
        statements.push(`UPDATE categories SET image_url = '${url.replace(/'/g, "''")}' WHERE id = '${id}'`);
    }

    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const sqlPath = path.join(dataDir, 'update_category_images.sql');
    fs.writeFileSync(sqlPath, statements.join(';\n') + ';\n', 'utf8');
    console.log(`Generated ${statements.length} category image update statements.`);

    console.log('Executing on remote D1 database...');
    execSync('npx wrangler d1 execute kothbel-db --remote --file=./data/update_category_images.sql -y', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
    });
    console.log('✅ Remote D1 category images updated successfully!');
}

main();
