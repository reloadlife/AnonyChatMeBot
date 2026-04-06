import { getMessages, type Locale } from "@anonychatmebot/shared"
import type { Bot, Context } from "grammy"
import { allTexts } from "~/bot/utils/locale"
import type { MediaType } from "~/controllers/message.controller"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { BlockRepository } from "~/repositories/block.repository"
import { UserRepository } from "~/repositories/user.repository"
import { StateService } from "~/services/state.service"
import { ALL_MEDIA_TYPES, toggleMediaType } from "~/utils/media-prefs"
import { buildLocaleSelector, buildNameRequestKeyboard } from "~/views/telegram/onboarding.view"
import {
  buildBlockedListKeyboard,
  buildMediaSettingsKeyboard,
  buildSettingsKeyboard,
} from "~/views/telegram/settings.view"

export function registerSettingsCommand(bot: Bot, env: Bindings) {
  const handle = async (ctx: Context) => {
    if (!ctx.from) return
    const db = createDb(env.DB)
    const user = await new UserRepository(db).findByTelegramId(ctx.from.id)
    const messages = getMessages((user?.locale as Locale) ?? "en")
    const blockedCount = user ? (await new BlockRepository(db).list(user.id)).length : 0

    await ctx.reply(messages.settings.title, {
      parse_mode: "MarkdownV2",
      reply_markup: buildSettingsKeyboard(messages, user?.receiving_messages ?? true, blockedCount),
    })
  }

  bot.hears(allTexts("settings"), handle)
  bot.command("settings", handle)

  // Change language
  bot.callbackQuery("settings:lang", async (ctx) => {
    await ctx.answerCallbackQuery()
    const user = await new UserRepository(createDb(env.DB)).findByTelegramId(ctx.from.id)
    const messages = getMessages((user?.locale as Locale) ?? "en")
    await ctx.reply(messages.onboarding.select_locale, {
      parse_mode: "MarkdownV2",
      reply_markup: buildLocaleSelector(),
    })
  })

  // Change display name
  bot.callbackQuery("settings:name", async (ctx) => {
    if (!ctx.from) return ctx.answerCallbackQuery()
    const db = createDb(env.DB)
    const user = await new UserRepository(db).findByTelegramId(ctx.from.id)
    const messages = getMessages((user?.locale as Locale) ?? "en")

    await new StateService(env.STATE_KV).set(ctx.from.id, { name: "onboarding_name" })
    await ctx.answerCallbackQuery()
    await ctx.reply(messages.onboarding.enter_name, {
      parse_mode: "MarkdownV2",
      reply_markup: buildNameRequestKeyboard(ctx.from.first_name || "..."),
    })
  })

  // Toggle receiving messages on/off
  bot.callbackQuery("settings:toggle_receiving", async (ctx) => {
    if (!ctx.from) return ctx.answerCallbackQuery()
    const db = createDb(env.DB)
    const userRepo = new UserRepository(db)
    const blockRepo = new BlockRepository(db)
    const user = await userRepo.findByTelegramId(ctx.from.id)
    if (!user) return ctx.answerCallbackQuery()

    const newValue = !user.receiving_messages
    await userRepo.setReceivingMessages(user.id, newValue)

    const messages = getMessages((user.locale as Locale) ?? "en")
    const status = newValue ? messages.settings.receiving_on : messages.settings.receiving_off
    const blockedCount = (await blockRepo.list(user.id)).length

    await ctx.answerCallbackQuery({ text: status, show_alert: true })
    await ctx.editMessageReplyMarkup({
      reply_markup: buildSettingsKeyboard(messages, newValue, blockedCount),
    })
  })

  // Open media type settings sub-menu
  bot.callbackQuery("settings:media", async (ctx) => {
    if (!ctx.from) return ctx.answerCallbackQuery()
    const db = createDb(env.DB)
    const user = await new UserRepository(db).findByTelegramId(ctx.from.id)
    if (!user) return ctx.answerCallbackQuery()

    const messages = getMessages((user.locale as Locale) ?? "en")
    await ctx.answerCallbackQuery()
    await ctx.editMessageText(messages.settings.media_settings_title, {
      parse_mode: "MarkdownV2",
      reply_markup: buildMediaSettingsKeyboard(messages, user.allowed_media_types),
    })
  })

  // Toggle a specific media type
  bot.callbackQuery(/^settings:media:(\w+)$/, async (ctx) => {
    if (!ctx.from) return ctx.answerCallbackQuery()
    const mediaType = ctx.match[1] as MediaType
    if (!ALL_MEDIA_TYPES.includes(mediaType)) return ctx.answerCallbackQuery()

    const db = createDb(env.DB)
    const userRepo = new UserRepository(db)
    const user = await userRepo.findByTelegramId(ctx.from.id)
    if (!user) return ctx.answerCallbackQuery()

    const newAllowed = toggleMediaType(user.allowed_media_types, mediaType)
    await userRepo.setAllowedMediaTypes(user.id, newAllowed)

    const messages = getMessages((user.locale as Locale) ?? "en")
    await ctx.answerCallbackQuery({ text: messages.settings.media_updated })
    await ctx.editMessageReplyMarkup({
      reply_markup: buildMediaSettingsKeyboard(messages, newAllowed),
    })
  })

  // Back from media settings to main settings
  bot.callbackQuery("settings:back", async (ctx) => {
    if (!ctx.from) return ctx.answerCallbackQuery()
    const db = createDb(env.DB)
    const userRepo = new UserRepository(db)
    const blockRepo = new BlockRepository(db)
    const user = await userRepo.findByTelegramId(ctx.from.id)
    if (!user) return ctx.answerCallbackQuery()

    const messages = getMessages((user.locale as Locale) ?? "en")
    const blockedCount = (await blockRepo.list(user.id)).length

    await ctx.answerCallbackQuery()
    await ctx.editMessageText(messages.settings.title, {
      parse_mode: "MarkdownV2",
      reply_markup: buildSettingsKeyboard(messages, user.receiving_messages, blockedCount),
    })
  })

  // Show blocked senders list
  bot.callbackQuery("settings:blocked", async (ctx) => {
    if (!ctx.from) return ctx.answerCallbackQuery()
    const db = createDb(env.DB)
    const user = await new UserRepository(db).findByTelegramId(ctx.from.id)
    if (!user) return ctx.answerCallbackQuery()

    const messages = getMessages((user.locale as Locale) ?? "en")
    const blocked = await new BlockRepository(db).list(user.id)

    await ctx.answerCallbackQuery()

    if (blocked.length === 0) {
      await ctx.reply(messages.settings.no_blocked, { parse_mode: "MarkdownV2" })
      return
    }

    const ids = blocked.map((b) => b.sender_telegram_id)
    await ctx.reply(messages.settings.no_blocked.replace("📭", "🚫"), {
      parse_mode: "MarkdownV2",
      reply_markup: buildBlockedListKeyboard(ids),
    })
  })

  // Unblock a sender
  bot.callbackQuery(/^unblock:(\d+)$/, async (ctx) => {
    if (!ctx.from) return ctx.answerCallbackQuery()
    const db = createDb(env.DB)
    const userRepo = new UserRepository(db)
    const blockRepo = new BlockRepository(db)
    const user = await userRepo.findByTelegramId(ctx.from.id)
    if (!user) return ctx.answerCallbackQuery()

    const senderTelegramId = Number(ctx.match[1])
    await blockRepo.unblock(user.id, senderTelegramId)

    const messages = getMessages((user.locale as Locale) ?? "en")
    await ctx.answerCallbackQuery({ text: messages.settings.unblocked, show_alert: true })

    // Refresh the list in-place
    const remaining = await blockRepo.list(user.id)
    if (remaining.length === 0) {
      await ctx.editMessageReplyMarkup({ reply_markup: undefined })
    } else {
      await ctx.editMessageReplyMarkup({
        reply_markup: buildBlockedListKeyboard(remaining.map((b) => b.sender_telegram_id)),
      })
    }
  })
}
