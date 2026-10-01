# DataLayer & GTM Implementation Documentation — White-label Store & Ethnicaura

> **Status:** ✅ **LIVE & FULLY IMPLEMENTED** across all pages and components.  
> **GTM Container ID:** `GTM-T3WL987S`  
> **Consent Mode v2:** Default Granted (COD optimized)  
> **Core Architecture:** Centralized `src/lib/dataLayer.js` utility, `layout.js` GTM script + noscript fallback.

---

## 1. Core Architecture & Standards

### Centralized Utility (`src/lib/dataLayer.js`)
সব DataLayer পুশ এবং ইভেন্ট হ্যান্ডলিং একটিমাত্র সেন্ট্রালাইজড ইউটিলিটি ফাইল থেকে পরিচালিত হয়। কোনো কম্পোনেন্টে সরাসরি `window.dataLayer.push()` করা হয় না।

### Common Parameters (প্রতিটি ইভেন্টে স্বয়ংক্রিয়ভাবে যায়)
প্রতিটি ইভেন্ট ফায়ার হওয়ার সময় `buildCommonParams()` ফাংশনের মাধ্যমে নিচের প্যারামিটারগুলো যুক্ত হয়:

| Parameter | Type | Description |
|---|---|---|
| `event_id` | String | Meta CAPI এবং GA4 Deduplication-এর জন্য ইউনিক UUID (`crypto.randomUUID`) |
| `event_time` | Integer | ইভেন্ট ঘটার ইউনিক্স টাইমস্ট্যাম্প (সেকেন্ডে) |
| `session_id` | String | `sessionStorage`-এ সংরক্ষিত সেশন আইডি |
| `device_type` | String | `"mobile"` \| `"tablet"` \| `"desktop"` |
| `page_location` | String | বর্তমান পেজের সম্পূর্ণ URL (`window.location.href`) |
| `page_referrer` | String | আগের পেজের রেফারার URL (`document.referrer`) |
| `page_title` | String | বর্তমান পেজের টাইটেল (`document.title`) |
| `landing_page` | String | ইউজারের প্রথম ভিজিট করা ল্যান্ডিং পেজের URL (`sessionStorage`) |
| `fbp` | String | ফেসবুকের `_fbp` ফার্স্ট-পার্টি কুকি ভ্যালু |
| `fbc` | String | ফেসবুকের `_fbc` ক্লিক আইডি কুকি ভ্যালু |
| `fbclid` | String | URL থেকে পাওয়া ফেসবুক ক্লিক আইডি |
| `gclid` | String | URL থেকে পাওয়া গুগল ক্লিক আইডি |
| `utm_source` | String | ট্রাফিক সোর্স (`sessionStorage` ক্যাশড) |
| `utm_medium` | String | ট্রাফিক মিডিয়াম (`sessionStorage` ক্যাশড) |
| `utm_campaign` | String | ক্যাম্পেইন নেম (`sessionStorage` ক্যাশড) |
| `utm_content` | String | ক্যাম্পেইন কন্টেন্ট (`sessionStorage` ক্যাশড) |

### GA4 Ecommerce Item Schema (`toGA4Item`)
ই-কমার্স আইটেমগুলোর ফরম্যাট:
```json
{
  "item_id": "123",
  "item_name": "Product Title",
  "item_category": "Category Name (or mapped_categories)",
  "price": 1200,
  "quantity": 1,
  "item_variant": "Size: L / Color: Red",
  "index": 0
}
```

### Safety & Best Practices
1. **`clearEcommerce()`:** প্রতিটি ই-কমার্স ইভেন্টের আগে `{ ecommerce: null }` পুশ করা হয় যাতে আগের ইভেন্টের ডেটা পরের ইভেন্টে ব্লিড (Bleed) না করে।
2. **`var dataLayer` ইনিশিয়ালাইজেশন:** ৩য় পক্ষের এক্সটেনশন বা স্ক্রিপ্ট ব্রেক হওয়া এড়াতে `var` ফরম্যাট সাপোর্ট করা আছে।
3. **Google Consent Mode v2:** GTM স্ক্রিপ্ট লোড হওয়ার আগেই `<Script strategy="beforeInteractive">` দিয়ে ডিফল্ট `granted` কনসেন্ট সেট করা আছে।

---

## 2. All Active Events Reference (Page by Page)

### 🏠 1. Page View — `pushPageView(pageType, extra)`
* **ট্রিগার:** প্রতিটি পেজ মাউন্ট হওয়ার সময়।
* **সাপোর্টেড `page_type` ভ্যালুসমূহ:**
  * `"home"` — হোমপেজ (`HomeDataLayer.js`)
  * `"product"` — সিঙ্গেল প্রোডাক্ট পেজ (`ProductClient.js`)
  * `"category"` — ক্যাটাগরি পেজ (`CategoryClient.js`, extra: `category_name`)
  * `"search_results"` — সার্চ রেজাল্ট পেজ (`SearchClient.js`, extra: `search_term`)
  * `"wishlist"` — উইশলিস্ট পেজ (`src/app/wishlist/page.js`)
  * `"track_order"` — অর্ডার ট্র্যাকিং পেজ (`src/app/track-order/page.js`)
  * `"thank_you"` — অর্ডার সাকসেস পেজ (`src/app/thank-you/page.js`)
  * `"profile"` — ইউজার প্রোফাইল পেজ (`src/app/profile/page.js`)
  * `"blog_list"` — ব্লগ লিস্ট পেজ (`PageDataLayer.js`)
  * `"blog_post"` — সিঙ্গেল ব্লগ পোস্ট (`PageDataLayer.js`, extra: `content_name`)
  * `"page"` — স্ট্যাটিক পলিসি বা কাস্টম পেজ (`PageDataLayer.js`, extra: `content_name`)

---

### 📦 2. Product List Impression — `pushViewItemList(products, listName)`
* **ট্রিগার:** যখন কোনো প্রোডাক্ট গ্রিড রেন্ডার হয়।
* **ব্যবহৃত পেজসমূহ:**
  * হোমপেজ: `"Home - All Products"`, `"Home - Flash Sale"`
  * ক্যাটাগরি পেজ: `"Category - {categoryName}"`
  * সার্চ পেজ: `"Search Results"`
  * উইশলিস্ট পেজ: `"Wishlist"`
* **পেলোড:**
  ```js
  {
    event: "view_item_list",
    ...commonParams,
    ecommerce: {
      item_list_name: listName,
      items: [ ...ga4Items ]
    }
  }
  ```

---

### 👆 3. Product Select / Click — `pushSelectItem(product, listName, idx)`
* **ট্রিগার:** প্রোডাক্ট কার্ডের লিংকে ক্লিক করলে (`ProductCard.js`)।
* **পেলোড:**
  ```js
  {
    event: "select_item",
    ...commonParams,
    ecommerce: {
      item_list_name: listName,
      items: [ toGA4Item(product, idx) ]
    }
  }
  ```

---

### 👁️ 4. View Item — `pushViewItem(product)`
* **ট্রিগার:** সিঙ্গেল প্রোডাক্ট পেজ লোড হলে (`ProductClient.js`)।
* **পেলোড:**
  ```js
  {
    event: "view_item",
    ...commonParams,
    ecommerce: {
      currency: "BDT",
      value: price,
      items: [ toGA4Item(product) ]
    },
    item_count: 1,
    sku: product.sku,
    in_stock: "yes" | "no",
    original_price: product.original_price,
    discount_amount: discount
  }
  ```

---

### 🛒 5. Add to Cart — `pushAddToCart(items, method)`
* **ট্রিগার:** 
  * "Add to Cart" বাটনে ক্লিক করলে (`method: "add_to_cart"`, `buy_now_click: false`)
  * "Buy Now" বাটনে ক্লিক করলে (`method: "buy_now"`, `buy_now_click: true`)
* **পেলোড:**
  ```js
  {
    event: "add_to_cart",
    ...commonParams,
    ecommerce: {
      currency: "BDT",
      value: totalValue,
      items: items.map(toGA4Item)
    },
    add_method: method,
    buy_now_click: method === "buy_now",
    cart_total: totalValue,
    item_count: items.length
  }
  ```

---

### 🗑️ 6. Remove from Cart — `pushRemoveFromCart(item)`
* **ট্রিগার:** কার্ট ড্রয়ার বা কার্ট পেজ থেকে আইটেম ডিলেট করলে (`CartDrawer.js`, `CartClient.js`)।
* **পেলোড:**
  ```js
  {
    event: "remove_from_cart",
    ...commonParams,
    ecommerce: {
      currency: "BDT",
      value: itemPrice * quantity,
      items: [ toGA4Item(item) ]
    }
  }
  ```

---

### 🛍️ 7. View Cart — `pushViewCart(items, total)`
* **ট্রিগার:** সাইডবার কার্ট ড্রয়ার ওপেন হলে (`CartDrawer.js`)।
* **পেলোড:**
  ```js
  {
    event: "view_cart",
    ...commonParams,
    ecommerce: {
      currency: "BDT",
      value: total,
      items: items.map(toGA4Item)
    },
    cart_total: total,
    item_count: items.length
  }
  ```

---

### ❤️ 8. Wishlist Events
* **`add_to_wishlist`:** উইশলিস্টে আইটেম যোগ করলে (`src/lib/wishlistStore.js`)
* **`remove_from_wishlist`:** উইশলিস্ট থেকে আইটেম সরালে (`src/lib/wishlistStore.js`)
* **পেলোড:**
  ```js
  {
    event: "add_to_wishlist" | "remove_from_wishlist",
    ...commonParams,
    ecommerce: {
      currency: "BDT",
      value: itemPrice,
      items: [ toGA4Item(item) ]
    }
  }
  ```

---

### 💳 9. Begin Checkout — `pushBeginCheckout(items, subtotal, source)`
* **ট্রিগার:** চেকআউট ড্রয়ার বা ডেডিকেটেড `/checkout` পেজ ওপেন হলে (`CheckoutUI.js`)।
* **সোর্স ভ্যালু:** `"cart"` \| `"buy_now"` \| `"selected_cart"`
* **পেলোড:**
  ```js
  {
    event: "begin_checkout",
    ...commonParams,
    ecommerce: {
      currency: "BDT",
      value: subtotal,
      items: items.map(toGA4Item),
      subtotal: subtotal
    },
    checkout_step: 1,
    checkout_type: source,
    item_count: items.length
  }
  ```

---

### 🚚 10. Add Shipping Info — `pushAddShippingInfo(items, shippingTier, fee, total)`
* **ট্রিগার:** চেকআউটে ডেলিভারি এরিয়া (Inside Dhaka / Outside Dhaka) পরিবর্তন করলে (`CheckoutUI.js`)।
* **পেলোড:**
  ```js
  {
    event: "add_shipping_info",
    ...commonParams,
    ecommerce: {
      currency: "BDT",
      value: total,
      shipping: fee,
      items: items.map(toGA4Item)
    },
    shipping_tier: "inside" | "outside",
    checkout_step: 2
  }
  ```

---

### 💵 11. Add Payment Info — `pushAddPaymentInfo(items, paymentType, total)`
* **ট্রিগার:** চেকআউটে পেমেন্ট মেথড (Cash on Delivery / Full Pay) পরিবর্তন করলে (`CheckoutUI.js`)।
* **পেলোড:**
  ```js
  {
    event: "add_payment_info",
    ...commonParams,
    ecommerce: {
      currency: "BDT",
      value: total,
      items: items.map(toGA4Item)
    },
    payment_type: "cod" | "full",
    checkout_step: 3
  }
  ```

---

### 🏆 12. Purchase (Enhanced Conversions + Deduplication)
* **ট্রিগার:** অর্ডার কনফার্ম হওয়ার পর `/thank-you` পেজ লোড হলে (`src/app/thank-you/page.js`)।
* **ডুপ্লিকেশন গার্ড:** `sessionStorage.getItem('purchase_fired_{orderId}')` চেক করে শুধুমাত্র একবারই ফায়ার হয়। পেজ রিফ্রেশ বা ব্যাক করলে ডাবল ফায়ার হবে না।
* **সিকিউরিটি:** ইউজারের সেনসিটিভ ডেটা ব্রাউজারেই **SHA-256 (`crypto.subtle`)** দিয়ে হ্যাশ করে `user_data`-তে পাঠানো হয়।
* **পেলোড:**
  ```js
  {
    event: "purchase",
    ...commonParams,
    ecommerce: {
      currency: "BDT",
      value: total,
      transaction_id: orderId,
      items: items.map(toGA4Item),
      shipping: deliveryFee,
      subtotal: subtotal
    },
    payment_method: "cod" | "full",
    delivery_area: "inside" | "outside",
    order_status: "confirmed",
    user_data: {
      em: "sha256_hashed_email",
      ph: "sha256_hashed_phone",
      fn: "sha256_hashed_first_name",
      ln: "sha256_hashed_last_name",
      ct: "sha256_hashed_city"
    },
    user_properties: {
      phone_number: "01700000000",
      first_name: "Customer Name",
      last_name: "Last Name",
      city: "Dhaka",
      address: "Delivery Address",
      country: "bangladesh",
      internal_id: orderId
    }
  }
  ```

---

### 💬 13. WhatsApp Contact Click — `pushWhatsAppClick(pageType)`
* **ট্রিগার:** ফ্লোটিং হোয়াটসঅ্যাপ বাটনে ক্লিক করলে (`FloatingWhatsApp.js`)।
* **পেলোড:**
  ```js
  {
    event: "whatsapp_click",
    ...commonParams,
    contact_method: "whatsapp",
    page_type: pageType,
    page_location: window.location.href,
    page_title: document.title
  }
  ```

---

### 🔎 14. Search Event — `pushSearch(term, resultCount)`
* **ট্রিগার:** সার্চ পেজে কোনো কিওয়ার্ড দিয়ে সার্চ রেজাল্ট আসলে (`SearchClient.js`)।
* **পেলোড:**
  ```js
  {
    event: "search",
    ...commonParams,
    search_term: term,
    result_count: resultCount
  }
  ```

---

### 📍 15. Track Order Lookup — `pushTrackOrder(phone, orderCount)`
* **ট্রিগার:** অর্ডার ট্র্যাকিং পেজে সফলভাবে ফোন নাম্বার দিয়ে অর্ডার সার্চ করলে (`src/app/track-order/page.js`)।
* **পেলোড:**
  ```js
  {
    event: "track_order",
    ...commonParams,
    phone_last4: phone.slice(-4),
    order_count: orderCount
  }
  ```

---

## 3. GTM & Meta CAPI Configuration Guide

### Web GTM Triggers Setup:
* **All Pages:** Custom Event `page_view`
* **View Item:** Custom Event `view_item`
* **Add to Cart:** Custom Event `add_to_cart`
* **View Cart:** Custom Event `view_cart`
* **Begin Checkout:** Custom Event `begin_checkout`
* **Add Shipping Info:** Custom Event `add_shipping_info`
* **Add Payment Info:** Custom Event `add_payment_info`
* **Purchase:** Custom Event `purchase`
* **WhatsApp Click:** Custom Event `whatsapp_click`
* **Wishlist Add/Remove:** Custom Event `add_to_wishlist`, `remove_from_wishlist`

### Deduplication Rule for Meta Pixel & CAPI:
* **Event ID Variable:** Data Layer Variable `event_id`
* Web Pixel Tag-এ `Event ID` ফিল্ডে `{{dlv - event_id}}` পাস করতে হবে।
* Server Container / CAPI Tag-এও একই `{{dlv - event_id}}` পাস করতে হবে। 
* ফেসবুক স্বয়ংক্রিয়ভাবে দুটি ইভেন্টকে ম্যাচ করে ব্রাউজার ও সার্ভারের ডেটা ডিডুপ্লিকেট করে ফেলবে।
