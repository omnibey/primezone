# Next Landing Page Admin Dashboard Analysis

## General Information
- **URL**: `https://admin.nextlandingpage.com/dashboard`
- **Page Title**: `Admin Panel`
- **Tech Stack**: React (Vite-based app), Tailwind CSS, Recharts (for charts), Goober (for CSS styling).

## Visual Elements & Features
1. **Sidebar Navigation**:
   - `📊 Dashboard` -> `/dashboard`
   - `📦 Orders` -> `/orders`
   - `🚧 Incomplete Orders` -> `/incomplete-orders`
   - `📈 Reports` -> `/reports`
   - `🛍️ Products` -> `/products`
   - `📷 Image Upload` -> `/image-upload`
   - `⚙️ Settings` -> `/settings`
   - `💰 Billing` -> `/billing`
2. **Help/Support Links**:
   - Tutorial Video (YouTube): `https://youtu.be/N90itXE1Jt0` ("প্ল্যাটফর্ম ব্যবহার শিখুন")
   - WhatsApp Support: `01313-367959`
3. **Billing Info Banner**:
   - Free trial: `6 days left`
4. **Monthly Order Summary (Amount)**:
   - Contains a month input (`value="2026-08"`).
   - Rendered using Recharts SVG with legends: `Cancelled`, `Confirmed`, `Delivered`, `Hold`, `Net Sales`, `Pending`, `Processing`, `Total`.
5. **Dashboard Stat Cards**:
   - **Total Orders**: `0`
   - **Pending Orders**: `0`
   - **Confirmed Orders**: `0`
   - **Delivered Orders**: `0`
   - **Hold Orders**: `0`
   - **Processing Orders**: `0`
   - **Total Revenue**: `৳0`
   - **Cancelled Orders**: `0`
6. **Quick Actions**:
   - `Review Pending Orders`
   - `Review Hold Orders`
   - `View Processing Orders`
   - `Manage Products`
   - `Site Settings`
   - `Order Report`

---

## Layout Tree (Extracted HTML Structure)
Here is the extracted structural layout tree of the dashboard. This shows how the Tailwind CSS classes are applied to build the UI:

```html
<div id="root">
  <div></div>
  <div class="min-h-dvh overflow-x-clip bg-slate-100...">
    
    <!-- Sidebar / Navigation -->
    <aside class="fixed inset-y-0 left-0...">
      <div class="relative shrink-0 border-b...">
        <button class="absolute right-3 top-3...">
          <svg><path></path></svg>
        </button>
        <img class="mx-auto h-10 w-auto..."></img>
        <p class="mt-2 text-center text-xs..."> Admin Panel</p>
      </div>
      <nav class="custom-scrollbar min-h-0 flex-1...">
        <a class="mb-0.5 flex min-h-11..."><span class="mr-3 text-base..."> 📊</span><span class="font-medium..."> Dashboard</span></a>
        <a class="mb-0.5 flex min-h-11..."><span class="mr-3 text-base..."> 📦</span><span class="font-medium..."> Orders</span></a>
        <!-- Other nav links omitted for brevity -->
      </nav>
      <div class="shrink-0 space-y-2 border-t...">
        <!-- Support Links & User Info -->
        <a class="flex w-full min-h-11..."><span class="flex h-8 w-8..."><svg><path></path></svg></span><span class="min-w-0 flex-1 text-left..."><span class="block text-[10px] font-medium..."> TUTORIAL VIDEO</span><span class="block truncate text-sm..."> প্ল্যাটফর্ম ব্যবহার শিখুন</span></span></a>
        <a class="flex w-full min-h-11..."><span class="relative flex h-8..."><span class="pointer-events-none absolute inset-0..."></span><svg><path></path></svg></span><span class="min-w-0 flex-1 text-left..."><span class="block text-[10px] font-medium..."> WHATSAPP SUPPORT</span><span class="block truncate text-sm..."> 01313-367959</span></span></a>
        <div class="rounded-lg bg-white/5 px-3..."><p class="text-[10px] uppercase tracking-wide..."> LOGGED IN AS</p><p class="truncate text-sm font-semibold..."> White-label Store</p></div>
        <button class="min-h-10 w-full rounded-lg..."> Logout</button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex min-h-dvh min-w-0...">
      
      <!-- Topbar Header -->
      <header class="sticky top-0 z-20...">
        <div class="flex items-center justify-between...">
          <div class="flex min-w-0 items-center...">
            <button class="inline-flex h-10 w-10..."><span class="sr-only..."> Open sidebar</span><svg><path></path></svg></button>
            <h2 class="truncate text-base font-semibold..."> Dashboard</h2>
          </div>
          <div class="flex min-w-0 shrink-0...">
            <a class="group inline-flex max-w-[min(100%,11rem)]..."><span class="flex h-6 w-6..."><svg><path></path></svg></span><span class="min-w-0 flex flex-col..."><span class="hidden text-[10px] font-semibold..."> FREE TRIAL</span><span class="truncate text-xs font-semibold..."> 6 days left</span><span class="mt-1 hidden h-1..."><span class="block h-full rounded-full..."></span></span></span></a>
            <div class="hidden items-center gap-2..."><span class="flex h-7 w-7..."> K</span><span class="max-w-[110px] truncate text-sm..."> White-label Store</span></div>
          </div>
        </div>
      </header>

      <!-- Main Dashboard View -->
      <main class="min-w-0 flex-1 overflow-x-clip...">
        <div class="space-y-4 sm:space-y-6...">
          
          <!-- Chart Section -->
          <div class="w-full max-w-full bg-white...">
            <div class="flex items-center gap-2..."><h2 class="text-lg font-semibold mb-2..."> Monthly Order Summary (Amount)</h2><div class="flex items-center gap-2..."><input class="border-2 border-gray-200 px-3..."></input></div></div>
            <div class="recharts-responsive-container...">
              <!-- Recharts SVG content -->
            </div>
          </div>
          
          <!-- Stats Grid -->
          <div class="grid grid-cols-1 min-[380px]:grid-cols-2...">
            <div class="bg-blue-500 rounded-lg shadow-lg..."><div class="flex justify-between flex-col..."><div class="min-w-0..."><p class="text-white/80 text-xs sm:text-sm..."> Total Orders</p><p class="text-2xl sm:text-3xl font-bold..."> 0</p></div><span class="text-3xl md:text-5xl opacity-80..."> 📦</span></div><a class="block mt-3 sm:mt-4..."> View all →</a></div>
            <div class="bg-yellow-500 rounded-lg shadow-lg..."><div class="flex justify-between flex-col..."><div class="min-w-0..."><p class="text-white/80 text-xs sm:text-sm..."> Pending Orders</p><p class="text-2xl sm:text-3xl font-bold..."> 0</p></div><span class="text-3xl md:text-5xl opacity-80..."> ⏳</span></div><a class="block mt-3 sm:mt-4..."> View all →</a></div>
            <!-- Other Stat Cards omitted for brevity -->
            <div class="bg-orange-500 rounded-lg shadow-lg..."><div class="flex justify-between flex-col..."><div class="min-w-0..."><p class="text-white/80 text-xs sm:text-sm..."> Total Revenue</p><p class="text-2xl sm:text-3xl font-bold..."> ৳0</p></div><span class="text-3xl md:text-5xl opacity-80..."> 💰</span></div></div>
          </div>
          
          <!-- Quick Actions Grid -->
          <div class="bg-white rounded-lg shadow-sm...">
            <h2 class="text-lg sm:text-xl font-semibold..."> Quick Actions</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3...">
              <a class="p-4 border-2 border-dashed..."><span class="text-2xl mb-2 block..."> ⏳</span><p class="font-semibold text-gray-700 text-xs..."> Review Pending Orders</p></a>
              <a class="p-4 border-2 border-dashed..."><span class="text-2xl mb-2 block..."> 🛑</span><p class="font-semibold text-gray-700 text-xs..."> Review Hold Orders</p></a>
              <a class="p-4 border-2 border-dashed..."><span class="text-2xl mb-2 block..."> 🔄</span><p class="font-semibold text-gray-700 text-xs..."> View Processing Orders</p></a>
              <a class="p-4 border-2 border-dashed..."><span class="text-2xl mb-2 block..."> 🛍️</span><p class="font-semibold text-gray-700 text-xs..."> Manage Products</p></a>
              <a class="p-4 border-2 border-dashed..."><span class="text-2xl mb-2 block..."> ⚙️</span><p class="font-semibold text-gray-700 text-xs..."> Site Settings</p></a>
              <a class="p-4 border-2 border-dashed..."><span class="text-2xl mb-2 block..."> 📊</span><p class="font-semibold text-gray-700 text-xs..."> Order Report</p></a>
            </div>
          </div>

        </div>
      </main>
    </div>
  </div>
</div>
```
