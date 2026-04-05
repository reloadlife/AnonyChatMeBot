import { escapeMarkdownV2, getMessages, type Locale } from "@anonychatmebot/shared"
import { Api, type Bot, InlineKeyboard } from "grammy"
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
    .text(messages.actions.report, `report:${messageId}`)
}

export function registerMessageActionsHandler(bot: Bot, env: Bindings) {
  // ── View message: callback from notification button ─────────────────────
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

    const msgs = getMessages((user.locale as Locale) ?? "en")
    await ctx.answerCallbackQuery()

    // Show content with action buttons — sent as reply to the notification message
    const sent = await ctx.reply(escapeMarkdownV2(message.content), {
      parse_mode: "MarkdownV2",
      reply_markup: buildMessageKeyboard(msgs, messageId),
      reply_parameters: { message_id: ctx.callbackQuery.message?.message_id ?? 0 },
    })

    // Mark read and notify sender
    if (!message.read_at) {
      await messageRepo.markRead(messageId)
      // Notify the original sender
      const api = new Api(env.BOT_TOKEN)
      const sender = await userRepo.findByTelegramId(message.sender_telegram_id)
      if (sender) {
        const senderMsgs = getMessages((sender.locale as Locale) ?? "en")
        await api.sendMessage(sender.telegram_id, senderMsgs.bot.message_read_receipt, {
          parse_mode: "MarkdownV2",
        })
      }
    }

    // Store the view message ID so replies can thread under it
    await messageRepo.setNotificationMessageId(messageId, sent.message_id)
  })

  // ── Reply button ────────────────────────────────────────────────────────
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
    await ctx.reply(msgs.bot.reply_prompt, {
      parse_mode: "MarkdownV2",
      reply_parameters: { message_id: viewMessageId },
    })
  })

  // ── Block button ────────────────────────────────────────────────────────
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

    // Remove the action buttons from the message
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  })

  // ── Report button ───────────────────────────────────────────────────────
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

    // Remove the action buttons after reporting
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  })
}
