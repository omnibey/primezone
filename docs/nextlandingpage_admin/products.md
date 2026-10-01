# Next Landing Page Admin - Products Page Analysis

## Page Route
- URL: `https://admin.nextlandingpage.com/products`
- Purpose: Displays list of products managed by the current logged-in user, with options to manage product settings, launch the landing page design editor, view a live preview, or duplicate/delete products.

---

## 1. UI Layout Overview
The page follows a classic Admin Dashboard layout divided into two main panels:

1. **Sidebar Navigation (Left Panel)**
   - Occupies a fixed width of `w-64` (on medium screens and up) or fits within mobile drawers.
   - Dark theme styling (`bg-slate-900 text-white`).
   - Sticky sidebar containing:
     - Logo / Branding Header
     - Main Nav Links (Dashboard, Orders, Incomplete Orders, Reports, Products [Active], Image Upload, Settings, Billing)
     - Support Action Buttons (Tutorial Video, WhatsApp Support)
     - User Info ("Logged in as: White-label Store")
     - Logout Button
2. **Main Workspace Panel (Right Panel)**
   - Occupies the remaining width (`md:ml-64`).
   - Content area background: Light grey (`bg-slate-100`).
   - Inner structure:
     - **Header Bar (Sticky Top)**: Shows page title navigation and user trial/billing info.
     - **Page Container**: Main layout container (`px-3 py-4 sm:px-6 lg:px-8`) which lists page-specific dashboard contents.

---

## 2. Inferred React Components Structure

Based on DOM tags and layout nesting, the page is built using the following component hierarchy:

- `<Layout>` (Global layout wrapper)
  - `<Sidebar>` (Left navigation panel)
    - `<SidebarHeader>` (Branding & Logo)
    - `<SidebarNavigation>` (Active and inactive links list)
    - `<SidebarFooter>` (Help/Tutorial buttons, logged user info, and logout action button)
  - `<MainContentWrapper>` (Outer container for top header & workspace area)
    - `<Header>` (Top sticky bar component)
      - `<HeaderTitle>` (Displays "Products")
      - `<TrialStatus>` (Subscription/billing remaining status)
      - `<UserProfileAvatar>` (Shows avatar letter and name)
    - `<ProductsPage>` (Page-level component)
      - `<PageHeader>` (Title and Add Product controls wrapper)
        - `<AddProductButton>` (Triggers add product flow)
      - `<ProductGrid>` (Responsive grid layout)
        - `<ProductCard>` (Product card item)

---

## 3. Product Card UI Component Structure

Each product card displays metadata and management actions for a specific landing page product.

### HTML Structure and Classes
```html
<div class="bg-white rounded-lg shadow-sm p-4 sm:p-6 min-w-0">
  <!-- Title & Status Header -->
  <div class="flex justify-between items-start mb-4 gap-2">
    <h3 class="text-lg sm:text-xl font-bold text-gray-800 break-words min-w-0">hi</h3>
    <span class="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Active</span>
  </div>

  <!-- Price & Metadata -->
  <div class="space-y-2 mb-4">
    <p class="text-2xl font-bold text-blue-600">৳99.87</p>
    <p class="text-sm text-gray-500">Stock: 0</p>
    <p class="text-xs text-gray-400">Slug: hello-product</p>
    <p class="text-xs text-gray-400">User ID: 191</p>
    <p class="text-xs text-gray-400">Domain: https://nextlandingpage.com</p>
  </div>

  <!-- Action Row 1: Edit / Delete -->
  <div class="flex gap-2">
    <button class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-sm transition-colors">Edit</button>
    <button class="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-sm transition-colors">Delete</button>
  </div>

  <!-- Primary CTA: Visual Editor Design Launch -->
  <div class="mt-4 text-center bg-orange-100 text-orange-800 p-2 rounded-lg">
    <a href="/products/landing-design/219">Design Your Landing Page</a>
  </div>

  <!-- Action Row 2: Live Preview / Duplicate -->
  <div class="flex gap-2 mt-3">
    <a class="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-sm transition-colors flex items-center justify-center" href="https://nextlandingpage.com/product/hello-product" target="_blank">Live Preview</a>
    <button class="flex-1 bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded-sm transition-colors">Duplicate</button>
  </div>
</div>
```

---

## 4. Key Tailwind CSS Styles Used

### Layout / Panels:
- **Root Context**: `min-h-dvh overflow-x-clip bg-slate-100`
- **Sidebar Aside**: `fixed inset-y-0 left-0 z-40 flex h-dvh w-[min(16rem,88vw)] flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-200 ease-in-out md:w-64 -translate-x-full md:translate-x-0`
- **Main Wrapper**: `flex min-h-dvh min-w-0 flex-col md:ml-64`
- **Sticky Header**: `sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md`
- **Inner Content Container**: `min-w-0 flex-1 overflow-x-clip px-3 py-4 min-[400px]:px-4 sm:px-6 sm:py-6 lg:px-8`
- **Product Cards Grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6`

### Product Card Details:
- **Card Wrapper**: `bg-white rounded-lg shadow-sm p-4 sm:p-6 min-w-0`
- **Heading**: `text-lg sm:text-xl font-bold text-gray-800 break-words min-w-0`
- **Status Badge (Active)**: `px-2 py-1 rounded text-xs bg-green-100 text-green-800`
- **Pricing**: `text-2xl font-bold text-blue-600`
- **Detail Labels**: `text-xs text-gray-400`
- **Buttons (General Flex Grid)**: `flex-1 px-3 sm:px-4 py-2 rounded-sm transition-colors`
- **Design CTA Button**: `mt-4 text-center bg-orange-100 text-orange-800 p-2 rounded-lg`

---

## 5. Main Functional Features Visible on Page
1. **Product Status Tracking**: Visual feedback indicating if a product is "Active".
2. **Direct Landing Page Editor Access**: "Design Your Landing Page" redirects to `/products/landing-design/<id>` where the user can build the landing page design.
3. **Public Product Preview**: "Live Preview" opens the public page URL in a new tab (`target="_blank"`).
4. **Product Replication**: "Duplicate" allows clone creation of an existing product template.
5. **Product Creation / Deletion**: "+ Add Product" button on top-right, and "Delete" button inside each product card.
6. **Billing and Trial Alerts**: Free trial alert banner (`bg-emerald-50 text-emerald-800 border-emerald-200`) showing days left.
