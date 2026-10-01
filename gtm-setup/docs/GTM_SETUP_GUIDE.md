# 🚀 GTM DataLayer Complete Setup Guide (Web & Server-Side)

এই ডকুমেন্টটি দেখে ডিজিটাল মার্কেটার, মিডিয়া বায়ার বা ডেভেলপার যে কেউ খুব সহজে **Google Tag Manager (GTM)**-এ ভেরিয়েবল, ট্রিগার এবং ট্যাগ (GA4 & Meta Pixel / CAPI) সেটআপ করে ফেলতে পারবে। 

সবগুলো কনফিগারেশন আমাদের চলমান কোডবেসের (`src/lib/dataLayer.js`) সাথে হুবহু ১০০% মিল রেখে তৈরি করা হয়েছে। কোনো প্যারামিটার বাদ দেওয়া হয়নি।

---

## 📌 ১. প্রজেক্ট পরিচিতি ও ক্রেডেনশিয়ালস

* **ওয়েবসাইট:** White-label Store & Ethnicaura
* **GTM Container ID:** `GTM-T3WL987S`
* **GA4 Measurement ID:** `G-6MMMY82G77`
* **Meta Pixel ID:** `1098001739077576`
* **কারেন্সি:** `BDT`
* **কনসেন্ট মোড:** Google Consent Mode v2 (Default: Granted)
* **আর্কিটেকচার:** Next.js App Router (Single Page Application DataLayer)

---

## 🏷️ ২. Data Layer Variables (DLVs) তৈরি করা

GTM Web Container-এ গিয়ে **Variables -> User-Defined Variables -> New -> Data Layer Variable** নির্বাচন করে নিচের ভেরিয়েবলগুলো তৈরি করো:

### ক) গ্লোবাল ও কমন ভেরিয়েবল (Common Variables — প্রতিটি ইভেন্টে থাকে)
| Variable Name in GTM | Data Layer Variable Name | বিবরণ / ব্যবহার |
|---|---|---|
| `dlv - event_id` | `event_id` | **অত্যন্ত গুরুত্বপূর্ণ:** Meta CAPI & Pixel Deduplication-এর জন্য ইউনিক UUID |
| `dlv - event_time` | `event_time` | ইভেন্ট ঘটার টাইমস্ট্যাম্প (Unix Seconds) |
| `dlv - session_id` | `session_id` | ইউজার সেশন ট্র্যাকিং (`sessionStorage`) |
| `dlv - device_type` | `device_type` | `mobile` / `tablet` / `desktop` |
| `dlv - page_type` | `page_type` | `home`, `product`, `category`, `search_results`, `wishlist`, `checkout`, `thank_you`, `profile`, `blog_list`, `blog_post`, `page` |
| `dlv - page_location` | `page_location` | ফুল পেজ URL (`window.location.href`) |
| `dlv - page_referrer` | `page_referrer` | রেফারার URL (`document.referrer`) |
| `dlv - page_title` | `page_title` | পেজের টাইটেল (`document.title`) |
| `dlv - landing_page` | `landing_page` | ইউজারের প্রথম ভিজিট করা ল্যান্ডিং URL |
| `dlv - fbp` | `fbp` | ফেসবুক ফার্স্ট-পার্টি কুকি (`_fbp`) |
| `dlv - fbc` | `fbc` | ফেসবুক ক্লিক আইডি কুকি (`_fbc`) |
| `dlv - fbclid` | `fbclid` | ফেসবুক ক্লিক আইডি প্যারামিটার |
| `dlv - gclid` | `gclid` | গুগল অ্যাডস ক্লিক আইডি প্যারামিটার |
| `dlv - utm_source` | `utm_source` | ট্রাফিক সোর্স |
| `dlv - utm_medium` | `utm_medium` | ট্রাফিক মিডিয়াম |
| `dlv - utm_campaign` | `utm_campaign` | ক্যাম্পেইন নেম |
| `dlv - utm_content` | `utm_content` | অ্যাড কন্টেন্ট |

---

### খ) ই-কমার্স ভেরিয়েবল (GA4 Standard Ecommerce)
| Variable Name in GTM | Data Layer Variable Name | বিবরণ |
|---|---|---|
| `dlv - ecommerce.currency` | `ecommerce.currency` | কারেন্সি কোড (`BDT`) |
| `dlv - ecommerce.value` | `ecommerce.value` | ইভেন্টের টোটাল ভ্যালু / অ্যামাউন্ট |
| `dlv - ecommerce.items` | `ecommerce.items` | প্রোডাক্ট আইটেমসের অ্যারে (`items` array) |
| `dlv - ecommerce.transaction_id` | `ecommerce.transaction_id` | ইউনিক অর্ডার আইডি (`purchase` ইভেন্টে) |
| `dlv - ecommerce.shipping` | `ecommerce.shipping` | ডেলিভারি চার্জ / ফি |
| `dlv - ecommerce.subtotal` | `ecommerce.subtotal` | সাবটোটাল অ্যামাউন্ট |
| `dlv - ecommerce.item_list_name` | `ecommerce.item_list_name` | ক্যাটাগরি বা প্রোডাক্ট গ্রিড লিস্টের নাম |

---

### গ) কাস্টম ও ফানেল স্পেসিফিক ভেরিয়েবল (Funnel & Custom Attributes)
| Variable Name in GTM | Data Layer Variable Name | বিবরণ |
|---|---|---|
| `dlv - add_method` | `add_method` | `add_to_cart` নাকি `buy_now` বাটন |
| `dlv - buy_now_click` | `buy_now_click` | Buy Now ক্লিকে `true`, সাধারণ কার্ডে `false` |
| `dlv - cart_total` | `cart_total` | কার্টের মোট টাকার পরিমাণ |
| `dlv - item_count` | `item_count` | মোট প্রোডাক্টের সংখ্যা |
| `dlv - sku` | `sku` | প্রোডাক্টের SKU কোড |
| `dlv - in_stock` | `in_stock` | প্রোডাক্ট স্টকে আছে কিনা (`yes`/`no`) |
| `dlv - original_price` | `original_price` | ডিসকাউন্টের আগের রেগুলার প্রাইস |
| `dlv - discount_amount` | `discount_amount` | ছাড়ের মোট টাকা |
| `dlv - checkout_type` | `checkout_type` | `cart`, `buy_now`, অথবা `selected_cart` |
| `dlv - checkout_step` | `checkout_step` | চেকআউট স্টেপ (1=Begin, 2=Shipping, 3=Payment) |
| `dlv - shipping_tier` | `shipping_tier` | `inside` নাকি `outside` ঢাকা |
| `dlv - payment_method` | `payment_method` | `cod` নাকি `full` |
| `dlv - delivery_area` | `delivery_area` | `inside` নাকি `outside` ঢাকা |
| `dlv - order_status` | `order_status` | অর্ডারের স্ট্যাটাস (`confirmed`) |
| `dlv - search_term` | `search_term` | ইউজার যে কিওয়ার্ড দিয়ে সার্চ করেছে |
| `dlv - result_count` | `result_count` | সার্চে কয়টি রেজাল্ট এসেছে |
| `dlv - contact_method` | `contact_method` | যোগাযোগ মেথড (`whatsapp`) |
| `dlv - phone_last4` | `phone_last4` | অর্ডার ট্র্যাকিংয়ে ফোনের শেষ ৪ ডিজিট |
| `dlv - order_count` | `order_count` | অর্ডার ট্র্যাকিংয়ে মোট অর্ডারের সংখ্যা |

---

### ঘ) অ্যাডভান্সড ম্যাচিং ভেরিয়েবল (User Data — SHA-256 Hashed)
*এই ডেটাগুলো কোডেই ব্রাউজারে **SHA-256 (`crypto.subtle`)** দিয়ে সিকিউরভাবে হ্যাশ হয়ে `user_data`-তে যায়, যা Meta CAPI এবং Google Ads Enhanced Conversions-এর জন্য বাধ্যতামূলক:*
| Variable Name in GTM | Data Layer Variable Name | বিবরণ |
|---|---|---|
| `dlv - user_data.em` | `user_data.em` | SHA-256 Hashed Email |
| `dlv - user_data.ph` | `user_data.ph` | SHA-256 Hashed Phone |
| `dlv - user_data.fn` | `user_data.fn` | SHA-256 Hashed First Name |
| `dlv - user_data.ln` | `user_data.ln` | SHA-256 Hashed Last Name |
| `dlv - user_data.ct` | `user_data.ct` | SHA-256 Hashed City |

---

### ঙ) GA4 User Properties ভেরিয়েবল (Plain Text for GA4)
| Variable Name in GTM | Data Layer Variable Name | বিবরণ |
|---|---|---|
| `dlv - user_properties.phone_number` | `user_properties.phone_number` | কাস্টমারের ফোন নাম্বার |
| `dlv - user_properties.first_name` | `user_properties.first_name` | কাস্টমারের নাম |
| `dlv - user_properties.last_name` | `user_properties.last_name` | কাস্টমারের লাস্ট নেম |
| `dlv - user_properties.city` | `user_properties.city` | কাস্টমারের জেলা / শহর |
| `dlv - user_properties.address` | `user_properties.address` | কাস্টমারের ঠিকানা |
| `dlv - user_properties.country` | `user_properties.country` | দেশ (`bangladesh`) |
| `dlv - user_properties.internal_id` | `user_properties.internal_id` | ইন্টারনাল অর্ডার আইডি |

---

## ⚡ ৩. Custom Event Triggers তৈরি করা

GTM-এ গিয়ে **Triggers -> New -> Custom Event** নির্বাচন করে নিচের ট্রিগারগুলো তৈরি করো:

| # | Trigger Name in GTM | Event Name (হুবহু কেস-সেনসিটিভ) | কোথায় ফায়ার হয় |
|---|---|---|---|
| 1 | `1. CE - page_view` | `page_view` | সব পেজ লোড / নেভিগেশনে |
| 2 | `2. CE - view_item_list` | `view_item_list` | হোমপেজ, ক্যাটাগরি, সার্চ ও উইশলিস্ট গ্রিডে |
| 3 | `3. CE - select_item` | `select_item` | প্রোডাক্ট কার্ড লিংকে ক্লিক করলে |
| 4 | `4. CE - view_item` | `view_item` | প্রোডাক্ট ডিটেইলস পেজে |
| 5 | `5. CE - add_to_cart` | `add_to_cart` | Add to Cart / Buy Now বাটনে ক্লিক করলে |
| 6 | `6. CE - remove_from_cart`| `remove_from_cart`| কার্ট ড্রয়ার বা কার্ট পেজ থেকে আইটেম ডিলেট করলে |
| 7 | `7. CE - view_cart` | `view_cart` | সাইডবার কার্ট ড্রয়ার ওপেন হলে |
| 8 | `8. CE - add_to_wishlist` | `add_to_wishlist` | উইশলিস্টে আইটেম যোগ করলে |
| 9 | `9. CE - remove_from_wishlist` | `remove_from_wishlist` | উইশলিস্ট থেকে আইটেম বাদ দিলে |
| 10 | `10. CE - begin_checkout` | `begin_checkout` | চেকআউট ড্রয়ার বা `/checkout` পেজ ওপেন হলে |
| 11 | `11. CE - add_shipping_info`| `add_shipping_info`| ডেলিভারি এরিয়া (ইনসাইড/আউটসাইড) সিলেক্ট করলে |
| 12 | `12. CE - add_payment_info` | `add_payment_info` | পেমেন্ট মেথড (ক্যাশ অন ডেলিভারি ইত্যাদি) বদলালে |
| 13 | `13. CE - purchase` | `purchase` | অর্ডার কনফার্মের পর `/thank-you` পেজে |
| 14 | `14. CE - whatsapp_click` | `whatsapp_click` | ফ্লোটিং হোয়াটসঅ্যাপ বাটনে ক্লিক করলে |
| 15 | `15. CE - search` | `search` | সার্চ পেজে কোনো কুয়েরি আসলে |
| 16 | `16. CE - track_order` | `track_order` | অর্ডার ট্র্যাকিং পেজে সফলভাবে ফোন দিয়ে খুঁজলে |

---

## 📊 ৪. Google Analytics 4 (GA4) ট্যাগ সেটআপ

### ধাপ ১: Google Tag (Base Configuration)
* **Tag Type:** Google Tag
* **Tag ID:** `G-6MMMY82G77`
* **Trigger:** `CE - page_view` (অথবা Initialization - All Pages)

---

### ধাপ ২: GA4 Ecommerce ও ইভেন্ট ট্যাগসমূহ
নিচের প্রতিটি ট্যাগের জন্য **Tag Type: Google Analytics: GA4 Event** ব্যবহার করো:

| Tag Name | Measurement ID | Event Name | More Settings -> Send Ecommerce Data | Trigger |
|---|---|---|:---:|---|
| `GA4 - view_item_list` | `G-6MMMY82G77` | `view_item_list` | ✅ Checked (Data Layer) | `CE - view_item_list` |
| `GA4 - select_item` | `G-6MMMY82G77` | `select_item` | ✅ Checked (Data Layer) | `CE - select_item` |
| `GA4 - view_item` | `G-6MMMY82G77` | `view_item` | ✅ Checked (Data Layer) | `CE - view_item` |
| `GA4 - add_to_cart` | `G-6MMMY82G77` | `add_to_cart` | ✅ Checked (Data Layer) | `CE - add_to_cart` |
| `GA4 - remove_from_cart` | `G-6MMMY82G77` | `remove_from_cart` | ✅ Checked (Data Layer) | `CE - remove_from_cart` |
| `GA4 - view_cart` | `G-6MMMY82G77` | `view_cart` | ✅ Checked (Data Layer) | `CE - view_cart` |
| `GA4 - add_to_wishlist` | `G-6MMMY82G77` | `add_to_wishlist` | ✅ Checked (Data Layer) | `CE - add_to_wishlist` |
| `GA4 - begin_checkout` | `G-6MMMY82G77` | `begin_checkout` | ✅ Checked (Data Layer) | `CE - begin_checkout` |
| `GA4 - add_shipping_info`| `G-6MMMY82G77` | `add_shipping_info` | ✅ Checked (Data Layer) | `CE - add_shipping_info` |
| `GA4 - add_payment_info` | `G-6MMMY82G77` | `add_payment_info` | ✅ Checked (Data Layer) | `CE - add_payment_info` |
| `GA4 - purchase` | `G-6MMMY82G77` | `purchase` | ✅ Checked (Data Layer) | `CE - purchase` |
| `GA4 - search` | `G-6MMMY82G77` | `search` | Event Param: `search_term` = `{{dlv - search_term}}` | `CE - search` |
| `GA4 - whatsapp_click` | `G-6MMMY82G77` | `whatsapp_click` | Event Param: `contact_method` = `whatsapp` | `CE - whatsapp_click` |

---

## 🎯 ৫. Meta Pixel (Facebook Pixel) ট্যাগ সেটআপ (Web Browser)

> **পরামর্শ:** GTM Community Template Gallery থেকে **Facebook Pixel** টেমপ্লেটটি ব্যবহার করো।

### ক) Meta Base Code / PageView
* **Event Name:** `PageView`
* **Pixel ID:** `1098001739077576`
* **Event ID:** `{{dlv - event_id}}` *(Deduplication-এর জন্য বাধ্যতামূলক)*
* **Trigger:** `CE - page_view`

---

### খ) Meta Ecommerce Events

#### ১. `ViewContent` (Product View)
* **Event Name:** `ViewContent`
* **Event ID:** `{{dlv - event_id}}`
* **Parameters:**
  * `value`: `{{dlv - ecommerce.value}}`
  * `currency`: `BDT`
  * `content_type`: `product`
* **Trigger:** `CE - view_item`

#### ২. `AddToCart`
* **Event Name:** `AddToCart`
* **Event ID:** `{{dlv - event_id}}`
* **Parameters:**
  * `value`: `{{dlv - ecommerce.value}}`
  * `currency`: `BDT`
  * `content_type`: `product`
* **Trigger:** `CE - add_to_cart`

#### ৩. `InitiateCheckout`
* **Event Name:** `InitiateCheckout`
* **Event ID:** `{{dlv - event_id}}`
* **Parameters:**
  * `value`: `{{dlv - ecommerce.value}}`
  * `currency`: `BDT`
  * `num_items`: `{{dlv - ecommerce.items}}`
* **Trigger:** `CE - begin_checkout`

#### ৪. `Purchase` (Enhanced Matching সহ)
* **Event Name:** `Purchase`
* **Event ID:** `{{dlv - event_id}}`
* **Parameters:**
  * `value`: `{{dlv - ecommerce.value}}`
  * `currency`: `BDT`
  * `transaction_id`: `{{dlv - ecommerce.transaction_id}}`
* **Advanced Customer Information (User Data):**
  * `em`: `{{dlv - user_data.em}}`
  * `ph`: `{{dlv - user_data.ph}}`
  * `fn`: `{{dlv - user_data.fn}}`
  * `ln`: `{{dlv - user_data.ln}}`
  * `ct`: `{{dlv - user_data.ct}}`
* **Trigger:** `CE - purchase`

#### ৫. `Contact` (WhatsApp Click)
* **Event Name:** `Contact`
* **Event ID:** `{{dlv - event_id}}`
* **Trigger:** `CE - whatsapp_click`

#### ৬. `AddToWishlist`
* **Event Name:** `AddToWishlist`
* **Event ID:** `{{dlv - event_id}}`
* **Trigger:** `CE - add_to_wishlist`

---

## 🔄 ৬. Server-Side Tracking ও Meta CAPI ডিডুপ্লিকেশন মেকানিজম

আমাদের কোডবেসে ব্রাউজার সাইড ও সার্ভার সাইডের ট্র্যাকিং ১০০% পারফেক্টভাবে ম্যাচ করানোর জন্য **Universal Deduplication System** তৈরি আছে:

```
[ ব্রাউজার ইভেন্ট (Web GTM) ]  ─── event_id: "a3b1-4f92-..." ───► Meta Pixel
                                                                   │
                                                                   ▼ (Facebook Deduplication Engine)
                                                                   ▲
[ সার্ভার ইভেন্ট (Server CAPI) ] ─── event_id: "a3b1-4f92-..." ───► Meta Conversions API
```

1. **ইভেন্ট আইডি জেনারেশন:** `dataLayer.js`-এর `generateEventId()` প্রতিটি ইভেন্টে একটি ইউনিক ক্রিপ্টোগ্রাফিক UUID তৈরি করে (`crypto.randomUUID()`)।
2. **ম্যাচিং রুল:** ব্রাউজার পিক্সেল এবং সার্ভার সাইড উভয় স্থানেই একই `event_id` এবং `event_name` পাস করা হয়।
3. **রেজাল্ট:** ফেসবুক একই ইউজারের ডাবল ইভেন্ট রেকর্ড না করে ব্রাউজার ও সার্ভারের ডেটা একত্রিত করে **১০/১০ Event Quality Score** প্রদান করে।

---

## ✅ ৭. কোয়ালিটি চেকিং ও টেস্টিং চেকলিস্ট

সেটআপ সম্পন্ন করার পর যেভাবে টেস্ট করবে:

1. **GTM Preview Mode:** 
   * GTM-এ `Preview` বাটনে ক্লিক করে ওয়েবসাইট ওপেন করো।
   * প্রতিটি পেজ ভিজিট এবং বাটনে ক্লিক করে Tag Assistant-এ ইভেন্ট ফায়ার হওয়া চেক করো।
2. **Console Verification:** 
   * ব্রাউজারের Console-এ `window.dataLayer` টাইপ করো।
   * দেখতে পাবে প্রতিটি ইভেন্টের আগে `{ ecommerce: null }` পুশ হয়েছে এবং সবগুলো প্যারামিটার পুশ হয়েছে।
3. **Meta Pixel Helper:** 
   * ক্রোম এক্সটেনশন **Meta Pixel Helper** দিয়ে দেখো প্রতিটি ইভেন্টে গ্রিন টিক মার্ক ও `event_id` দেখাচ্ছে কিনা।
4. **GA4 DebugView:** 
   * Google Analytics 4-এর `Admin -> DebugView`-এ গিয়ে রিয়েল-টাইমে লাইভ ই-কমার্স ফানেল টেস্ট করো।
5. **Purchase Dedup Check:** 
   * অর্ডার কমপ্লিট হওয়ার পর `/thank-you` পেজটি রিলোড দাও।
   * চেক করে দেখো `sessionStorage`-এ `purchase_fired_...` থাকার কারণে দ্বিতীয়বার ডাবল পারচেজ ইভেন্ট ফায়ার হচ্ছে না।

---
**🎉 এই গাইডটি অনুসরণ করলে আপনার ওয়েবসাইটে কোনো ট্র্যাকিং ডাটা মিস হবে না এবং সম্পূর্ণ নির্ভুল ই-কমার্স ট্র্যাকিং চালু থাকবে!**
