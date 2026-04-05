import { getMessages, type Locale, resolveLocale, t } from "@anonychatmebot/shared"
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

    if (state.name === "onboarding_locale") {
      const messages = getMessages(resolveLocale(from.language_code))
      await ctx.reply(messages.onboarding.select_locale, {
        reply_markup: buildLocaleSelector(),
      })
      return
    }

    if (state.name === "onboarding_name") {
      const messages = getMessages(user.locale as Locale)
      await ctx.reply(messages.onboarding.enter_name, {
        reply_markup: buildNameRequestKeyboard(from.first_name || from.username || "..."),
      })
      return
    }

    // state === "idle" or "sending_message" (re-anchoring the user to the menu)
    const messages = getMessages(user.locale as Locale)

    // Deep-link payload: /start <hash> — decode hashid and route to anonymous message flow
    const payload = ctx.match?.trim()
    if (payload) {
      const recipientId = decodeId(env.LINK_SALT, payload)
      if (recipientId !== null && recipientId !== user.id) {
        const recipient = await userRepo.findById(recipientId)
        if (!recipient) {
          await ctx.reply(messages.errors.user_not_found)
          return
        }
        await stateService.set(from.id, {
          name: "sending_message",
          recipientId: recipient.id,
          recipientName: recipient.display_name || recipient.username || "someone",
        })
        await ctx.reply(messages.bot.sending_to, {
          reply_markup: { force_reply: true, selective: true },
        })
        return
      }
    }

    // Default: reset any stale active state and show the main menu
    await stateService.reset(from.id)
    const name = user.display_name || from.first_name || "there"
    await ctx.reply(t(messages.bot.welcome_back, { name }), {
      reply_markup: buildMainMenuKeyboard(messages),
    })
  })
}
