import { getMessages, type Locale } from "@anonychatmebot/shared"
import type { Bot, Context } from "grammy"
import { allTexts } from "~/bot/utils/locale"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { UserRepository } from "~/repositories/user.repository"
import { StateService } from "~/services/state.service"
import { buildLocaleSelector, buildNameRequestKeyboard } from "~/views/telegram/onboarding.view"
import { buildSettingsKeyboard } from "~/views/telegram/settings.view"

export function registerSettingsCommand(bot: Bot, env: Bindings) {
  const handle = async (ctx: Context) => {
    if (!ctx.from) return
    const user = await new UserRepository(createDb(env.DB)).findByTelegramId(ctx.from.id)
    const messages = getMessages((user?.locale as Locale) ?? "en")

    await ctx.reply(messages.settings.title, {
      reply_markup: buildSettingsKeyboard(messages),
    })
  }

  bot.hears(allTexts("settings"), handle)
  bot.command("settings", handle)

  // Change language: show the locale selector (locale callback in onboarding.ts handles the pick)
  bot.callbackQuery("settings:lang", async (ctx) => {
    await ctx.answerCallbackQuery()
    await ctx.reply(getMessages("en").onboarding.select_locale, {
      reply_markup: buildLocaleSelector(),
    })
  })

  // Change display name: set onboarding_name state, show name keyboard
  bot.callbackQuery("settings:name", async (ctx) => {
    if (!ctx.from) return ctx.answerCallbackQuery()
    const db = createDb(env.DB)
    const user = await new UserRepository(db).findByTelegramId(ctx.from.id)
    const messages = getMessages((user?.locale as Locale) ?? "en")

    // Use set() (bypass FSM validation) so idle can directly enter onboarding_name
    await new StateService(env.STATE_KV).set(ctx.from.id, { name: "onboarding_name" })
    await ctx.answerCallbackQuery()
    await ctx.reply(messages.onboarding.enter_name, {
      reply_markup: buildNameRequestKeyboard(ctx.from.first_name || "..."),
    })
  })
}
