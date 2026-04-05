import { escapeMarkdownV2, getMessages, type Locale, t } from "@anonychatmebot/shared"
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
      // Only update locale when user is idle — avoid corrupting an active sending flow
      const currentState = await stateService.get(ctx.from.id, user)
      if (currentState.name !== "idle") {
        await stateService.reset(ctx.from.id)
      }
      await userRepo.updateLocale(user.id, locale)
      await ctx.reply(messages.settings.language_updated)
    } else {
      const currentState = await stateService.get(ctx.from.id, user)
      const pendingRecipientId =
        currentState.name === "onboarding_locale" ? currentState.pendingRecipientId : undefined

      await userRepo.setLocale(user.id, locale)
      await stateService.set(ctx.from.id, { name: "onboarding_name", pendingRecipientId })
      await ctx.reply(messages.onboarding.enter_name, {
        parse_mode: "MarkdownV2",
        reply_markup: buildNameRequestKeyboard(ctx.from.first_name || ctx.from.username || "..."),
      })
    }
  })

  bot.on("message:text", async (ctx, next) => {
    const db = createDb(env.DB)
    const userRepo = new UserRepository(db)
    const stateService = new StateService(env.STATE_KV)

    const user = await userRepo.findByTelegramId(ctx.from.id)
    const state = await stateService.get(ctx.from.id, user)

    if (state.name !== "onboarding_name" || !user) return next()

    const displayName = ctx.message.text.trim()

    const messages = getMessages((user.locale ?? "en") as Locale)

    if (displayName.length === 0 || displayName.length > 64) {
      await ctx.reply(messages.bot.name_invalid, { parse_mode: "MarkdownV2" })
      return
    }

    const pendingRecipientId = state.pendingRecipientId

    await userRepo.completeOnboarding(user.id, displayName)

    const escapedName = escapeMarkdownV2(displayName)

    if (pendingRecipientId !== undefined) {
      const recipient = await userRepo.findById(pendingRecipientId)
      if (recipient) {
        await stateService.set(ctx.from.id, {
          name: "sending_message",
          recipientId: recipient.id,
          recipientName: recipient.display_name || recipient.username || "someone",
        })
        await ctx.reply(t(messages.bot.welcome, { name: escapedName }), {
          parse_mode: "MarkdownV2",
          reply_markup: buildMainMenuKeyboard(messages),
        })
        await ctx.reply(messages.bot.sending_to, { parse_mode: "MarkdownV2" })
        return
      }
    }

    await stateService.reset(ctx.from.id)
    await ctx.reply(t(messages.bot.welcome, { name: escapedName }), {
      parse_mode: "MarkdownV2",
      reply_markup: buildMainMenuKeyboard(messages),
    })
  })
}
