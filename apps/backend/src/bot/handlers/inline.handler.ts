import { getMessages, type Locale } from "@anonychatmebot/shared"
import type { Bot } from "grammy"
import { InlineQueryResultBuilder } from "grammy"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { UserRepository } from "~/repositories/user.repository"
import { encodeId } from "~/utils/hashid"

export function registerInlineHandler(bot: Bot, env: Bindings) {
  bot.on("inline_query", async (ctx) => {
    const db = createDb(env.DB)
    const user = await new UserRepository(db).findByTelegramId(ctx.from.id)
    if (!user || !ctx.me.username) {
      await ctx.answerInlineQuery([])
      return
    }

    const msgs = getMessages((user.locale as Locale) ?? "en")
    const hash = encodeId(env.LINK_SALT, user.id)
    const link = `https://t.me/${ctx.me.username}?start=${hash}`

    const result = InlineQueryResultBuilder.article(`link:${user.id}`, msgs.menu.receive_messages, {
      description: link,
      reply_markup: { inline_keyboard: [[{ text: "🔗 Open", url: link }]] },
    }).text(`${msgs.bot.your_link}\n\`${link}\`\n\n${msgs.bot.link_hint}`, {
      parse_mode: "MarkdownV2",
    })

    await ctx.answerInlineQuery([result], { cache_time: 30 })
  })
}
