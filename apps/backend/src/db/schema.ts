import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  telegram_id: integer("telegram_id").unique().notNull(),
  username: text("username"),
  display_name: text("display_name"),
  locale: text("locale", { enum: ["en", "fa", "ru", "de", "fr", "ar"] })
    .notNull()
    .default("en"),
  onboarding_step: integer("onboarding_step").notNull().default(1),
  receiving_messages: integer("receiving_messages", { mode: "boolean" }).notNull().default(true),
  created_at: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sender_telegram_id: integer("sender_telegram_id").notNull(),
  recipient_user_id: integer("recipient_user_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull().default(""),
  // Media support — null means plain text
  media_type: text("media_type", {
    enum: ["photo", "video", "voice", "audio", "document", "sticker", "animation"],
  }),
  file_id: text("file_id"),
  delivered: integer("delivered", { mode: "boolean" }).notNull().default(false),
  deleted_at: text("deleted_at"),
  // Telegram message ID of the "you have a new message" notification sent to recipient
  notification_message_id: integer("notification_message_id"),
  read_at: text("read_at"),
  reply_to_id: integer("reply_to_id"), // self-referential: which message this replies to
  created_at: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

/** Tracks senders a user has blocked. Uses sender_telegram_id (not user ID) since senders are anonymous. */
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
  (t) => [uniqueIndex("blocks_unique").on(t.blocker_user_id, t.sender_telegram_id)],
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
    dismissed: integer("dismissed", { mode: "boolean" }).notNull().default(false),
    created_at: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [uniqueIndex("reports_unique").on(t.message_id, t.reporter_user_id)],
)

// Inferred types — single source of truth for DB structure and TypeScript types
export type UserModel = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type MessageModel = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert

export type BlockModel = typeof blocks.$inferSelect
export type ReportModel = typeof reports.$inferSelect

