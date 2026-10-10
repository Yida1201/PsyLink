# Project instructions
Use gstack /browse for all web browsing. Never use claude-in-chrome tools.
Read DESIGN.md before visual changes. Preserve modern tactile coherence.
Never present demonstration professionals, appointments or transcripts as real services.
Never log or persist chat contents by default. Keep OpenAI keys server-side.
Run bun run typecheck, bun test and bun run build for substantial changes.
Public AI launch requires actual expert content/safety review and configured services; never silently enable it.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
