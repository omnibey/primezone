---
name: white-label-architecture
description: Guidelines and exact procedures for fully white-labeling the Kothbel eCommerce platform. Use this skill when auditing the codebase, cloning the repository for a new client, or refactoring hardcoded values to dynamic generic variants.
---

# White-Label Architecture Mastery

You are an expert software architect building a highly scalable, multi-tenant capable, white-labeled eCommerce platform. The platform must be "Brand Agnostic". 

When the user asks you to "white label the code" or "remove Kothbel specific code", you must follow the precise instructions in this skill.

## 1. Zero Hardcoding Policy
Never hardcode the brand name, contact information, domain, or specific secrets. If you see them, replace them with dynamic alternatives.

### Target Replacements
*   **Brand Name (Kothbel):** Replace with `process.env.NEXT_PUBLIC_STORE_NAME || "Store Name"` or fetch from `store_settings.store_name`.
*   **Domains (https://kothbel.com):** Replace with `process.env.NEXT_PUBLIC_SITE_URL`.
*   **API Domains (https://kothbel-api...):** Replace with `process.env.NEXT_PUBLIC_API_URL`.
*   **Emails (bayazidzaman@gmail.com, info@kothbel.com):** Replace with `process.env.NEXT_PUBLIC_SUPPORT_EMAIL` or `store_settings.layout.footer.email`.

## 2. Generic Browser Storage & State
Kothbel uses LocalStorage, Zustand, and BroadcastChannels for state management. Currently, these have hardcoded `kothbel_` prefixes. 
When refactoring, **replace all `kothbel_` prefixes with `store_`**.

*   `kothbel_profile` ➔ `store_profile`
*   `kothbel_latest_order` ➔ `store_latest_order`
*   `kothbel-cart-storage` ➔ `store-cart-storage`
*   `kothbel-wishlist-storage` ➔ `store-wishlist-storage`
*   `kothbel_viewed_products` ➔ `store_viewed_products`
*   `kothbel_image_sync` ➔ `store_image_sync`
*   `kothbel_vid` ➔ `store_vid`

## 3. Generic DOM IDs & ClassNames (Landing Pages)
The landing page HTML renderer (`HtmlRenderer.tsx`) injects specific IDs and classes.
*   `kothbel-landing-checkout` ➔ `store-landing-checkout`
*   `kothbel-buy-now` ➔ `store-buy-now`
*   `kothbel-html-content` ➔ `store-html-content`

## 4. Generic Security Secrets
Secrets used for cache invalidation or JWT signing must not contain specific brand names.
*   `kothbel_revalidate_123` ➔ `process.env.REVALIDATE_SECRET`
*   `kothbel-secret-fallback` ➔ `env.JWT_SECRET` (in Cloudflare Worker)

## 5. Cloudflare Worker (`worker/src`)
The worker handles the database and AI MCP Server.
1.  **Wrangler Config (`wrangler.toml`):** 
    *   **WARNING:** Do not change `wrangler.toml` in the main Kothbel repository, otherwise live deployments will break.
    *   **WHEN CLONING FOR A NEW CLIENT:** Change `name`, `database_name`, and `bucket_name` to use the new brand's generic identifiers (e.g., `brandname-api`, `brandname-db`).
2.  **MCP Servers (`routes/mcp.ts`, `routes/adminMcp.ts`):** 
    *   Change `kothbel-store-mcp` ➔ `store-mcp`.
    *   Change system prompts: `You are Kothbel's friendly expert...` ➔ `You are ${storeName}'s friendly expert...`.
    *   Change URI protocol from `kothbel://...` ➔ `store://...`.

## Action Checklist for Agents
When tasked with refactoring to white-label:
1. Use `grep_search` to find `kothbel` (case-insensitive) across `src/` and `worker/src/`.
2. Extract localStorage key migrations carefully (if users have existing carts, consider a migration script or accept cache loss).
3. Update `env.example` to ensure all new dynamic variables are documented.
4. Replace all string literals in React fallbacks (e.g., `alt="Kothbel Logo"`) with generic fallbacks (e.g., `alt="Store Logo"`).
