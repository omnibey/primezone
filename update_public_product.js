const fs = require('fs');
let c = fs.readFileSync('public/src/product.js', 'utf8');
c = c.replace(/isBulkMode/g, 'isVariantBulkMode');
c = c.replace(/is_multi_variant/g, 'is_variant_bulk_mode');
fs.writeFileSync('public/src/product.js', c);
console.log('Successfully updated public/src/product.js');
