export type TooLongError = Error & { max: number }

import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import type { MessageJob } from "~/queues/message.queue"
import { MessageRepository } from "~/repositories/message.repository"
import { UserRepository } from "~/repositories/user.repository"
import { serializeMessage } from "~/serializers/message.serializer"

export class MessageController {
  private readonly messageRepo: MessageRepository
  private readonly userRepo: UserRepository

  constructor(private readonly env: Bindings) {
    const db = createDb(env.DB)
    this.messageRepo = new MessageRepository(db)
    this.userRepo = new UserRepository(db)
  }

  static readonly MAX_MESSAGE_LENGTH = 4000

  async sendAnonymousMessage(
    senderTelegramId: number,
    recipientUserId: number,
    recipientTelegramId: number,
    recipientLocale: string,
    content: string,
  ) {
    if (content.length > MessageController.MAX_MESSAGE_LENGTH) {
      const err = new Error("MESSAGE_TOO_LONG")
      ;(err as Error & { max: number }).max = MessageController.MAX_MESSAGE_LENGTH
      throw err
    }

    const recipient = await this.userRepo.findById(recipientUserId)
    if (!recipient) throw new Error("Recipient not found")

    const message = await this.messageRepo.create({
      sender_telegram_id: senderTelegramId,
      recipient_user_id: recipientUserId,
      content,
    })

    const job: MessageJob = {
      messageId: message.id,
      recipientTelegramId,
      recipientUserId,
      recipientLocale,
      senderTelegramId,
      content,
    }
    await this.env.MESSAGE_QUEUE.send(job)

    return serializeMessage(message)
  }

  async getMessagesForUser(recipientUserId: number) {
    const messages = await this.messageRepo.findByRecipient(recipientUserId)
    return messages.map(serializeMessage)
  }
}
