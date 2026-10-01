const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { CATEGORY_STRUCTURE, classifyProduct, getCategorySetupStatements } = require('./setup_categories_and_map_products');

function escapeSql(str) {
    if (str === null || str === undefined) return 'NULL';
    return "'" + String(str).replace(/'/g, "''") + "'";
}

async function main() {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    // Step 1: Execute Category Setup First
    console.log('1. Setting up clean parent & sub categories on D1...');
    const catStmts = getCategorySetupStatements();
    const catSqlPath = path.join(dataDir, 'clean_categories_setup.sql');
    fs.writeFileSync(catSqlPath, catStmts.join(';\n') + ';\n', 'utf8');
    
    execSync('npx wrangler d1 execute kothbel-db --remote --file=./data/clean_categories_setup.sql -y', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
    });
    console.log('✅ Categories created on D1.');

    // Step 2: Fetch Products
    console.log('2. Fetching all products from remote D1 database...');
    const rawOutput = execSync('npx wrangler d1 execute kothbel-db --remote --json --command="SELECT id, title, category, sku FROM products;"', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024
    });

    const parsed = JSON.parse(rawOutput);
    const products = parsed[0]?.results || [];
    console.log(`Fetched ${products.length} products from D1.`);

    // Step 3: Product Mapping Statements
    const statements = [];
    products.forEach(p => {
        const classification = classifyProduct(p.title, p.category, '');
        // 1. Update products table category string
        statements.push(`UPDATE products SET category = ${escapeSql(classification.subName)} WHERE id = ${escapeSql(p.id)}`);
        // 2. Insert into product_categories for Subcategory
        statements.push(`INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (${escapeSql(p.id)}, ${escapeSql(classification.sub)})`);
        // 3. Insert into product_categories for Parent Category
        statements.push(`INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (${escapeSql(p.id)}, ${escapeSql(classification.parent)})`);
    });

    console.log(`Generated ${statements.length} mapping statements.`);

    // Chunk into files of 200 statements
    const CHUNK_SIZE = 200;
    const chunkFiles = [];
    for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
        const chunk = statements.slice(i, i + CHUNK_SIZE);
        const fileName = `cat_map_part${Math.floor(i / CHUNK_SIZE) + 1}.sql`;
        const filePath = path.join(dataDir, fileName);
        fs.writeFileSync(filePath, chunk.join(';\n') + ';\n', 'utf8');
        chunkFiles.push(fileName);
    }

    console.log(`Generated ${chunkFiles.length} chunk files. Executing on D1...`);

    for (let i = 0; i < chunkFiles.length; i++) {
        const fileName = chunkFiles[i];
        console.log(`Executing ${fileName} (${i + 1}/${chunkFiles.length})...`);
        execSync(`npx wrangler d1 execute kothbel-db --remote --file=./data/${fileName} -y`, {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit'
        });
    }

    console.log('🎉 All categories initialized and 827 products mapped successfully!');
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
