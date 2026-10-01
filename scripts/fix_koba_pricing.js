const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const kobaPath = path.join(__dirname, '../data/koba_products_offline.json');
if (!fs.existsSync(kobaPath)) {
  console.error('koba_products_offline.json not found!');
  process.exit(1);
}

const kobaProducts = JSON.parse(fs.readFileSync(kobaPath, 'utf8'));
console.log(`Loaded ${kobaProducts.length} KOBA products from JSON.`);

function escapeSql(str) {
  if (str === null || str === undefined) return "''";
  return `'${String(str).replace(/'/g, "''")}'`;
}

// Generate update statements
const updateStatements = [];

kobaProducts.forEach((p) => {
  if (!p.sku || !p.price) return;

  const sku = p.sku.trim();
  const basePrice = Math.round(Number(p.price));
  // 15% strikethrough discount for appealing customer presentation
  const originalPrice = Math.round((basePrice * 1.15) / 10) * 10;
  const stock = typeof p.stock_quantity === 'number' ? p.stock_quantity : 10;
  const status = (p.status === 'out_of_stock' || stock <= 0) ? 'out_of_stock' : 'active';

  updateStatements.push(`UPDATE products SET base_price = ${basePrice}, original_price = ${originalPrice}, stock = ${stock}, status = ${escapeSql(status)} WHERE sku = ${escapeSql(sku)};`);
});

console.log(`Generated ${updateStatements.length} update statements.`);

// Split into batches of 150
const batchSize = 150;
const batches = [];
for (let i = 0; i < updateStatements.length; i += batchSize) {
  batches.push(updateStatements.slice(i, i + batchSize));
}

console.log(`Split into ${batches.length} batches.`);

// Process each batch
batches.forEach((batch, idx) => {
  const batchFile = path.join(__dirname, `../data/temp_price_update_${idx + 1}.sql`);
  fs.writeFileSync(batchFile, batch.join('\n'), 'utf8');
  console.log(`Executing batch ${idx + 1} of ${batches.length} (${batch.length} statements)...`);

  try {
    const output = execSync(`npx wrangler d1 execute kothbel-db --remote --file="${batchFile}"`, {
      cwd: path.join(__dirname, '../worker'),
      encoding: 'utf8'
    });
    console.log(`Batch ${idx + 1} completed successfully.`);
  } catch (err) {
    console.error(`Error executing batch ${idx + 1}:`, err.message);
  } finally {
    if (fs.existsSync(batchFile)) {
      fs.unlinkSync(batchFile);
    }
  }
});

console.log('All prices updated to KOBA official pricing successfully!');
