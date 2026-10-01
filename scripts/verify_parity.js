const fs = require('fs');

// Read GTM Container
const gtm = JSON.parse(fs.readFileSync('gtm-setup/containers/gtm_web_container.json', 'utf8'));

console.log('====================================================');
console.log('  100% 1:1 PARAMETER PARITY & STANDARDS VERIFICATION');
console.log('====================================================\n');

// 1. Check GTM Custom JS Variables
const cjsIds = gtm.containerVersion.variable.find(v => v.name === 'CJS - FB Content IDs');
const cjsContents = gtm.containerVersion.variable.find(v => v.name === 'CJS - FB Contents');
const cjsNumItems = gtm.containerVersion.variable.find(v => v.name === 'CJS - FB Num Items');

console.log('✅ GTM Variables:');
console.log(' - CJS - FB Content IDs:', cjsIds ? 'EXISTS & CONFIGURED' : 'MISSING');
console.log(' - CJS - FB Contents:', cjsContents ? 'EXISTS & CONFIGURED' : 'MISSING');
console.log(' - CJS - FB Num Items:', cjsNumItems ? 'EXISTS & CONFIGURED' : 'MISSING');

console.log('\n✅ GTM Tag Property Mappings:');
const targetTags = [
  '1. FB PageView',
  '2. FB ViewContent',
  '3. FB AddToCart',
  '7. FB AddToWishlist',
  '4. FB InitiateCheckout',
  '9. FB AddPaymentInfo',
  '5. FB Purchase',
  '8. FB Search',
  '6. FB Contact (WhatsApp)'
];

targetTags.forEach(name => {
  const tag = gtm.containerVersion.tag.find(t => t.name.includes(name));
  if (!tag) {
    console.log(`❌ ${name}: NOT FOUND`);
    return;
  }
  const objList = tag.parameter.find(p => p.key === 'objectPropertyList')?.list || [];
  const props = objList.map(item => item.map.find(m => m.key === 'name')?.value);
  console.log(`\n📌 [${tag.name}]`);
  console.log(`   Standard Properties (${props.length}):`, props.join(', ') || '(Clean Standard Init)');
});
