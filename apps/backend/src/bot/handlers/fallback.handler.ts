import { getMessages, type Locale } from "@anonychatmebot/shared"
import type { Bot } from "grammy"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { UserRepository } from "~/repositories/user.repository"
import { buildMainMenuKeyboard } from "~/views/telegram/main-menu.view"

/**
 * Catch-all for text messages in idle state.
 * Registered last so every other handler gets first pick.
 */
export function registerFallbackHandler(bot: Bot, env: Bindings) {
  bot.on("message:text", async (ctx) => {
    const db = createDb(env.DB)
    const user = await new UserRepository(db).findByTelegramId(ctx.from.id)
    const messages = getMessages((user?.locale as Locale) ?? "en")

    await ctx.reply(messages.errors.generic, {
      parse_mode: "MarkdownV2",
      reply_markup: user ? buildMainMenuKeyboard(messages) : undefined,
    })
  })
}
