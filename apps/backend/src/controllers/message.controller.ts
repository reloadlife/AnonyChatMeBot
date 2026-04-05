import type { Bindings } from "../index"
import { MessageRepository } from "../repositories/message.repository"
import { UserRepository } from "../repositories/user.repository"
import { serializeMessage } from "../serializers/message.serializer"

export class MessageController {
  private readonly messageRepo: MessageRepository
  private readonly userRepo: UserRepository

  constructor(private readonly env: Bindings) {
    this.messageRepo = new MessageRepository(env.DB)
    this.userRepo = new UserRepository(env.DB)
  }

  async sendAnonymousMessage(senderTelegramId: number, recipientUserId: number, content: string) {
    const recipient = await this.userRepo.findById(recipientUserId)
    if (!recipient) throw new Error("Recipient not found")

    const message = await this.messageRepo.create({
      sender_telegram_id: senderTelegramId,
      recipient_user_id: recipientUserId,
      content,
      delivered: 0,
    })

    // Enqueue delivery job
    await this.env.MESSAGE_QUEUE.send({ messageId: message.id })

    return serializeMessage(message)
  }

  async getMessagesForUser(recipientUserId: number) {
    const messages = await this.messageRepo.findByRecipient(recipientUserId)
    return messages.map(serializeMessage)
  }
}
