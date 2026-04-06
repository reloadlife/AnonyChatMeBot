import { getMessages, type Locale, t } from "@anonychatmebot/shared"
import type { Bot, Context } from "grammy"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { MessageRepository } from "~/repositories/message.repository"
import { UserRepository } from "~/repositories/user.repository"

export function registerStatsCommand(bot: Bot, env: Bindings) {
  const handle = async (ctx: Context) => {
    if (!ctx.from) return
    const db = createDb(env.DB)
    const user = await new UserRepository(db).findByTelegramId(ctx.from.id)
    const messages = getMessages((user?.locale as Locale) ?? "en")

    if (!user) {
      await ctx.reply(messages.errors.generic, { parse_mode: "MarkdownV2" })
      return
    }

    const repo = new MessageRepository(db)
    const [received, unread, sent] = await Promise.all([
      repo.countByRecipient(user.id),
      repo.countUnread(user.id),
      repo.countBySender(ctx.from.id),
    ])

    await ctx.reply(
      t(messages.bot.stats, {
        received: String(received),
        unread: String(unread),
        sent: String(sent),
      }),
      { parse_mode: "MarkdownV2" },
    )
  }

  bot.command("stats", handle)
}
