const fs = require('fs');
const path = require('path');

// 1. Define Category Hierarchy
const CATEGORY_STRUCTURE = [
    {
        id: 'cat-skin-care',
        name: 'Skin Care',
        slug: 'skin-care',
        description: 'Authentic Korean Skincare products for glowing and healthy skin.',
        sort_order: 1,
        show_on_homepage: 1,
        subcategories: [
            { id: 'sub-cleanser', name: 'Cleanser & Face Wash', slug: 'cleanser-face-wash', sort_order: 1, keywords: ['cleanser', 'cleansing', 'face wash', 'foam', 'facial foam', 'oil cleanser'] },
            { id: 'sub-toner', name: 'Toner & Pads', slug: 'toner-pads', sort_order: 2, keywords: ['toner', 'pad', 'pads', 'mist', 'essence toner', 'toner pad'] },
            { id: 'sub-serum', name: 'Serum & Ampoule', slug: 'serum-ampoule', sort_order: 3, keywords: ['serum', 'ampoule', 'essence', 'concentrate', 'bifida', 'galactomyces'] },
            { id: 'sub-moisturizer', name: 'Moisturizer & Cream', slug: 'moisturizer-cream', sort_order: 4, keywords: ['cream', 'moisturizer', 'lotion', 'gel cream', 'barrier cream', 'soothing gel'] },
            { id: 'sub-sunscreen', name: 'Sunscreen & Sun Care', slug: 'sunscreen-sun-care', sort_order: 5, keywords: ['sun', 'sunscreen', 'sun cream', 'sun stick', 'sun serum', 'spf', 'uv'] },
            { id: 'sub-mask', name: 'Mask & Eye Care', slug: 'mask-eye-care', sort_order: 6, keywords: ['mask', 'sheet mask', 'eye cream', 'sleeping mask', 'clay mask', 'peel'] }
        ]
    },
    {
        id: 'cat-hair-care',
        name: 'Hair Care',
        slug: 'hair-care',
        description: 'Korean premium hair care treatments, shampoos, and conditioners.',
        sort_order: 2,
        show_on_homepage: 1,
        subcategories: [
            { id: 'sub-shampoo', name: 'Shampoo', slug: 'shampoo', sort_order: 1, keywords: ['shampoo', 'hair loss', 'scalp'] },
            { id: 'sub-conditioner', name: 'Conditioner & Treatment', slug: 'conditioner-treatment', sort_order: 2, keywords: ['conditioner', 'treatment', 'hair mask', 'rinse'] },
            { id: 'sub-hair-oil', name: 'Hair Oil & Serum', slug: 'hair-oil-serum', sort_order: 3, keywords: ['hair oil', 'hair serum', 'hair essence'] }
        ]
    },
    {
        id: 'cat-body-bath',
        name: 'Body & Bath',
        slug: 'body-bath',
        description: 'Refreshing body washes, lotions, and bath essentials.',
        sort_order: 3,
        show_on_homepage: 1,
        subcategories: [
            { id: 'sub-body-lotion', name: 'Body Lotion & Cream', slug: 'body-lotion-cream', sort_order: 1, keywords: ['body lotion', 'body cream', 'body butter', 'hand cream'] },
            { id: 'sub-body-wash', name: 'Body Wash & Shower Gel', slug: 'body-wash-shower-gel', sort_order: 2, keywords: ['body wash', 'shower gel', 'body scrub', 'bath'] }
        ]
    },
    {
        id: 'cat-lip-makeup',
        name: 'Lip Care & Makeup',
        slug: 'lip-care-makeup',
        description: 'Vibrant Korean lip tints, lip balms, and base makeup.',
        sort_order: 4,
        show_on_homepage: 1,
        subcategories: [
            { id: 'sub-lip-tint', name: 'Lip Tint & Balm', slug: 'lip-tint-balm', sort_order: 1, keywords: ['lip', 'tint', 'lip balm', 'lip tint', 'glow tint', 'velvet tint', 'lip gloss'] },
            { id: 'sub-makeup', name: 'Cushion & Makeup', slug: 'cushion-makeup', sort_order: 2, keywords: ['cushion', 'foundation', 'bb cream', 'concealer', 'eyeliner', 'mascara'] }
        ]
    },
    {
        id: 'cat-combos-sets',
        name: 'Combos & Sets',
        slug: 'combos-sets',
        description: 'Specially curated Korean skincare sets and combos for maximum value.',
        sort_order: 5,
        show_on_homepage: 1,
        subcategories: [
            { id: 'sub-skincare-combos', name: 'Skin Care Combos', slug: 'skincare-combos', sort_order: 1, keywords: ['combo', 'set', 'routine kit', 'trio', 'duo', 'skincare combo'] },
            { id: 'sub-gift-sets', name: 'Gift & Travel Sets', slug: 'gift-travel-sets', sort_order: 2, keywords: ['gift set', 'travel kit', 'mini set', 'sample set'] }
        ]
    }
];

function escapeSql(str) {
    if (str === null || str === undefined) return 'NULL';
    return "'" + String(str).replace(/'/g, "''") + "'";
}

// 2. Classify Product Function
function classifyProduct(title, kobaCat, kobaSub) {
    const text = `${title} ${kobaCat || ''} ${kobaSub || ''}`.toLowerCase();
    
    // Check Hair Care first
    if (text.includes('shampoo')) return { parent: 'cat-hair-care', sub: 'sub-shampoo', mainName: 'Hair Care', subName: 'Shampoo' };
    if (text.includes('conditioner') || text.includes('hair treatment') || text.includes('treatment') && (text.includes('hair') || text.includes('fino') || text.includes('tsubaki') || text.includes('unove'))) {
        return { parent: 'cat-hair-care', sub: 'sub-conditioner', mainName: 'Hair Care', subName: 'Conditioner & Treatment' };
    }
    if (text.includes('hair oil') || text.includes('hair serum') || text.includes('hair essence') || text.includes('miseen')) {
        return { parent: 'cat-hair-care', sub: 'sub-hair-oil', mainName: 'Hair Care', subName: 'Hair Oil & Serum' };
    }

    // Check Combos & Sets
    if (text.includes('combo') || text.includes(' duo') || text.includes(' trio') || text.includes('routine set') || text.includes('special set')) {
        return { parent: 'cat-combos-sets', sub: 'sub-skincare-combos', mainName: 'Combos & Sets', subName: 'Skin Care Combos' };
    }

    // Check Lip & Makeup
    if (text.includes('lip') || text.includes('tint') || text.includes('rom&nd') || text.includes('glasting') || text.includes('juicy lasting') || text.includes('dewyful') || text.includes('lip balm') || text.includes('lip sleeping mask')) {
        return { parent: 'cat-lip-makeup', sub: 'sub-lip-tint', mainName: 'Lip Care & Makeup', subName: 'Lip Tint & Balm' };
    }
    if (text.includes('cushion') || text.includes('foundation') || text.includes('mascara') || text.includes('eyeliner') || text.includes('bb cream')) {
        return { parent: 'cat-lip-makeup', sub: 'sub-makeup', mainName: 'Lip Care & Makeup', subName: 'Cushion & Makeup' };
    }

    // Check Body Care
    if (text.includes('body lotion') || text.includes('body cream') || text.includes('hand cream') || text.includes('cerave moisturizing cream') || text.includes('cerave lotion')) {
        return { parent: 'cat-body-bath', sub: 'sub-body-lotion', mainName: 'Body & Bath', subName: 'Body Lotion & Cream' };
    }
    if (text.includes('body wash') || text.includes('shower gel') || text.includes('body scrub')) {
        return { parent: 'cat-body-bath', sub: 'sub-body-wash', mainName: 'Body & Bath', subName: 'Body Wash & Shower Gel' };
    }

    // Check Skin Care
    if (text.includes('sun') || text.includes('sunscreen') || text.includes('sun cream') || text.includes('sun stick') || text.includes('sun serum') || text.includes('spf') || text.includes('uv shield') || text.includes('water fit sun')) {
        return { parent: 'cat-skin-care', sub: 'sub-sunscreen', mainName: 'Skin Care', subName: 'Sunscreen & Sun Care' };
    }
    if (text.includes('cleanser') || text.includes('cleansing') || text.includes('face wash') || text.includes('foam') || text.includes('micellar') || text.includes('cleaning balm') || text.includes('cleansing oil')) {
        return { parent: 'cat-skin-care', sub: 'sub-cleanser', mainName: 'Skin Care', subName: 'Cleanser & Face Wash' };
    }
    if (text.includes('toner') || text.includes(' pad') || text.includes('pads') || text.includes('mist') || text.includes('toner pad') || text.includes('essence toner')) {
        return { parent: 'cat-skin-care', sub: 'sub-toner', mainName: 'Skin Care', subName: 'Toner & Pads' };
    }
    if (text.includes('serum') || text.includes('ampoule') || text.includes('essence') || text.includes('glow serum') || text.includes('calming serum') || text.includes('bifida')) {
        return { parent: 'cat-skin-care', sub: 'sub-serum', mainName: 'Skin Care', subName: 'Serum & Ampoule' };
    }
    if (text.includes('eye cream') || text.includes('mask') || text.includes('sheet mask') || text.includes('sleeping pack') || text.includes('modeling mask') || text.includes('clay mask')) {
        return { parent: 'cat-skin-care', sub: 'sub-mask', mainName: 'Skin Care', subName: 'Mask & Eye Care' };
    }
    if (text.includes('cream') || text.includes('moisturizer') || text.includes('gel') || text.includes('lotion') || text.includes('soothing') || text.includes('cica barrier')) {
        return { parent: 'cat-skin-care', sub: 'sub-moisturizer', mainName: 'Skin Care', subName: 'Moisturizer & Cream' };
    }

    // Default fallback
    return { parent: 'cat-skin-care', sub: 'sub-moisturizer', mainName: 'Skin Care', subName: 'Moisturizer & Cream' };
}

// 3. Generate SQL Statements
function getCategorySetupStatements() {
    const stmts = [];
    stmts.push('DELETE FROM product_categories');
    stmts.push('DELETE FROM categories');

    // 1. Insert Parents First
    CATEGORY_STRUCTURE.forEach(main => {
        stmts.push(`INSERT INTO categories (id, name, slug, description, sort_order, is_active, show_on_homepage, parent_id, created_at, updated_at) VALUES (${escapeSql(main.id)}, ${escapeSql(main.name)}, ${escapeSql(main.slug)}, ${escapeSql(main.description)}, ${main.sort_order}, 1, ${main.show_on_homepage}, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`);
    });

    // 2. Insert Subcategories Second
    CATEGORY_STRUCTURE.forEach(main => {
        main.subcategories.forEach(sub => {
            stmts.push(`INSERT INTO categories (id, name, slug, description, sort_order, is_active, show_on_homepage, parent_id, created_at, updated_at) VALUES (${escapeSql(sub.id)}, ${escapeSql(sub.name)}, ${escapeSql(sub.slug)}, NULL, ${sub.sort_order}, 1, 0, ${escapeSql(main.id)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`);
        });
    });

    return stmts;
}

module.exports = {
    CATEGORY_STRUCTURE,
    classifyProduct,
    getCategorySetupStatements
};
