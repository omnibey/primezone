# Koba Reseller Data Extraction & Processing Guide

This guide documents the full end-to-end process for extracting the latest product data from Koba Reseller, enriching it with Categories and Brands, and finally converting it to an Excel-readable CSV format.

## Step 1: Extract JSON Data via Browser Console

Since Koba Reseller is an Inertia.js application, we extract the data using their internal API. 

1. Open your browser and log in to [Koba Reseller Dashboard](https://www.kobareseller.com/dashboard/products).
2. Right-click anywhere on the page and select **Inspect**.
3. Go to the **Console** tab.
4. If you see a warning about pasting code, type `allow pasting` and press **Enter**.
5. Copy the following code, paste it into the Console, and press **Enter**:

```javascript
(async function() {
    console.log("Fetching all products as JSON...");
    
    // Extract XSRF Token
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return "";
    }
    const xsrfToken = decodeURIComponent(getCookie('XSRF-TOKEN'));
    
    // Extract Inertia Version
    let inertiaVersion = "";
    const scriptEl = document.querySelector('script[data-page="app"]');
    if (scriptEl) {
        try {
            inertiaVersion = JSON.parse(scriptEl.textContent).version;
            console.log("Found Inertia Version:", inertiaVersion);
        } catch(e) {
            console.error("JSON parse error:", e);
        }
    } else {
        const divEl = document.querySelector('div[data-page]');
        if (divEl) {
            try {
                inertiaVersion = JSON.parse(divEl.getAttribute('data-page')).version;
                console.log("Found Inertia Version from div:", inertiaVersion);
            } catch(e) {}
        }
    }
    
    if (!inertiaVersion) {
        console.error("Inertia Version not found! API might fail.");
    }
    
    let allProducts = [];
    let currentPage = 1;
    let lastPage = 1;
    
    do {
        console.log(`Fetching page ${currentPage}...`);
        try {
            const headers = {
                "X-Inertia": "true",
                "X-Requested-With": "XMLHttpRequest",
                "Accept": "application/json"
            };
            
            if (xsrfToken) headers["X-XSRF-TOKEN"] = xsrfToken;
            if (inertiaVersion) headers["X-Inertia-Version"] = inertiaVersion;
            
            const response = await fetch(`https://www.kobareseller.com/dashboard/products?page=${currentPage}`, {
                headers: headers
            });
            
            if (!response.ok) {
                console.error("Failed to fetch page", currentPage, response.status);
                break;
            }
            
            const data = await response.json();
            
            const productsData = data.props?.items?.data || data.props?.products?.data || data.props?.product?.data || data.data || [];
            
            if (productsData.length === 0 && currentPage > 1) break;
            
            allProducts = allProducts.concat(productsData);
            
            if (data.props?.items?.meta?.last_page) {
                lastPage = data.props.items.meta.last_page;
            } else if (data.props?.products?.last_page) {
                lastPage = data.props.products.last_page;
            } else if (data.last_page) {
                lastPage = data.last_page;
            } else {
                if (productsData.length === 0) break;
                lastPage = currentPage + 1; 
            }
        } catch (e) {
            console.error("Error fetching page:", e);
            break;
        }
        
        console.log(`Page ${currentPage} fetched successfully. Moving to next...`);
        currentPage++;
        await new Promise(r => setTimeout(r, 1000));
        
    } while (currentPage <= lastPage);
    
    if (allProducts.length === 0) {
        console.error("No products fetched. Please check the API response manually.");
        return;
    }
    
    console.log(`Finished fetching ${allProducts.length} products. Generating JSON file...`);
    
    const jsonString = JSON.stringify(allProducts, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "store_products_offline.json");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log("✅ JSON Download complete!");
})();
```

6. The browser will download a file (sometimes named with a random ID like `32741f00...` or `store_products_offline.json`).
7. Check your `Downloads` folder, copy this downloaded file, and paste it into your project's data folder: `c:\Bayazid\White-label Store\data\store_products_offline.json`.

---

## Step 2: Auto-Categorize Products

Koba Reseller does not attach Category names inside the raw product data. We have saved their official categories in `data/store_categories.json`. We use a script to automatically map products to these categories based on keywords in their names.

1. Open your terminal in the workspace root (`c:\Bayazid\White-label Store`).
2. Run the auto-categorize script:
```bash
node data/scripts/auto_categorize.js
```
3. This script will update `store_products_offline.json` with `category_name` and `sub_category_name`.

---

## Step 3: Auto-Assign Brands

Koba Reseller also doesn't provide a direct 'Brand' field. We use a smart script that scans the product names against a list of 100+ popular K-Beauty and cosmetics brands.

1. In the same terminal, run the auto-brand script:
```bash
node data/scripts/auto_brand.js
```
2. This will update the JSON file to include a `brand_name` field for every product.

---

## Step 4: Convert JSON to Excel-readable CSV

Finally, we convert the fully enriched JSON data into a clean, flat CSV file that opens perfectly in Microsoft Excel for reviewing or bulk importing.

*(Note: The auto-categorize and auto-brand scripts actually generate the CSV automatically at the end of their execution, but if you need to run it manually:)*

1. Run the CSV conversion script:
```bash
node data/scripts/json_to_csv.js
```
2. The script outputs `c:\Bayazid\White-label Store\data\store_products_offline.csv`.
3. You can now open this `.csv` file directly in Microsoft Excel!
