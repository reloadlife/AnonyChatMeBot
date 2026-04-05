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

  async sendAnonymousMessage(
    senderTelegramId: number,
    recipientUserId: number,
    recipientTelegramId: number,
    recipientLocale: string,
    content: string,
  ) {
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
      recipientLocale,
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
