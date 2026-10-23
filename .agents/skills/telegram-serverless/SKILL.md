---
name: telegram-serverless
description: Expert guide for developing, deploying, and maintaining Telegram Serverless backends and hosting Mini Apps via tgcloud. Use this skill when writing or debugging modules in tgcloud/ (endpoints, handlers, lib, schema.js), managing SQLite database tables and migrations, invoking Telegram Bot API via sdk/api, communicating between Mini App frontends and serverless endpoints with Telegram.WebApp.Serverless.call, or deploying with the tgcloud CLI.
---

# Telegram Serverless (`tgcloud`) Development Skill

> **Official Telegram Serverless Documentation**: [core.telegram.org/bots/serverless](https://core.telegram.org/bots/serverless)  
> **Project Reference**: [`docs/docs-tgcloud.md`](file:///d:/Projects/smt_tracker/docs/docs-tgcloud.md) and [`docs/docs-tgcloud-agents.md`](file:///d:/Projects/smt_tracker/docs/docs-tgcloud-agents.md)

Telegram Serverless is an official, managed backend runtime that executes code for Telegram Bots and Mini Apps directly inside Telegram's core infrastructure. Developers write lightweight JavaScript modules executed in fast V8 isolates adjacent to the Bot API and an integrated SQLite database—eliminating the need for external servers, VPS, containerization, or manual webhook handling.

---

## 1. Project Anatomy & Layout

All serverless code runs from the **`tgcloud/`** directory. Only `.js` files within `tgcloud/` are deployed as code.

```bash
smt_tracker/
├── tgcloud/                  # Everything deployed to the Telegram Serverless runtime
│   ├── schema.js             # SQLite DB tables (named exports using sdk/db)
│   ├── endpoints/            # Functions called by the Mini App (POST /api/<name>)
│   │   ├── getTrainees.js
│   │   ├── saveWorkout.js
│   │   └── ...
│   ├── handlers/             # Bot API update handlers (message.js, callback_query.js)
│   │   └── message.js
│   └── lib/                  # Shared helper modules (subdirectories allowed)
├── tgcloud.jsonc             # Platform configuration (static hosting source)
├── docs/                     # Local SDK & AI documentation (not deployed)
├── out/                      # Next.js static build output (hosted by Serverless)
└── .tgcloud/                 # Local CLI state and credentials (git-ignored)
```

---

## 2. Critical Runtime Rules ("Rules that Bite")

The Telegram Serverless runtime is **not** a standard Node.js server. Strict platform constraints apply:

1. **Explicit Relative Imports with `.js`**:
   - ✅ `import { trainees } from '../schema.js'`
   - ✅ `import { formatTime } from '../lib/utils.js'`
   - ✅ `import { db, api, EndpointError } from 'sdk'`
   - ❌ `import { trainees } from '../schema'` *(will fail to resolve)*
   - ❌ `import x from '../../src/...'` *(cannot import outside `tgcloud/`)*
2. **Zero NPM Packages at Runtime**:
   - Only `sdk` (and submodules like `sdk/db`, `sdk/api`, `sdk/fetch`) and modules within `tgcloud/` exist in the V8 isolate.
3. **Every Database Call is Asynchronous**:
   - Always `await db.select()...run()`, `.all()`, `.get()`, and `db.$count()`. Omitting `await` returns an unresolved query builder.
4. **No Foreign Keys**:
   - SQLite `PRAGMA foreign_keys` is OFF. Calling `.references()` or `foreignKey()` **throws an error at declaration time**. Enforce relational integrity in your endpoint/handler logic.
5. **Two-Step Deploy & Schema Migrations**:
   - `npx tgcloud push` deploys code and static files only. It reports pending schema changes but never modifies the DB.
   - `npx tgcloud migrate` reviews and applies changes declared in `tgcloud/schema.js`.
6. **Drops require `.deprecated()`**:
   - Deleting a table or column from `schema.js` does *not* drop it from the database. You must mark it: `text('old_col').deprecated('reason')`.

---

## 3. Mini App Endpoints (`tgcloud/endpoints/`)

Endpoints are the server-side counterpart to your Mini App. They handle secure database updates, Bot API dispatches, and third-party API integration.

### Endpoint Implementation Pattern
Files in `tgcloud/endpoints/<name>.js` handle `POST /api/<name>`.

```javascript
// tgcloud/endpoints/saveWorkout.js
import { db, api, EndpointError } from 'sdk';
import { workoutLogs, trainees } from '../schema.js';
import { eq } from 'sdk/db';

export default async function (input, ctx) {
  // 1. ctx.initData is automatically verified by the Telegram infrastructure
  const user = ctx.initData?.user;
  if (!user) {
    throw new EndpointError('Unauthorized user', { code: 'UNAUTHORIZED' });
  }

  // 2. Validate input payload
  if (!input.workoutNumber || !input.durationSeconds) {
    throw new EndpointError('Missing required workout fields', { code: 'INVALID_INPUT' });
  }

  // 3. Write to SQLite database
  const [log] = await db.insert(workoutLogs)
    .values({
      traineeTelegramId: user.id,
      workoutNumber: input.workoutNumber,
      microcycle: input.microcycle || 1,
      durationSeconds: input.durationSeconds,
      tonnageKg: input.tonnageKg || 0,
      powerKgPerMin: input.powerKgPerMin || 0,
      athleticScore: input.athleticScore || 0,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .returning()
    .run();

  // 4. Return JSON response
  return { success: true, logId: log.id };
}
```

### Front-end Invocation: `Telegram.WebApp.Serverless.call`
Mini Apps call endpoints using the official SDK method without manually parsing tokens or HMAC hashes:

```typescript
// Client-side React / Next.js helper
export function callServerless<T = any>(endpoint: string, data: Record<string, any> = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.Telegram?.WebApp?.Serverless) {
      return reject(new Error('Telegram Serverless SDK not available'));
    }

    window.Telegram.WebApp.Serverless.call(endpoint, data, (err: any, result: T) => {
      if (err) {
        // err.type === 'ENDPOINT_ERROR' contains err.message and err.parameters
        return reject(err);
      }
      resolve(result);
    });
  });
}
```

---

## 4. Database Schema DSL (`tgcloud/schema.js`)

Tables are declared using a clean, Drizzle-like declarative syntax:

```javascript
import { table, integer, text, real, boolean, json, index, sql } from 'sdk/db';

export const trainees = table('trainees', {
  id:                integer('id').primaryKey({ autoIncrement: true }),
  telegramId:        integer('telegram_id').notNull().unique(),
  username:          text('username'),
  weightKg:          real('weight_kg').default(75.0),
  preferences:       json('preferences'),
  isActive:          boolean('is_active').default(true),
  createdAt:         integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  tgIdx: index('idx_trainees_tg').on(t.telegramId),
}));
```

### Standard Query Operations

```javascript
import { db, sql } from 'sdk';
import { eq, and, gt, desc } from 'sdk/db';
import { trainees } from '../schema.js';

// Select single row
const trainee = await db.select().from(trainees).where(eq(trainees.telegramId, tgId)).get();

// Select multiple rows with sorting & limits
const roster = await db.select()
  .from(trainees)
  .where(eq(trainees.isActive, true))
  .orderBy(desc(trainees.createdAt))
  .limit(50)
  .all();

// Upsert (Insert with onConflictDoUpdate)
await db.insert(trainees)
  .values({ telegramId: user.id, username: user.username })
  .onConflictDoUpdate({
    target: trainees.telegramId,
    set: { username: user.username },
  })
  .run();

// Count rows
const total = await db.$count(trainees, eq(trainees.isActive, true));
```

---

## 5. Bot API & Outbound HTTP

### Telegram Bot API (`import { api } from 'sdk'`)
Direct access to any Telegram Bot API method. Automatically unwraps responses and throws `BotApiError` on failure:

```javascript
import { api, BotApiError } from 'sdk';

try {
  await api.sendMessage({
    chat_id: user.id,
    text: 'Тренировка успешно сохранена в базе SMT!',
    parse_mode: 'HTML',
  });
} catch (err) {
  if (err instanceof BotApiError && err.code === 403) {
    console.warn(`User ${user.id} has blocked the bot.`);
  }
}
```

### Outbound Fetch (`import { fetch } from 'sdk'`)
HTTP requests inside V8 isolates without node dependencies:
```javascript
import { fetch } from 'sdk';

const res = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ model: 'gpt-4o', messages }),
});
const data = await res.json();
```

---

## 6. Mini App Static Hosting & `tgcloud.jsonc`

Telegram Serverless can serve your frontend at `https://app<app_id>.tgcloud.ai/`.

### Configuration (`tgcloud.jsonc`)
```jsonc
{
  "$schema": "https://tgcloud.ai/schema/tgcloud.json",
  "static": {
    "source": "out" // Directory containing static build output
  }
}
```

### Next.js Integration Flow
For Next.js projects (like SMT Tracker):
1. In `next.config.ts`, configure static export:
   ```typescript
   output: process.env.STATIC_EXPORT === "true" ? "export" : undefined
   ```
2. Build the static site into `out/`:
   ```bash
   $env:STATIC_EXPORT="true"; npm run build
   ```
3. Deploy frontend and backend together:
   ```bash
   npx tgcloud push
   ```

---

## 7. CLI Command Reference (`tgcloud`)

| Command | Purpose |
| :--- | :--- |
| `npx tgcloud login` | Connect workspace to your Telegram bot via CLI token from [@BotFather](https://t.me/BotFather) |
| `npx tgcloud status` | View local module changes vs. the deployed version |
| `npx tgcloud diff` | Inspect line-by-line code and schema changes |
| `npx tgcloud push` | Deploy changed `tgcloud/` modules and static front-end assets atomically |
| `npx tgcloud migrate` | Interactively review and apply pending database schema migrations |
| `npx tgcloud run <module> [json5_args]` | Test-run a handler or endpoint locally against the cloud runtime without deploying |
| `npx tgcloud pull` | Pull code and schema changes made in BotFather or on another machine |
| `npx tgcloud webhook` | Show bot webhook status and verify sync with current `handlers/` |

### Testing Endpoints Locally
```bash
npx tgcloud run endpoints/saveWorkout '{ workoutNumber: 1, durationSeconds: 3600 }' --ctx '{ initData: { user: { id: 548019148 } } }'
```
