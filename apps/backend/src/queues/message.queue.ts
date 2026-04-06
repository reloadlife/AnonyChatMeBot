import { getMessages, type Locale } from "@anonychatmebot/shared"
import { Api, InlineKeyboard } from "grammy"
import type { MediaType } from "~/controllers/message.controller"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { BlockRepository } from "~/repositories/block.repository"
import { MessageRepository } from "~/repositories/message.repository"
import { UserRepository } from "~/repositories/user.repository"

export interface MessageJob {
  messageId: number
  recipientTelegramId: number
  recipientUserId: number
  recipientLocale: string
  senderTelegramId: number
  content: string
  mediaType?: MediaType
  fileId?: string
}

export async function handleMessageQueue(
  batch: MessageBatch<MessageJob>,
  env: Bindings,
): Promise<void> {
  const db = createDb(env.DB)
  const messageRepo = new MessageRepository(db)
  const userRepo = new UserRepository(db)
  const blockRepo = new BlockRepository(db)
  const api = new Api(env.BOT_TOKEN)

  for (const msg of batch.messages) {
    const { messageId, recipientTelegramId, recipientUserId, recipientLocale, senderTelegramId } =
      msg.body

    // Check if recipient is still accepting messages
    const recipient = await userRepo.findById(recipientUserId)
    if (!recipient?.receiving_messages) {
      await messageRepo.markDelivered(messageId)
      msg.ack()
      continue
    }

    // Check if sender is blocked
    const isBlocked = await blockRepo.isBlocked(recipientUserId, senderTelegramId)
    if (isBlocked) {
      await messageRepo.markDelivered(messageId)
      msg.ack()
      continue
    }

    const messages = getMessages((recipientLocale as Locale) ?? "en")
    const keyboard = new InlineKeyboard().text(messages.actions.view, `view_msg:${messageId}`)

    try {
      const sent = await api.sendMessage(recipientTelegramId, messages.bot.new_message_notification, {
        parse_mode: "MarkdownV2",
        reply_markup: keyboard,
        protect_content: true,
      })

      await messageRepo.setNotificationMessageId(messageId, sent.message_id)
      await messageRepo.markDelivered(messageId)

      msg.ack()
    } catch (err) {
      const status = (err as { error_code?: number }).error_code
      // Permanent failures (bot blocked / chat not found) — ack to avoid infinite retry
      if (status === 403 || status === 400) {
        await messageRepo.markDelivered(messageId)
        msg.ack()
      }
      // Transient failures (429, 5xx) — do NOT ack; queue retries automatically
    }
  }
}
