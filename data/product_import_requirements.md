# Product Database Schema Requirements

This document outlines the exact data fields required to add or import a product into the White-label Store D1 database, based on the `schema.sql` definition.

## Table: `products`

When inserting a product into the `products` table, the following fields are available. Note that some fields are **Required** (must be provided), while others are **Optional** (will use a default value if left blank).

### 🔴 REQUIRED FIELDS
You MUST provide these fields when adding a new product.

| Field Name | Type | Description |
|---|---|---|
| `title` | `TEXT` | The full name of the product. (e.g., "Purito Centella Sun Lotion") |
| `slug` | `TEXT` | A unique, URL-friendly string based on the title. All lowercase, spaces replaced by hyphens. (e.g., `purito-centella-sun-lotion`) |
| `base_price` | `REAL` | The actual selling price of the product. (e.g., `1500`) |

---

### 🟢 OPTIONAL / DEFAULT FIELDS
If you do not provide these fields during insert, the database will automatically assign the default value.

| Field Name | Type | Default Value | Description |
|---|---|---|---|
| `description` | `TEXT` | `''` (Empty) | Product details/description in HTML format. |
| `sku` | `TEXT` | `''` (Empty) | Barcode or unique Stock Keeping Unit identifier. |
| `category` | `TEXT` | `''` (Empty) | The primary category name. *(Note: For advanced categorization, we also use the `product_categories` table).* |
| `brand` | `TEXT` | `''` (Empty) | The brand name of the product. |
| `tags` | `TEXT` | `'[]'` | A JSON array of tags as a string. (e.g., `'["bestseller", "new"]'`) |
| `images` | `TEXT` | `'[]'` | A JSON array of image URLs as a string. (e.g., `'["https://link.com/img.jpg"]'`) |
| `original_price` | `REAL` | `NULL` | The regular/strikethrough price. If NULL, no discount is shown. |
| `stock` | `INTEGER` | `99` | The available quantity in stock. |
| `is_unlimited_stock` | `INTEGER` | `0` (False) | Set to `1` if stock never runs out. |
| `is_multi_variant` | `INTEGER` | `0` (False) | Set to `1` if the product has size/color variations (variants are stored in the `product_variants` table). |
| `free_delivery` | `INTEGER` | `0` (False) | Set to `1` if delivery is always free for this item. |
| `free_delivery_min_qty` | `INTEGER`| `0` | Minimum quantity required to get free delivery. |
| `free_delivery_min_amount`| `REAL` | `0` | Minimum cart amount required to get free delivery. |
| `status` | `TEXT` | `'active'` | Visibility status. Valid options: `'active'`, `'draft'`, `'archived'`. |
| `is_flash_sale` | `INTEGER` | `0` (False) | Set to `1` to mark the product as a flash sale item. |

---

## Related Table: `product_categories` (Multiple Categories)

While the `products` table has a simple `category` text field, White-label Store supports putting a product into multiple categories. This is done by inserting rows into the `product_categories` mapping table:

- `product_id`: The ID of the inserted product.
- `category_id`: The ID of the category from the `categories` table.

## Sample SQL Insert Query

```sql
INSERT INTO products 
  (title, slug, sku, category, brand, images, base_price, original_price, stock, status) 
VALUES 
  (
    'Purito Wonder Releaf Centella Daily Sun Lotion', 
    'purito-wonder-releaf-centella-daily-sun-lotion', 
    '8809563103072', 
    'Skin Care', 
    'Purito', 
    '["https://www.kobainternational.com/wp-content/uploads/2026/08/Purito-Wonder-Releaf-Centella-Daily-Sun-Lotion-60-ml-2.jpg"]', 
    1500, 
    1700, 
    5, 
    'active'
  );
```
