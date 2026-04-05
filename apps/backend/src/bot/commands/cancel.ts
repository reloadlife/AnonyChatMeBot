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
    const user = await new UserRepository(db).findByTelegramId(ctx.from.id)
    const messages = getMessages((user?.locale as Locale) ?? "en")
    const stateService = new StateService(env.STATE_KV)
    const state = await stateService.get(ctx.from.id, user ?? undefined)

    if (state.name === "idle") {
      await ctx.reply(messages.bot.nothing_to_cancel, { parse_mode: "MarkdownV2" })
      return
    }

    await stateService.reset(ctx.from.id)
    await ctx.reply(messages.bot.cancel, {
      parse_mode: "MarkdownV2",
      reply_markup: user ? buildMainMenuKeyboard(messages) : undefined,
    })
  }

  bot.command("cancel", handle)
}
