<!-- BEGIN:git-push-rules -->
# Git Push Policy
- **NEVER** run `git push` automatically or proactively without explicit user instruction.
- Only run `git push` when the user explicitly asks to push to GitHub (e.g., "github a push koro", "push to github", "push koro").
- Local edits, tests, and builds can be performed, but remote push is strictly gated by explicit user request.
- **Pre-push Check**: ALWAYS check for and fix current IDE problems/errors in the active files before running `git push`. Do not push code with obvious syntax or type errors.
<!-- END:git-push-rules -->

<!-- BEGIN:white-label-rules -->
# White-Label Architecture Guidelines
- **Zero Hardcoding Policy**: Avoid hardcoding store-specific brand names (e.g. "Kothbel"), hardcoded domains (e.g. "https://kothbel.com"), or hardcoded contact information in new components, API routes, or tools.
- **Dynamic Configuration**:
  - All store metadata (Store Name, Tagline, Logo, Favicon, Contact Email, Currency, Delivery Fees, SEO Meta, Pixels) must be dynamically loaded from `store_settings` or environment variables.
  - Always use `process.env.NEXT_PUBLIC_SITE_URL` for sitemaps, canonical URLs, OG images, and schema markup.
  - Always use `process.env.NEXT_PUBLIC_API_URL` for API endpoints.
- **Order ID Prefix**: Keep order ID generation configurable (e.g. dynamic prefix from settings) rather than rigidly hardcoded.
- **Generic Storage Keys**: Use generic or configurable keys for browser storage (e.g. `store_cart`, `store_profile`, `store_session`).
- **AI & MCP Servers**: Ensure AI prompts, MCP server names, and system instructions in `worker/src/routes/mcp.ts` and `adminMcp.ts` dynamically reference the store name and settings.
- **Brand Agnostic Development**: Every new page, feature, admin UI, or backend module must be built so the entire project can be instantly cloned, rebranded, and deployed for any other eCommerce store or client.
<!-- END:white-label-rules -->
