import { getMessages, type Locale } from "@anonychatmebot/shared"
import { Api, InlineKeyboard } from "grammy"
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

    // Check if recipient is accepting messages
    const recipient = await userRepo.findById(recipientUserId)
    if (!recipient?.receiving_messages) {
      // Silently drop — sender already got "sent" confirmation
      await messageRepo.markDelivered(messageId)
      msg.ack()
      continue
    }

    // Check if sender is blocked by recipient
    const isBlocked = await blockRepo.isBlocked(recipientUserId, senderTelegramId)
    if (isBlocked) {
      await messageRepo.markDelivered(messageId)
      msg.ack()
      continue
    }

    const messages = getMessages((recipientLocale as Locale) ?? "en")

    // Send notification without content — recipient must tap to view (preserves privacy)
    const keyboard = new InlineKeyboard().text(messages.actions.view, `view_msg:${messageId}`)

    // Let Telegram API errors propagate — Cloudflare Queue will retry the message automatically
    const sent = await api.sendMessage(recipientTelegramId, messages.bot.new_message_notification, {
      parse_mode: "MarkdownV2",
      reply_markup: keyboard,
    })

    await messageRepo.markDelivered(messageId)
    await messageRepo.setNotificationMessageId(messageId, sent.message_id)

    msg.ack()
  }
}
