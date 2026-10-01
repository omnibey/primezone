const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const koba = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/koba_products_offline.json'), 'utf8'));

const statusOutput = execSync('npx wrangler d1 execute kothbel-db --remote --command="SELECT status, count(id) as count FROM products GROUP BY status" --json', {
  cwd: path.resolve(__dirname, '../worker'),
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024
});

console.log('Status breakdown in D1:');
console.log(JSON.stringify(JSON.parse(statusOutput)[0].results, null, 2));

const countOutput = execSync('npx wrangler d1 execute kothbel-db --remote --command="SELECT count(id) as total FROM products" --json', {
  cwd: path.resolve(__dirname, '../worker'),
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024
});

const total = JSON.parse(countOutput)[0].results[0].total;
console.log(`\n========================================`);
console.log(`Total Products in D1 Database: ${total}`);
console.log(`Total Products in KOBA JSON:   ${koba.length}`);
console.log(`Match Status:                  ${total === koba.length ? '✅ EXACT 100% MATCH!' : '❌ MISMATCH'}`);
console.log(`========================================`);
