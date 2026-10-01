# 📦 White-label Store GTM & Tracking Setup Directory

এই ডিরেক্টরিতে Google Tag Manager (Web & Server), GA4, Meta Pixel (CAPI) এবং DataLayer-এর সমস্ত ফাইল সুন্দর সাব-ফোল্ডারে ভাগ করে রাখা হয়েছে।

---

## 🗂️ ফোল্ডার স্ট্রাকচার ও বিবরণ:

```text
gtm-setup/
├── containers/             # GTM Import JSON Files
│   ├── gtm_web_container.json     # Web GTM (14 GA4 Tags + 9 Meta Tags + Stape URL)
│   └── gtm_server_container.json  # Server GTM (GA4 Client + Server Variables)
├── docs/                   # Documentation & Setup Guides
│   ├── GTM_SETUP_GUIDE.md         # Full GTM Setup Guide (Bangla)
│   ├── DataLayer_Plan.md          # Complete DataLayer Specification & Events
│   └── Setup_Guide.txt            # Quick text reference
├── scripts/                # Helper / Data Scripts
│   └── generate_product_categories.js
└── README.md               # Master Directory Index
```

---

### 1️⃣ 📁 [`containers/`](file:///c:/Bayazid/White-label Store/gtm-setup/containers)
* 🌐 **[`gtm_web_container.json`](file:///c:/Bayazid/White-label Store/gtm-setup/containers/gtm_web_container.json)**: Web GTM কন্টেইনারে (`GTM-T3WL987S`) সরাসরি ইমপোর্ট করার জন্য।
* 🖥️ **[`gtm_server_container.json`](file:///c:/Bayazid/White-label Store/gtm-setup/containers/gtm_server_container.json)**: Server GTM কন্টেইনারে (`GTM-TMZLM5X8`) সরাসরি ইমপোর্ট করার জন্য।

### 2️⃣ 📁 [`docs/`](file:///c:/Bayazid/White-label Store/gtm-setup/docs)
* 📘 **[`GTM_SETUP_GUIDE.md`](file:///c:/Bayazid/White-label Store/gtm-setup/docs/GTM_SETUP_GUIDE.md)**: ডিজিটাল মার্কেটার বা ডেভেলপারদের জন্য ফুল গাইডলাইন।
* 📋 **[`DataLayer_Plan.md`](file:///c:/Bayazid/White-label Store/gtm-setup/docs/DataLayer_Plan.md)**: কোডবেসের সমস্ত DataLayer ইভেন্ট ও প্যারামিটার লিস্ট।
* 📝 **[`Setup_Guide.txt`](file:///c:/Bayazid/White-label Store/gtm-setup/docs/Setup_Guide.txt)**: কুইক রেফারেন্স ফাইল।

### 3️⃣ 📁 [`scripts/`](file:///c:/Bayazid/White-label Store/gtm-setup/scripts)
* ⚙️ **[`generate_product_categories.js`](file:///c:/Bayazid/White-label Store/gtm-setup/scripts/generate_product_categories.js)**: ক্যাটাগরি ও প্রোডাক্ট ডেটা হেল্পার স্ক্রিপ্ট।

---

### 🔗 মূল সোর্স কোড ফাইল:
* **DataLayer Utility:** [`src/lib/dataLayer.js`](file:///c:/Bayazid/White-label Store/src/lib/dataLayer.js)
