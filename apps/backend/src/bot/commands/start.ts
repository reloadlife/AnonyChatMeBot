import {
  escapeMarkdownV2,
  getMessages,
  type Locale,
  resolveLocale,
  t,
} from "@anonychatmebot/shared"
import type { Bot } from "grammy"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { UserRepository } from "~/repositories/user.repository"
import { StateService } from "~/services/state.service"
import { decodeId } from "~/utils/hashid"
import { buildMainMenuKeyboard } from "~/views/telegram/main-menu.view"
import { buildLocaleSelector, buildNameRequestKeyboard } from "~/views/telegram/onboarding.view"

export function registerStartCommand(bot: Bot, env: Bindings) {
  bot.command("start", async (ctx) => {
    const from = ctx.from
    if (!from) return

    const userRepo = new UserRepository(createDb(env.DB))
    const stateService = new StateService(env.STATE_KV)

    const user = await userRepo.upsert({
      telegram_id: from.id,
      username: from.username ?? null,
    })

    const state = await stateService.get(from.id, user)

    // Decode deep-link payload early so it can be threaded through onboarding
    const payload = ctx.match?.trim()
    const decodedId = payload ? decodeId(env.LINK_SALT, payload) : null
    // Invalid hash — tell user immediately (before onboarding check so new users also see it)
    if (payload && decodedId === null) {
      const msgs = getMessages(resolveLocale(from.language_code))
      await ctx.reply(msgs.bot.invalid_link, { parse_mode: "MarkdownV2" })
      // Still proceed to show onboarding/menu below
    }
    const pendingRecipientId = decodedId ?? undefined

    if (state.name === "onboarding_locale") {
      const messages = getMessages(resolveLocale(from.language_code))
      if (pendingRecipientId) {
        await stateService.set(from.id, { name: "onboarding_locale", pendingRecipientId })
      }
      await ctx.reply(messages.onboarding.select_locale, {
        parse_mode: "MarkdownV2",
        reply_markup: buildLocaleSelector(),
      })
      return
    }

    if (state.name === "onboarding_name") {
      const messages = getMessages(user.locale as Locale)
      await ctx.reply(messages.onboarding.enter_name, {
        parse_mode: "MarkdownV2",
        reply_markup: buildNameRequestKeyboard(from.first_name || from.username || "..."),
      })
      return
    }

    const messages = getMessages(user.locale as Locale)

    if (pendingRecipientId !== undefined) {
      if (pendingRecipientId === user.id) {
        await ctx.reply(messages.bot.cannot_self_message, { parse_mode: "MarkdownV2" })
      } else {
        const recipient = await userRepo.findById(pendingRecipientId)
        if (!recipient) {
          await ctx.reply(messages.errors.user_not_found, { parse_mode: "MarkdownV2" })
        } else {
          await stateService.set(from.id, {
            name: "sending_message",
            recipientId: recipient.id,
            recipientName: recipient.display_name || recipient.username || "someone",
          })
          await ctx.reply(messages.bot.sending_to, { parse_mode: "MarkdownV2" })
          return
        }
      }
    }

    await stateService.reset(from.id)
    const name = escapeMarkdownV2(user.display_name || from.first_name || "there")
    await ctx.reply(t(messages.bot.welcome_back, { name }), {
      parse_mode: "MarkdownV2",
      reply_markup: buildMainMenuKeyboard(messages),
    })
  })
}
