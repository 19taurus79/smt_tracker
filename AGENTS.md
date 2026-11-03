<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Telegram Bot Menu Rule
**CRITICAL**: NEVER set the Telegram bot chat menu button to `type: "web_app"` ("⚡️ Трекер"). 
The chat menu button in the bottom-left corner MUST ALWAYS remain `type: "commands"` (`[/]` Menu) to preserve access to the command list (`/start`, `/app`, `/results`, `/rules`, `/coach`, `/help`). 
Mini App opening is handled via inline keyboard buttons in messages or `/app`, never by overwriting the persistent chat commands menu button.

## Telegram Serverless Architecture Rule
**CRITICAL**: This project runs 100% on **Telegram Serverless** (`tgcloud`).
- The backend and database live strictly in `tgcloud/` (`tgcloud/schema.js` for SQLite, `tgcloud/endpoints/` for Mini App API, `tgcloud/handlers/` for bot updates).
- The front-end is hosted as a static export (`out/`) on `tgcloud.ai`.
- NEVER create or rely on Next.js server API routes (`src/app/api/...`) or local JSON files (`data/trainees.json`) for data persistence.
- Single source of truth is the dedicated SQLite database managed via `@tgcloud/cli`.
- CLI commands: `npx @tgcloud/cli push` (deploy), `npx @tgcloud/cli migrate` (DB schema), `npx @tgcloud/cli run endpoints/<name>` (test).
