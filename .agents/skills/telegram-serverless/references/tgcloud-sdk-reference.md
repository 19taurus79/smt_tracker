# tgcloud SDK Detailed Reference

This reference is an in-depth companion to the `telegram-serverless` skill for the Antigravity agent and developers.

---

## 1. Runtime Imports

```js
import { db, api, fetch, InputFile, BotApiError, EndpointError } from 'sdk';
// Submodules:
import { table, integer, text, real, boolean, json, blob, eq, and, or, sql, desc, asc } from 'sdk/db';
import { api } from 'sdk/api';
import { fetch } from 'sdk/fetch';
```

---

## 2. Database Schema Types & Modifiers

### Data Types
- `integer(name?, opts?)`: INTEGER (mode: `'boolean'`, `'timestamp'`, `'timestamp_ms'`)
- `text(name?, opts?)`: TEXT (mode: `'json'`)
- `real(name?)` / `float(name?)`: REAL floating-point
- `numeric(name?)`: NUMERIC
- `blob(name?)`: BLOB (takes & returns `Uint8Array`)
- `boolean(name?)`: Sugar for `integer(name, { mode: 'boolean' })`
- `json(name?)`: Sugar for `text(name, { mode: 'json' })`

### Chainable Modifiers
- `.primaryKey({ autoIncrement?: boolean })`
- `.notNull()`
- `.unique()`
- `.default(value | sql`...`)`
- `.deprecated('reason')` (marks column/index/table for removal upon `npx tgcloud migrate`)

### Rules
- **No Foreign Keys**: `.references()` and `foreignKey()` throw at definition time.
- **Async Execution**: Always `await` builder calls (`.all()`, `.get()`, `.run()`, `db.$count()`).

---

## 3. Query Operations

### Select
```js
// All rows
const list = await db.select().from(table).all();

// Filter & Order
const filtered = await db.select()
  .from(table)
  .where(and(eq(table.status, 'active'), gt(table.score, 50)))
  .orderBy(desc(table.createdAt))
  .limit(20)
  .all();

// Single row (or null)
const single = await db.select().from(table).where(eq(table.id, 1)).get();

// Count
const count = await db.$count(table, eq(table.status, 'active'));
```

### Insert / Update / Delete
```js
// Insert with RETURNING
const [inserted] = await db.insert(table)
  .values({ col1: 'val', col2: 123 })
  .returning()
  .run();

// Upsert (onConflictDoUpdate)
await db.insert(table)
  .values({ telegramId: user.id, username: 'test' })
  .onConflictDoUpdate({
    target: table.telegramId,
    set: { username: 'test', updatedAt: sql`(unixepoch())` }
  })
  .run();

// Update
await db.update(table).set({ status: 'completed' }).where(eq(table.id, 1)).run();

// Delete
await db.delete(table).where(eq(table.id, 1)).run();
```

---

## 4. Endpoints & Context (`endpoints/`)

```js
// tgcloud/endpoints/myAction.js
import { db, EndpointError } from 'sdk';

export default async function (input, ctx) {
  // ctx.initData is verified by Telegram infrastructure
  const user = ctx.initData?.user;
  if (!user) {
    throw new EndpointError('Unauthorized', { code: 'UNAUTHORIZED' });
  }

  // Handle operation
  return { ok: true, data: result };
}
```

Mini App Frontend invocation:
```js
Telegram.WebApp.Serverless.call('myAction', { payload: 123 }, function (err, result) {
  if (err) {
    console.error('Serverless error:', err.message, err.type, err.parameters);
    return;
  }
  console.log('Result:', result);
});
```

---

## 5. Handlers & Updates (`handlers/`)

```js
// tgcloud/handlers/message.js
import { api, db } from 'sdk';

export default async function (message, ctx) {
  const chatId = message.chat.id;
  await api.sendMessage({
    chat_id: chatId,
    text: `Echo: ${message.text}`,
  });
}
```

Update types match Telegram Bot API:
- `handlers/message.js` (incoming messages)
- `handlers/callback_query.js` (inline keyboard clicks)
- `handlers/inline_query.js` (inline searches)
- `handlers/pre_checkout_query.js` (Telegram Stars / payment pre-checks)
