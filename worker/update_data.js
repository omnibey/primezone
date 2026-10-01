const { execSync } = require('child_process');
const fs = require('fs');

// Current JSON from DB
const currentJsonStr = `{"delivery":{"insideFee":70,"outsideFee":120},"whatsapp":{"number":"8801703968638"},"telegram":{"bot_token":"7800637175:AAE-563dCokR70XJ-oA_c7x6j35T-c82p1A","chat_id":"5876629003"},"layout":{"logo_url":"","favicon_url":"","flash_sale":{"enabled":false,"end_time":""},"menu":[],"banners":[]},"home_categories":[]}`;

const data = JSON.parse(currentJsonStr);

data.layout.banners = [
    {
        image_url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1250&h=350&fit=crop",
        url: "/search"
    },
    {
        image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1250&h=350&fit=crop",
        url: "/search/label/Hoodie"
    }
];

data.home_categories = [
    {
        title: "Electronics",
        image_url: "https://images.unsplash.com/photo-1498049860654-af1a5c5668ba?w=150&h=150&fit=crop",
        slug: "electronics",
        url: "/search/label/Electronics"
    },
    {
        title: "Fashion",
        image_url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=150&h=150&fit=crop",
        slug: "fashion",
        url: "/search/label/Fashion"
    }
];

const newJsonStr = JSON.stringify(data).replace(/'/g, "''"); // Escape single quotes for SQL

const sqlCommand = `UPDATE store_settings SET value = '${newJsonStr}' WHERE key = 'settings';`;

fs.writeFileSync('update.sql', sqlCommand);

try {
    console.log("Running D1 query from file...");
    execSync(`npx wrangler d1 execute DB --local --file update.sql`, { stdio: 'inherit' });
    console.log("Done!");
} catch(e) {
    console.error("Error executing query:", e);
}
