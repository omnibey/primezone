const fs = require('fs');

// 1. Read storefront.css
const storefront = fs.readFileSync('c:/Bayazid/kothbel/src/app/(storefront)/storefront.css', 'utf8');
const sfLines = storefront.split('\n');

// 2. Extract EXACT CSS Variables manually
const rootBlock = `
:root {
  --primary-color: #ff6b35;
  --secondary-color: #2e3440;
  --text-color: #2e3440;
  --text-light: #6b7280;
  --bg-color: #ffffff;
  --bg-light: #f9fafb;
  --border-color: #e5e7eb;
  --success-color: #10b981;
  --error-color: #ef4444;
  --radius: 8px;
  --radius-sm: 4px;
  --radius-lg: 12px;
  --transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out, background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out;
}
`;

// 3. Extract Global Inputs
const inputBlockStr = `
.checkout-page-container input,
.checkout-page-container textarea,
.checkout-page-container select {
  font-family: inherit;
  font-size: inherit;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius-sm, 4px);
  padding: 0.75rem;
  width: 100%;
  transition: all 0.2s;
  background: white;
  color: #1f2937;
}

.checkout-page-container textarea {
  resize: vertical;
  min-height: 80px;
}

.checkout-page-container input:focus,
.checkout-page-container textarea:focus,
.checkout-page-container select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 12%, transparent);
}

/* Base resets */
.checkout-page-container button {
  font-family: inherit;
}
`;

// 4. Extract Checkout CSS (lines 3137 to 4200)
const startIdx = sfLines.findIndex(l => l.includes('/* Checkout Drawer */') || l.includes('/* Checkout Page Mode Styles */') || l.includes('.checkout-drawer {'));
const endIdx = sfLines.findIndex((l, i) => i > startIdx && l.includes('.review-modal-overlay'));
const checkoutBlock = sfLines.slice(startIdx, endIdx).join('\n');

// 5. Clean landing.css
let landingCss = fs.readFileSync('c:/Bayazid/kothbel/src/app/(landing)/landing.css', 'utf8');
const separator = '/* Extracted Checkout Styles for OrderForm */';
if (landingCss.includes(separator)) {
  landingCss = landingCss.split(separator)[0];
}

// 6. Combine and save
const finalCss = landingCss.trim() + '\n\n' + separator + '\n' + rootBlock + '\n' + inputBlockStr + '\n' + checkoutBlock;
fs.writeFileSync('c:/Bayazid/kothbel/src/app/(landing)/landing.css', finalCss);
console.log('Successfully wrote the exact checkout CSS block.');
