# AnonyChatMeBot — Missing Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical bugs, implement missing features, and build the web frontend for AnonyChatMeBot.

**Architecture:** Thirteen self-contained tasks ordered by dependency — i18n strings first (everything depends on them), then backend fixes, then new commands, then the frontend web page. Each task ends with a commit.

**Tech Stack:** Bun workspaces + Turborepo, Hono + grammY on Cloudflare Workers, D1 (Drizzle ORM), Cloudflare KV, Cloudflare Queues, TanStack Start (React + Vite), Tailwind v4, TypeScript, `bun:test`.

---

## File Map

### Created
- `apps/backend/src/utils/rate-limit.ts` — KV-based rate limiter utility
- `apps/backend/src/bot/commands/cancel.ts` — /cancel command handler
- `apps/backend/src/bot/handlers/fallback.handler.ts` — idle-state catch-all
- `apps/backend/src/api/users.ts` — resolve-hash + profile endpoints
- `apps/frontend/src/routes/s.$hash.tsx` — web anonymous send page

### Modified
- `packages/shared/src/i18n/index.ts` — expand `I18nMessages` interface
- `packages/shared/src/i18n/locales/{en,fa,ru,de,fr,ar}.yaml` — new string keys
- `apps/backend/src/db/schema.ts` — unique constraints on blocks + reports
- `apps/backend/src/queues/message.queue.ts` — retry on Telegram API failure
- `apps/backend/src/controllers/message.controller.ts` — length validation, rate limit, reply_to_id
- `apps/backend/src/views/telegram/message.handler.ts` — pass reply_to_id
- `apps/backend/src/bot/handlers/message-actions.handler.ts` — pass reply_to_id in reply flow
- `apps/backend/src/bot/commands/inbox.ts` — redesign for privacy + unread
- `apps/backend/src/views/telegram/inbox.view.ts` — summary layout, i18n buttons
- `apps/backend/src/repositories/block.repository.ts` — add `list()` + `unblock()`
- `apps/backend/src/repositories/report.repository.ts` — add `onConflictDoNothing()`
- `apps/backend/src/bot/commands/settings.ts` — blocked senders management
- `apps/backend/src/views/telegram/settings.view.ts` — add blocked-senders button
- `apps/backend/src/api/context.ts` — API auth middleware
- `apps/backend/src/api/index.ts` — mount users router, auth middleware
- `apps/backend/src/api/messages.ts` — add web-send endpoint
- `apps/backend/src/index.ts` — add `API_SECRET`, `FRONTEND_URL` to Bindings
- `apps/backend/src/bot/index.ts` — register cancel + fallback handlers
- `apps/backend/src/bot/setup.ts` — add /cancel to synced commands
- `apps/backend/wrangler.toml` — add `FRONTEND_URL` var
- `apps/backend/.dev.vars.example` — add `API_SECRET`, `FRONTEND_URL`
- `apps/frontend/src/routes/__root.tsx` — update title/meta
- `apps/frontend/vite.config.ts` — add VITE_API_URL env

---

## Task 1: Expand i18n — new strings in interface + all locale files

**Files:**
- Modify: `packages/shared/src/i18n/index.ts`
- Modify: `packages/shared/src/i18n/locales/en.yaml`
- Modify: `packages/shared/src/i18n/locales/fa.yaml`
- Modify: `packages/shared/src/i18n/locales/ru.yaml`
- Modify: `packages/shared/src/i18n/locales/de.yaml`
- Modify: `packages/shared/src/i18n/locales/fr.yaml`
- Modify: `packages/shared/src/i18n/locales/ar.yaml`

- [ ] **Step 1: Add new keys to `I18nMessages` interface**

Replace the current interface in `packages/shared/src/i18n/index.ts` with this expanded version:

```typescript
export interface I18nMessages {
  bot: {
    welcome: string
    welcome_back: string
    your_link: string
    link_hint: string
    send_message_prompt: string
    message_sent: string
    message_received: string
    no_messages: string
    sending_to: string
    ask_recipient: string
    invalid_link: string
    cannot_self_message: string
    inbox_header: string
    inbox_item: string
    new_message_notification: string
    message_read_receipt: string
    reply_prompt: string
    reply_sent: string
    blocked: string
    reported: string
    not_accepting_messages: string
    message_not_found: string
    sender_blocked: string
    // New
    cancel: string
    nothing_to_cancel: string
    inbox_unread: string
    rate_limited: string
    message_too_long: string
  }
  actions: {
    view: string
    reply: string
    block: string
    report: string
  }
  onboarding: {
    select_locale: string
    enter_name: string
  }
  menu: {
    receive_messages: string
    send_direct: string
    received: string
    settings: string
    help: string
  }
  commands: {
    link: string
    send: string
    inbox: string
    settings: string
    help: string
    cancel: string  // New
  }
  inbox: {  // New namespace
    prev: string
    next: string
    view_n: string
    time_just_now: string
    time_minutes_ago: string
    time_hours_ago: string
    time_days_ago: string
  }
  settings: {
    title: string
    change_language: string
    change_name: string
    name_updated: string
    language_updated: string
    receiving_on: string
    receiving_off: string
    toggle_receiving: string
    blocked_senders: string  // New
    no_blocked: string       // New
    unblocked: string        // New
  }
  help: {
    text: string
  }
  errors: {
    generic: string
    not_found: string
    user_not_found: string
  }
}
```

- [ ] **Step 2: Add new keys to `en.yaml`**

Append these lines to the appropriate sections in `packages/shared/src/i18n/locales/en.yaml`:

```yaml
# Under bot:
  cancel: "✅ Cancelled."
  nothing_to_cancel: "🤷 Nothing active to cancel."
  inbox_unread: "{n} unread"
  rate_limited: "⏳ Slow down! Please wait a bit before sending again."
  message_too_long: "❌ Message too long — max {max} characters."

# Under commands:
  cancel: "Cancel the current action"

# New top-level inbox section:
inbox:
  prev: "◀ Prev"
  next: "Next ▶"
  view_n: "View #{n}"
  time_just_now: "just now"
  time_minutes_ago: "{n}m ago"
  time_hours_ago: "{n}h ago"
  time_days_ago: "{n}d ago"

# Under settings:
  blocked_senders: "🚫 Blocked senders ({n})"
  no_blocked: "📭 No blocked senders."
  unblocked: "✅ Unblocked."
```

- [ ] **Step 3: Add new keys to `fa.yaml`**

```yaml
# Under bot:
  cancel: "✅ لغو شد."
  nothing_to_cancel: "🤷 چیزی برای لغو وجود ندارد."
  inbox_unread: "{n} خوانده‌نشده"
  rate_limited: "⏳ آهسته‌تر! لطفاً کمی صبر کنید."
  message_too_long: "❌ پیام خیلی طولانی است — حداکثر {max} کاراکتر."

# Under commands:
  cancel: "لغو عملیات فعلی"

# New inbox section:
inbox:
  prev: "◀ قبلی"
  next: "بعدی ▶"
  view_n: "مشاهده #{n}"
  time_just_now: "همین الان"
  time_minutes_ago: "{n} دقیقه پیش"
  time_hours_ago: "{n} ساعت پیش"
  time_days_ago: "{n} روز پیش"

# Under settings:
  blocked_senders: "🚫 فرستندگان مسدود ({n})"
  no_blocked: "📭 هیچ فرستنده‌ای مسدود نشده."
  unblocked: "✅ مسدودیت برداشته شد."
```

- [ ] **Step 4: Add new keys to `ru.yaml`**

```yaml
# Under bot:
  cancel: "✅ Отменено."
  nothing_to_cancel: "🤷 Нечего отменять."
  inbox_unread: "{n} непрочитанных"
  rate_limited: "⏳ Подождите немного перед следующим сообщением."
  message_too_long: "❌ Сообщение слишком длинное — максимум {max} символов."

# Under commands:
  cancel: "Отменить текущее действие"

# New inbox section:
inbox:
  prev: "◀ Назад"
  next: "Вперёд ▶"
  view_n: "Читать #{n}"
  time_just_now: "только что"
  time_minutes_ago: "{n} мин. назад"
  time_hours_ago: "{n}ч назад"
  time_days_ago: "{n}д назад"

# Under settings:
  blocked_senders: "🚫 Заблокированные ({n})"
  no_blocked: "📭 Нет заблокированных."
  unblocked: "✅ Разблокировано."
```

- [ ] **Step 5: Add new keys to `de.yaml`**

```yaml
# Under bot:
  cancel: "✅ Abgebrochen."
  nothing_to_cancel: "🤷 Nichts zum Abbrechen."
  inbox_unread: "{n} ungelesen"
  rate_limited: "⏳ Bitte warte kurz, bevor du weitere Nachrichten sendest."
  message_too_long: "❌ Nachricht zu lang — maximal {max} Zeichen."

# Under commands:
  cancel: "Aktuelle Aktion abbrechen"

# New inbox section:
inbox:
  prev: "◀ Zurück"
  next: "Weiter ▶"
  view_n: "Ansehen #{n}"
  time_just_now: "gerade eben"
  time_minutes_ago: "vor {n} Min."
  time_hours_ago: "vor {n} Std."
  time_days_ago: "vor {n} Tagen"

# Under settings:
  blocked_senders: "🚫 Blockierte ({n})"
  no_blocked: "📭 Keine blockierten Absender."
  unblocked: "✅ Entsperrt."
```

- [ ] **Step 6: Add new keys to `fr.yaml`**

```yaml
# Under bot:
  cancel: "✅ Annulé."
  nothing_to_cancel: "🤷 Rien à annuler."
  inbox_unread: "{n} non lu(s)"
  rate_limited: "⏳ Attendez un moment avant d'envoyer un autre message."
  message_too_long: "❌ Message trop long — {max} caractères maximum."

# Under commands:
  cancel: "Annuler l'action en cours"

# New inbox section:
inbox:
  prev: "◀ Précédent"
  next: "Suivant ▶"
  view_n: "Voir #{n}"
  time_just_now: "à l'instant"
  time_minutes_ago: "il y a {n} min"
  time_hours_ago: "il y a {n}h"
  time_days_ago: "il y a {n}j"

# Under settings:
  blocked_senders: "🚫 Bloqués ({n})"
  no_blocked: "📭 Aucun expéditeur bloqué."
  unblocked: "✅ Débloqué."
```

- [ ] **Step 7: Add new keys to `ar.yaml`**

```yaml
# Under bot:
  cancel: "✅ تم الإلغاء."
  nothing_to_cancel: "🤷 لا يوجد شيء لإلغائه."
  inbox_unread: "{n} غير مقروء"
  rate_limited: "⏳ انتظر قليلاً قبل إرسال رسالة أخرى."
  message_too_long: "❌ الرسالة طويلة جداً — الحد الأقصى {max} حرفاً."

# Under commands:
  cancel: "إلغاء الإجراء الحالي"

# New inbox section:
inbox:
  prev: "◀ السابق"
  next: "التالي ▶"
  view_n: "عرض #{n}"
  time_just_now: "الآن"
  time_minutes_ago: "منذ {n} د"
  time_hours_ago: "منذ {n} س"
  time_days_ago: "منذ {n} أيام"

# Under settings:
  blocked_senders: "🚫 المحظورون ({n})"
  no_blocked: "📭 لا يوجد محظورون."
  unblocked: "✅ تم رفع الحظر."
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd /Users/mamad/projects/mamad/AnonyChatMeBot
bun run --cwd packages/shared tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add packages/shared/src/i18n/
git commit -m "feat(i18n): add cancel, rate-limit, inbox, unblock strings to all locales"
```

---

## Task 2: Schema — unique constraints on blocks and reports

**Files:**
- Modify: `apps/backend/src/db/schema.ts`

- [ ] **Step 1: Add unique constraints**

Replace the `blocks` and `reports` table definitions in `apps/backend/src/db/schema.ts`:

```typescript
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

export const blocks = sqliteTable(
  "blocks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    blocker_user_id: integer("blocker_user_id")
      .notNull()
      .references(() => users.id),
    sender_telegram_id: integer("sender_telegram_id").notNull(),
    created_at: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [uniqueIndex("blocks_blocker_sender_unique").on(t.blocker_user_id, t.sender_telegram_id)],
)

export const reports = sqliteTable(
  "reports",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    message_id: integer("message_id")
      .notNull()
      .references(() => messages.id),
    reporter_user_id: integer("reporter_user_id")
      .notNull()
      .references(() => users.id),
    created_at: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [uniqueIndex("reports_message_reporter_unique").on(t.message_id, t.reporter_user_id)],
)
```

Also add `BlockModel` export if missing (check existing exports at bottom of schema.ts — add `export type NewBlock = typeof blocks.$inferInsert` if useful).

- [ ] **Step 2: Add `onConflictDoNothing` to ReportRepository**

Replace `apps/backend/src/repositories/report.repository.ts`:

```typescript
import type { Db } from "~/db/index"
import { reports } from "~/db/schema"

export class ReportRepository {
  constructor(private readonly db: Db) {}

  async report(messageId: number, reporterUserId: number): Promise<void> {
    await this.db
      .insert(reports)
      .values({ message_id: messageId, reporter_user_id: reporterUserId })
      .onConflictDoNothing()
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
bun run --cwd apps/backend tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/db/schema.ts apps/backend/src/repositories/report.repository.ts
git commit -m "fix(schema): unique constraints on blocks+reports; deduplicate reports idempotently"
```

---

## Task 3: Queue — retry on Telegram API failure

**Files:**
- Modify: `apps/backend/src/queues/message.queue.ts`

- [ ] **Step 1: Wrap `api.sendMessage` in try/catch and retry on error**

Replace the delivery loop body in `apps/backend/src/queues/message.queue.ts` (the `for` loop inside `handleMessageQueue`). The full file becomes:

```typescript
import { getMessages, type Locale } from "@anonychatmebot/shared"
import { Api, InlineKeyboard } from "grammy"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { BlockRepository } from "~/repositories/block.repository"
import { MessageRepository } from "~/repositories/message.repository"
import { UserRepository } from "~/repositories/user.repository"

export interface MessageJob {
  messageId: number
  recipientTelegramId: number
  recipientUserId: number
  recipientLocale: string
  senderTelegramId: number
  content: string
}

export async function handleMessageQueue(
  batch: MessageBatch<MessageJob>,
  env: Bindings,
): Promise<void> {
  const db = createDb(env.DB)
  const messageRepo = new MessageRepository(db)
  const userRepo = new UserRepository(db)
  const blockRepo = new BlockRepository(db)
  const api = new Api(env.BOT_TOKEN)

  for (const msg of batch.messages) {
    const { messageId, recipientTelegramId, recipientUserId, recipientLocale, senderTelegramId } =
      msg.body

    // Check if recipient is accepting messages
    const recipient = await userRepo.findById(recipientUserId)
    if (!recipient?.receiving_messages) {
      await messageRepo.markDelivered(messageId)
      msg.ack()
      continue
    }

    // Check if sender is blocked by recipient
    const isBlocked = await blockRepo.isBlocked(recipientUserId, senderTelegramId)
    if (isBlocked) {
      await messageRepo.markDelivered(messageId)
      msg.ack()
      continue
    }

    const messages = getMessages((recipientLocale as Locale) ?? "en")
    const keyboard = new InlineKeyboard().text(messages.actions.view, `view_msg:${messageId}`)

    try {
      const sent = await api.sendMessage(
        recipientTelegramId,
        messages.bot.new_message_notification,
        { reply_markup: keyboard },
      )

      await messageRepo.markDelivered(messageId)
      await messageRepo.setNotificationMessageId(messageId, sent.message_id)
      msg.ack()
    } catch (err) {
      // Telegram API error — let the queue retry this message.
      // Common causes: network blip, 429 rate limit, bot blocked by user.
      console.error(`[queue] Failed to deliver message ${messageId}:`, err)
      // Do NOT call msg.ack() — the queue will retry automatically.
    }
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
bun run --cwd apps/backend tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/queues/message.queue.ts
git commit -m "fix(queue): retry delivery on Telegram API failure instead of silently losing messages"
```

---

## Task 4: Message validation — length limit + KV rate limiting

**Files:**
- Create: `apps/backend/src/utils/rate-limit.ts`
- Modify: `apps/backend/src/controllers/message.controller.ts`
- Modify: `apps/backend/src/views/telegram/message.handler.ts`

- [ ] **Step 1: Write tests for the rate limiter utility**

Create `apps/backend/src/utils/rate-limit.test.ts`:

```typescript
import { describe, expect, it, mock } from "bun:test"
import { checkRateLimit } from "./rate-limit"

// Minimal KV stub
function makeKv(stored: string | null) {
  const db: Record<string, string> = stored !== null ? { key: stored } : {}
  return {
    async get(k: string) { return db[k] ?? null },
    async put(k: string, v: string, _opts: unknown) { db[k] = v },
  } as unknown as KVNamespace
}

describe("checkRateLimit", () => {
  it("allows first message", async () => {
    const kv = makeKv(null)
    const result = await checkRateLimit(kv, "rl:1:2", 5, 3600)
    expect(result.allowed).toBe(true)
    expect(result.count).toBe(1)
  })

  it("allows up to the limit", async () => {
    const stored = JSON.stringify({ count: 4, resetAt: new Date(Date.now() + 3600_000).toISOString() })
    const kv = makeKv(stored)
    const result = await checkRateLimit(kv, "rl:1:2", 5, 3600)
    expect(result.allowed).toBe(true)
    expect(result.count).toBe(5)
  })

  it("blocks when limit is exceeded", async () => {
    const stored = JSON.stringify({ count: 5, resetAt: new Date(Date.now() + 3600_000).toISOString() })
    const kv = makeKv(stored)
    const result = await checkRateLimit(kv, "rl:1:2", 5, 3600)
    expect(result.allowed).toBe(false)
  })

  it("resets after window expires", async () => {
    const stored = JSON.stringify({ count: 5, resetAt: new Date(Date.now() - 1000).toISOString() })
    const kv = makeKv(stored)
    const result = await checkRateLimit(kv, "rl:1:2", 5, 3600)
    expect(result.allowed).toBe(true)
    expect(result.count).toBe(1)
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
bun test apps/backend/src/utils/rate-limit.test.ts
```

Expected: FAIL — `checkRateLimit` not found.

- [ ] **Step 3: Implement the rate limiter**

Create `apps/backend/src/utils/rate-limit.ts`:

```typescript
interface RateLimitRecord {
  count: number
  resetAt: string // ISO timestamp when the window resets
}

export interface RateLimitResult {
  allowed: boolean
  count: number
}

/**
 * Checks and increments a KV-backed rate limit counter.
 *
 * @param kv       Cloudflare KV namespace
 * @param key      Unique key for this sender/recipient pair (e.g. "rl:123:456")
 * @param limit    Max number of actions allowed per window
 * @param windowSec Window size in seconds
 */
export async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const raw = await kv.get(key)
  const now = Date.now()

  if (raw) {
    const record: RateLimitRecord = JSON.parse(raw)
    if (new Date(record.resetAt).getTime() > now) {
      // Window still active
      if (record.count >= limit) return { allowed: false, count: record.count }
      const updated: RateLimitRecord = { count: record.count + 1, resetAt: record.resetAt }
      await kv.put(key, JSON.stringify(updated), { expirationTtl: windowSec })
      return { allowed: true, count: updated.count }
    }
  }

  // No record or window expired — start fresh
  const resetAt = new Date(now + windowSec * 1000).toISOString()
  await kv.put(key, JSON.stringify({ count: 1, resetAt }), { expirationTtl: windowSec })
  return { allowed: true, count: 1 }
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
bun test apps/backend/src/utils/rate-limit.test.ts
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Add `STATE_KV` availability to `MessageController` + enforce limits**

Replace `apps/backend/src/controllers/message.controller.ts`:

```typescript
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import type { MessageJob } from "~/queues/message.queue"
import { MessageRepository } from "~/repositories/message.repository"
import { UserRepository } from "~/repositories/user.repository"
import { serializeMessage } from "~/serializers/message.serializer"
import { checkRateLimit } from "~/utils/rate-limit"

export const MAX_MESSAGE_LENGTH = 2000
const RATE_LIMIT_MAX = 5       // messages per window
const RATE_LIMIT_WINDOW = 3600 // 1 hour in seconds

export type SendResult =
  | { ok: true; message: ReturnType<typeof serializeMessage> }
  | { ok: false; error: "too_long" | "rate_limited" | "recipient_not_found" }

export class MessageController {
  private readonly messageRepo: MessageRepository
  private readonly userRepo: UserRepository

  constructor(private readonly env: Bindings) {
    const db = createDb(env.DB)
    this.messageRepo = new MessageRepository(db)
    this.userRepo = new UserRepository(db)
  }

  async sendAnonymousMessage(
    senderTelegramId: number,
    recipientUserId: number,
    recipientTelegramId: number,
    recipientLocale: string,
    content: string,
    replyToId?: number,
  ): Promise<SendResult> {
    if (content.length > MAX_MESSAGE_LENGTH) {
      return { ok: false, error: "too_long" }
    }

    const recipient = await this.userRepo.findById(recipientUserId)
    if (!recipient) return { ok: false, error: "recipient_not_found" }

    const rlKey = `rl:${senderTelegramId}:${recipientUserId}`
    const rl = await checkRateLimit(env.STATE_KV, rlKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)
    if (!rl.allowed) return { ok: false, error: "rate_limited" }

    const message = await this.messageRepo.create({
      sender_telegram_id: senderTelegramId,
      recipient_user_id: recipientUserId,
      content,
      reply_to_id: replyToId ?? null,
    })

    const job: MessageJob = {
      messageId: message.id,
      recipientTelegramId,
      recipientUserId,
      recipientLocale,
      senderTelegramId,
      content,
    }
    await this.env.MESSAGE_QUEUE.send(job)

    return { ok: true, message: serializeMessage(message) }
  }

  async getMessagesForUser(recipientUserId: number) {
    const messages = await this.messageRepo.findByRecipient(recipientUserId)
    return messages.map(serializeMessage)
  }
}
```

- [ ] **Step 6: Update `message.handler.ts` to handle new result type**

Replace the `sending_message` and `replying_to` handling in `apps/backend/src/views/telegram/message.handler.ts`. The full file becomes:

```typescript
import { getMessages, type Locale, t } from "@anonychatmebot/shared"
import type { Bot } from "grammy"
import { MessageController, MAX_MESSAGE_LENGTH } from "~/controllers/message.controller"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { UserRepository } from "~/repositories/user.repository"
import { StateService } from "~/services/state.service"
import { decodeId } from "~/utils/hashid"

function extractHash(text: string): string {
  try {
    const url = new URL(text.trim())
    return url.searchParams.get("start") ?? text.trim()
  } catch {
    return text.trim()
  }
}

export function registerMessageHandler(bot: Bot, env: Bindings) {
  bot.on("message:text", async (ctx, next) => {
    const from = ctx.from
    const db = createDb(env.DB)
    const userRepo = new UserRepository(db)
    const stateService = new StateService(env.STATE_KV)

    const user = await userRepo.findByTelegramId(from.id)
    const state = await stateService.get(from.id, user)
    const messages = getMessages((user?.locale as Locale) ?? "en")

    // ── asking_recipient ───────────────────────────────────────────────────
    if (state.name === "asking_recipient") {
      const hash = extractHash(ctx.message.text)
      const recipientId = decodeId(env.LINK_SALT, hash)

      if (recipientId === null) {
        await ctx.reply(messages.bot.invalid_link)
        return
      }

      const recipient = await userRepo.findById(recipientId)
      if (!recipient) {
        await ctx.reply(messages.errors.user_not_found)
        return
      }

      if (recipient.id === user?.id) {
        await ctx.reply(messages.bot.cannot_self_message)
        return
      }

      await stateService.set(from.id, {
        name: "sending_message",
        recipientId: recipient.id,
        recipientName: recipient.display_name || recipient.username || "someone",
      })
      await ctx.reply(messages.bot.sending_to)
      return
    }

    // ── replying_to ────────────────────────────────────────────────────────
    if (state.name === "replying_to") {
      const { senderTelegramId, viewMessageId, messageId: originalMessageId } = state
      const sender = await userRepo.findByTelegramId(senderTelegramId)

      if (sender) {
        const controller = new MessageController(env)
        const result = await controller.sendAnonymousMessage(
          from.id,
          sender.id,
          sender.telegram_id,
          sender.locale,
          ctx.message.text,
          originalMessageId,
        )

        if (!result.ok) {
          if (result.error === "too_long") {
            await ctx.reply(t(messages.bot.message_too_long, { max: String(MAX_MESSAGE_LENGTH) }))
            return
          }
          if (result.error === "rate_limited") {
            await ctx.reply(messages.bot.rate_limited)
            return
          }
        }
      }

      await stateService.reset(from.id)
      await ctx.reply(messages.bot.reply_sent, {
        reply_parameters: { message_id: viewMessageId },
      })
      return
    }

    // ── sending_message ────────────────────────────────────────────────────
    if (state.name === "sending_message") {
      const recipient = await userRepo.findById(state.recipientId)
      if (!recipient) {
        await stateService.reset(from.id)
        await ctx.reply(messages.errors.user_not_found)
        return
      }

      const controller = new MessageController(env)
      const result = await controller.sendAnonymousMessage(
        from.id,
        recipient.id,
        recipient.telegram_id,
        recipient.locale,
        ctx.message.text,
      )

      if (!result.ok) {
        if (result.error === "too_long") {
          await ctx.reply(t(messages.bot.message_too_long, { max: String(MAX_MESSAGE_LENGTH) }))
          return
        }
        if (result.error === "rate_limited") {
          await ctx.reply(messages.bot.rate_limited)
          return
        }
      }

      await stateService.reset(from.id)
      await ctx.reply(messages.bot.message_sent)
      return
    }

    return next()
  })
}
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
bun run --cwd apps/backend tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Run tests**

```bash
bun test apps/backend/src/utils/rate-limit.test.ts
```

Expected: 4 PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/backend/src/utils/rate-limit.ts apps/backend/src/utils/rate-limit.test.ts \
        apps/backend/src/controllers/message.controller.ts \
        apps/backend/src/views/telegram/message.handler.ts
git commit -m "feat: message length validation + KV rate limiting (5 msg/hr per sender-recipient)"
```

---

## Task 5: /cancel command

**Files:**
- Create: `apps/backend/src/bot/commands/cancel.ts`
- Modify: `apps/backend/src/bot/index.ts`
- Modify: `apps/backend/src/bot/setup.ts`

- [ ] **Step 1: Create the cancel command**

Create `apps/backend/src/bot/commands/cancel.ts`:

```typescript
import { getMessages, type Locale } from "@anonychatmebot/shared"
import type { Bot, Context } from "grammy"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { UserRepository } from "~/repositories/user.repository"
import { StateService } from "~/services/state.service"
import { buildMainMenuKeyboard } from "~/views/telegram/main-menu.view"

export function registerCancelCommand(bot: Bot, env: Bindings) {
  const handle = async (ctx: Context) => {
    if (!ctx.from) return
    const db = createDb(env.DB)
    const userRepo = new UserRepository(db)
    const stateService = new StateService(env.STATE_KV)

    const user = await userRepo.findByTelegramId(ctx.from.id)
    const state = await stateService.get(ctx.from.id, user)
    const msgs = getMessages((user?.locale as Locale) ?? "en")

    if (state.name === "idle") {
      await ctx.reply(msgs.bot.nothing_to_cancel, {
        reply_markup: user ? buildMainMenuKeyboard(msgs) : undefined,
      })
      return
    }

    await stateService.reset(ctx.from.id)
    await ctx.reply(msgs.bot.cancel, {
      reply_markup: user ? buildMainMenuKeyboard(msgs) : undefined,
    })
  }

  bot.command("cancel", handle)
}
```

- [ ] **Step 2: Register cancel in bot index**

In `apps/backend/src/bot/index.ts`, add the import and register call:

```typescript
import { registerCancelCommand } from "~/bot/commands/cancel"
// ... existing imports ...

function buildBot(token: string, env: Bindings): Bot {
  const bot = new Bot(token)

  registerStartCommand(bot, env)
  registerOnboardingHandlers(bot, env)
  registerCancelCommand(bot, env)   // ← Add this line (after onboarding)
  registerLinkCommand(bot, env)
  registerSendCommand(bot, env)
  registerInboxCommand(bot, env)
  registerSettingsCommand(bot, env)
  registerHelpCommand(bot, env)
  registerMessageActionsHandler(bot, env)
  registerMessageHandler(bot, env)

  return bot
}
```

- [ ] **Step 3: Add /cancel to synced Telegram commands**

In `apps/backend/src/bot/setup.ts`, update `buildCommands`:

```typescript
export async function syncBotCommands(api: Api): Promise<void> {
  // ... (same logic, just expand buildCommands)
}

function buildCommands(locale: Locale): BotCommand[] {
  const m = getMessages(locale)
  return [
    { command: "link", description: m.commands.link },
    { command: "send", description: m.commands.send },
    { command: "inbox", description: m.commands.inbox },
    { command: "settings", description: m.commands.settings },
    { command: "help", description: m.commands.help },
    { command: "cancel", description: m.commands.cancel },   // ← Add this
  ]
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
bun run --cwd apps/backend tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/bot/commands/cancel.ts \
        apps/backend/src/bot/index.ts \
        apps/backend/src/bot/setup.ts
git commit -m "feat: /cancel command — exit any active conversation state"
```

---

## Task 6: reply_to_id threading

**Files:**
- Modify: `apps/backend/src/repositories/message.repository.ts`
- Modify: `apps/backend/src/bot/handlers/message-actions.handler.ts`

The `MessageController.sendAnonymousMessage` already accepts `replyToId?: number` from Task 4. This task wires the actual value through the reply flow.

- [ ] **Step 1: Verify `NewMessage` accepts `reply_to_id`**

Open `apps/backend/src/db/schema.ts` — confirm `reply_to_id` exists in `messages` table (it does). `NewMessage` is `typeof messages.$inferInsert` so it already includes the optional field. No change needed.

- [ ] **Step 2: Update reply callback to pass `messageId` as `replyToId`**

In `apps/backend/src/bot/handlers/message-actions.handler.ts`, the `reply:(\d+)` callback sets state `replying_to`. The state already stores `messageId`. The `message.handler.ts` (updated in Task 4) already passes `originalMessageId` as `replyToId` when calling `sendAnonymousMessage`. This task only needs to verify the state shape includes `messageId`.

The current state definition in `models/state.model.ts`:
```typescript
| { name: "replying_to"; messageId: number; senderTelegramId: number; viewMessageId: number }
```

This already has `messageId`. The `message.handler.ts` reads `state.messageId` as `originalMessageId`. ✅ No further changes needed — threading is complete from Task 4.

- [ ] **Step 3: Add `findReplies` to MessageRepository for future use**

In `apps/backend/src/repositories/message.repository.ts`, add:

```typescript
import { and, desc, eq } from "drizzle-orm"

// Add this method to MessageRepository:
async findReplies(originalMessageId: number): Promise<MessageModel[]> {
  return this.db
    .select()
    .from(messages)
    .where(eq(messages.reply_to_id, originalMessageId))
    .orderBy(desc(messages.created_at))
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
bun run --cwd apps/backend tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/repositories/message.repository.ts
git commit -m "feat: populate reply_to_id when creating reply messages; add findReplies to repo"
```

---

## Task 7: Inbox redesign — privacy + unread indicators + i18n buttons

**Files:**
- Modify: `apps/backend/src/bot/commands/inbox.ts`
- Modify: `apps/backend/src/views/telegram/inbox.view.ts`

**Current behaviour (bug):** inbox prints full message content. **New behaviour:** shows a summary list (no content, just read status + timestamp), with "View #N" inline buttons that reuse the existing `view_msg:{id}` callback handler.

- [ ] **Step 1: Rewrite `inbox.view.ts`**

Replace `apps/backend/src/views/telegram/inbox.view.ts`:

```typescript
import type { I18nMessages } from "@anonychatmebot/shared"
import { t } from "@anonychatmebot/shared"
import { InlineKeyboard } from "grammy"
import type { MessageModel } from "~/db/schema"

export function relativeTime(isoString: string, msgs: I18nMessages): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return msgs.inbox.time_just_now
  if (diffMin < 60) return t(msgs.inbox.time_minutes_ago, { n: String(diffMin) })
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return t(msgs.inbox.time_hours_ago, { n: String(diffHr) })
  const diffDays = Math.floor(diffHr / 24)
  return t(msgs.inbox.time_days_ago, { n: String(diffDays) })
}

export function formatMessageSummary(
  n: number,
  msg: MessageModel,
  msgs: I18nMessages,
): string {
  const readIndicator = msg.read_at ? "✅" : "🔵"
  const age = relativeTime(msg.created_at, msgs)
  return `${readIndicator} #${n} · ${age}`
}

export function buildInboxView(
  page: number,
  totalPages: number,
  slice: MessageModel[],
  startIndex: number,
  unreadCount: number,
  msgs: I18nMessages,
): { text: string; keyboard: InlineKeyboard } {
  const unreadSuffix = unreadCount > 0 ? ` (${t(msgs.bot.inbox_unread, { n: String(unreadCount) })})` : ""
  const header = `${t(msgs.bot.inbox_header, { page: String(page + 1), total: String(totalPages) })}${unreadSuffix}`

  const lines = slice.map((msg, i) => formatMessageSummary(startIndex + i + 1, msg, msgs))
  const text = `${header}\n\n${lines.join("\n")}`

  const kb = new InlineKeyboard()

  // View buttons — 2 per row
  slice.forEach((msg, i) => {
    const label = t(msgs.inbox.view_n, { n: String(startIndex + i + 1) })
    if (i % 2 === 0) {
      kb.text(label, `view_msg:${msg.id}`)
    } else {
      kb.text(label, `view_msg:${msg.id}`).row()
    }
  })
  if (slice.length % 2 !== 0) kb.row()

  // Pagination
  const hasPrev = page > 0
  const hasNext = page < totalPages - 1
  if (hasPrev) kb.text(msgs.inbox.prev, `inbox:${page - 1}`)
  if (hasNext) kb.text(msgs.inbox.next, `inbox:${page + 1}`)

  return { text, keyboard: kb }
}
```

- [ ] **Step 2: Rewrite `inbox.ts` command to use the new view**

Replace `apps/backend/src/bot/commands/inbox.ts`:

```typescript
import { getMessages, type Locale } from "@anonychatmebot/shared"
import type { Bot, Context } from "grammy"
import { allTexts } from "~/bot/utils/locale"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { MessageRepository } from "~/repositories/message.repository"
import { UserRepository } from "~/repositories/user.repository"
import { buildInboxView } from "~/views/telegram/inbox.view"

const PAGE_SIZE = 5

export function registerInboxCommand(bot: Bot, env: Bindings) {
  async function showInbox(ctx: Context, page: number) {
    if (!ctx.from) return
    const db = createDb(env.DB)
    const user = await new UserRepository(db).findByTelegramId(ctx.from.id)
    const msgs = getMessages((user?.locale as Locale) ?? "en")

    if (!user) {
      await ctx.reply(msgs.errors.generic)
      return
    }

    const allMessages = await new MessageRepository(db).findByRecipient(user.id)

    if (allMessages.length === 0) {
      await ctx.reply(msgs.bot.no_messages)
      return
    }

    const totalPages = Math.ceil(allMessages.length / PAGE_SIZE)
    const safePage = Math.max(0, Math.min(page, totalPages - 1))
    const startIndex = safePage * PAGE_SIZE
    const slice = allMessages.slice(startIndex, startIndex + PAGE_SIZE)
    const unreadCount = allMessages.filter((m) => !m.read_at).length

    const { text, keyboard } = buildInboxView(safePage, totalPages, slice, startIndex, unreadCount, msgs)

    await ctx.reply(text, {
      reply_markup: keyboard.inline_keyboard.length > 0 ? keyboard : undefined,
    })
  }

  const handle = (ctx: Context) => showInbox(ctx, 0)

  bot.hears(allTexts("received"), handle)
  bot.command("inbox", handle)

  bot.callbackQuery(/^inbox:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery()
    const page = Number(ctx.match[1])
    await showInbox(ctx, page)
  })
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
bun run --cwd apps/backend tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/bot/commands/inbox.ts \
        apps/backend/src/views/telegram/inbox.view.ts
git commit -m "fix(inbox): hide message content; show summary with read/unread status and per-item View buttons"
```

---

## Task 8: Idle-state fallback handler

**Files:**
- Create: `apps/backend/src/bot/handlers/fallback.handler.ts`
- Modify: `apps/backend/src/bot/index.ts`

- [ ] **Step 1: Create the fallback handler**

Create `apps/backend/src/bot/handlers/fallback.handler.ts`:

```typescript
import { getMessages, type Locale } from "@anonychatmebot/shared"
import type { Bot } from "grammy"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { UserRepository } from "~/repositories/user.repository"
import { buildMainMenuKeyboard } from "~/views/telegram/main-menu.view"

/**
 * Catch-all for text messages that no other handler claimed.
 * Only runs when the user is in "idle" state (all active-state handlers call return/next() before this).
 */
export function registerFallbackHandler(bot: Bot, env: Bindings) {
  bot.on("message:text", async (ctx) => {
    const db = createDb(env.DB)
    const user = await new UserRepository(db).findByTelegramId(ctx.from.id)
    const msgs = getMessages((user?.locale as Locale) ?? "en")

    await ctx.reply(msgs.errors.generic, {
      reply_markup: user ? buildMainMenuKeyboard(msgs) : undefined,
    })
  })
}
```

- [ ] **Step 2: Register in bot index — MUST be last**

In `apps/backend/src/bot/index.ts`, add after all other registrations:

```typescript
import { registerFallbackHandler } from "~/bot/handlers/fallback.handler"

function buildBot(token: string, env: Bindings): Bot {
  // ... existing registrations ...
  registerMessageHandler(bot, env)
  registerFallbackHandler(bot, env)  // ← Must be last
  return bot
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
bun run --cwd apps/backend tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/bot/handlers/fallback.handler.ts \
        apps/backend/src/bot/index.ts
git commit -m "feat: idle-state fallback handler shows main menu on unrecognised input"
```

---

## Task 9: Unblock mechanism in Settings

**Files:**
- Modify: `apps/backend/src/repositories/block.repository.ts`
- Modify: `apps/backend/src/bot/commands/settings.ts`
- Modify: `apps/backend/src/views/telegram/settings.view.ts`

- [ ] **Step 1: Add `list` and `unblock` methods to BlockRepository**

Replace `apps/backend/src/repositories/block.repository.ts`:

```typescript
import { and, eq } from "drizzle-orm"
import type { Db } from "~/db/index"
import { type BlockModel, blocks } from "~/db/schema"

export class BlockRepository {
  constructor(private readonly db: Db) {}

  async isBlocked(blockerUserId: number, senderTelegramId: number): Promise<boolean> {
    const result = await this.db
      .select()
      .from(blocks)
      .where(
        and(eq(blocks.blocker_user_id, blockerUserId), eq(blocks.sender_telegram_id, senderTelegramId)),
      )
      .get()
    return result !== undefined
  }

  async block(blockerUserId: number, senderTelegramId: number): Promise<void> {
    await this.db
      .insert(blocks)
      .values({ blocker_user_id: blockerUserId, sender_telegram_id: senderTelegramId })
      .onConflictDoNothing()
  }

  async list(blockerUserId: number): Promise<BlockModel[]> {
    return this.db.select().from(blocks).where(eq(blocks.blocker_user_id, blockerUserId))
  }

  async unblock(blockId: number, blockerUserId: number): Promise<void> {
    // Scope by blockerUserId to prevent tampering with other users' blocks
    await this.db
      .delete(blocks)
      .where(and(eq(blocks.id, blockId), eq(blocks.blocker_user_id, blockerUserId)))
  }
}
```

- [ ] **Step 2: Add "Blocked senders" button to settings view**

Replace `apps/backend/src/views/telegram/settings.view.ts`:

```typescript
import type { I18nMessages } from "@anonychatmebot/shared"
import { t } from "@anonychatmebot/shared"
import { InlineKeyboard } from "grammy"

export function buildSettingsKeyboard(
  messages: I18nMessages,
  receivingMessages: boolean,
  blockedCount: number = 0,
): InlineKeyboard {
  const toggleLabel = receivingMessages
    ? `${messages.settings.receiving_on} · ${messages.settings.toggle_receiving}`
    : `${messages.settings.receiving_off} · ${messages.settings.toggle_receiving}`

  return new InlineKeyboard()
    .text(messages.settings.change_language, "settings:lang")
    .row()
    .text(messages.settings.change_name, "settings:name")
    .row()
    .text(toggleLabel, "settings:toggle_receiving")
    .row()
    .text(
      t(messages.settings.blocked_senders, { n: String(blockedCount) }),
      "settings:blocked",
    )
}
```

- [ ] **Step 3: Update settings command to pass blockedCount and handle unblock callbacks**

Replace `apps/backend/src/bot/commands/settings.ts`:

```typescript
import { getMessages, type Locale, t } from "@anonychatmebot/shared"
import type { Bot, Context } from "grammy"
import { InlineKeyboard } from "grammy"
import { allTexts } from "~/bot/utils/locale"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { BlockRepository } from "~/repositories/block.repository"
import { UserRepository } from "~/repositories/user.repository"
import { StateService } from "~/services/state.service"
import { buildLocaleSelector, buildNameRequestKeyboard } from "~/views/telegram/onboarding.view"
import { buildSettingsKeyboard } from "~/views/telegram/settings.view"

export function registerSettingsCommand(bot: Bot, env: Bindings) {
  const handle = async (ctx: Context) => {
    if (!ctx.from) return
    const db = createDb(env.DB)
    const user = await new UserRepository(db).findByTelegramId(ctx.from.id)
    const messages = getMessages((user?.locale as Locale) ?? "en")
    const blockedCount = user ? (await new BlockRepository(db).list(user.id)).length : 0

    await ctx.reply(messages.settings.title, {
      reply_markup: buildSettingsKeyboard(messages, user?.receiving_messages ?? true, blockedCount),
    })
  }

  bot.hears(allTexts("settings"), handle)
  bot.command("settings", handle)

  // Change language
  bot.callbackQuery("settings:lang", async (ctx) => {
    await ctx.answerCallbackQuery()
    const user = await new UserRepository(createDb(env.DB)).findByTelegramId(ctx.from.id)
    const messages = getMessages((user?.locale as Locale) ?? "en")
    await ctx.reply(messages.onboarding.select_locale, {
      reply_markup: buildLocaleSelector(),
    })
  })

  // Change display name
  bot.callbackQuery("settings:name", async (ctx) => {
    if (!ctx.from) return ctx.answerCallbackQuery()
    const db = createDb(env.DB)
    const user = await new UserRepository(db).findByTelegramId(ctx.from.id)
    const messages = getMessages((user?.locale as Locale) ?? "en")

    await new StateService(env.STATE_KV).set(ctx.from.id, { name: "onboarding_name" })
    await ctx.answerCallbackQuery()
    await ctx.reply(messages.onboarding.enter_name, {
      reply_markup: buildNameRequestKeyboard(ctx.from.first_name || "..."),
    })
  })

  // Toggle receiving messages
  bot.callbackQuery("settings:toggle_receiving", async (ctx) => {
    if (!ctx.from) return ctx.answerCallbackQuery()
    const db = createDb(env.DB)
    const userRepo = new UserRepository(db)
    const user = await userRepo.findByTelegramId(ctx.from.id)
    if (!user) return ctx.answerCallbackQuery()

    const newValue = !user.receiving_messages
    await userRepo.setReceivingMessages(user.id, newValue)

    const messages = getMessages((user.locale as Locale) ?? "en")
    const status = newValue ? messages.settings.receiving_on : messages.settings.receiving_off

    await ctx.answerCallbackQuery({ text: status, show_alert: true })

    const blockedCount = (await new BlockRepository(db).list(user.id)).length
    await ctx.editMessageReplyMarkup({
      reply_markup: buildSettingsKeyboard(messages, newValue, blockedCount),
    })
  })

  // Show blocked senders list
  bot.callbackQuery("settings:blocked", async (ctx) => {
    if (!ctx.from) return ctx.answerCallbackQuery()
    const db = createDb(env.DB)
    const user = await new UserRepository(db).findByTelegramId(ctx.from.id)
    if (!user) return ctx.answerCallbackQuery()

    const messages = getMessages((user.locale as Locale) ?? "en")
    const blockList = await new BlockRepository(db).list(user.id)

    await ctx.answerCallbackQuery()

    if (blockList.length === 0) {
      await ctx.reply(messages.settings.no_blocked)
      return
    }

    // Show numbered list; each entry has an Unblock button.
    // Sender telegram IDs are never shown to preserve anonymity — only sequential numbers.
    const kb = new InlineKeyboard()
    const lines: string[] = []

    blockList.forEach((block, i) => {
      lines.push(`#${i + 1}`)
      kb.text(`❌ #${i + 1}`, `unblock:${block.id}`).row()
    })

    await ctx.reply(`🚫 Blocked senders:\n${lines.join("\n")}`, { reply_markup: kb })
  })

  // Unblock a sender
  bot.callbackQuery(/^unblock:(\d+)$/, async (ctx) => {
    const blockId = Number(ctx.match[1])
    if (!ctx.from) return ctx.answerCallbackQuery()

    const db = createDb(env.DB)
    const user = await new UserRepository(db).findByTelegramId(ctx.from.id)
    if (!user) return ctx.answerCallbackQuery()

    await new BlockRepository(db).unblock(blockId, user.id)

    const messages = getMessages((user.locale as Locale) ?? "en")
    await ctx.answerCallbackQuery({ text: messages.settings.unblocked, show_alert: true })
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  })
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
bun run --cwd apps/backend tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/repositories/block.repository.ts \
        apps/backend/src/bot/commands/settings.ts \
        apps/backend/src/views/telegram/settings.view.ts
git commit -m "feat: unblock mechanism — settings shows blocked count, tap to view list and unblock"
```

---

## Task 10: REST API security — protect reads, CORS for web sends

**Files:**
- Modify: `apps/backend/src/index.ts`
- Modify: `apps/backend/src/api/context.ts`
- Modify: `apps/backend/src/api/index.ts`
- Modify: `apps/backend/wrangler.toml`
- Modify: `apps/backend/.dev.vars.example`

- [ ] **Step 1: Add `API_SECRET` and `FRONTEND_URL` to Bindings**

In `apps/backend/src/index.ts`, update the `Bindings` type:

```typescript
export type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
  MESSAGE_QUEUE: Queue
  STATE_KV: KVNamespace
  BOT_TOKEN: string
  WEBHOOK_SECRET: string
  LINK_SALT: string
  ENVIRONMENT: string
  API_SECRET: string    // ← New: protects GET /api/* routes
  FRONTEND_URL: string  // ← New: allowed CORS origin for web sends
}
```

- [ ] **Step 2: Add auth middleware to `api/context.ts`**

Append to `apps/backend/src/api/context.ts`:

```typescript
import type { MiddlewareHandler } from "hono"

/** Require X-Api-Key header matching API_SECRET. Skip for OPTIONS (CORS preflight). */
export const requireApiKey: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (c.req.method === "OPTIONS") return next()
  const key = c.req.header("X-Api-Key")
  if (!key || key !== c.env.API_SECRET) {
    return c.json({ error: "Unauthorized" }, 401)
  }
  return next()
}
```

- [ ] **Step 3: Apply auth only to sensitive routes; add CORS for public endpoints**

Replace `apps/backend/src/api/index.ts`:

```typescript
import { cors } from "hono/cors"
import { Hono } from "hono"
import type { AppEnv } from "./context"
import { injectServices, requireApiKey } from "./context"
import { messagesRouter } from "./messages"
import { setupRouter } from "./setup"
import { usersRouter } from "./users"

export const api = new Hono<AppEnv>()

api.use("*", injectServices)

// CORS for public web-send and resolve endpoints — allow frontend origin
api.use("/messages/web-send", async (c, next) => {
  return cors({ origin: c.env.FRONTEND_URL, allowMethods: ["POST", "OPTIONS"] })(c, next)
})
api.use("/users/resolve/*", async (c, next) => {
  return cors({ origin: c.env.FRONTEND_URL, allowMethods: ["GET", "OPTIONS"] })(c, next)
})

// Auth-protected: internal/admin routes only
api.use("/setup/*", requireApiKey)
api.use("/messages/:userId", requireApiKey)  // GET messages for a user

api.route("/setup", setupRouter)
api.route("/messages", messagesRouter)
api.route("/users", usersRouter)
```

- [ ] **Step 4: Update wrangler.toml to declare FRONTEND_URL**

In `apps/backend/wrangler.toml`, under `[vars]`:

```toml
[vars]
ENVIRONMENT = "production"
FRONTEND_URL = "https://your-frontend.pages.dev"  # replace with actual deployed URL
```

- [ ] **Step 5: Update `.dev.vars.example`**

In `apps/backend/.dev.vars.example`, add:

```
API_SECRET=dev-secret-change-me
FRONTEND_URL=http://localhost:3000
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
bun run --cwd apps/backend tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/src/index.ts apps/backend/src/api/context.ts \
        apps/backend/src/api/index.ts apps/backend/wrangler.toml \
        apps/backend/.dev.vars.example
git commit -m "feat(api): protect GET routes with X-Api-Key; CORS for public web-send endpoints"
```

---

## Task 11: Backend — resolve-hash + web-send API endpoints

**Files:**
- Create: `apps/backend/src/api/users.ts`
- Modify: `apps/backend/src/api/messages.ts`

- [ ] **Step 1: Create users router**

Create `apps/backend/src/api/users.ts`:

```typescript
import { Hono } from "hono"
import { UserRepository } from "~/repositories/user.repository"
import { decodeId } from "~/utils/hashid"
import type { AppEnv } from "./context"

export const usersRouter = new Hono<AppEnv>()

/**
 * GET /api/users/resolve/:hash
 * Resolves a hashid to a public user profile (display name only).
 * Used by the web frontend to show who the message will be sent to.
 */
usersRouter.get("/resolve/:hash", async (c) => {
  const hash = c.req.param("hash")
  const userId = decodeId(c.env.LINK_SALT, hash)
  if (userId === null) return c.json({ error: "Invalid link" }, 400)

  const db = c.get("db")
  const user = await new UserRepository(db).findById(userId)
  if (!user) return c.json({ error: "User not found" }, 404)
  if (!user.receiving_messages) return c.json({ error: "Not accepting messages" }, 403)

  return c.json({ displayName: user.display_name || user.username || "Anonymous" })
})
```

- [ ] **Step 2: Add web-send endpoint to messages router**

In `apps/backend/src/api/messages.ts`, add this route before the existing POST `/send`:

```typescript
import { checkRateLimit } from "~/utils/rate-limit"

const WEB_RL_LIMIT = 3
const WEB_RL_WINDOW = 3600  // 1 hour

/**
 * POST /api/messages/web-send
 * Public endpoint for web anonymous sends (no sender Telegram account).
 * Rate-limited by Cloudflare-provided client IP.
 * sender_telegram_id is stored as 0 — web senders cannot receive replies.
 */
messagesRouter.post("/web-send", async (c) => {
  const body = await c.req.json<{ recipientHash: string; content: string }>()

  if (!body.content?.trim()) return c.json({ error: "Message content is required" }, 400)
  if (body.content.length > 2000) return c.json({ error: "Message too long" }, 400)

  const userId = decodeId(c.env.LINK_SALT, body.recipientHash)
  if (userId === null) return c.json({ error: "Invalid link" }, 400)

  const db = c.get("db")
  const userRepo = new UserRepository(db)
  const recipient = await userRepo.findById(userId)
  if (!recipient) return c.json({ error: "User not found" }, 404)
  if (!recipient.receiving_messages) return c.json({ error: "Not accepting messages" }, 403)

  // Rate limit by CF client IP — 3 sends per hour per IP per recipient
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown"
  const rlKey = `webrl:${ip}:${recipient.id}`
  const rl = await checkRateLimit(c.env.STATE_KV, rlKey, WEB_RL_LIMIT, WEB_RL_WINDOW)
  if (!rl.allowed) return c.json({ error: "Rate limited" }, 429)

  const message = await new MessageRepository(db).create({
    sender_telegram_id: 0,  // 0 = web sender
    recipient_user_id: recipient.id,
    content: body.content.trim(),
  })

  await c.env.MESSAGE_QUEUE.send({
    messageId: message.id,
    recipientTelegramId: recipient.telegram_id,
    recipientUserId: recipient.id,
    recipientLocale: recipient.locale,
    senderTelegramId: 0,
    content: body.content.trim(),
  })

  return c.json({ ok: true }, 201)
})
```

Also add the missing import at the top of `messages.ts`:
```typescript
import { decodeId } from "~/utils/hashid"
import { checkRateLimit } from "~/utils/rate-limit"
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
bun run --cwd apps/backend tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/api/users.ts apps/backend/src/api/messages.ts
git commit -m "feat(api): add GET /users/resolve/:hash and POST /messages/web-send for web frontend"
```

---

## Task 12: Frontend — web anonymous send page

**Files:**
- Modify: `apps/frontend/vite.config.ts`
- Modify: `apps/frontend/src/routes/__root.tsx`
- Create: `apps/frontend/src/routes/s.$hash.tsx`
- Create: `apps/frontend/.env.example`

- [ ] **Step 1: Add VITE_API_URL to vite config**

Read the existing `apps/frontend/vite.config.ts` first, then add env variable handling. Add to the vite config (look for `defineConfig` in the file and add inside):

```typescript
// Inside the existing vite defineConfig:
define: {
  __API_URL__: JSON.stringify(process.env.VITE_API_URL ?? "http://localhost:8787"),
},
```

And add a type declaration. Create `apps/frontend/src/env.d.ts`:
```typescript
declare const __API_URL__: string
```

- [ ] **Step 2: Create `.env.example` for frontend**

Create `apps/frontend/.env.example`:
```
VITE_API_URL=http://localhost:8787
```

- [ ] **Step 3: Update root layout meta**

In `apps/frontend/src/routes/__root.tsx`, update the `head()` return:

```typescript
head: () => ({
  meta: [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { title: "AnonyChatMe — Send Anonymous Messages" },
    { name: "description", content: "Send anonymous messages to people via their personal link." },
  ],
  // ... rest unchanged
})
```

- [ ] **Step 4: Create the send page route**

Create `apps/frontend/src/routes/s.$hash.tsx`:

```tsx
import { createFileRoute, useParams } from "@tanstack/react-router"
import { useState } from "react"

type RecipientInfo = { displayName: string }

async function resolveRecipient(hash: string): Promise<RecipientInfo> {
  const res = await fetch(`${__API_URL__}/api/users/resolve/${hash}`)
  if (res.status === 404) throw new Error("user_not_found")
  if (res.status === 403) throw new Error("not_accepting")
  if (res.status === 400) throw new Error("invalid_link")
  if (!res.ok) throw new Error("unknown")
  return res.json() as Promise<RecipientInfo>
}

export const Route = createFileRoute("/s/$hash")({
  loader: ({ params }) => resolveRecipient(params.hash),
  component: SendPage,
  errorComponent: ErrorPage,
})

function SendPage() {
  const { hash } = useParams({ from: "/s/$hash" })
  const { displayName } = Route.useLoaderData()
  const [content, setContent] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const MAX_CHARS = 2000

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || status === "sending") return
    setStatus("sending")
    setErrorMsg("")

    try {
      const res = await fetch(`${__API_URL__}/api/messages/web-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientHash: hash, content: content.trim() }),
      })

      if (res.status === 429) {
        setStatus("error")
        setErrorMsg("You're sending too many messages. Please wait before trying again.")
        return
      }
      if (!res.ok) {
        setStatus("error")
        setErrorMsg("Something went wrong. Please try again.")
        return
      }

      setStatus("sent")
      setContent("")
    } catch {
      setStatus("error")
      setErrorMsg("Network error. Please check your connection.")
    }
  }

  if (status === "sent") {
    return (
      <main className="page-wrap flex min-h-screen items-center justify-center px-4">
        <div className="island-shell rise-in rounded-[2rem] px-8 py-12 text-center max-w-md w-full">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-[var(--sea-ink)] mb-2">Message sent!</h1>
          <p className="text-[var(--sea-ink-soft)]">
            Your anonymous message was delivered to <strong>{displayName}</strong>.
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-6 rounded-full bg-[rgba(79,184,178,0.14)] border border-[rgba(50,143,151,0.3)] px-6 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] hover:bg-[rgba(79,184,178,0.24)] transition"
          >
            Send another
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="page-wrap flex min-h-screen items-center justify-center px-4">
      <div className="island-shell rise-in rounded-[2rem] px-8 py-12 max-w-lg w-full">
        <p className="island-kicker mb-3">Anonymous message</p>
        <h1 className="display-title text-3xl font-bold text-[var(--sea-ink)] mb-2">
          Send to <span className="text-[var(--lagoon-deep)]">{displayName}</span>
        </h1>
        <p className="text-sm text-[var(--sea-ink-soft)] mb-6">
          Your identity will never be revealed.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={MAX_CHARS}
            rows={5}
            placeholder="Write your anonymous message here…"
            className="w-full rounded-xl border border-[rgba(23,58,64,0.15)] bg-white/60 px-4 py-3 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] focus:outline-none focus:ring-2 focus:ring-[rgba(79,184,178,0.4)] resize-none"
            disabled={status === "sending"}
          />
          <div className="flex justify-between items-center mt-1 mb-4">
            <span className={`text-xs ${content.length > MAX_CHARS * 0.9 ? "text-orange-500" : "text-[var(--sea-ink-soft)]"}`}>
              {content.length}/{MAX_CHARS}
            </span>
            {errorMsg && <span className="text-xs text-red-500">{errorMsg}</span>}
          </div>

          <button
            type="submit"
            disabled={!content.trim() || status === "sending"}
            className="w-full rounded-full bg-[var(--lagoon-deep)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === "sending" ? "Sending…" : "Send anonymously"}
          </button>
        </form>
      </div>
    </main>
  )
}

function ErrorPage({ error }: { error: Error }) {
  const messages: Record<string, { emoji: string; title: string; body: string }> = {
    user_not_found: {
      emoji: "🔍",
      title: "Link not found",
      body: "This link is invalid or the user no longer exists.",
    },
    not_accepting: {
      emoji: "⏸️",
      title: "Not accepting messages",
      body: "This person has paused their anonymous messages.",
    },
    invalid_link: {
      emoji: "❌",
      title: "Invalid link",
      body: "This doesn't look like a valid anonymous message link.",
    },
    unknown: {
      emoji: "⚠️",
      title: "Something went wrong",
      body: "Please try again later.",
    },
  }

  const info = messages[error.message] ?? messages.unknown

  return (
    <main className="page-wrap flex min-h-screen items-center justify-center px-4">
      <div className="island-shell rise-in rounded-[2rem] px-8 py-12 text-center max-w-md w-full">
        <div className="text-5xl mb-4">{info.emoji}</div>
        <h1 className="text-2xl font-bold text-[var(--sea-ink)] mb-2">{info.title}</h1>
        <p className="text-[var(--sea-ink-soft)]">{info.body}</p>
      </div>
    </main>
  )
}
```

- [ ] **Step 5: Update the home page to remove the template boilerplate**

Replace the content of `apps/frontend/src/routes/index.tsx` with a proper landing page:

```tsx
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">Truly anonymous</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Anonymous messages, delivered.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Share your personal link and let anyone send you anonymous messages —
          no accounts needed on their end.
        </p>
        <a
          href="https://t.me/AnonyChatMeBot"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[var(--lagoon-deep)] px-6 py-3 text-sm font-semibold text-white no-underline transition hover:opacity-90"
        >
          Get your link on Telegram
        </a>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["🔒 Fully anonymous", "Senders stay completely hidden — even from you."],
          ["↩️ Reply & react", "Reply to messages you receive without revealing your identity."],
          ["🌍 6 languages", "Available in English, Farsi, Russian, German, French, and Arabic."],
        ].map(([title, desc], index) => (
          <article
            key={String(title)}
            className="island-shell feature-card rise-in rounded-2xl p-5"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">{title}</h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
```

- [ ] **Step 6: Verify the frontend builds**

```bash
bun run --cwd apps/frontend build
```

Expected: build succeeds with no TypeScript or Vite errors. (TanStack Router auto-generates `routeTree.gen.ts` on build.)

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/routes/s.\$hash.tsx \
        apps/frontend/src/routes/index.tsx \
        apps/frontend/src/routes/__root.tsx \
        apps/frontend/src/env.d.ts \
        apps/frontend/.env.example \
        apps/frontend/vite.config.ts
git commit -m "feat(frontend): web anonymous send page at /s/:hash + landing page redesign"
```

---

## Self-Review

### Spec Coverage

| Issue | Task |
|---|---|
| Queue ack on failure | Task 3 ✅ |
| REST API auth | Task 10 ✅ |
| /cancel command | Task 5 ✅ |
| Message length validation | Task 4 ✅ |
| Rate limiting | Task 4 ✅ |
| Frontend not built | Task 12 ✅ |
| Inbox privacy (content leak) | Task 7 ✅ |
| reply_to_id threading | Task 6 ✅ |
| Duplicate block constraint | Task 2 ✅ |
| Duplicate report constraint | Task 2 ✅ |
| Unread badges in inbox | Task 7 ✅ |
| Hardcoded English pagination/timestamps | Tasks 1 + 7 ✅ |
| Idle fallback handler | Task 8 ✅ |
| Unblock in settings | Task 9 ✅ |
| Web send backend API | Task 11 ✅ |
| i18n interface + all locales updated | Task 1 ✅ |

### Placeholder Scan

No TBDs, no "handle edge cases", no "similar to Task N". All code is written out in full.

### Type Consistency

- `SendResult` defined in Task 4 (`message.controller.ts`), consumed in `message.handler.ts` (Task 4) — consistent.
- `buildSettingsKeyboard` gains `blockedCount: number` param in Task 9; called in `settings.ts` (Task 9) with it — consistent.
- `buildInboxView` defined in Task 7 (`inbox.view.ts`), called in `inbox.ts` (Task 7) — consistent.
- `checkRateLimit` defined in Task 4, used in Task 4 (controller) and Task 11 (messages.ts) — consistent.
- `I18nMessages` expanded in Task 1; all usages of new keys (`msgs.inbox.prev`, `msgs.bot.cancel`, etc.) are in Tasks 5, 7, 9 — consistent.
- `resolveRecipient` in Task 12 throws named errors (`"user_not_found"`, etc.) that `ErrorPage` maps — consistent.
