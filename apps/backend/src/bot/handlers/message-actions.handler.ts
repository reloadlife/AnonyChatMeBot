import { escapeMarkdownV2, getMessages, type Locale, t } from "@anonychatmebot/shared"
import { Api, type Bot, InlineKeyboard } from "grammy"
import type { MediaType } from "~/controllers/message.controller"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { BlockRepository } from "~/repositories/block.repository"
import { MessageRepository } from "~/repositories/message.repository"
import { ReportRepository } from "~/repositories/report.repository"
import { UserRepository } from "~/repositories/user.repository"
import { StateService } from "~/services/state.service"

function buildMessageKeyboard(messages: ReturnType<typeof getMessages>, messageId: number) {
  return new InlineKeyboard()
    .text(messages.actions.reply, `reply:${messageId}`)
    .text(messages.actions.block, `block:${messageId}`)
    .row()
    .text(messages.actions.report, `report:${messageId}`)
    .text(messages.actions.delete, `delete_msg:${messageId}`)
}

/** Send a media message by its stored type + file_id. */
async function sendMedia(
  api: Api,
  chatId: number,
  mediaType: MediaType,
  fileId: string,
  caption: string,
) {
  const opts = { protect_content: true, caption: caption || undefined } as const
  switch (mediaType) {
    case "photo":
      return api.sendPhoto(chatId, fileId, opts)
    case "video":
      return api.sendVideo(chatId, fileId, opts)
    case "voice":
      return api.sendVoice(chatId, fileId, opts)
    case "audio":
      return api.sendAudio(chatId, fileId, opts)
    case "document":
      return api.sendDocument(chatId, fileId, opts)
    case "sticker":
      return api.sendSticker(chatId, fileId, { protect_content: true })
    case "animation":
      return api.sendAnimation(chatId, fileId, opts)
  }
}

export function registerMessageActionsHandler(bot: Bot, env: Bindings) {
  // ── View message ─────────────────────────────────────────────────────────
  bot.callbackQuery(/^view_msg:(\d+)$/, async (ctx) => {
    const messageId = Number(ctx.match[1])
    const db = createDb(env.DB)
    const messageRepo = new MessageRepository(db)
    const userRepo = new UserRepository(db)

    const user = await userRepo.findByTelegramId(ctx.from.id)
    if (!user) return ctx.answerCallbackQuery()

    const message = await messageRepo.findById(messageId)
    if (!message || message.recipient_user_id !== user.id) {
      await ctx.answerCallbackQuery({ text: "Message not found.", show_alert: true })
      return
    }

    if (message.deleted_at) {
      await ctx.answerCallbackQuery({ text: "This message was deleted.", show_alert: true })
      return
    }

    const msgs = getMessages((user.locale as Locale) ?? "en")
    const notificationMsgId = ctx.callbackQuery.message?.message_id ?? 0
    await ctx.answerCallbackQuery()

    // Send message content — media or text, always protected
    if (message.media_type && message.file_id) {
      await sendMedia(
        ctx.api,
        ctx.from.id,
        message.media_type as MediaType,
        message.file_id,
        message.content,
      )
      // Send action keyboard separately for media messages
      await ctx.reply(msgs.actions.reply, {
        reply_markup: buildMessageKeyboard(msgs, messageId),
        reply_parameters: { message_id: notificationMsgId },
      })
    } else {
      await ctx.reply(escapeMarkdownV2(message.content), {
        parse_mode: "MarkdownV2",
        protect_content: true,
        reply_markup: buildMessageKeyboard(msgs, messageId),
        reply_parameters: { message_id: notificationMsgId },
      })
    }

    // Mark read and notify sender (only once)
    if (!message.read_at) {
      await messageRepo.markRead(messageId)
      const api = new Api(env.BOT_TOKEN)
      const sender = await userRepo.findByTelegramId(message.sender_telegram_id)
      if (sender) {
        const senderMsgs = getMessages((sender.locale as Locale) ?? "en")
        await api.sendMessage(sender.telegram_id, senderMsgs.bot.message_read_receipt, {
          parse_mode: "MarkdownV2",
        })
      }
    }
  })

  // ── Reply button ──────────────────────────────────────────────────────────
  bot.callbackQuery(/^reply:(\d+)$/, async (ctx) => {
    const messageId = Number(ctx.match[1])
    const db = createDb(env.DB)
    const messageRepo = new MessageRepository(db)
    const userRepo = new UserRepository(db)

    const user = await userRepo.findByTelegramId(ctx.from.id)
    if (!user) return ctx.answerCallbackQuery()

    const message = await messageRepo.findById(messageId)
    if (!message || message.recipient_user_id !== user.id) {
      return ctx.answerCallbackQuery({ text: "Message not found.", show_alert: true })
    }

    const msgs = getMessages((user.locale as Locale) ?? "en")
    const viewMessageId = ctx.callbackQuery.message?.message_id ?? 0

    await new StateService(env.STATE_KV).set(ctx.from.id, {
      name: "replying_to",
      messageId,
      senderTelegramId: message.sender_telegram_id,
      viewMessageId,
    })

    await ctx.answerCallbackQuery()

    // Include a truncated quote of the original message as context
    const preview = message.media_type
      ? `[${message.media_type}]`
      : message.content.length > 80
        ? `${message.content.slice(0, 80)}…`
        : message.content

    await ctx.reply(t(msgs.bot.reply_prompt, {}) + `\n\n> _${escapeMarkdownV2(preview)}_`, {
      parse_mode: "MarkdownV2",
      reply_parameters: { message_id: viewMessageId },
    })
  })

  // ── Block button ──────────────────────────────────────────────────────────
  bot.callbackQuery(/^block:(\d+)$/, async (ctx) => {
    const messageId = Number(ctx.match[1])
    const db = createDb(env.DB)
    const messageRepo = new MessageRepository(db)
    const userRepo = new UserRepository(db)
    const blockRepo = new BlockRepository(db)

    const user = await userRepo.findByTelegramId(ctx.from.id)
    if (!user) return ctx.answerCallbackQuery()

    const message = await messageRepo.findById(messageId)
    if (!message || message.recipient_user_id !== user.id) {
      return ctx.answerCallbackQuery({ text: "Message not found.", show_alert: true })
    }

    await blockRepo.block(user.id, message.sender_telegram_id)
    const msgs = getMessages((user.locale as Locale) ?? "en")
    await ctx.answerCallbackQuery({ text: msgs.bot.blocked, show_alert: true })
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  })

  // ── Report button ─────────────────────────────────────────────────────────
  bot.callbackQuery(/^report:(\d+)$/, async (ctx) => {
    const messageId = Number(ctx.match[1])
    const db = createDb(env.DB)
    const messageRepo = new MessageRepository(db)
    const userRepo = new UserRepository(db)
    const reportRepo = new ReportRepository(db)

    const user = await userRepo.findByTelegramId(ctx.from.id)
    if (!user) return ctx.answerCallbackQuery()

    const message = await messageRepo.findById(messageId)
    if (!message || message.recipient_user_id !== user.id) {
      return ctx.answerCallbackQuery({ text: "Message not found.", show_alert: true })
    }

    await reportRepo.report(messageId, user.id)
    const msgs = getMessages((user.locale as Locale) ?? "en")
    await ctx.answerCallbackQuery({ text: msgs.bot.reported, show_alert: true })
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  })

  // ── Delete button ─────────────────────────────────────────────────────────
  bot.callbackQuery(/^delete_msg:(\d+)$/, async (ctx) => {
    const messageId = Number(ctx.match[1])
    const db = createDb(env.DB)
    const messageRepo = new MessageRepository(db)
    const userRepo = new UserRepository(db)

    const user = await userRepo.findByTelegramId(ctx.from.id)
    if (!user) return ctx.answerCallbackQuery()

    const message = await messageRepo.findById(messageId)
    if (!message || message.recipient_user_id !== user.id) {
      return ctx.answerCallbackQuery({ text: "Message not found.", show_alert: true })
    }

    await messageRepo.softDelete(messageId)
    const msgs = getMessages((user.locale as Locale) ?? "en")
    await ctx.answerCallbackQuery({ text: msgs.bot.reported.replace("🚩", "🗑"), show_alert: false })
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  })
}
