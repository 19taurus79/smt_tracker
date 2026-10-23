<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Telegram Bot Menu Rule
**CRITICAL**: NEVER set the Telegram bot chat menu button to `type: "web_app"` ("⚡️ Трекер"). 
The chat menu button in the bottom-left corner MUST ALWAYS remain `type: "commands"` (`[/]` Menu) to preserve access to the command list (`/start`, `/app`, `/results`, `/rules`, `/coach`, `/help`). 
Mini App opening is handled via inline keyboard buttons in messages or `/app`, never by overwriting the persistent chat commands menu button.
