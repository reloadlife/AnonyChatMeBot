import { getMessages, type Locale, t } from "@anonychatmebot/shared"
import type { Bot } from "grammy"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { UserRepository } from "~/repositories/user.repository"
import { StateService } from "~/services/state.service"
import { buildMainMenuKeyboard } from "~/views/telegram/main-menu.view"
import { buildNameRequestKeyboard, LOCALE_OPTIONS } from "~/views/telegram/onboarding.view"

export function registerOnboardingHandlers(bot: Bot, env: Bindings) {
  // Step 1 → 2: user taps a flag button (onboarding OR settings language change)
  bot.callbackQuery(/^locale:(\w+)$/, async (ctx) => {
    const locale = ctx.match[1] as Locale
    const db = createDb(env.DB)
    const userRepo = new UserRepository(db)
    const stateService = new StateService(env.STATE_KV)

    const user = await userRepo.findByTelegramId(ctx.from.id)
    if (!user) return ctx.answerCallbackQuery()

    const chosen = LOCALE_OPTIONS.find((o) => o.locale === locale)
    const messages = getMessages(locale)

    await ctx.answerCallbackQuery()
    await ctx.editMessageText(`${chosen?.flag ?? ""} ${chosen?.label ?? locale} ✅`)

    if (user.onboarding_step === 0) {
      // Settings context: just update locale, return to main menu
      await userRepo.updateLocale(user.id, locale)
      await ctx.reply(messages.settings.language_updated, {
        reply_markup: buildMainMenuKeyboard(messages),
      })
    } else {
      // Onboarding context: persist locale + advance to name step
      await userRepo.setLocale(user.id, locale)
      await stateService.transition(ctx.from.id, { name: "onboarding_name" })
      await ctx.reply(messages.onboarding.enter_name, {
        reply_markup: buildNameRequestKeyboard(ctx.from.first_name || ctx.from.username || "..."),
      })
    }
  })

  // Step 2 → idle: user sends their chosen display name
  // Calls next() when not in onboarding_name state so other handlers can take over.
  bot.on("message:text", async (ctx, next) => {
    const db = createDb(env.DB)
    const userRepo = new UserRepository(db)
    const stateService = new StateService(env.STATE_KV)

    const user = await userRepo.findByTelegramId(ctx.from.id)
    const state = await stateService.get(ctx.from.id, user)

    if (state.name !== "onboarding_name" || !user) return next()

    const displayName = ctx.message.text.trim()

    await userRepo.completeOnboarding(user.id, displayName)
    await stateService.reset(ctx.from.id)

    const messages = getMessages((user.locale ?? "en") as Locale)
    await ctx.reply(t(messages.bot.welcome, { name: displayName }), {
      reply_markup: buildMainMenuKeyboard(messages),
    })
  })
}
