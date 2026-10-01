const fs = require('fs');
let c = fs.readFileSync('src/app/product/[slug]/ProductClient.js', 'utf8');

c = c.replace(/bulkState/g, 'variantBulkState')
     .replace(/setBulkState/g, 'setVariantBulkState')
     .replace(/mode === 'bulk'/g, "mode === 'variant_bulk_mode'")
     .replace(/mode !== 'bulk'/g, "mode !== 'variant_bulk_mode'")
     .replace(/mode === 'separated'/g, "mode === 'variant'")
     .replace(/mode === 'basic'/g, "mode === 'non_variant'")
     .replace(/is_multi_variant/g, 'is_variant_bulk_mode')
     .replace(/mode: 'bulk'/g, "mode: 'variant_bulk_mode'")
     .replace(/mode: 'separated'/g, "mode: 'variant'")
     .replace(/mode: 'basic'/g, "mode: 'non_variant'");

fs.writeFileSync('src/app/product/[slug]/ProductClient.js', c);
console.log('Successfully updated ProductClient.js');
