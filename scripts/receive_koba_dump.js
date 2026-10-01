const http = require('http');
const fs = require('fs');
const path = require('path');

const destDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const products = JSON.parse(body);
        const jsonPath = path.join(destDir, 'koba_products_offline.json');
        fs.writeFileSync(jsonPath, JSON.stringify(products, null, 2), 'utf8');

        // CSV
        const headers = ["ID", "Name", "SKU", "Price", "Commission", "Stock Qty", "Status", "Image URL"];
        const csvRows = [headers.join(",")];
        products.forEach(p => {
          const row = [
            `"${p.id || ''}"`,
            `"${(p.name || '').replace(/"/g, '""')}"`,
            `"${p.sku || ''}"`,
            p.price || 0,
            p.commission || 0,
            p.stock_quantity || 0,
            `"${p.status || ''}"`,
            `"${p.image_url || p.image || ''}"`
          ];
          csvRows.push(row.join(","));
        });
        const csvPath = path.join(destDir, 'koba_products_offline.csv');
        fs.writeFileSync(csvPath, csvRows.join("\n"), 'utf8');

        console.log(`🎉 SUCCESS! Saved ${products.length} products to:`);
        console.log(' -', jsonPath);
        console.log(' -', csvPath);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: products.length }));
        
        setTimeout(() => process.exit(0), 1000);
      } catch (err) {
        console.error('Error saving data:', err);
        res.writeHead(500);
        res.end(err.message);
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(4567, () => {
  console.log('Receiver server listening on http://localhost:4567/save');
});
