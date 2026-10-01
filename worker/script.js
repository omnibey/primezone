const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Bayazid', 'kothbel', 'src', 'app', '(admin)', 'admin', '(authenticated)', 'landing-pages', '[id]', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Component name
content = content.replace(/export default function ProductEditorPage/g, 'export default function LandingProductEditorPage');

// 2. API Routes
content = content.replace(/\/products\/\$\{id\}/g, '`/landing/${id}`');
content = content.replace(/adminFetch\('\/products'/g, "adminFetch('/landing'");
content = content.replace(/triggerRevalidate\('products'\)/g, "triggerRevalidate('landing')");

// 3. Navigation Links
content = content.replace(/\/admin\/products/g, '/admin/landing-pages');

// 4. Titles
content = content.replace(/\{isNew \? 'Add Product' : 'Edit Product'\}/g, "{isNew ? 'Add Landing Product' : 'Edit Landing Product'}");
content = content.replace(/'Product saved'/g, "'Landing page saved'");
content = content.replace(/'Product created'/g, "'Landing page created'");
content = content.replace(/'Failed to save product'/g, "'Failed to save landing page'");
content = content.replace(/'Failed to create product'/g, "'Failed to create landing page'");

// 5. Add "Design" button to header
const headerButtonsTarget = `<button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>`;
const designButton = `{!isNew && (
              <button type="button" onClick={() => router.push(\`/admin/landing-pages/\${id}/builder\`)} className="admin-btn admin-btn-success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Layout size={16} /> Design Landing Page
              </button>
            )}
            `;
content = content.replace(headerButtonsTarget, designButton + headerButtonsTarget);

// 6. Form Initial State (Remove SKU, Description, Tags, Flash Sale, Free Delivery)
content = content.replace(/sku: '', description: '', /g, '');
content = content.replace(/tags: \[\], /g, '');
content = content.replace(/free_delivery: 0, free_delivery_min_qty: 0, free_delivery_min_amount: 0,/g, '');
content = content.replace(/is_flash_sale: 0, /g, '');

// 7. Data mapping inside useEffect (Remove parsing tags, mapping tags, sku, etc)
content = content.replace(/const tags = typeof product\.tags === 'string' \? JSON\.parse\(product\.tags \|\| '\[\]'\) : product\.tags \|\| \[\];/g, '');
content = content.replace(/sku: product\.sku \|\| '',/g, '');
content = content.replace(/description: product\.description \|\| '',/g, '');
content = content.replace(/tags,/g, '');
content = content.replace(/free_delivery: product\.free_delivery \|\| 0,/g, '');
content = content.replace(/free_delivery_min_qty: product\.free_delivery_min_qty \|\| 0,/g, '');
content = content.replace(/free_delivery_min_amount: product\.free_delivery_min_amount \|\| 0,/g, '');
content = content.replace(/is_flash_sale: product\.is_flash_sale \|\| 0,/g, '');

// 8. Remove UI Blocks 
// Let's use regex to remove specific form groups. Since it's tricky to remove multi-line HTML blocks cleanly with regex without breaking JSX, 
// I'll try to find specific starting and ending strings.
const stripBlock = (startStr, endStr) => {
    const startIdx = content.indexOf(startStr);
    if (startIdx !== -1) {
        const endIdx = content.indexOf(endStr, startIdx);
        if (endIdx !== -1) {
            content = content.substring(0, startIdx) + content.substring(endIdx + endStr.length);
        }
    }
};

// Remove SKU block
stripBlock(
    `<div className="admin-form-group">\n                          <label className="admin-label">SKU</label>`,
    `</div>` // need to be careful with closing divs
);

fs.writeFileSync(filePath, content);
console.log('Successfully applied automated transformations.');
