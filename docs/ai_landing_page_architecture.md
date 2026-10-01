# Upgraded Landing Page Architecture

This document explains the hybrid architecture of the White-label Store Landing Page Builder. We have upgraded the existing visual builder to give you the perfect balance between **ease of use** and **ultimate customization**.

## 1. The Core: Visual Block Builder
The primary way to build landing pages is through the Admin Dashboard's Visual Builder (`admin/products/[id]/landing`). 
- **Image Uploads Fixed**: You can now click "Gallery" to upload or select images directly from Cloudflare R2 for any image field (Hero backgrounds, logos, etc).
- **Working Order Form**: The built-in "Order Form" block perfectly syncs with your store's Delivery settings and places orders correctly.
- **Ease of Use**: Non-technical team members can easily drag and drop standard sections (Hero, FAQ, Testimonials) to build pages in seconds.

## 2. The Power Feature: "Custom HTML" Block
If you need a design that the standard blocks cannot achieve (e.g., a diagonal background, a unique video player, a custom CSS animation, or a crazy grid layout), you can use the **Custom HTML** widget.

You drag the Custom HTML block into your page, and paste raw HTML/Tailwind code into it. This is where AI comes in!

---

## 3. The AI Generator Prompt (Skill)
When you want AI (like Claude or ChatGPT) to design a completely custom, stunning section for your landing page, copy and paste this prompt:

### Copy and Paste this Prompt to the AI:

```text
Act as a world-class Frontend Engineer and Conversion Rate Optimization (CRO) expert. 
I am using a visual landing page builder that accepts raw HTML injected via `dangerouslySetInnerHTML`. 

I need you to write a single, stunning HTML snippet (using Tailwind CSS classes) for a specific landing page section.

### Project Context:
- Do NOT write a React component (`export default function...`). You must output ONLY raw HTML tags (`<section>`, `<div>`, etc).
- Use Tailwind CSS for all styling.
- Do NOT include any `<script>` tags or React hooks like `useState`. This is purely for visual presentation.
- If you need interactive elements (like an accordion), you must use purely CSS-based solutions (like `<details>` and `<summary>`) or standard HTML functionality, because JavaScript will not execute inside this block.

### Dealing with Images
- Use placeholder services like `https://placehold.co/800x600` or `https://source.unsplash.com/random/800x600/?fashion` for lifestyle photos, placeholder banners, or trust badges. Make sure they look visually stunning in the layout. The human developer will replace these URLs with actual CDN links from their Gallery later.

### Task:
Please generate a [INSERT SECTION TYPE E.G. "Stunning 3-column pricing table with a glowing gradient border on the middle plan"] using Tailwind CSS.
Make it fully responsive (mobile-first).

Please generate the raw HTML code now.
```

### Important Note on Checkouts:
Do NOT ask the AI to generate a Checkout or Order Form in the Custom HTML block, because standard HTML forms cannot easily hook into the `placeOrder` React API. 
Always use the native **Order Form** widget provided in the Admin Sidebar for your checkout section. Use AI for visual sections like Heroes, Features, or Testimonials.
