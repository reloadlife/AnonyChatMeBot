import { getMessages, type Locale } from "@anonychatmebot/shared"
import type { Bot, Context } from "grammy"
import { allTexts } from "~/bot/utils/locale"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { UserRepository } from "~/repositories/user.repository"
import { StateService } from "~/services/state.service"

export function registerSendCommand(bot: Bot, env: Bindings) {
  const handle = async (ctx: Context) => {
    if (!ctx.from) return
    const db = createDb(env.DB)
    const user = await new UserRepository(db).findByTelegramId(ctx.from.id)
    const messages = getMessages((user?.locale as Locale) ?? "en")

    await new StateService(env.STATE_KV).set(ctx.from.id, { name: "asking_recipient" })
    await ctx.reply(messages.bot.ask_recipient, { parse_mode: "MarkdownV2" })
  }

  bot.hears(allTexts("send_direct"), handle)
  bot.command("send", handle)
}
