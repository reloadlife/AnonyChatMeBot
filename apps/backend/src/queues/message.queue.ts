import { getMessages, type Locale } from "@anonychatmebot/shared"
import { Api } from "grammy"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { MessageRepository } from "~/repositories/message.repository"

export interface MessageJob {
  messageId: number
  recipientTelegramId: number
  recipientLocale: string
  content: string
}

export async function handleMessageQueue(
  batch: MessageBatch<MessageJob>,
  env: Bindings,
): Promise<void> {
  const messageRepo = new MessageRepository(createDb(env.DB))
  const api = new Api(env.BOT_TOKEN)

  for (const msg of batch.messages) {
    const { messageId, recipientTelegramId, recipientLocale, content } = msg.body
    await messageRepo.markDelivered(messageId)

    const messages = getMessages((recipientLocale as Locale) ?? "en")
    await api.sendMessage(recipientTelegramId, `${messages.bot.message_received}\n\n${content}`)

    msg.ack()
  }
}
