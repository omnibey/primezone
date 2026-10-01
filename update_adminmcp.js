const fs = require('fs');
let c = fs.readFileSync('worker/src/routes/adminMcp.ts', 'utf8');
c = c.replace(/is_multi_variant/g, 'is_variant_bulk_mode');
fs.writeFileSync('worker/src/routes/adminMcp.ts', c);
console.log('Successfully updated adminMcp.ts');
