import { getMessages, type Locale } from "@anonychatmebot/shared"
import type { Bot, Context } from "grammy"
import { allTexts } from "~/bot/utils/locale"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { UserRepository } from "~/repositories/user.repository"

export function registerHelpCommand(bot: Bot, env: Bindings) {
  const handle = async (ctx: Context) => {
    if (!ctx.from) return
    const user = await new UserRepository(createDb(env.DB)).findByTelegramId(ctx.from.id)
    const messages = getMessages((user?.locale as Locale) ?? "en")

    await ctx.reply(messages.help.text, { parse_mode: "MarkdownV2" })
  }

  bot.hears(allTexts("help"), handle)
  bot.command("help", handle)
}
