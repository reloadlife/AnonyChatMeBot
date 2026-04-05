import { getMessages, type Locale } from "@anonychatmebot/shared"
import type { Bot, Context } from "grammy"
import { allTexts } from "~/bot/utils/locale"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { UserRepository } from "~/repositories/user.repository"
import { encodeId } from "~/utils/hashid"

export function registerLinkCommand(bot: Bot, env: Bindings) {
  const handle = async (ctx: Context) => {
    if (!ctx.from) return
    const user = await new UserRepository(createDb(env.DB)).findByTelegramId(ctx.from.id)
    if (!user) return
    const messages = getMessages((user.locale as Locale) ?? "en")

    const hash = encodeId(env.LINK_SALT, user.id)
    const link = `https://t.me/${ctx.me.username}?start=${hash}`
    await ctx.reply(`${messages.bot.your_link}\n\`${link}\`\n\n${messages.bot.link_hint}`, {
      parse_mode: "MarkdownV2",
    })
  }

  bot.hears(allTexts("receive_messages"), handle)
  bot.command("link", handle)
}
