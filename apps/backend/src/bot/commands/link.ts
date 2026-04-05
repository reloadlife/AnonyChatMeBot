import { getMessages, type Locale } from "@anonychatmebot/shared"
import type { Bot, Context } from "grammy"
import { allTexts } from "~/bot/utils/locale"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { UserRepository } from "~/repositories/user.repository"

export function registerLinkCommand(bot: Bot, env: Bindings) {
  const handle = async (ctx: Context) => {
    if (!ctx.from) return
    const user = await new UserRepository(createDb(env.DB)).findByTelegramId(ctx.from.id)
    const messages = getMessages((user?.locale as Locale) ?? "en")

    // TODO: show the user's shareable link
    const link = `https://t.me/${ctx.me.username}?start=${user?.id ?? ""}`
    await ctx.reply(`${messages.bot.your_link}\n\`${link}\`\n\n${messages.bot.link_hint}`, {
      parse_mode: "Markdown",
    })
  }

  bot.hears(allTexts("receive_messages"), handle)
  bot.command("link", handle)
}
