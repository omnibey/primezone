const fs = require('fs');

const jsonPath = 'c:\\Bayazid\\kothbel\\data\\koba_products_offline.json';
const csvPath = 'c:\\Bayazid\\kothbel\\data\\koba_products_offline.csv';
const products = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const knownBrands = [
    "Purito", "Arencia", "Green Finger", "SKIN1004", "Forest", "FoRest", "Dabo", 
    "Beaute Melasma", "APLB", "MEDI-PEEL", "Kerasys", "Cosrx", "The Ordinary", 
    "Some By Mi", "Beauty of Joseon", "Missha", "Innisfree", "Laneige", "Etude House", 
    "CeraVe", "Cetaphil", "Neutrogena", "Farm Stay", "3W Clinic", "Garnier", "L'Oreal", 
    "Nivea", "Pond's", "Simple", "Snail Truecica", "Tiam", "Torriden", "Round Lab", 
    "Isntree", "Benton", "Klairs", "I'm From", "AXIS-Y", "Heimish", "Banila Co", 
    "Dr.Jart+", "Illiyoon", "Mary&May", "Mixsoon", "Numbuzin", "Pyunkang Yul", 
    "Rom&nd", "Skinfood", "Sulwhasoo", "The Face Shop", "TonyMoly", "Too Cool For School", 
    "Apieu", "Goodal", "Hada Labo", "Kahi", "Ma:nyo", "Neogen", "Peripera", "Rovectin", 
    "Mediheal", "JmSolution", "Bioaqua", "Kiss Beauty", "Wokali", "Roushun", "Guicami", 
    "Aromatica", "Celimax", "Abib", "Tirtir", "Bioderma", "La Roche-Posay", "Vichy", 
    "Eucerin", "Olay", "Glow Recipe", "Biotique", "Mamaearth", "Plum", "Himalaya", 
    "Lotus", "Lakme", "Maybelline", "Mac", "Revuele", "Xpel", "Cantu", "Palmers",
    "Jigott", "Pax Moly", "Secret Key", "Eyenlip", "Gatsby", "Focallure", "O.TWO.O", 
    "Sace Lady", "Novo", "Hoojo", "Mise En Scene", "Ryo", "Kundal", "CP-1", "W.Dressroom"
].sort((a, b) => b.length - a.length);

for (const p of products) {
    let brand = "Unknown";
    const nameLower = p.name.toLowerCase();
    
    for (const b of knownBrands) {
        if (nameLower.startsWith(b.toLowerCase() + " ") || 
            nameLower.includes(" " + b.toLowerCase() + " ") || 
            nameLower === b.toLowerCase()) {
            brand = b;
            break;
        }
    }
    
    if (brand === "Unknown") {
        const firstWord = p.name.split(' ')[0];
        if (firstWord && !["The", "A", "An", "Dr.", "New", "Mini", "Set", "Pack"].includes(firstWord)) {
            brand = firstWord;
        } else if (p.name.split(' ').length > 1) {
            brand = p.name.split(' ').slice(0, 2).join(' ');
        }
    }
    
    p.brand_name = brand;
}

fs.writeFileSync(jsonPath, JSON.stringify(products, null, 2), 'utf-8');

const headers = [
    'id', 'brand_name', 'name', 'sku', 'category_name', 'sub_category_name', 'price', 
    'commission_percentage', 'commission', 'stock_quantity', 'status', 
    'featured', 'free_shipping', 'active', 'image_url', 'description', 
    'created_at_formatted', 'updated_at_formatted'
];

function escapeCsv(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

const csvRows = [];
csvRows.push(headers.join(','));

for (const p of products) {
    const row = headers.map(h => escapeCsv(p[h]));
    csvRows.push(row.join(','));
}

fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf-8');
console.log('Successfully assigned brands and updated JSON/CSV.');
