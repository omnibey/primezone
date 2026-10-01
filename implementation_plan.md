# Mobile Header Optimization Plan

## Goal
Optimize the mobile header layout so the hamburger and logo are cleanly aligned on the left, and the search, wishlist, and cart icons are properly clustered on the right, ensuring standard, clean UI practices without hacky CSS.

## Proposed Changes

### `src/components/Header.js`
- Convert `<div className="header-left-group">` into a flex container using inline styles or Tailwind classes (e.g., `style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}`).
- Remove any conflicting IDs from buttons that cause rogue CSS behaviors (like `id="mobileMenuBtn"` which injects `margin-right: 15px`).

### `public/src/style.css`
- Ensure `.header-left-group` is properly defined if we don't use inline styles.
- Tweak `.header-icon-btn` for mobile to reduce padding/background if they look too boxy, making them look like clean standard icons. 
- Remove outdated `#mobileMenuBtn` CSS rules that force layout issues.

## User Review Required
Please review if making the icons transparent (without the gray background box) on mobile is preferred, or if they should remain as gray squares.
