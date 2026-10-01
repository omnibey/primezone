<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:git-push-rules -->
# Git Push Policy
- **NEVER** run `git push` automatically or proactively without explicit user instruction.
- Only run `git push` when the user explicitly asks to push to GitHub (e.g., "github a push koro", "push to github", "push koro").
- Local edits, tests, and builds can be performed, but remote push is strictly gated by explicit user request.
- **Pre-push Check**: ALWAYS check for and fix current IDE problems/errors in the active files before running `git push`. Do not push code with obvious syntax or type errors.
<!-- END:git-push-rules -->
